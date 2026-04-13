"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bundleSchema, type BundleInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Bundle } from "@/lib/types/database";

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editBundle, setEditBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BundleInput>({
    resolver: zodResolver(bundleSchema) as never,
  });

  const loadBundles = useCallback(async () => {
    const { data } = await supabase
      .from("bundles")
      .select("*")
      .order("question_count", { ascending: true });
    setBundles((data ?? []) as Bundle[]);
  }, [supabase]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  function openEdit(bundle: Bundle) {
    setEditBundle(bundle);
    setValue("name", bundle.name);
    setValue("paddlePriceId", bundle.paddle_price_id);
    setValue("questionCount", bundle.question_count);
    setValue("isActive", bundle.is_active);
    setShowForm(true);
  }

  function openCreate() {
    setEditBundle(null);
    reset({ name: "", paddlePriceId: "", questionCount: 10, isActive: true });
    setShowForm(true);
  }

  async function onSubmit(data: BundleInput) {
    setLoading(true);

    const payload = {
      name: data.name,
      paddle_price_id: data.paddlePriceId,
      question_count: data.questionCount,
      is_active: data.isActive,
    };

    if (editBundle) {
      const { error } = await supabase
        .from("bundles")
        .update(payload)
        .eq("id", editBundle.id);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Bundle updated");
    } else {
      const { error } = await supabase.from("bundles").insert(payload);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Bundle created");
    }

    setShowForm(false);
    setEditBundle(null);
    reset();
    setLoading(false);
    loadBundles();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Paketi</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Bundle
        </Button>
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditBundle(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editBundle ? "Edit Bundle" : "Create Bundle"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bundle name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paddlePriceId">Paddle Price ID</Label>
              <Input
                id="paddlePriceId"
                placeholder="pri_..."
                {...register("paddlePriceId")}
              />
              {errors.paddlePriceId && (
                <p className="text-sm text-destructive">{errors.paddlePriceId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionCount">Question count</Label>
              <Input
                id="questionCount"
                type="number"
                min={1}
                {...register("questionCount", { valueAsNumber: true })}
              />
              {errors.questionCount && (
                <p className="text-sm text-destructive">{errors.questionCount.message}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label>Active</Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : editBundle ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Paddle Price ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No bundles configured yet.
                </TableCell>
              </TableRow>
            )}
            {bundles.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.question_count}</TableCell>
                <TableCell className="font-mono text-xs">{b.paddle_price_id}</TableCell>
                <TableCell>
                  <Badge variant={b.is_active ? "default" : "secondary"}>
                    {b.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
