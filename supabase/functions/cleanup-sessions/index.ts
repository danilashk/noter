import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Создаем Supabase клиент с service role ключом
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Получаем параметры из запроса
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'
    const inactiveHours = parseInt(url.searchParams.get('inactive_hours') || '24')
    
    // Проверяем авторизацию для безопасности
    const authHeader = req.headers.get('Authorization')
    if (!authHeader && req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Starting cleanup - dry_run: ${dryRun}, inactive_hours: ${inactiveHours}`)

    // Вызываем функцию очистки в базе данных
    const { data, error } = await supabase.rpc('cleanup_inactive_sessions', {
      inactive_hours: inactiveHours,
      dry_run: dryRun
    })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          details: error instanceof Error ? error.message : String(error) 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = {
      success: true,
      cleanup_result: data,
      execution_time: new Date().toISOString(),
      parameters: {
        dry_run: dryRun,
        inactive_hours: inactiveHours
      }
    }

    console.log('Cleanup completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
