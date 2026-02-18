import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Properties from './pages/Properties';
import Bookings from './pages/Bookings';
import Owners from './pages/Owners';
import OwnerProfile from './pages/OwnerProfile';
import CRM from './pages/CRM';
import FinanceDashboard from './pages/FinanceDashboard';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import OwnerStatements from './pages/OwnerStatements';
import StaffOperations from './pages/StaffOperations';
import ChannelManager from './pages/ChannelManager';
import OccupancyDashboard from './pages/OccupancyDashboard';
import GuestPortal from './pages/GuestPortal';
import Messaging from './pages/Messaging';
import Contracts from './pages/Contracts';
import ContractSign from './pages/ContractSign';
import RevenueManagement from './pages/RevenueManagement';
import Benchmarking from './pages/Benchmarking';
import AuditLog from './pages/AuditLog';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';

// Owner Portal
import OwnerLayout from './components/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerProperties from './pages/owner/OwnerProperties';
import OwnerMyStatements from './pages/owner/OwnerMyStatements';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/guest/:token" element={<GuestPortal />} />
          <Route path="/contract/:token" element={<ContractSign />} />

          {/* Admin/Staff protected routes (includes owner portal pages) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="owners" element={<Owners />} />
            <Route path="owners/:id" element={<OwnerProfile />} />
            <Route path="crm" element={<CRM />} />
            <Route path="accounting" element={<FinanceDashboard />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
            <Route path="statements" element={<OwnerStatements />} />
            <Route path="staff" element={<StaffOperations />} />
            <Route path="channels" element={<ChannelManager />} />
            <Route path="occupancy" element={<OccupancyDashboard />} />
            <Route path="messaging" element={<Messaging />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="revenue" element={<RevenueManagement />} />
            <Route path="benchmarking" element={<Benchmarking />} />
            <Route path="audit" element={<AuditLog />} />
            {/* Owner Portal pages accessible within main layout */}
            <Route path="owner/dashboard" element={<OwnerDashboard />} />
            <Route path="owner/properties" element={<OwnerProperties />} />
            <Route path="owner/statements" element={<OwnerMyStatements />} />
          </Route>

          {/* Owner-only portal (separate layout for users with role=owner) */}
          <Route
            element={
              <ProtectedRoute>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="portal/dashboard" element={<OwnerDashboard />} />
            <Route path="portal/properties" element={<OwnerProperties />} />
            <Route path="portal/statements" element={<OwnerMyStatements />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
