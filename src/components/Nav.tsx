import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav style={{ background: '#fff', padding: '10px 20px', borderBottom: '1px solid #ccc' }}>
      <NavLink to="/" style={{ marginRight: 10 }}>Accueil</NavLink>
      <NavLink to="/dashboard" style={{ marginRight: 10 }}>Dashboard</NavLink>
      <NavLink to="/notes" style={{ marginRight: 10 }}>Notes</NavLink>
      <NavLink to="/assistant">Assistant</NavLink>
    </nav>
  )
}
