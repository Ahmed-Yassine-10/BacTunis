import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Subjects from './pages/Subjects';
import Documents from './pages/Documents';
import Timetable from './pages/Timetable';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
}

export default function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Private routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="planning" element={<Planning />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="assistant" element={<Assistant />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="subjects/:subjectId" element={<Subjects />} />
                <Route path="subjects/:subjectId/:chapterId" element={<Subjects />} />
                <Route path="documents" element={<Documents />} />
                <Route path="profile" element={<Profile />} />
            </Route>

            {/* Redirect */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
