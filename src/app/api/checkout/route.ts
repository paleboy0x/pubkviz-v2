import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { purchaseFilterSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bundleId, category, difficulty } = body;

  if (!bundleId) {
    return NextResponse.json({ error: "Bundle ID required" }, { status: 400 });
  }

  const filterParsed = purchaseFilterSchema.safeParse({ category, difficulty });
  if (!filterParsed.success) {
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  const { data: bundle } = await supabase
    .from("bundles")
    .select("*")
    .eq("id", bundleId)
    .eq("is_active", true)
    .single();

  if (!bundle) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  // Check availability before creating purchase
  let availQuery = supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (category) availQuery = availQuery.eq("category", category);
  if (difficulty) availQuery = availQuery.eq("difficulty", Number(difficulty));

  // Exclude already purchased
  const { data: purchasedIds } = await supabase
    .from("user_questions")
    .select("question_id")
    .eq("user_id", user.id);

  const excludeIds = (purchasedIds ?? []).map((p) => p.question_id);

  if (excludeIds.length > 0) {
    availQuery = availQuery.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { count: availableCount } = await availQuery;

  if ((availableCount ?? 0) < bundle.question_count) {
    return NextResponse.json(
      {
        error: `Not enough questions available. Need ${bundle.question_count}, but only ${availableCount ?? 0} are available for your filters.`,
      },
      { status: 400 }
    );
  }

  // Create pending purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      bundle_id: bundleId,
      status: "pending",
      category_filter: category || null,
      difficulty_filter: difficulty ? Number(difficulty) : null,
    })
    .select()
    .single();

  if (purchaseError) {
    return NextResponse.json({ error: purchaseError.message }, { status: 500 });
  }

  return NextResponse.json({
    purchaseId: purchase.id,
    paddlePriceId: bundle.paddle_price_id,
  });
}
