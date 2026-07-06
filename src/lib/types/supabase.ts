
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ecom_products: {
        Row: {
          id: string;
          name: string;
          handle: string | null;
          description: string | null;
          price: number;
          sku: string | null;
          inventory_qty: number | null;
          images: string[] | null;
          status: string;
          has_variants: boolean | null;
          product_type: string | null;
          tags: Json | null;
          vendor: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          handle?: string | null;
          description?: string | null;
          price: number;
          sku?: string | null;
          inventory_qty?: number | null;
          images?: string[] | null;
          status?: string;
          has_variants?: boolean | null;
          product_type?: string | null;
          tags?: Json | null;
          vendor?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          handle?: string | null;
          description?: string | null;
          price?: number;
          sku?: string | null;
          inventory_qty?: number | null;
          images?: string[] | null;
          status?: string;
          has_variants?: boolean | null;
          product_type?: string | null;
          tags?: Json | null;
          vendor?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ecom_product_variants: {
        Row: {
          id: string;
          product_id: string;
          title: string;
          option1: string | null;
          option2: string | null;
          price: number;
          inventory_qty: number | null;
          sku: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          title: string;
          option1?: string | null;
          option2?: string | null;
          price: number;
          inventory_qty?: number | null;
          sku?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          title?: string;
          option1?: string | null;
          option2?: string | null;
          price?: number;
          inventory_qty?: number | null;
          sku?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ecom_product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "ecom_products";
            referencedColumns: ["id"];
          },
        ];
      };
      pts_categories: {
        Row: {
          id: string;
          title: string;
          title_ar: string | null;
          slug: string;
          description: string | null;
          description_ar: string | null;
          icon: string | null;
          cover_image: string | null;
          banner_image: string | null;
          parent_id: string | null;
          position: number | null;
          is_visible: boolean | null;
          archived: boolean | null;
          is_featured: boolean | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          title_ar?: string | null;
          slug: string;
          description?: string | null;
          description_ar?: string | null;
          icon?: string | null;
          cover_image?: string | null;
          banner_image?: string | null;
          parent_id?: string | null;
          position?: number | null;
          is_visible?: boolean | null;
          archived?: boolean | null;
          is_featured?: boolean | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          title_ar?: string | null;
          slug?: string;
          description?: string | null;
          description_ar?: string | null;
          icon?: string | null;
          cover_image?: string | null;
          banner_image?: string | null;
          parent_id?: string | null;
          position?: number | null;
          is_visible?: boolean | null;
          archived?: boolean | null;
          is_featured?: boolean | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pts_categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "pts_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      ecom_customers: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ecom_orders: {
        Row: {
          id: string;
          customer_id: string | null;
          status: string;
          subtotal: number;
          tax: number | null;
          shipping: number | null;
          total: number;
          shipping_address: Json;
          notes: string | null;
          ref_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          status?: string;
          subtotal: number;
          tax?: number | null;
          shipping?: number | null;
          total: number;
          shipping_address: Json;
          notes?: string | null;
          ref_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          status?: string;
          subtotal?: number;
          tax?: number | null;
          shipping?: number | null;
          total?: number;
          shipping_address?: Json;
          notes?: string | null;
          ref_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ecom_orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "ecom_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      ecom_order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_title: string | null;
          sku: string | null;
          quantity: number;
          unit_price: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_title?: string | null;
          sku?: string | null;
          quantity: number;
          unit_price: number;
          total: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name?: string;
          variant_title?: string | null;
          sku?: string | null;
          quantity?: number;
          unit_price?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ecom_order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "ecom_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ecom_order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "ecom_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ecom_order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "ecom_product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      pts_notification_recipients: {
        Row: {
          id: string;
          type: string;
          value: string;
          label: string | null;
          api_key: string | null;
          purpose: string[] | null;
          enabled: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          value: string;
          label?: string | null;
          api_key?: string | null;
          purpose?: string[] | null;
          enabled?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          value?: string;
          label?: string | null;
          api_key?: string | null;
          purpose?: string[] | null;
          enabled?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pts_site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pts_media: {
        Row: {
          id: string;
          url: string;
          name: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          name?: string | null;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          name?: string | null;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pts_admins: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          permissions: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password_hash: string;
          permissions?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password_hash?: string;
          permissions?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pts_affiliates: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          code: string;
          commission_rate: number | null;
          status: string;
          password_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          code: string;
          commission_rate?: number | null;
          status?: string;
          password_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          code?: string;
          commission_rate?: number | null;
          status?: string;
          password_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pts_affiliate_product_rates: {
        Row: {
          id: string;
          affiliate_id: string;
          product_id: string;
          rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          affiliate_id: string;
          product_id: string;
          rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          affiliate_id?: string;
          product_id?: string;
          rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pts_affiliate_product_rates_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "pts_affiliates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pts_affiliate_product_rates_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "ecom_products";
            referencedColumns: ["id"];
          },
        ];
      };
      pts_chat_messages: {
        Row: {
          id: string;
          admin_id: string | null;
          display_name: string;
          color: string | null;
          emoji: string | null;
          body: string;
          attachment_url: string | null;
          attachment_type: string | null;
          attachment_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          display_name: string;
          color?: string | null;
          emoji?: string | null;
          body: string;
          attachment_url?: string | null;
          attachment_type?: string | null;
          attachment_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          display_name?: string;
          color?: string | null;
          emoji?: string | null;
          body?: string;
          attachment_url?: string | null;
          attachment_type?: string | null;
          attachment_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pts_chat_messages_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "pts_admins";
            referencedColumns: ["id"];
          },
        ];
      };
      pts_challenges: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          goal_type: string;
          goal_target: number;
          prize: string | null;
          starts_at: string | null;
          ends_at: string | null;
          status: string;
          progress: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          goal_type: string;
          goal_target: number;
          prize?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: string;
          progress?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          goal_type?: string;
          goal_target?: number;
          prize?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: string;
          progress?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pts_challenges_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "pts_admins";
            referencedColumns: ["id"];
          },
        ];
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
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName] extends {
      [key: string]: infer E;
    }
    ? E
    : never
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions] extends {
      [key: string]: infer E;
    }
    ? E
    : never
  : never;
