import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import * as pdfParse from 'pdf-parse';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParser = (pdfParse as any).default || pdfParse;

@Injectable()
export class DocumentsService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
    ) { }

    async uploadDocument(
        studentId: string,
        name: string,
        type: string,
        url: string,
        size?: number,
    ) {
        return this.prisma.document.create({
            data: {
                studentId,
                name,
                type,
                url,
                size,
            },
        });
    }

    async getDocuments(studentId: string) {
        return this.prisma.document.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getDocument(id: string, studentId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id, studentId },
        });

        if (!document) {
            throw new NotFoundException('Document non trouvé');
        }

        return document;
    }

    async extractFileContent(filePath: string): Promise<string> {
        const fullPath = join(process.cwd(), filePath.replace(/^\//, ''));
        if (!existsSync(fullPath)) {
            return '';
        }
        const ext = extname(fullPath).toLowerCase();
        try {
            if (ext === '.txt') {
                return readFileSync(fullPath, 'utf-8');
            }
            if (ext === '.pdf') {
                const buffer = readFileSync(fullPath);
                const data = await pdfParser(buffer);
                return data.text || '';
            }
        } catch (error: any) {
            console.warn('extractFileContent error:', error?.message?.substring(0, 100));
        }
        return '';
    }

    async getDocumentContent(id: string, studentId: string): Promise<{ content: string; name: string }> {
        const document = await this.getDocument(id, studentId);
        const content = await this.extractFileContent(document.url);
        return { content, name: document.name };
    }

    /**
     * Get the actual file path on disk + metadata for Google AI File Manager upload.
     */
    async getDocumentRawData(id: string, studentId: string): Promise<{ filePath: string; mimeType: string; name: string } | null> {
        const document = await this.getDocument(id, studentId);
        const fullPath = join(process.cwd(), document.url.replace(/^\//, ''));
        if (!existsSync(fullPath)) {
            console.warn(`File not found: ${fullPath}`);
            return null;
        }
        return {
            filePath: fullPath,
            mimeType: document.type,
            name: document.name,
        };
    }

    async analyzeDocument(id: string, studentId: string) {
        const document = await this.getDocument(id, studentId);

        // Get student branch for context
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });

        // Try to extract real file content
        let content = await this.extractFileContent(document.url);
        if (!content) {
            content = `Document: ${document.name}\nType: ${document.type}\n\nCe document traite du sujet "${document.name.replace(/\.[^/.]+$/, '')}". Analyse ce sujet dans le contexte du programme du baccalauréat tunisien en filière ${student?.branch || 'SCIENCES'}. Donne un résumé complet, structuré et pédagogique.`;
        }

        try {
            // Generate analysis using AI
            const summary = await this.aiService.generateSummary(
                content,
                student?.branch || 'SCIENCES',
            );

            // Generate mind map
            const topicName = document.name.replace(/\.[^/.]+$/, '');
            let mindMapData = null;
            try {
                const result = await this.aiService.generateMindMap(topicName);
                mindMapData = result?.mindMap || null;
            } catch (e) {
                console.warn('MindMap generation failed, continuing without it:', e);
            }

            // Update document with analysis
            const updatedDocument = await this.prisma.document.update({
                where: { id },
                data: {
                    summary: summary || 'Résumé non disponible.',
                    keyPoints: JSON.stringify(this.extractKeyPoints(summary || '')),
                    mindMap: mindMapData ? JSON.stringify(mindMapData) : undefined,
                },
            });

            return updatedDocument;
        } catch (error: any) {
            console.error('analyzeDocument error:', error?.message);
            // Return document with error message rather than crashing
            const updatedDocument = await this.prisma.document.update({
                where: { id },
                data: {
                    summary: 'L\'analyse a échoué. Veuillez réessayer dans quelques instants.',
                    keyPoints: '[]',
                },
            });
            return updatedDocument;
        }
    }

    private extractKeyPoints(summary: string): string[] {
        // Simple extraction of bullet points from summary
        const lines = summary.split('\n');
        const keyPoints: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                keyPoints.push(trimmed.substring(1).trim());
            }
        }

        return keyPoints.slice(0, 10); // Limit to 10 key points
    }

    async deleteDocument(id: string, studentId: string) {
        await this.getDocument(id, studentId);
        await this.prisma.document.delete({ where: { id } });
    }

    async generateExercisesFromDocument(id: string, studentId: string, difficulty = 'MEDIUM') {
        const document = await this.getDocument(id, studentId);

        try {
            // Use document name + extracted content for better context
            let content = await this.extractFileContent(document.url);
            const topic = content
                ? `${document.name.replace(/\.[^/.]+$/, '')} - Contenu: ${content.substring(0, 500)}`
                : document.name.replace(/\.[^/.]+$/, '');

            return await this.aiService.generateExercises(topic, difficulty, 5);
        } catch (error: any) {
            console.error('generateExercisesFromDocument error:', error?.message);
            return { exercises: [] };
        }
    }
}
