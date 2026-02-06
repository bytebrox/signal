import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

function isValidSolanaAddress(addr: string): boolean {
  return typeof addr === 'string' && SOLANA_ADDRESS_RE.test(addr)
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// POST - Create or get user by wallet address
export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Valid Solana wallet address is required' }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user doesn't exist)
      console.error('Error checking user:', selectError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingUser) {
      // Update last login
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('wallet_address', walletAddress)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user:', updateError)
      }

      return NextResponse.json({
        user: updatedUser || existingUser,
        isNewUser: false,
        message: 'Welcome back!'
      })
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        is_premium: false,
        settings: {}
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json({
      user: newUser,
      isNewUser: true,
      message: 'Account created successfully!'
    })

  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get user by wallet address (query param)
export async function GET(request: Request) {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')

    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Valid Solana wallet address is required' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ user: null, message: 'User not found' })
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
