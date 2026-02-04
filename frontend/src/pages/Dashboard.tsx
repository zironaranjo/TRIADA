import { useEffect, useState } from 'react';
import { bookingsApi, propertiesApi, ownersApi } from '../api/client';
import './Dashboard.css';

interface Stats {
    totalBookings: number;
    totalProperties: number;
    totalOwners: number;
    revenue: number;
}

const Dashboard = () => {
    const [stats, setStats] = useState<Stats>({
        totalBookings: 0,
        totalProperties: 0,
        totalOwners: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookings, properties, owners] = await Promise.all([
                    bookingsApi.getAll(),
                    propertiesApi.getAll(),
                    ownersApi.getAll(),
                ]);

                const totalRevenue = bookings.data.reduce(
                    (sum: number, booking: any) => sum + Number(booking.totalPrice || 0),
                    0
                );

                setStats({
                    totalBookings: bookings.data.length,
                    totalProperties: properties.data.length,
                    totalOwners: owners.data.length,
                    revenue: totalRevenue,
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard fade-in">
            <header className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="page-subtitle">Visión general de tu negocio de alquileres vacacionales</p>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                        📅
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Reservas Totales</p>
                        <h2 className="stat-value">{stats.totalBookings}</h2>
                        <span className="stat-change positive">+12% vs mes anterior</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        🏠
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Propiedades Activas</p>
                        <h2 className="stat-value">{stats.totalProperties}</h2>
                        <span className="stat-change positive">+2 este mes</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        👥
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Propietarios</p>
                        <h2 className="stat-value">{stats.totalOwners}</h2>
                        <span className="stat-change neutral">Sin cambios</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                        💰
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Ingresos Totales</p>
                        <h2 className="stat-value">€{stats.revenue.toLocaleString()}</h2>
                        <span className="stat-change positive">+18% vs mes anterior</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card dashboard-card">
                    <h3>🔗 Integraciones Activas</h3>
                    <div className="integrations-list">
                        <div className="integration-item">
                            <span className="integration-logo">🏡</span>
                            <div>
                                <h4>Airbnb</h4>
                                <p>Sincronización automática de calendarios</p>
                            </div>
                            <span className="badge badge-success">Activo</span>
                        </div>
                        <div className="integration-item">
                            <span className="integration-logo">🌐</span>
                            <div>
                                <h4>Booking.com</h4>
                                <p>Channel Manager conectado</p>
                            </div>
                            <span className="badge badge-success">Activo</span>
                        </div>
                        <div className="integration-item">
                            <span className="integration-logo">📱</span>
                            <div>
                                <h4>Lodgify</h4>
                                <p>Motor de reservas directo</p>
                            </div>
                            <span className="badge badge-success">Activo</span>
                        </div>
                        <div className="integration-item">
                            <span className="integration-logo">💳</span>
                            <div>
                                <h4>Stripe</h4>
                                <p>Procesamiento de pagos</p>
                            </div>
                            <span className="badge badge-success">Activo</span>
                        </div>
                    </div>
                </div>

                <div className="card dashboard-card">
                    <h3>📊 Actividad Reciente</h3>
                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-icon">📅</div>
                            <div>
                                <p><strong>Nueva reserva</strong> en Villa Paraíso</p>
                                <span className="activity-time">Hace 2 horas</span>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon">💰</div>
                            <div>
                                <p><strong>Pago recibido</strong> - €1,250</p>
                                <span className="activity-time">Hace 5 horas</span>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon">🏠</div>
                            <div>
                                <p><strong>Nueva propiedad</strong> añadida al sistema</p>
                                <span className="activity-time">Ayer</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>🎯 Próximos Pasos Recomendados</h3>
                <div className="recommendations">
                    <div className="recommendation-item">
                        <span className="rec-icon">✅</span>
                        <div>
                            <h4>Conecta tu primera propiedad</h4>
                            <p>Añade propiedades para empezar a gestionar reservas</p>
                        </div>
                        <button className="btn btn-primary">Añadir Propiedad</button>
                    </div>
                    <div className="recommendation-item">
                        <span className="rec-icon">📊</span>
                        <div>
                            <h4>Configura reportes automáticos</h4>
                            <p>Recibe informes financieros mensuales por email</p>
                        </div>
                        <button className="btn btn-secondary">Configurar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
