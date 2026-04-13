"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuestionForm } from "@/components/question-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  formatCategoryLabel,
  QUESTION_STATUS_LABELS,
  DIFFICULTY_LABELS_HR,
} from "@/lib/constants";
import { Plus } from "lucide-react";
import type { Question } from "@/lib/types/database";

export default function CreatorQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | undefined>();
  const supabase = createClient();

  async function loadQuestions() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    setQuestions(data ?? []);
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSuccess() {
    setShowForm(false);
    setEditQuestion(undefined);
    loadQuestions();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Moja pitanja</h1>
        <Button
          onClick={() => {
            setEditQuestion(undefined);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo pitanje
        </Button>
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
              <TableHead className="w-[40%]">Pitanje</TableHead>
              <TableHead>Kategorija</TableHead>
              <TableHead>Težina</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Još nema pitanja. Dodaj prvo iznad.
                </TableCell>
              </TableRow>
            )}
            {questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {q.text}
                </TableCell>
                <TableCell>{formatCategoryLabel(q.category)}</TableCell>
                <TableCell>{DIFFICULTY_LABELS_HR[q.difficulty] ?? `${q.difficulty}/5`}</TableCell>
                <TableCell>
                  <Badge variant={q.status === "approved" ? "default" : "secondary"}>
                    {QUESTION_STATUS_LABELS[q.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {q.status === "draft" && (
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
