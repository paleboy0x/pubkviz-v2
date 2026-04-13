"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ShieldBan, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";
import { USER_ROLE_LABELS } from "@/lib/constants";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema) as never,
  });

  const loadUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as Profile[]);
  }, [supabase]);

  useEffect(() => {
    loadUsers();
    void supabase.auth.getUser().then(({ data: { user } }) => setMyId(user?.id ?? null));
  }, [loadUsers, supabase.auth]);

  async function onSubmit(data: CreateUserInput) {
    setLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error || "Neuspjelo kreiranje");
      setLoading(false);
      return;
    }

    toast.success("Korisnik je kreiran");
    reset();
    setShowForm(false);
    setLoading(false);
    loadUsers();
  }

  async function toggleBan(target: Profile) {
    if (target.role === "admin") {
      toast.error("Administratore ne možeš blokirati.");
      return;
    }
    if (target.id === myId) {
      toast.error("Ne možeš blokirati sam sebe.");
      return;
    }
    const next = !target.is_banned;
    const { error } = await supabase.from("profiles").update({ is_banned: next }).eq("id", target.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Korisnik je blokiran." : "Blokada je uklonjena.");
    loadUsers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Korisnici</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novi korisnik
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novi korisnik</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ime</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Prezime</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-pošta</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Uloga</Label>
              <Select
                value={watch("role")}
                onValueChange={(v) => {
                  if (v) setValue("role", v as "creator" | "user");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberi ulogu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">{USER_ROLE_LABELS.creator}</SelectItem>
                  <SelectItem value="user">{USER_ROLE_LABELS.user}</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Spremanje…" : "Kreiraj"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ime</TableHead>
              <TableHead>Uloga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nema korisnika.
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.first_name} {u.last_name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      u.role === "admin" ? "default" : u.role === "creator" ? "secondary" : "outline"
                    }
                  >
                    {USER_ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.is_banned ? (
                    <Badge variant="destructive">Blokiran</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Aktivan</span>
                  )}
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString("hr-HR")}</TableCell>
                <TableCell className="text-right">
                  {u.role !== "admin" && u.id !== myId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void toggleBan(u)}
                    >
                      {u.is_banned ? (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-1" /> Otključaj
                        </>
                      ) : (
                        <>
                          <ShieldBan className="h-4 w-4 mr-1" /> Blokiraj
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
