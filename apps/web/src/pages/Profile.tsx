import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, School, Calendar, Target, Brain, Save, Loader2, BookOpen, Clock, Award } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import './Profile.css';

const learningStyles = [
    { value: 'VISUAL', label: 'Visuel', icon: '👁️', description: 'J\'apprends mieux avec des images et schémas' },
    { value: 'AUDITORY', label: 'Auditif', icon: '👂', description: 'J\'apprends mieux en écoutant' },
    { value: 'READING', label: 'Lecture', icon: '📖', description: 'J\'apprends mieux en lisant' },
    { value: 'KINESTHETIC', label: 'Pratique', icon: '✋', description: 'J\'apprends mieux en pratiquant' },
];

const studyRhythms = [
    { value: 'SLOW', label: 'Tranquille', description: 'Sessions courtes, pauses fréquentes' },
    { value: 'MODERATE', label: 'Modéré', description: 'Équilibre entre travail et repos' },
    { value: 'INTENSIVE', label: 'Intensif', description: 'Sessions longues, concentration maximale' },
];

export default function Profile() {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        learningStyle: '',
        studyRhythm: 'MODERATE',
        strengths: [] as string[],
        weaknesses: [] as string[],
        goals: [] as string[],
    });
    const [newStrength, setNewStrength] = useState('');
    const [newWeakness, setNewWeakness] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const [subjectCount, setSubjectCount] = useState(0);
    const [chapterCount, setChapterCount] = useState(0);

    const bacCountdown = useMemo(() => {
        const bacDate = new Date('2025-06-11');
        const today = new Date();
        const diff = bacDate.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, []);

    useEffect(() => {
        loadProfile();
        loadSubjectStats();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.get('/students/profile');
            setProfile(response.data);
            if (response.data.profile) {
                setFormData({
                    learningStyle: response.data.profile.learningStyle || '',
                    studyRhythm: response.data.profile.studyRhythm || 'MODERATE',
                    strengths: response.data.profile.strengths || [],
                    weaknesses: response.data.profile.weaknesses || [],
                    goals: response.data.profile.goals || [],
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSubjectStats = async () => {
        try {
            const response = await api.get('/subjects/my-subjects');
            const subjects = response.data || [];
            setSubjectCount(subjects.length);
            setChapterCount(subjects.reduce((acc: number, s: any) => acc + (s.chapters?.length || 0), 0));
        } catch { /* ignore */ }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/students/profile', formData);
            toast.success('Profil mis à jour! 🎉');
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const addTag = (type: 'strengths' | 'weaknesses' | 'goals', value: string) => {
        if (!value.trim()) return;
        if (formData[type].includes(value.trim())) return;
        setFormData({
            ...formData,
            [type]: [...formData[type], value.trim()],
        });
    };

    const removeTag = (type: 'strengths' | 'weaknesses' | 'goals', value: string) => {
        setFormData({
            ...formData,
            [type]: formData[type].filter((t) => t !== value),
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Chargement du profil...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Profile Banner */}
            <motion.div
                className="profile-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="banner-content">
                    <div className="banner-avatar">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="banner-info">
                        <h1>{user?.firstName} {user?.lastName}</h1>
                        <p>{user?.grade} — {user?.branch}</p>
                    </div>
                    <button
                        className="btn btn-primary save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                        Sauvegarder
                    </button>
                </div>
                <div className="banner-stats">
                    <div className="bstat">
                        <div className="bstat-icon countdown"><Clock size={20} /></div>
                        <div className="bstat-info">
                            <span className="bstat-value">{bacCountdown}</span>
                            <span className="bstat-label">jours avant le Bac</span>
                        </div>
                    </div>
                    <div className="bstat">
                        <div className="bstat-icon subjects"><BookOpen size={20} /></div>
                        <div className="bstat-info">
                            <span className="bstat-value">{subjectCount}</span>
                            <span className="bstat-label">matières</span>
                        </div>
                    </div>
                    <div className="bstat">
                        <div className="bstat-icon chapters"><Target size={20} /></div>
                        <div className="bstat-info">
                            <span className="bstat-value">{chapterCount}</span>
                            <span className="bstat-label">chapitres</span>
                        </div>
                    </div>
                    <div className="bstat">
                        <div className="bstat-icon branch"><Award size={20} /></div>
                        <div className="bstat-info">
                            <span className="bstat-value">{user?.branch}</span>
                            <span className="bstat-label">filière</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="profile-grid">
                {/* Personal Info */}
                <motion.section
                    className="profile-section card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2><User size={20} /> Informations personnelles</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <Mail size={16} />
                            <div>
                                <span className="info-label">Email</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <School size={16} />
                            <div>
                                <span className="info-label">Établissement</span>
                                <span className="info-value">{profile?.school || 'Non spécifié'}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <Calendar size={16} />
                            <div>
                                <span className="info-label">Niveau</span>
                                <span className="info-value">{user?.grade}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <Award size={16} />
                            <div>
                                <span className="info-label">Filière</span>
                                <span className="info-value">{user?.branch}</span>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Learning Style */}
                <motion.section
                    className="profile-section card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h2><Brain size={20} /> Style d'apprentissage</h2>
                    <div className="learning-styles">
                        {learningStyles.map((style) => (
                            <div
                                key={style.value}
                                className={`style-card ${formData.learningStyle === style.value ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, learningStyle: style.value })}
                            >
                                <span className="style-icon">{style.icon}</span>
                                <span className="style-label">{style.label}</span>
                                <span className="style-desc">{style.description}</span>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Study Rhythm */}
                <motion.section
                    className="profile-section card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>Rythme d'étude</h2>
                    <div className="rhythm-options">
                        {studyRhythms.map((rhythm) => (
                            <div
                                key={rhythm.value}
                                className={`rhythm-card ${formData.studyRhythm === rhythm.value ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, studyRhythm: rhythm.value })}
                            >
                                <span className="rhythm-label">{rhythm.label}</span>
                                <span className="rhythm-desc">{rhythm.description}</span>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Strengths & Weaknesses */}
                <motion.section
                    className="profile-section card tags-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="tags-group">
                        <h3>💪 Points forts</h3>
                        <div className="tags-input">
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex: Mathématiques"
                                value={newStrength}
                                onChange={(e) => setNewStrength(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addTag('strengths', newStrength);
                                        setNewStrength('');
                                    }
                                }}
                            />
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    addTag('strengths', newStrength);
                                    setNewStrength('');
                                }}
                            >
                                Ajouter
                            </button>
                        </div>
                        <div className="tags-list">
                            {formData.strengths.map((tag) => (
                                <span key={tag} className="tag tag-success">
                                    {tag}
                                    <button onClick={() => removeTag('strengths', tag)}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="tags-group">
                        <h3>📚 À améliorer</h3>
                        <div className="tags-input">
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex: Philosophie"
                                value={newWeakness}
                                onChange={(e) => setNewWeakness(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addTag('weaknesses', newWeakness);
                                        setNewWeakness('');
                                    }
                                }}
                            />
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    addTag('weaknesses', newWeakness);
                                    setNewWeakness('');
                                }}
                            >
                                Ajouter
                            </button>
                        </div>
                        <div className="tags-list">
                            {formData.weaknesses.map((tag) => (
                                <span key={tag} className="tag tag-warning">
                                    {tag}
                                    <button onClick={() => removeTag('weaknesses', tag)}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Goals */}
                <motion.section
                    className="profile-section card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2><Target size={20} /> Mes objectifs</h2>
                    <div className="tags-input">
                        <input
                            type="text"
                            className="input"
                            placeholder="Ex: Obtenir 16 au bac"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addTag('goals', newGoal);
                                    setNewGoal('');
                                }
                            }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                addTag('goals', newGoal);
                                setNewGoal('');
                            }}
                        >
                            Ajouter
                        </button>
                    </div>
                    <div className="goals-list">
                        {formData.goals.map((goal) => (
                            <div key={goal} className="goal-item">
                                <Target size={16} />
                                <span>{goal}</span>
                                <button onClick={() => removeTag('goals', goal)}>×</button>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
