"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: "user",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
  }

  const inputClass =
    "border-white/10 bg-white/[0.04] text-[#ececf1] placeholder:text-[#5a5a64] focus-visible:ring-[#c8c8d4]/30";

  if (sent) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030304] px-4 py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-[#5a5a64]/20 blur-[100px]" />
          <div className="metal-noise absolute inset-0 opacity-[0.06]" />
        </div>
        <Card
          className={cn(
            "metal-edge relative w-full max-w-md rounded-2xl border-0 bg-[#08080a]/90 text-[#ececf1] backdrop-blur-sm"
          )}
        >
          <CardHeader className="text-center">
            <p className="font-display text-xs tracking-[0.3em] text-[#6b6b78]">E-POŠTA</p>
            <CardTitle className="font-display text-3xl tracking-[0.08em]">PROVJERA</CardTitle>
            <CardDescription className="text-[#8b8b96]">
              Poslali smo poveznicu. Otvori e-poštu i potvrdi račun.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030304] px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-[#8a8a98]/15 blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 h-80 w-80 rounded-full bg-[#5a5a64]/20 blur-[90px]" />
        <div className="metal-noise absolute inset-0 opacity-[0.06]" />
      </div>

      <Card
        className={cn(
          "metal-edge relative w-full max-w-md rounded-2xl border-0 bg-[#08080a]/90 text-[#ececf1] backdrop-blur-sm"
        )}
      >
        <CardHeader className="space-y-1 text-center">
          <p className="font-display text-xs tracking-[0.3em] text-[#6b6b78]">NOVI KORISNIK</p>
          <CardTitle className="font-display text-3xl tracking-[0.08em]">REGISTRACIJA</CardTitle>
          <CardDescription className="text-[#8b8b96]">
            Ime, prezime i e-pošta — ostalo dolazi samo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#9b9ba8]">
                  Ime
                </Label>
                <Input id="firstName" className={inputClass} {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-red-400">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#9b9ba8]">
                  Prezime
                </Label>
                <Input id="lastName" className={inputClass} {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#9b9ba8]">
                E-pošta
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ti@primjer.hr"
                className={inputClass}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#9b9ba8]">
                Lozinka
              </Label>
              <Input id="password" type="password" className={inputClass} {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full rounded-none border border-white/10 bg-gradient-to-b from-[#ececf1] to-[#9a9aa8] font-bold uppercase tracking-widest text-[#08080a] hover:brightness-110"
              disabled={loading}
            >
              {loading ? "…" : "Stvori račun"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#6b6b78]">
            Već imaš račun?{" "}
            <Link
              href="/auth/login"
              className="text-[#c8c8d4] underline-offset-4 hover:text-[#ececf1] hover:underline"
            >
              Prijava
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
