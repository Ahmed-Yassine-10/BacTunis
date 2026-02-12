import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Planning.css';

interface Schedule {
    id: string;
    title: string;
    description?: string;
    type: string;
    startTime: string;
    endTime: string;
    color?: string;
    subject?: { name: string };
}

const scheduleTypes = [
    { value: 'SCHOOL', label: 'Cours', color: '#3b82f6' },
    { value: 'REVISION', label: 'Révision', color: '#10b981' },
    { value: 'EXAM', label: 'Examen', color: '#ef4444' },
    { value: 'PERSONAL', label: 'Personnel', color: '#8b5cf6' },
    { value: 'LEISURE', label: 'Loisir', color: '#f59e0b' },
];

export default function Planning() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'REVISION',
        startTime: '',
        endTime: '',
        color: '#10b981',
    });

    useEffect(() => {
        loadSchedules();
    }, [currentDate]);

    const loadSchedules = async () => {
        try {
            const response = await api.get('/planning/schedules/week');
            setSchedules(response.data);
        } catch (error) {
            console.error('Error loading schedules:', error);
        }
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const getSchedulesForDay = (date: Date) => {
        return schedules.filter((schedule) =>
            isSameDay(new Date(schedule.startTime), date)
        );
    };

    const handlePreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const openModal = (date?: Date, schedule?: Schedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData({
                title: schedule.title,
                description: schedule.description || '',
                type: schedule.type,
                startTime: schedule.startTime.slice(0, 16),
                endTime: schedule.endTime.slice(0, 16),
                color: schedule.color || '#10b981',
            });
        } else {
            setEditingSchedule(null);
            const now = date || new Date();
            const startTime = new Date(now);
            startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + 1);

            setFormData({
                title: '',
                description: '',
                type: 'REVISION',
                startTime: startTime.toISOString().slice(0, 16),
                endTime: endTime.toISOString().slice(0, 16),
                color: '#10b981',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSchedule(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingSchedule) {
                await api.put(`/planning/schedules/${editingSchedule.id}`, formData);
                toast.success('Événement modifié!');
            } else {
                await api.post('/planning/schedules', formData);
                toast.success('Événement créé!');
            }
            closeModal();
            loadSchedules();
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cet événement?')) return;

        try {
            await api.delete(`/planning/schedules/${id}`);
            toast.success('Événement supprimé');
            loadSchedules();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleTypeChange = (type: string) => {
        const typeConfig = scheduleTypes.find((t) => t.value === type);
        setFormData({
            ...formData,
            type,
            color: typeConfig?.color || formData.color
        });
    };

    return (
        <div className="planning-page">
            <div className="planning-header">
                <h1><CalendarIcon size={28} /> Mon Planning</h1>
                <div className="planning-controls">
                    <div className="week-navigation">
                        <button className="btn btn-icon btn-ghost" onClick={handlePreviousWeek}>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="btn btn-outline" onClick={handleToday}>
                            Aujourd'hui
                        </button>
                        <button className="btn btn-icon btn-ghost" onClick={handleNextWeek}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <span className="current-week">
                        {format(weekStart, 'd MMM', { locale: fr })} - {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
                    </span>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={20} />
                        Ajouter
                    </button>
                </div>
            </div>

            <div className="calendar-grid">
                {/* Header */}
                <div className="calendar-header">
                    {weekDays.map((day) => (
                        <div
                            key={day.toISOString()}
                            className={`calendar-day-header ${isSameDay(day, new Date()) ? 'today' : ''}`}
                        >
                            <span className="day-name">{format(day, 'EEE', { locale: fr })}</span>
                            <span className="day-number">{format(day, 'd')}</span>
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="calendar-body">
                    {weekDays.map((day) => {
                        const daySchedules = getSchedulesForDay(day);
                        return (
                            <div
                                key={day.toISOString()}
                                className={`calendar-day ${isSameDay(day, new Date()) ? 'today' : ''}`}
                                onClick={() => openModal(day)}
                            >
                                {daySchedules.map((schedule) => (
                                    <motion.div
                                        key={schedule.id}
                                        className="schedule-event"
                                        style={{ borderLeftColor: schedule.color }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openModal(day, schedule);
                                        }}
                                    >
                                        <span className="event-time">
                                            {format(new Date(schedule.startTime), 'HH:mm')}
                                        </span>
                                        <span className="event-title">{schedule.title}</span>
                                        <button
                                            className="event-delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(schedule.id);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <motion.div
                        className="modal"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>{editingSchedule ? 'Modifier' : 'Nouvel événement'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Titre</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: Révision Maths"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Type</label>
                                <div className="type-selector">
                                    {scheduleTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            className={`type-btn ${formData.type === type.value ? 'active' : ''}`}
                                            style={{
                                                '--type-color': type.color,
                                                borderColor: formData.type === type.value ? type.color : 'transparent'
                                            } as React.CSSProperties}
                                            onClick={() => handleTypeChange(type.value)}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Début</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Fin</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Description (optionnel)</label>
                                <textarea
                                    className="input"
                                    placeholder="Notes ou détails..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingSchedule ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
