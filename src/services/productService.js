import { supabase } from './supabaseClient'

export async function getProductList(searchTerm) {
  let query = supabase.from('products').select('*')

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`)
  }

  const { data, error } = await query
  if (error) throw { message: error.message }
  return data
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw { message: error.message }
  return data
}

export async function getFeaturedList() {
  const { data, error } = await supabase
    .from('featured_products')
    .select('*')

  if (error) throw { message: error.message }
  return data
}