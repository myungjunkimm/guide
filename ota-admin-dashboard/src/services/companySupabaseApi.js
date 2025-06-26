// src/services/companySupabaseApi.js
import { supabase } from '../lib/supabase.js'

// 랜드사 Supabase API 서비스
export const companySupabaseApi = {
  
  // 모든 랜드사 조회
  async getCompanies() {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`랜드사 조회 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      }
    } catch (error) {
      console.error('getCompanies 오류:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  },

  // 특정 랜드사 조회
  async getCompanyById(id) {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        throw new Error(`랜드사 조회 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('getCompanyById 오류:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  },

  // 새 랜드사 생성
  async createCompany(companyData) {
    try {
      // 필수 필드 검증
      if (!companyData.company_name || !companyData.country) {
        throw new Error('회사명과 국가는 필수 입력 항목입니다.')
      }

      // updated_at은 자동으로 설정되므로 제거
      const { created_at, updated_at, id, ...insertData } = companyData
      
      const { data, error } = await supabase
        .from('land_companies')
        .insert([insertData])
        .select()
        .single()
      
      if (error) {
        throw new Error(`랜드사 생성 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data,
        message: '랜드사가 성공적으로 등록되었습니다.'
      }
    } catch (error) {
      console.error('createCompany 오류:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  },

  // 랜드사 정보 수정
  async updateCompany(id, companyData) {
    try {
      if (!id) {
        throw new Error('랜드사 ID가 필요합니다.')
      }

      // 업데이트할 데이터 정리 (메타데이터 제거)
      const { created_at, updated_at, id: dataId, ...updateData } = companyData
      
      // updated_at은 자동으로 현재 시간으로 업데이트
      updateData.updated_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('land_companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`랜드사 수정 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data,
        message: '랜드사 정보가 성공적으로 수정되었습니다.'
      }
    } catch (error) {
      console.error('updateCompany 오류:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  },

  // 랜드사 삭제
  async deleteCompany(id) {
    try {
      if (!id) {
        throw new Error('랜드사 ID가 필요합니다.')
      }

      // 먼저 해당 랜드사에 연결된 가이드가 있는지 확인 (선택사항)
      const { data: guides, error: guidesError } = await supabase
        .from('guides')
        .select('id')
        .eq('company_id', id)
        .limit(1)
      
      if (guidesError) {
        console.warn('가이드 확인 중 오류:', guidesError.message)
      }
      
      if (guides && guides.length > 0) {
        throw new Error('이 랜드사에 연결된 가이드가 있어 삭제할 수 없습니다. 먼저 가이드를 삭제하거나 다른 랜드사로 이전해주세요.')
      }
      
      const { error } = await supabase
        .from('land_companies')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(`랜드사 삭제 실패: ${error.message}`)
      }
      
      return {
        success: true,
        message: '랜드사가 성공적으로 삭제되었습니다.'
      }
    } catch (error) {
      console.error('deleteCompany 오류:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // 국가별 랜드사 수 조회
  async getCompaniesByCountry() {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select('country')
        .eq('status', 'active')
      
      if (error) {
        throw new Error(`국가별 통계 조회 실패: ${error.message}`)
      }
      
      // 국가별 개수 계산
      const countByCountry = {}
      data.forEach(company => {
        countByCountry[company.country] = (countByCountry[company.country] || 0) + 1
      })
      
      return {
        success: true,
        data: countByCountry
      }
    } catch (error) {
      console.error('getCompaniesByCountry 오류:', error)
      return {
        success: false,
        error: error.message,
        data: {}
      }
    }
  },

  // 활성 랜드사만 조회 (가이드 등록 시 사용)
  async getActiveCompanies() {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select('id, company_name, country, region')
        .eq('status', 'active')
        .order('company_name')
      
      if (error) {
        throw new Error(`활성 랜드사 조회 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      console.error('getActiveCompanies 오류:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }
}

export default companySupabaseApi;