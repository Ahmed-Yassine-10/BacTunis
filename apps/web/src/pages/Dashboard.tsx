import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Clock,
    Target,
    TrendingUp,
    Calendar,
    MessageCircle,
    ChevronRight,
    Smile,
    Meh,
    Frown,
    Zap,
    FolderOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

interface CheckInState {
    label: string;
    icon: React.ReactNode;
    value: string;
    color: string;
}

const emotionalStates: CheckInState[] = [
    { label: 'Super!', icon: <Smile />, value: 'GREAT', color: '#10b981' },
    { label: 'Bien', icon: <Smile />, value: 'GOOD', color: '#3b82f6' },
    { label: 'Ça va', icon: <Meh />, value: 'OKAY', color: '#f59e0b' },
    { label: 'Stressé', icon: <Frown />, value: 'STRESSED', color: '#f97316' },
    { label: 'Débordé', icon: <Frown />, value: 'OVERWHELMED', color: '#ef4444' },
];

export default function Dashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
    const [showCheckIn, setShowCheckIn] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, recsRes, scheduleRes] = await Promise.all([
                api.get('/students/stats'),
                api.get('/planning/recommendations'),
                api.get('/planning/schedules/today'),
            ]);
            setStats(statsRes.data);
            setRecommendations(recsRes.data);
            setTodaySchedule(scheduleRes.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    const handleCheckIn = async (state: string) => {
        try {
            await api.post('/students/checkin', { state });
            setShowCheckIn(false);

            const messages: Record<string, string> = {
                GREAT: 'Super! Continue comme ça! 🌟',
                GOOD: 'C\'est bien! Tu es sur la bonne voie 💪',
                OKAY: 'Ça va aller! N\'hésite pas à faire une pause 🍵',
                STRESSED: 'Respire profondément. Tu peux y arriver! 🧘',
                OVERWHELMED: 'Prends soin de toi. Parle à quelqu\'un si besoin 💙',
            };

            toast.success(messages[state] || 'Check-in enregistré!');
        } catch (error) {
            toast.error('Erreur lors du check-in');
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    return (
        <div className="dashboard">
            {/* Welcome Section */}
            <motion.section
                className="welcome-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="welcome-text">
                    <h1>{getGreeting()}, {user?.firstName}! 👋</h1>
                    <p>Prêt à réviser pour le bac?</p>
                </div>
                <div className="welcome-badge">
                    <span className="badge-icon">🎯</span>
                    <span>{user?.branch}</span>
                </div>
            </motion.section>

            {/* Emotional Check-in */}
            {showCheckIn && (
                <motion.section
                    className="checkin-section card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3>Comment te sens-tu aujourd'hui?</h3>
                    <div className="checkin-options">
                        {emotionalStates.map((state) => (
                            <button
                                key={state.value}
                                className="checkin-btn"
                                style={{ '--state-color': state.color } as React.CSSProperties}
                                onClick={() => handleCheckIn(state.value)}
                            >
                                {state.icon}
                                <span>{state.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-icon" style={{ background: 'var(--gradient-primary)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{Math.round((stats?.totalDuration || 0) / 60)}h</span>
                        <span className="stat-label">Temps de révision</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="stat-icon" style={{ background: 'var(--gradient-secondary)' }}>
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.totalSessions || 0}</span>
                        <span className="stat-label">Sessions terminées</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.averageScore || 0}%</span>
                        <span className="stat-label">Score moyen</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.completedSessions || 0}</span>
                        <span className="stat-label">Objectifs atteints</span>
                    </div>
                </motion.div>
            </div>

            {/* Main Grid */}
            <div className="dashboard-grid">
                {/* Today's Schedule */}
                <motion.section
                    className="schedule-section card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="section-header">
                        <h3><Calendar size={20} /> Planning du jour</h3>
                        <Link to="/planning" className="see-all">
                            Voir tout <ChevronRight size={16} />
                        </Link>
                    </div>

                    {todaySchedule.length > 0 ? (
                        <div className="schedule-list">
                            {todaySchedule.slice(0, 4).map((item: any) => (
                                <div key={item.id} className="schedule-item">
                                    <div
                                        className="schedule-color"
                                        style={{ background: item.color || 'var(--color-secondary)' }}
                                    />
                                    <div className="schedule-info">
                                        <span className="schedule-title">{item.title}</span>
                                        <span className="schedule-time">
                                            {new Date(item.startTime).toLocaleTimeString('fr-TN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {' - '}
                                            {new Date(item.endTime).toLocaleTimeString('fr-TN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Calendar size={40} />
                            <p>Aucun événement aujourd'hui</p>
                            <Link to="/planning" className="btn btn-outline">
                                Ajouter un événement
                            </Link>
                        </div>
                    )}
                </motion.section>

                {/* Recommendations */}
                <motion.section
                    className="recommendations-section card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="section-header">
                        <h3><Zap size={20} /> Recommandations</h3>
                    </div>

                    {recommendations.length > 0 ? (
                        <div className="recommendations-list">
                            {recommendations.slice(0, 3).map((rec: any, index: number) => (
                                <div key={index} className="recommendation-item">
                                    <div className="rec-priority">
                                        <span
                                            className="priority-badge"
                                            style={{
                                                background: rec.priority > 70 ? 'var(--color-error)' :
                                                    rec.priority > 50 ? 'var(--color-warning)' :
                                                        'var(--color-secondary)'
                                            }}
                                        >
                                            {rec.priority}
                                        </span>
                                    </div>
                                    <div className="rec-content">
                                        <span className="rec-title">{rec.title}</span>
                                        <span className="rec-description">{rec.description}</span>
                                    </div>
                                    <span className="rec-duration">{rec.estimatedDuration}min</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Zap size={40} />
                            <p>Les recommandations arrivent bientôt!</p>
                        </div>
                    )}
                </motion.section>
            </div>

            {/* Quick Actions */}
            <motion.section
                className="quick-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <Link to="/assistant" className="action-card action-ai">
                    <MessageCircle size={32} />
                    <div>
                        <h4>Parler à l'assistant IA</h4>
                        <p>Pose tes questions, même en Derja!</p>
                    </div>
                </Link>
                <Link to="/subjects" className="action-card action-subjects">
                    <BookOpen size={32} />
                    <div>
                        <h4>Explorer les matières</h4>
                        <p>Accède aux cours et exercices</p>
                    </div>
                </Link>
                <Link to="/documents" className="action-card action-documents">
                    <FolderOpen size={32} />
                    <div>
                        <h4>Mes Documents</h4>
                        <p>Upload et analyse tes cours avec l'IA</p>
                    </div>
                </Link>
            </motion.section>
        </div>
    );
}
