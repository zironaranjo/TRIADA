import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

// Pages accessible without an active subscription
const PLAN_FREE_ROUTES = ['/pricing', '/billing'];

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading, hasActivePlan } = useAuth();
    const location = useLocation();

    if (loading) {
        // Show loading spinner while checking auth
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user has no active plan and is not on a plan-free route, redirect to pricing
    if (!hasActivePlan && !PLAN_FREE_ROUTES.includes(location.pathname)) {
        return <Navigate to="/pricing" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
