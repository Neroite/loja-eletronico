// Database schema types for the Supabase client.
//
// This mirrors `supabase/schema.sql`. Columns use snake_case (Postgres convention),
// while the app's domain types in `src/types.ts` use camelCase — so when you wire the
// backend, map rows ↔ models at the data-layer boundary (see the example in
// `src/lib/supabase.ts`).
//
// Once your project exists you can regenerate this file with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Shape of each element stored in sales.items (jsonb).
export interface SaleItemRow {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          stock_level: number;
          max_stock: number;
          status: string;
          cost_price: number;
          sale_price: number;
          image_url: string;
        };
        Insert: {
          id: string;
          name: string;
          category: string;
          stock_level: number;
          max_stock: number;
          status: string;
          cost_price: number;
          sale_price: number;
          image_url: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          doc: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          doc?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          created_at: string;
          client_id: string | null;
          client_name: string;
          client_doc: string;
          seller: string;
          payment_method: string;
          total_value: number;
          status: string;
          items: SaleItemRow[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          client_id?: string | null;
          client_name: string;
          client_doc: string;
          seller: string;
          payment_method: string;
          total_value: number;
          status: string;
          items: SaleItemRow[];
        };
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'sales_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
