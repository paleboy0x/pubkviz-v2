"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CATEGORY_LIST,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS_HR,
  formatCategoryLabel,
} from "@/lib/constants";
import { Download, ShoppingCart, DollarSign } from "lucide-react";
import type { Profile, Bundle } from "@/lib/types/database";

interface ReportRow {
  id: string;
  status: string;
  created_at: string;
  category_filter: string | null;
  difficulty_filter: number | null;
  user: { first_name: string; last_name: string } | null;
  bundle: { name: string; question_count: number } | null;
}

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [creators, setCreators] = useState<Profile[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [creatorId, setCreatorId] = useState("all");
  const [bundleId, setBundleId] = useState("all");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const supabase = createClient();

  const loadFilters = useCallback(async () => {
    const { data: creatorsData } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["creator", "admin"]);
    setCreators((creatorsData ?? []) as Profile[]);

    const { data: bundlesData } = await supabase
      .from("bundles")
      .select("*")
      .order("name");
    setBundles((bundlesData ?? []) as Bundle[]);
  }, [supabase]);

  const loadReports = useCallback(async () => {
    let query = supabase
      .from("purchases")
      .select("id, status, created_at, category_filter, difficulty_filter, user:profiles!user_id(first_name, last_name), bundle:bundles!bundle_id(name, question_count)")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");
    if (bundleId !== "all") query = query.eq("bundle_id", bundleId);
    if (category !== "all") query = query.eq("category_filter", category);
    if (difficulty !== "all") query = query.eq("difficulty_filter", Number(difficulty));

    const { data } = await query;

    let results = (data ?? []) as unknown as ReportRow[];

    if (creatorId !== "all") {
      const { data: qIds } = await supabase
        .from("questions")
        .select("id")
        .eq("creator_id", creatorId);
      const questionIds = new Set((qIds as { id: string }[] ?? []).map((q) => q.id));

      const purchaseIds = results.map((r) => r.id);
      const { data: uqData } = await supabase
        .from("user_questions")
        .select("purchase_id, question_id")
        .in("purchase_id", purchaseIds);

      const filteredPurchaseIds = new Set(
        (uqData as { purchase_id: string; question_id: string }[] ?? [])
          .filter((uq) => questionIds.has(uq.question_id))
          .map((uq) => uq.purchase_id)
      );

      results = results.filter((r) => filteredPurchaseIds.has(r.id));
    }

    setRows(results);
  }, [supabase, dateFrom, dateTo, creatorId, bundleId, category, difficulty]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function formatDifficultyCell(value: number | null) {
    if (value == null) return "—";
    return DIFFICULTY_LABELS_HR[value] ?? String(value);
  }

  function exportCSV() {
    const header =
      "Datum,Kupac,Paket,Broj pitanja,Filtar kategorije,Filtar težine\n";
    const csvRows = rows.map((r) => {
      const name = r.user ? `${r.user.first_name} ${r.user.last_name}` : "Nepoznato";
      const bundle = r.bundle?.name ?? "Nepoznato";
      const count = r.bundle?.question_count ?? 0;
      const cat = r.category_filter ? formatCategoryLabel(r.category_filter) : "—";
      const diff = formatDifficultyCell(r.difficulty_filter);
      const date = new Date(r.created_at).toLocaleDateString("hr-HR");
      return `${date},"${name}","${bundle}",${count},${cat},${diff}`;
    });
    const blob = new Blob(["\uFEFF" + header + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prodajni-izvjestaj-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Prodajni izvještaji</h1>
        <Button variant="outline" onClick={exportCSV} disabled={rows.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Izvezi CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ukupno prodaja
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prodana pitanja (kom)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.reduce((acc, r) => acc + (r.bundle?.question_count ?? 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Od</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Do</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Autor</Label>
          <Select value={creatorId} onValueChange={(v) => setCreatorId(v ?? "all")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi</SelectItem>
              {creators.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Paket</Label>
          <Select value={bundleId} onValueChange={(v) => setBundleId(v ?? "all")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi</SelectItem>
              {bundles.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Kategorija</Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve</SelectItem>
              {CATEGORY_LIST.map((c) => (
                <SelectItem key={c} value={c}>
                  {formatCategoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Težina</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "all")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve</SelectItem>
              {DIFFICULTY_LEVELS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {DIFFICULTY_LABELS_HR[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Kupac</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Pitanja</TableHead>
              <TableHead>Kategorija</TableHead>
              <TableHead>Težina</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nema prodaja za odabrane filtre.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.created_at).toLocaleDateString("hr-HR")}</TableCell>
                <TableCell>
                  {r.user ? `${r.user.first_name} ${r.user.last_name}` : "—"}
                </TableCell>
                <TableCell>{r.bundle?.name ?? "—"}</TableCell>
                <TableCell>{r.bundle?.question_count ?? "—"}</TableCell>
                <TableCell>
                  {r.category_filter ? formatCategoryLabel(r.category_filter) : "—"}
                </TableCell>
                <TableCell>{formatDifficultyCell(r.difficulty_filter)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
