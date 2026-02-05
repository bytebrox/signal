import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// GET - Get user's favorites
export async function GET(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userWallet = searchParams.get('userWallet')

    if (!userWallet) {
      return NextResponse.json({ error: 'User wallet is required' }, { status: 400 })
    }

    // Get user ID first
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet)
      .single()

    if (!user) {
      return NextResponse.json({ favorites: [] })
    }

    // Get favorites with tracked wallet details
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        wallet_address,
        nickname,
        notes,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get tracked wallet data for each favorite
    const walletAddresses = favorites?.map(f => f.wallet_address) || []
    
    let walletData: Record<string, any> = {}
    if (walletAddresses.length > 0) {
      const { data: wallets } = await supabase
        .from('tracked_wallets')
        .select('*')
        .in('address', walletAddresses)
      
      walletData = (wallets || []).reduce((acc, w) => {
        acc[w.address] = w
        return acc
      }, {} as Record<string, any>)
    }

    // Combine favorites with wallet data
    const enrichedFavorites = (favorites || []).map(f => ({
      ...f,
      walletData: walletData[f.wallet_address] || null
    }))

    return NextResponse.json({ favorites: enrichedFavorites })

  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a favorite
export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { userWallet, walletAddress, nickname, notes } = body

    if (!userWallet || !walletAddress) {
      return NextResponse.json({ error: 'User wallet and wallet address are required' }, { status: 400 })
    }

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('wallet_address', walletAddress)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already in favorites', alreadyExists: true }, { status: 400 })
    }

    // Add favorite
    const { data: favorite, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        nickname: nickname || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding favorite:', error)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    return NextResponse.json({ favorite, message: 'Added to favorites!' })

  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a favorite
export async function DELETE(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userWallet = searchParams.get('userWallet')
    const walletAddress = searchParams.get('walletAddress')

    if (!userWallet || !walletAddress) {
      return NextResponse.json({ error: 'User wallet and wallet address are required' }, { status: 400 })
    }

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete favorite
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('wallet_address', walletAddress)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed from favorites' })

  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
