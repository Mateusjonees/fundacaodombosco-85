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
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          is_active: boolean | null
          medical_history: string | null
          name: string
          notes: string | null
          phone: string | null
          rg: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean | null
          medical_history?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean | null
          medical_history?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
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
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          quantity: number
          reason: string | null
          reference_document: string | null
          stock_item_id: string
          total_cost: number | null
          type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          quantity: number
          reason?: string | null
          reference_document?: string | null
          stock_item_id: string
          total_cost?: number | null
          type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          quantity?: number
          reason?: string | null
          reference_document?: string | null
          stock_item_id?: string
          total_cost?: number | null
          type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
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
    },
  },
} as const
