import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToHash from './components/ScrollToHash';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PanierPage from './pages/PanierPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ClientDashboard from './pages/ClientDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import RoleRedirect from './pages/RoleRedirect';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<AuthPage />} path="/auth" />
        <Route element={<Navigate replace to="/auth" />} path="/login" />
        <Route element={<Navigate replace to="/auth?mode=register" />} path="/register" />

        {/* Admin Portal Login */}
        <Route element={<AdminLoginPage />} path="/admin/auth" />
        <Route element={<AdminLoginPage />} path="/admin/login" />

        {/* Panier / Cart */}
        <Route element={<PanierPage />} path="/panier" />
        <Route element={<Navigate replace to="/panier" />} path="/cart" />

        {/* Product Details */}
        <Route element={<ProductDetailPage />} path="/produits" />
        <Route element={<ProductDetailPage />} path="/produits/:id" />
        <Route element={<ProductDetailPage />} path="/produit/:id" />

        {/* Dashboards */}
        <Route element={<RoleRedirect />} path="/dashboard" />
        <Route
          element={
            <ProtectedRoute role="CLIENT">
              <ClientDashboard />
            </ProtectedRoute>
          }
          path="/client"
        />
        <Route
          element={
            <ProtectedRoute role="CLIENT">
              <ClientDashboard />
            </ProtectedRoute>
          }
          path="/profil"
        />
        <Route
          element={
            <ProtectedRoute role="CLIENT">
              <ClientDashboard />
            </ProtectedRoute>
          }
          path="/profile"
        />
        <Route
          element={
            <ProtectedRoute role="COMMERCANT">
              <MerchantDashboard />
            </ProtectedRoute>
          }
          path="/commercant"
        />
        <Route
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
          path="/admin"
        />

        <Route element={<NotFound />} path="*" />
      </Routes>
    </>
  );
}
