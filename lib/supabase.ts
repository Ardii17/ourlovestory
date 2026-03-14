import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      couple_profile: {
        Row: {
          id: string
          person1_name: string
          person2_name: string
          anniversary_date: string
          person1_photo: string | null
          person2_photo: string | null
          love_quote: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['couple_profile']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['couple_profile']['Insert']>
      }
      places: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          address: string | null
          status: 'wishlist' | 'visited'
          visited_date: string | null
          rating: number | null
          notes: string | null
          cover_image: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['places']['Insert']>
      }
      place_photos: {
        Row: {
          id: string
          place_id: string
          photo_url: string
          caption: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['place_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['place_photos']['Insert']>
      }
      love_letters: {
        Row: {
          id: string
          title: string
          content: string
          from_person: string
          to_person: string
          mood: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['love_letters']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['love_letters']['Insert']>
      }
      bucket_list: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          is_completed: boolean
          completed_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bucket_list']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bucket_list']['Insert']>
      }
      memories: {
        Row: {
          id: string
          title: string
          description: string | null
          memory_date: string
          mood: string | null
          photo_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['memories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['memories']['Insert']>
      }
    }
  }
}
