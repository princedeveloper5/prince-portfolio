import { Component, lazy, Suspense, useEffect } from 'react'
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

/**
 * Signals the readiness hook that the first route chunk has rendered.
 * Renders inside Suspense, so it only mounts once real page content exists.
 * Idempotent: the hook ignores duplicate signals.
 */
function ContentLoadedSignal({ onContentLoaded }) {
  useEffect(() => {
    onContentLoaded?.()
  }, [onContentLoaded])
  return null
}

/**
 * Lightweight branded fallback for lazy route chunks requested AFTER the
 * initial load (navigation). The full PageLoader is not reused here so the
 * loader never flashes during route interactions.
 */
function RouteFallback() {
  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center bg-navy-900"
    >
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden="true"
          className="block h-10 w-10 rounded-full border-2 border-electric-400/30 border-t-electric-400 animate-spin"
        />
        <span className="text-sm tracking-[0.3em] text-slate-400 uppercase">
          Loading page
        </span>
      </div>
    </div>
  )
}

/**
 * Catches lazy-chunk load failures and render errors from the route tree.
 * Reports them to the readiness hook so the loader can show its error/retry
 * state while the initial load is still in progress; after the loader is
 * gone, the branded panel below is shown directly (no loader flash).
 */
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    const message =
      error?.message || 'The page failed to load. Check your connection and try again.'
    this.props.onContentError?.(message)
    // Keep the failure visible for debugging without throwing again.
    console.error('[AppErrorBoundary]', error, info)
  }

  handleReload = () => {
    // Failed dynamic imports are cached as rejected by the browser, so a
    // reload is the reliable recovery for chunk errors.
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#020B16] px-6 py-16">
          <div className="flex max-w-md flex-col items-center gap-6 text-center">
            <div
              aria-hidden="true"
              className="flex h-20 w-20 items-center justify-center rounded-full border border-[#168BFF]/50 bg-gradient-to-br from-[#168BFF]/20 to-[#19C8FF]/10 shadow-[0_0_60px_-20px_rgba(22,139,255,0.8)]"
            >
              <span className="text-xl font-bold tracking-widest text-[#F5F7FB]">
                MP
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-[#F5F7FB]">
              Something went wrong
            </h1>
            <p className="text-sm leading-relaxed text-[#AAB8CA]">
              {this.state.error?.message ||
                'The page could not be loaded. Check your connection and try again.'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-full border border-[#168BFF] px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#F5F7FB] transition-all hover:bg-[rgba(22,139,255,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19C8FF]"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App({ onContentLoaded, onContentError } = {}) {
  return (
    <>
      <SeoManager />
      <AppErrorBoundary onContentError={onContentError}>
        <Suspense fallback={<RouteFallback />}>
          <ContentLoadedSignal onContentLoaded={onContentLoaded} />
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
      </AppErrorBoundary>
    </>
  )
}
