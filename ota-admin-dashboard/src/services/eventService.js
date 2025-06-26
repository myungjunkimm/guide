// src/services/eventService.js
import { supabase } from '../lib/supabase';

const eventService = {
  // 모든 행사 조회 (조인으로 관련 정보 포함)
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          master_products (
            id,
            product_code,
            product_name,
            destination_country,
            destination_city,
            duration_days,
            duration_nights,
            base_price,
            is_star_guide_product
          ),
          guides (
            id,
            guide_id,
            name_ko,
            phone,
            email,
            languages,
            specialties,
            is_star_guide,
            star_guide_tier,
            average_rating,
            experience_year
          ),
          land_companies (
            id,
            company_name,
            country,
            region
          )
        `)
        .order('departure_date', { ascending: false });

      // 🆕 마스터 상품별 필터 추가
      if (filters.master_product_id) {
        query = query.eq('master_product_id', filters.master_product_id);
      }

      // 기존 필터들
      if (filters.search) {
        query = query.or(`
          event_code.ilike.%${filters.search}%,
          master_products.product_name.ilike.%${filters.search}%,
          master_products.destination_country.ilike.%${filters.search}%
        `);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.departure_date_from) {
        query = query.gte('departure_date', filters.departure_date_from);
      }

      if (filters.departure_date_to) {
        query = query.lte('departure_date', filters.departure_date_to);
      }

      if (filters.destination_country) {
        query = query.eq('master_products.destination_country', filters.destination_country);
      }

      if (filters.assigned_guide_id) {
        query = query.eq('assigned_guide_id', filters.assigned_guide_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('행사 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('행사 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 🆕 특정 마스터 상품의 행사들만 조회 (사용자용)
  async getByMasterProduct(masterProductId, filters = {}) {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          master_products (
            id,
            product_code,
            product_name,
            destination_country,
            destination_city,
            duration_days,
            duration_nights,
            base_price,
            is_star_guide_product,
            description
          ),
          guides (
            id,
            guide_id,
            name_ko,
            is_star_guide,
            average_rating,
            experience_year
          ),
          land_companies (
            id,
            company_name,
            country
          )
        `)
        .eq('master_product_id', masterProductId)
        .order('departure_date', { ascending: true });

      // 추가 필터들
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // 미래 일정만 조회 (기본값)
      if (filters.future_only !== false) {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('departure_date', today);
      }

      const { data, error } = await query;

      if (error) {
        console.error('마스터 상품별 행사 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('마스터 상품별 행사 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 🆕 고유한 행사 코드 생성
  async generateUniqueEventCode(masterProductId, departureDate) {
    try {
      // 마스터 상품 정보 조회
      const { data: masterProduct } = await supabase
        .from('master_products')
        .select('product_code')
        .eq('id', masterProductId)
        .single();

      if (!masterProduct) {
        throw new Error('마스터 상품을 찾을 수 없습니다.');
      }

      // 출발일을 YYMMDD 형식으로 변환
      const dateObj = new Date(departureDate);
      const dateStr = dateObj.toISOString().slice(2, 10).replace(/-/g, '');
      
      // 기본 코드 패턴: 상품코드-YYMMDD
      let baseCode = `${masterProduct.product_code}-${dateStr}`;
      
      // 같은 날짜에 동일한 상품으로 생성된 행사가 있는지 확인
      const { data: existingEvents } = await supabase
        .from('events')
        .select('event_code')
        .eq('master_product_id', masterProductId)
        .eq('departure_date', departureDate)
        .order('event_code', { ascending: false });

      if (!existingEvents || existingEvents.length === 0) {
        // 첫 번째 행사인 경우 기본 코드 사용
        return baseCode;
      }

      // 기존 행사가 있는 경우, 순번을 추가
      let suffix = 1;
      let uniqueCode = `${baseCode}-${suffix.toString().padStart(2, '0')}`;
      
      // 중복되지 않는 코드를 찾을 때까지 반복
      while (existingEvents.some(event => event.event_code === uniqueCode)) {
        suffix++;
        uniqueCode = `${baseCode}-${suffix.toString().padStart(2, '0')}`;
        
        // 무한 루프 방지 (최대 99개 행사)
        if (suffix > 99) {
          // 랜덤 문자열 추가로 고유성 보장
          const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
          uniqueCode = `${baseCode}-${randomStr}`;
          break;
        }
      }

      return uniqueCode;
    } catch (err) {
      console.error('행사 코드 생성 오류:', err);
      // 실패 시 타임스탬프 기반 코드 생성
      const timestamp = Date.now().toString().slice(-8);
      return `EVT-${timestamp}`;
    }
  },

  // 특정 행사 상세 조회
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          master_products (
            id,
            product_code,
            product_name,
            destination_country,
            destination_city,
            duration_days,
            duration_nights,
            base_price,
            description,
            min_participants,
            max_participants,
            is_star_guide_product,
            base_airline
          ),
          guides (
            id,
            guide_id,
            name_ko,
            phone,
            emergency_phone,
            email,
            languages,
            specialties,
            is_star_guide,
            star_guide_tier,
            average_rating,
            experience_year,
            profile_image
          ),
          land_companies (
            id,
            company_name,
            country,
            region,
            contact_info
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('행사 상세 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('행사 상세 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 새 행사 생성
  async create(eventData) {
    try {
      console.log('🆕 행사 생성 시작:', eventData);

      // 고유한 행사 코드 생성
      const eventCode = await this.generateUniqueEventCode(
        eventData.master_product_id, 
        eventData.departure_date
      );

      console.log('🎯 생성된 행사 코드:', eventCode);

      // final_price가 없으면 event_price로 설정
      const finalPrice = eventData.final_price || eventData.event_price;

      const newEventData = {
        ...eventData,
        event_code: eventCode,
        final_price: finalPrice, // 명시적으로 final_price 설정
        current_bookings: 0, // 초기 예약자 수는 0
        total_upselling_revenue: 0, // 초기 업셀링 수익은 0
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 DB에 저장할 데이터:', newEventData);
      console.log('💰 최종 가격 확인:', {
        event_price: newEventData.event_price,
        final_price: newEventData.final_price,
        upselling_enabled: newEventData.upselling_enabled
      });

      const { data, error } = await supabase
        .from('events')
        .insert([newEventData])
        .select(`
          *,
          master_products (
            id,
            product_code,
            product_name,
            destination_country,
            destination_city,
            duration_days,
            duration_nights
          ),
          guides (
            id,
            guide_id,
            name_ko,
            is_star_guide
          ),
          land_companies (
            id,
            company_name,
            country
          )
        `)
        .single();

      if (error) {
        console.error('❌ 행사 생성 DB 오류:', error);
        
        // 특정 오류 타입에 따른 사용자 친화적 메시지
        if (error.code === '23505') { // unique constraint violation
          if (error.message.includes('event_code')) {
            return { data: null, error: '이미 같은 날짜에 동일한 상품으로 생성된 행사가 있습니다. 잠시 후 다시 시도해주세요.' };
          }
        }
        
        return { data: null, error: `행사 생성 실패: ${error.message}` };
      }

      console.log('✅ 행사 생성 성공:', data);
      console.log('🔍 저장된 가격 정보:', {
        저장된_event_price: data.event_price,
        저장된_final_price: data.final_price,
        업셀링_활성화: data.upselling_enabled
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('💥 행사 생성 예외:', err);
      return { data: null, error: `행사 생성 중 오류가 발생했습니다: ${err.message}` };
    }
  },

  // 행사 수정
  async update(id, eventData) {
    try {
      console.log('📝 행사 수정 시작:', id, eventData);

      // final_price가 없으면 event_price로 설정
      const finalPrice = eventData.final_price || eventData.event_price;

      const updateData = {
        ...eventData,
        final_price: finalPrice, // 명시적으로 final_price 설정
        updated_at: new Date().toISOString()
      };

      // event_code는 수정에서 제외 (고유성 유지)
      delete updateData.event_code;
      delete updateData.created_at;

      console.log('💾 DB에 업데이트할 데이터:', updateData);
      console.log('💰 수정할 가격 정보:', {
        event_price: updateData.event_price,
        final_price: updateData.final_price,
        upselling_enabled: updateData.upselling_enabled
      });

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          master_products (
            id,
            product_code,
            product_name,
            destination_country,
            destination_city,
            duration_days,
            duration_nights
          ),
          guides (
            id,
            guide_id,
            name_ko,
            is_star_guide
          ),
          land_companies (
            id,
            company_name,
            country
          )
        `)
        .single();

      if (error) {
        console.error('❌ 행사 수정 DB 오류:', error);
        return { data: null, error: `행사 수정 실패: ${error.message}` };
      }

      console.log('✅ 행사 수정 성공:', data);
      console.log('🔍 수정된 가격 정보:', {
        수정된_event_price: data.event_price,
        수정된_final_price: data.final_price,
        업셀링_활성화: data.upselling_enabled
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('💥 행사 수정 예외:', err);
      return { data: null, error: `행사 수정 중 오류가 발생했습니다: ${err.message}` };
    }
  },

  // 행사 삭제
  async delete(id) {
    try {
      console.log('🗑️ 행사 삭제 시작:', id);

      // 먼저 예약이 있는지 확인
      const { data: event } = await supabase
        .from('events')
        .select('current_bookings, event_code')
        .eq('id', id)
        .single();

      if (event && event.current_bookings > 0) {
        return { 
          success: false, 
          error: `예약자가 ${event.current_bookings}명 있어서 삭제할 수 없습니다. 먼저 예약을 취소해주세요.`
        };
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 행사 삭제 DB 오류:', error);
        return { success: false, error: `행사 삭제 실패: ${error.message}` };
      }

      console.log('✅ 행사 삭제 성공');
      return { success: true, error: null };
    } catch (err) {
      console.error('💥 행사 삭제 예외:', err);
      return { success: false, error: `행사 삭제 중 오류가 발생했습니다: ${err.message}` };
    }
  },

  // 🆕 행사 상태 변경
  async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('행사 상태 변경 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('행사 상태 변경 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 🆕 가이드 배정
  async assignGuide(eventId, guideId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ 
          assigned_guide_id: guideId,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('가이드 배정 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('가이드 배정 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 🆕 예약 수 업데이트
  async updateBookingCount(eventId, bookingCount) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ 
          current_bookings: bookingCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('예약 수 업데이트 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('예약 수 업데이트 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 🆕 업셀링 수익 업데이트
  async updateUpsellRevenue(eventId, upsellRevenue) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ 
          total_upselling_revenue: upsellRevenue,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('업셀링 수익 업데이트 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('업셀링 수익 업데이트 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 달력용 행사 데이터 조회 (월별)
  async getEventsByMonth(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          event_code,
          departure_date,
          arrival_date,
          status,
          current_bookings,
          max_capacity,
          master_products (
            product_name,
            destination_country,
            destination_city
          ),
          guides (
            name_ko,
            is_star_guide
          )
        `)
        .gte('departure_date', startDate)
        .lte('departure_date', endDate)
        .order('departure_date', { ascending: true });

      if (error) {
        console.error('월별 행사 조회 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('월별 행사 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 통계 데이터 조회
  async getStats() {
    try {
      // 전체 행사 수
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // 활성 행사 수
      const { count: activeEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 이번 달 출발 행사 수
      const thisMonth = new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).toISOString().split('T')[0];

      const { count: thisMonthEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('departure_date', startOfMonth)
        .lte('departure_date', endOfMonth);

      // 전체 예약자 수 및 업셀링 수익
      const { data: aggregateData } = await supabase
        .from('events')
        .select('current_bookings, total_upselling_revenue');

      const totalBookings = aggregateData?.reduce((sum, event) => sum + (event.current_bookings || 0), 0) || 0;
      const totalUpsellRevenue = aggregateData?.reduce((sum, event) => sum + (event.total_upselling_revenue || 0), 0) || 0;

      return {
        data: {
          totalEvents: totalEvents || 0,
          activeEvents: activeEvents || 0,
          thisMonthEvents: thisMonthEvents || 0,
          totalBookings,
          totalUpsellRevenue
        },
        error: null
      };
    } catch (err) {
      console.error('통계 조회 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 🆕 중복 행사 코드 체크 (유틸리티 함수)
  async checkEventCodeExists(eventCode) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('event_code', eventCode)
        .single();

      if (error && error.code !== 'PGRST116') { // 'PGRST116'은 "not found" 오류
        console.error('행사 코드 중복 체크 오류:', error);
        return { exists: false, error: error.message };
      }

      return { exists: !!data, error: null };
    } catch (err) {
      console.error('행사 코드 중복 체크 예외:', err);
      return { exists: false, error: err.message };
    }
  }
};

export default eventService;