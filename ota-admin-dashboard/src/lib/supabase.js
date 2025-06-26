// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase URL과 키를 가져옵니다
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey)

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('land_companies')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.error('Supabase 연결 오류:', error)
      return false
    }
    
    console.log('Supabase 연결 성공!')
    return true
  } catch (err) {
    console.error('Supabase 연결 실패:', err)
    return false
  }
}