import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav style={{ background: '#fff', padding: '10px 20px', borderBottom: '1px solid #ccc' }}>
      <NavLink to="/" style={{ marginRight: 10 }}>Accueil</NavLink>
      <NavLink to="/tableaudebord" style={{ marginRight: 10 }}>TableauDeBord</NavLink>
      <NavLink to="/notesrapides" style={{ marginRight: 10 }}>Notes rapides</NavLink>
      <NavLink to="/assistant">Assistant</NavLink>
    </nav>
  )
}
