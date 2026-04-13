"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuestionForm } from "@/components/question-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  CATEGORY_LIST,
  DIFFICULTY_LEVELS,
  formatCategoryLabel,
  QUESTION_STATUS_LABELS,
  questionTypeLabel,
  DIFFICULTY_LABELS_HR,
} from "@/lib/constants";
import { Plus, CheckCircle, Trash2, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Question } from "@/lib/types/database";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const loadQuestions = useCallback(async () => {
    let query = supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterCategory !== "all") query = query.eq("category", filterCategory);
    if (filterDifficulty !== "all") query = query.eq("difficulty", Number(filterDifficulty));
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (search) query = query.ilike("text", `%${search}%`);

    const { data } = await query;
    setQuestions((data ?? []) as Question[]);
  }, [supabase, filterCategory, filterDifficulty, filterStatus, search]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function handleApprove(id: string) {
    const { error } = await supabase
      .from("questions")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pitanje je odobreno.");
    loadQuestions();
  }

  async function handleRevokeApproval(id: string) {
    if (!confirm("Vratiti pitanje u nacrt (ukinuti odobrenje)?")) return;
    const { error } = await supabase.from("questions").update({ status: "draft" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pitanje je vraćeno u nacrt.");
    loadQuestions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Obrisati ovo pitanje?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pitanje obrisano.");
    loadQuestions();
  }

  function handleSuccess() {
    setShowForm(false);
    setEditQuestion(undefined);
    loadQuestions();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pitanja</h1>
        <Button
          onClick={() => {
            setEditQuestion(undefined);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo pitanje
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži pitanja…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategorija" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve kategorije</SelectItem>
            {CATEGORY_LIST.map((c) => (
              <SelectItem key={c} value={c}>
                {formatCategoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Težina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve razine</SelectItem>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {DIFFICULTY_LABELS_HR[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status pitanja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            <SelectItem value="draft">{QUESTION_STATUS_LABELS.draft}</SelectItem>
            <SelectItem value="approved">{QUESTION_STATUS_LABELS.approved}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditQuestion(undefined);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editQuestion ? "Uredi pitanje" : "Novo pitanje"}</DialogTitle>
          </DialogHeader>
          <QuestionForm question={editQuestion} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Pitanje</TableHead>
              <TableHead>Kategorija</TableHead>
              <TableHead>Težina</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nema pitanja.
                </TableCell>
              </TableRow>
            )}
            {questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium max-w-xs truncate">{q.text}</TableCell>
                <TableCell>{formatCategoryLabel(q.category)}</TableCell>
                <TableCell>
                  {DIFFICULTY_LABELS_HR[q.difficulty] ?? `${q.difficulty}/5`}
                </TableCell>
                <TableCell>
                  <Badge variant={q.status === "approved" ? "default" : "secondary"}>
                    {QUESTION_STATUS_LABELS[q.status]}
                  </Badge>
                </TableCell>
                <TableCell>{questionTypeLabel(q.type)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {q.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleApprove(q.id)}
                        title="Odobri"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {q.status === "approved" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleRevokeApproval(q.id)}
                        title="Ukinuti odobrenje"
                      >
                        <Undo2 className="h-4 w-4 text-amber-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditQuestion(q);
                        setShowForm(true);
                      }}
                    >
                      Uredi
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(q.id)}
                      title="Obriši"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
