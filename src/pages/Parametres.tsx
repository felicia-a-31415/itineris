import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CircleUserRound,
  OctagonAlert,
  KeyRound,
  Mail,
  Palette,
  Save,
  ShieldCheck,
} from 'lucide-react';

import { BrandLogo } from '../components/BrandLogo';
import { deleteAccount } from '../lib/account';
import { useAuth } from '../lib/auth';
import { clearDashboardDataFromLocal, clearUserData } from '../lib/storage';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

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

const years = ['Secondaire 1', 'Secondaire 2', 'Secondaire 3', 'Secondaire 4', 'Secondaire 5'];

const cardClassName =
  'bg-[#161924] border border-[#1F2230] rounded-3xl p-6 md:p-8 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)]';

const inputClassName =
  'mt-2 rounded-xl bg-[#0F1117] border-[#1F2230] text-[#ECECF3] placeholder:text-[#6F7487] focus:border-[#4169E1]';

function getSubjectsForYear(year: string): string[] {
  if (year === 'Secondaire 1' || year === 'Secondaire 2') {
    return [
      'Mathématiques',
      'Anglais',
      'Français',
      'Géographie',
      'Histoire',
      'Latin',
      'Espagnol',
      'Arts plastiques',
      'Sciences',
      'CCQ',
      'Éducation physique',
      'Autre',
    ];
  }

  if (year === 'Secondaire 3' || year === 'Secondaire 4') {
    return [
      'Mathématiques',
      'Anglais',
      'Français',
      'Histoire',
      'Latin',
      'Espagnol',
      'Arts plastiques',
      'Sciences',
      'CCQ',
      'Éducation physique',
      'Autre',
    ];
  }

  if (year === 'Secondaire 5') {
    return [
      'Mathématiques',
      'Anglais',
      'Français',
      'Arts plastiques',
      'Chimie',
      'Physique',
      'Histoire du XXe siècle',
      'Culture et société',
      'CCQ',
      'Éducation physique',
      'Autre',
    ];
  }

  return [];
}

type SubjectCategory = 'favoriteSubjects' | 'strongSubjects' | 'weakSubjects';

