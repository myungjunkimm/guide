// src/services/landCompanyService.js
import { supabase } from '../lib/supabase';

const landCompanyService = {
  // 모든 랜드사 조회
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('land_companies')
        .select(`
          *,
          guides (
            id,
            guide_id,
            name_ko,
            status,
            is_star_guide,
            experience_year,
            languages,
            average_rating
          )
        `)
        .order('company_name', { ascending: true });

      // 필터 적용
      if (filters.search) {
        query = query.or(`
          company_name.ilike.%${filters.search}%,
          contact_person.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%,
          country.ilike.%${filters.search}%
        `);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.region) {
        query = query.eq('region', filters.region);
      }

      const { data, error } = await query;

      if (error) {
        console.error('랜드사 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('랜드사 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 특정 국가의 랜드사 조회 (행사 생성 시 사용)
  async getByCountry(country, filters = {}) {
    try {
      let query = supabase
        .from('land_companies')
        .select(`
          *,
          guides (
            id,
            guide_id,
            name_ko,
            status,
            is_star_guide,
            languages,
            average_rating
          )
        `)
        .eq('country', country)
        .eq('status', 'active')
        .order('company_name', { ascending: true });

      // 추가 필터
      if (filters.region) {
        query = query.eq('region', filters.region);
      }

      if (filters.has_guides) {
        // 가이드가 있는 랜드사만 조회
        query = query.not('guides', 'is', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('국가별 랜드사 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('국가별 랜드사 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 랜드사 목록 (간단 버전) - 드롭다운용
  async getSimpleList(country = null) {
    try {
      let query = supabase
        .from('land_companies')
        .select('id, company_name, country, region, status')
        .eq('status', 'active')
        .order('company_name', { ascending: true });

      if (country) {
        query = query.eq('country', country);
      }

      const { data, error } = await query;

      if (error) {
        console.error('랜드사 간단 목록 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('랜드사 간단 목록 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 특정 랜드사 상세 조회
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select(`
          *,
          guides (
            id,
            guide_id,
            name_ko,
            phone,
            email,
            status,
            guide_type,
            employment_type,
            is_star_guide,
            star_guide_tier,
            languages,
            specialties,
            experience_year,
            average_rating,
            total_reviews,
            profile_image
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('랜드사 상세 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('랜드사 상세 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 새 랜드사 생성
  async create(companyData) {
    try {
      const newCompanyData = {
        ...companyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('land_companies')
        .insert([newCompanyData])
        .select()
        .single();

      if (error) {
        console.error('랜드사 생성 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('랜드사 생성 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 랜드사 수정
  async update(id, companyData) {
    try {
      const updateData = {
        ...companyData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('land_companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('랜드사 수정 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('랜드사 수정 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 랜드사 삭제
  async delete(id) {
    try {
      // 먼저 연결된 가이드가 있는지 확인
      const { data: guides } = await supabase
        .from('guides')
        .select('id')
        .eq('company_id', id);

      if (guides && guides.length > 0) {
        return { 
          success: false, 
          error: '연결된 가이드가 있어서 삭제할 수 없습니다. 먼저 가이드를 다른 랜드사로 이동하거나 삭제해주세요.' 
        };
      }

      const { error } = await supabase
        .from('land_companies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('랜드사 삭제 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('랜드사 삭제 예외:', err);
      return { success: false, error: err.message };
    }
  },

  // 랜드사 상태 변경
  async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('랜드사 상태 변경 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('랜드사 상태 변경 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 국가별 랜드사 통계
  async getStatsByCountry() {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select('country, status')
        .eq('status', 'active');

      if (error) {
        console.error('국가별 통계 조회 오류:', error);
        return { data: null, error: error.message };
      }

      // 국가별 카운트 계산
      const countryStats = {};
      data.forEach(company => {
        countryStats[company.country] = (countryStats[company.country] || 0) + 1;
      });

      return { data: countryStats, error: null };
    } catch (err) {
      console.error('국가별 통계 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 랜드사 통계 조회
  async getStats() {
    try {
      // 전체 랜드사 수
      const { count: totalCompanies } = await supabase
        .from('land_companies')
        .select('*', { count: 'exact', head: true });

      // 활성 랜드사 수
      const { count: activeCompanies } = await supabase
        .from('land_companies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 국가 수
      const { data: countryData } = await supabase
        .from('land_companies')
        .select('country')
        .eq('status', 'active');

      const uniqueCountries = countryData 
        ? [...new Set(countryData.map(item => item.country))].length 
        : 0;

      // 가이드를 보유한 랜드사 수
      const { data: companiesWithGuides } = await supabase
        .from('land_companies')
        .select(`
          id,
          guides!inner(id)
        `)
        .eq('status', 'active');

      const companiesWithGuidesCount = companiesWithGuides ? companiesWithGuides.length : 0;

      return {
        data: {
          totalCompanies: totalCompanies || 0,
          activeCompanies: activeCompanies || 0,
          uniqueCountries,
          companiesWithGuides: companiesWithGuidesCount
        },
        error: null
      };
    } catch (err) {
      console.error('랜드사 통계 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 랜드사별 가이드 수 조회
  async getCompanyGuideStats() {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select(`
          id,
          company_name,
          country,
          guides!left(id, status, is_star_guide)
        `)
        .eq('status', 'active');

      if (error) {
        console.error('랜드사별 가이드 통계 조회 오류:', error);
        return { data: null, error: error.message };
      }

      // 각 랜드사별로 가이드 통계 계산
      const stats = data.map(company => ({
        id: company.id,
        company_name: company.company_name,
        country: company.country,
        total_guides: company.guides?.length || 0,
        active_guides: company.guides?.filter(g => g.status === 'active').length || 0,
        star_guides: company.guides?.filter(g => g.is_star_guide && g.status === 'active').length || 0
      }));

      return { data: stats, error: null };
    } catch (err) {
      console.error('랜드사별 가이드 통계 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 특정 국가의 지역 목록 조회
  async getRegionsByCountry(country) {
    try {
      const { data, error } = await supabase
        .from('land_companies')
        .select('region')
        .eq('country', country)
        .eq('status', 'active')
        .not('region', 'is', null);

      if (error) {
        console.error('지역 목록 조회 오류:', error);
        return { data: null, error: error.message };
      }

      // 중복 제거
      const uniqueRegions = [...new Set(data.map(item => item.region))].filter(Boolean);

      return { data: uniqueRegions, error: null };
    } catch (err) {
      console.error('지역 목록 조회 예외:', err);
      return { data: null, error: err.message };
    }
  }
};

export default landCompanyService;