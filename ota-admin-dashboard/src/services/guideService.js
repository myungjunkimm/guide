// src/services/guideService.js
import { supabase } from '../lib/supabase';

const guideService = {
  // 모든 가이드 조회
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('guides')
        .select(`
          *,
          land_companies (
            id,
            company_name,
            country,
            region,
            contact_person,
            phone,
            email,
            status
          )
        `)
        .order('name_ko', { ascending: true });

      // 필터 적용
      if (filters.search) {
        query = query.or(`
          name_ko.ilike.%${filters.search}%,
          guide_id.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%
        `);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.guide_type) {
        query = query.eq('guide_type', filters.guide_type);
      }

      if (filters.employment_type) {
        query = query.eq('employment_type', filters.employment_type);
      }

      if (filters.is_star_guide !== undefined) {
        query = query.eq('is_star_guide', filters.is_star_guide);
      }

      if (filters.languages && filters.languages.length > 0) {
        query = query.overlaps('languages', filters.languages);
      }

      if (filters.company_id) {
        query = query.eq('company_id', filters.company_id);
      }

      if (filters.min_experience) {
        query = query.gte('experience_year', filters.min_experience);
      }

      const { data, error } = await query;

      if (error) {
        console.error('가이드 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('가이드 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 특정 국가의 가이드 조회 (행사 생성 시 사용)
  async getByCountry(country, filters = {}) {
    try {
      let query = supabase
        .from('guides')
        .select(`
          *,
          land_companies!inner (
            id,
            company_name,
            country,
            region
          )
        `)
        .eq('land_companies.country', country)
        .eq('status', 'active')
        .order('name_ko', { ascending: true });

      // 추가 필터
      if (filters.is_star_guide !== undefined) {
        query = query.eq('is_star_guide', filters.is_star_guide);
      }

      if (filters.languages && filters.languages.length > 0) {
        query = query.overlaps('languages', filters.languages);
      }

      if (filters.min_experience) {
        query = query.gte('experience_year', filters.min_experience);
      }

      const { data, error } = await query;

      if (error) {
        console.error('국가별 가이드 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('국가별 가이드 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 특정 랜드사의 가이드 조회
  async getByCompany(companyId, filters = {}) {
    try {
      let query = supabase
        .from('guides')
        .select(`
          *,
          land_companies (
            id,
            company_name,
            country,
            region
          )
        `)
        .eq('company_id', companyId)
        .order('name_ko', { ascending: true });

      // 상태 필터 (기본: active만)
      const status = filters.status || 'active';
      query = query.eq('status', status);

      if (filters.is_star_guide !== undefined) {
        query = query.eq('is_star_guide', filters.is_star_guide);
      }

      const { data, error } = await query;

      if (error) {
        console.error('랜드사별 가이드 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('랜드사별 가이드 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 특정 가이드 상세 조회
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('guides')
        .select(`
          *,
          land_companies (
            id,
            company_name,
            country,
            region,
            contact_person,
            phone,
            email,
            address
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('가이드 상세 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('가이드 상세 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 새 가이드 생성
  async create(guideData) {
    try {
      const newGuideData = {
        ...guideData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('guides')
        .insert([newGuideData])
        .select(`
          *,
          land_companies (
            id,
            company_name,
            country,
            region
          )
        `)
        .single();

      if (error) {
        console.error('가이드 생성 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('가이드 생성 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 가이드 수정
  async update(id, guideData) {
    try {
      const updateData = {
        ...guideData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('guides')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          land_companies (
            id,
            company_name,
            country,
            region
          )
        `)
        .single();

      if (error) {
        console.error('가이드 수정 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('가이드 수정 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 가이드 삭제
  async delete(id) {
    try {
      const { error } = await supabase
        .from('guides')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('가이드 삭제 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('가이드 삭제 예외:', err);
      return { success: false, error: err.message };
    }
  },

  // 가이드 상태 변경
  async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('guides')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('가이드 상태 변경 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('가이드 상태 변경 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 스타가이드 승격/강등
  async updateStarGuideStatus(id, isStarGuide, starGuideTier = null) {
    try {
      const updateData = {
        is_star_guide: isStarGuide,
        star_guide_tier: isStarGuide ? starGuideTier : null,
        star_guide_since: isStarGuide ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('guides')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('스타가이드 상태 변경 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('스타가이드 상태 변경 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 가이드 평점 업데이트
  async updateRating(id, newRating, totalReviews) {
    try {
      const { data, error } = await supabase
        .from('guides')
        .update({ 
          average_rating: newRating,
          total_reviews: totalReviews,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('가이드 평점 업데이트 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('가이드 평점 업데이트 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 가이드 통계 조회
  async getStats() {
    try {
      // 전체 가이드 수
      const { count: totalGuides } = await supabase
        .from('guides')
        .select('*', { count: 'exact', head: true });

      // 활성 가이드 수
      const { count: activeGuides } = await supabase
        .from('guides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 스타가이드 수
      const { count: starGuides } = await supabase
        .from('guides')
        .select('*', { count: 'exact', head: true })
        .eq('is_star_guide', true)
        .eq('status', 'active');

      // 평균 경력
      const { data: experienceData } = await supabase
        .from('guides')
        .select('experience_year')
        .eq('status', 'active');

      const avgExperience = experienceData?.length > 0 
        ? Math.round(experienceData.reduce((sum, guide) => sum + (guide.experience_year || 0), 0) / experienceData.length)
        : 0;

      return {
        data: {
          totalGuides: totalGuides || 0,
          activeGuides: activeGuides || 0,
          starGuides: starGuides || 0,
          avgExperience
        },
        error: null
      };
    } catch (err) {
      console.error('가이드 통계 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 언어별 가이드 수 조회
  async getLanguageStats() {
    try {
      const { data, error } = await supabase
        .from('guides')
        .select('languages')
        .eq('status', 'active');

      if (error) {
        console.error('언어별 통계 조회 오류:', error);
        return { data: null, error: error.message };
      }

      // 언어별 카운트 계산
      const languageCount = {};
      data.forEach(guide => {
        if (guide.languages && Array.isArray(guide.languages)) {
          guide.languages.forEach(lang => {
            languageCount[lang] = (languageCount[lang] || 0) + 1;
          });
        }
      });

      return { data: languageCount, error: null };
    } catch (err) {
      console.error('언어별 통계 조회 예외:', err);
      return { data: null, error: err.message };
    }
  }
};

export default guideService;