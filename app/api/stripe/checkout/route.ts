import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-09-30.acacia' })

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id, is_pro').eq('id', user.id).single()
  if (profile?.is_pro) return NextResponse.redirect(new URL('/?already_pro=1', request.url))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: !profile?.stripe_customer_id ? user.email : undefined,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?pro_success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro`,
    metadata: { user_id: user.id },
  })

  return NextResponse.redirect(session.url!)
}
