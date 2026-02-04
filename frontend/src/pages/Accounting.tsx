const Accounting = () => {
    return (
        <div className="fade-in">
            <header className="page-header">
                <div>
                    <h1>Contabilidad</h1>
                    <p className="page-subtitle">Reconciliación de 3 vías: OTAs, Stripe y Banco</p>
                </div>
                <button className="btn btn-primary">Generar Reporte</button>
            </header>

            <div className="grid grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card">
                    <h3>💰 Balance General</h3>
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                            <span>Ingresos Totales</span>
                            <strong>€0.00</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                            <span>Comisiones Agencia</span>
                            <strong>€0.00</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                            <span>Pagos a Propietarios</span>
                            <strong>€0.00</strong>
                        </div>
                        <hr style={{ margin: 'var(--spacing-md) 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>Balance Neto</strong>
                            <strong style={{ color: 'var(--success)' }}>€0.00</strong>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3>📊 Estado de Reconciliación</h3>
                    <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>✅</div>
                        <p style={{ color: 'var(--success)' }}>Todo reconciliado</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                            Última actualización: Hoy
                        </p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>📋 Libro Mayor (Ledger)</h3>
                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Aquí verás todos los asientos contables generados automáticamente
                </p>
            </div>
        </div>
    );
};

export default Accounting;
