import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Drugs from './pages/Drugs';
import Purchases from './pages/Purchases';
import StockOpname from './pages/StockOpname';
import StockCard from './pages/StockCard';
import Pos from './pages/Pos';
import Patients from './pages/Patients';
import Rme from './pages/Rme';
import SalesHistory from './pages/SalesHistory';
import DoctorMaster from './pages/DoctorMaster';
import UserMaster from './pages/UserMaster';
import SupplierMaster from './pages/SupplierMaster';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drugs" element={<Drugs />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="stock-opname" element={<StockOpname />} />
          <Route path="stock-card" element={<StockCard />} />
          <Route path="pos" element={<Pos />} />
          <Route path="patients" element={<Patients />} />
          <Route path="rme" element={<Rme />} />
          <Route path="sales-history" element={<SalesHistory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="/doctors" element={<DoctorMaster />} />
          <Route path="/users" element={<UserMaster />} />
          <Route path="/suppliers" element={<SupplierMaster />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}