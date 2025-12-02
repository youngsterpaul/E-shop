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
      admin_activity_logs: {
        Row: {
          action_type: string
          changes: Json | null
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          record_name: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          record_name?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          record_name?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
          category_name: string | null
          display_order: number | null
          icon_name: string | null
          id: number
          parent_id: number | null
          slug: string | null
        }
        Insert: {
          category: string
          category_name?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: number
          parent_id?: number | null
          slug?: string | null
        }
        Update: {
          category?: string
          category_name?: string | null
          display_order?: number | null
          icon_name?: string | null
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
      contact_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      discount_usage: {
        Row: {
          discount_amount: number
          discount_id: string | null
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          discount_amount: number
          discount_id?: string | null
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          discount_amount?: number
          discount_id?: string | null
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_usage_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          applies_to: string | null
          category_ids: number[] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_purchase_amount: number | null
          per_user_limit: number | null
          product_ids: string[] | null
          start_date: string
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          applies_to?: string | null
          category_ids?: number[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          per_user_limit?: number | null
          product_ids?: string[] | null
          start_date?: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          applies_to?: string | null
          category_ids?: number[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          per_user_limit?: number | null
          product_ids?: string[] | null
          start_date?: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          max_attempts: number | null
          otp_code: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          max_attempts?: number | null
          otp_code: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          max_attempts?: number | null
          otp_code?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      flash_sale_products: {
        Row: {
          created_at: string | null
          flash_sale_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          flash_sale_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          flash_sale_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_products_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          display_order: number | null
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          display_order?: number | null
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          display_order?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string | null
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
      job_listings: {
        Row: {
          created_at: string | null
          department: string
          display_order: number | null
          experience: string
          id: string
          is_active: boolean | null
          location: string
          requirements: string[] | null
          responsibilities: string[] | null
          salary_range: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          display_order?: number | null
          experience: string
          id?: string
          is_active?: boolean | null
          location: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          display_order?: number | null
          experience?: string
          id?: string
          is_active?: boolean | null
          location?: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      login_audit: {
        Row: {
          created_at: string | null
          device_info: Json | null
          email: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          session_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          session_id?: string | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string | null
          id: string
          points: number
          total_earned: number
          total_redeemed: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string | null
          user_id?: string
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
        Relationships: [
          {
            foreignKeyName: "mpesa_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
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
      order_status_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          metadata: Json | null
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
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
          webhook_secret: string | null
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
          webhook_secret?: string | null
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
          webhook_secret?: string | null
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points: number
          reference_id: string | null
          source: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          source: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          source?: string
          transaction_type?: string
          user_id?: string
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
          display_order: number | null
          featured: boolean | null
          features: Json | null
          image_urls: string[] | null
          is_digital: boolean | null
          low_stock_threshold: number | null
          name: string
          preferred_supplier_id: string | null
          price: number | null
          product_id: string
          rating: number | null
          reorder_point: number | null
          reviews_count: number
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
          display_order?: number | null
          featured?: boolean | null
          features?: Json | null
          image_urls?: string[] | null
          is_digital?: boolean | null
          low_stock_threshold?: number | null
          name: string
          preferred_supplier_id?: string | null
          price?: number | null
          product_id?: string
          rating?: number | null
          reorder_point?: number | null
          reviews_count?: number
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
          display_order?: number | null
          featured?: boolean | null
          features?: Json | null
          image_urls?: string[] | null
          is_digital?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          preferred_supplier_id?: string | null
          price?: number | null
          product_id?: string
          rating?: number | null
          reorder_point?: number | null
          reviews_count?: number
          specification?: Json | null
          stock?: number | null
          store?: string | null
          subcategory_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          created_by: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          created_by: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          created_by?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          points_awarded: number | null
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          items: Json
          order_id: string
          processed_at: string | null
          processed_by: string | null
          refund_amount: number | null
          refund_method: string | null
          return_number: string
          return_reason: string
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          items: Json
          order_id: string
          processed_at?: string | null
          processed_by?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          return_number: string
          return_reason: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          items?: Json
          order_id?: string
          processed_at?: string | null
          processed_by?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          return_number?: string
          return_reason?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "returns_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      review_replies: {
        Row: {
          created_at: string | null
          id: string
          reply_text: string
          review_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reply_text: string
          review_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reply_text?: string
          review_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["review_id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["review_id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          created_at: string | null
          helpful_count: number | null
          media_urls: string[] | null
          product_id: string
          rating: number
          review_id: string
          user_id: string
          username: string
          verified_purchase: boolean | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          helpful_count?: number | null
          media_urls?: string[] | null
          product_id: string
          rating: number
          review_id?: string
          user_id: string
          username: string
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          helpful_count?: number | null
          media_urls?: string[] | null
          product_id?: string
          rating?: number
          review_id?: string
          user_id?: string
          username?: string
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          expires_at: string | null
          id: string
          order_id: string | null
          points_spent: number
          redeemed_at: string | null
          reward_id: string
          status: string
          used_at: string | null
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points_spent: number
          redeemed_at?: string | null
          reward_id: string
          status?: string
          used_at?: string | null
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points_spent?: number
          redeemed_at?: string | null
          reward_id?: string
          status?: string
          used_at?: string | null
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_redemptions_per_user: number | null
          name: string
          points_required: number
          reward_type: string
          reward_value: Json
          stock_quantity: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions_per_user?: number | null
          name: string
          points_required: number
          reward_type: string
          reward_value: Json
          stock_quantity?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions_per_user?: number | null
          name?: string
          points_required?: number
          reward_type?: string
          reward_value?: Json
          stock_quantity?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      role_change_history: {
        Row: {
          action_type: string
          changed_by: string
          created_at: string
          id: string
          new_role: string
          old_role: string | null
          reason: string | null
          reverted_at: string | null
          reverted_by: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          changed_by: string
          created_at?: string
          id?: string
          new_role: string
          old_role?: string | null
          reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: string
          old_role?: string | null
          reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          user_id?: string
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
      session_activity: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          last_activity: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_activity?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_activity?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
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
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          mfa_enabled: boolean | null
          mfa_method: string | null
          phone_number: string | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          phone_number?: string | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          phone_number?: string | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string
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
      check_low_stock: {
        Args: never
        Returns: {
          current_stock: number
          preferred_supplier_name: string
          product_id: string
          product_name: string
          reorder_point: number
        }[]
      }
      cleanup_expired_carts: { Args: never; Returns: number }
      cleanup_expired_otps: { Args: never; Returns: number }
      cleanup_expired_sessions: { Args: never; Returns: number }
      generate_po_number: { Args: never; Returns: string }
      generate_referral_code: {
        Args: { user_id_param: string }
        Returns: string
      }
      generate_return_number: { Args: never; Returns: string }
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
      order_status_enum:
        | "pending"
        | "processing"
        | "paid"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      order_status_enum: [
        "pending",
        "processing",
        "paid",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
