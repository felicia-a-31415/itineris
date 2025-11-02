import { Link } from "react-router-dom";

export default function Bienvenue(){
  return (
    <main className="container-page">
      <div className="mb-8">
        <div className="text-3xl font-semibold">Itineris</div>
        <p className="text-muted">Your path to organized learning.</p>
      </div>

      <div className="tile">
        <h1 className="text-2xl font-semibold mb-2">Bienvenue</h1>
        <p className="text-muted mb-6">Un court questionnaire pour personnaliser tes conseils d’étude.</p>
        <Link to="/onboarding" className="btn">Commencer →</Link>
      </div>
    </main>
  );
}
