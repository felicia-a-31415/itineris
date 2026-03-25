import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Mail } from 'lucide-react';

import { useAuth } from '../../lib/auth';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

type AuthMode = 'choice' | 'signup' | 'login' | 'reset';

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
  const { signIn, signUp, requestPasswordReset } = useAuth();
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

  const getRecoveryRedirectUrl = () => {
    const basePath = import.meta.env.BASE_URL ?? '/';
    const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${window.location.origin}${normalizedBasePath}login?mode=recovery`;
  };

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

    if (mode === 'reset') {
      const { error: resetError } = await requestPasswordReset(trimmedEmail, getRecoveryRedirectUrl());
      setIsSubmitting(false);

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage('Email envoyé. Vérifie ta boite de réception puis ouvre le lien pour choisir un nouveau mot de passe.');
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
        <div className="w-full max-w-[34rem] rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,13,26,0.96),rgba(76,16,58,0.72),rgba(221,73,102,0.64))] px-6 py-7 text-white shadow-[0_32px_90px_rgba(0,0,0,0.55)] md:min-h-[34rem] md:px-9 md:py-8">
          <div className="mx-auto flex h-full max-w-[28rem] flex-col justify-center">
            {mode === 'choice' ? (
              <div className="space-y-6 text-center">
                <div className="space-y-3">
                  <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">Itineris</h1>
                  <p className="text-lg text-white/84 md:text-xl">Votre chemin vers la réussite</p>
                </div>
                <div className="grid gap-3 pt-2">
                  <Button
                    onClick={() => setMode('signup')}
                    className="h-14 rounded-[22px] bg-[#6A39FF] text-lg text-white hover:bg-[#5D31E4]"
                  >
                    Créer un compte
                  </Button>
                  <Button
                    onClick={onContinueWithoutAccount}
                    className="h-14 rounded-[22px] bg-[#2b2d56] text-lg text-white hover:bg-[#333663]"
                  >
                    Continuer sans compte
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-base text-white/80">
                  Tu as deja un compte ?{' '}
                  <button type="button" onClick={() => setMode('login')} className="underline underline-offset-4">
                    Se connecter
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-center">
                <div className="space-y-3">
                  <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">Itineris</h1>
                  <p className="text-lg text-white/84 md:text-xl">
                    {mode === 'reset' ? 'Récupère l’accès à ton compte' : 'Votre chemin vers la réussite'}
                  </p>
                </div>

                <div className="space-y-5 pt-2 text-left">
                  {mode === 'signup' ? (
                    <div className="relative">
                      <Input
                        value=""
                        readOnly
                        placeholder="Prénom"
                        className="h-12 rounded-none border-0 border-b border-white/42 bg-transparent px-0 text-[1.8rem] leading-none text-white placeholder:text-white/46 focus-visible:ring-0"
                        tabIndex={-1}
                      />
                    </div>
                  ) : null}

                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Courriel"
                      className="h-12 rounded-none border-0 border-b border-white/42 bg-transparent px-0 text-[1.8rem] leading-none text-white placeholder:text-white/46 focus-visible:ring-0"
                      disabled={isSubmitting}
                      required
                    />
                    <Mail className="pointer-events-none absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 text-white/0" />
                  </div>

                  {mode !== 'reset' ? (
                    <div className="relative">
                      <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Mot de passe"
                          className="h-12 rounded-none border-0 border-b border-white/42 bg-transparent px-0 pr-12 text-[1.8rem] leading-none text-white placeholder:text-white/46 focus-visible:ring-0"
                          disabled={isSubmitting}
                          required
                        />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-white/88 hover:text-white"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                      </button>
                    </div>
                  ) : null}
                </div>

                {error ? <div className="rounded-2xl bg-[#2A1B1B] px-4 py-3 text-sm text-[#FF9A7B]">{error}</div> : null}
                {message ? (
                  <div className="rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
                    {message}
                  </div>
                ) : null}

                <div className="flex items-center justify-center gap-3 pt-1 text-base text-white/78">
                  <button
                    type="button"
                    onClick={() => (mode === 'reset' ? setMode('login') : setMode('reset'))}
                    className="inline-flex items-center gap-2 underline underline-offset-4"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#6A39FF] text-base font-semibold text-white">
                      ✓
                    </span>
                    {mode === 'reset' ? 'Retour à la connexion' : 'Mot de passe oublié'}
                  </button>
                </div>

                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-14 rounded-[22px] bg-[#6A39FF] text-lg text-white hover:bg-[#5D31E4]"
                  >
                    {isSubmitting
                      ? 'Chargement...'
                      : mode === 'signup'
                        ? 'Continuer'
                        : mode === 'reset'
                          ? 'Envoyer le lien'
                          : 'Se connecter'}
                  </Button>
                  <Button
                    type="button"
                    onClick={onContinueWithoutAccount}
                    className="h-14 rounded-[22px] bg-[#2b2d56] text-lg text-white hover:bg-[#333663]"
                  >
                    Continuer sans compte
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="text-base text-white/80">
                  {mode === 'signup' ? 'Tu as déjà un compte ? ' : 'Pas encore de compte ? '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                    className="underline underline-offset-4"
                  >
                    {mode === 'signup' ? 'Se connecter' : 'Créer un compte'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
