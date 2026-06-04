import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

// Pages accessible without an active subscription
const PLAN_FREE_ROUTES = ['/pricing', '/billing'];

// Separate portal for owner-only users (role=owner)
const PORTAL_PREFIX = '/portal';

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading, isOwner, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const isPortalRoute = location.pathname.startsWith(PORTAL_PREFIX);

    // If user is an owner (not admin) and trying to access admin routes, redirect to portal
    if (isOwner && !isAdmin && !isPortalRoute && !PLAN_FREE_ROUTES.includes(location.pathname)) {
        return <Navigate to="/portal/dashboard" replace />;
    }

    // Subscription check temporarily disabled — uncomment to re-enable
    // if (!hasActivePlan && !PLAN_FREE_ROUTES.includes(location.pathname) && !isPortalRoute) {
    //     return <Navigate to="/pricing" replace />;
    // }

    return <>{children}</>;
};

export default ProtectedRoute;
