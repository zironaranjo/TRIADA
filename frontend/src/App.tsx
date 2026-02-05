import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Properties from './pages/Properties';
import Bookings from './pages/Bookings';
import Owners from './pages/Owners';
// import Accounting from './pages/Accounting'; // Deprecated
import FinanceDashboard from './pages/FinanceDashboard';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="owners" element={<Owners />} />
          <Route path="accounting" element={<FinanceDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
