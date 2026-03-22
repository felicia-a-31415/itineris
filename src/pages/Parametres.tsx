import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CircleUserRound,
  OctagonAlert,
  KeyRound,
  Mail,
  Save,
} from 'lucide-react';

import { deleteAccount } from '../lib/account';
import { useAuth } from '../lib/auth';
import { clearDashboardDataFromLocal, clearUserData } from '../lib/storage';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface UserData {
  name: string;
  year: string;
  favoriteSubjects: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  lifeGoals: string;
}

interface ParametresScreenProps {
  onBack: () => void;
  userData: UserData;
  onSave: (data: UserData) => void;
}

const cardClassName =
  'app-panel rounded-3xl p-4 md:p-5';

const inputClassName =
  'app-input mt-2 rounded-xl';

export function Parametres({ onBack, userData, onSave }: ParametresScreenProps) {
  const { user, updateEmail, updatePassword, signOut } = useAuth();
  const [formData, setFormData] = useState<UserData>(userData);
  const [saved, setSaved] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    setFormData(userData);
  }, [userData]);

  useEffect(() => {
    setPendingEmail(user?.email ?? '');
  }, [user?.email]);

  const handleSaveProfile = () => {
    onSave(formData);
    setSaved(true);
    setProfileMessage('Profil mis à jour.');
    window.setTimeout(() => setSaved(false), 2000);
    window.setTimeout(() => setProfileMessage(null), 3000);
  };

  const handleEmailUpdate = async () => {
    setAccountError(null);
    setAccountMessage(null);

    const trimmedEmail = pendingEmail.trim();
    if (!user) {
      setAccountError('Connecte-toi pour modifier l’email du compte.');
      return;
    }
    if (!trimmedEmail) {
      setAccountError('Entre une adresse email valide.');
      return;
    }
    if (trimmedEmail === user.email) {
      setAccountMessage('Cet email est déjà associé à ton compte.');
      return;
    }

    setIsUpdatingEmail(true);
    const { error } = await updateEmail(trimmedEmail);
    setIsUpdatingEmail(false);

    if (error) {
      setAccountError(error.message);
      return;
    }

    setAccountMessage('Email de changement envoyé. Confirme la nouvelle adresse depuis ta boite de réception.');
  };

  const handlePasswordUpdate = async () => {
    setAccountError(null);
    setAccountMessage(null);

    if (!user) {
      setAccountError('Connecte-toi pour modifier le mot de passe du compte.');
      return;
    }
    if (newPassword.length < 6) {
      setAccountError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (error) {
      setAccountError(error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setAccountMessage('Mot de passe mis à jour.');
  };

  const handleDeleteAccount = async () => {
    setAccountError(null);
    setAccountMessage(null);

    if (!user) {
      setAccountError('Connecte-toi pour supprimer le compte.');
      return;
    }
    if (deleteConfirmation.trim() !== 'SUPPRIMER') {
      setAccountError('Tape SUPPRIMER pour confirmer la suppression du compte.');
      return;
    }

    setIsDeletingAccount(true);
    const { error } = await deleteAccount();
    setIsDeletingAccount(false);

    if (error) {
      setAccountError(error.message);
      return;
    }

    clearDashboardDataFromLocal(user.id);
    clearUserData();
    await signOut();
    window.location.assign(`${import.meta.env.BASE_URL ?? '/'}`);
  };

  return (
    <div className="app-shell min-h-screen p-4 text-[#F5F2F7] md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#F5F2F7]">Paramètres</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onBack}
              variant="ghost"
              className="h-11 rounded-xl border border-white/10 bg-[rgba(21,18,31,0.82)] px-4 text-sm text-[#F5F2F7] hover:bg-[rgba(37,29,54,0.92)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="h-11 rounded-xl px-4 text-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {saved ? 'Sauvegardé' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_1.25fr]">
          <Card className={`${cardClassName} space-y-4`}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#1F2230] bg-[#10131B]">
                <CircleUserRound className="h-5 w-5 text-[#F5F2F7]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#F5F2F7]">Profil</h2>
                <p className="text-sm leading-5 app-muted">
                  Les infos visibles dans ton espace de travail.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-[#F5F2F7]">
                  Prénom
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ton prénom"
                  className={inputClassName}
                />
              </div>

              <div>
                <Label className="text-[#F5F2F7]">
                  Compte
                </Label>
                <div className={`${inputClassName} min-h-[44px] px-4 py-3 text-sm app-muted`}>
                  {user?.email ?? 'Mode invité'}
                </div>
              </div>
            </div>

            {profileMessage ? (
              <div className="rounded-2xl border border-[#6d42ff]/30 bg-[#182332] px-4 py-3 text-sm text-[#d6c9ff]">
                {profileMessage}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className={`${cardClassName} space-y-3 h-full flex flex-col`}>
              <div className="flex items-start gap-3">
                <div className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl">
                  <Mail className="h-4 w-4 text-[#F5F2F7]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F5F2F7]">Email</h2>
                  <p className="text-xs leading-5 app-muted">
                    Une confirmation sera envoyée avant le changement définitif.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="account-email" className="text-[#F5F2F7] text-sm">
                  Adresse email
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/52" />
                  <Input
                    id="account-email"
                    type="email"
                    value={pendingEmail}
                    onChange={(event) => setPendingEmail(event.target.value)}
                    className={`${inputClassName} pl-10 mt-0`}
                    placeholder="ton@email.com"
                    disabled={!user || isUpdatingEmail}
                  />
                </div>
              </div>

              <div className="pt-1 mt-auto">
                <Button
                  onClick={handleEmailUpdate}
                  disabled={!user || isUpdatingEmail}
                  className="w-full h-10 rounded-xl"
                >
                  {isUpdatingEmail ? 'Mise à jour...' : 'Mettre à jour l’email'}
                </Button>
              </div>
            </Card>

            <Card className={`${cardClassName} space-y-3 h-full flex flex-col`}>
              <div className="flex items-start gap-3">
                <div className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl">
                  <KeyRound className="h-4 w-4 text-[#F5F2F7]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F5F2F7]">Mot de passe</h2>
                  <p className="text-xs leading-5 app-muted">
                    Utilise un mot de passe d’au moins 6 caractères.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="new-password" className="text-[#F5F2F7] text-sm">
                  Nouveau mot de passe
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={inputClassName}
                  placeholder="Au moins 6 caractères"
                  disabled={!user || isUpdatingPassword}
                />
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-[#F5F2F7] text-sm">
                  Confirme le mot de passe
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClassName}
                  placeholder="Répète le mot de passe"
                  disabled={!user || isUpdatingPassword}
                />
              </div>

              <div className="pt-1 mt-auto">
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={!user || isUpdatingPassword}
                  className="w-full h-10 rounded-xl app-secondary-btn"
                >
                  {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>
              </div>
            </Card>

            {accountError ? (
              <div className="md:col-span-2 rounded-2xl bg-[#11141D] px-4 py-3 text-sm text-[#ef8b82]">
                {accountError}
              </div>
            ) : null}

            {accountMessage ? (
              <div className="md:col-span-2 rounded-2xl border border-[#6d42ff]/30 bg-[#182332] px-4 py-3 text-sm text-[#d6c9ff]">
                {accountMessage}
              </div>
            ) : null}

            {!user ? (
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[rgba(17,20,29,0.84)] px-4 py-4 text-sm app-muted">
                Les réglages de sécurité du compte sont disponibles seulement après connexion à Supabase.
              </div>
            ) : null}

            <Card className={`${cardClassName} space-y-3 md:col-span-2`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[rgba(239,107,99,0.12)] border border-[#ef6b63]/30 flex items-center justify-center shrink-0">
                  <OctagonAlert className="w-4 h-4 text-[#ef6b63]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F5F2F7]">Supprimer le compte</h2>
                  <p className="text-xs leading-5 app-muted">
                    Cette action est définitive et tu perdras l’accès à ton compte.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <Label htmlFor="delete-confirmation" className="text-[#F5F2F7] text-sm">
                    Tape SUPPRIMER pour confirmer
                  </Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    className={inputClassName}
                    placeholder="SUPPRIMER"
                    disabled={!user || isDeletingAccount}
                  />
                </div>

                <Button
                  onClick={handleDeleteAccount}
                  disabled={!user || isDeletingAccount || deleteConfirmation.trim() !== 'SUPPRIMER'}
                  className="h-11 rounded-xl bg-[#ef6b63] px-4 hover:bg-[#e15d55] text-white md:min-w-[260px]"
                >
                  {isDeletingAccount ? 'Suppression...' : 'Supprimer définitivement le compte'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
