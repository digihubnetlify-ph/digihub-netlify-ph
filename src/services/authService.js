import { supabase } from './supabaseClient'

export async function login(authDetail) {
  let data, error

  if (authDetail.phone) {
    // Normalize phone: convert 09XXXXXXXXX to +639XXXXXXXXX
    const normalizedPhone = authDetail.phone.startsWith('0')
      ? '+63' + authDetail.phone.slice(1)
      : authDetail.phone

    const result = await supabase.auth.signInWithPassword({
      phone: normalizedPhone,
      password: authDetail.password,
    })
    data = result.data
    error = result.error
  } else {
    const result = await supabase.auth.signInWithPassword({
      email: authDetail.email,
      password: authDetail.password,
    })
    data = result.data
    error = result.error
  }

  if (error) throw { message: error.message, status: error.status }

  if (!data.session) {
    throw { message: "Login failed. Please check your credentials and try again." }
  }

  sessionStorage.setItem("token", JSON.stringify(data.session.access_token))
  sessionStorage.setItem("cbid", JSON.stringify(data.user.id))
  window.dispatchEvent(new Event("authChange"))

  return { accessToken: data.session.access_token, user: data.user }
}

export async function register(authDetail) {
  let data, error

  // Normalize phone: convert 09XXXXXXXXX to +639XXXXXXXXX
  const normalizedPhone = authDetail.phone
    ? authDetail.phone.startsWith('0')
      ? '+63' + authDetail.phone.slice(1)
      : authDetail.phone
    : null

  if (normalizedPhone) {
    const result = await supabase.auth.signUp({
      phone: normalizedPhone,
      password: authDetail.password,
      options: {
        data: { name: authDetail.name }
      }
    })
    data = result.data
    error = result.error
  } else {
    const result = await supabase.auth.signUp({
      email: authDetail.email,
      password: authDetail.password,
      options: {
        data: { name: authDetail.name }
      }
    })
    data = result.data
    error = result.error
  }

  if (error) throw { message: error.message, status: error.status }

  if (!data.session) {
    throw { message: "Registration successful! Please check your phone for OTP verification." }
  }

  sessionStorage.setItem("token", JSON.stringify(data.session.access_token))
  sessionStorage.setItem("cbid", JSON.stringify(data.user.id))
  window.dispatchEvent(new Event("authChange"))

  return { accessToken: data.session.access_token, user: data.user }
}

export async function logout() {
  await supabase.auth.signOut()
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("cbid")
  window.dispatchEvent(new Event("authChange"))
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export async function updateProfile({ name, email, phone, password }) {
  const payload = {}

  if (name) {
    payload.data = { name }
  }

  if (phone) {
    // Normalize phone: convert 09XXXXXXXXX to +639XXXXXXXXX
    payload.phone = phone.startsWith('0') ? '+63' + phone.slice(1) : phone
  }

  if (password) {
    payload.password = password
  }

  // Email is routed through an admin edge function so it updates instantly,
  // bypassing Supabase's built-in confirmation-email flow (same as name/phone/password)
  if (email) {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw { message: result.error || "Failed to update email." }
    }
  }

  if (Object.keys(payload).length === 0 && !email) {
    throw { message: "Nothing to update." }
  }

  let updatedUser = null

  if (Object.keys(payload).length > 0) {
    const { data, error } = await supabase.auth.updateUser(payload)
    if (error) throw { message: error.message, status: error.status }
    updatedUser = data.user
  }

  // Refresh the session so the client picks up the new email immediately
  const { data: { user: refreshedUser } } = await supabase.auth.getUser()
  const finalUser = updatedUser || refreshedUser

  return {
    id: finalUser.id,
    email: finalUser.email || null,
    phone: finalUser.phone || null,
    name: finalUser.user_metadata?.name || null,
  }
}