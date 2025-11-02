import './styles/globals.css'
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
import Nav from './components/Nav'

export default function App() {
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Routes>
        <Route path="/" element={<Bienvenue />} />
        <Route path="/tableaudebord" element={<TableauDeBord />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/minuteur" element={<Minuteur />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/conseils" element={<Conseils />} />
        <Route path="/notes-rapides" element={<NotesRapides />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="*" element={<Erreur />} />
      </Routes>
    </div>
  )
}
