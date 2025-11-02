import './styles/globals.css'

import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'

import { Bienvenue } from './pages/Bienvenue'
import { Onboarding } from './pages/Onboarding'
import { TableauDeBord } from './pages/TableauDeBord'
import Parametres from './pages/Parametres'
import Todo from './pages/Todo'
import Minuteur from './pages/Minuteur'
import Statistiques from './pages/Statistiques'
import Conseils from './pages/Conseils'
import NotesRapides from './pages/NotesRapides'
import Assistant from './pages/Assistant'
import Erreur from './pages/Erreur'

interface UserData {
  name: string;
  year: string;
  favoriteSubjects: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  lifeGoals: string;
}

export default function App() {
  const [userData, setUserData] = useState<UserData | null>(null)

  const navigate = useNavigate()

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
    navigate('/tableaudebord')
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#2C2C2C]">
      {/* Routes define the different pages */}
      <Routes>

        {/* Welcome Screen Route */}
        <Route
          path="/"
          element={<Bienvenue onGetStarted={() => navigate('/onboarding')} />}
        />

        {/* Onboarding Screen Route */}
        <Route 
          path="/onboarding" 
          element={<Onboarding onComplete={handleOnboardingComplete}/>} 
        />

        {/* Dashboard Screen Route */}
        <Route 
          path="/tableaudebord"
          element={<TableauDeBord onNavigate={(screen) => navigate(`/${screen}`)} userName={userData?.name} />} 
        />

        <Route path="/parametres" element={<Parametres />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/minuteur" element={<Minuteur />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/conseils" element={<Conseils />} />
        <Route path="/notesrapides" element={<NotesRapides />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/*" element={<Erreur />} />
      </Routes>
    </div>
  )
}