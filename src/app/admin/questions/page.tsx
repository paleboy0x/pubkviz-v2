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
} from "@/lib/constants";
import { Plus, CheckCircle, Trash2, Search } from "lucide-react";
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
    toast.success("Question approved");
    loadQuestions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Question deleted");
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
          <Plus className="h-4 w-4 mr-1" /> New Question
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_LIST.map((c) => (
              <SelectItem key={c} value={c}>
                {formatCategoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                Level {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
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
            <DialogTitle>
              {editQuestion ? "Edit Question" : "Create Question"}
            </DialogTitle>
          </DialogHeader>
          <QuestionForm question={editQuestion} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No questions found.
                </TableCell>
              </TableRow>
            )}
            {questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium max-w-xs truncate">{q.text}</TableCell>
                <TableCell>{formatCategoryLabel(q.category)}</TableCell>
                <TableCell>{q.difficulty}/5</TableCell>
                <TableCell>
                  <Badge variant={q.status === "approved" ? "default" : "secondary"}>
                    {q.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatCategoryLabel(q.type)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {q.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleApprove(q.id)}
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
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
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(q.id)}
                      title="Delete"
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
