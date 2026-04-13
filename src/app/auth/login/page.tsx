"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        toast.error("Nedostaju Supabase postavke na serveru. U Vercelu dodaj NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Prijava nije potvrđena. Pokušaj ponovo.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      router.refresh();

      if (profile?.role === "admin") {
        router.push("/admin");
      } else if (profile?.role === "creator") {
        router.push("/creator");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030304] px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#5a5a64]/20 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#8a8a98]/15 blur-[90px]" />
        <div className="metal-noise absolute inset-0 opacity-[0.06]" />
      </div>

      <Card
        className={cn(
          "metal-edge relative w-full max-w-md rounded-2xl border-0 bg-[#08080a]/90 text-[#ececf1] shadow-2xl backdrop-blur-sm"
        )}
      >
        <CardHeader className="space-y-1 text-center">
          <p className="font-display text-xs tracking-[0.3em] text-[#6b6b78]">PRIJAVA</p>
          <CardTitle className="font-display text-3xl tracking-[0.08em]">DOBRO DOŠAO</CardTitle>
          <CardDescription className="text-[#8b8b96]">
            E-pošta i lozinka za ulaz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#9b9ba8]">
                E-pošta
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ti@primjer.hr"
                className="border-white/10 bg-white/[0.04] text-[#ececf1] placeholder:text-[#5a5a64] focus-visible:ring-[#c8c8d4]/30"
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
              <Input
                id="password"
                type="password"
                className="border-white/10 bg-white/[0.04] text-[#ececf1] focus-visible:ring-[#c8c8d4]/30"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full rounded-none border border-white/10 bg-gradient-to-b from-[#ececf1] to-[#9a9aa8] font-bold uppercase tracking-widest text-[#08080a] hover:brightness-110"
              disabled={loading}
            >
              {loading ? "…" : "Ulaz"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#6b6b78]">
            Nemaš račun?{" "}
            <Link
              href="/auth/register"
              className="text-[#c8c8d4] underline-offset-4 hover:text-[#ececf1] hover:underline"
            >
              Registracija
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
