// src/services/guideSupabaseApi.js (완전히 개선된 버전)
import { supabase } from '../lib/supabase.js'

// 가이드 ID 생성 함수
const generateGuideId = (name, companyId) => {
  const timestamp = Date.now().toString().slice(-4);
  const nameInitial = name.charAt(0).toUpperCase();
  const companyInitial = companyId ? companyId.slice(0, 4).toUpperCase() : 'XXXX';
  return `G${nameInitial}${companyInitial}${timestamp}`;
};

// 가이드 Supabase API 서비스
export const guideSupabaseApi = {

  // 모든 가이드 조회 (랜드사 정보 포함)
  async getGuides() {
    try {
      const { data, error } = await supabase
        .from('guides')
        .select(`
          *,
          company:land_companies(
            id,
            company_name,
            country,
            region
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`가이드 조회 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data || [],
        count: data?.length || 0
      }
    } catch (error) {
      console.error('getGuides 오류:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  },

  // 특정 가이드 조회
  async getGuideById(id) {
    try {
      const { data, error } = await supabase
        .from('guides')
        .select(`
          *,
          company:land_companies(
            id,
            company_name,
            country,
            region
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        throw new Error(`가이드 조회 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('getGuideById 오류:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  },

  // 새 가이드 생성
  async createGuide(guideData) {
    try {
      // 필수 필드 검증
      if (!guideData.name_ko || !guideData.email || !guideData.company_id) {
        throw new Error('이름, 이메일, 소속 랜드사는 필수 입력 항목입니다.')
      }

      // 가이드 ID 자동 생성
      const guide_id = generateGuideId(guideData.name_ko, guideData.company_id);

      // 메타데이터 제거 및 가이드 ID 추가
      const { created_at, updated_at, id, ...insertData } = guideData;
      insertData.guide_id = guide_id;
      
      const { data, error } = await supabase
        .from('guides')
        .insert([insertData])
        .select(`
          *,
          company:land_companies(
            id,
            company_name,
            country,
            region
          )
        `)
        .single()
      
      if (error) {
        throw new Error(`가이드 생성 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data,
        message: '가이드가 성공적으로 등록되었습니다.'
      }
    } catch (error) {
      console.error('createGuide 오류:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  },

  // 가이드 정보 수정
  async updateGuide(id, guideData) {
    try {
      if (!id) {
        throw new Error('가이드 ID가 필요합니다.')
      }

      // 업데이트할 데이터 정리
      const { created_at, updated_at, id: dataId, guide_id, company, ...updateData } = guideData;
      
      // updated_at은 자동으로 현재 시간으로 업데이트
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('guides')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          company:land_companies(
            id,
            company_name,
            country,
            region
          )
        `)
        .single()
      
      if (error) {
        throw new Error(`가이드 수정 실패: ${error.message}`)
      }
      
      return {
        success: true,
        data: data,
        message: '가이드 정보가 성공적으로 수정되었습니다.'
      }
    } catch (error) {
      console.error('updateGuide 오류:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  },

  // 가이드 삭제 (후기 포함 옵션)
  async deleteGuide(id, forceDelete = false) {
    try {
      if (!id) {
        throw new Error('가이드 ID가 필요합니다.');
      }

      // 먼저 해당 가이드에 연결된 후기가 있는지 확인
      const { data: reviews, error: reviewsError } = await supabase
        .from('guide_ratings')
        .select('id, guide_review')
        .eq('guide_id', id);
      
      if (reviewsError) {
        console.warn('후기 확인 중 오류:', reviewsError.message);
      }
      
      const reviewCount = reviews?.length || 0;
      
      if (reviewCount > 0 && !forceDelete) {
        // 후기가 있지만 강제 삭제가 아닌 경우
        return {
          success: false,
          error: '이 가이드에 연결된 후기가 있어 삭제할 수 없습니다.',
          data: {
            reviewCount,
            needsConfirmation: true,
            reviews: reviews?.slice(0, 3) // 처음 3개 후기만 미리보기
          }
        };
      }
      
      if (reviewCount > 0 && forceDelete) {
        // 강제 삭제 모드: 후기 먼저 삭제
        console.log(`${reviewCount}개의 후기를 먼저 삭제합니다...`);
        
        const { error: deleteReviewsError } = await supabase
          .from('guide_ratings')
          .delete()
          .eq('guide_id', id);
        
        if (deleteReviewsError) {
          throw new Error(`후기 삭제 실패: ${deleteReviewsError.message}`);
        }
        
        console.log('✅ 후기 삭제 완료');
      }
      
      // 가이드 삭제
      const { error } = await supabase
        .from('guides')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`가이드 삭제 실패: ${error.message}`);
      }
      
      const message = reviewCount > 0 
        ? `가이드와 연결된 ${reviewCount}개의 후기가 함께 삭제되었습니다.`
        : '가이드가 성공적으로 삭제되었습니다.';
      
      return {
        success: true,
        message,
        data: {
          deletedReviews: reviewCount
        }
      };
    } catch (error) {
      console.error('deleteGuide 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 프로필 이미지 업로드
  async uploadProfileImage(file, guideId) {
    try {
      if (!file || !guideId) {
        throw new Error('파일과 가이드 ID가 필요합니다.')
      }

      // 파일 확장자 체크
      const fileExt = file.name.split('.').pop().toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!allowedExts.includes(fileExt)) {
        throw new Error('지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 허용)')
      }

      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기는 5MB 이하여야 합니다.')
      }

      // 파일명 생성
      const fileName = `guide_${guideId}_${Date.now()}.${fileExt}`;
      const filePath = `guide-profiles/${fileName}`;

      // Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('guide-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
      }

      // 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('guide-images')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('이미지 URL 생성에 실패했습니다.')
      }

      // 가이드 테이블의 profile_image 필드 업데이트
      const { error: updateError } = await supabase
        .from('guides')
        .update({ 
          profile_image: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', guideId);

      if (updateError) {
        throw new Error(`가이드 정보 업데이트 실패: ${updateError.message}`)
      }

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: filePath
        },
        message: '프로필 이미지가 성공적으로 업로드되었습니다.'
      }
    } catch (error) {
      console.error('uploadProfileImage 오류:', error)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  },

  // 개선된 스타가이드 토글 (수동 제어 지원)
  async toggleStarGuide(id, isStarGuide, isManual = false) {
    try {
      // 현재 가이드 정보 조회
      const { data: currentGuide, error: guideError } = await supabase
        .from('guides')
        .select('name_ko, average_rating, total_reviews, is_star_guide')
        .eq('id', id)
        .single();

      if (guideError || !currentGuide) {
        throw new Error('가이드 정보를 찾을 수 없습니다.');
      }

      const updateData = {
        is_star_guide: isStarGuide,
        updated_at: new Date().toISOString()
      };

      // 스타가이드로 승격하는 경우
      if (isStarGuide) {
        updateData.star_guide_since = new Date().toISOString();
        updateData.star_guide_tier = 'bronze';
        
        // 수동 승격 표시
        if (isManual) {
          updateData.manual_promotion = true;
        }
      } else {
        // 스타가이드 해제
        updateData.star_guide_since = null;
        updateData.star_guide_tier = null;
        updateData.manual_promotion = null;
      }

      const { data, error } = await supabase
        .from('guides')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          company:land_companies(
            id,
            company_name,
            country,
            region
          )
        `)
        .single();

      if (error) {
        throw new Error(`스타가이드 상태 변경 실패: ${error.message}`);
      }

      // 자동 승격 조건 확인
      const rating = currentGuide.average_rating || 0;
      const reviews = currentGuide.total_reviews || 0;
      const meetsCondition = rating >= 4.0 && reviews >= 3;

      let message;
      if (isStarGuide) {
        if (meetsCondition && !isManual) {
          message = `✅ ${currentGuide.name_ko}님이 자동으로 스타가이드로 승격되었습니다! (평균: ${rating.toFixed(1)}점, ${reviews}개 후기)`;
        } else if (isManual) {
          message = `👑 ${currentGuide.name_ko}님이 수동으로 스타가이드로 승격되었습니다! ${!meetsCondition ? '(조건 미충족이지만 수동 승격)' : ''}`;
        } else {
          message = `⭐ ${currentGuide.name_ko}님이 스타가이드로 승격되었습니다!`;
        }
      } else {
        message = `📝 ${currentGuide.name_ko}님이 일반가이드로 변경되었습니다. ${meetsCondition ? '(자동 승격 조건 충족하지만 수동 해제)' : ''}`;
      }

      return {
        success: true,
        data: data,
        message
      };
    } catch (error) {
      console.error('toggleStarGuide 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // 개선된 테스트 후기 추가 (3개 이상 후기 + 4.0점 이상 조건)
  async addTestReview(guideId, rating = 5) {
    try {
      console.log('🔍 트리거 제거 후 단순 방식');
      
      // 1단계: 가이드 확인 (guideId 매개변수 사용)
      const { data: guide, error: guideError } = await supabase
        .from('guides')
        .select('*')
        .eq('id', guideId)
        .single();

      if (guideError || !guide) {
        throw new Error(`가이드 조회 실패: ${guideError?.message || '가이드 없음'}`);
      }

      console.log('✅ 사용할 가이드:', guide.name_ko, guide.id);

      // 2단계: 후기 추가
      const { data: newReview, error: reviewError } = await supabase
        .from('guide_ratings')
        .insert({
          guide_id: guide.id,
          guide_rating: parseInt(rating),
          guide_review: `테스트 후기 - ${rating}점 평가 (${new Date().toLocaleString()})`,
          professionalism_rating: parseInt(rating),
          communication_rating: parseInt(rating),
          friendliness_rating: parseInt(rating),
          punctuality_rating: parseInt(rating),
          would_recommend: rating >= 4
        })
        .select()
        .single();

      if (reviewError) {
        console.error('❌ 후기 추가 실패:', reviewError);
        throw new Error(`후기 추가 실패: ${reviewError.message}`);
      }

      console.log('✅ 후기 추가 성공!', newReview);

      // 3단계: 수동으로 통계 계산
      const { data: allReviews, error: reviewsError } = await supabase
        .from('guide_ratings')
        .select('guide_rating')
        .eq('guide_id', guide.id);

      if (reviewsError) {
        console.warn('통계 계산 실패, 기본 응답 반환');
        return {
          success: true,
          message: '후기 추가 성공! (통계 업데이트 실패)',
          data: { newReviewAdded: true }
        };
      }

      const totalReviews = allReviews.length;
      const averageRating = totalReviews > 0 
        ? allReviews.reduce((sum, r) => sum + (r.guide_rating || 0), 0) / totalReviews 
        : 0;

      console.log('📊 계산된 통계:', { totalReviews, averageRating });

      // 4단계: 개선된 스타가이드 승격 판단 (3개 이상 후기 + 4.0점 이상)
      const wasStarGuide = guide.is_star_guide;
      const shouldBeStarGuide = averageRating >= 4.0 && totalReviews >= 3; // 조건 강화
      const wasPromoted = !wasStarGuide && shouldBeStarGuide;
      const wasDemoted = wasStarGuide && !shouldBeStarGuide;

      // 5단계: 가이드 통계 업데이트
      const updateData = {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 100) / 100,
        updated_at: new Date().toISOString()
      };

      if (shouldBeStarGuide && !wasStarGuide) {
        updateData.is_star_guide = true;
        updateData.star_guide_since = new Date().toISOString();
        updateData.star_guide_tier = 'bronze';
      } else if (!shouldBeStarGuide && wasStarGuide) {
        // 조건 미달 시 스타가이드 해제 (수동 승격이 아닌 경우)
        if (!guide.manual_promotion) {
          updateData.is_star_guide = false;
          updateData.star_guide_since = null;
          updateData.star_guide_tier = null;
        }
      }

      const { error: updateError } = await supabase
        .from('guides')
        .update(updateData)
        .eq('id', guide.id);

      if (updateError) {
        console.warn('가이드 업데이트 실패:', updateError);
      }

      // 6단계: 개선된 결과 메시지
      let resultMessage;
      if (wasPromoted) {
        resultMessage = `🎉 ${guide.name_ko}에게 후기 추가! 스타가이드 승격! (평균: ${averageRating.toFixed(1)}점, 후기: ${totalReviews}개)`;
      } else if (wasDemoted && !guide.manual_promotion) {
        resultMessage = `📉 ${guide.name_ko}의 후기 추가. 스타가이드 해제됨 (평균: ${averageRating.toFixed(1)}점, 후기: ${totalReviews}개)`;
      } else if (shouldBeStarGuide) {
        resultMessage = `⭐ ${guide.name_ko}에게 후기 추가! 스타가이드 유지 (평균: ${averageRating.toFixed(1)}점, 후기: ${totalReviews}개)`;
      } else {
        const neededReviews = Math.max(0, 3 - totalReviews);
        const progressMessage = totalReviews < 3 
          ? `스타가이드까지 ${neededReviews}개 후기 더 필요` 
          : averageRating < 4.0 
          ? '평균 4.0점 이상 필요' 
          : '';
        
        resultMessage = `📝 ${guide.name_ko}에게 후기 추가! (평균: ${averageRating.toFixed(1)}점, 후기: ${totalReviews}개) ${progressMessage ? `- ${progressMessage}` : ''}`;
      }

      return {
        success: true,
        data: {
          guideName: guide.name_ko,
          totalReviews,
          averageRating: Math.round(averageRating * 100) / 100,
          isStarGuide: shouldBeStarGuide,
          wasPromoted,
          wasDemoted: wasDemoted && !guide.manual_promotion,
          newReviewId: newReview.id
        },
        message: resultMessage
      };

    } catch (error) {
      console.error('💥 addTestReview 전체 오류:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // 스타가이드 자동 상태 확인 함수
  async checkAndUpdateStarGuideStatus() {
    try {
      const { data: guides, error } = await supabase
        .from('guides')
        .select('id, name_ko, average_rating, total_reviews, is_star_guide, manual_promotion');

      if (error) throw error;

      let updateCount = 0;
      
      for (const guide of guides) {
        const rating = guide.average_rating || 0;
        const reviews = guide.total_reviews || 0;
        const meetsCondition = rating >= 4.0 && reviews >= 3;
        
        // 수동 승격/해제가 아닌 경우만 자동 업데이트
        if (!guide.manual_promotion) {
          if (meetsCondition && !guide.is_star_guide) {
            // 자동 승격
            await this.toggleStarGuide(guide.id, true, false);
            updateCount++;
          } else if (!meetsCondition && guide.is_star_guide) {
            // 자동 해제
            await this.toggleStarGuide(guide.id, false, false);
            updateCount++;
          }
        }
      }

      return {
        success: true,
        message: `${updateCount}명의 가이드 상태가 자동으로 업데이트되었습니다.`,
        data: { updateCount }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 랜드사별 가이드 수 조회
  async getGuidesByCompany() {
    try {
      const { data, error } = await supabase
        .from('guides')
        .select(`
          company_id,
          company:land_companies(company_name)
        `)
        .eq('status', 'active')
      
      if (error) {
        throw new Error(`랜드사별 통계 조회 실패: ${error.message}`)
      }
      
      // 랜드사별 개수 계산
      const countByCompany = {}
      data.forEach(guide => {
        const companyName = guide.company?.company_name || '미배정'
        countByCompany[companyName] = (countByCompany[companyName] || 0) + 1
      })
      
      return {
        success: true,
        data: countByCompany
      }
    } catch (error) {
      console.error('getGuidesByCompany 오류:', error)
      return {
        success: false,
        error: error.message,
        data: {}
      }
    }
  }
}

export default guideSupabaseApi;