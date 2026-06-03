export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          account_id: string | null;
          business_name: string;
          contact_name: string | null;
          phone: string | null;
          email: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          website_url: string | null;
          industry: string | null;
          location: string | null;
          website_status: string;
          lead_status: string;
          quoted_price: number | null;
          monthly_fee: number | null;
          source: string | null;
          source_place_id: string | null;
          has_website: boolean;
          has_booking_system: boolean;
          booking_system: string | null;
          lead_score: number;
          discovery_metadata: Json;
          notes: string | null;
          next_follow_up: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          business_name: string;
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          website_url?: string | null;
          industry?: string | null;
          location?: string | null;
          website_status?: string;
          lead_status?: string;
          quoted_price?: number | null;
          monthly_fee?: number | null;
          source?: string | null;
          source_place_id?: string | null;
          has_website?: boolean;
          has_booking_system?: boolean;
          booking_system?: string | null;
          lead_score?: number;
          discovery_metadata?: Json;
          notes?: string | null;
          next_follow_up?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          lead_id: string;
          type: string;
          summary: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          type: string;
          summary: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      pitch_templates: {
        Row: {
          id: string;
          account_id: string | null;
          industry: string | null;
          template_name: string;
          message_body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          industry?: string | null;
          template_name: string;
          message_body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pitch_templates"]["Insert"]>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          lead_id: string;
          account_id: string | null;
          one_time_price: number;
          monthly_price: number;
          status: string;
          close_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          account_id?: string | null;
          one_time_price: number;
          monthly_price: number;
          status?: string;
          close_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      pricing_templates: {
        Row: {
          id: string;
          account_id: string | null;
          template_name: string;
          one_time_price: number;
          monthly_price: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          template_name: string;
          one_time_price: number;
          monthly_price: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_templates"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
export type Interaction = Database["public"]["Tables"]["interactions"]["Row"];
export type PitchTemplate = Database["public"]["Tables"]["pitch_templates"]["Row"];
export type Deal = Database["public"]["Tables"]["deals"]["Row"];
export type PricingTemplate = Database["public"]["Tables"]["pricing_templates"]["Row"];
