import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type AuthMode = 'choice' | 'signup' | 'login';

type DashboardAuthGateProps = {
  open: boolean;
  initialMode?: 'signup' | 'login' | null;
  onContinueWithoutAccount: () => void;
};

export function DashboardAuthGate({
  open,
  initialMode,
  onContinueWithoutAccount,
}: DashboardAuthGateProps) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode ?? 'choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode ?? 'choice');
    setError(null);
    setMessage(null);
  }, [open, initialMode]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Entre une adresse email valide.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setIsSubmitting(false);
      return;
    }

    const { error: authError } =
      mode === 'signup' ? await signUp(trimmedEmail, password) : await signIn(trimmedEmail, password);

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === 'signup') {
      setMessage('Compte créé. Vérifie aussi ta boite mail si une confirmation est demandée.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#080A11]/68 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-[12%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(81,60,255,0.42),rgba(81,60,255,0)_68%)]" />
        <div className="absolute right-[-10%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,82,120,0.42),rgba(255,82,120,0)_70%)]" />
        <div className="absolute bottom-[-14%] left-[28%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),rgba(255,255,255,0)_72%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(11,13,18,0.96),rgba(60,13,48,0.78),rgba(190,46,88,0.68))] px-6 py-8 text-white shadow-[0_32px_90px_rgba(0,0,0,0.55)] md:px-10 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs tracking-[0.2em] text-white/72 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Itineris
              </div>
              <div className="space-y-3">
                <h1 className="max-w-[12ch] text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  Let&apos;s get more done
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/76 md:text-lg">
                  Sauvegarde ton planning, tes sessions et tes progres. Ou continue en invite si tu veux tester avant.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,17,25,0.88),rgba(35,18,38,0.72))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-8">
              {mode === 'choice' ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-white">Entre dans ton espace</h2>
                    <p className="text-sm leading-6 text-white/70">
                      Crée un compte pour synchroniser partout, ou continue sans compte pour utiliser l&apos;app en local.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <Button
                      onClick={() => setMode('signup')}
                      className="h-14 rounded-2xl bg-[#6A39FF] text-base text-white hover:bg-[#5D31E4]"
                    >
                      Créer un compte
                    </Button>
                    <Button
                      onClick={onContinueWithoutAccount}
                      className="h-14 rounded-2xl bg-[#272846] text-base text-white hover:bg-[#303257]"
                    >
                      Continuer sans compte
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-white/78">
                    Tu as deja un compte ?{' '}
                    <button type="button" onClick={() => setMode('login')} className="underline underline-offset-4">
                      Se connecter
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <div className="text-sm text-white/56">{mode === 'signup' ? 'Créer un compte' : 'Connexion'}</div>
                    <h2 className="text-3xl font-semibold text-white">
                      {mode === 'signup' ? 'Sauvegarde tes progrès' : 'Bon retour'}
                    </h2>
                    <p className="text-sm leading-6 text-white/70">
                      {mode === 'signup'
                        ? 'Ton dashboard sera synchronisé et disponible sur tous tes appareils.'
                        : 'Connecte-toi pour retrouver ton calendrier, ton minuteur et ton historique.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-white/48" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@example.com"
                        className="h-12 rounded-none border-0 border-b border-white/35 bg-transparent pl-8 pr-0 text-base text-white placeholder:text-white/40 focus-visible:ring-0"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-white/48" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={mode === 'signup' ? 'Créer un mot de passe' : 'Mot de passe'}
                        className="h-12 rounded-none border-0 border-b border-white/35 bg-transparent pl-8 pr-10 text-base text-white placeholder:text-white/40 focus-visible:ring-0"
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-white/55 hover:text-white"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error ? <div className="rounded-2xl bg-[#2A1B1B] px-4 py-3 text-sm text-[#FF9A7B]">{error}</div> : null}
                  {message ? (
                    <div className="rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
                      {message}
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-14 rounded-2xl bg-[#6A39FF] text-base text-white hover:bg-[#5D31E4]"
                    >
                      {isSubmitting ? 'Chargement...' : mode === 'signup' ? 'Continuer' : 'Se connecter'}
                    </Button>
                    <Button
                      type="button"
                      onClick={onContinueWithoutAccount}
                      className="h-14 rounded-2xl bg-[#272846] text-base text-white hover:bg-[#303257]"
                    >
                      Continuer sans compte
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/74">
                    <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="underline underline-offset-4">
                      {mode === 'signup' ? 'J’ai déjà un compte' : 'Créer un compte'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="underline underline-offset-4 text-white/60 hover:text-white"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
