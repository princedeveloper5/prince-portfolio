import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import SkillsPage from './pages/SkillsPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import PremiumAdminDashboard from './pages/PremiumAdminDashboard.jsx'
import ProjectsManagement from './pages/admin/ProjectsManagement.jsx'
import SkillsManagement from './pages/admin/SkillsManagement.jsx'
import AboutManagement from './pages/admin/AboutManagement.jsx'
import ContactManagement from './pages/admin/ContactManagement.jsx'
import UsersManagement from './pages/admin/UsersManagement.jsx'
import SettingsPage from './pages/admin/SettingsPage.jsx'
import HomePageEditor from './pages/admin/HomePageEditor.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <PremiumAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/home"
        element={
          <ProtectedRoute>
            <HomePageEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute>
            <ProjectsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects/add"
        element={
          <ProtectedRoute>
            <ProjectsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/skills"
        element={
          <ProtectedRoute>
            <SkillsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/about"
        element={
          <ProtectedRoute>
            <AboutManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contact"
        element={
          <ProtectedRoute>
            <ContactManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <UsersManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
