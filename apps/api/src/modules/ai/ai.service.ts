import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import Groq from 'groq-sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

type AIProvider = 'gemini' | 'groq';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private fileManager: GoogleAIFileManager;
    private groq: Groq | null = null;

    private readonly GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    private readonly GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];
    private readonly MAX_RETRIES = 2;

    // Cache: docId → { fileUri, mimeType } to avoid re-uploading
    private fileUploadCache = new Map<string, { fileUri: string; mimeType: string }>();
    // Track which provider is currently rate-limited and when to retry
    private providerCooldown = new Map<AIProvider, number>();

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const geminiKey = this.configService.get('GEMINI_API_KEY') || '';
        this.genAI = new GoogleGenerativeAI(geminiKey);
        this.fileManager = new GoogleAIFileManager(geminiKey);

        const groqKey = this.configService.get('GROQ_API_KEY');
        if (groqKey) {
            this.groq = new Groq({ apiKey: groqKey });
            console.log('🟢 Groq provider initialized (fallback ready)');
        } else {
            console.log('🟡 No GROQ_API_KEY set — only Gemini will be used');
        }
    }

    /**
     * Check if a provider is currently on cooldown
     */
    private isProviderAvailable(provider: AIProvider): boolean {
        const cooldownUntil = this.providerCooldown.get(provider);
        if (!cooldownUntil) return true;
        if (Date.now() >= cooldownUntil) {
            this.providerCooldown.delete(provider);
            return true;
        }
        return false;
    }

    /**
     * Mark a provider as rate-limited for a given duration
     */
    private setProviderCooldown(provider: AIProvider, seconds: number) {
        this.providerCooldown.set(provider, Date.now() + seconds * 1000);
        console.warn(`🔴 ${provider} cooldown set for ${seconds}s`);
    }

    /**
     * Upload a document to Google AI File Manager for Gemini multimodal.
     */
    private async uploadToGeminiFileManager(
        docId: string,
        studentId: string,
        documentsService: any,
    ): Promise<{ fileData: { fileUri: string; mimeType: string } } | null> {
        const cached = this.fileUploadCache.get(docId);
        if (cached) {
            return { fileData: cached };
        }
        try {
            const docData = await documentsService.getDocumentRawData(docId, studentId);
            if (!docData) return null;
            const { filePath, mimeType, name } = docData;
            const uploadResult = await this.fileManager.uploadFile(filePath, {
                mimeType,
                displayName: name,
            });
            const fileUri = uploadResult.file.uri;
            this.fileUploadCache.set(docId, { fileUri, mimeType });
            console.log(`✅ File uploaded to Google AI: ${name} → ${fileUri}`);
            return { fileData: { fileUri, mimeType } };
        } catch (error: any) {
            console.error(`❌ File Manager upload failed:`, error?.message?.substring(0, 200));
            return null;
        }
    }

    /**
     * Parse retryDelay from Gemini 429 error (e.g. "retryDelay": "16s")
     */
    private parseRetryDelay(error: any): number {
        try {
            const msg = error?.message || error?.errorDetails?.[0]?.reason || '';
            const match = msg.match(/retry\s*(?:in|Delay["\s:]*)\s*(\d+)/i);
            if (match) return parseInt(match[1], 10);
            // Check error details
            if (error?.errorDetails) {
                for (const d of error.errorDetails) {
                    if (d?.retryDelay) {
                        const secMatch = d.retryDelay.match(/(\d+)/);
                        if (secMatch) return parseInt(secMatch[1], 10);
                    }
                }
            }
        } catch { }
        return 60; // Default 1 minute cooldown
    }

    /**
     * Call Groq API (Llama 3.3 70B) — used as fallback when Gemini is rate-limited
     */
    private async callGroq(
        systemPrompt: string,
        messages: Array<{ role: string; content: string }>,
        maxTokens: number = 2000,
        temperature: number = 0.7,
    ): Promise<string> {
        if (!this.groq) throw new Error('Groq not configured');

        for (const modelName of this.GROQ_MODELS) {
            for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    const groqMessages: any[] = [
                        { role: 'system', content: systemPrompt },
                        ...messages.map(m => ({
                            role: m.role === 'model' ? 'assistant' : m.role,
                            content: m.content,
                        })),
                    ];

                    const completion = await this.groq.chat.completions.create({
                        model: modelName,
                        messages: groqMessages,
                        max_tokens: maxTokens,
                        temperature,
                    });

                    const text = completion.choices?.[0]?.message?.content;
                    if (text) {
                        console.log(`✅ Groq ${modelName} responded (${text.length} chars)`);
                        return text;
                    }
                } catch (error: any) {
                    const status = error?.status || error?.statusCode;
                    if (status === 429) {
                        const wait = Math.min(attempt * 5, 15);
                        console.warn(`⚠️ Groq ${modelName} rate limited (attempt ${attempt}). Waiting ${wait}s...`);
                        await this.sleep(wait * 1000);
                        if (attempt === this.MAX_RETRIES) break;
                    } else {
                        console.error(`❌ Groq ${modelName} error:`, error?.message?.substring(0, 150));
                        break; // try next model
                    }
                }
            }
        }
        throw new Error('All Groq models exhausted');
    }

    /**
     * Multi-provider AI call: tries Gemini first, falls back to Groq on rate limit.
     * For simple text generation (summaries, exercises, etc.)
     */
    private async callAIWithFallback(
        buildGeminiRequest: (modelName: string) => Promise<string>,
        groqFallback?: { systemPrompt: string; messages: Array<{ role: string; content: string }>; maxTokens?: number; temperature?: number },
    ): Promise<string> {
        // Try Gemini first (if not on cooldown)
        if (this.isProviderAvailable('gemini')) {
            try {
                return await this.callGeminiWithRetry(buildGeminiRequest);
            } catch (error: any) {
                const isQuota = error?.status === 429 || error?.message?.includes('exhausted') || error?.message?.includes('quota');
                if (isQuota) {
                    const cooldownSec = this.parseRetryDelay(error);
                    this.setProviderCooldown('gemini', Math.max(cooldownSec, 60));
                    console.log(`🔄 Gemini rate-limited, switching to Groq...`);
                } else {
                    console.error('Gemini non-quota error:', error?.message?.substring(0, 200));
                }
            }
        } else {
            console.log('⏳ Gemini still on cooldown, using Groq directly');
        }

        // Fallback to Groq
        if (this.groq && groqFallback) {
            try {
                return await this.callGroq(
                    groqFallback.systemPrompt,
                    groqFallback.messages,
                    groqFallback.maxTokens || 2000,
                    groqFallback.temperature || 0.7,
                );
            } catch (error: any) {
                console.error('Groq fallback also failed:', error?.message?.substring(0, 200));
            }
        }

        throw new Error('All AI providers exhausted');
    }

    /**
     * Call Gemini with automatic retry + model fallback on rate limit errors
     */
    private async callGeminiWithRetry(
        buildRequest: (modelName: string) => Promise<string>,
    ): Promise<string> {
        for (const modelName of this.GEMINI_MODELS) {
            for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    return await buildRequest(modelName);
                } catch (error: any) {
                    const status = error?.status || error?.response?.status;
                    const isRateLimit = status === 429;
                    const isServerError = status >= 500;

                    if (isRateLimit || isServerError) {
                        const waitSec = Math.min(attempt * 8, 20);
                        console.warn(
                            `⚠️ Gemini ${modelName} - ${isRateLimit ? 'Rate limited' : 'Server error'} (attempt ${attempt}/${this.MAX_RETRIES}). Waiting ${waitSec}s...`,
                        );
                        await this.sleep(waitSec * 1000);
                        if (attempt === this.MAX_RETRIES) break;
                    } else {
                        throw error;
                    }
                }
            }
            console.warn(`⚠️ All retries exhausted for Gemini ${modelName}, trying next...`);
        }
        throw new Error('All Gemini models and retries exhausted');
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private getSystemPrompt(student: any, stressLevel: number) {
        const stressContext = stressLevel > 7
            ? 'L\'élève semble très stressé. Sois particulièrement encourageant et propose des techniques de relaxation si approprié.'
            : stressLevel > 5
                ? 'L\'élève montre des signes de stress modéré. Sois positif et rassurant.'
                : 'L\'élève semble détendu. Tu peux maintenir un ton normal.';

        return `Tu es "BacTunis", un assistant éducatif bienveillant spécialisé pour les élèves tunisiens préparant le baccalauréat.

INFORMATIONS SUR L'ÉLÈVE:
- Prénom: ${student.firstName}
- Niveau: Baccalauréat
- Filière: ${student.branch}
- Établissement: ${student.school || 'Non spécifié'}

CAPACITÉS LINGUISTIQUES:
- Tu comprends et réponds en français, arabe standard, et dialecte tunisien (Derja)
- Si l'élève écrit en Derja, réponds de manière naturelle en mélangeant français et Derja
- Exemples de Derja courante:
  * "Kifech" = Comment
  * "Bech" = Pour/Afin de
  * "Chnoua" = Quoi
  * "Ey" = Oui
  * "Le" = Non
  * "Barcha" = Beaucoup
  * "Mouch" = Pas/N'est pas
  * "Yezzi" = Assez/Ça suffit
  * "Famma" = Il y a
  * "Lazem" = Il faut
  * "Bravo 3lik" = Bravo à toi

CONTEXTE ÉMOTIONNEL:
${stressContext}

TES MISSIONS:
1. AIDE PÉDAGOGIQUE:
   - Expliquer les concepts du programme officiel du bac tunisien
   - Créer des résumés structurés
   - Proposer des exercices adaptés au niveau
   - Corriger et expliquer les erreurs pas à pas

2. SOUTIEN MOTIVATIONNEL:
   - Encourager l'élève avec empathie
   - Célébrer les petites victoires
   - Proposer des techniques de gestion du stress
   - Rappeler que le bac n'est qu'une étape

3. PLANIFICATION:
   - Aider à organiser les révisions
   - Suggérer des méthodes de travail efficaces
   - Recommander des pauses appropriées

RÈGLES IMPORTANTES:
- Ne jamais donner de conseils médicaux ou psychologiques professionnels
- Rester positif et encourageant
- Adapter le niveau d'explication à l'élève
- Utiliser des exemples contextualisés à la Tunisie quand possible
- Si l'élève semble en détresse, suggérer de parler à un adulte de confiance

FORMATAGE:
- Utilise des emojis avec modération pour rendre le texte vivant
- Structure tes réponses avec des titres et listes quand approprié
- Utilise le format Markdown pour structurer tes réponses (titres ##, listes -, gras **, italique *)
- Pour les formules mathématiques, utilise OBLIGATOIREMENT la notation LaTeX:
  * Formules en ligne: $formule$ (exemple: $f(x) = x^2 + 3x$)
  * Formules en bloc (centrées): $$formule$$ (exemple: $$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$)
  * Utilise toujours LaTeX pour: fractions (\\frac{}{}), racines (\\sqrt{}), puissances (x^n), indices (x_n), intégrales (\\int), sommes (\\sum), limites (\\lim), dérivées (f'(x) ou \\frac{df}{dx}), vecteurs (\\vec{v}), matrices (\\begin{pmatrix}...\\end{pmatrix})
  * Exemples: $\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$, $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$`;
    }

    async sendMessage(studentId: string, dto: SendMessageDto, documentsService?: any) {
        // Get or create conversation
        let conversation;
        if (dto.conversationId) {
            conversation = await this.prisma.conversation.findFirst({
                where: { id: dto.conversationId, studentId },
                include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
            });

            if (!conversation) {
                throw new NotFoundException('Conversation non trouvée');
            }
        } else {
            conversation = await this.prisma.conversation.create({
                data: {
                    studentId,
                    title: dto.content.substring(0, 50) + (dto.content.length > 50 ? '...' : ''),
                },
                include: { messages: true },
            });
        }

        // Get student info for context
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: { profile: true },
        });

        // === DOCUMENT HANDLING: Hybrid approach ===
        // 1. Try text extraction (fast, no API call) for text-based PDFs
        // 2. If text is empty/short (scanned PDF, images), use Google AI File Manager
        let documentContext = '';
        const geminiFileParts: Array<{ fileData: { fileUri: string; mimeType: string } }> = [];
        const fileNames: string[] = [];
        
        if (dto.documentIds && dto.documentIds.length > 0 && documentsService) {
            for (const docId of dto.documentIds) {
                try {
                    // Step 1: Try text extraction first (fast, free)
                    const { content: textContent, name: docName } = await documentsService.getDocumentContent(docId, studentId);
                    fileNames.push(docName);
                    
                    if (textContent && textContent.trim().length > 50) {
                        // Text extraction succeeded → inject in prompt
                        const truncated = textContent.length > 5000
                            ? textContent.substring(0, 5000) + '\n... [document tronqué]'
                            : textContent;
                        documentContext += `\n\n📄 Document "${docName}":\n${truncated}`;
                        console.log(`📎 Text extracted: ${docName} (${textContent.length} chars)`);
                    } else {
                        // Step 2: Text empty → use Google AI File Manager
                        console.log(`📎 No text in ${docName}, uploading via File Manager...`);
                        const filePart = await this.uploadToGeminiFileManager(docId, studentId, documentsService);
                        if (filePart) {
                            geminiFileParts.push(filePart);
                            console.log(`📎 File uploaded: ${docName} → ${filePart.fileData.fileUri}`);
                        } else {
                            documentContext += `\n\n📄 Document "${docName}": [fichier non lisible]`;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to process doc for chat:', docId, e);
                }
            }
        }

        // Build the message
        const hasDocContext = documentContext.length > 0;
        const hasFileParts = geminiFileParts.length > 0;
        const hasFiles = hasDocContext || hasFileParts;
        
        let messageText = dto.content;
        if (hasDocContext) {
            messageText += '\n\n--- DOCUMENTS JOINTS ---' + documentContext + '\n--- FIN DES DOCUMENTS ---';
        }
        if (hasFiles) {
            messageText += '\n\nAnalyse le(s) document(s) joint(s) et réponds à ma question en te basant sur leur contenu.';
        }

        // Save user message (save the original content, not the enriched one)
        const userMessage = await this.prisma.chatMessage.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                content: dto.content,
            },
        });

        // Build messages for Gemini
        const systemPrompt = this.getSystemPrompt(
            student,
            student?.profile?.stressLevel || 5,
        );

        const history = conversation.messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        try {
            // Build Groq fallback messages (text-only, no file upload support)
            const groqMessages: Array<{ role: string; content: string }> = [
                ...conversation.messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: messageText },
            ];

            // Call AI with multi-provider fallback (Gemini → Groq)
            const assistantContent = await this.callAIWithFallback(
                // Gemini request builder
                async (modelName) => {
                    const model = this.genAI.getGenerativeModel({ model: modelName });

                    if (hasFileParts) {
                        // Use generateContent for requests with uploaded files (Gemini only)
                        const contextMessages = history.map(m =>
                            `${m.role === 'model' ? 'Assistant' : 'Élève'}: ${m.parts[0].text}`
                        ).join('\n');

                        const fullPrompt = `${systemPrompt}\n\n${contextMessages ? 'Historique:\n' + contextMessages + '\n\n' : ''}Élève: ${messageText}`;

                        const result = await model.generateContent([
                            ...geminiFileParts,
                            { text: fullPrompt },
                        ]);
                        return result.response.text() ||
                            'Désolé, je n\'ai pas pu générer une réponse. Peux-tu reformuler ta question?';
                    } else {
                        // Use chat API for text-only or text-extracted documents
                        const chat = model.startChat({
                            history: [
                                { role: 'user', parts: [{ text: 'System instructions: ' + systemPrompt }] },
                                { role: 'model', parts: [{ text: 'Compris! Je suis BacTunis, ton assistant éducatif. Comment puis-je t\'aider?' }] },
                                ...history,
                            ],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 2000,
                            },
                        });

                        const result = await chat.sendMessage(messageText);
                        return result.response.text() ||
                            'Désolé, je n\'ai pas pu générer une réponse. Peux-tu reformuler ta question?';
                    }
                },
                // Groq fallback config
                {
                    systemPrompt,
                    messages: groqMessages,
                    maxTokens: 2000,
                    temperature: 0.7,
                },
            );

            // Save assistant message
            const assistantMessage = await this.prisma.chatMessage.create({
                data: {
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: assistantContent,
                },
            });

            // Generate quick reply suggestions
            const suggestions = this.generateSuggestions(dto.content, student?.branch);

            return {
                conversationId: conversation.id,
                message: assistantMessage,
                suggestions,
            };
        } catch (error: any) {
            console.error('AI Error:', error?.message || error);

            // Build a helpful fallback message
            const isQuota = error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('exhausted');
            
            let fallbackContent: string;
            if (isQuota) {
                // Smart fallback: if we have document content, provide basic info
                if (documentContext.length > 0) {
                    const docSnippet = documentContext.substring(0, 500).replace(/\n/g, ' ').trim();
                    fallbackContent = `⏳ L'assistant IA est temporairement en pause (quota dépassé). Voici un aperçu du contenu de ton document:\n\n> ${docSnippet}...\n\n💡 **Réessaie dans 1-2 minutes** et je pourrai analyser le document en détail pour toi, inchallah!`;
                } else {
                    fallbackContent = '⏳ Le quota de l\'assistant IA est temporairement épuisé. Réessaie dans quelques minutes, inchallah ça marchera! En attendant, tu peux consulter tes matières et chapitres.\n\n💡 **Astuce**: Les quotas se réinitialisent toutes les minutes. Attends 1-2 minutes puis réessaie!';
                }
            } else {
                fallbackContent = 'Désolé, j\'ai un petit souci technique 😅. Peux-tu réessayer dans quelques instants?';
            }

            const fallbackMessage = await this.prisma.chatMessage.create({
                data: {
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: fallbackContent,
                },
            });

            return {
                conversationId: conversation.id,
                message: fallbackMessage,
                suggestions: ['Réessayer', 'Poser une autre question'],
            };
        }
    }

    private generateSuggestions(userMessage: string, branch?: string): string[] {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('exercice') || lowerMessage.includes('problème')) {
            return [
                'Explique-moi la méthode',
                'Donne-moi un exercice similaire',
                'Je ne comprends pas cette étape',
            ];
        }

        if (lowerMessage.includes('stress') || lowerMessage.includes('peur') || lowerMessage.includes('anxieux')) {
            return [
                'Techniques de relaxation',
                'Comment mieux gérer mon temps?',
                'Raconte-moi une histoire motivante',
            ];
        }

        if (lowerMessage.includes('révision') || lowerMessage.includes('planning')) {
            return [
                'Crée-moi un planning de révision',
                'Quelles matières prioriser?',
                'Combien d\'heures par jour?',
            ];
        }

        // Default suggestions based on branch
        const branchSuggestions: Record<string, string[]> = {
            SCIENCES: ['Aide-moi en maths', 'Explique-moi un concept de physique', 'Quiz SVT'],
            LETTRES: ['Aide-moi en dissertation', 'Expliquer un texte', 'Vocabulaire arabe'],
            ECONOMIE: ['Aide en économie', 'Exercice de gestion', 'Concepts économiques'],
            default: ['Besoin d\'aide?', 'Faire un résumé', 'Pratiquer des exercices'],
        };

        return branchSuggestions[branch || 'default'] || branchSuggestions.default;
    }

    async getConversations(studentId: string) {
        return this.prisma.conversation.findMany({
            where: { studentId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }

    async getConversation(conversationId: string, studentId: string) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, studentId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation non trouvée');
        }

        return conversation;
    }

    async deleteConversation(conversationId: string, studentId: string) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, studentId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation non trouvée');
        }

        await this.prisma.conversation.delete({
            where: { id: conversationId },
        });
    }

    /**
     * Extract JSON from AI response text, handling markdown code blocks
     */
    private extractJSON(text: string, fallback: string = '{}'): any {
        const tryParse = (str: string): any => {
            try {
                return JSON.parse(str);
            } catch {
                // Fix LaTeX backslashes: in JSON strings, unescaped \ break parsing
                // Replace common LaTeX patterns that break JSON
                const fixed = str
                    .replace(/(?<!\\)\\(?![\\"/bfnrtu])/g, '\\\\')  // escape lone backslashes
                    .replace(/[\x00-\x1f]/g, (c) => {  // escape control chars
                        if (c === '\n') return '\\n';
                        if (c === '\r') return '\\r';
                        if (c === '\t') return '\\t';
                        return '';
                    });
                try {
                    return JSON.parse(fixed);
                } catch {
                    return null;
                }
            }
        };

        try {
            // First try: extract from ```json ... ``` code blocks
            const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) {
                const result = tryParse(codeBlockMatch[1].trim());
                if (result) return result;
            }
            // Second try: find the outermost JSON object via brace matching
            let depth = 0;
            let start = -1;
            let inStr = false;
            let escaped = false;
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (escaped) { escaped = false; continue; }
                if (ch === '\\') { escaped = true; continue; }
                if (ch === '"') { inStr = !inStr; continue; }
                if (inStr) continue;
                if (ch === '{') {
                    if (depth === 0) start = i;
                    depth++;
                } else if (ch === '}') {
                    depth--;
                    if (depth === 0 && start !== -1) {
                        const candidate = text.substring(start, i + 1);
                        const result = tryParse(candidate);
                        if (result) return result;
                    }
                }
            }
            // Third try: parse the whole text
            const result = tryParse(text.trim());
            if (result) return result;
            console.warn('JSON extraction failed for text:', text.substring(0, 300));
            return JSON.parse(fallback);
        } catch (e) {
            console.warn('JSON extraction critical fail:', e?.toString?.()?.substring(0, 100));
            return JSON.parse(fallback);
        }
    }

    // Generate summary for a document or chapter
    async generateSummary(content: string, studentBranch: string) {
        const prompt = `Tu es un assistant éducatif pour les élèves tunisiens du baccalauréat en filière ${studentBranch}.
    
Crée un résumé structuré et détaillé du contenu suivant. Le résumé doit:
- Être clair, pédagogique et détaillé
- Mettre en évidence les points clés avec des titres (##)
- Utiliser des bullet points (-)
- Inclure les formules importantes en LaTeX ($formule$ pour en ligne, $$formule$$ pour les blocs)
- Utiliser des exemples concrets du programme tunisien
- Être adapté au niveau baccalauréat

Contenu à résumer:
${content}`;

        try {
            const completion = await this.callAIWithFallback(
                async (modelName) => {
                    const result = await this.genAI
                        .getGenerativeModel({ model: modelName })
                        .generateContent({
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.5, maxOutputTokens: 2000 },
                        });
                    return result.response.text() || 'Impossible de générer le résumé.';
                },
                { systemPrompt: 'Tu es un assistant éducatif pour les élèves tunisiens du baccalauréat.', messages: [{ role: 'user', content: prompt }], maxTokens: 2000, temperature: 0.5 },
            );
            return completion;
        } catch (error: any) {
            console.error('generateSummary error:', error?.message);
            return 'Erreur lors de la génération du résumé. Veuillez réessayer.';
        }
    }

    // Generate exercises based on content
    async generateExercises(topic: string, difficulty: string, count: number = 3) {
        const diffLabel = difficulty === 'EASY' ? 'facile' : difficulty === 'HARD' ? 'difficile' : 'moyen';

        // Adapt exercise style based on difficulty for Tunisian Bac
        let diffInstructions = '';
        let effectiveCount = count;
        if (difficulty === 'EASY') {
            effectiveCount = Math.min(count, 3);
            diffInstructions = `NIVEAU FACILE — Génère ${effectiveCount} questions courtes et directes :
- Questions de compréhension de base (définitions, propriétés simples, vrai/faux)
- QCM simples avec 4 choix
- Applications directes de formules
- Chaque question doit être concise (1-2 lignes maximum)
- Le but est de vérifier la compréhension de base du cours`;
        } else if (difficulty === 'MEDIUM') {
            effectiveCount = Math.min(count, 5);
            diffInstructions = `NIVEAU MOYEN — Génère ${effectiveCount} exercices développés :
- Exercices d'application classiques du bac tunisien
- Chaque exercice comporte 2-3 sous-questions (a, b, c)
- Mélange de calcul, raisonnement et justification
- L'élève doit montrer sa démarche et justifier ses réponses
- Niveau typique des exercices du bac blanc`;
        } else {
            effectiveCount = Math.min(count, 3);
            diffInstructions = `NIVEAU DIFFICILE — Génère ${effectiveCount} problèmes complets type bac tunisien :
- Problèmes structurés avec 4-5 sous-questions liées (partie A, partie B)
- Chaque problème est un sujet complet qui demande réflexion approfondie
- Inclure des démonstrations, des "montrer que", des études de fonctions complètes
- Mélanger plusieurs notions du chapitre
- Niveau session principale / contrôle du bac tunisien
- Inclure des figures ou descriptions géométriques si pertinent`;
        }

        const prompt = `Tu es un professeur tunisien expert préparant des exercices pour le baccalauréat.

Sujet: "${topic}"

${diffInstructions}

IMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.
Utilise la notation LaTeX ($..$ en ligne, $$...$$ en bloc) pour TOUTES les formules mathématiques.

Le format JSON attendu est:
{
  "exercises": [
    {
      "question": "Énoncé complet de l'exercice avec formules LaTeX si nécessaire. Pour les sous-questions, utiliser:\\n**a)** première sous-question\\n**b)** deuxième sous-question",
      "type": "QCM",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "La bonne réponse détaillée avec toutes les étapes",
      "explanation": "Explication pédagogique pas à pas de la solution"
    }
  ]
}

Types possibles: "QCM" (avec options), "OPEN" (question ouverte/développée), "CALCULATION" (calcul), "PROBLEM" (problème structuré).
Adapte STRICTEMENT au programme officiel du baccalauréat tunisien.`;

        try {
            const text = await this.callAIWithFallback(
                async (modelName) => {
                    const model = this.genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 8000,
                            responseMimeType: 'application/json',
                        },
                    });
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    });
                    return result.response.text() || '{"exercises": []}';
                },
                { systemPrompt: 'Tu es un professeur tunisien. Réponds UNIQUEMENT en JSON valide.', messages: [{ role: 'user', content: prompt }], maxTokens: 8000, temperature: 0.7 },
            );

            console.log('Raw AI exercises response length:', text?.length, 'first 200 chars:', text?.substring(0, 200));
            const parsed = this.extractJSON(text, '{"exercises": []}');
            // Validate structure
            if (parsed.exercises && Array.isArray(parsed.exercises)) {
                console.log(`✅ Generated ${parsed.exercises.length} exercises (${difficulty})`);
                return parsed;
            }
            console.warn('⚠️ Parsed exercises but invalid structure:', Object.keys(parsed));
            return { exercises: [] };
        } catch (error: any) {
            console.error('generateExercises error:', error?.message);
            return { exercises: [] };
        }
    }

    // Generate mind map structure
    async generateMindMap(topic: string) {
        const prompt = `Crée une structure de carte mentale (mind map) pour le sujet: "${topic}"
    
La carte doit être adaptée au programme du baccalauréat tunisien.

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.

Format JSON attendu:
{
  "mindMap": {
    "id": "root",
    "label": "${topic}",
    "children": [
      {
        "id": "1",
        "label": "Concept 1",
        "children": [
          { "id": "1-1", "label": "Sous-concept 1.1", "children": [] }
        ]
      }
    ]
  }
}`;

        try {
            const text = await this.callAIWithFallback(
                async (modelName) => {
                    const result = await this.genAI
                        .getGenerativeModel({ model: modelName })
                        .generateContent({
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.6, maxOutputTokens: 1500 },
                        });
                    return result.response.text() || '{"mindMap": null}';
                },
                { systemPrompt: 'Tu es un assistant éducatif. Réponds UNIQUEMENT en JSON valide.', messages: [{ role: 'user', content: prompt }], maxTokens: 1500, temperature: 0.6 },
            );

            const parsed = this.extractJSON(text, '{"mindMap": null}');
            return parsed;
        } catch (error: any) {
            console.error('generateMindMap error:', error?.message);
            return { mindMap: null };
        }
    }

    /**
     * Generate detailed course support (lesson explanation) for a specific chapter.
     * Used by the timetable feature to provide AI course assistance.
     */
    async generateCourseSupport(
        subjectName: string,
        chapterTitle: string,
        branch: string,
    ): Promise<string> {
        const prompt = `Tu es un professeur expert du programme officiel du baccalauréat tunisien, filière ${branch}.

Génère un **support de cours complet et détaillé** pour :
📚 **Matière** : ${subjectName}
📖 **Chapitre** : ${chapterTitle}

Le support de cours doit contenir :

## 1. Introduction et objectifs du chapitre
- Contexte du chapitre dans le programme
- Objectifs d'apprentissage

## 2. Cours détaillé
- Explication claire de chaque concept clé
- Définitions importantes en gras
- Théorèmes et propriétés avec démonstrations simplifiées
- Formules essentielles en LaTeX ($formule$ en ligne, $$formule$$ en bloc)

## 3. Exemples résolus
- Au moins 2-3 exemples détaillés pas à pas
- Applications concrètes du cours

## 4. Points à retenir
- Résumé des formules et théorèmes essentiels
- Erreurs fréquentes à éviter
- Astuces pour le bac

## 5. Exercice d'application rapide
- 1-2 exercices simples avec solution

IMPORTANT:
- Adapte le contenu au niveau baccalauréat tunisien
- Utilise la notation LaTeX pour TOUTES les formules mathématiques
- Sois pédagogique et progressif dans les explications
- Donne des exemples concrets et variés`;

        try {
            return await this.callAIWithFallback(
                async (modelName) => {
                    const result = await this.genAI
                        .getGenerativeModel({ model: modelName })
                        .generateContent({
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.5, maxOutputTokens: 4000 },
                        });
                    return result.response.text() || 'Impossible de générer le support de cours.';
                },
                {
                    systemPrompt: `Tu es un professeur expert du baccalauréat tunisien, filière ${branch}. Utilise LaTeX pour les formules.`,
                    messages: [{ role: 'user', content: prompt }],
                    maxTokens: 4000,
                    temperature: 0.5,
                },
            );
        } catch (error: any) {
            console.error('generateCourseSupport error:', error?.message);
            return 'Erreur lors de la génération du support de cours. Veuillez réessayer.';
        }
    }
}
