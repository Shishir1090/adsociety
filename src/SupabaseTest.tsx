import { supabase, isSupabaseConfigured } from './lib/supabase'

export default function SupabaseTest() {
  return (
    <div style={{ padding: '30px' }}>
      <h1>AdSociety Database Test</h1>

      <p>
        {isSupabaseConfigured
          ? 'Supabase credentials are configured!'
          : 'Supabase credentials are missing.'}
      </p>

      <p>
        {supabase
          ? 'Supabase client created successfully!'
          : 'Supabase client not created.'}
      </p>
    </div>
  )
}