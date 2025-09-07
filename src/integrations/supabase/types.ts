export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          created_at: string | null
          huggingface_model: string | null
          huggingface_token: string | null
          id: string
          is_active: boolean | null
          lmstudio_model: string | null
          lmstudio_url: string | null
          max_tokens: number | null
          ollama_model: string | null
          ollama_url: string | null
          openai_api_key: string | null
          openai_model: string | null
          provider: string
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          huggingface_model?: string | null
          huggingface_token?: string | null
          id?: string
          is_active?: boolean | null
          lmstudio_model?: string | null
          lmstudio_url?: string | null
          max_tokens?: number | null
          ollama_model?: string | null
          ollama_url?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          provider?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          huggingface_model?: string | null
          huggingface_token?: string | null
          id?: string
          is_active?: boolean | null
          lmstudio_model?: string | null
          lmstudio_url?: string | null
          max_tokens?: number | null
          ollama_model?: string | null
          ollama_url?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          provider?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          permissions: Json
          rate_limit_per_hour: number | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          permissions?: Json
          rate_limit_per_hour?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          permissions?: Json
          rate_limit_per_hour?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          metadata: Json | null
          method: string
          request_size: number | null
          response_status: number | null
          response_time_ms: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          method: string
          request_size?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          method?: string
          request_size?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          entity: string
          entity_id: string | null
          hash: string
          id: string
          prev_hash: string | null
          summary: string
          ts: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string
          entity: string
          entity_id?: string | null
          hash: string
          id?: string
          prev_hash?: string | null
          summary: string
          ts?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          hash?: string
          id?: string
          prev_hash?: string | null
          summary?: string
          ts?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string | null
          id: string
          issued_at: string | null
          serial: string
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          id?: string
          issued_at?: string | null
          serial: string
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          id?: string
          issued_at?: string | null
          serial?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          device_id: string
          id: string
          role: string
          updated_at: string
          workflow_context: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          device_id: string
          id?: string
          role: string
          updated_at?: string
          workflow_context?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          device_id?: string
          id?: string
          role?: string
          updated_at?: string
          workflow_context?: Json | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          app_version: string | null
          arrived_at: string
          created_at: string
          device_id: string | null
          geo_hint: string | null
          id: string
          method: string | null
          patient_id: string
          rssi: number | null
          sync_data: Json | null
        }
        Insert: {
          app_version?: string | null
          arrived_at?: string
          created_at?: string
          device_id?: string | null
          geo_hint?: string | null
          id?: string
          method?: string | null
          patient_id: string
          rssi?: number | null
          sync_data?: Json | null
        }
        Update: {
          app_version?: string | null
          arrived_at?: string
          created_at?: string
          device_id?: string | null
          geo_hint?: string | null
          id?: string
          method?: string | null
          patient_id?: string
          rssi?: number | null
          sync_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          published: boolean | null
          required_for_roles: string[] | null
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          required_for_roles?: string[] | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          required_for_roles?: string[] | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string
          device_name: string | null
          device_uuid: string
          first_seen_at: string
          id: string
          last_seen_at: string
          patient_id: string | null
          public_key: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          device_uuid: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          patient_id?: string | null
          public_key?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          device_uuid?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          patient_id?: string | null
          public_key?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dosages: {
        Row: {
          administered_at: string
          administered_by: string
          created_at: string
          dose_mg: number
          id: string
          medication: string
          notes: string | null
          observed: boolean
          patient_id: string
          visit_id: string | null
        }
        Insert: {
          administered_at?: string
          administered_by: string
          created_at?: string
          dose_mg: number
          id?: string
          medication?: string
          notes?: string | null
          observed?: boolean
          patient_id: string
          visit_id?: string | null
        }
        Update: {
          administered_at?: string
          administered_by?: string
          created_at?: string
          dose_mg?: number
          id?: string
          medication?: string
          notes?: string | null
          observed?: boolean
          patient_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dosages_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dosages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dosages_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      fga_relations: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          object_id: string
          object_type: string
          relation: Database["public"]["Enums"]["fga_relation_type"]
          subject_id: string
          subject_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          object_id: string
          object_type: string
          relation: Database["public"]["Enums"]["fga_relation_type"]
          subject_id: string
          subject_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          object_id?: string
          object_type?: string
          relation?: Database["public"]["Enums"]["fga_relation_type"]
          subject_id?: string
          subject_type?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_size: number
          id: string
          input_path: string | null
          mime_type: string
          options: Json
          original_name: string
          output_path: string | null
          output_url: string | null
          preset: string
          progress: number
          provider: Database["public"]["Enums"]["provider_type"]
          provider_job_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          target_format: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_size: number
          id?: string
          input_path?: string | null
          mime_type: string
          options?: Json
          original_name: string
          output_path?: string | null
          output_url?: string | null
          preset: string
          progress?: number
          provider: Database["public"]["Enums"]["provider_type"]
          provider_job_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_format: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_size?: number
          id?: string
          input_path?: string | null
          mime_type?: string
          options?: Json
          original_name?: string
          output_path?: string | null
          output_url?: string | null
          preset?: string
          progress?: number
          provider?: Database["public"]["Enums"]["provider_type"]
          provider_job_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_format?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          module_id: string | null
          order_index: number
          quiz_id: string | null
          title: string
          type: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          module_id?: string | null
          order_index?: number
          quiz_id?: string | null
          title: string
          type: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          module_id?: string | null
          order_index?: number
          quiz_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_entries: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          tags: string[] | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          tags?: string[] | null
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          tags?: string[] | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_entries_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workbench_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          dob: string
          first_name: string
          id: string
          last_name: string
          mrn: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dob: string
          first_name: string
          id?: string
          last_name: string
          mrn: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dob?: string
          first_name?: string
          id?: string
          last_name?: string
          mrn?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          ip_hash: string | null
          passed: boolean
          quiz_id: string | null
          score: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_hash?: string | null
          passed: boolean
          quiz_id?: string | null
          score: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_hash?: string | null
          passed?: boolean
          quiz_id?: string | null
          score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          id: string
          pass_score: number
          questions: Json
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pass_score: number
          questions: Json
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pass_score?: number
          questions?: Json
          title?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value_json?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      slack_integrations: {
        Row: {
          active: boolean
          app_id: string
          bot_token_encrypted: string
          channels: Json | null
          created_at: string
          created_by: string | null
          id: string
          last_verified_at: string | null
          scope: string
          team_id: string
          updated_at: string
          webhook_url: string | null
          workspace_id: string
          workspace_name: string
        }
        Insert: {
          active?: boolean
          app_id: string
          bot_token_encrypted: string
          channels?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_verified_at?: string | null
          scope: string
          team_id: string
          updated_at?: string
          webhook_url?: string | null
          workspace_id: string
          workspace_name: string
        }
        Update: {
          active?: boolean
          app_id?: string
          bot_token_encrypted?: string
          channels?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_verified_at?: string | null
          scope?: string
          team_id?: string
          updated_at?: string
          webhook_url?: string | null
          workspace_id?: string
          workspace_name?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          id: string
          mfa_enabled: boolean
          name: string
          role: string
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          mfa_enabled?: boolean
          name: string
          role?: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          mfa_enabled?: boolean
          name?: string
          role?: string
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          contact_info: string | null
          contact_name: string | null
          created_at: string
          details: string | null
          id: string
          product: string
          resolution: string | null
          resolved_at: string | null
          role: string
          severity: string
          sla_due_at: string | null
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          contact_info?: string | null
          contact_name?: string | null
          created_at?: string
          details?: string | null
          id?: string
          product: string
          resolution?: string | null
          resolved_at?: string | null
          role: string
          severity: string
          sla_due_at?: string | null
          status?: string
          summary: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          contact_info?: string | null
          contact_name?: string | null
          created_at?: string
          details?: string | null
          id?: string
          product?: string
          resolution?: string | null
          resolved_at?: string | null
          role?: string
          severity?: string
          sla_due_at?: string | null
          status?: string
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_audit_events: {
        Row: {
          created_at: string | null
          event: string
          id: number
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: number
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: number
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      training_certificates: {
        Row: {
          course_id: string | null
          id: string
          issued_at: string | null
          serial: string
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          id?: string
          issued_at?: string | null
          serial: string
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          id?: string
          issued_at?: string | null
          serial?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          published: boolean | null
          required_for_roles: string[] | null
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          required_for_roles?: string[] | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          required_for_roles?: string[] | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      training_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      training_lessons: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          module_id: string
          order_index: number
          quiz_id: string | null
          title: string
          type: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          module_id: string
          order_index?: number
          quiz_id?: string | null
          title: string
          type: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          module_id?: string
          order_index?: number
          quiz_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      training_quiz_attempts: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          ip_hash: string | null
          passed: boolean
          quiz_id: string | null
          score: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_hash?: string | null
          passed: boolean
          quiz_id?: string | null
          score: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_hash?: string | null
          passed?: boolean
          quiz_id?: string | null
          score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "training_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quizzes: {
        Row: {
          created_at: string | null
          id: string
          pass_score: number
          questions: Json
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pass_score: number
          questions: Json
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pass_score?: number
          questions?: Json
          title?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          arrived_at: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          staff_id: string | null
          triage_status: string | null
          updated_at: string
        }
        Insert: {
          arrived_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          staff_id?: string | null
          triage_status?: string | null
          updated_at?: string
        }
        Update: {
          arrived_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          staff_id?: string | null
          triage_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      workbench_edges: {
        Row: {
          config: Json
          created_at: string
          edge_id: string
          id: string
          source_handle: string | null
          source_node_id: string
          target_handle: string | null
          target_node_id: string
          workflow_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          edge_id: string
          id?: string
          source_handle?: string | null
          source_node_id: string
          target_handle?: string | null
          target_node_id: string
          workflow_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          edge_id?: string
          id?: string
          source_handle?: string | null
          source_node_id?: string
          target_handle?: string | null
          target_node_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workbench_edges_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workbench_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workbench_edges_workflow_id_source_node_id_fkey"
            columns: ["workflow_id", "source_node_id"]
            isOneToOne: false
            referencedRelation: "workbench_nodes"
            referencedColumns: ["workflow_id", "node_id"]
          },
          {
            foreignKeyName: "workbench_edges_workflow_id_target_node_id_fkey"
            columns: ["workflow_id", "target_node_id"]
            isOneToOne: false
            referencedRelation: "workbench_nodes"
            referencedColumns: ["workflow_id", "node_id"]
          },
        ]
      }
      workbench_nodes: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          node_id: string
          node_type: Database["public"]["Enums"]["node_type"]
          position_x: number
          position_y: number
          updated_at: string
          workflow_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          node_id: string
          node_type: Database["public"]["Enums"]["node_type"]
          position_x?: number
          position_y?: number
          updated_at?: string
          workflow_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          node_id?: string
          node_type?: Database["public"]["Enums"]["node_type"]
          position_x?: number
          position_y?: number
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workbench_nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workbench_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workbench_workflows: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          graph_data: Json
          id: string
          name: string
          published_at: string | null
          status: Database["public"]["Enums"]["workflow_status"]
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          graph_data?: Json
          id?: string
          name: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          graph_data?: Json
          id?: string
          name?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      workflow_events: {
        Row: {
          event_data: Json | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          node_id: string | null
          run_id: string
          sequence_number: number
          timestamp: string
        }
        Insert: {
          event_data?: Json | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          node_id?: string | null
          run_id: string
          sequence_number: number
          timestamp?: string
        }
        Update: {
          event_data?: Json | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          node_id?: string | null
          run_id?: string
          sequence_number?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["run_status"]
          temporal_run_id: string | null
          temporal_workflow_id: string | null
          workflow_id: string
          workflow_version: number
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          temporal_run_id?: string | null
          temporal_workflow_id?: string | null
          workflow_id: string
          workflow_version: number
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          temporal_run_id?: string | null
          temporal_workflow_id?: string | null
          workflow_id?: string
          workflow_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workbench_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_schedules: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          cron_expression: string | null
          id: string
          input_data: Json | null
          interval_seconds: number | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          schedule_type: Database["public"]["Enums"]["schedule_type"]
          scheduled_at: string | null
          timezone: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          id?: string
          input_data?: Json | null
          interval_seconds?: number | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          schedule_type: Database["public"]["Enums"]["schedule_type"]
          scheduled_at?: string | null
          timezone?: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          id?: string
          input_data?: Json | null
          interval_seconds?: number | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          scheduled_at?: string | null
          timezone?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_schedules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workbench_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_audit_hash: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_type: string
          p_entity: string
          p_entity_id: string
          p_prev_hash: string
          p_summary: string
          p_ts: string
        }
        Returns: string
      }
      calculate_sla_due: {
        Args: { created_time: string; severity_level: string }
        Returns: string
      }
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_workflow_access: {
        Args: {
          required_permission?: Database["public"]["Enums"]["fga_relation_type"]
          workflow_uuid: string
        }
        Returns: boolean
      }
      hash_api_key: {
        Args: { key: string }
        Returns: string
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_workflow_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      needs_initial_setup: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      register_staff: {
        Args: {
          _full_name: string
          _role?: Database["public"]["Enums"]["role_type"]
        }
        Returns: undefined
      }
      setup_initial_admin: {
        Args: { _full_name: string; _user_id: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      training_get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validate_api_key: {
        Args: { key: string }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      event_type:
        | "started"
        | "node_executed"
        | "edge_traversed"
        | "completed"
        | "failed"
        | "paused"
        | "resumed"
      fga_relation_type:
        | "can_access"
        | "can_write"
        | "can_execute"
        | "can_manage"
        | "member_of"
      job_status: "queued" | "processing" | "completed" | "failed" | "cancelled"
      node_type:
        | "agent"
        | "tool"
        | "datasource"
        | "decision"
        | "slack"
        | "memory"
      provider_type: "freeconvert" | "sovereign"
      role_type: "admin" | "clinician" | "reception"
      run_status: "pending" | "running" | "completed" | "failed" | "cancelled"
      schedule_type: "once" | "interval" | "cron"
      workflow_status: "draft" | "active" | "paused" | "archived"
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
  public: {
    Enums: {
      event_type: [
        "started",
        "node_executed",
        "edge_traversed",
        "completed",
        "failed",
        "paused",
        "resumed",
      ],
      fga_relation_type: [
        "can_access",
        "can_write",
        "can_execute",
        "can_manage",
        "member_of",
      ],
      job_status: ["queued", "processing", "completed", "failed", "cancelled"],
      node_type: ["agent", "tool", "datasource", "decision", "slack", "memory"],
      provider_type: ["freeconvert", "sovereign"],
      role_type: ["admin", "clinician", "reception"],
      run_status: ["pending", "running", "completed", "failed", "cancelled"],
      schedule_type: ["once", "interval", "cron"],
      workflow_status: ["draft", "active", "paused", "archived"],
    },
  },
} as const
