import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Upload,
    Trash2,
    Brain,
    Lightbulb,
    Eye,
    X,
    File,
    Image,
    FileType,
    Loader2,
    FolderOpen,
    Sparkles,
    ChevronRight,
    Clock,
    HardDrive,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Documents.css';

interface Document {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number | null;
    summary: string | null;
    keyPoints: string;
    mindMap: string | null;
    createdAt: string;
    updatedAt: string;
}

interface Exercise {
    question: string;
    type: string;
    options?: string[];
    answer: string;
    explanation: string;
}

export default function Documents() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [generatingExercises, setGeneratingExercises] = useState(false);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [showExercises, setShowExercises] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const response = await api.get('/ai/documents');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        let successCount = 0;

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                await api.post('/ai/documents/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                successCount++;
            } catch (error: any) {
                const msg = error.response?.data?.message || `Erreur avec ${file.name}`;
                toast.error(msg);
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} document(s) uploadé(s) avec succès! 📄`);
            loadDocuments();
        }
        setUploading(false);
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
        handleUpload(e.dataTransfer.files);
    }, []);

    const handleAnalyze = async (doc: Document) => {
        setAnalyzing(true);
        try {
            const response = await api.post(`/ai/documents/${doc.id}/analyze`);
            setSelectedDoc(response.data);
            // Update in list too
            setDocuments((prev) =>
                prev.map((d) => (d.id === doc.id ? response.data : d))
            );
            toast.success('Document analysé avec succès! 🧠');
        } catch (error) {
            toast.error('Erreur lors de l\'analyse du document');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGenerateExercises = async (doc: Document) => {
        setGeneratingExercises(true);
        setShowExercises(true);
        try {
            const response = await api.post(`/ai/documents/${doc.id}/exercises?difficulty=MEDIUM`);
            setExercises(response.data.exercises || []);
            toast.success('Exercices générés! 📝');
        } catch (error) {
            toast.error('Erreur lors de la génération des exercices');
        } finally {
            setGeneratingExercises(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce document?')) return;
        try {
            await api.delete(`/ai/documents/${id}`);
            setDocuments((prev) => prev.filter((d) => d.id !== id));
            if (selectedDoc?.id === id) {
                setSelectedDoc(null);
                setExercises([]);
                setShowExercises(false);
            }
            toast.success('Document supprimé');
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const toggleAnswer = (index: number) => {
        setShowAnswers((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileText size={24} />;
        if (type.includes('image')) return <Image size={24} />;
        if (type.includes('text')) return <FileType size={24} />;
        return <File size={24} />;
    };

    const getFileTypeLabel = (type: string) => {
        if (type.includes('pdf')) return 'PDF';
        if (type.includes('image')) return 'Image';
        if (type.includes('text')) return 'Texte';
        if (type.includes('word') || type.includes('document')) return 'Word';
        if (type.includes('presentation')) return 'PowerPoint';
        return 'Fichier';
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-TN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const parseKeyPoints = (kp: string): string[] => {
        try {
            const parsed = JSON.parse(kp);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    return (
        <div className="documents-page">
            <div className="documents-header">
                <h1><FolderOpen size={28} /> Mes Documents</h1>
                <div className="documents-header-actions">
                    <span className="doc-count">{documents.length} document(s)</span>
                    <button
                        className="btn btn-primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="spin" size={20} /> : <Upload size={20} />}
                        Uploader
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.png,.jpg,.jpeg,.docx,.pptx"
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files)}
            />

            <div className="documents-layout">
                {/* Left: Upload zone + Document list */}
                <div className="documents-sidebar">
                    {/* Upload Drop Zone */}
                    <div
                        className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload size={32} className="upload-icon" />
                        <p className="upload-text">
                            {uploading ? 'Upload en cours...' : 'Glisse tes fichiers ici'}
                        </p>
                        <span className="upload-hint">PDF, TXT, DOCX, PPTX, Images (max 10MB)</span>
                    </div>

                    {/* Documents List */}
                    <div className="documents-list">
                        {loading ? (
                            <div className="loading-state">
                                <Loader2 className="spin" size={32} />
                                <p>Chargement...</p>
                            </div>
                        ) : documents.length > 0 ? (
                            <AnimatePresence>
                                {documents.map((doc, index) => (
                                    <motion.div
                                        key={doc.id}
                                        className={`document-card ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => {
                                            setSelectedDoc(doc);
                                            setShowExercises(false);
                                            setExercises([]);
                                        }}
                                    >
                                        <div className={`doc-icon ${doc.summary ? 'analyzed' : ''}`}>
                                            {getFileIcon(doc.type)}
                                        </div>
                                        <div className="doc-info">
                                            <h4 className="doc-name">{doc.name}</h4>
                                            <div className="doc-meta">
                                                <span className="doc-type-badge">
                                                    {getFileTypeLabel(doc.type)}
                                                </span>
                                                {doc.size && (
                                                    <span className="doc-size">
                                                        <HardDrive size={12} />
                                                        {formatFileSize(doc.size)}
                                                    </span>
                                                )}
                                                <span className="doc-date">
                                                    <Clock size={12} />
                                                    {formatDate(doc.createdAt)}
                                                </span>
                                            </div>
                                            {doc.summary && (
                                                <span className="doc-analyzed-badge">
                                                    <Sparkles size={12} /> Analysé
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            className="doc-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(doc.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="empty-state">
                                <FolderOpen size={48} />
                                <h3>Aucun document</h3>
                                <p>Upload tes cours, résumés ou exercices pour commencer!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Document details */}
                <div className="document-details">
                    {selectedDoc ? (
                        <motion.div
                            key={selectedDoc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="details-content"
                        >
                            {/* Document Header */}
                            <div className="detail-header">
                                <div className="detail-title-row">
                                    <div className={`detail-icon ${selectedDoc.summary ? 'analyzed' : ''}`}>
                                        {getFileIcon(selectedDoc.type)}
                                    </div>
                                    <div>
                                        <h2>{selectedDoc.name}</h2>
                                        <p className="detail-meta">
                                            {getFileTypeLabel(selectedDoc.type)} • {formatFileSize(selectedDoc.size)} • {formatDate(selectedDoc.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="detail-actions">
                                    <a
                                        href={`http://localhost:3001${selectedDoc.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline"
                                    >
                                        <Eye size={18} />
                                        Voir
                                    </a>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleAnalyze(selectedDoc)}
                                        disabled={analyzing}
                                    >
                                        {analyzing ? (
                                            <Loader2 className="spin" size={18} />
                                        ) : (
                                            <Brain size={18} />
                                        )}
                                        {analyzing ? 'Analyse...' : 'Analyser avec l\'IA'}
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleGenerateExercises(selectedDoc)}
                                        disabled={generatingExercises}
                                    >
                                        {generatingExercises ? (
                                            <Loader2 className="spin" size={18} />
                                        ) : (
                                            <Lightbulb size={18} />
                                        )}
                                        Exercices
                                    </button>
                                </div>
                            </div>

                            {/* Analysis Results */}
                            {selectedDoc.summary && (
                                <motion.div
                                    className="analysis-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <h3><Sparkles size={20} /> Résumé IA</h3>
                                    <div className="summary-content markdown-body">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath, remarkGfm]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {selectedDoc.summary}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            )}

                            {/* Key Points */}
                            {parseKeyPoints(selectedDoc.keyPoints).length > 0 && (
                                <motion.div
                                    className="keypoints-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <h3>🔑 Points clés</h3>
                                    <div className="keypoints-grid">
                                        {parseKeyPoints(selectedDoc.keyPoints).map((point, i) => (
                                            <div key={i} className="keypoint-item">
                                                <ChevronRight size={16} />
                                                <span>{point}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Exercises */}
                            {showExercises && (
                                <motion.div
                                    className="exercises-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="exercises-header">
                                        <h3><Lightbulb size={20} /> Exercices générés</h3>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setShowExercises(false)}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {generatingExercises ? (
                                        <div className="loading-state">
                                            <Loader2 className="spin" size={32} />
                                            <p>L'IA génère des exercices...</p>
                                        </div>
                                    ) : exercises.length > 0 ? (
                                        <div className="exercises-list">
                                            {exercises.map((exercise, i) => (
                                                <div key={i} className="exercise-card">
                                                    <div className="exercise-header">
                                                        <span className="exercise-number">
                                                            Exercice {i + 1}
                                                        </span>
                                                        <span className={`exercise-type ${exercise.type?.toLowerCase()}`}>
                                                            {exercise.type}
                                                        </span>
                                                    </div>
                                                    <div className="exercise-question markdown-body">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkMath, remarkGfm]}
                                                            rehypePlugins={[rehypeKatex]}
                                                        >
                                                            {exercise.question}
                                                        </ReactMarkdown>
                                                    </div>
                                                    {exercise.options && exercise.options.length > 0 && (
                                                        <div className="exercise-options">
                                                            {exercise.options.map((opt, j) => (
                                                                <div key={j} className="option-item">
                                                                    <span className="option-letter">
                                                                        {String.fromCharCode(65 + j)}
                                                                    </span>
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <button
                                                        className="btn btn-outline btn-sm show-answer-btn"
                                                        onClick={() => toggleAnswer(i)}
                                                    >
                                                        {showAnswers[i] ? 'Masquer' : 'Voir la réponse'}
                                                    </button>
                                                    {showAnswers[i] && (
                                                        <motion.div
                                                            className="exercise-answer"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                        >
                                                            <div className="answer-label">✅ Réponse:</div>
                                                            <div className="markdown-body">
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkMath, remarkGfm]}
                                                                    rehypePlugins={[rehypeKatex]}
                                                                >
                                                                    {exercise.answer}
                                                                </ReactMarkdown>
                                                            </div>
                                                            {exercise.explanation && (
                                                                <>
                                                                    <div className="answer-label">💡 Explication:</div>
                                                                    <div className="markdown-body">
                                                                        <ReactMarkdown
                                                                            remarkPlugins={[remarkMath, remarkGfm]}
                                                                            rehypePlugins={[rehypeKatex]}
                                                                        >
                                                                            {exercise.explanation}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <p>Aucun exercice généré</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Empty state when no analysis yet */}
                            {!selectedDoc.summary && !showExercises && (
                                <div className="no-analysis">
                                    <Brain size={64} />
                                    <h3>Document pas encore analysé</h3>
                                    <p>
                                        Clique sur "Analyser avec l'IA" pour obtenir un résumé,
                                        les points clés et une carte mentale de ce document.
                                    </p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleAnalyze(selectedDoc)}
                                        disabled={analyzing}
                                    >
                                        {analyzing ? (
                                            <Loader2 className="spin" size={18} />
                                        ) : (
                                            <Sparkles size={18} />
                                        )}
                                        Lancer l'analyse
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="no-selection">
                            <FileText size={64} />
                            <h3>Sélectionne un document</h3>
                            <p>
                                Choisis un document dans la liste ou upload-en un nouveau
                                pour commencer l'analyse IA.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
