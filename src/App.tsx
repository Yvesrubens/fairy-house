import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import LeLieu from './pages/LeLieu'
import Evenements from './pages/Evenements'
import Blog from './pages/Blog'
import Intervenants from './pages/Intervenants'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/le-lieu" element={<LeLieu />} />
        <Route path="/evenements" element={<Evenements />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/intervenants" element={<Intervenants />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="*" element={<Placeholder title="Page introuvable" />} />
      </Routes>
      <Footer />
    </div>
  )
}
