import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, School, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import './Auth.css';

const branches = [
    { value: 'SCIENCES', label: 'Sciences Expérimentales' },
    { value: 'TECHNIQUE', label: 'Sciences Techniques' },
    { value: 'INFORMATIQUE', label: 'Informatique' },
    { value: 'ECONOMIE', label: 'Économie et Gestion' },
    { value: 'LETTRES', label: 'Lettres' },
    { value: 'SPORT', label: 'Sport' },
];

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        grade: 'BAC',
        branch: 'SCIENCES',
        school: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await register(formData);
            toast.success('Inscription réussie! Bienvenue sur BacTunis 🎓');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
        }
    };

    return (
        <div className="auth-page">
            {/* Background decoration */}
            <div className="auth-bg">
                <div className="auth-bg-circle circle-1" />
                <div className="auth-bg-circle circle-2" />
                <div className="auth-bg-circle circle-3" />
            </div>

            <motion.div
                className="auth-container auth-container-wide"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <h1 className="auth-logo">🎓 BacTunis</h1>
                    <h2>Crée ton compte</h2>
                    <p>Rejoins des milliers d'élèves tunisiens</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="firstName">Prénom</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    className="input"
                                    placeholder="Ahmed"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="lastName">Nom</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    className="input"
                                    placeholder="Ben Ali"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input"
                                placeholder="ton.email@exemple.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Mot de passe</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                placeholder="Au moins 8 caractères"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                className="input-action"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="birthDate">Date de naissance</label>
                            <div className="input-wrapper">
                                <Calendar className="input-icon" size={20} />
                                <input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    className="input"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="branch">Filière</label>
                            <div className="input-wrapper">
                                <select
                                    id="branch"
                                    name="branch"
                                    className="input select"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    required
                                >
                                    {branches.map((b) => (
                                        <option key={b.value} value={b.value}>
                                            {b.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="school">Établissement (optionnel)</label>
                        <div className="input-wrapper">
                            <School className="input-icon" size={20} />
                            <input
                                id="school"
                                name="school"
                                type="text"
                                className="input"
                                placeholder="Lycée Pilote Ariana"
                                value={formData.school}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="spin" size={20} />
                                Inscription...
                            </>
                        ) : (
                            'Créer mon compte'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Tu as déjà un compte?{' '}
                        <Link to="/login">Connecte-toi</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
