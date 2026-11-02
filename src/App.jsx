import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import SeoManager from './components/SeoManager.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const SkillsPage = lazy(() => import('./pages/SkillsPage.jsx'))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'))
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const PremiumAdminDashboard = lazy(() => import('./pages/PremiumAdminDashboard.jsx'))
const ProjectsManagement = lazy(() => import('./pages/admin/ProjectsManagement.jsx'))
const SkillsManagement = lazy(() => import('./pages/admin/SkillsManagement.jsx'))
const AboutManagement = lazy(() => import('./pages/admin/AboutManagement.jsx'))
const ContactManagement = lazy(() => import('./pages/admin/ContactManagement.jsx'))
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement.jsx'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage.jsx'))
const HomePageEditor = lazy(() => import('./pages/admin/HomePageEditor.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))

export default function App() {
  return (
    <>
    <SeoManager />
    <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center bg-navy-900 text-electric-400">Loading page…</div>}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><PremiumAdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/home" element={<ProtectedRoute><HomePageEditor /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute><ProjectsManagement /></ProtectedRoute>} />
      <Route path="/admin/projects/add" element={<ProtectedRoute><ProjectsManagement /></ProtectedRoute>} />
      <Route path="/admin/skills" element={<ProtectedRoute><SkillsManagement /></ProtectedRoute>} />
      <Route path="/admin/about" element={<ProtectedRoute><AboutManagement /></ProtectedRoute>} />
      <Route path="/admin/contact" element={<ProtectedRoute><ContactManagement /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><UsersManagement /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
    </>
  )
}
