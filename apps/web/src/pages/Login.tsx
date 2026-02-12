import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await login(email, password);
            toast.success('Bienvenue sur BacTunis! 🎓');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur de connexion');
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
                className="auth-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <h1 className="auth-logo">🎓 BacTunis</h1>
                    <h2>Bon retour!</h2>
                    <p>Connecte-toi pour continuer tes révisions</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="ton.email@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="spin" size={20} />
                                Connexion...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Pas encore de compte?{' '}
                        <Link to="/register">Inscris-toi</Link>
                    </p>
                </div>

                <div className="auth-features">
                    <div className="feature">
                        <span className="feature-icon">📚</span>
                        <span>Programme complet BAC</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🤖</span>
                        <span>Assistant IA</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">📅</span>
                        <span>Planning intelligent</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
