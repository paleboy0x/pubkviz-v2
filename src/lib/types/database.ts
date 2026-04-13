export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "admin" | "creator" | "user";
          first_name: string;
          last_name: string;
          created_at: string;
          updated_at: string;
          deletion_requested_at: string | null;
          deletion_request_note: string | null;
        };
        Insert: {
          id: string;
          role?: "admin" | "creator" | "user";
          first_name: string;
          last_name: string;
          created_at?: string;
          updated_at?: string;
          deletion_requested_at?: string | null;
          deletion_request_note?: string | null;
        };
        Update: {
          id?: string;
          role?: "admin" | "creator" | "user";
          first_name?: string;
          last_name?: string;
          updated_at?: string;
          deletion_requested_at?: string | null;
          deletion_request_note?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          text: string;
          type: "open" | "multiple_choice" | "true_false";
          options: string[] | null;
          answer: string;
          explanation: string | null;
          category: string;
          subcategory: string;
          difficulty: number;
          language: "HR" | "EN";
          image_url: string | null;
          status: "draft" | "approved";
          creator_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          type: "open" | "multiple_choice" | "true_false";
          options?: string[] | null;
          answer: string;
          explanation?: string | null;
          category: string;
          subcategory: string;
          difficulty: number;
          language: "HR" | "EN";
          image_url?: string | null;
          status?: "draft" | "approved";
          creator_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          text?: string;
          type?: "open" | "multiple_choice" | "true_false";
          options?: string[] | null;
          answer?: string;
          explanation?: string | null;
          category?: string;
          subcategory?: string;
          difficulty?: number;
          language?: "HR" | "EN";
          image_url?: string | null;
          status?: "draft" | "approved";
          updated_at?: string;
        };
      };
      bundles: {
        Row: {
          id: string;
          name: string;
          paddle_price_id: string;
          question_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          paddle_price_id: string;
          question_count: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          paddle_price_id?: string;
          question_count?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          bundle_id: string;
          paddle_transaction_id: string | null;
          status: "pending" | "completed" | "failed";
          category_filter: string | null;
          difficulty_filter: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bundle_id: string;
          paddle_transaction_id?: string | null;
          status?: "pending" | "completed" | "failed";
          category_filter?: string | null;
          difficulty_filter?: number | null;
          created_at?: string;
        };
        Update: {
          paddle_transaction_id?: string | null;
          status?: "pending" | "completed" | "failed";
        };
      };
      user_questions: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          purchase_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          purchase_id: string;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      assign_questions: {
        Args: {
          p_user_id: string;
          p_purchase_id: string;
          p_count: number;
          p_category: string | null;
          p_difficulty: number | null;
        };
        Returns: string[];
      };
    };
    Enums: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type Bundle = Database["public"]["Tables"]["bundles"]["Row"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type UserQuestion = Database["public"]["Tables"]["user_questions"]["Row"];
