import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Clock, CheckCircle } from "lucide-react";

export default async function CreatorDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: totalCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user!.id);

  const { count: draftCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user!.id)
    .eq("status", "draft");

  const { count: approvedCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user!.id)
    .eq("status", "approved");

  const stats = [
    { label: "Pitanja ukupno", value: totalCount ?? 0, icon: FileQuestion },
    { label: "Nacrti", value: draftCount ?? 0, icon: Clock },
    { label: "Odobreno", value: approvedCount ?? 0, icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Autor — pregled</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
