"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DIFFICULTY_LABELS_HR, formatCategoryLabel } from "@/lib/constants";

interface PurchaseRow {
  id: string;
  status: string;
  created_at: string;
  category_filter: string | null;
  difficulty_filter: number | null;
  bundle: { name: string; question_count: number } | null;
}

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const supabase = createClient();

  const loadPurchases = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("purchases")
      .select("id, status, created_at, category_filter, difficulty_filter, bundle:bundles!bundle_id(name, question_count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPurchases((data ?? []) as unknown as PurchaseRow[]);
  }, [supabase]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Povijest kupnji</h1>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Pitanja</TableHead>
              <TableHead>Kategorija</TableHead>
              <TableHead>Težina</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Još nema kupnji.
                </TableCell>
              </TableRow>
            )}
            {purchases.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{new Date(p.created_at).toLocaleDateString("hr-HR")}</TableCell>
                <TableCell className="font-medium">{p.bundle?.name ?? "—"}</TableCell>
                <TableCell>{p.bundle?.question_count ?? "—"}</TableCell>
                <TableCell>
                  {p.category_filter ? formatCategoryLabel(p.category_filter) : "—"}
                </TableCell>
                <TableCell>
                  {p.difficulty_filter != null
                    ? DIFFICULTY_LABELS_HR[p.difficulty_filter] ?? p.difficulty_filter
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.status === "completed"
                        ? "default"
                        : p.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {p.status === "completed"
                      ? "Završeno"
                      : p.status === "pending"
                        ? "Na čekanju"
                        : "Neuspjelo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
