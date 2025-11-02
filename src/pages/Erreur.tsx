import { Link } from 'react-router-dom'

export default function Erreur() {
  return (
    <main>
      <h1>404 - Page non trouvée</h1>
      <p>Oups! Cette page n’existe pas.</p>
      <Link to="/">Retour à l’accueil</Link>
    </main>
  )
}
