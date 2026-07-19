import { supabase } from './supabaseClient'

function getSession() {
  const token = JSON.parse(sessionStorage.getItem("token"))
  const cbid = JSON.parse(sessionStorage.getItem("cbid"))
  return { token, cbid }
}

export async function getUser() {
  // FIX: use supabase.auth.getUser() directly — no sessionStorage token needed
  // This works for email AND phone accounts, and survives token refreshes
  const { data, error } = await supabase.auth.getUser()
  if (error) throw { message: error.message }
  if (!data.user) throw { message: "You are not logged in. Please log in to continue." }

  const user = data.user
  return {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,  // FIX: include phone for phone-only accounts
    name: user.user_metadata?.name || user.email || user.phone || 'User',
    // Present only while a submitted email change hasn't been confirmed yet
    pendingEmail: user.new_email || null,
  }
}

export async function getUserOrders() {
  const { cbid } = getSession()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', cbid)

  if (error) throw { message: error.message }

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, download_url')

  if (prodError) throw { message: prodError.message }

  const ordersWithDownload = data.map(order => ({
    ...order,
    cart_list: order.cart_list.map(item => ({
      ...item,
      dlUrl: products.find(p => p.id === item.id)?.download_url || null
    }))
  }))

  return ordersWithDownload
}

export async function createOrder(cartList, total, user) {
  const { cbid } = getSession()

  const { data, error } = await supabase
    .from('orders')
    .insert([{
      cart_list: cartList,
      amount_paid: total,
      quantity: cartList.length,
      user_id: cbid,
      user_name: user.name,
      user_email: user.email || user.phone || '',
    }])
    .select()

  if (error) throw { message: error.message }
  return data[0]
}

export async function getLatestOrder() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw { message: "Not logged in" }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) throw { message: error.message }

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, download_url')

  if (prodError) throw { message: prodError.message }

  return {
    ...data,
    cart_list: data.cart_list.map(item => ({
      ...item,
      dlUrl: products.find(p => p.id === item.id)?.download_url || null
    }))
  }
}