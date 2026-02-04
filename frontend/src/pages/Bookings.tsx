const Bookings = () => {
    return (
        <div className="fade-in">
            <header className="page-header">
                <div>
                    <h1>Reservas</h1>
                    <p className="page-subtitle">Calendario unificado de todas tus reservas (Airbnb, Booking.com, etc.)</p>
                </div>
                <button className="btn btn-primary">+ Nueva Reserva</button>
            </header>

            <div className="card">
                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    📅 Módulo en construcción - Aquí verás el multicalendario con sincronización de OTAs
                </p>
            </div>
        </div>
    );
};

export default Bookings;
