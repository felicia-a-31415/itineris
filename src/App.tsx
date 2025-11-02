import './styles/globals.css'
import Nav from './components/Nav'

import { Routes, Route } from 'react-router-dom'
import Bienvenue from './pages/Bienvenue'
import TableauDeBord from './pages/TableauDeBord'
import Parametres from './pages/Parametres'
import Todo from './pages/Todo'
import Minuteur from './pages/Minuteur'
import Statistiques from './pages/Statistiques'
import Conseils from './pages/Conseils'
import NotesRapides from './pages/NotesRapides'
import Assistant from './pages/Assistant'
import Erreur from './pages/Erreur'

export default function App() {
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#2C2C2C]">
      {/* Navigation bar at the top */}
      <Nav />

      {/* Routes define the different pages */}
      <Routes>
        <Route path="/itineris" element={<Bienvenue />} />
        <Route path="/itineris/tableaudebord" element={<TableauDeBord />} />
        <Route path="/itineris/parametres" element={<Parametres />} />
        <Route path="/itineris/todo" element={<Todo />} />
        <Route path="/itineris/minuteur" element={<Minuteur />} />
        <Route path="/itineris/statistiques" element={<Statistiques />} />
        <Route path="/itineris/conseils" element={<Conseils />} />
        <Route path="/itineris/notes-rapides" element={<NotesRapides />} />
        <Route path="/itineris/assistant" element={<Assistant />} />
        <Route path="/itineris/*" element={<Erreur />} />
      </Routes>
    </div>
  )
}
