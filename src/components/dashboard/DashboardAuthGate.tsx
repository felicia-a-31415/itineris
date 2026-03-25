import { useEffect, useState } from 'react';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

import { useAuth } from '../../lib/auth';

type ViewType = 'signup' | 'login';

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
  const [currentView, setCurrentView] = useState<ViewType>(initialMode ?? 'signup');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentView(initialMode ?? 'signup');
    setShowPassword(false);
  }, [open, initialMode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#080A11]/68 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-[12%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(81,60,255,0.42),rgba(81,60,255,0)_68%)]" />
        <div className="absolute right-[-10%] top-[-8%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,82,120,0.42),rgba(255,82,120,0)_70%)]" />
        <div className="absolute bottom-[-14%] left-[28%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),rgba(255,255,255,0)_72%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-[36rem] rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,13,26,0.96),rgba(76,16,58,0.72),rgba(221,73,102,0.64))] px-4 py-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)] md:px-6 md:py-7">
          <div className="relative z-10 flex items-center justify-center min-h-[21rem] px-3">
            <div className="w-full max-w-xl">
              {currentView === 'signup' ? (
                <SignupView
                  onSwitchToLogin={() => setCurrentView('login')}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  onContinueWithoutAccount={onContinueWithoutAccount}
                />
              ) : (
                <LoginView
                  onSwitchToSignup={() => setCurrentView('signup')}
                  onBack={() => setCurrentView('signup')}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SignupViewProps {
  onSwitchToLogin: () => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  onContinueWithoutAccount: () => void;
}

function SignupView({
  onSwitchToLogin,
  showPassword,
  onTogglePassword,
  onContinueWithoutAccount,
}: SignupViewProps) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleContinue = async () => {
    const trimmedEmail = email.trim();
    setError(null);
    setMessage(null);

    if (!trimmedEmail) {
      setError('Entre une adresse email valide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    const { error: authError } = await signUp(trimmedEmail, password);
    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage('Compte créé. Vérifie aussi ta boite mail si une confirmation est demandée.');
    void firstName;
  };

  return (
    <div className="text-white space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl tracking-tight md:text-5xl" style={{ fontWeight: 700 }}>
          Itineris
        </h1>
        <p className="text-lg text-white/90 md:text-xl">Votre chemin vers la réussite</p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-white/40 pb-2 px-1 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors md:text-lg"
          />
        </div>

        <div>
          <input
            type="email"
            placeholder="Courriel"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b-2 border-white/40 pb-2 px-1 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors md:text-lg"
          />
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b-2 border-white/40 pb-2 px-1 pr-10 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors md:text-lg"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="px-1 text-xs text-white/60">8+ characters, 1 uppercase letter, 1 number</p>
        </div>
      </div>

      {error ? <div className="text-sm text-white">{error}</div> : null}
      {message ? (
        <div className="rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
          {message}
        </div>
      ) : null}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-[#6366f1] px-4 py-3 text-lg text-white transition-colors hover:bg-[#5558e3] disabled:opacity-50 md:text-xl"
          style={{ fontWeight: 600 }}
        >
          {isSubmitting ? 'Chargement...' : 'Continue'}
        </button>
        <button
          type="button"
          onClick={onContinueWithoutAccount}
          className="flex-1 rounded-full bg-[#2d2d44] px-4 py-3 text-lg text-white transition-colors hover:bg-[#3a3a52] md:text-xl"
          style={{ fontWeight: 600 }}
        >
          Stay logged out ↗
        </button>
      </div>

      <div className="text-center text-sm md:text-base">
        <span className="text-white/90">Have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="underline text-white hover:text-white/80 transition-colors"
          style={{ fontWeight: 500 }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}

interface LoginViewProps {
  onSwitchToSignup: () => void;
  onBack: () => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}

function LoginView({ onSwitchToSignup, onBack, showPassword, onTogglePassword }: LoginViewProps) {
  const { signIn, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const getRecoveryRedirectUrl = () => {
    const basePath = import.meta.env.BASE_URL ?? '/';
    const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${window.location.origin}${normalizedBasePath}login?mode=recovery`;
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    setError(null);
    setMessage(null);

    if (!trimmedEmail) {
      setError('Entre une adresse email valide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    const { error: authError } = await signIn(trimmedEmail, password);
    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    setError(null);
    setMessage(null);

    if (!trimmedEmail) {
      setError("Entre ton email, puis relance l'envoi du lien de réinitialisation.");
      return;
    }

    setIsSubmitting(true);
    const { error: resetError } = await requestPasswordReset(trimmedEmail, getRecoveryRedirectUrl());
    setIsSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage('Courriel envoyé. Vérifie ta boite de réception pour choisir un nouveau mot de passe.');
  };

  return (
    <div className="text-white space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-white transition-colors hover:text-white/80 md:text-base"
      >
        <ChevronLeft size={18} />
        <span>Back</span>
      </button>

      <div className="space-y-2 text-center">
        <h1 className="text-4xl tracking-tight md:text-5xl" style={{ fontWeight: 700 }}>
          Rebonjour
        </h1>
        <p className="text-base text-white/90 md:text-lg">Connectez-vous avec votre compte Itineris.</p>
      </div>

      <div className="space-y-4 pt-3">
        <div>
          <input
            type="email"
            placeholder="Courriel"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b-2 border-white/40 pb-2 px-1 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors md:text-lg"
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b-2 border-white/40 pb-2 px-1 pr-10 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors md:text-lg"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error ? <div className="text-sm text-white">{error}</div> : null}
      {message ? (
        <div className="rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
          {message}
        </div>
      ) : null}

      <div className="pt-3">
        <button
          type="button"
          onClick={handleLogin}
          disabled={isSubmitting}
          className="w-full rounded-full bg-[#6366f1] px-4 py-3 text-lg text-white transition-colors hover:bg-[#5558e3] disabled:opacity-50 md:text-xl"
          style={{ fontWeight: 600 }}
        >
          {isSubmitting ? 'Chargement...' : 'Accéder au tableau de bord'}
        </button>
      </div>

      <div className="space-y-4 text-center">
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={isSubmitting}
          className="text-sm text-white/90 underline transition-colors hover:text-white disabled:opacity-50 md:text-base"
        >
          Mot de passe oublié ?
        </button>

        <div className="text-sm md:text-base">
          <span className="text-white/90">Pas encore de compte ? </span>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="underline text-white hover:text-white/80 transition-colors"
            style={{ fontWeight: 500 }}
          >
            Inscrivez-vous.
          </button>
        </div>
      </div>
    </div>
  );
}
