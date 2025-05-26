import { Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import ProtectedRoute from './components/ui/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientsPage from './pages/PatientsPage';
import PatientCreatePage from './pages/PatientCreatePage';
import PatientEditPage from './pages/PatientEditPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/new" element={<PatientCreatePage />} />
          <Route path="/patients/edit/:id" element={<PatientEditPage />} />
          {/* Add other protected routes here, e.g., for appointments */}
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;