import { supabase } from './supabaseClient'

function getSession() {
  const token = JSON.parse(sessionStorage.getItem("token"))
  const cbid = JSON.parse(sessionStorage.getItem("cbid"))
  return { token, cbid }
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw { message: error.message }

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || data.user.email,
  }
}

export async function getUserOrders() {
  const { cbid } = getSession()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', cbid)

  if (error) throw { message: error.message }
  return data
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
      user_email: user.email,
    }])
    .select()

  if (error) throw { message: error.message }
  return data[0]
}