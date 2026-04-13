"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, type QuestionInput } from "@/lib/validations";
import {
  CATEGORY_LIST,
  CATEGORIES,
  DIFFICULTY_LEVELS,
  LANGUAGES,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS_HR,
  formatCategoryLabel,
  type Category,
} from "@/lib/constants";

function normalizeTrueFalseAnswer(answer: string): string {
  if (answer === "True") return "Točno";
  if (answer === "False") return "Netočno";
  return answer;
}

const LANGUAGE_LABELS: Record<string, string> = { HR: "Hrvatski", EN: "Engleski" };
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { X, Plus, Upload } from "lucide-react";
import type { Question } from "@/lib/types/database";

interface QuestionFormProps {
  question?: Question;
  onSuccess?: () => void;
}

export function QuestionForm({ question, onSuccess }: QuestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [options, setOptions] = useState<string[]>(
    question?.options as string[] ?? ["", ""]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema) as never,
    defaultValues: question
      ? {
          text: question.text,
          type: question.type,
          options: question.options as string[] | null,
          answer:
            question.type === "true_false"
              ? normalizeTrueFalseAnswer(question.answer)
              : question.answer,
          explanation: question.explanation,
          category: question.category as Category,
          subcategory: question.subcategory,
          difficulty: question.difficulty as 1 | 2 | 3 | 4 | 5,
          language: question.language as "HR" | "EN",
        }
      : {
          type: "open",
          language: "HR",
          difficulty: 3,
          options: null,
        },
  });

  const selectedCategory = watch("category") as Category | undefined;
  const selectedType = watch("type");
  const subcategories = selectedCategory ? CATEGORIES[selectedCategory] : [];

  async function onSubmit(data: QuestionInput) {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Nisi prijavljen.");
      setLoading(false);
      return;
    }

    let imageUrl = question?.image_url ?? null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(path, imageFile);

      if (uploadError) {
        toast.error("Prijenos slike nije uspio: " + uploadError.message);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-images").getPublicUrl(path);
      imageUrl = publicUrl;
    }

    const payload = {
      text: data.text,
      type: data.type,
      options: data.type === "multiple_choice" ? options.filter(Boolean) : null,
      answer: data.answer,
      explanation: data.explanation || null,
      category: data.category,
      subcategory: data.subcategory,
      difficulty: data.difficulty,
      language: data.language,
      image_url: imageUrl,
      creator_id: user.id,
      status: "draft" as const,
    };

    if (question) {
      const { error } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", question.id);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Pitanje je spremljeno.");
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Pitanje je dodano.");
      reset();
      setOptions(["", ""]);
      setImageFile(null);
    }

    setLoading(false);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="text">Tekst pitanja</Label>
        <Textarea id="text" rows={3} {...register("text")} />
        {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tip pitanja</Label>
          <Select
            value={selectedType}
            onValueChange={(v) => {
              if (v) setValue("type", v as QuestionInput["type"]);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Jezik pitanja</Label>
          <Select
            value={watch("language")}
            onValueChange={(v) => {
              if (v) setValue("language", v as "HR" | "EN");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedType === "multiple_choice" && (
        <div className="space-y-3">
          <Label>Ponuđeni odgovori</Label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                  setValue("options", next);
                }}
                placeholder={`Odgovor ${i + 1}`}
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = options.filter((_, j) => j !== i);
                    setOptions(next);
                    setValue("options", next);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const next = [...options, ""];
              setOptions(next);
              setValue("options", next);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Dodaj odgovor
          </Button>
          {errors.options && (
            <p className="text-sm text-destructive">{errors.options.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="answer">Točan odgovor</Label>
        {selectedType === "true_false" ? (
          <Select
            value={watch("answer")}
            onValueChange={(v) => {
              if (v) setValue("answer", v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Odaberi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Točno">Točno</SelectItem>
              <SelectItem value="Netočno">Netočno</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input id="answer" {...register("answer")} />
        )}
        {errors.answer && <p className="text-sm text-destructive">{errors.answer.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Objašnjenje (opcionalno)</Label>
        <Textarea id="explanation" rows={2} {...register("explanation")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kategorija</Label>
          <Select
            value={selectedCategory ?? ""}
            onValueChange={(v) => {
              if (v) {
                setValue("category", v as Category);
                setValue("subcategory", "");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Odaberi kategoriju" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_LIST.map((c) => (
                <SelectItem key={c} value={c}>
                  {formatCategoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Podkategorija</Label>
          <Select
            value={watch("subcategory") ?? ""}
            onValueChange={(v) => {
              if (v) setValue("subcategory", v);
            }}
            disabled={!selectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Odaberi podkategoriju" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((s) => (
                <SelectItem key={s} value={s}>
                  {formatCategoryLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subcategory && (
            <p className="text-sm text-destructive">{errors.subcategory.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Težina</Label>
        <Select
          value={String(watch("difficulty"))}
          onValueChange={(v) => {
            if (v) setValue("difficulty", Number(v) as 1 | 2 | 3 | 4 | 5);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {DIFFICULTY_LABELS_HR[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Slika (opcionalno)</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            {imageFile ? imageFile.name : "Odaberi datoteku"}
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          {(imageFile || question?.image_url) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImageFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Spremanje…" : question ? "Spremi promjene" : "Dodaj pitanje"}
      </Button>
    </form>
  );
}
