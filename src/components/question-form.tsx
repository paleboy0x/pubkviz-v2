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
  formatCategoryLabel,
  type Category,
} from "@/lib/constants";
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
          answer: question.answer,
          explanation: question.explanation,
          category: question.category as Category,
          subcategory: question.subcategory,
          difficulty: question.difficulty as 1 | 2 | 3 | 4 | 5,
          language: question.language as "HR" | "EN",
        }
      : {
          type: "open",
          language: "EN",
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
      toast.error("Not authenticated");
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
        toast.error("Image upload failed: " + uploadError.message);
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
      toast.success("Question updated");
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Question created");
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
        <Label htmlFor="text">Question text</Label>
        <Textarea id="text" rows={3} {...register("text")} />
        {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
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
                  {formatCategoryLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
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
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedType === "multiple_choice" && (
        <div className="space-y-3">
          <Label>Options</Label>
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
                placeholder={`Option ${i + 1}`}
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
            <Plus className="h-4 w-4 mr-1" /> Add option
          </Button>
          {errors.options && (
            <p className="text-sm text-destructive">{errors.options.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        {selectedType === "true_false" ? (
          <Select
            value={watch("answer")}
            onValueChange={(v) => {
              if (v) setValue("answer", v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select answer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="True">True</SelectItem>
              <SelectItem value="False">False</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input id="answer" {...register("answer")} />
        )}
        {errors.answer && <p className="text-sm text-destructive">{errors.answer.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation (optional)</Label>
        <Textarea id="explanation" rows={2} {...register("explanation")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
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
              <SelectValue placeholder="Select category" />
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
          <Label>Subcategory</Label>
          <Select
            value={watch("subcategory") ?? ""}
            onValueChange={(v) => {
              if (v) setValue("subcategory", v);
            }}
            disabled={!selectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
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
        <Label>Difficulty</Label>
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
                {d} {d === 1 ? "(Easy)" : d === 5 ? "(Hard)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Image (optional)</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            {imageFile ? imageFile.name : "Choose file"}
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
        {loading
          ? "Saving..."
          : question
          ? "Update question"
          : "Create question"}
      </Button>
    </form>
  );
}
