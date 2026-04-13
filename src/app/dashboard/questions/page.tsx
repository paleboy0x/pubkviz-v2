"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LIST, DIFFICULTY_LEVELS, formatCategoryLabel } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import type { Question } from "@/lib/types/database";

export default function MyQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const supabase = createClient();

  const loadQuestions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userQuestions } = await supabase
      .from("user_questions")
      .select("question_id")
      .eq("user_id", user.id);

    if (!userQuestions || userQuestions.length === 0) {
      setQuestions([]);
      return;
    }

    const qIds = (userQuestions as { question_id: string }[]).map((uq) => uq.question_id);

    let query = supabase.from("questions").select("*").in("id", qIds);

    if (filterCategory !== "all") query = query.eq("category", filterCategory);
    if (filterDifficulty !== "all") query = query.eq("difficulty", Number(filterDifficulty));

    const { data } = await query.order("category");
    setQuestions((data ?? []) as Question[]);
  }, [supabase, filterCategory, filterDifficulty]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Moja pitanja</h1>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5 min-w-[180px]">
          <Label className="text-xs">Kategorija</Label>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
            <SelectTrigger>
              <SelectValue />
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
        </div>
        <div className="space-y-1.5 min-w-[140px]">
          <Label className="text-xs">Težina</Label>
          <Select value={filterDifficulty} onValueChange={(v) => setFilterDifficulty(v ?? "all")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve razine</SelectItem>
              {DIFFICULTY_LEVELS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Razina {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Još nema pitanja. Kupi paket da započneš.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="outline">{formatCategoryLabel(q.category)}</Badge>
                  <Badge variant="secondary">Difficulty {q.difficulty}</Badge>
                  <Badge variant="secondary">{formatCategoryLabel(q.type)}</Badge>
                </div>
                <CardTitle className="text-base leading-snug">{q.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.image_url && (
                  <img
                    src={q.image_url}
                    alt="Question image"
                    className="rounded-md max-h-48 object-cover"
                  />
                )}
                {q.type === "multiple_choice" && q.options && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Opcije:</p>
                    <ul className="text-sm space-y-0.5 pl-4 list-disc">
                      {(q.options as string[]).map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground">Odgovor:</p>
                  <p className="text-sm font-medium">{q.answer}</p>
                </div>
                {q.explanation && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Objašnjenje:</p>
                    <p className="text-sm">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
