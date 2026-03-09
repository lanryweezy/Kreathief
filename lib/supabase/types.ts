// Supabase Database Types for Kreathief

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  kreathief: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro' | 'team';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'team';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'team';
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          state: Json;
          canvas_size: Json | null;
          background_color: string | null;
          canvas_filters: Json | null;
          created_at: string;
          updated_at: string;
          is_public: boolean;
          share_id: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          state: Json;
          canvas_size?: Json | null;
          background_color?: string | null;
          canvas_filters?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
          share_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          state?: Json;
          canvas_size?: Json | null;
          background_color?: string | null;
          canvas_filters?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_public?: boolean;
          share_id?: string | null;
        };
      };
      project_versions: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          state: Json;
          thumbnail_url: string | null;
          version_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          project_id: string;
          user_id: string;
          state: Json;
          thumbnail_url?: string | null;
          version_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          state?: Json;
          thumbnail_url?: string | null;
          version_name?: string | null;
          created_at?: string;
        };
      };
      project_snapshots: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          state: Json;
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          state: Json;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          name?: string;
          state?: Json;
          thumbnail_url?: string | null;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          user_name: string;
          user_avatar_url: string | null;
          text: string;
          position: Json | null;
          layer_id: string | null;
          created_at: string;
          updated_at: string;
          parent_id: string | null;
          resolved: boolean;
        };
        Insert: {
          id: string;
          project_id: string;
          user_id: string;
          user_name: string;
          user_avatar_url?: string | null;
          text: string;
          position?: Json | null;
          layer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          parent_id?: string | null;
          resolved?: boolean;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          user_name?: string;
          user_avatar_url?: string | null;
          text?: string;
          position?: Json | null;
          layer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          parent_id?: string | null;
          resolved?: boolean;
        };
      };
      brand_kits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          colors: Json;
          fonts: Json;
          logos: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          colors: Json;
          fonts: Json;
          logos: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          colors?: Json;
          fonts?: Json;
          logos?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          state: Json;
          category: string | null;
          tags: string[];
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          state: Json;
          category?: string | null;
          tags?: string[];
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          state?: Json;
          category?: string | null;
          tags?: string[];
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Type helpers
export type Profile = Database['kreathief']['Tables']['profiles']['Row'];
export type Project = Database['kreathief']['Tables']['projects']['Row'];
export type ProjectVersion = Database['kreathief']['Tables']['project_versions']['Row'];
export type ProjectSnapshot = Database['kreathief']['Tables']['project_snapshots']['Row'];
export type Comment = Database['kreathief']['Tables']['comments']['Row'];
export type BrandKit = Database['kreathief']['Tables']['brand_kits']['Row'];
export type Template = Database['kreathief']['Tables']['templates']['Row'];

// Insert types
export type ProfileInsert = Database['kreathief']['Tables']['profiles']['Insert'];
export type ProjectInsert = Database['kreathief']['Tables']['projects']['Insert'];
export type ProjectVersionInsert = Database['kreathief']['Tables']['project_versions']['Insert'];
export type ProjectSnapshotInsert = Database['kreathief']['Tables']['project_snapshots']['Insert'];
export type CommentInsert = Database['kreathief']['Tables']['comments']['Insert'];
export type BrandKitInsert = Database['kreathief']['Tables']['brand_kits']['Insert'];
export type TemplateInsert = Database['kreathief']['Tables']['templates']['Insert'];

// Update types
export type ProfileUpdate = Database['kreathief']['Tables']['profiles']['Update'];
export type ProjectUpdate = Database['kreathief']['Tables']['projects']['Update'];
export type ProjectVersionUpdate = Database['kreathief']['Tables']['project_versions']['Update'];
export type ProjectSnapshotUpdate = Database['kreathief']['Tables']['project_snapshots']['Update'];
export type CommentUpdate = Database['kreathief']['Tables']['comments']['Update'];
export type BrandKitUpdate = Database['kreathief']['Tables']['brand_kits']['Update'];
export type TemplateUpdate = Database['kreathief']['Tables']['templates']['Update'];
