import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import type { Profile } from "@/lib/types/database";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell role="creator" userName={`${profile.first_name} ${profile.last_name}`}>
      {children}
    </DashboardShell>
  );
}