function SubjectSection({
  title,
  subjects,
  selectedSubjects,
  accentClassName,
  onToggle,
}: {
  title: string;
  subjects: string[];
  selectedSubjects: string[];
  accentClassName: string;
  onToggle: (subject: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-[#ECECF3] block">{title}</Label>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => {
          const isSelected = selectedSubjects.includes(subject);
          return (
            <Badge
              key={subject}
              onClick={() => onToggle(subject)}
              className={`cursor-pointer rounded-xl px-3 py-2 border transition-all ${
                isSelected
                  ? `${accentClassName} text-white border-transparent`
                  : 'bg-[#10131B] text-[#ECECF3] border-[#1F2230] hover:border-[#4169E1]'
              }`}
            >
              {isSelected ? <Check className="w-3 h-3 mr-1 inline" /> : null}
              {subject}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

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

  const subjects = useMemo(() => getSubjectsForYear(formData.year), [formData.year]);

  const toggleSubject = (category: SubjectCategory, subject: string) => {
    setFormData((current) => {
      const selected = current[category];
      const next = selected.includes(subject)
        ? selected.filter((item) => item !== subject)
        : [...selected, subject];
      return { ...current, [category]: next };
    });
  };

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
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo className="w-14 h-14 shrink-0" />
            <div>
              <p className="text-sm text-[#A9ACBA]">Centre de réglages</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#ECECF3]">Paramètres du compte</h1>
              <p className="text-sm text-[#A9ACBA]">
                Mets à jour ton profil, tes préférences scolaires et la sécurité de ton compte.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onBack}
              variant="ghost"
              className="rounded-xl border border-[#1F2230] bg-[#161924] text-[#ECECF3] hover:bg-[#1B2030]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="rounded-xl bg-[#4169E1] hover:bg-[#3557C1] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saved ? 'Sauvegardé' : 'Sauvegarder le profil'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className={`${cardClassName} gap-3`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#10131B] border border-[#1F2230] flex items-center justify-center">
                <CircleUserRound className="w-5 h-5 text-[#9DD0FF]" />
              </div>
              <div>
                <p className="text-sm text-[#A9ACBA]">Profil</p>
                <p className="text-base font-medium">{formData.name || 'Nom à compléter'}</p>
              </div>
            </div>
            <p className="text-sm text-[#A9ACBA]">{formData.year || 'Niveau scolaire non défini'}</p>
          </Card>

          <Card className={`${cardClassName} gap-3`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#10131B] border border-[#1F2230] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#6B9AC4]" />
              </div>
              <div>
                <p className="text-sm text-[#A9ACBA]">Matières suivies</p>
                <p className="text-base font-medium">{subjects.length} disponibles</p>
              </div>
            </div>
            <p className="text-sm text-[#A9ACBA]">
              {formData.favoriteSubjects.length} favorites, {formData.strongSubjects.length} fortes, {formData.weakSubjects.length} à améliorer
            </p>
          </Card>

          <Card className={`${cardClassName} gap-3`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#10131B] border border-[#1F2230] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#41E169]" />
              </div>
              <div>
                <p className="text-sm text-[#A9ACBA]">Compte</p>
                <p className="text-base font-medium">{user ? 'Supabase connecté' : 'Mode invité'}</p>
              </div>
            </div>
            <p className="text-sm text-[#A9ACBA]">{user?.email ?? 'Connecte-toi pour modifier email et mot de passe.'}</p>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="flex h-auto flex-wrap gap-2 rounded-3xl border border-[#1F2230] bg-[#161924] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35),0_8px_18px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.04)]">
            <TabsTrigger
              value="profile"
              className="rounded-2xl px-4 py-2 text-[#A9ACBA] data-[state=active]:bg-[#10131B] data-[state=active]:text-[#ECECF3]"
            >
              <CircleUserRound className="w-4 h-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger
              value="subjects"
              className="rounded-2xl px-4 py-2 text-[#A9ACBA] data-[state=active]:bg-[#10131B] data-[state=active]:text-[#ECECF3]"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Matières
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="rounded-2xl px-4 py-2 text-[#A9ACBA] data-[state=active]:bg-[#10131B] data-[state=active]:text-[#ECECF3]"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Compte
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-2xl px-4 py-2 text-[#A9ACBA] data-[state=active]:bg-[#10131B] data-[state=active]:text-[#ECECF3]"
            >
              <Palette className="w-4 h-4 mr-2" />
              Apparence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className={`${cardClassName} space-y-6`}>
              <div>
                <h2 className="text-xl font-semibold text-[#ECECF3]">Profil scolaire</h2>
                <p className="text-sm text-[#A9ACBA]">Ces informations personnalisent ton tableau de bord et tes recommandations.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="text-[#ECECF3]">
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
                  <Label htmlFor="year" className="text-[#ECECF3]">
                    Niveau scolaire
                  </Label>
                  <Select value={formData.year} onValueChange={(value) => setFormData((current) => ({ ...current, year: value }))}>
                    <SelectTrigger id="year" className={inputClassName}>
                      <SelectValue placeholder="Sélectionne ton niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="goals" className="text-[#ECECF3]">
                  Objectifs
                </Label>
                <Textarea
                  id="goals"
                  value={formData.lifeGoals}
                  onChange={(event) => setFormData((current) => ({ ...current, lifeGoals: event.target.value }))}
                  placeholder="Décris tes ambitions, tes projets ou ce que tu veux accomplir cette année."
                  className={`${inputClassName} min-h-[160px]`}
                />
              </div>

              {profileMessage ? (
                <div className="rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
                  {profileMessage}
                </div>
              ) : null}
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="mt-6">
            <Card className={`${cardClassName} space-y-6`}>
              <div>
                <h2 className="text-xl font-semibold text-[#ECECF3]">Préférences de matières</h2>
                <p className="text-sm text-[#A9ACBA]">Ajuste tes matières pour garder le tableau de bord et l’onboarding synchronisés.</p>
              </div>

              <SubjectSection
                title="Matières préférées"
                subjects={subjects}
                selectedSubjects={formData.favoriteSubjects}
                accentClassName="bg-[#4169E1] hover:bg-[#3557C1]"
                onToggle={(subject) => toggleSubject('favoriteSubjects', subject)}
              />
              <SubjectSection
                title="Matières fortes"
                subjects={subjects}
                selectedSubjects={formData.strongSubjects}
                accentClassName="bg-[#6B9AC4] hover:bg-[#5A89B3]"
                onToggle={(subject) => toggleSubject('strongSubjects', subject)}
              />
              <SubjectSection
                title="Matières à améliorer"
                subjects={subjects}
                selectedSubjects={formData.weakSubjects}
                accentClassName="bg-[#8B8680] hover:bg-[#7A756F]"
                onToggle={(subject) => toggleSubject('weakSubjects', subject)}
              />
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className={`${cardClassName} space-y-5`}>
                <div>
                  <h2 className="text-xl font-semibold text-[#ECECF3]">Changer l’email</h2>
                  <p className="text-sm text-[#A9ACBA]">
                    Supabase enverra une confirmation à la nouvelle adresse avant le changement définitif.
                  </p>
                </div>

                <div>
                  <Label htmlFor="account-email" className="text-[#ECECF3]">
                    Adresse email
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9ACBA]" />
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

                <Button
                  onClick={handleEmailUpdate}
                  disabled={!user || isUpdatingEmail}
                  className="w-full rounded-xl bg-[#4169E1] hover:bg-[#3557C1] text-white"
                >
                  {isUpdatingEmail ? 'Mise à jour...' : 'Mettre à jour l’email'}
                </Button>
              </Card>

              <Card className={`${cardClassName} space-y-5`}>
                <div>
                  <h2 className="text-xl font-semibold text-[#ECECF3]">Changer le mot de passe</h2>
                  <p className="text-sm text-[#A9ACBA]">
                    Utilise un mot de passe plus long et unique pour protéger ton compte Itineris.
                  </p>
                </div>

                <div>
                  <Label htmlFor="new-password" className="text-[#ECECF3]">
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
                  <Label htmlFor="confirm-password" className="text-[#ECECF3]">
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

                <Button
                  onClick={handlePasswordUpdate}
                  disabled={!user || isUpdatingPassword}
                  className="w-full rounded-xl bg-[#6B9AC4] hover:bg-[#5A89B3] text-white"
                >
                  {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>
              </Card>

              {accountError ? (
                <div className="lg:col-span-2 rounded-2xl border border-[#4C2A2A] bg-[#2A1B1B] px-4 py-3 text-sm text-[#E16941]">
                  {accountError}
                </div>
              ) : null}

              {accountMessage ? (
                <div className="lg:col-span-2 rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
                  {accountMessage}
                </div>
              ) : null}

              {!user ? (
                <div className="lg:col-span-2 rounded-2xl border border-[#1F2230] bg-[#11141D] px-4 py-4 text-sm text-[#A9ACBA]">
                  Les réglages de sécurité du compte sont disponibles seulement après connexion à Supabase.
                </div>
              ) : null}

              <Card className={`${cardClassName} space-y-5 lg:col-span-2 border-[#4C2A2A]`}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#2A1B1B] border border-[#4C2A2A] flex items-center justify-center shrink-0">
                    <OctagonAlert className="w-5 h-5 text-[#E16941]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#ECECF3]">Supprimer le compte</h2>
                    <p className="text-sm text-[#A9ACBA]">
                      Cette action est définitive. Elle supprimera l’utilisateur Supabase et tu perdras l’accès à ton compte.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#4C2A2A] bg-[#2A1B1B] px-4 py-3 text-sm text-[#F1B2A1]">
                  Tes données locales seront effacées sur cet appareil. La suppression du compte lui-même passe par une Edge Function sécurisée côté Supabase.
                </div>

                <div>
                  <Label htmlFor="delete-confirmation" className="text-[#ECECF3]">
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
                  className="w-full rounded-xl bg-[#E16941] hover:bg-[#c95735] text-white"
                >
                  {isDeletingAccount ? 'Suppression...' : 'Supprimer définitivement le compte'}
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <Card className={`${cardClassName} text-center py-12 space-y-3`}>
              <div className="w-14 h-14 rounded-2xl bg-[#10131B] shadow-inner border border-[#1F2230] mx-auto flex items-center justify-center">
                <Palette className="w-7 h-7 text-[#4169E1]" />
              </div>
              <h2 className="text-xl font-semibold text-[#ECECF3]">Apparence</h2>
              <p className="text-[#A9ACBA] max-w-2xl mx-auto text-sm">
                Cette section est prête pour les prochaines options visuelles. Le style a déjà été aligné avec le tableau de bord pour garder la même identité dans tout le produit.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
