import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const MAX_NICKNAME_LENGTH = 50
const MAX_NOTES_LENGTH = 500

function isValidSolanaAddress(addr: string): boolean {
  return typeof addr === 'string' && SOLANA_ADDRESS_RE.test(addr)
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
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

    if (!userWallet || !isValidSolanaAddress(userWallet)) {
      return NextResponse.json({ error: 'Valid Solana wallet address is required' }, { status: 400 })
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
        sort_order,
        created_at
      `)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
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

    if (!userWallet || !isValidSolanaAddress(userWallet) || !walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Valid Solana wallet addresses are required' }, { status: 400 })
    }

    if (nickname && (typeof nickname !== 'string' || nickname.length > MAX_NICKNAME_LENGTH)) {
      return NextResponse.json({ error: `Nickname must be ${MAX_NICKNAME_LENGTH} characters or less` }, { status: 400 })
    }

    if (notes && (typeof notes !== 'string' || notes.length > MAX_NOTES_LENGTH)) {
      return NextResponse.json({ error: `Notes must be ${MAX_NOTES_LENGTH} characters or less` }, { status: 400 })
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

// PATCH - Update nickname/notes
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { userWallet, walletAddress, nickname, notes } = body

    if (!userWallet || !isValidSolanaAddress(userWallet) || !walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Valid Solana wallet addresses are required' }, { status: 400 })
    }

    if (nickname !== undefined && nickname !== null && (typeof nickname !== 'string' || nickname.length > MAX_NICKNAME_LENGTH)) {
      return NextResponse.json({ error: `Nickname must be ${MAX_NICKNAME_LENGTH} characters or less` }, { status: 400 })
    }

    if (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > MAX_NOTES_LENGTH)) {
      return NextResponse.json({ error: `Notes must be ${MAX_NOTES_LENGTH} characters or less` }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updates: Record<string, string | null> = {}
    if (nickname !== undefined) updates.nickname = nickname || null
    if (notes !== undefined) updates.notes = notes || null

    const { error } = await supabase
      .from('user_favorites')
      .update(updates)
      .eq('user_id', user.id)
      .eq('wallet_address', walletAddress)

    if (error) {
      console.error('Error updating favorite:', error)
      return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Favorite updated' })

  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Reorder favorites
export async function PUT(request: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { userWallet, order } = body

    if (!userWallet || !isValidSolanaAddress(userWallet)) {
      return NextResponse.json({ error: 'Valid Solana wallet address is required' }, { status: 400 })
    }

    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json({ error: 'Order array is required' }, { status: 400 })
    }

    // Validate all entries
    for (const item of order) {
      if (!item.wallet_address || !isValidSolanaAddress(item.wallet_address) || typeof item.sort_order !== 'number') {
        return NextResponse.json({ error: 'Invalid order entry' }, { status: 400 })
      }
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWallet)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update sort_order for each favorite
    const updates = order.map((item: { wallet_address: string; sort_order: number }) =>
      supabase
        .from('user_favorites')
        .update({ sort_order: item.sort_order })
        .eq('user_id', user.id)
        .eq('wallet_address', item.wallet_address)
    )

    const results = await Promise.all(updates)
    const failed = results.filter(r => r.error)

    if (failed.length > 0) {
      console.error('Error reordering favorites:', failed[0].error)
      return NextResponse.json({ error: 'Failed to reorder some favorites' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Order updated' })

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

    if (!userWallet || !isValidSolanaAddress(userWallet) || !walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Valid Solana wallet addresses are required' }, { status: 400 })
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
