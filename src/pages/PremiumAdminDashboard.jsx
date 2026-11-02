import AdminLayout from '../components/admin/AdminLayout.jsx'
import DashboardContent from '../components/dashboard/DashboardContent.jsx'

export default function PremiumAdminDashboard() {
  return (
    <AdminLayout currentPage="Dashboard">
      <DashboardContent />
    </AdminLayout>
  )
}
