import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1 className="logo">TRIADA</h1>
                    <p className="logo-subtitle">Vacation Rental ERP</p>
                </div>

                <nav className="nav">
                    <Link
                        to="/dashboard"
                        className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </Link>
                    <Link
                        to="/properties"
                        className={`nav-item ${isActive('/properties') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">🏠</span>
                        Propiedades
                    </Link>
                    <Link
                        to="/bookings"
                        className={`nav-item ${isActive('/bookings') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">📅</span>
                        Reservas
                    </Link>
                    <Link
                        to="/owners"
                        className={`nav-item ${isActive('/owners') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">👥</span>
                        Propietarios
                    </Link>
                    <Link
                        to="/accounting"
                        className={`nav-item ${isActive('/accounting') ? 'active' : ''}`}
                    >
                        <span className="nav-icon">💰</span>
                        Contabilidad
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <div className="integration-badges">
                        <span className="integration-badge">🏡 Airbnb</span>
                        <span className="integration-badge">🌐 Booking.com</span>
                        <span className="integration-badge">📱 Lodgify</span>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
