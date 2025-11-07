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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      callback_ip_whitelist: {
        Row: {
          created_at: string | null
          environment: string | null
          id: string
          ip_address: unknown
        }
        Insert: {
          created_at?: string | null
          environment?: string | null
          id?: string
          ip_address: unknown
        }
        Update: {
          created_at?: string | null
          environment?: string | null
          id?: string
          ip_address?: unknown
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string | null
          cart_id: string | null
          id: string
          product_id: string | null
          quantity: number
          updated_at: string | null
          user_id: string | null
          variant_selections: Json | null
        }
        Insert: {
          added_at?: string | null
          cart_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
          variant_selections?: Json | null
        }
        Update: {
          added_at?: string | null
          cart_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
          variant_selections?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_cart_items_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          item_count: number | null
          session_id: string | null
          status: string
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_count?: number | null
          session_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          item_count?: number | null
          session_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          category: string
          id: number
          parent_id: number | null
          slug: string | null
        }
        Insert: {
          category: string
          id?: number
          parent_id?: number | null
          slug?: string | null
        }
        Update: {
          category?: string
          id?: number
          parent_id?: number | null
          slug?: string | null
        }
        Relationships: []
      }
      category_icons: {
        Row: {
          category_id: number | null
          color: string
          created_at: string | null
          display_order: number | null
          icon_color: string
          icon_name: string
          id: number
          is_active: boolean | null
          name: string
          product_image: string | null
          subcategory_id: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: number | null
          color?: string
          created_at?: string | null
          display_order?: number | null
          icon_color?: string
          icon_name: string
          id?: number
          is_active?: boolean | null
          name: string
          product_image?: string | null
          subcategory_id?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: number | null
          color?: string
          created_at?: string | null
          display_order?: number | null
          icon_color?: string
          icon_name?: string
          id?: number
          is_active?: boolean | null
          name?: string
          product_image?: string | null
          subcategory_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_icons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_icons_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          county_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          county_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          county_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_sales: {
        Row: {
          created_at: string | null
          date: string
          id: string
          total_customers: number | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          total_customers?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          total_customers?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          address_name: string | null
          city: string
          county: string
          created_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          street_address: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_name?: string | null
          city: string
          county: string
          created_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          street_address: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_name?: string | null
          city?: string
          county?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          street_address?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mpesa_payments: {
        Row: {
          amount: number
          callback_data: Json | null
          checkout_request_id: string
          created_at: string | null
          id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          order_id: string | null
          phone_number: string
          result_code: number | null
          result_desc: string | null
          status: string | null
          transaction_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          callback_data?: Json | null
          checkout_request_id: string
          created_at?: string | null
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          order_id?: string | null
          phone_number: string
          result_code?: number | null
          result_desc?: string | null
          status?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          callback_data?: Json | null
          checkout_request_id?: string
          created_at?: string | null
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          order_id?: string | null
          phone_number?: string
          result_code?: number | null
          result_desc?: string | null
          status?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mpesa_rate_limit: {
        Row: {
          attempts: number
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          last_attempt: string
          request_type: string
          window_start: string
        }
        Insert: {
          attempts?: number
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          last_attempt?: string
          request_type?: string
          window_start?: string
        }
        Update: {
          attempts?: number
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          last_attempt?: string
          request_type?: string
          window_start?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          created_at: string
          delivery_fee: number | null
          discount_amount: number | null
          email: string | null
          items: Json | null
          order_id: string
          phone_number: string | null
          shipping_address: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          delivery_fee?: number | null
          discount_amount?: number | null
          email?: string | null
          items?: Json | null
          order_id: string
          phone_number?: string | null
          shipping_address?: string | null
          status: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          delivery_fee?: number | null
          discount_amount?: number | null
          email?: string | null
          items?: Json | null
          order_id?: string
          phone_number?: string | null
          shipping_address?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          price_modifier: Json | null
          product_id: string | null
          sku_suffix: string | null
          stock_quantity: Json | null
          updated_at: string | null
          variant_type: string
          variant_value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          price_modifier?: Json | null
          product_id?: string | null
          sku_suffix?: string | null
          stock_quantity?: Json | null
          updated_at?: string | null
          variant_type: string
          variant_value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          price_modifier?: Json | null
          product_id?: string | null
          sku_suffix?: string | null
          stock_quantity?: Json | null
          updated_at?: string | null
          variant_type?: string
          variant_value?: Json | null
        }
        Relationships: []
      }
      products: {
        Row: {
          categories: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          features: Json | null
          image_urls: string[] | null
          is_digital: boolean | null
          low_stock_threshold: number | null
          name: string
          price: number | null
          product_id: string
          rating: number | null
          specification: Json | null
          stock: number | null
          store: string | null
          subcategory_id: number | null
          updated_at: string | null
        }
        Insert: {
          categories?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          features?: Json | null
          image_urls?: string[] | null
          is_digital?: boolean | null
          low_stock_threshold?: number | null
          name: string
          price?: number | null
          product_id?: string
          rating?: number | null
          specification?: Json | null
          stock?: number | null
          store?: string | null
          subcategory_id?: number | null
          updated_at?: string | null
        }
        Update: {
          categories?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          features?: Json | null
          image_urls?: string[] | null
          is_digital?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          price?: number | null
          product_id?: string
          rating?: number | null
          specification?: Json | null
          stock?: number | null
          store?: string | null
          subcategory_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          county: string | null
          created_at: string | null
          email: string
          first_name: string | null
          last_name: string | null
          last_sign_in_at: string | null
          lastName: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          lastName?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          lastName?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string | null
          media_urls: string[] | null
          product_id: string
          rating: number
          review_id: string
          user_id: string
          username: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          media_urls?: string[] | null
          product_id: string
          rating: number
          review_id?: string
          user_id: string
          username: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          media_urls?: string[] | null
          product_id?: string
          rating?: number
          review_id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string | null
          details: Json | null
          id: string
          identifier: string
          severity: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          identifier: string
          severity: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          identifier?: string
          severity?: string
        }
        Relationships: []
      }
      store: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: number
          name: string
          phone: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name: string
          phone?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string
          phone?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          added_at: string | null
          id: string
          product_id: string
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          product_id: string
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          product_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_review_product: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_carts: { Args: never; Returns: number }
      get_or_create_cart: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
      migrate_guest_cart_to_user: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
      notify_admin_no_reply: {
        Args: { message_text: string; user_id: string; user_message_id: string }
        Returns: undefined
      }
      update_order_first_name: {
        Args: { first_name: string; order_id: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "moderator" | "user"
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
      app_role: ["superadmin", "admin", "moderator", "user"],
    },
  },
} as const
