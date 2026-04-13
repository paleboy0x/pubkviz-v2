import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import crypto from "crypto";

function verifyPaddleSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PADDLE_WEBHOOK_SECRET) return false;

  const parts = signature.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key === "ts") acc.ts = value;
      if (key === "h1") acc.h1 = value;
      return acc;
    },
    { ts: "", h1: "" }
  );

  const payload = `${parts.ts}:${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.PADDLE_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(parts.h1),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (process.env.NODE_ENV === "production" && !verifyPaddleSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Neispravan potpis." }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event_type !== "transaction.completed") {
    return NextResponse.json({ received: true });
  }

  const transactionId = event.data?.id;
  const customData = event.data?.custom_data;

  if (!customData?.purchase_id || !customData?.user_id) {
    console.error("Missing custom_data in Paddle webhook", event.data);
    return NextResponse.json({ error: "Missing custom data" }, { status: 400 });
  }

  const purchaseId = customData.purchase_id;
  const userId = customData.user_id;

  const supabase = await createServiceRoleClient();

  // Update purchase with transaction ID
  const { error: updateError } = await supabase
    .from("purchases")
    .update({ paddle_transaction_id: transactionId })
    .eq("id", purchaseId)
    .eq("status", "pending");

  if (updateError) {
    console.error("Failed to update purchase:", updateError);
    return NextResponse.json({ error: "Ažuriranje kupnje nije uspjelo." }, { status: 500 });
  }

  // Load purchase to get filters and bundle count
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*, bundle:bundles!bundle_id(*)")
    .eq("id", purchaseId)
    .single();

  if (!purchase || !purchase.bundle) {
    console.error("Purchase or bundle not found:", purchaseId);
    return NextResponse.json({ error: "Kupnja nije pronađena." }, { status: 404 });
  }

  const bundle = purchase.bundle as { question_count: number };

  // Assign questions atomically via database function
  const { error: assignError } = await supabase.rpc("assign_questions", {
    p_user_id: userId,
    p_purchase_id: purchaseId,
    p_count: bundle.question_count,
    p_category: purchase.category_filter,
    p_difficulty: purchase.difficulty_filter,
  });

  if (assignError) {
    console.error("Question assignment failed:", assignError);
    await supabase
      .from("purchases")
      .update({ status: "failed" })
      .eq("id", purchaseId);
    return NextResponse.json({ error: "Dodjela pitanja nije uspjela." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
