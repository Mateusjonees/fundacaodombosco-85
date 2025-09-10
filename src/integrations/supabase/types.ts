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
      anamnesis_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      appointment_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          materials_used: Json | null
          schedule_id: string
          session_duration: number | null
          session_notes: string | null
          session_number: number
          total_materials_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          materials_used?: Json | null
          schedule_id: string
          session_duration?: number | null
          session_notes?: string | null
          session_number?: number
          total_materials_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          materials_used?: Json | null
          schedule_id?: string
          session_duration?: number | null
          session_notes?: string | null
          session_number?: number
          total_materials_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      channel_members: {
        Row: {
          channel_id: string | null
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          client_id: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          client_id?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          client_id?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string | null
          document_name: string
          document_type: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          client_id?: string | null
          document_name: string
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string | null
          document_name?: string
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_private: boolean | null
          note_text: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note_text: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note_text?: string
          note_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          clinical_observations: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          diagnosis: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          is_active: boolean | null
          medical_history: string | null
          name: string
          neuropsych_complaint: string | null
          notes: string | null
          phone: string | null
          responsible_name: string | null
          responsible_phone: string | null
          rg: string | null
          treatment_expectations: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          clinical_observations?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean | null
          medical_history?: string | null
          name: string
          neuropsych_complaint?: string | null
          notes?: string | null
          phone?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          rg?: string | null
          treatment_expectations?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          clinical_observations?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean | null
          medical_history?: string | null
          name?: string
          neuropsych_complaint?: string | null
          notes?: string | null
          phone?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          rg?: string | null
          treatment_expectations?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          employee_id: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_timesheet: {
        Row: {
          approved_by: string | null
          break_end: string | null
          break_start: string | null
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          break_end?: string | null
          break_start?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          break_end?: string | null
          break_start?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          emergency_contact: string | null
          emergency_phone: string | null
          employee_code: string | null
          id: string
          notes: string | null
          professional_license: string | null
          profile_id: string
          specialization: string | null
          updated_at: string
          user_id: string
          work_schedule: Json | null
        }
        Insert: {
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_code?: string | null
          id?: string
          notes?: string | null
          professional_license?: string | null
          profile_id: string
          specialization?: string | null
          updated_at?: string
          user_id: string
          work_schedule?: Json | null
        }
        Update: {
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_code?: string | null
          id?: string
          notes?: string | null
          professional_license?: string | null
          profile_id?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "employee_details"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      file_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          file_id: string
          id: string
          permission_level: string | null
          shared_by: string
          shared_with: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_id: string
          id?: string
          permission_level?: string | null
          shared_by: string
          shared_with: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_id?: string
          id?: string
          permission_level?: string | null
          shared_by?: string
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note_date: string
          note_text: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_date?: string
          note_text: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_date?: string
          note_text?: string
          note_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_records: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string
          employee_id: string | null
          id: string
          invoice_number: string | null
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          recurring_frequency: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          employee_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_frequency?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          employee_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_frequency?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "financial_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          attachments: Json | null
          channel_id: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message_body: string
          message_type: string | null
          parent_message_id: string | null
          priority: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          subject: string
          thread_id: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message_body: string
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          subject: string
          thread_id?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message_body?: string
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "internal_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "internal_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          attachments: Json | null
          client_id: string
          created_at: string
          employee_id: string
          id: string
          medications: Json | null
          next_appointment_notes: string | null
          progress_notes: string
          session_date: string
          session_duration: number | null
          session_type: string
          status: string | null
          symptoms: string | null
          treatment_plan: string | null
          updated_at: string
          vital_signs: Json | null
        }
        Insert: {
          attachments?: Json | null
          client_id: string
          created_at?: string
          employee_id: string
          id?: string
          medications?: Json | null
          next_appointment_notes?: string | null
          progress_notes: string
          session_date: string
          session_duration?: number | null
          session_type: string
          status?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
          vital_signs?: Json | null
        }
        Update: {
          attachments?: Json | null
          client_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          medications?: Json | null
          next_appointment_notes?: string | null
          progress_notes?: string
          session_date?: string
          session_duration?: number | null
          session_type?: string
          status?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_alerts: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          meeting_date: string
          meeting_location: string | null
          meeting_room: string | null
          message: string
          participants: string[] | null
          title: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          meeting_date: string
          meeting_location?: string | null
          meeting_room?: string | null
          message: string
          participants?: string[] | null
          title: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          meeting_date?: string
          meeting_location?: string | null
          meeting_room?: string | null
          message?: string
          participants?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          order_index: number
          role_required: Database["public"]["Enums"]["employee_role"] | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_active?: boolean
          order_index?: number
          role_required?: Database["public"]["Enums"]["employee_role"] | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          role_required?: Database["public"]["Enums"]["employee_role"] | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string | null
          client_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          employee_id: string | null
          id: string
          is_private: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          is_private?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          is_private?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_global: boolean | null
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean | null
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean | null
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          department: string | null
          document_cpf: string | null
          document_rg: string | null
          employee_role: Database["public"]["Enums"]["employee_role"] | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          name: string | null
          permissions: Json | null
          phone: string | null
          salary: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department?: string | null
          document_cpf?: string | null
          document_rg?: string | null
          employee_role?: Database["public"]["Enums"]["employee_role"] | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          permissions?: Json | null
          phone?: string | null
          salary?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department?: string | null
          document_cpf?: string | null
          document_rg?: string | null
          employee_role?: Database["public"]["Enums"]["employee_role"] | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          permissions?: Json | null
          phone?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quality_evaluations: {
        Row: {
          client_id: string
          comments: string | null
          communication_score: number | null
          created_at: string
          employee_id: string
          evaluation_date: string
          evaluator_id: string
          follow_up_required: boolean | null
          id: string
          improvement_suggestions: string | null
          overall_satisfaction: number | null
          professionalism_score: number | null
          punctuality_score: number | null
          service_quality_score: number | null
        }
        Insert: {
          client_id: string
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          employee_id: string
          evaluation_date?: string
          evaluator_id: string
          follow_up_required?: boolean | null
          id?: string
          improvement_suggestions?: string | null
          overall_satisfaction?: number | null
          professionalism_score?: number | null
          punctuality_score?: number | null
          service_quality_score?: number | null
        }
        Update: {
          client_id?: string
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          employee_id?: string
          evaluation_date?: string
          evaluator_id?: string
          follow_up_required?: boolean | null
          id?: string
          improvement_suggestions?: string | null
          overall_satisfaction?: number | null
          professionalism_score?: number | null
          punctuality_score?: number | null
          service_quality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_evaluations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          employee_role: Database["public"]["Enums"]["employee_role"]
          granted: boolean
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_role: Database["public"]["Enums"]["employee_role"]
          granted?: boolean
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_role?: Database["public"]["Enums"]["employee_role"]
          granted?: boolean
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          updated_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          anamnesis_type_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          employee_id: string | null
          end_time: string
          id: string
          location: string | null
          notes: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          anamnesis_type_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          anamnesis_type_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_anamnesis_type_id_fkey"
            columns: ["anamnesis_type_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          created_by: string | null
          current_quantity: number | null
          description: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          location: string | null
          minimum_quantity: number | null
          name: string
          supplier: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_quantity?: number | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          minimum_quantity?: number | null
          name: string
          supplier?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_quantity?: number | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          minimum_quantity?: number | null
          name?: string
          supplier?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          quantity: number
          reason: string | null
          reference_document: string | null
          schedule_id: string | null
          session_number: number | null
          stock_item_id: string
          total_cost: number | null
          type: string
          unit_cost: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          quantity: number
          reason?: string | null
          reference_document?: string | null
          schedule_id?: string | null
          session_number?: number | null
          stock_item_id: string
          total_cost?: number | null
          type: string
          unit_cost?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          quantity?: number
          reason?: string | null
          reference_document?: string | null
          schedule_id?: string | null
          session_number?: number | null
          stock_item_id?: string
          total_cost?: number | null
          type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_movements_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_movements_schedule"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_type: string | null
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_type?: string | null
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_type?: string | null
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_files: {
        Row: {
          category: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_private: boolean | null
          mime_type: string | null
          tags: string[] | null
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_private?: boolean | null
          mime_type?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_private?: boolean | null
          mime_type?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission_key: string
          permission_value: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_key: string
          permission_value?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_key?: string
          permission_value?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          login_at: string
          logout_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          login_at?: string
          logout_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          login_at?: string
          logout_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      employee_details: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string | null
          department: string | null
          document_cpf: string | null
          document_rg: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employee_code: string | null
          employee_notes: string | null
          employee_role: Database["public"]["Enums"]["employee_role"] | null
          hire_date: string | null
          is_active: boolean | null
          name: string | null
          permissions: Json | null
          phone: string | null
          professional_license: string | null
          profile_id: string | null
          salary: number | null
          specialization: string | null
          updated_at: string | null
          user_id: string | null
          work_schedule: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_test_employee: {
        Args: {
          p_department?: string
          p_email: string
          p_name: string
          p_password: string
          p_phone?: string
          p_role: Database["public"]["Enums"]["employee_role"]
        }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["employee_role"]
      }
      get_user_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          permission: Database["public"]["Enums"]["permission_type"]
        }[]
      }
      log_sensitive_access: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id: string
          p_entity_type: string
        }
        Returns: undefined
      }
      user_has_permission: {
        Args: {
          required_permission: Database["public"]["Enums"]["permission_type"]
        }
        Returns: boolean
      }
      user_has_role: {
        Args: { required_roles: Database["public"]["Enums"]["employee_role"][] }
        Returns: boolean
      }
    }
    Enums: {
      employee_role:
        | "director"
        | "coordinator_madre"
        | "coordinator_floresta"
        | "staff"
        | "intern"
        | "musictherapist"
        | "financeiro"
        | "receptionist"
        | "psychologist"
        | "psychopedagogue"
        | "speech_therapist"
        | "nutritionist"
        | "physiotherapist"
      permission_type:
        | "view_clients"
        | "create_clients"
        | "edit_clients"
        | "delete_clients"
        | "view_employees"
        | "create_employees"
        | "edit_employees"
        | "delete_employees"
        | "view_financial"
        | "create_financial"
        | "edit_financial"
        | "delete_financial"
        | "view_schedules"
        | "create_schedules"
        | "edit_schedules"
        | "delete_schedules"
        | "view_stock"
        | "create_stock"
        | "edit_stock"
        | "delete_stock"
        | "view_reports"
        | "create_reports"
        | "edit_reports"
        | "delete_reports"
        | "view_documents"
        | "create_documents"
        | "edit_documents"
        | "delete_documents"
        | "manage_roles"
        | "manage_permissions"
        | "view_audit_logs"
        | "system_admin"
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
      employee_role: [
        "director",
        "coordinator_madre",
        "coordinator_floresta",
        "staff",
        "intern",
        "musictherapist",
        "financeiro",
        "receptionist",
        "psychologist",
        "psychopedagogue",
        "speech_therapist",
        "nutritionist",
        "physiotherapist",
      ],
      permission_type: [
        "view_clients",
        "create_clients",
        "edit_clients",
        "delete_clients",
        "view_employees",
        "create_employees",
        "edit_employees",
        "delete_employees",
        "view_financial",
        "create_financial",
        "edit_financial",
        "delete_financial",
        "view_schedules",
        "create_schedules",
        "edit_schedules",
        "delete_schedules",
        "view_stock",
        "create_stock",
        "edit_stock",
        "delete_stock",
        "view_reports",
        "create_reports",
        "edit_reports",
        "delete_reports",
        "view_documents",
        "create_documents",
        "edit_documents",
        "delete_documents",
        "manage_roles",
        "manage_permissions",
        "view_audit_logs",
        "system_admin",
      ],
    },
  },
} as const
