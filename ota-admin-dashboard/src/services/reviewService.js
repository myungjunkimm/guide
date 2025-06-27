// src/services/reviewService.js
import { supabase } from '../lib/supabase.js';
import guideSupabaseApi from './guideSupabaseApi.js';

// 후기 관리 서비스
const reviewService = {
  
  // 모든 후기 조회 (관계 테이블 포함)
  async getAllReviews(options = {}) {
    try {
      const { status, membershipType, limit = 100, offset = 0 } = options;

      let query = supabase
        .from('guide_ratings')
        .select(`
          *,
          guide:guides(
            id,
            name_ko,
            is_star_guide,
            average_rating,
            total_reviews
          ),
          event:events(
            id,
            event_code,
            departure_date,
            arrival_date,
            master_product_id,
            master_products(
              id,
              product_name,
              destination_country,
              destination_city
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // 상태 필터링
      if (status) {
        query = query.eq('review_status', status);
      }

      // 회원 타입 필터링
      if (membershipType) {
        query = query.eq('membership_type', membershipType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`후기 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('getAllReviews 오류:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 특정 후기 조회
  async getReviewById(id) {
    try {
      const { data, error } = await supabase
        .from('guide_ratings')
        .select(`
          *,
          guide:guides(
            id,
            name_ko,
            is_star_guide,
            average_rating,
            total_reviews
          ),
          event:events(
            id,
            event_code,
            departure_date,
            arrival_date,
            master_product_id,
            master_products(
              id,
              product_name,
              destination_country,
              destination_city
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`후기 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('getReviewById 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // 새 후기 작성 (SimpleBookingFlow에서 호출)
  async createReview(reviewData) {
    try {
      // 필수 필드 검증
      if (!reviewData.guide_id || !reviewData.event_id || !reviewData.author) {
        throw new Error('가이드 ID, 행사 ID, 작성자는 필수 입력 항목입니다.');
      }

      // 종합 평점 계산 (정수로 반올림)
      const categories = reviewData.categories || {};
      const categoryRatings = Object.values(categories).filter(rating => rating > 0);
      const overallRating = categoryRatings.length > 0 
        ? categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length 
        : 0;

      // DB에 저장할 데이터 준비
      const insertData = {
        guide_id: reviewData.guide_id,
        event_id: reviewData.event_id,
        author_name: reviewData.author,
        membership_type: reviewData.membershipType || 'non-member',
        
        // 가이드 평가 (정수로 변환)
        guide_rating: Math.round(overallRating), // 🆕 정수로 반올림
        guide_review: reviewData.comment,
        
        // 세부 평가 (모두 정수로 변환)
        professionalism_rating: Math.round(categories.professionalism || 0),
        communication_rating: Math.round(categories.communication || 0),
        knowledge_rating: Math.round(categories.knowledge || 0),
        kindness_rating: Math.round(categories.kindness || 0),
        punctuality_rating: Math.round(categories.punctuality || 0),
        
        // 추천 여부
        would_recommend: overallRating >= 4.0,
        
        // 승인 상태 (비회원은 pending, 회원은 auto-approved로 설정 가능)
        review_status: reviewData.membershipType === 'member' ? 'approved' : 'pending',
        
        // 메타데이터
        submitted_at: new Date().toISOString(),
        reviewed_at: reviewData.membershipType === 'member' ? new Date().toISOString() : null,
        reviewed_by: reviewData.membershipType === 'member' ? 'auto-system' : null,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('guide_ratings')
        .insert([insertData])
        .select(`
          *,
          guide:guides(
            id,
            name_ko,
            is_star_guide
          ),
          event:events(
            id,
            event_code,
            master_products(
              id,
              product_name
            )
          )
        `)
        .single();

      if (error) {
        throw new Error(`후기 작성 실패: ${error.message}`);
      }

      // 회원 후기의 경우 즉시 가이드 평점에 반영
      if (reviewData.membershipType === 'member') {
        await this.updateGuideRating(reviewData.guide_id);
      }

      return {
        success: true,
        data: data,
        message: reviewData.membershipType === 'member' 
          ? '후기가 작성되었습니다.' 
          : '후기가 작성되었습니다. 관리자 승인 후 반영됩니다.'
      };
    } catch (error) {
      console.error('createReview 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // 후기 승인
  async approveReview(reviewId, adminUserId = 'admin') {
    try {
      // 먼저 후기 정보 조회
      const { data: review, error: reviewError } = await supabase
        .from('guide_ratings')
        .select('*, guide_id')
        .eq('id', reviewId)
        .single();

      if (reviewError || !review) {
        throw new Error('후기를 찾을 수 없습니다.');
      }

      if (review.review_status === 'approved') {
        throw new Error('이미 승인된 후기입니다.');
      }

      // 후기 승인 처리
      const { data, error } = await supabase
        .from('guide_ratings')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`후기 승인 실패: ${error.message}`);
      }

      // 가이드 평점 업데이트 (승인된 후기만 반영)
      await this.updateGuideRating(review.guide_id);

      return {
        success: true,
        data: data,
        message: '후기가 승인되었습니다.'
      };
    } catch (error) {
      console.error('approveReview 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // 후기 거절
  async rejectReview(reviewId, adminUserId = 'admin', reason = '') {
    try {
      const { data, error } = await supabase
        .from('guide_ratings')
        .update({
          review_status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUserId,
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`후기 거절 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data,
        message: '후기가 거절되었습니다.'
      };
    } catch (error) {
      console.error('rejectReview 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // 가이드 평점 재계산 및 업데이트 (승인된 후기만 반영)
  async updateGuideRating(guideId) {
    try {
      // 승인된 후기만 조회
      const { data: approvedReviews, error: reviewsError } = await supabase
        .from('guide_ratings')
        .select('guide_rating')
        .eq('guide_id', guideId)
        .eq('review_status', 'approved');

      if (reviewsError) {
        console.warn('가이드 후기 조회 실패:', reviewsError.message);
        return { success: false, error: reviewsError.message };
      }

      const totalReviews = approvedReviews?.length || 0;
      const averageRating = totalReviews > 0 
        ? approvedReviews.reduce((sum, r) => sum + (r.guide_rating || 0), 0) / totalReviews 
        : 0;

      // 가이드 통계 업데이트
      const updateData = {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 10) / 10, // 🆕 소수점 첫째 자리까지만
        updated_at: new Date().toISOString()
      };

      // 스타가이드 자동 승격/해제 판단 (3개 이상 후기 + 4.0점 이상)
      const shouldBeStarGuide = averageRating >= 4.0 && totalReviews >= 3;
      
      // 현재 가이드 정보 조회
      const { data: currentGuide, error: guideError } = await supabase
        .from('guides')
        .select('is_star_guide, manual_promotion')
        .eq('id', guideId)
        .single();

      if (guideError) {
        console.warn('가이드 정보 조회 실패:', guideError.message);
      } else {
        // 수동 승격이 아닌 경우에만 자동 업데이트
        if (!currentGuide.manual_promotion) {
          if (shouldBeStarGuide && !currentGuide.is_star_guide) {
            // 자동 승격
            updateData.is_star_guide = true;
            updateData.star_guide_since = new Date().toISOString();
            updateData.star_guide_tier = 'bronze';
          } else if (!shouldBeStarGuide && currentGuide.is_star_guide) {
            // 자동 해제
            updateData.is_star_guide = false;
            updateData.star_guide_since = null;
            updateData.star_guide_tier = null;
          }
        }
      }

      const { error: updateError } = await supabase
        .from('guides')
        .update(updateData)
        .eq('id', guideId);

      if (updateError) {
        console.warn('가이드 통계 업데이트 실패:', updateError.message);
        return { success: false, error: updateError.message };
      }

      return {
        success: true,
        data: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10, // 🆕 소수점 첫째 자리까지만
          isStarGuide: shouldBeStarGuide
        }
      };
    } catch (error) {
      console.error('updateGuideRating 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 마스터 상품별 후기 조회
  async getReviewsByMasterProduct(masterProductId) {
    try {
      const { data, error } = await supabase
        .from('guide_ratings')
        .select(`
          *,
          guide:guides(
            id,
            name_ko,
            is_star_guide
          ),
          event:events!inner(
            id,
            event_code,
            master_product_id,
            master_products!inner(
              id,
              product_name
            )
          )
        `)
        .eq('event.master_products.id', masterProductId)
        .eq('review_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`마스터 상품 후기 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('getReviewsByMasterProduct 오류:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 가이드별 후기 조회 (승인된 것만)
  async getReviewsByGuide(guideId, approved = true) {
    try {
      let query = supabase
        .from('guide_ratings')
        .select(`
          *,
          event:events(
            id,
            event_code,
            master_products(
              id,
              product_name,
              destination_country,
              destination_city
            )
          )
        `)
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });

      if (approved) {
        query = query.eq('review_status', 'approved');
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`가이드 후기 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('getReviewsByGuide 오류:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 후기 통계 조회
  async getReviewStats() {
    try {
      const { data: allReviews, error } = await supabase
        .from('guide_ratings')
        .select('review_status, guide_rating, membership_type');

      if (error) {
        throw new Error(`후기 통계 조회 실패: ${error.message}`);
      }

      const stats = {
        total: allReviews?.length || 0,
        pending: allReviews?.filter(r => r.review_status === 'pending').length || 0,
        approved: allReviews?.filter(r => r.review_status === 'approved').length || 0,
        rejected: allReviews?.filter(r => r.review_status === 'rejected').length || 0,
        members: allReviews?.filter(r => r.membership_type === 'member').length || 0,
        nonMembers: allReviews?.filter(r => r.membership_type === 'non-member').length || 0,
        averageRating: 0
      };

      // 승인된 후기의 평균 평점 계산
      const approvedReviews = allReviews?.filter(r => r.review_status === 'approved') || [];
      if (approvedReviews.length > 0) {
        stats.averageRating = approvedReviews.reduce((sum, r) => sum + (r.guide_rating || 0), 0) / approvedReviews.length;
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('getReviewStats 오류:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          members: 0,
          nonMembers: 0,
          averageRating: 0
        }
      };
    }
  },

  // 검색 기능
  async searchReviews(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('guide_ratings')
        .select(`
          *,
          guide:guides(
            id,
            name_ko,
            is_star_guide
          ),
          event:events(
            id,
            event_code,
            master_products(
              id,
              product_name,
              destination_country,
              destination_city
            )
          )
        `);

      // 검색어가 있는 경우
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(`author_name.ilike.%${term}%,guide_review.ilike.%${term}%,guide.name_ko.ilike.%${term}%`);
      }

      // 필터 적용
      if (filters.status) {
        query = query.eq('review_status', filters.status);
      }
      if (filters.membershipType) {
        query = query.eq('membership_type', filters.membershipType);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`후기 검색 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('searchReviews 오류:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
};

export default reviewService;