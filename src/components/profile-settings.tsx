"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  profileEmailSchema,
  profileNamesSchema,
  profilePasswordSchema,
  type ProfileEmailInput,
  type ProfileNamesInput,
  type ProfilePasswordInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export function ProfileSettings() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingNames, setSavingNames] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingDeletion, setSavingDeletion] = useState(false);
  const [deletionNote, setDeletionNote] = useState("");

  const namesForm = useForm<ProfileNamesInput>({
    resolver: zodResolver(profileNamesSchema),
  });

  const emailForm = useForm<ProfileEmailInput>({
    resolver: zodResolver(profileEmailSchema),
  });

  const passwordForm = useForm<ProfilePasswordInput>({
    resolver: zodResolver(profilePasswordSchema),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoadingProfile(false);
        return;
      }
      setAuthEmail(user.email ?? null);
      emailForm.reset({ email: user.email ?? "" });

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        setLoadingProfile(false);
        return;
      }
      const p = data as Profile;
      setProfile(p);
      namesForm.reset({ firstName: p.first_name, lastName: p.last_name });
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jednokratno učitavanje pri mountu
  }, []);

  async function onSaveNames(data: ProfileNamesInput) {
    if (!profile) return;
    setSavingNames(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
      })
      .eq("id", profile.id);
    setSavingNames(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile((prev) =>
      prev ? { ...prev, first_name: data.firstName, last_name: data.lastName } : prev
    );
    toast.success("Profil je ažuriran.");
  }

  async function onChangeEmail(data: ProfileEmailInput) {
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: data.email });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Potvrdi novu adresu na e-pošti (link koji smo poslali).");
  }

  async function onChangePassword(data: ProfilePasswordInput) {
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    passwordForm.reset({ newPassword: "", confirmPassword: "" });
    toast.success("Lozinka je promijenjena.");
  }

  async function onRequestDeletion() {
    if (!profile) return;
    if (profile.deletion_requested_at) {
      toast.info("Zahtjev je već poslan.");
      return;
    }
    const ok = window.confirm(
      "Jesi li siguran/na? Nakon brisanja računa gubiš pristup kupljenim pitanjima i povijesti kupnji. Nastaviti?"
    );
    if (!ok) return;
    setSavingDeletion(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        deletion_requested_at: new Date().toISOString(),
        deletion_request_note: deletionNote.trim() || null,
      })
      .eq("id", profile.id);
    setSavingDeletion(false);
    if (error) {
      if (error.message.includes("deletion_requested") || error.code === "PGRST204") {
        toast.error(
          "Baza još nema stupce za zahtjev brisanja. Pokreni migraciju 002_profile_deletion_request.sql."
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            deletion_requested_at: new Date().toISOString(),
            deletion_request_note: deletionNote.trim() || null,
          }
        : prev
    );
    toast.success("Zahtjev za brisanje zapisan. Javit ćemo ti se e-poštom.");
  }

  if (loadingProfile) {
    return <p className="text-sm text-muted-foreground">Učitavanje profila…</p>;
  }

  if (!profile) {
    return <p className="text-sm text-destructive">Profil nije učitan.</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle>Ime i prezime</CardTitle>
          <CardDescription>Prikazuje se u aplikaciji i na računima.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={namesForm.handleSubmit(onSaveNames)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ime</Label>
                <Input id="firstName" {...namesForm.register("firstName")} />
                {namesForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {namesForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Prezime</Label>
                <Input id="lastName" {...namesForm.register("lastName")} />
                {namesForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {namesForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={savingNames}>
              {savingNames ? "Spremanje…" : "Spremi"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle>E-pošta za prijavu</CardTitle>
          <CardDescription>
            Trenutno: <span className="text-foreground">{authEmail ?? "—"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Nova adresa</Label>
              <Input id="newEmail" type="email" {...emailForm.register("email")} />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" variant="secondary" disabled={savingEmail}>
              {savingEmail ? "Šaljem…" : "Zatraži promjenu e-pošte"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle>Lozinka</CardTitle>
          <CardDescription>Nova lozinka zamjenjuje staru za ovaj račun.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova lozinka</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" {...passwordForm.register("newPassword")} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Ponovi lozinku</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" variant="secondary" disabled={savingPassword}>
              {savingPassword ? "Spremanje…" : "Promijeni lozinku"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-500/25 bg-red-950/10">
        <CardHeader>
          <CardTitle className="text-red-200/95">Brisanje podataka</CardTitle>
          <CardDescription className="text-red-200/70">
            Možeš zatražiti brisanje računa i osobnih podataka.{" "}
            <strong className="font-medium text-red-100">
              Gubiš pristup svim dodijeljenim pitanjima, povijesti kupnji i sadržaju vezanom uz račun
            </strong>
            — to se ne može poništiti nakon što administrator obriše račun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.deletion_requested_at ? (
            <p className="text-sm text-red-100/90">
              Zahtjev poslan: {new Date(profile.deletion_requested_at).toLocaleString("hr-HR")}
              {profile.deletion_request_note ? (
                <>
                  <br />
                  <span className="text-red-200/70">Napomena: {profile.deletion_request_note}</span>
                </>
              ) : null}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="deletionNote">Napomena (opcionalno)</Label>
                <Textarea
                  id="deletionNote"
                  rows={3}
                  placeholder="Razlog ili dodatne napomene za podršku…"
                  value={deletionNote}
                  onChange={(e) => setDeletionNote(e.target.value)}
                  className="resize-none border-white/10 bg-black/30"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                disabled={savingDeletion}
                onClick={() => void onRequestDeletion()}
              >
                {savingDeletion ? "Šaljem…" : "Zatraži brisanje računa"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-white/10" />
      <p className="text-center text-xs text-muted-foreground">
        Za hitna pitanja o osobnim podacima kontaktiraj podršku putem e-pošte navedene na stranici.
      </p>
    </div>
  );
}
