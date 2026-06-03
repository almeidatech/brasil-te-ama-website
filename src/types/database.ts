// Auto-generated from Supabase schema via MCP generate_typescript_types.
// Regenerate after schema changes: MCP tool or `supabase gen types typescript --linked > src/types/database.ts`
// DO NOT edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_email_whitelist: {
        Row: { added_at: string; email: string; role: Database["public"]["Enums"]["app_role"] }
        Insert: { added_at?: string; email: string; role?: Database["public"]["Enums"]["app_role"] }
        Update: { added_at?: string; email?: string; role?: Database["public"]["Enums"]["app_role"] }
        Relationships: []
      }
      app_users: {
        Row: { active: boolean; created_at: string; email: string; id: string; name: string | null; role: Database["public"]["Enums"]["app_role"]; updated_at: string }
        Insert: { active?: boolean; created_at?: string; email: string; id: string; name?: string | null; role?: Database["public"]["Enums"]["app_role"]; updated_at?: string }
        Update: { active?: boolean; created_at?: string; email?: string; id?: string; name?: string | null; role?: Database["public"]["Enums"]["app_role"]; updated_at?: string }
        Relationships: []
      }
      categories: {
        Row: { site_id: string; color: string | null; created_at: string; description: string | null; id: string; name: string; order_index: number; slug: string; updated_at: string }
        Insert: { site_id?: string; color?: string | null; created_at?: string; description?: string | null; id?: string; name: string; order_index?: number; slug: string; updated_at?: string }
        Update: { site_id?: string; color?: string | null; created_at?: string; description?: string | null; id?: string; name?: string; order_index?: number; slug?: string; updated_at?: string }
        Relationships: []
      }
      media: {
        Row: { alt: string | null; created_at: string; height_px: number | null; id: string; mime: string | null; public_url: string | null; size_bytes: number | null; storage_path: string; uploaded_by: string | null; width_px: number | null }
        Insert: { alt?: string | null; created_at?: string; height_px?: number | null; id?: string; mime?: string | null; public_url?: string | null; size_bytes?: number | null; storage_path: string; uploaded_by?: string | null; width_px?: number | null }
        Update: { alt?: string | null; created_at?: string; height_px?: number | null; id?: string; mime?: string | null; public_url?: string | null; size_bytes?: number | null; storage_path?: string; uploaded_by?: string | null; width_px?: number | null }
        Relationships: []
      }
      pages: {
        Row: { body_html: string | null; body_md: string | null; cover_image_id: string | null; created_at: string; id: string; meta: Json; published_at: string | null; slug: string; status: Database["public"]["Enums"]["content_status"]; title: string; updated_at: string }
        Insert: { body_html?: string | null; body_md?: string | null; cover_image_id?: string | null; created_at?: string; id?: string; meta?: Json; published_at?: string | null; slug: string; status?: Database["public"]["Enums"]["content_status"]; title: string; updated_at?: string }
        Update: { body_html?: string | null; body_md?: string | null; cover_image_id?: string | null; created_at?: string; id?: string; meta?: Json; published_at?: string | null; slug?: string; status?: Database["public"]["Enums"]["content_status"]; title?: string; updated_at?: string }
        Relationships: []
      }
      post_revisions: {
        Row: { created_at: string; edited_by: string | null; id: string; post_id: string; snapshot: Json; version: number }
        Insert: { created_at?: string; edited_by?: string | null; id?: string; post_id: string; snapshot: Json; version: number }
        Update: { created_at?: string; edited_by?: string | null; id?: string; post_id?: string; snapshot?: Json; version?: number }
        Relationships: []
      }
      post_images: {
        Row: { id: string; post_id: string; url: string; storage_path: string | null; alt: string | null; width: number | null; height: number | null; order_index: number; created_at: string }
        Insert: { id?: string; post_id: string; url: string; storage_path?: string | null; alt?: string | null; width?: number | null; height?: number | null; order_index?: number; created_at?: string }
        Update: { id?: string; post_id?: string; url?: string; storage_path?: string | null; alt?: string | null; width?: number | null; height?: number | null; order_index?: number; created_at?: string }
        Relationships: []
      }
      post_translations: {
        Row: { post_id: string; locale: string; title: string | null; excerpt: string | null; body_html: string | null; seo_title: string | null; seo_description: string | null; source_hash: string | null; translated_at: string }
        Insert: { post_id: string; locale: string; title?: string | null; excerpt?: string | null; body_html?: string | null; seo_title?: string | null; seo_description?: string | null; source_hash?: string | null; translated_at?: string }
        Update: { post_id?: string; locale?: string; title?: string | null; excerpt?: string | null; body_html?: string | null; seo_title?: string | null; seo_description?: string | null; source_hash?: string | null; translated_at?: string }
        Relationships: []
      }
      posts: {
        Row: { site_id: string; author_id: string | null; body_html: string | null; body_md: string | null; category: string | null; category_id: string | null; cover_image_id: string | null; created_at: string; excerpt: string | null; id: string; og_image_id: string | null; published_at: string | null; reading_time_min: number | null; seo_description: string | null; seo_title: string | null; slug: string; status: Database["public"]["Enums"]["content_status"]; tags: string[]; title: string; updated_at: string }
        Insert: { site_id?: string; author_id?: string | null; body_html?: string | null; body_md?: string | null; category?: string | null; category_id?: string | null; cover_image_id?: string | null; created_at?: string; excerpt?: string | null; id?: string; og_image_id?: string | null; published_at?: string | null; reading_time_min?: number | null; seo_description?: string | null; seo_title?: string | null; slug: string; status?: Database["public"]["Enums"]["content_status"]; tags?: string[]; title: string; updated_at?: string }
        Update: { site_id?: string; author_id?: string | null; body_html?: string | null; body_md?: string | null; category?: string | null; category_id?: string | null; cover_image_id?: string | null; created_at?: string; excerpt?: string | null; id?: string; og_image_id?: string | null; published_at?: string | null; reading_time_min?: number | null; seo_description?: string | null; seo_title?: string | null; slug?: string; status?: Database["public"]["Enums"]["content_status"]; tags?: string[]; title?: string; updated_at?: string }
        Relationships: []
      }
      services: {
        Row: { body_html: string | null; body_md: string | null; created_at: string; icon: string | null; id: string; order_index: number; price_tier: string | null; published_at: string | null; slug: string; status: Database["public"]["Enums"]["content_status"]; summary: string | null; title: string; updated_at: string }
        Insert: { body_html?: string | null; body_md?: string | null; created_at?: string; icon?: string | null; id?: string; order_index?: number; price_tier?: string | null; published_at?: string | null; slug: string; status?: Database["public"]["Enums"]["content_status"]; summary?: string | null; title: string; updated_at?: string }
        Update: { body_html?: string | null; body_md?: string | null; created_at?: string; icon?: string | null; id?: string; order_index?: number; price_tier?: string | null; published_at?: string | null; slug?: string; status?: Database["public"]["Enums"]["content_status"]; summary?: string | null; title?: string; updated_at?: string }
        Relationships: []
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      audit_action: "insert" | "update" | "delete"
      content_status: "draft" | "scheduled" | "published" | "archived"
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
