"use client";

import { useEffect, useState, useCallback } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CATEGORY_LIST, DIFFICULTY_LEVELS, formatCategoryLabel } from "@/lib/constants";
import { toast } from "sonner";
import type { Bundle } from "@/lib/types/database";

export default function BuyPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [category, setCategory] = useState<string>("any");
  const [difficulty, setDifficulty] = useState<string>("any");
  const [available, setAvailable] = useState<number | null>(null);
  const [loadingBundle, setLoadingBundle] = useState<string | null>(null);
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const supabase = createClient();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
    if (!token || token.includes("your-paddle")) {
      return;
    }
    const environment =
      process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
    void initializePaddle({ environment, token }).then(setPaddle);
  }, []);

  const loadBundles = useCallback(async () => {
    const { data } = await supabase
      .from("bundles")
      .select("*")
      .eq("is_active", true)
      .order("question_count", { ascending: true });
    setBundles((data ?? []) as Bundle[]);
  }, [supabase]);

  const checkAvailability = useCallback(async () => {
    const params = new URLSearchParams();
    if (category !== "any") params.set("category", category);
    if (difficulty !== "any") params.set("difficulty", difficulty);

    const res = await fetch(`/api/questions/availability?${params}`);
    const data = await res.json();
    setAvailable(data.available ?? 0);
  }, [category, difficulty]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  async function handleBuy(bundle: Bundle) {
    setLoadingBundle(bundle.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Prvo se prijavi.");
      setLoadingBundle(null);
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bundleId: bundle.id,
        category: category !== "any" ? category : null,
        difficulty: difficulty !== "any" ? Number(difficulty) : null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error);
      setLoadingBundle(null);
      return;
    }

    if (!paddle) {
      toast.error("Plaćanja nisu konfigurirana (Paddle token). Provjeri .env.local.");
      setLoadingBundle(null);
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId: data.paddlePriceId, quantity: 1 }],
      customData: {
        purchase_id: data.purchaseId,
        user_id: user.id,
      },
      customer: { email: user.email! },
      settings: {
        successUrl: `${window.location.origin}/dashboard/purchases?success=true`,
      },
    });

    setLoadingBundle(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Kupnja pitanja</h1>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2 min-w-[200px]">
          <Label>Kategorija (opcionalno)</Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? "any")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Bilo koja kategorija</SelectItem>
              {CATEGORY_LIST.map((c) => (
                <SelectItem key={c} value={c}>
                  {formatCategoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-[160px]">
          <Label>Težina (opcionalno)</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "any")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Bilo koja težina</SelectItem>
              {DIFFICULTY_LEVELS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Razina {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {available !== null && (
          <p className="text-sm text-muted-foreground pb-2">
            <span className="font-medium text-foreground">{available}</span> dostupnih pitanja
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bundles.map((bundle) => {
          const isDisabled = available !== null && available < bundle.question_count;
          return (
            <Card
              key={bundle.id}
              className={isDisabled ? "opacity-60" : ""}
            >
              <CardHeader>
                <CardTitle>{bundle.name}</CardTitle>
                <CardDescription>
                  {bundle.question_count} pitanja u paketu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  disabled={isDisabled || loadingBundle === bundle.id}
                  onClick={() => handleBuy(bundle)}
                >
                  {loadingBundle === bundle.id
                    ? "…"
                    : isDisabled
                    ? "Nema dovoljno pitanja"
                    : "Kupi"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {bundles.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            Trenutačno nema dostupnih paketa.
          </p>
        )}
      </div>
    </div>
  );
}
