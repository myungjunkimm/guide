import { supabase } from '../lib/supabase'

// 랜드사 관련 API
export const landCompanyAPI = {
  getAll: () => supabase.from('land_companies').select('*'),
  create: (data) => supabase.from('land_companies').insert([data]),
  update: (id, data) => supabase.from('land_companies').update(data).eq('id', id),
  delete: (id) => supabase.from('land_companies').delete().eq('id', id)
}

// 가이드 관련 API
export const guideAPI = {
  getAll: () => supabase.from('guides').select(`
    *,
    land_companies (
      id,
      company_name,
      country,
      region
    )
  `),
  create: (data) => supabase.from('guides').insert([data]),
  update: (id, data) => supabase.from('guides').update(data).eq('id', id),
  delete: (id) => supabase.from('guides').delete().eq('id', id)
}

// 마스터 상품 관련 API
export const productAPI = {
  getAll: () => supabase.from('master_products').select('*'),
  create: (data) => supabase.from('master_products').insert([data]),
  update: (id, data) => supabase.from('master_products').update(data).eq('id', id),
  delete: (id) => supabase.from('master_products').delete().eq('id', id)
}

// 행사 관련 API
export const eventAPI = {
  getAll: () => supabase.from('events').select(`
    *,
    master_products (
      id,
      product_name,
      base_price
    ),
    guides (
      id,
      name_ko,
      is_star_guide
    )
  `),
  create: (data) => supabase.from('events').insert([data]),
  update: (id, data) => supabase.from('events').update(data).eq('id', id),
  delete: (id) => supabase.from('events').delete().eq('id', id)
}

// 후기 관련 API
export const reviewAPI = {
  getAll: () => supabase.from('reviews').select(`
    *,
    bookings (
      customer_name,
      booking_code
    ),
    guides (
      name_ko
    )
  `),
  getByGuide: (guideId) => supabase.from('guide_ratings').select('*').eq('guide_id', guideId)
}

// 대시보드 통계 API
export const dashboardAPI = {
  getStats: async () => {
    const [
      { count: totalProducts },
      { count: totalGuides },
      { count: starGuides },
      { data: bookings }
    ] = await Promise.all([
      supabase.from('master_products').select('*', { count: 'exact', head: true }),
      supabase.from('guides').select('*', { count: 'exact', head: true }),
      supabase.from('guides').select('*', { count: 'exact', head: true }).eq('is_star_guide', true),
      supabase.from('bookings').select('total_amount')
    ])

    const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0

    return {
      totalProducts,
      totalGuides,
      starGuides,
      totalRevenue
    }
  }
}