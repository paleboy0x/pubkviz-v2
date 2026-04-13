import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nisi prijavljen." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  let query = supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (category) query = query.eq("category", category);
  if (difficulty) query = query.eq("difficulty", Number(difficulty));

  const { data: purchasedIds } = await supabase
    .from("user_questions")
    .select("question_id")
    .eq("user_id", user.id);

  const excludeIds = (purchasedIds ?? []).map((p) => p.question_id);
  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { count } = await query;

  return NextResponse.json({ available: count ?? 0 });
}
