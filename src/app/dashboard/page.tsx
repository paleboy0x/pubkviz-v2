import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ShoppingCart, Package } from "lucide-react";
import Link from "next/link";

export default async function UserDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: questionCount } = await supabase
    .from("user_questions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: purchaseCount } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "completed");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Pregled</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Moja pitanja
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kupnje
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Još pitanja
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/buy"
              className={cn(buttonVariants(), "w-full")}
            >
              Paketi
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
