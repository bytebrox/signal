import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    return null
  }
  
  return createClient(url, key)
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({ 
        wallets: [], 
        total: 0, 
        error: 'Database not configured' 
      })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'pnl_percent'
    
    const { data, error, count } = await supabase
      .from('tracked_wallets')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json({ wallets: [], error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      wallets: data || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    return NextResponse.json(
      { wallets: [], error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}
