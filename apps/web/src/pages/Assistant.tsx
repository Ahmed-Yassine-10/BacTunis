import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Mic,
    MicOff,
    Bot,
    User,
    Plus,
    MessageCircle,
    Trash2,
    Loader2,
    Sparkles,
    Paperclip,
    FileText,
    X,
    Upload,
    File
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Assistant.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
    messages: Message[];
}

export default function Assistant() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // File upload state
    const [attachedFiles, setAttachedFiles] = useState<{ file: File; uploading: boolean; uploaded?: any }[]>([]);
    const [dragActive, setDragActive] = useState(false);

    // Speech recognition
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        loadConversations();
        initSpeechRecognition();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const initSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'ar-TN'; // Tunisian Arabic

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setInput(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
                toast.error('Erreur de reconnaissance vocale');
            };
        }
    };

    const loadConversations = async () => {
        try {
            const response = await api.get('/ai/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadConversation = async (id: string) => {
        try {
            const response = await api.get(`/ai/conversations/${id}`);
            setCurrentConversation(id);
            setMessages(response.data.messages);
            setSuggestions([]);
        } catch (error) {
            toast.error('Erreur lors du chargement de la conversation');
        }
    };

    const startNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
        setAttachedFiles([]);
        setSuggestions([
            'Aide-moi à réviser les maths',
            'Explique-moi la philosophie',
            'كيفاش نحل exercice فيزياء؟',
        ]);
        inputRef.current?.focus();
    };

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const allowedTypes = [
            'application/pdf', 'text/plain', 'image/png', 'image/jpeg',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];
        const maxSize = 10 * 1024 * 1024;

        for (const file of Array.from(files)) {
            if (!allowedTypes.includes(file.type)) {
                toast.error(`Format non supporté: ${file.name}`);
                continue;
            }
            if (file.size > maxSize) {
                toast.error(`Fichier trop volumineux: ${file.name} (max 10MB)`);
                continue;
            }

            const entry = { file, uploading: true, uploaded: undefined as any };
            setAttachedFiles((prev) => [...prev, entry]);

            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await api.post('/ai/documents/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setAttachedFiles((prev) =>
                    prev.map((f) =>
                        f.file === file ? { ...f, uploading: false, uploaded: response.data } : f
                    )
                );
                toast.success(`${file.name} uploadé! 📄`);
            } catch (error) {
                setAttachedFiles((prev) => prev.filter((f) => f.file !== file));
                toast.error(`Erreur d'upload: ${file.name}`);
            }
        }
    }, []);

    const removeAttachedFile = (file: File) => {
        setAttachedFiles((prev) => prev.filter((f) => f.file !== file));
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error('La reconnaissance vocale n\'est pas supportée');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSendMessage = async (content: string = input) => {
        if (!content.trim() || isLoading) return;

        // Collect uploaded document IDs
        const uploadedDocs = attachedFiles.filter((f) => f.uploaded);
        const documentIds = uploadedDocs.map((f) => f.uploaded.id).filter(Boolean);

        // Build display message for user (show file names)
        let displayContent = content.trim();
        if (uploadedDocs.length > 0) {
            const fileNames = uploadedDocs.map((f) => f.file.name).join(', ');
            displayContent = `📎 ${fileNames}\n\n${displayContent}`;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: displayContent,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setAttachedFiles([]);
        setIsLoading(true);
        setSuggestions([]);

        try {
            const response = await api.post('/ai/chat', {
                conversationId: currentConversation,
                content: content.trim(),
                ...(documentIds.length > 0 && { documentIds }),
            });

            const { conversationId, message, suggestions: newSuggestions } = response.data;

            if (!currentConversation) {
                setCurrentConversation(conversationId);
                loadConversations();
            }

            setMessages((prev) => [...prev, message]);
            setSuggestions(newSuggestions || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur de communication avec l\'IA');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await api.delete(`/ai/conversations/${id}`);
            setConversations((prev) => prev.filter((c) => c.id !== id));

            if (currentConversation === id) {
                startNewConversation();
            }

            toast.success('Conversation supprimée');
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatMessage = (content: string, role: string) => {
        if (role === 'user') {
            // Simple formatting for user messages
            return content
                .split('\n')
                .map((line, i) => <p key={i}>{line || <br />}</p>);
        }
        // Rich markdown + math rendering for AI messages
        return (
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
            >
                {content}
            </ReactMarkdown>
        );
    };

    return (
        <div className="assistant-page">
            {/* Sidebar with conversations */}
            <aside className="conversations-sidebar">
                <button className="btn btn-primary new-chat-btn" onClick={startNewConversation}>
                    <Plus size={20} />
                    Nouvelle conversation
                </button>

                <div className="conversations-list">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${currentConversation === conv.id ? 'active' : ''}`}
                            onClick={() => loadConversation(conv.id)}
                        >
                            <MessageCircle size={18} />
                            <span className="conversation-title">{conv.title}</span>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDeleteConversation(conv.id, e)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Chat area */}
            <main
                className={`chat-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {/* Drag overlay */}
                {dragActive && (
                    <div className="drag-overlay">
                        <Upload size={48} />
                        <p>Dépose tes fichiers ici</p>
                        <span>PDF, TXT, DOCX, PPTX, Images (max 10MB)</span>
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.png,.jpg,.jpeg,.docx,.pptx"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
                {/* Messages */}
                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="empty-chat">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', duration: 0.5 }}
                                className="empty-chat-icon"
                            >
                                <Sparkles size={48} />
                            </motion.div>
                            <h2>Ahla bik! 👋</h2>
                            <p>
                                Je suis ton assistant BacTunis. Pose-moi tes questions en français, arabe ou Derja!
                            </p>
                            <div className="starter-suggestions">
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        className="suggestion-btn"
                                        onClick={() => handleSendMessage(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="messages-list">
                            <AnimatePresence>
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        className={`message ${message.role}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="message-avatar">
                                            {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                        </div>
                                        <div className="message-content">
                                            {formatMessage(message.content, message.role)}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isLoading && (
                                <motion.div
                                    className="message assistant"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="message-avatar">
                                        <Bot size={20} />
                                    </div>
                                    <div className="message-content typing">
                                        <span className="dot" />
                                        <span className="dot" />
                                        <span className="dot" />
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && messages.length > 0 && (
                        <div className="suggestions-bar">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    className="suggestion-chip"
                                    onClick={() => handleSendMessage(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className="input-area">
                    {/* Attached files preview */}
                    {attachedFiles.length > 0 && (
                        <div className="attached-files">
                            {attachedFiles.map((f, i) => (
                                <div key={i} className="attached-file">
                                    {f.uploading ? (
                                        <Loader2 className="spin" size={14} />
                                    ) : (
                                        <FileText size={14} />
                                    )}
                                    <span className="attached-file-name">
                                        {f.file.name.length > 20
                                            ? f.file.name.substring(0, 17) + '...'
                                            : f.file.name}
                                    </span>
                                    <button
                                        className="attached-file-remove"
                                        onClick={() => removeAttachedFile(f.file)}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="input-container">
                        <button
                            className="btn btn-icon btn-ghost attach-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Joindre un document"
                        >
                            <Paperclip size={20} />
                        </button>
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            placeholder="Écris ton message ici... (Français, Arabe ou Derja)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="input-actions">
                            <button
                                className={`btn btn-icon btn-ghost voice-btn ${isListening ? 'listening' : ''}`}
                                onClick={toggleListening}
                                title="Parler"
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <button
                                className="btn btn-icon btn-primary send-btn"
                                onClick={() => handleSendMessage()}
                                disabled={!input.trim() || isLoading}
                            >
                                {isLoading ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
                            </button>
                        </div>
                    </div>
                    <p className="input-hint">
                        📎 Glisse des fichiers ou clique sur le trombone | 🇹🇳 Français, Arabe, Derja
                    </p>
                </div>
            </main>
        </div>
    );
}
