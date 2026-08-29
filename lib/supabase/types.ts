// Supabase Database Types for public

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro' | 'team';
          bio: string | null;
          website: string | null;
          location: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'team';
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'team';
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: any[];
      };
      assets: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          category: string | null;
          tags: string[];
          file_url: string;
          thumbnail_url: string | null;
          price: number;
          downloads: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          tags?: string[];
          file_url: string;
          thumbnail_url?: string | null;
          price?: number;
          downloads?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          tags?: string[];
          file_url?: string;
          thumbnail_url?: string | null;
          price?: number;
          downloads?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: any[];
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
          is_template: boolean;
          tags: string[];
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
          is_template?: boolean;
          tags?: string[];
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
          is_template?: boolean;
          tags?: string[];
        };
        Relationships: any[];
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
        Relationships: any[];
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
        Relationships: any[];
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
        Relationships: any[];
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
        Relationships: any[];
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
        Relationships: any[];
      };
      share_links: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          password_hash: string | null;
          expires_at: string | null;
          is_public: boolean;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          project_id: string;
          user_id: string;
          password_hash?: string | null;
          expires_at?: string | null;
          is_public?: boolean;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          password_hash?: string | null;
          expires_at?: string | null;
          is_public?: boolean;
          view_count?: number;
          created_at?: string;
        };
        Relationships: any[];
      };
      community_templates: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          description: string | null;
          size: string;
          state: Json;
          user_id: string | null;
          user_name: string;
          likes: number;
          downloads: number;
          thumbnail_url: string | null;
          tags: string[];
          remix_of: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          category?: string | null;
          description?: string | null;
          size?: string;
          state: Json;
          user_id?: string | null;
          user_name: string;
          likes?: number;
          downloads?: number;
          thumbnail_url?: string | null;
          tags?: string[];
          remix_of?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          description?: string | null;
          size?: string;
          state?: Json;
          user_id?: string | null;
          user_name?: string;
          likes?: number;
          downloads?: number;
          thumbnail_url?: string | null;
          tags?: string[];
          remix_of?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: any[];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectVersion = Database['public']['Tables']['project_versions']['Row'];
export type ProjectSnapshot = Database['public']['Tables']['project_snapshots']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type BrandKit = Database['public']['Tables']['brand_kits']['Row'];
export type Template = Database['public']['Tables']['templates']['Row'];
export type ShareLink = Database['public']['Tables']['share_links']['Row'];
export type CommunityTemplate = Database['public']['Tables']['community_templates']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectVersionInsert = Database['public']['Tables']['project_versions']['Insert'];
export type ProjectSnapshotInsert = Database['public']['Tables']['project_snapshots']['Insert'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type BrandKitInsert = Database['public']['Tables']['brand_kits']['Insert'];
export type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
export type ShareLinkInsert = Database['public']['Tables']['share_links']['Insert'];
export type CommunityTemplateInsert = Database['public']['Tables']['community_templates']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type ProjectVersionUpdate = Database['public']['Tables']['project_versions']['Update'];
export type ProjectSnapshotUpdate = Database['public']['Tables']['project_snapshots']['Update'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];
export type BrandKitUpdate = Database['public']['Tables']['brand_kits']['Update'];
export type TemplateUpdate = Database['public']['Tables']['templates']['Update'];
export type ShareLinkUpdate = Database['public']['Tables']['share_links']['Update'];
export type CommunityTemplateUpdate = Database['public']['Tables']['community_templates']['Update'];
