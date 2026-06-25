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
          contactability_score: number;
          website_gap: string;
          discovery_fit: string;
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
          contactability_score?: number;
          website_gap?: string;
          discovery_fit?: string;
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
      discovery_runs: {
        Row: {
          id: string;
          account_id: string | null;
          query: string;
          location: string;
          radius_miles: number;
          max_results: number;
          provider: string;
          search_depth: string;
          quality_filter: string;
          min_rating: number;
          min_reviews: number;
          status: string;
          total_found: number;
          fresh_count: number;
          dialable_count: number;
          a_grade_count: number;
          no_website_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          query: string;
          location: string;
          radius_miles?: number;
          max_results?: number;
          provider?: string;
          search_depth?: string;
          quality_filter?: string;
          min_rating?: number;
          min_reviews?: number;
          status?: string;
          total_found?: number;
          fresh_count?: number;
          dialable_count?: number;
          a_grade_count?: number;
          no_website_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["discovery_runs"]["Insert"]>;
        Relationships: [];
      };
      discovered_leads: {
        Row: {
          id: string;
          discovery_run_id: string;
          source: string;
          source_place_id: string;
          business_name: string;
          phone: string | null;
          website_url: string | null;
          industry: string | null;
          location: string | null;
          address: string | null;
          has_website: boolean;
          website_quality: string;
          website_signals: string[];
          conversion_strength: string;
          has_booking_system: boolean;
          booking_system: string | null;
          contactability_score: number;
          website_gap: string;
          discovery_fit: string;
          lead_score: number;
          opportunity_grade: string;
          priority_label: string;
          score_reasons: string[];
          is_existing_lead: boolean;
          existing_lead_id: string | null;
          promoted_lead_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          discovery_run_id: string;
          source: string;
          source_place_id: string;
          business_name: string;
          phone?: string | null;
          website_url?: string | null;
          industry?: string | null;
          location?: string | null;
          address?: string | null;
          has_website?: boolean;
          website_quality?: string;
          website_signals?: string[];
          conversion_strength?: string;
          has_booking_system?: boolean;
          booking_system?: string | null;
          contactability_score?: number;
          website_gap?: string;
          discovery_fit?: string;
          lead_score?: number;
          opportunity_grade?: string;
          priority_label?: string;
          score_reasons?: string[];
          is_existing_lead?: boolean;
          existing_lead_id?: string | null;
          promoted_lead_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["discovered_leads"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "discovered_leads_discovery_run_id_fkey";
            columns: ["discovery_run_id"];
            isOneToOne: false;
            referencedRelation: "discovery_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discovered_leads_existing_lead_id_fkey";
            columns: ["existing_lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discovered_leads_promoted_lead_id_fkey";
            columns: ["promoted_lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      api_usage_events: {
        Row: {
          id: string;
          account_id: string | null;
          provider: string;
          feature: string;
          units: number;
          query: string | null;
          location: string | null;
          result_count: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          provider: string;
          feature?: string;
          units?: number;
          query?: string | null;
          location?: string | null;
          result_count?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["api_usage_events"]["Insert"]>;
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
export type DiscoveryRun = Database["public"]["Tables"]["discovery_runs"]["Row"];
export type DiscoveryRunInsert = Database["public"]["Tables"]["discovery_runs"]["Insert"];
export type DiscoveredLeadRow = Database["public"]["Tables"]["discovered_leads"]["Row"];
export type DiscoveredLeadInsert = Database["public"]["Tables"]["discovered_leads"]["Insert"];
export type ApiUsageEvent = Database["public"]["Tables"]["api_usage_events"]["Row"];
