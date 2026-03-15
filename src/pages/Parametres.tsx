import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CircleUserRound,
  OctagonAlert,
  KeyRound,
  Mail,
  Save,
} from 'lucide-react';

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
  'bg-[#161924] border border-[#1F2230] rounded-3xl p-4 md:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)]';

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
    <div className="space-y-1.5">
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
      <div className="max-w-6xl mx-auto space-y-4">
        <Tabs defaultValue="profile" className="w-full">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <TabsList className="flex h-auto flex-wrap gap-2 rounded-3xl border border-[#1F2230] bg-[#161924] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.35),0_8px_18px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.04)]">
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
            </TabsList>

            <Button
              onClick={onBack}
              variant="ghost"
              className="rounded-xl border border-[#1F2230] bg-[#161924] text-[#ECECF3] hover:bg-[#1B2030]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>

          <TabsContent value="profile" className="mt-4">
            <div className="space-y-3">
            <Card className={`${cardClassName} space-y-2`}>
              <div>
                <h2 className="text-xl font-semibold text-[#ECECF3]">Profil scolaire</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
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

                <div>
                  <Label htmlFor="goals" className="text-[#ECECF3]">
                    Objectifs
                  </Label>
                  <Textarea
                    id="goals"
                    value={formData.lifeGoals}
                    onChange={(event) => setFormData((current) => ({ ...current, lifeGoals: event.target.value }))}
                    placeholder="Décris tes ambitions, tes projets ou ce que tu veux accomplir cette année."
                    className={`${inputClassName} min-h-[132px]`}
                  />
                </div>
              </div>

              {profileMessage ? (
                <div className="rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
                  {profileMessage}
                </div>
              ) : null}
            </Card>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  className="rounded-xl bg-[#4169E1] hover:bg-[#3557C1] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saved ? 'Sauvegardé' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="mt-4">
            <Card className={`${cardClassName} space-y-3`}>
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

          <TabsContent value="account" className="mt-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <Card className="bg-[#161924] border border-[#1F2230] rounded-3xl p-3 md:p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2.5 h-full flex flex-col">
                <div>
                  <h2 className="text-lg font-semibold text-[#ECECF3]">Changer l’email</h2>
                  <p className="text-xs leading-5 text-[#A9ACBA]">
                    Une confirmation à la nouvelle adresse sera envoyee avant le changement définitif.
                  </p>
                </div>

                <div>
                  <Label htmlFor="account-email" className="text-[#ECECF3] text-sm">
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

                <div className="pt-2 mt-auto">
                  <Button
                    onClick={handleEmailUpdate}
                    disabled={!user || isUpdatingEmail}
                    className="w-full h-10 rounded-xl bg-[#4169E1] hover:bg-[#3557C1] text-white"
                  >
                    {isUpdatingEmail ? 'Mise à jour...' : 'Mettre à jour l’email'}
                  </Button>
                </div>
              </Card>

              <Card className="bg-[#161924] border border-[#1F2230] rounded-3xl p-3 md:p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2.5 h-full flex flex-col">
                <div>
                  <h2 className="text-lg font-semibold text-[#ECECF3]">Changer le mot de passe</h2>
                </div>

                <div>
                  <Label htmlFor="new-password" className="text-[#ECECF3] text-sm">
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
                  <Label htmlFor="confirm-password" className="text-[#ECECF3] text-sm">
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

                <div className="pt-2 mt-auto">
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={!user || isUpdatingPassword}
                    className="w-full h-10 rounded-xl bg-[#6B9AC4] hover:bg-[#5A89B3] text-white"
                  >
                    {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </Button>
                </div>
              </Card>

              {accountError ? (
                <div className="lg:col-span-2 rounded-2xl bg-[#11141D] px-4 py-3 text-sm text-[#E16941]">
                  {accountError}
                </div>
              ) : null}

              {accountMessage ? (
                <div className="lg:col-span-2 rounded-2xl border border-[#29425B] bg-[#182332] px-4 py-3 text-sm text-[#9DD0FF]">
                  {accountMessage}
                </div>
              ) : null}

              {!user ? (
                <div className="lg:col-span-3 rounded-2xl border border-[#1F2230] bg-[#11141D] px-4 py-4 text-sm text-[#A9ACBA]">
                  Les réglages de sécurité du compte sont disponibles seulement après connexion à Supabase.
                </div>
              ) : null}

              <Card className="bg-[#161924] border border-[#1F2230] rounded-3xl p-3 md:p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2.5 h-full flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#10131B] border border-[#1F2230] flex items-center justify-center shrink-0">
                    <OctagonAlert className="w-4 h-4 text-[#E16941]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#ECECF3]">Supprimer le compte</h2>
                    <p className="text-xs leading-5 text-[#A9ACBA]">
                      Cette action est définitive et tu perdras l’accès à ton compte.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="delete-confirmation" className="text-[#ECECF3] text-sm">
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

                <div className="pt-2 mt-auto">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={!user || isDeletingAccount || deleteConfirmation.trim() !== 'SUPPRIMER'}
                    className="w-full h-10 rounded-xl bg-[#E16941] hover:bg-[#c95735] text-white"
                  >
                    {isDeletingAccount ? 'Suppression...' : 'Supprimer définitivement le compte'}
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
