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
          )
        `)
        .order('departure_date', { ascending: false });

      // 필터 적용
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
      // 행사 코드 자동 생성 (마스터 상품 코드 + 출발일)
      const departureDate = new Date(eventData.departure_date);
      const dateStr = departureDate.toISOString().slice(2, 10).replace(/-/g, '');
      
      // 마스터 상품 정보 조회
      const { data: masterProduct } = await supabase
        .from('master_products')
        .select('product_code')
        .eq('id', eventData.master_product_id)
        .single();

      const eventCode = masterProduct 
        ? `${masterProduct.product_code}-${dateStr}`
        : `EVT-${dateStr}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const newEventData = {
        ...eventData,
        event_code: eventCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('events')
        .insert([newEventData])
        .select()
        .single();

      if (error) {
        console.error('행사 생성 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('행사 생성 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 행사 수정
  async update(id, eventData) {
    try {
      const updateData = {
        ...eventData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('행사 수정 오류:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('행사 수정 예외:', err);
      return { data: null, error: err.message };
    }
  },

  // 행사 삭제
  async delete(id) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('행사 삭제 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('행사 삭제 예외:', err);
      return { success: false, error: err.message };
    }
  },

  // 행사 상태 변경
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

  // 가이드 배정
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

  // 예약 수 업데이트
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

      // 전체 예약자 수
      const { data: bookingData } = await supabase
        .from('events')
        .select('current_bookings');

      const totalBookings = bookingData?.reduce((sum, event) => sum + (event.current_bookings || 0), 0) || 0;

      return {
        data: {
          totalEvents: totalEvents || 0,
          activeEvents: activeEvents || 0,
          thisMonthEvents: thisMonthEvents || 0,
          totalBookings
        },
        error: null
      };
    } catch (err) {
      console.error('통계 조회 예외:', err);
      return { data: null, error: err.message };
    }
  }
};

export default eventService;