import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../lib/auth';

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

  const fromPath = (location.state as LocationState | null)?.from?.pathname ?? '/tableaudebord';

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

    navigate(fromPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-6 md:p-12 flex items-center">
      <div className="max-w-lg w-full mx-auto">
        <Card className="bg-[#161924] border border-[#1F2230] rounded-3xl p-10 md:p-12 shadow-[0_18px_50px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.08)]">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">Connexion</h1>
              <p className="text-[#A9ACBA] text-base">
                {isSigningUp ? 'Crée ton compte pour continuer.' : 'Connecte-toi pour retrouver ton tableau.'}
              </p>
            </div>

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

            <div className="text-base text-[#A9ACBA]">
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
        </Card>
      </div>
    </div>
  );
}
