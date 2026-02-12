import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Plus,
    Trash2,
    BookOpen,
    Sparkles,
    ChevronRight,
    Loader2,
    X,
    GraduationCap,
    CalendarDays,
    Lightbulb,
    Layers,
    AlertCircle,
    ArrowRight,
    Target,
    TrendingUp,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Timetable.css';

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
];

interface Subject {
    id: string;
    name: string;
    nameAr: string;
    coefficient: number;
    chapters?: Chapter[];
}

interface Chapter {
    id: string;
    title: string;
    titleAr: string;
    order: number;
    duration: number;
    difficulty: string;
}

interface TimetableSlot {
    id: string;
    subjectId: string;
    subject: Subject;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    teacher?: string;
}

interface DaySchedule {
    day: number;
    dayName: string;
    slots: TimetableSlot[];
}

interface Recommendation {
    subjectId: string;
    name: string;
    weeklyHours: number;
    coefficient: number;
    priority: number;
}

export default function Timetable() {
    const navigate = useNavigate();
    const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [todayInfo, setTodayInfo] = useState<{ dayName: string; slots: TimetableSlot[] } | null>(null);
    const [tomorrowInfo, setTomorrowInfo] = useState<{ dayName: string; slots: TimetableSlot[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'timetable' | 'recommendations'>('timetable');

    // Add slot modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingSlot, setAddingSlot] = useState(false);
    const [slotForm, setSlotForm] = useState({
        subjectId: '',
        dayOfWeek: 0,
        startTime: '08:00',
        endTime: '09:00',
        room: '',
        teacher: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [timetableRes, subjectsRes] = await Promise.all([
                api.get('/timetable'),
                api.get('/subjects/my-subjects'),
            ]);
            setWeeklySchedule(timetableRes.data);
            setSubjects(subjectsRes.data);

            // Load recommendations
            try {
                const recsRes = await api.get('/timetable/recommendations');
                setRecommendations(recsRes.data.recommendations || []);
                setTodayInfo(recsRes.data.today || null);
                setTomorrowInfo(recsRes.data.tomorrow || null);
            } catch {
                // No recommendations yet
            }
        } catch (error) {
            console.error('Error loading timetable:', error);
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async () => {
        if (!slotForm.subjectId) {
            toast.error('Sélectionne une matière');
            return;
        }
        setAddingSlot(true);
        try {
            await api.post('/timetable', {
                ...slotForm,
                dayOfWeek: Number(slotForm.dayOfWeek),
            });
            toast.success('Créneau ajouté! ✅');
            setShowAddModal(false);
            setSlotForm({ subjectId: '', dayOfWeek: 0, startTime: '08:00', endTime: '09:00', room: '', teacher: '' });
            loadData();
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Erreur lors de l\'ajout';
            toast.error(msg);
        } finally {
            setAddingSlot(false);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm('Supprimer ce créneau?')) return;
        try {
            await api.delete(`/timetable/${slotId}`);
            toast.success('Créneau supprimé');
            loadData();
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleViewChapters = (subject: Subject) => {
        navigate(`/subjects/${subject.id}`);
    };

    const getSubjectColor = (subjectName: string) => {
        const colors: Record<string, string> = {
            'Mathématiques': '#6366f1',
            'Physique': '#f59e0b',
            'Sciences naturelles': '#10b981',
            'Informatique': '#3b82f6',
            'Français': '#ec4899',
            'Arabe': '#8b5cf6',
            'Anglais': '#06b6d4',
            'Philosophie': '#f97316',
            'Histoire-Géographie': '#84cc16',
            'Économie': '#14b8a6',
            'Gestion': '#e11d48',
            'Technologie': '#64748b',
            'Algorithmique': '#2563eb',
            'Bases de données': '#7c3aed',
            'Éducation physique': '#22c55e',
        };
        return colors[subjectName] || '#6366f1';
    };

    const getSlotPosition = (startTime: string) => {
        const [h] = startTime.split(':').map(Number);
        return h - 8; // 8:00 is first slot (index 0)
    };

    if (loading) {
        return (
            <div className="timetable-page">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Chargement de l'emploi du temps...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="timetable-page">
            {/* Header */}
            <div className="timetable-header">
                <div className="header-left">
                    <h1><Clock size={28} /> Emploi du Temps</h1>
                    <p className="header-subtitle">Organise ton emploi scolaire et reçois des recommandations IA</p>
                </div>
                <div className="header-actions">
                    <button
                        className={`tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}
                        onClick={() => setActiveTab('timetable')}
                    >
                        <CalendarDays size={18} />
                        Emploi du temps
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recommendations')}
                    >
                        <Lightbulb size={18} />
                        Recommandations
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Ajouter un créneau
                    </button>
                </div>
            </div>

            {/* Tab: Timetable Grid */}
            {activeTab === 'timetable' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="timetable-grid-wrapper"
                >
                    {weeklySchedule.some(d => d.slots.length > 0) ? (
                        <div className="timetable-grid">
                            {/* Time labels column */}
                            <div className="time-column">
                                <div className="grid-header-cell time-header">Heures</div>
                                {TIME_SLOTS.map((time) => (
                                    <div key={time} className="time-label">
                                        {time}
                                    </div>
                                ))}
                            </div>

                            {/* Day columns */}
                            {weeklySchedule.map((day) => (
                                <div key={day.day} className="day-column">
                                    <div className="grid-header-cell day-header">
                                        {day.dayName}
                                    </div>
                                    <div className="day-slots">
                                        {TIME_SLOTS.map((time, idx) => {
                                            const slot = day.slots.find(
                                                (s) => getSlotPosition(s.startTime) === idx
                                            );
                                            if (slot) {
                                                const [sh] = slot.startTime.split(':').map(Number);
                                                const [eh] = slot.endTime.split(':').map(Number);
                                                const span = eh - sh;
                                                return (
                                                    <div
                                                        key={time}
                                                        className="slot-cell filled"
                                                        style={{
                                                            '--slot-color': getSubjectColor(slot.subject.name),
                                                            gridRow: `span ${span}`,
                                                        } as React.CSSProperties}
                                                    >
                                                        <div className="slot-content">
                                                            <span className="slot-subject">{slot.subject.name}</span>
                                                            <span className="slot-time">
                                                                {slot.startTime} - {slot.endTime}
                                                            </span>
                                                            {slot.room && (
                                                                <span className="slot-room">📍 {slot.room}</span>
                                                            )}
                                                            {slot.teacher && (
                                                                <span className="slot-teacher">👨‍🏫 {slot.teacher}</span>
                                                            )}
                                                        </div>
                                                        <div className="slot-actions">
                                                            <button
                                                                className="slot-btn chapters-btn"
                                                                onClick={() => handleViewChapters(slot.subject)}
                                                                title="Voir les chapitres"
                                                            >
                                                                <Layers size={14} />
                                                            </button>
                                                            <button
                                                                className="slot-btn delete-btn"
                                                                onClick={() => handleDeleteSlot(slot.id)}
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            // Check if this cell is covered by a multi-hour slot
                                            const coveredBy = day.slots.find((s) => {
                                                const pos = getSlotPosition(s.startTime);
                                                const [sh2] = s.startTime.split(':').map(Number);
                                                const [eh2] = s.endTime.split(':').map(Number);
                                                return pos < idx && pos + (eh2 - sh2) > idx;
                                            });
                                            if (coveredBy) return null;
                                            return <div key={time} className="slot-cell empty" />;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-timetable">
                            <CalendarDays size={64} />
                            <h3>Aucun emploi du temps configuré</h3>
                            <p>Commence par ajouter tes créneaux de cours pour recevoir des recommandations personnalisées</p>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                <Plus size={18} />
                                Ajouter mon premier cours
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Tab: Recommendations */}
            {activeTab === 'recommendations' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="recommendations-section"
                >
                    {/* Today & Tomorrow */}
                    <div className="today-tomorrow-grid">
                        {todayInfo && (
                            <div className="day-card today-card">
                                <div className="day-card-header">
                                    <CalendarDays size={20} />
                                    <div>
                                        <h3>Aujourd'hui</h3>
                                        <span className="day-card-label">{todayInfo.dayName}</span>
                                    </div>
                                </div>
                                {todayInfo.slots.length > 0 ? (
                                    <div className="day-card-slots">
                                        {todayInfo.slots.map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="mini-slot"
                                                style={{ '--slot-accent': getSubjectColor(slot.subject.name) } as React.CSSProperties}
                                                onClick={() => handleViewChapters(slot.subject)}
                                            >
                                                <span className="mini-slot-time">{slot.startTime}-{slot.endTime}</span>
                                                <span className="mini-slot-subject">{slot.subject.name}</span>
                                                <ArrowRight size={14} className="mini-slot-arrow" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-slots-msg">Pas de cours aujourd'hui 🎉</p>
                                )}
                            </div>
                        )}

                        {tomorrowInfo && (
                            <div className="day-card tomorrow-card">
                                <div className="day-card-header">
                                    <CalendarDays size={20} />
                                    <div>
                                        <h3>Demain</h3>
                                        <span className="day-card-label">{tomorrowInfo.dayName}</span>
                                    </div>
                                </div>
                                {tomorrowInfo.slots.length > 0 ? (
                                    <div className="day-card-slots">
                                        {tomorrowInfo.slots.map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="mini-slot"
                                                style={{ '--slot-accent': getSubjectColor(slot.subject.name) } as React.CSSProperties}
                                                onClick={() => handleViewChapters(slot.subject)}
                                            >
                                                <span className="mini-slot-time">{slot.startTime}-{slot.endTime}</span>
                                                <span className="mini-slot-subject">{slot.subject.name}</span>
                                                <ArrowRight size={14} className="mini-slot-arrow" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-slots-msg">Pas de cours demain</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* AI Recommendations */}
                    <div className="recs-card">
                        <div className="recs-card-header">
                            <div className="recs-title-row">
                                <div className="recs-icon"><Sparkles size={22} /></div>
                                <div>
                                    <h3>Recommandations de révision</h3>
                                    <p>Basées sur ton emploi du temps et les coefficients</p>
                                </div>
                            </div>
                        </div>
                        {recommendations.length > 0 ? (
                            <div className="recs-list">
                                {recommendations.map((rec, idx) => {
                                    const priorityPct = Math.min(100, (rec.priority / (recommendations[0]?.priority || 1)) * 100);
                                    const priorityLevel = rec.priority > 10 ? 'high' : rec.priority > 5 ? 'medium' : 'low';
                                    return (
                                        <motion.div
                                            key={rec.subjectId}
                                            className={`rec-item priority-${priorityLevel}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.06 }}
                                            onClick={() => {
                                                const subj = subjects.find(s => s.id === rec.subjectId);
                                                if (subj) handleViewChapters(subj);
                                            }}
                                        >
                                            <div className="rec-rank-badge" style={{ background: getSubjectColor(rec.name) }}>
                                                {idx + 1}
                                            </div>
                                            <div className="rec-info">
                                                <h4>{rec.name}</h4>
                                                <div className="rec-meta">
                                                    <span><Target size={12} /> Coef. {rec.coefficient}</span>
                                                    <span><Clock size={12} /> {rec.weeklyHours}h/sem</span>
                                                </div>
                                            </div>
                                            <div className="rec-priority-section">
                                                <div className="priority-bar">
                                                    <div className="priority-fill" style={{ width: `${priorityPct}%` }} />
                                                </div>
                                                <span className={`priority-tag priority-${priorityLevel}`}>
                                                    {priorityLevel === 'high' ? '🔴 Priorité haute' : priorityLevel === 'medium' ? '🟡 Moyenne' : '🟢 Normale'}
                                                </span>
                                            </div>
                                            <div className="rec-go">
                                                <span>Réviser</span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="recs-empty">
                                <AlertCircle size={40} />
                                <p>Ajoute ton emploi du temps pour recevoir des recommandations personnalisées</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Add Slot Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            className="modal-content add-slot-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2><Plus size={20} /> Ajouter un créneau</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-form">
                                <div className="form-group">
                                    <label>Matière *</label>
                                    <select
                                        value={slotForm.subjectId}
                                        onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Jour</label>
                                    <select
                                        value={slotForm.dayOfWeek}
                                        onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}
                                    >
                                        {DAY_NAMES.map((name, i) => (
                                            <option key={i} value={i}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Début</label>
                                        <select
                                            value={slotForm.startTime}
                                            onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                                        >
                                            {TIME_SLOTS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Fin</label>
                                        <select
                                            value={slotForm.endTime}
                                            onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                                        >
                                            {TIME_SLOTS.map((t, i) => (
                                                <option key={t} value={TIME_SLOTS[i] > slotForm.startTime ? t : ''} disabled={t <= slotForm.startTime}>
                                                    {t}
                                                </option>
                                            )).filter(Boolean)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Salle (optionnel)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Salle A3"
                                            value={slotForm.room}
                                            onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Professeur (optionnel)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Mr. Ben Ali"
                                            value={slotForm.teacher}
                                            onChange={(e) => setSlotForm({ ...slotForm, teacher: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={handleAddSlot}
                                    disabled={addingSlot}
                                >
                                    {addingSlot ? (
                                        <><Loader2 className="spin" size={18} /> Ajout en cours...</>
                                    ) : (
                                        <><Plus size={18} /> Ajouter le créneau</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
