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

// Re-sends the confirmation link for an email change that's still pending.
// Calling updateUser() with the same pending email again issues a fresh link.
export async function resendEmailConfirmation(pendingEmail) {
  const { error } = await supabase.auth.updateUser({ email: pendingEmail })
  if (error) throw { message: error.message, status: error.status }
  return { message: "Confirmation link resent. Please check your inbox." }
}

export async function deleteAccount() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw { message: "You are not logged in." }
  }

  // Deleting a user requires the service_role key, so this is routed through
  // an admin edge function (same pattern as the email update above).
  const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw { message: result.error || "Failed to delete account." }
  }

  // Clear local session the same way logout() does
  await supabase.auth.signOut()
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("cbid")
  window.dispatchEvent(new Event("authChange"))

  return result
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

  // Email changes go through Supabase's own updateUser() call, which — as
  // long as "Secure email change" / email confirmations are enabled in the
  // Supabase dashboard (Authentication > Emails) — sends a confirmation
  // link to the new address instead of applying it immediately.
  //
  // Important: this does NOT log the user out and does NOT block login.
  // Their current session and current email keep working exactly as
  // before. auth.users.email only switches to the new value once they
  // click the confirmation link. If they never click it, nothing changes
  // and nothing breaks — the account just quietly keeps the old email.
  let emailChangePending = false

  if (email) {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw { message: error.message, status: error.status }
    emailChangePending = true
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

  // Refresh the session to pick up any name/phone/password changes.
  // Note: this will still show the OLD email until the confirmation
  // link is clicked — that's expected and correct.
  const { data: { user: refreshedUser } } = await supabase.auth.getUser()
  const finalUser = updatedUser || refreshedUser

  return {
    id: finalUser.id,
    email: finalUser.email || null,
    phone: finalUser.phone || null,
    name: finalUser.user_metadata?.name || null,
    emailChangePending,
  }
}