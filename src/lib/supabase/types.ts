export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'SOLICITANTE' | 'ADMIN_TI';
export type TicketStatus = 'ABIERTO' | 'EN_PROGRESO' | 'EN_ESPERA' | 'RESUELTO' | 'CERRADO';
export type TicketPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type BoardStatus = 'EN_LABORATORIO' | 'EN_REPARACION' | 'REPARADA' | 'ENTREGADA';
export type RepairStep = 'DIAGNOSTICO' | 'REPARACION' | 'PRUEBAS' | 'ENTREGA';
export type ComponentStatus = 'REQUERIDO' | 'EN_STOCK' | 'SOLICITADO' | 'INSTALADO';
export type LogKind = 'NOTA_TECNICA' | 'MEDICION' | 'CAMBIO_ESTADO' | 'ALERTA';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          role: UserRole;
          is_superadmin: boolean;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          role?: UserRole;
          is_superadmin?: boolean;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          role?: UserRole;
          is_superadmin?: boolean;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          requester_id: string;
          assignee_id: string | null;
          title: string;
          description: string;
          status: TicketStatus;
          priority: TicketPriority;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          assignee_id?: string | null;
          title: string;
          description: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          requester_id?: string;
          assignee_id?: string | null;
          title?: string;
          description?: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          body: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id: string;
          body: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_id?: string;
          body?: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          serial: string;
          model: string;
          owner_name: string | null;
          status: BoardStatus;
          current_step: RepairStep | null;
          created_by: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          serial: string;
          model: string;
          owner_name?: string | null;
          status?: BoardStatus;
          current_step?: RepairStep | null;
          created_by: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          serial?: string;
          model?: string;
          owner_name?: string | null;
          status?: BoardStatus;
          current_step?: RepairStep | null;
          created_by?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      board_steps: {
        Row: {
          id: string;
          board_id: string;
          step: RepairStep;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          board_id: string;
          step: RepairStep;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          board_id?: string;
          step?: RepairStep;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      board_components: {
        Row: {
          id: string;
          board_id: string;
          designator: string;
          part_number: string;
          package: string | null;
          status: ComponentStatus;
        };
        Insert: {
          id?: string;
          board_id: string;
          designator: string;
          part_number: string;
          package?: string | null;
          status?: ComponentStatus;
        };
        Update: {
          id?: string;
          board_id?: string;
          designator?: string;
          part_number?: string;
          package?: string | null;
          status?: ComponentStatus;
        };
        Relationships: [];
      };
      board_logs: {
        Row: {
          id: string;
          board_id: string;
          author_id: string;
          kind: LogKind;
          body: string;
          measurement: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          author_id: string;
          kind: LogKind;
          body: string;
          measurement?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          author_id?: string;
          kind?: LogKind;
          body?: string;
          measurement?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      board_serial_counters: {
        Row: {
          year: number;
          last_number: number;
        };
        Insert: {
          year: number;
          last_number?: number;
        };
        Update: {
          year?: number;
          last_number?: number;
        };
        Relationships: [];
      };
      kb_articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          body_md: string;
          tags: string[];
          is_published: boolean;
          view_count: number;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          body_md: string;
          tags?: string[];
          is_published?: boolean;
          view_count?: number;
          author_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          body_md?: string;
          tags?: string[];
          is_published?: boolean;
          view_count?: number;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          diff: Json | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          diff?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          diff?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_board: {
        Args: {
          p_model: string;
          p_owner: string;
        };
        Returns: string;
      };
      advance_board_step: {
        Args: {
          p_board_id: string;
          p_note?: string;
        };
        Returns: BoardStatus;
      };
      increment_view_count: {
        Args: {
          p_article_id: string;
        };
        Returns: void;
      };
      current_role_nexo: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      current_is_superadmin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type TicketComment = Database['public']['Tables']['ticket_comments']['Row'];
export type Board = Database['public']['Tables']['boards']['Row'];
export type BoardStep = Database['public']['Tables']['board_steps']['Row'];
export type BoardComponent = Database['public']['Tables']['board_components']['Row'];
export type BoardLog = Database['public']['Tables']['board_logs']['Row'];
export type KbArticle = Database['public']['Tables']['kb_articles']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
