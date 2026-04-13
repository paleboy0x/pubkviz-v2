import { z } from "zod";
import {
  CATEGORY_LIST,
  CATEGORIES,
  DIFFICULTY_LEVELS,
  LANGUAGES,
  QUESTION_TYPES,
  USER_ROLES,
  type Category,
} from "./constants";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const questionSchema = z
  .object({
    text: z.string().min(1, "Question text is required").max(2000),
    type: z.enum(QUESTION_TYPES),
    options: z.array(z.string().min(1)).nullable(),
    answer: z.string().min(1, "Answer is required").max(2000),
    explanation: z.string().max(2000).nullable().optional(),
    category: z.enum(CATEGORY_LIST as unknown as [string, ...string[]]),
    subcategory: z.string().min(1, "Subcategory is required"),
    difficulty: z.number().int().min(1).max(5),
    language: z.enum(LANGUAGES),
  })
  .refine(
    (data) => {
      const subs = CATEGORIES[data.category as Category];
      return subs?.includes(data.subcategory as never);
    },
    { message: "Subcategory must belong to the selected category", path: ["subcategory"] }
  )
  .refine(
    (data) => {
      if (data.type === "multiple_choice") {
        return data.options && data.options.length >= 2;
      }
      return true;
    },
    { message: "Multiple choice questions need at least 2 options", path: ["options"] }
  )
  .refine(
    (data) => {
      if (data.type === "true_false") {
        return data.answer === "True" || data.answer === "False";
      }
      return true;
    },
    { message: "True/False questions must have 'True' or 'False' as answer", path: ["answer"] }
  );

export const bundleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  paddlePriceId: z.string().min(1, "Paddle Price ID is required"),
  questionCount: z.number().int().min(1, "Must include at least 1 question"),
  isActive: z.boolean().default(true),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(USER_ROLES.filter((r) => r !== "admin") as unknown as [string, ...string[]]),
});

export const purchaseFilterSchema = z.object({
  category: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).nullable().optional(),
});

export const profileNamesSchema = z.object({
  firstName: z.string().min(1, "Ime je obavezno").max(100),
  lastName: z.string().min(1, "Prezime je obavezno").max(100),
});

export type ProfileNamesInput = z.infer<typeof profileNamesSchema>;

export const profileEmailSchema = z.object({
  email: z.string().email("Neispravna adresa e-pošte"),
});

export type ProfileEmailInput = z.infer<typeof profileEmailSchema>;

export const profilePasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Lozinka: najmanje 6 znakova"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

export type ProfilePasswordInput = z.infer<typeof profilePasswordSchema>;

export const reportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  creatorId: z.string().optional(),
  bundleId: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type BundleInput = z.infer<typeof bundleSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type PurchaseFilterInput = z.infer<typeof purchaseFilterSchema>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
