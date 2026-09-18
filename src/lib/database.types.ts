export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artist_candidates: {
        Row: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          canonical_artist_id: string | null
          created_at: string
          creator_organization_id: string
          decision_reason: string | null
          id: string
          name: string
          profile: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          website_url: string | null
        }
        Insert: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          canonical_artist_id?: string | null
          created_at?: string
          creator_organization_id: string
          decision_reason?: string | null
          id?: string
          name: string
          profile?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          website_url?: string | null
        }
        Update: {
          artist_type?: Database["public"]["Enums"]["artist_type"]
          canonical_artist_id?: string | null
          created_at?: string
          creator_organization_id?: string
          decision_reason?: string | null
          id?: string
          name?: string
          profile?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_candidates_canonical_artist_id_fkey"
            columns: ["canonical_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_candidates_creator_organization_id_fkey"
            columns: ["creator_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_candidates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_change_requests: {
        Row: {
          artist_id: string
          created_at: string
          creator_organization_id: string
          decision_reason: string | null
          id: string
          proposed_artist_type: Database["public"]["Enums"]["artist_type"]
          proposed_name: string
          proposed_profile: string | null
          proposed_website_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["shared_entity_change_status"]
          submitted_by: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          creator_organization_id: string
          decision_reason?: string | null
          id?: string
          proposed_artist_type: Database["public"]["Enums"]["artist_type"]
          proposed_name: string
          proposed_profile?: string | null
          proposed_website_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shared_entity_change_status"]
          submitted_by: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          creator_organization_id?: string
          decision_reason?: string | null
          id?: string
          proposed_artist_type?: Database["public"]["Enums"]["artist_type"]
          proposed_name?: string
          proposed_profile?: string | null
          proposed_website_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shared_entity_change_status"]
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_change_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_change_requests_creator_organization_id_fkey"
            columns: ["creator_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_change_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          created_at: string
          id: string
          name: string
          profile: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          created_at?: string
          id?: string
          name: string
          profile?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          artist_type?: Database["public"]["Enums"]["artist_type"]
          created_at?: string
          id?: string
          name?: string
          profile?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      event_artists: {
        Row: {
          artist_id: string
          created_at: string
          display_order: number
          event_revision_id: string
          id: string
          role: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          display_order?: number
          event_revision_id: string
          id?: string
          role: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          display_order?: number
          event_revision_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_artists_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cancellation_requests: {
        Row: {
          created_at: string
          decision_reason: string | null
          event_id: string
          id: string
          requested_by: string
          requested_reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["event_cancellation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision_reason?: string | null
          event_id: string
          id?: string
          requested_by: string
          requested_reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["event_cancellation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision_reason?: string | null
          event_id?: string
          id?: string
          requested_by?: string
          requested_reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["event_cancellation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cancellation_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cancellation_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cancellation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_content_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          event_id: string
          event_revision_id: string | null
          id: number
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          event_id: string
          event_revision_id?: string | null
          id?: never
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          event_id?: string
          event_revision_id?: string | null
          id?: never
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_content_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_content_audit_log_event_id_event_revision_id_fkey"
            columns: ["event_id", "event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["event_id", "id"]
          },
          {
            foreignKeyName: "event_content_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_content_audit_log_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_links: {
        Row: {
          created_at: string
          display_order: number
          event_revision_id: string
          id: string
          label: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          event_revision_id: string
          id?: string
          label: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          event_revision_id?: string
          id?: string
          label?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_links_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media: {
        Row: {
          alt_text: string
          content_type: string
          created_at: string
          display_order: number
          event_revision_id: string
          id: string
          is_main: boolean
          object_key: string
        }
        Insert: {
          alt_text: string
          content_type: string
          created_at?: string
          display_order?: number
          event_revision_id: string
          id?: string
          is_main?: boolean
          object_key: string
        }
        Update: {
          alt_text?: string
          content_type?: string
          created_at?: string
          display_order?: number
          event_revision_id?: string
          id?: string
          is_main?: boolean
          object_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_revision_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["event_review_action"]
          actor_id: string
          cancellation_request_id: string | null
          created_at: string
          event_id: string
          event_revision_id: string | null
          from_status: string | null
          id: number
          reason: string | null
          to_status: string
        }
        Insert: {
          action: Database["public"]["Enums"]["event_review_action"]
          actor_id: string
          cancellation_request_id?: string | null
          created_at?: string
          event_id: string
          event_revision_id?: string | null
          from_status?: string | null
          id?: never
          reason?: string | null
          to_status: string
        }
        Update: {
          action?: Database["public"]["Enums"]["event_review_action"]
          actor_id?: string
          cancellation_request_id?: string | null
          created_at?: string
          event_id?: string
          event_revision_id?: string | null
          from_status?: string | null
          id?: never
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_revision_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revision_audit_log_cancellation_request_id_fkey"
            columns: ["cancellation_request_id"]
            isOneToOne: false
            referencedRelation: "event_cancellation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revision_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revision_audit_log_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_revisions: {
        Row: {
          application_deadline: string | null
          created_at: string
          created_by: string
          decision_reason: string | null
          description: string | null
          event_id: string
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          no_registration_required: boolean
          proposed_parent_event_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["event_revision_status"]
          title: string
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string
          created_by: string
          decision_reason?: string | null
          description?: string | null
          event_id: string
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          no_registration_required?: boolean
          proposed_parent_event_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["event_revision_status"]
          title: string
        }
        Update: {
          application_deadline?: string | null
          created_at?: string
          created_by?: string
          decision_reason?: string | null
          description?: string | null
          event_id?: string
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          no_registration_required?: boolean
          proposed_parent_event_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["event_revision_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revisions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revisions_proposed_parent_event_id_fkey"
            columns: ["proposed_parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_revisions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedules: {
        Row: {
          all_day: boolean
          ends_at: string | null
          event_revision_id: string
          id: string
          starts_at: string
          venue_id: string
        }
        Insert: {
          all_day?: boolean
          ends_at?: string | null
          event_revision_id: string
          id?: string
          starts_at: string
          venue_id: string
        }
        Update: {
          all_day?: boolean
          ends_at?: string | null
          event_revision_id?: string
          id?: string
          starts_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedules_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedules_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_links: {
        Row: {
          created_at: string
          display_order: number
          event_revision_id: string
          id: string
          kind: Database["public"]["Enums"]["event_access_link_kind"]
          label: string | null
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          event_revision_id: string
          id?: string
          kind: Database["public"]["Enums"]["event_access_link_kind"]
          label?: string | null
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          event_revision_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["event_access_link_kind"]
          label?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_links_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_offers: {
        Row: {
          amount_minor: number | null
          created_at: string
          currency: string | null
          display_order: number
          event_revision_id: string
          id: string
          label: string | null
          max_amount_minor: number | null
          min_amount_minor: number | null
          notes: string | null
          price_type: Database["public"]["Enums"]["event_ticket_price_type"]
        }
        Insert: {
          amount_minor?: number | null
          created_at?: string
          currency?: string | null
          display_order?: number
          event_revision_id: string
          id?: string
          label?: string | null
          max_amount_minor?: number | null
          min_amount_minor?: number | null
          notes?: string | null
          price_type: Database["public"]["Enums"]["event_ticket_price_type"]
        }
        Update: {
          amount_minor?: number | null
          created_at?: string
          currency?: string | null
          display_order?: number
          event_revision_id?: string
          id?: string
          label?: string | null
          max_amount_minor?: number | null
          min_amount_minor?: number | null
          notes?: string | null
          price_type?: Database["public"]["Enums"]["event_ticket_price_type"]
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_offers_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          owner_organization_id: string
          parent_event_id: string | null
          published_revision_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          owner_organization_id: string
          parent_event_id?: string | null
          published_revision_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          owner_organization_id?: string
          parent_event_id?: string | null
          published_revision_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_published_revision_belongs_to_event"
            columns: ["id", "published_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["event_id", "id"]
          },
          {
            foreignKeyName: "events_published_revision_fk"
            columns: ["published_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_applications: {
        Row: {
          applicant_id: string
          created_at: string
          decision_reason: string | null
          id: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          website_url: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          decision_reason?: string | null
          id?: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          website_url?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          decision_reason?: string | null
          id?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["organization_audit_action"]
          actor_id: string
          application_id: string | null
          created_at: string
          id: number
          organization_id: string | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["organization_audit_action"]
          actor_id: string
          application_id?: string | null
          created_at?: string
          id?: never
          organization_id?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["organization_audit_action"]
          actor_id?: string
          application_id?: string | null
          created_at?: string
          id?: never
          organization_id?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_audit_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      review_notifications: {
        Row: {
          cancellation_request_id: string | null
          created_at: string
          decision_reason: string | null
          event_id: string | null
          event_revision_audit_log_id: number | null
          event_revision_id: string | null
          id: number
          kind: Database["public"]["Enums"]["review_notification_kind"]
          organization_application_id: string | null
          organization_audit_log_id: number | null
          read_at: string | null
          recipient_user_id: string
          subject: string
        }
        Insert: {
          cancellation_request_id?: string | null
          created_at?: string
          decision_reason?: string | null
          event_id?: string | null
          event_revision_audit_log_id?: number | null
          event_revision_id?: string | null
          id?: never
          kind: Database["public"]["Enums"]["review_notification_kind"]
          organization_application_id?: string | null
          organization_audit_log_id?: number | null
          read_at?: string | null
          recipient_user_id: string
          subject: string
        }
        Update: {
          cancellation_request_id?: string | null
          created_at?: string
          decision_reason?: string | null
          event_id?: string | null
          event_revision_audit_log_id?: number | null
          event_revision_id?: string | null
          id?: never
          kind?: Database["public"]["Enums"]["review_notification_kind"]
          organization_application_id?: string | null
          organization_audit_log_id?: number | null
          read_at?: string | null
          recipient_user_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_notifications_cancellation_request_id_fkey"
            columns: ["cancellation_request_id"]
            isOneToOne: false
            referencedRelation: "event_cancellation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notifications_event_revision_audit_log_id_fkey"
            columns: ["event_revision_audit_log_id"]
            isOneToOne: true
            referencedRelation: "event_revision_audit_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notifications_event_revision_id_fkey"
            columns: ["event_revision_id"]
            isOneToOne: false
            referencedRelation: "event_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notifications_organization_application_id_fkey"
            columns: ["organization_application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notifications_organization_audit_log_id_fkey"
            columns: ["organization_audit_log_id"]
            isOneToOne: true
            referencedRelation: "organization_audit_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_entity_moderation_audit: {
        Row: {
          action: Database["public"]["Enums"]["shared_entity_moderation_action"]
          actor_id: string
          after_data: Json | null
          before_data: Json | null
          canonical_id: string | null
          created_at: string
          creator_organization_id: string | null
          id: number
          reason: string
          resource_id: string
          resource_type: Database["public"]["Enums"]["shared_entity_resource_type"]
        }
        Insert: {
          action: Database["public"]["Enums"]["shared_entity_moderation_action"]
          actor_id: string
          after_data?: Json | null
          before_data?: Json | null
          canonical_id?: string | null
          created_at?: string
          creator_organization_id?: string | null
          id?: never
          reason: string
          resource_id: string
          resource_type: Database["public"]["Enums"]["shared_entity_resource_type"]
        }
        Update: {
          action?: Database["public"]["Enums"]["shared_entity_moderation_action"]
          actor_id?: string
          after_data?: Json | null
          before_data?: Json | null
          canonical_id?: string | null
          created_at?: string
          creator_organization_id?: string | null
          id?: never
          reason?: string
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["shared_entity_resource_type"]
        }
        Relationships: [
          {
            foreignKeyName: "shared_entity_moderation_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_entity_moderation_audit_creator_organization_id_fkey"
            columns: ["creator_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_candidates: {
        Row: {
          address_line1: string
          address_line2: string | null
          canonical_venue_id: string | null
          created_at: string
          creator_organization_id: string
          decision_reason: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          prefecture: Database["public"]["Enums"]["prefecture_code"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          website_url: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          canonical_venue_id?: string | null
          created_at?: string
          creator_organization_id: string
          decision_reason?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          prefecture: Database["public"]["Enums"]["prefecture_code"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          website_url?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          canonical_venue_id?: string | null
          created_at?: string
          creator_organization_id?: string
          decision_reason?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          prefecture?: Database["public"]["Enums"]["prefecture_code"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_candidates_canonical_venue_id_fkey"
            columns: ["canonical_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_candidates_creator_organization_id_fkey"
            columns: ["creator_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_candidates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_change_requests: {
        Row: {
          created_at: string
          creator_organization_id: string
          decision_reason: string | null
          id: string
          proposed_address_line1: string
          proposed_address_line2: string | null
          proposed_latitude: number | null
          proposed_longitude: number | null
          proposed_name: string
          proposed_prefecture: Database["public"]["Enums"]["prefecture_code"]
          proposed_website_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["shared_entity_change_status"]
          submitted_by: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          creator_organization_id: string
          decision_reason?: string | null
          id?: string
          proposed_address_line1: string
          proposed_address_line2?: string | null
          proposed_latitude?: number | null
          proposed_longitude?: number | null
          proposed_name: string
          proposed_prefecture: Database["public"]["Enums"]["prefecture_code"]
          proposed_website_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shared_entity_change_status"]
          submitted_by: string
          venue_id: string
        }
        Update: {
          created_at?: string
          creator_organization_id?: string
          decision_reason?: string | null
          id?: string
          proposed_address_line1?: string
          proposed_address_line2?: string | null
          proposed_latitude?: number | null
          proposed_longitude?: number | null
          proposed_name?: string
          proposed_prefecture?: Database["public"]["Enums"]["prefecture_code"]
          proposed_website_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shared_entity_change_status"]
          submitted_by?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_change_requests_creator_organization_id_fkey"
            columns: ["creator_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_change_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_change_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address_line1: string
          address_line2: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          prefecture: Database["public"]["Enums"]["prefecture_code"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          prefecture: Database["public"]["Enums"]["prefecture_code"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          prefecture?: Database["public"]["Enums"]["prefecture_code"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_artist_candidate: {
        Args: { candidate_id: string; reason: string }
        Returns: string
      }
      activate_venue_candidate: {
        Args: { candidate_id: string; reason: string }
        Returns: string
      }
      approve_artist_change_request: {
        Args: { reason: string; request_id: string }
        Returns: string
      }
      approve_event_cancellation: {
        Args: { public_reason: string; target_request_id: string }
        Returns: undefined
      }
      approve_event_revision: {
        Args: { review_reason?: string; target_revision_id: string }
        Returns: undefined
      }
      approve_organization_application: {
        Args: { application_id: string; decision_reason?: string }
        Returns: string
      }
      approve_venue_change_request: {
        Args: { reason: string; request_id: string }
        Returns: string
      }
      assert_event_revision_reviewable: {
        Args: { target_revision_id: string }
        Returns: undefined
      }
      correct_artist: {
        Args: {
          artist_id: string
          corrected_artist_type: Database["public"]["Enums"]["artist_type"]
          corrected_name: string
          corrected_profile: string
          corrected_website_url: string
          reason: string
        }
        Returns: undefined
      }
      correct_artist_candidate: {
        Args: {
          candidate_id: string
          corrected_artist_type: Database["public"]["Enums"]["artist_type"]
          corrected_name: string
          corrected_profile: string
          corrected_website_url: string
          reason: string
        }
        Returns: undefined
      }
      correct_venue: {
        Args: {
          corrected_address_line1: string
          corrected_address_line2: string
          corrected_latitude: number
          corrected_longitude: number
          corrected_name: string
          corrected_prefecture: Database["public"]["Enums"]["prefecture_code"]
          corrected_website_url: string
          reason: string
          venue_id: string
        }
        Returns: undefined
      }
      correct_venue_candidate: {
        Args: {
          candidate_id: string
          corrected_address_line1: string
          corrected_address_line2: string
          corrected_latitude: number
          corrected_longitude: number
          corrected_name: string
          corrected_prefecture: Database["public"]["Enums"]["prefecture_code"]
          corrected_website_url: string
          reason: string
        }
        Returns: undefined
      }
      create_event_revision_draft: {
        Args: { target_event_id: string }
        Returns: string
      }
      is_current_published_event_revision: {
        Args: { target_revision_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { check_user?: string; target_organization_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { check_user?: string }; Returns: boolean }
      merge_artist_candidate: {
        Args: {
          candidate_id: string
          reason: string
          survivor_artist_id: string
        }
        Returns: string
      }
      merge_venue_candidate: {
        Args: {
          candidate_id: string
          reason: string
          survivor_venue_id: string
        }
        Returns: string
      }
      reject_artist_candidate: {
        Args: { candidate_id: string; reason: string }
        Returns: undefined
      }
      reject_artist_change_request: {
        Args: { reason: string; request_id: string }
        Returns: undefined
      }
      reject_organization_application: {
        Args: { application_id: string; decision_reason: string }
        Returns: undefined
      }
      reject_venue_candidate: {
        Args: { candidate_id: string; reason: string }
        Returns: undefined
      }
      reject_venue_change_request: {
        Args: { reason: string; request_id: string }
        Returns: undefined
      }
      remove_organization_member: {
        Args: { target_organization_id: string; target_user_id: string }
        Returns: undefined
      }
      request_event_cancellation: {
        Args: { requested_reason: string; target_event_id: string }
        Returns: string
      }
      request_event_cancellation_changes: {
        Args: { review_reason: string; target_request_id: string }
        Returns: undefined
      }
      request_event_revision_changes: {
        Args: { review_reason: string; target_revision_id: string }
        Returns: undefined
      }
      require_moderation_reason: { Args: { reason: string }; Returns: string }
      resubmit_event_cancellation_request: {
        Args: { requested_reason: string; target_request_id: string }
        Returns: undefined
      }
      set_organization_member_role: {
        Args: {
          target_organization_id: string
          target_role: Database["public"]["Enums"]["organization_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      submit_event_revision: {
        Args: { target_revision_id: string }
        Returns: undefined
      }
    }
    Enums: {
      application_status: "submitted" | "approved" | "rejected"
      artist_type: "individual" | "company" | "collective" | "other"
      candidate_status: "pending" | "activated" | "rejected" | "merged"
      event_access_link_kind: "ticket" | "registration"
      event_cancellation_status: "in_review" | "changes_requested" | "approved"
      event_review_action:
        | "revision_submitted"
        | "revision_changes_requested"
        | "revision_approved"
        | "revision_superseded"
        | "cancellation_requested"
        | "cancellation_resubmitted"
        | "cancellation_changes_requested"
        | "cancellation_approved"
      event_revision_status:
        | "draft"
        | "in_review"
        | "changes_requested"
        | "approved"
        | "superseded"
      event_ticket_price_type:
        | "fixed"
        | "free"
        | "range"
        | "donation"
        | "pay_what_you_can"
        | "sliding_scale"
        | "dynamic"
        | "included"
      event_type:
        | "performance"
        | "open_studio"
        | "talk"
        | "workshop"
        | "audition"
        | "open_call"
        | "residency"
        | "festival"
        | "other"
      organization_audit_action:
        | "application_approved"
        | "application_rejected"
        | "member_added"
        | "member_role_changed"
        | "member_removed"
      organization_role: "owner" | "admin" | "editor"
      prefecture_code: "TOKYO" | "KANAGAWA"
      review_notification_kind:
        | "organization_application_approved"
        | "organization_application_rejected"
        | "event_revision_approved"
        | "event_revision_changes_requested"
        | "event_cancellation_approved"
        | "event_cancellation_changes_requested"
      shared_entity_change_status: "pending" | "approved" | "rejected"
      shared_entity_moderation_action:
        | "candidate_corrected"
        | "candidate_activated"
        | "candidate_rejected"
        | "candidate_merged"
        | "change_requested"
        | "change_approved"
        | "change_rejected"
        | "canonical_corrected"
      shared_entity_resource_type:
        | "artist_candidate"
        | "venue_candidate"
        | "artist"
        | "venue"
        | "artist_change_request"
        | "venue_change_request"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: ["submitted", "approved", "rejected"],
      artist_type: ["individual", "company", "collective", "other"],
      candidate_status: ["pending", "activated", "rejected", "merged"],
      event_access_link_kind: ["ticket", "registration"],
      event_cancellation_status: ["in_review", "changes_requested", "approved"],
      event_review_action: [
        "revision_submitted",
        "revision_changes_requested",
        "revision_approved",
        "revision_superseded",
        "cancellation_requested",
        "cancellation_resubmitted",
        "cancellation_changes_requested",
        "cancellation_approved",
      ],
      event_revision_status: [
        "draft",
        "in_review",
        "changes_requested",
        "approved",
        "superseded",
      ],
      event_ticket_price_type: [
        "fixed",
        "free",
        "range",
        "donation",
        "pay_what_you_can",
        "sliding_scale",
        "dynamic",
        "included",
      ],
      event_type: [
        "performance",
        "open_studio",
        "talk",
        "workshop",
        "audition",
        "open_call",
        "residency",
        "festival",
        "other",
      ],
      organization_audit_action: [
        "application_approved",
        "application_rejected",
        "member_added",
        "member_role_changed",
        "member_removed",
      ],
      organization_role: ["owner", "admin", "editor"],
      prefecture_code: ["TOKYO", "KANAGAWA"],
      review_notification_kind: [
        "organization_application_approved",
        "organization_application_rejected",
        "event_revision_approved",
        "event_revision_changes_requested",
        "event_cancellation_approved",
        "event_cancellation_changes_requested",
      ],
      shared_entity_change_status: ["pending", "approved", "rejected"],
      shared_entity_moderation_action: [
        "candidate_corrected",
        "candidate_activated",
        "candidate_rejected",
        "candidate_merged",
        "change_requested",
        "change_approved",
        "change_rejected",
        "canonical_corrected",
      ],
      shared_entity_resource_type: [
        "artist_candidate",
        "venue_candidate",
        "artist",
        "venue",
        "artist_change_request",
        "venue_change_request",
      ],
    },
  },
} as const

