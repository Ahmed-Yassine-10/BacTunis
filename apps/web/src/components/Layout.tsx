import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Calendar,
    Clock,
    MessageCircle,
    BookOpen,
    FolderOpen,
    User,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import './Layout.css';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/timetable', icon: Clock, label: 'Emploi du temps' },
    { path: '/planning', icon: Calendar, label: 'Planning' },
    { path: '/assistant', icon: MessageCircle, label: 'Assistant IA' },
    { path: '/subjects', icon: BookOpen, label: 'Matières' },
    { path: '/documents', icon: FolderOpen, label: 'Documents' },
    { path: '/profile', icon: User, label: 'Profil' },
];

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    // Ensure theme is applied on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            {/* Mobile header */}
            <header className="mobile-header">
                <button className="btn btn-icon btn-ghost" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <h1 className="logo">BacTunis</h1>
                <div style={{ width: 40 }} />
            </header>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="logo">
                        <span className="logo-icon">🎓</span>
                        BacTunis
                    </h1>
                    <button
                        className="btn btn-icon btn-ghost sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.firstName} {user?.lastName}</span>
                            <span className="user-branch">{user?.branch}</span>
                        </div>
                    </div>
                    <div className="sidebar-actions">
                        <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
                        </button>
                        <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
                            <LogOut size={18} />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}
