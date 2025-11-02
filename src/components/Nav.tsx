import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav style={{ background: '#fff', padding: '10px 20px', borderBottom: '1px solid #ccc' }}>
      <NavLink to="/itineris/" style={{ marginRight: 10 }}>Accueil</NavLink>
      <NavLink to="/itineris/dashboard" style={{ marginRight: 10 }}>Dashboard</NavLink>
      <NavLink to="/itineris/notes" style={{ marginRight: 10 }}>Notes</NavLink>
      <NavLink to="/itineris/assistant">Assistant</NavLink>
    </nav>
  )
}
