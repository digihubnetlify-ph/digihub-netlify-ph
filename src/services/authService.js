import { supabase } from './supabaseClient'

export async function login(authDetail) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authDetail.email,
    password: authDetail.password,
  })

  if (error) throw { message: error.message, status: error.status }

  if (data.session) {
    sessionStorage.setItem("token", JSON.stringify(data.session.access_token))
    sessionStorage.setItem("cbid", JSON.stringify(data.user.id))
  }

  return { accessToken: data.session?.access_token, user: data.user }
}

export async function register(authDetail) {
  const { data, error } = await supabase.auth.signUp({
    email: authDetail.email,
    password: authDetail.password,
    options: {
      data: { name: authDetail.name }
    }
  })

  if (error) throw { message: error.message, status: error.status }

  if (data.session) {
    sessionStorage.setItem("token", JSON.stringify(data.session.access_token))
    sessionStorage.setItem("cbid", JSON.stringify(data.user.id))
  }

  return { accessToken: data.session?.access_token, user: data.user }
}

export async function logout() {
  await supabase.auth.signOut()
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("cbid")
}