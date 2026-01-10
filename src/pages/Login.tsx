import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../lib/auth';
import { loadUserData } from '../lib/storage';

type LocationState = {
  from?: Location;
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requestedPath = (location.state as LocationState | null)?.from?.pathname ?? null;
  const hasOnboardingData = Boolean(loadUserData());
  const defaultPath = hasOnboardingData ? '/tableaudebord' : '/onboarding';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    const { error: authError } = isSigningUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    if (isSigningUp) {
      setNotice('Compte créé. Vérifie ton email si la confirmation est requise.');
      setIsSubmitting(false);
      return;
    }

    const redirectPath = hasOnboardingData ? requestedPath ?? defaultPath : '/onboarding';
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-10 md:grid-cols-[1.1fr,1fr] items-start">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-[#A9ACBA]">Itineris</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Connexion</h1>
            <p className="text-[#A9ACBA] text-base md:text-lg max-w-md">
              {isSigningUp ? 'Crée ton compte pour continuer.' : 'Connecte-toi pour retrouver ton tableau.'}
            </p>
          </div>

          <div className="bg-[#161924] border border-[#1F2230] rounded-3xl p-8 md:p-10 shadow-[0_18px_50px_rgba(0,0,0,0.45),0_8px_24px_rgba(0,0,0,0.28),0_1px_0_rgba(255,255,255,0.08)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[#ECECF3]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="toi@email.com"
                  className="rounded-2xl h-12"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-[#ECECF3]">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="rounded-2xl h-12"
                  required
                />
              </div>

              {error ? <div className="text-sm text-[#E16941]">{error}</div> : null}
              {notice ? <div className="text-sm text-[#A9ACBA]">{notice}</div> : null}

              <Button
                type="submit"
                className="w-full bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-2xl h-12 text-base"
                disabled={isSubmitting}
              >
                {isSigningUp ? 'Créer un compte' : 'Se connecter'}
              </Button>
            </form>

            <div className="text-base text-[#A9ACBA] mt-6">
              {isSigningUp ? 'Déjà un compte ?' : "Pas encore de compte ?"}{' '}
              <button
                type="button"
                onClick={() => setIsSigningUp((prev) => !prev)}
                className="text-sm text-[#ECECF3] underline underline-offset-4 font-normal"
              >
                {isSigningUp ? 'Se connecter' : 'Créer un compte'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
