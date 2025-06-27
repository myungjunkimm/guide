// src/services/reviewService.js
import { supabase } from '../lib/supabase.js';
import guideSupabaseApi from './guideSupabaseApi.js';

// 후기 관리 서비스
const reviewService = {
  
  // 🔧 간단한 테스트 함수 (디버깅용)
  async testBasicQuery() {
    try {
      console.log('🔍 기본 쿼리 테스트 시작...');
      
      const { data, error } = await supabase
        .from('guide_ratings')
        .select('*')
        .limit(5);

      console.log('🔍 기본 쿼리 결과:', { data, error });
      
      if (error) {
        throw new Error(`기본 쿼리 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        message: '기본 쿼리 성공'
      };
    } catch (error) {
      console.error('❌ 기본 쿼리 테스트 실패:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 🔧 단계별 조인 테스트
  async testJoinQueries() {
    try {
      console.log('🔍 JOIN 쿼리 테스트 시작...');

      // 1단계: 가이드 조인만
      console.log('1단계: 가이드 조인 테스트');
      const step1 = await supabase
        .from('guide_ratings')
        .select(`
          *,
          guides(*)
        `)
        .limit(1);
      
      console.log('1단계 결과:', step1);

      // 2단계: 이벤트 조인만
      console.log('2단계: 이벤트 조인 테스트');
      const step2 = await supabase
        .from('guide_ratings')
        .select(`
          *,
          events(*)
        `)
        .limit(1);
      
      console.log('2단계 결과:', step2);

      // 3단계: 마스터 상품까지
      console.log('3단계: 마스터 상품까지 조인 테스트');
      const step3 = await supabase
        .from('guide_ratings')
        .select(`
          *,
          events(
            *,
            master_products(*)
          )
        `)
        .limit(1);
      
      console.log('3단계 결과:', step3);

      return {
        success: true,
        data: { step1, step2, step3 },
        message: 'JOIN 테스트 완료'
      };
    } catch (error) {
      console.error('❌ JOIN 테스트 실패:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // 🆕 수정된 getAllReviews (단순화 버전)
  async getAllReviews(options = {}) {
    try {
      const { status, membershipType, limit = 100, offset = 0 } = options;

      console.log('🔍 getAllReviews 호출:', { status, membershipType, limit, offset });

      // 단계 1: 기본 쿼리 먼저 시도
      let query = supabase
        .from('guide_ratings')
        .select('*')
        .order('created_at', { ascending: false });

      // 필터 적용
      if (status) {
        query = query.eq('review_status', status);
      }

      if (membershipType) {
        query = query.eq('membership_type', membershipType);
      }

      // 범위 설정
      query = query.range(offset, offset + limit - 1);

      const { data: basicData, error: basicError } = await query;

      console.log('🔍 기본 쿼리 결과:', { 
        dataCount: basicData?.length, 
        error: basicError?.message 
      });

      if (basicError) {
        throw new Error(`기본 후기 조회 실패: ${basicError.message}`);
      }

      // 단계 2: 관계 데이터 개별적으로 가져오기
      const enrichedData = [];

      for (const review of basicData || []) {
        try {
          const enrichedReview = { ...review };

          // 가이드 정보 가져오기
          if (review.guide_id) {
            const { data: guideData, error: guideError } = await supabase
              .from('guides')
              .select('id, name_ko, is_star_guide, average_rating, total_reviews')
              .eq('id', review.guide_id)
              .single();

            if (!guideError && guideData) {
              enrichedReview.guide = guideData;
            }
          }

          // 이벤트 정보 가져오기
          if (review.event_id) {
            const { data: eventData, error: eventError } = await supabase
              .from('events')
              .select('id, event_code, departure_date, arrival_date, master_product_id')
              .eq('id', review.event_id)
              .single();

            if (!eventError && eventData) {
              enrichedReview.event = eventData;

              // 마스터 상품 정보 가져오기
              if (eventData.master_product_id) {
                const { data: productData, error: productError } = await supabase
                  .from('master_products')
                  .select('id, product_name, destination_country, destination_city')
                  .eq('id', eventData.master_product_id)
                  .single();

                if (!productError && productData) {
                  enrichedReview.event.master_products = productData;
                }
              }
            }
          }

          enrichedData.push(enrichedReview);
        } catch (itemError) {
          console.warn('개별 후기 데이터 enrichment 실패:', itemError);
          // 기본 데이터라도 포함
          enrichedData.push(review);
        }
      }

      console.log('✅ getAllReviews 성공:', enrichedData.length, '건');

      return {
        success: true,
        data: enrichedData,
        count: enrichedData.length
      };
    } catch (error) {
      console.error('❌ getAllReviews 오류:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 🆕 원래 방식도 시도해보기 (Alternative)
  async getAllReviewsOriginal(options = {}) {
    try {
      const { status, membershipType, limit = 100, offset = 0 } = options;

      console.log('🔍 Original 방식 시도...');

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

      console.log('🔍 Original 방식 결과:', { 
        dataCount: data?.length, 
        error: error?.message,
        sample: data?.[0]
      });

      if (error) {
        throw new Error(`후기 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('getAllReviewsOriginal 오류:', error);
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
  
      // 전체 평점 계산 (카테고리 평점의 평균)
      let overallRating = 0;
      if (reviewData.categories) {
        const categoryRatings = Object.values(reviewData.categories);
        const validRatings = categoryRatings.filter(rating => rating > 0);
        if (validRatings.length > 0) {
          overallRating = Math.round(validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length);
        }
      }
  
      // 데이터 정리 및 형식 맞추기 (detailed_ratings 제거, 개별 컬럼 사용)
      const insertData = {
        guide_id: reviewData.guide_id,
        event_id: reviewData.event_id,
        author_name: reviewData.author,
        membership_type: reviewData.membershipType || 'non_member',
        guide_rating: overallRating,
        guide_review: reviewData.comment,
        // 개별 평가 항목들 (detailed_ratings 대신)
        professionalism_rating: reviewData.categories?.professionalism || null,
        communication_rating: reviewData.categories?.communication || null,
        knowledge_rating: reviewData.categories?.knowledge || null,
        friendliness_rating: reviewData.categories?.kindness || null,
        punctuality_rating: reviewData.categories?.punctuality || null,
        would_recommend: overallRating >= 4,
        review_status: reviewData.membershipType === 'member' ? 'approved' : 'pending',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
  
      console.log('🆕 후기 작성 데이터:', insertData);
  
      const { data, error } = await supabase
        .from('guide_ratings')
        .insert([insertData])
        .select()
        .single();
  
      if (error) {
        throw new Error(`후기 작성 실패: ${error.message}`);
      }
  
      console.log('✅ 후기 작성 성공:', data);
  
      // 회원 후기인 경우 가이드 평점 즉시 업데이트
      if (insertData.review_status === 'approved') {
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
        ? approvedReviews.reduce((sum, review) => sum + review.guide_rating, 0) / totalReviews
        : 0;

      // 스타 가이드 기준 (평점 4.5 이상, 후기 5개 이상)
      const shouldBeStarGuide = averageRating >= 4.5 && totalReviews >= 5;

      // 가이드 테이블 업데이트
      const { data, error } = await supabase
        .from('guides')
        .update({
          average_rating: Math.round(averageRating * 10) / 10, // 소수점 첫째 자리까지만
          total_reviews: totalReviews,
          is_star_guide: shouldBeStarGuide,
          updated_at: new Date().toISOString()
        })
        .eq('id', guideId)
        .select()
        .single();

      if (error) {
        throw new Error(`가이드 평점 업데이트 실패: ${error.message}`);
      }

      console.log('✅ 가이드 평점 업데이트 성공:', {
        guideId,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        isStarGuide: shouldBeStarGuide
      });

      return {
        success: true,
        data: {
          guideId,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
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

  // 🆕 통계 조회 (수정됨)
  async getReviewStats() {
    try {
      console.log('🔍 getReviewStats 호출...');

      // 전체 후기 수
      const { count: totalCount, error: totalError } = await supabase
        .from('guide_ratings')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('전체 후기 수 조회 실패:', totalError);
        throw new Error(`전체 후기 수 조회 실패: ${totalError.message}`);
      }

      // 상태별 후기 수
      const { count: pendingCount } = await supabase
        .from('guide_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'pending');

      const { count: approvedCount } = await supabase
        .from('guide_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'approved');

      const { count: rejectedCount } = await supabase
        .from('guide_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'rejected');

      // 회원/비회원별 후기 수
      const { count: memberCount } = await supabase
        .from('guide_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('membership_type', 'member');

      const { count: nonMemberCount } = await supabase
        .from('guide_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('membership_type', 'non_member');

      // 평균 평점 계산 (승인된 후기만)
      const { data: ratingData, error: ratingError } = await supabase
        .from('guide_ratings')
        .select('guide_rating')
        .eq('review_status', 'approved');

      let averageRating = 0;
      if (!ratingError && ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((total, review) => total + (review.guide_rating || 0), 0);
        averageRating = sum / ratingData.length;
      }

      const stats = {
        total: totalCount || 0,
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        members: memberCount || 0,
        nonMembers: nonMemberCount || 0,
        averageRating: Math.round(averageRating * 10) / 10
      };

      console.log('✅ getReviewStats 성공:', stats);

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

  // 🆕 마스터 상품별 후기 조회 (EventList에서 사용)
  async getReviewsByMasterProduct(masterProductId) {
    try {
      console.log('🔍 마스터 상품별 후기 조회:', masterProductId);

      // 단계 1: 먼저 해당 마스터 상품의 모든 이벤트 ID 조회
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('master_product_id', masterProductId);

      if (eventsError) {
        console.error('이벤트 조회 실패:', eventsError);
        throw new Error(`이벤트 조회 실패: ${eventsError.message}`);
      }

      if (!events || events.length === 0) {
        console.log('⚠️ 해당 마스터 상품에 연결된 이벤트가 없습니다');
        return {
          success: true,
          data: [],
          count: 0
        };
      }

      const eventIds = events.map(e => e.id);
      console.log('📋 찾은 이벤트 IDs:', eventIds);

      // 단계 2: 해당 이벤트들의 후기 조회
      const { data, error } = await supabase
        .from('guide_ratings')
        .select(`
          *,
          guide:guides(
            id,
            name_ko,
            is_star_guide
          )
        `)
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('후기 조회 실패:', error);
        throw new Error(`후기 조회 실패: ${error.message}`);
      }

      console.log('✅ 마스터 상품별 후기 조회 성공:', data?.length || 0, '건');

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
            master_product_id
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