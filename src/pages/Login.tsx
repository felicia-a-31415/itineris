import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../lib/auth';

type LocationState = {
  from?: Location;
  mode?: 'signup' | 'login';
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const initialMode = (location.state as LocationState | null)?.mode;
  const [isSigningUp, setIsSigningUp] = useState(initialMode === 'signup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestedPath = (location.state as LocationState | null)?.from?.pathname ?? null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = isSigningUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    const redirectPath = requestedPath ?? '/tableaudebord';
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-[#0B0D10] text-[#ECECF3]">
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
        className="self-start mb-2 text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-[#161924]"
        disabled={isSubmitting}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Retour
      </Button>

      <div className="flex flex-col items-center justify-center flex-1">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#4169E1] shadow-lg flex items-center justify-center mb-4">
              <Compass className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-4xl text-[#ECECF3] tracking-tight mb-2">Itineris</h1>
            <p className="text-[#A9ACBA]">
              {isSigningUp ? 'Crée ton compte pour continuer.' : 'Bienvenue ! Connecte-toi pour continuer'}
            </p>
          </div>

          <div className="bg-[#161924] border border-[#1F2230] rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[#ECECF3] block">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9ACBA]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="votre@email.com"
                    className="pl-11 bg-[#0F1117] border border-[#1F2230] focus:border-[#4169E1] rounded-xl h-12"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[#ECECF3] block">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9ACBA]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="pl-11 pr-11 bg-[#0F1117] border border-[#1F2230] focus:border-[#4169E1] rounded-xl h-12"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9ACBA] hover:text-[#ECECF3] transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="bg-[#2A1B1B] border border-[#4C2A2A] text-[#E16941] px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              ) : null}
              <div className="flex justify-end">
                <button type="button" className="text-sm text-[#A9ACBA] hover:text-[#ECECF3]" disabled={isSubmitting}>
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#4169E1] hover:bg-[#3557C1] text-white py-6 rounded-xl shadow-md transition-all"
              >
                {isSubmitting ? 'Connexion...' : isSigningUp ? 'Créer un compte' : 'Se connecter'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-[#A9ACBA] mt-6 max-w-sm mx-auto">
            En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
}
