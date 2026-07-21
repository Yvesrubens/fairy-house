import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import LeLieu from './pages/LeLieu'
import Evenements from './pages/Evenements'
import EvenementDetail from './pages/EvenementDetail'
import EventInscription from './pages/EventInscription'
import Blog from './pages/Blog'
import Intervenants from './pages/Intervenants'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import BlogArticle from './pages/BlogArticle'
import Reservation from './pages/Reservation'
import Placeholder from './pages/Placeholder'
import { MentionsLegales, CGV, Confidentialite } from './pages/Legal'
import { ReservationProvider } from './components/Reservation'
import { AuthProvider } from './admin/AuthProvider'
import RequireAdmin from './admin/RequireAdmin'
import AdminLayout from './admin/AdminLayout'
import Login from './admin/pages/Login'
import Dashboard from './admin/pages/Dashboard'
import Reservations from './admin/pages/Reservations'
import Events from './admin/pages/Events'
import Articles from './admin/pages/Articles'
import IntervenantsAdmin from './admin/pages/Intervenants'
import Messages from './admin/pages/Messages'
import Newsletter from './admin/pages/Newsletter'
import Settings from './admin/pages/Settings'

function PublicSite() {
  return (
    <ReservationProvider>
      <div className="min-h-screen bg-white">
        <ScrollToTop />
        <Header />
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/le-lieu" element={<LeLieu />} />
        <Route path="/evenements" element={<Evenements />} />
        <Route path="/evenements/:slug" element={<EvenementDetail />} />
        <Route path="/evenements/:slug/inscription" element={<EventInscription />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogArticle />} />
        <Route path="/intervenants" element={<Intervenants />} />
        <Route path="/reserver" element={<Reservation />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgv" element={<CGV />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="*" element={<Placeholder title="Page introuvable" />} />
      </Routes>
        <Footer />
      </div>
    </ReservationProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="events" element={<Events />} />
          <Route path="articles" element={<Articles />} />
          <Route path="intervenants" element={<IntervenantsAdmin />} />
          <Route path="messages" element={<Messages />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </AuthProvider>
  )
}
