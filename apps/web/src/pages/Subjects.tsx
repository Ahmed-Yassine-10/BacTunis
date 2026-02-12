import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ChevronRight, Layers, FileText, Loader2,
    Sparkles, GraduationCap, Brain, ArrowLeft, Clock, Target, Zap,
    CheckCircle, AlertTriangle, Flame
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import './Subjects.css';

interface Subject {
    id: string;
    name: string;
    nameAr: string;
    coefficient: number;
    chapters: Chapter[];
}

interface Chapter {
    id: string;
    title: string;
    titleAr: string;
    order: number;
    duration: number;
    difficulty: string;
}

interface Exercise {
    question: string;
    type: string;
    options?: string[];
    answer: string;
    explanation: string;
}

type StudyMode = 'course' | 'summary' | 'exercises';
type ExDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export default function Subjects() {
    const { user } = useAuthStore();
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);

    // Study mode state
    const [studyMode, setStudyMode] = useState<StudyMode | null>(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [courseContent, setCourseContent] = useState('');
    const [summaryContent, setSummaryContent] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [exerciseDifficulty, setExerciseDifficulty] = useState<ExDifficulty>('MEDIUM');
    const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});

    useEffect(() => {
        loadSubjects();
    }, []);

    // Auto-select subject/chapter from URL params
    useEffect(() => {
        if (subjects.length > 0 && subjectId) {
            const subj = subjects.find(s => s.id === subjectId);
            if (subj) {
                setSelectedSubject(subj);
                if (chapterId) {
                    const ch = subj.chapters?.find(c => c.id === chapterId);
                    if (ch) setSelectedChapter(ch);
                }
            }
        }
    }, [subjects, subjectId, chapterId]);

    const loadSubjects = async () => {
        try {
            const response = await api.get('/subjects/my-subjects');
            setSubjects(response.data);
        } catch (error) {
            console.error('Error loading subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSubject = (subject: Subject) => {
        setSelectedSubject(subject);
        setSelectedChapter(null);
        setStudyMode(null);
        setCourseContent('');
        setSummaryContent('');
        setExercises([]);
        navigate(`/subjects/${subject.id}`, { replace: true });
    };

    const handleSelectChapter = (chapter: Chapter) => {
        setSelectedChapter(chapter);
        setStudyMode(null);
        setCourseContent('');
        setSummaryContent('');
        setExercises([]);
        setShowAnswers({});
    };

    const handleBackToChapters = () => {
        setSelectedChapter(null);
        setStudyMode(null);
        setCourseContent('');
        setSummaryContent('');
        setExercises([]);
    };

    const handleGenerateCourse = async () => {
        if (!selectedSubject || !selectedChapter) return;
        setStudyMode('course');
        setContentLoading(true);
        setCourseContent('');

        try {
            const response = await api.post('/ai/generate/course-support', {
                subjectName: selectedSubject.name,
                chapterTitle: selectedChapter.title,
            });
            setCourseContent(response.data.content || 'Contenu non disponible');
            toast.success('Support de cours généré ! 📖');
        } catch {
            setCourseContent('Erreur lors de la génération. Veuillez réessayer.');
            toast.error('Erreur de génération');
        } finally {
            setContentLoading(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!selectedSubject || !selectedChapter) return;
        setStudyMode('summary');
        setContentLoading(true);
        setSummaryContent('');

        try {
            const content = `Matière: ${selectedSubject.name}\nChapitre: ${selectedChapter.title} (${selectedChapter.titleAr})\nDurée estimée: ${selectedChapter.duration} minutes\nNiveau de difficulté: ${selectedChapter.difficulty}\nFilière: ${user?.branch || 'SCIENCES'}\n\nFais un résumé complet et structuré de ce chapitre pour un élève du baccalauréat tunisien. Inclus les formules essentielles en LaTeX, les définitions clés, et les points importants à retenir pour le bac.`;
            const response = await api.post('/ai/generate/summary', { content });
            setSummaryContent(response.data.summary || 'Résumé non disponible.');
            toast.success('Résumé généré ! 📄');
        } catch {
            setSummaryContent('Erreur lors de la génération du résumé.');
            toast.error('Erreur lors de la génération');
        } finally {
            setContentLoading(false);
        }
    };

    const handleGenerateExercises = async (difficulty: ExDifficulty) => {
        if (!selectedSubject || !selectedChapter) return;
        setStudyMode('exercises');
        setExerciseDifficulty(difficulty);
        setContentLoading(true);
        setExercises([]);
        setShowAnswers({});

        const countMap: Record<ExDifficulty, number> = { EASY: 3, MEDIUM: 5, HARD: 3 };

        try {
            const topic = `${selectedSubject.name} — ${selectedChapter.title} (Programme Bac tunisien, filière ${user?.branch || 'SCIENCES'})`;
            const response = await api.post('/ai/generate/exercises', {
                topic,
                difficulty,
                count: countMap[difficulty],
            });
            const exerciseList = response.data?.exercises || [];
            setExercises(exerciseList);
            if (exerciseList.length > 0) {
                toast.success(`${exerciseList.length} exercices générés ! 📝`);
            } else {
                toast.error("Aucun exercice n'a pu être généré");
            }
        } catch {
            toast.error('Erreur lors de la génération des exercices');
        } finally {
            setContentLoading(false);
        }
    };

    const toggleAnswer = (index: number) => {
        setShowAnswers(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const getDifficultyColor = (d: string) => {
        switch (d) { case 'EASY': return '#10b981'; case 'MEDIUM': return '#f59e0b'; case 'HARD': return '#ef4444'; default: return '#64748b'; }
    };
    const getDifficultyLabel = (d: string) => {
        switch (d) { case 'EASY': return 'Facile'; case 'MEDIUM': return 'Moyen'; case 'HARD': return 'Difficile'; default: return d; }
    };
    const getDifficultyIcon = (d: string) => {
        switch (d) { case 'EASY': return <CheckCircle size={16} />; case 'MEDIUM': return <AlertTriangle size={16} />; case 'HARD': return <Flame size={16} />; default: return null; }
    };

    // ─── Render: Chapter Study View ────────────────────────────
    const renderChapterStudy = () => {
        if (!selectedSubject || !selectedChapter) return null;

        return (
            <motion.div
                key={selectedChapter.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="chapter-study-view"
            >
                {/* Chapter Header */}
                <div className="chapter-study-header">
                    <button className="back-btn" onClick={handleBackToChapters}>
                        <ArrowLeft size={18} />
                        Retour aux chapitres
                    </button>
                    <div className="chapter-study-title">
                        <div className="chapter-study-number">Ch. {selectedChapter.order}</div>
                        <div>
                            <h2>{selectedChapter.title}</h2>
                            <p className="chapter-study-ar">{selectedChapter.titleAr}</p>
                        </div>
                    </div>
                    <div className="chapter-study-meta">
                        <span className="meta-pill"><Clock size={14} /> {selectedChapter.duration} min</span>
                        <span className="meta-pill" style={{ color: getDifficultyColor(selectedChapter.difficulty) }}>
                            {getDifficultyIcon(selectedChapter.difficulty)} {getDifficultyLabel(selectedChapter.difficulty)}
                        </span>
                    </div>
                </div>

                {/* Learning Journey */}
                <div className="learning-journey">
                    {/* Phase 1: Learn */}
                    <div className="journey-section">
                        <div className="journey-section-header">
                            <div className="section-step-badge">Étape 1</div>
                            <h3>📖 Apprendre le cours</h3>
                            <p>Commence par comprendre les concepts fondamentaux du chapitre</p>
                        </div>
                        <div className="journey-cards two-cols">
                            <motion.div
                                className={`journey-card ${studyMode === 'course' ? 'active course-active' : ''}`}
                                whileHover={{ y: -3 }}
                                onClick={handleGenerateCourse}
                            >
                                <div className="jcard-icon course-icon"><GraduationCap size={24} /></div>
                                <div className="jcard-info">
                                    <h4>Support de cours</h4>
                                    <p>Cours complet avec explications détaillées, exemples résolus et formules essentielles</p>
                                </div>
                                <div className="jcard-tag"><Sparkles size={12} /> IA</div>
                            </motion.div>
                            <motion.div
                                className={`journey-card ${studyMode === 'summary' ? 'active summary-active' : ''}`}
                                whileHover={{ y: -3 }}
                                onClick={handleGenerateSummary}
                            >
                                <div className="jcard-icon summary-icon"><FileText size={24} /></div>
                                <div className="jcard-info">
                                    <h4>Résumé</h4>
                                    <p>Synthèse des points clés, définitions et formules à retenir pour le bac</p>
                                </div>
                                <div className="jcard-tag"><Brain size={12} /> Synthèse</div>
                            </motion.div>
                        </div>
                    </div>

                    <div className="journey-connector">
                        <div className="connector-line" />
                        <div className="connector-dot"><Zap size={14} /></div>
                        <div className="connector-line" />
                    </div>

                    {/* Phase 2: Practice */}
                    <div className="journey-section">
                        <div className="journey-section-header">
                            <div className="section-step-badge practice-badge">Étape 2</div>
                            <h3>✏️ S'exercer</h3>
                            <p>Teste et renforce tes connaissances avec des exercices adaptés à ton niveau</p>
                        </div>
                        <div className="journey-cards three-cols">
                            <motion.div
                                className={`journey-card level-card level-easy ${studyMode === 'exercises' && exerciseDifficulty === 'EASY' ? 'active' : ''}`}
                                whileHover={{ y: -3 }}
                                onClick={() => handleGenerateExercises('EASY')}
                            >
                                <div className="jcard-icon easy-icon"><CheckCircle size={24} /></div>
                                <div className="jcard-info">
                                    <h4>Facile</h4>
                                    <p>QCM, vrai/faux, application directe</p>
                                </div>
                                <div className="jcard-tag easy-tag"><Zap size={12} /> Rapide</div>
                            </motion.div>
                            <motion.div
                                className={`journey-card level-card level-medium ${studyMode === 'exercises' && exerciseDifficulty === 'MEDIUM' ? 'active' : ''}`}
                                whileHover={{ y: -3 }}
                                onClick={() => handleGenerateExercises('MEDIUM')}
                            >
                                <div className="jcard-icon medium-icon"><AlertTriangle size={24} /></div>
                                <div className="jcard-info">
                                    <h4>Moyen</h4>
                                    <p>Exercices développés, sous-questions et justifications</p>
                                </div>
                                <div className="jcard-tag medium-tag"><Target size={12} /> Bac blanc</div>
                            </motion.div>
                            <motion.div
                                className={`journey-card level-card level-hard ${studyMode === 'exercises' && exerciseDifficulty === 'HARD' ? 'active' : ''}`}
                                whileHover={{ y: -3 }}
                                onClick={() => handleGenerateExercises('HARD')}
                            >
                                <div className="jcard-icon hard-icon"><Flame size={24} /></div>
                                <div className="jcard-info">
                                    <h4>Difficile</h4>
                                    <p>Problèmes complets type bac avec démonstrations</p>
                                </div>
                                <div className="jcard-tag hard-tag"><Flame size={12} /> Avancé</div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {(studyMode || contentLoading) && (
                        <motion.div
                            key={studyMode! + exerciseDifficulty}
                            className="study-content-area"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {contentLoading ? (
                                <div className="study-loading">
                                    <Loader2 className="spin" size={44} />
                                    <p>
                                        {studyMode === 'course' && "Préparation du support de cours..."}
                                        {studyMode === 'summary' && "Génération du résumé..."}
                                        {studyMode === 'exercises' && `Génération des exercices (${getDifficultyLabel(exerciseDifficulty)})...`}
                                    </p>
                                    <span className="loading-hint">Adapté au programme officiel tunisien</span>
                                </div>
                            ) : studyMode === 'course' && courseContent ? (
                                <div className="study-result">
                                    <div className="result-bar course-bar"><GraduationCap size={20} /> <h3>Support de cours</h3></div>
                                    <div className="markdown-body study-markdown">
                                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{courseContent}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : studyMode === 'summary' && summaryContent ? (
                                <div className="study-result">
                                    <div className="result-bar summary-bar"><FileText size={20} /> <h3>Résumé</h3></div>
                                    <div className="markdown-body study-markdown">
                                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{summaryContent}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : studyMode === 'exercises' && exercises.length > 0 ? (
                                <div className="study-result">
                                    <div className={`result-bar exercises-bar diff-${exerciseDifficulty.toLowerCase()}`}>
                                        {getDifficultyIcon(exerciseDifficulty)}
                                        <h3>Exercices {getDifficultyLabel(exerciseDifficulty)}</h3>
                                        <span className="ex-count">{exercises.length}</span>
                                    </div>
                                    <div className="difficulty-switcher">
                                        {(['EASY', 'MEDIUM', 'HARD'] as ExDifficulty[]).map(d => (
                                            <button key={d} className={`diff-sw ${exerciseDifficulty === d ? 'active' : ''}`}
                                                style={{ '--dc': getDifficultyColor(d) } as any}
                                                onClick={() => handleGenerateExercises(d)}>
                                                {getDifficultyIcon(d)} {getDifficultyLabel(d)}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="exercises-list">
                                        {exercises.map((ex, i) => (
                                            <motion.div key={i} className="exercise-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                                <div className="exercise-header">
                                                    <span className="exercise-number">{exerciseDifficulty === 'HARD' ? `Problème ${i + 1}` : `Exercice ${i + 1}`}</span>
                                                    <span className={`exercise-type ${ex.type?.toLowerCase()}`}>{ex.type}</span>
                                                </div>
                                                <div className="exercise-question markdown-body">
                                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{ex.question}</ReactMarkdown>
                                                </div>
                                                {ex.options && ex.options.length > 0 && (
                                                    <div className="exercise-options">
                                                        {ex.options.map((opt, j) => (
                                                            <div key={j} className="option-item">
                                                                <span className="option-letter">{String.fromCharCode(65 + j)}</span>
                                                                <span>{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <button className="btn btn-outline btn-sm show-answer-btn" onClick={() => toggleAnswer(i)}>
                                                    {showAnswers[i] ? 'Masquer la solution' : 'Voir la solution'}
                                                </button>
                                                <AnimatePresence>
                                                    {showAnswers[i] && (
                                                        <motion.div className="exercise-answer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                            <div className="answer-label">✅ Réponse :</div>
                                                            <div className="markdown-body">
                                                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{ex.answer}</ReactMarkdown>
                                                            </div>
                                                            {ex.explanation && (<>
                                                                <div className="answer-label">💡 Explication :</div>
                                                                <div className="markdown-body">
                                                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{ex.explanation}</ReactMarkdown>
                                                                </div>
                                                            </>)}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="subjects-page">
            <div className="subjects-header">
                <h1><BookOpen size={28} /> Mes Matières</h1>
                <span className="branch-badge">{user?.branch}</span>
            </div>

            <div className="subjects-grid">
                {/* Subjects List */}
                <div className="subjects-list">
                    {loading ? (
                        <div className="loading-state"><div className="loading-spinner" /><p>Chargement...</p></div>
                    ) : subjects.length > 0 ? (
                        subjects.map((subject, index) => (
                            <motion.div key={subject.id} className={`subject-card ${selectedSubject?.id === subject.id ? 'active' : ''}`}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelectSubject(subject)}>
                                <div className="subject-icon"><BookOpen size={24} /></div>
                                <div className="subject-info">
                                    <h3>{subject.name}</h3>
                                    <p className="subject-ar">{subject.nameAr}</p>
                                    <div className="subject-meta">
                                        <span className="coefficient">Coef. {subject.coefficient}</span>
                                        <span className="chapters-count">{subject.chapters?.length || 0} chapitres</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="subject-arrow" />
                            </motion.div>
                        ))
                    ) : (
                        <div className="empty-state"><BookOpen size={48} /><p>Aucune matière trouvée</p></div>
                    )}
                </div>

                {/* Right Panel */}
                <div className="subject-details">
                    {selectedChapter && selectedSubject ? renderChapterStudy()
                    : selectedSubject ? (
                        <motion.div key={selectedSubject.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="details-header">
                                <h2>{selectedSubject.name}</h2>
                                <p>{selectedSubject.nameAr}</p>
                                <div className="details-stats">
                                    <span><Layers size={16} /> {selectedSubject.chapters?.length || 0} chapitres</span>
                                    <span><Target size={16} /> Coef. {selectedSubject.coefficient}</span>
                                </div>
                            </div>
                            <div className="chapters-section">
                                <h3><Layers size={20} /> Chapitres du programme</h3>
                                {selectedSubject.chapters?.length > 0 ? (
                                    <div className="chapters-list">
                                        {selectedSubject.chapters.map((chapter, index) => (
                                            <motion.div key={chapter.id} className="chapter-card clickable"
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                                                onClick={() => handleSelectChapter(chapter)}>
                                                <div className="chapter-number">{chapter.order || index + 1}</div>
                                                <div className="chapter-content">
                                                    <h4>{chapter.title}</h4>
                                                    <p>{chapter.titleAr}</p>
                                                    <div className="chapter-meta">
                                                        <span className="duration"><Clock size={13} /> {chapter.duration} min</span>
                                                        <span className="difficulty" style={{ color: getDifficultyColor(chapter.difficulty) }}>
                                                            {getDifficultyLabel(chapter.difficulty)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="chapter-go"><span>Étudier</span><ChevronRight size={18} /></div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-chapters"><Layers size={40} /><p>Les chapitres seront bientôt disponibles</p></div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="select-subject"><BookOpen size={64} /><h3>Sélectionne une matière</h3><p>Clique sur une matière pour voir ses chapitres</p></div>
                    )}
                </div>
            </div>
        </div>
    );
}
