import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CATEGORY_LIST, DIFFICULTY_LEVELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const supabase = await createServiceRoleClient();

  const { count: totalCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const categoryStats: { category: string; count: number }[] = [];
  for (const cat of CATEGORY_LIST) {
    const { count } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("category", cat);
    if ((count ?? 0) > 0) {
      categoryStats.push({ category: cat, count: count ?? 0 });
    }
  }

  const difficultyStats: { difficulty: number; count: number }[] = [];
  for (const d of DIFFICULTY_LEVELS) {
    const { count } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("difficulty", d);
    difficultyStats.push({ difficulty: d, count: count ?? 0 });
  }

  const { data: bundlesData } = await supabase
    .from("bundles")
    .select("*")
    .eq("is_active", true)
    .order("question_count", { ascending: true });

  return NextResponse.json({
    total: totalCount ?? 0,
    categories: categoryStats,
    difficulties: difficultyStats,
    bundles: bundlesData ?? [],
  });
}
