import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Users, ShoppingCart, DollarSign } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: purchaseCount } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: pendingCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  const stats = [
    { label: "Pitanja ukupno", value: questionCount ?? 0, icon: FileQuestion },
    { label: "Korisnika", value: userCount ?? 0, icon: Users },
    { label: "Završene kupnje", value: purchaseCount ?? 0, icon: ShoppingCart },
    { label: "Na pregledu", value: pendingCount ?? 0, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Administracija — pregled</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
