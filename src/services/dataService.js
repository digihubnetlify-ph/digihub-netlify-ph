import { supabase } from './supabaseClient'

// Cloudinary serves the SAME uploaded video two ways depending on the URL:
// adding an `fl_attachment` flag forces a browser download, leaving it off
// just plays the file inline. `download_url` in the DB is stored WITH
// fl_attachment (for the existing Download button) — this strips that flag
// back out to get a normal streamable URL, so we don't need a second column
// or a second upload for the same file.
//
// Google Drive links need different handling entirely: a Drive "view" URL
// isn't a direct file a <video> tag can play — it's a webpage. Drive DOES
// offer an embeddable "/preview" format meant for iframes, so we convert to
// that instead. This is a STOPGAP, not the long-term answer — see the
// migration notes discussed with the user (Drive has no real per-order
// access control, has download quotas that can lock out paying customers
// mid-catalog, and its iframe player is clunkier than a real <video>
// element). Once download_url values move to Cloudinary/Bunny/R2, this
// branch stops being hit and can eventually be deleted.
const DRIVE_FILE_ID_RE = /drive\.google\.com\/file\/d\/([^/]+)/;

export function toStreamUrl(downloadUrl) {
  if (!downloadUrl) return null

  const driveMatch = downloadUrl.match(DRIVE_FILE_ID_RE)
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  }

  // Handles fl_attachment on its own ("/fl_attachment/") and combined with
  // other flags via commas ("/fl_attachment,q_auto/" -> "/q_auto/").
  return downloadUrl
    .replace(/fl_attachment(:[^/,]*)?,?/, "")
    .replace(/\/,/, "/") // clean up a leftover comma if fl_attachment was first in the list
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
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw { message: "Not logged in" }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw { message: error.message }

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, download_url')

  if (prodError) throw { message: prodError.message }

  const ordersWithDownload = data.map(order => ({
    ...order,
    cart_list: order.cart_list.map(item => {
      const url = products.find(p => p.id === item.id)?.download_url || null
      return { ...item, dlUrl: url, streamUrl: toStreamUrl(url) }
    })
  }))

  return ordersWithDownload
}

export async function createOrder(cartList, total, user) {
  // FIX: use the authenticated user's id directly (already passed in from
  // getUser()) instead of a sessionStorage mirror — that mirror can fall
  // out of sync (cleared by the browser, race on page load) and silently
  // send user_id as null, which the "auth.uid() = user_id" RLS policy on
  // orders would then reject outright.
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      cart_list: cartList,
      amount_paid: total,
      quantity: cartList.length,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email || '',
    }])
    .select()

  if (error) throw { message: error.message }
  return data[0]
}

// Batched version of getOwnedStreamUrl, for grids showing many products at
// once (Home page featured rows, Products listing). One query for all the
// user's paid orders + one query for all relevant products, instead of a
// separate round-trip per card. Returns { [productId]: streamUrl }.
export async function getOwnedStreamUrlsMap() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data: orders, error } = await supabase
    .from('orders')
    .select('cart_list')
    .eq('user_id', user.id)
    .eq('status', 'paid')

  if (error || !orders) return {}

  const ownedIds = [...new Set(orders.flatMap(o => (o.cart_list || []).map(item => item.id)))]
  if (ownedIds.length === 0) return {}

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, download_url')
    .in('id', ownedIds)

  if (prodError || !products) return {}

  return Object.fromEntries(
    products.map(p => [p.id, toStreamUrl(p.download_url)])
  )
}

// Used by the product detail page's "Watch Online" button. Returns a
// streamable URL ONLY if the current visitor has actually PAID for this
// product — never trust "is it in the cart" or "did they click buy", always
// check the real order status. Returns null for logged-out visitors, people
// who haven't bought it, or orders still pending/failed — the button on the
// page hides itself entirely in all of those cases rather than showing a
// broken/disabled state.
export async function getOwnedStreamUrl(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orders, error } = await supabase
    .from('orders')
    .select('cart_list')
    .eq('user_id', user.id)
    .eq('status', 'paid')

  if (error || !orders) return null

  const owned = orders.some(order =>
    (order.cart_list || []).some(item => item.id === productId)
  )
  if (!owned) return null

  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('download_url')
    .eq('id', productId)
    .single()

  if (prodError) return null
  return toStreamUrl(product.download_url)
}

// Lightweight status check used for polling after a checkout redirect.
// Only fetches the columns needed to know whether the webhook has landed
// yet — avoids re-pulling cart_list/products on every poll tick.
export async function getOrderStatusById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single()

  if (error) throw { message: error.message }
  return data
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
    cart_list: data.cart_list.map(item => {
      const url = products.find(p => p.id === item.id)?.download_url || null
      return { ...item, dlUrl: url, streamUrl: toStreamUrl(url) }
    })
  }
}