// src/services/mockApi.js
import { mockData, mockHelpers } from '../data/mockData.js';

// API 지연 시뮬레이션
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// 성공/실패 랜덤 시뮬레이션 (선택사항)
const shouldFail = (failRate = 0) => Math.random() < failRate;

class MockApiService {
  // 랜드사 관련 API
  async getLandCompanies() {
    await delay();
    if (shouldFail(0.02)) {
      throw new Error('네트워크 오류가 발생했습니다.');
    }
    return {
      data: mockData.landCompanies,
      error: null
    };
  }

  async createLandCompany(companyData) {
    await delay(300);
    const newCompany = {
      id: String(Date.now()),
      ...companyData,
      created_at: new Date().toISOString(),
      status: companyData.status || 'active'
    };
    mockData.landCompanies.push(newCompany);
    return {
      data: [newCompany],
      error: null
    };
  }

  async updateLandCompany(id, updateData) {
    await delay(200);
    const index = mockData.landCompanies.findIndex(c => c.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '랜드사를 찾을 수 없습니다.' }
      };
    }
    mockData.landCompanies[index] = {
      ...mockData.landCompanies[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    return {
      data: [mockData.landCompanies[index]],
      error: null
    };
  }

  async deleteLandCompany(id) {
    await delay(150);
    const index = mockData.landCompanies.findIndex(c => c.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '랜드사를 찾을 수 없습니다.' }
      };
    }
    mockData.landCompanies.splice(index, 1);
    return {
      data: null,
      error: null
    };
  }

  // 가이드 관련 API
  async getGuides() {
    await delay();
    if (shouldFail(0.02)) {
      throw new Error('가이드 데이터를 불러오는데 실패했습니다.');
    }
    
    // 랜드사 정보와 함께 가져오기 (JOIN 시뮬레이션)
    const guidesWithCompany = mockData.guides.map(guide => ({
      ...guide,
      company: mockData.landCompanies.find(c => c.id === guide.company_id) || null
    }));

    return {
      data: guidesWithCompany,
      error: null
    };
  }

  async createGuide(guideData) {
    await delay(400);
    const newGuide = {
      id: String(Date.now()),
      guide_id: `G${Date.now().toString().slice(-6)}`,
      ...guideData,
      average_rating: 0,
      total_reviews: 0,
      is_star_guide: false,
      created_at: new Date().toISOString(),
      status: guideData.status || 'active'
    };
    mockData.guides.push(newGuide);
    return {
      data: [newGuide],
      error: null
    };
  }

  async updateGuide(id, updateData) {
    await delay(250);
    const index = mockData.guides.findIndex(g => g.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '가이드를 찾을 수 없습니다.' }
      };
    }
    
    // 스타가이드 상태 변경 시 로그 기록
    const oldGuide = mockData.guides[index];
    if (updateData.is_star_guide !== undefined && oldGuide.is_star_guide !== updateData.is_star_guide) {
      updateData.star_guide_since = updateData.is_star_guide ? new Date().toISOString() : null;
      updateData.star_guide_tier = updateData.is_star_guide ? 'bronze' : null;
    }

    mockData.guides[index] = {
      ...oldGuide,
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    return {
      data: [mockData.guides[index]],
      error: null
    };
  }

  async deleteGuide(id) {
    await delay(180);
    const index = mockData.guides.findIndex(g => g.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '가이드를 찾을 수 없습니다.' }
      };
    }
    mockData.guides.splice(index, 1);
    return {
      data: null,
      error: null
    };
  }

  // 마스터 상품 관련 API
  async getMasterProducts() {
    await delay();
    return {
      data: mockData.masterProducts,
      error: null
    };
  }

  async createMasterProduct(productData) {
    await delay(350);
    const newProduct = {
      id: String(Date.now()),
      product_code: productData.product_code || `PRD-${Date.now().toString().slice(-8)}`,
      ...productData,
      created_at: new Date().toISOString(),
      status: productData.status || 'active'
    };
    mockData.masterProducts.push(newProduct);
    return {
      data: [newProduct],
      error: null
    };
  }

  async updateMasterProduct(id, updateData) {
    await delay(220);
    const index = mockData.masterProducts.findIndex(p => p.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '상품을 찾을 수 없습니다.' }
      };
    }
    mockData.masterProducts[index] = {
      ...mockData.masterProducts[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    return {
      data: [mockData.masterProducts[index]],
      error: null
    };
  }

  async deleteMasterProduct(id) {
    await delay(200);
    const index = mockData.masterProducts.findIndex(p => p.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '상품을 찾을 수 없습니다.' }
      };
    }
    mockData.masterProducts.splice(index, 1);
    return {
      data: null,
      error: null
    };
  }

  // 행사 관련 API
  async getEvents() {
    await delay();
    
    // 관련 데이터와 함께 가져오기 (JOIN 시뮬레이션)
    const eventsWithDetails = mockData.events.map(event => ({
      ...event,
      master_product: mockData.masterProducts.find(p => p.id === event.master_product_id) || null,
      guide: mockData.guides.find(g => g.id === event.assigned_guide_id) || null
    }));

    return {
      data: eventsWithDetails,
      error: null
    };
  }

  async createEvent(eventData) {
    await delay(400);
    const newEvent = {
      id: String(Date.now()),
      event_code: eventData.event_code || `EVT-${Date.now().toString().slice(-8)}`,
      ...eventData,
      current_bookings: 0,
      created_at: new Date().toISOString(),
      status: eventData.status || 'active'
    };

    // 최종 가격 계산
    newEvent.final_price = mockHelpers.calculateFinalPrice(newEvent.id);
    
    mockData.events.push(newEvent);
    return {
      data: [newEvent],
      error: null
    };
  }

  async updateEvent(id, updateData) {
    await delay(280);
    const index = mockData.events.findIndex(e => e.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '행사를 찾을 수 없습니다.' }
      };
    }

    const updatedEvent = {
      ...mockData.events[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // 가이드나 가격이 변경되면 최종 가격 재계산
    if (updateData.assigned_guide_id || updateData.event_price) {
      updatedEvent.final_price = mockHelpers.calculateFinalPrice(id);
    }

    mockData.events[index] = updatedEvent;
    return {
      data: [updatedEvent],
      error: null
    };
  }

  async deleteEvent(id) {
    await delay(200);
    const index = mockData.events.findIndex(e => e.id === id);
    if (index === -1) {
      return {
        data: null,
        error: { message: '행사를 찾을 수 없습니다.' }
      };
    }
    mockData.events.splice(index, 1);
    return {
      data: null,
      error: null
    };
  }

  // 예약 관련 API
  async getBookings() {
    await delay();
    
    const bookingsWithDetails = mockData.bookings.map(booking => ({
      ...booking,
      event: mockData.events.find(e => e.id === booking.event_id) || null
    }));

    return {
      data: bookingsWithDetails,
      error: null
    };
  }

  // 후기 관련 API
  async getReviews() {
    await delay();
    
    const reviewsWithDetails = mockData.reviews.map(review => ({
      ...review,
      booking: mockData.bookings.find(b => b.id === review.booking_id) || null,
      guide: mockData.guides.find(g => g.id === review.guide_id) || null
    }));

    return {
      data: reviewsWithDetails,
      error: null
    };
  }

  async getGuideRatings(guideId = null) {
    await delay();
    
    let ratings = mockData.guideRatings;
    if (guideId) {
      ratings = ratings.filter(r => r.guide_id === guideId);
    }

    const ratingsWithDetails = ratings.map(rating => ({
      ...rating,
      guide: mockData.guides.find(g => g.id === rating.guide_id) || null,
      booking: mockData.bookings.find(b => b.id === rating.booking_id) || null
    }));

    return {
      data: ratingsWithDetails,
      error: null
    };
  }

  // 대시보드 통계 API
  async getDashboardStats() {
    await delay(150);
    
    const stats = {
      totalProducts: mockData.masterProducts.length,
      totalGuides: mockData.guides.length,
      starGuides: mockHelpers.getStarGuideCount(),
      totalRevenue: mockHelpers.getTotalRevenue(),
      totalEvents: mockData.events.length,
      totalBookings: mockData.bookings.length,
      activeProducts: mockData.masterProducts.filter(p => p.status === 'active').length,
      activeGuides: mockData.guides.filter(g => g.status === 'active').length,
      averageRating: mockData.guideRatings.length > 0 
        ? (mockData.guideRatings.reduce((sum, r) => sum + r.guide_rating, 0) / mockData.guideRatings.length).toFixed(1)
        : 0
    };

    return {
      data: stats,
      error: null
    };
  }

  // 인기 상품 API
  async getPopularProducts() {
    await delay();
    
    const productsWithBookings = mockData.masterProducts.map(product => ({
      ...product,
      totalBookings: mockHelpers.getTotalBookingsByProduct(product.id),
      events: mockData.events.filter(e => e.master_product_id === product.id)
    })).sort((a, b) => b.totalBookings - a.totalBookings);

    return {
      data: productsWithBookings.slice(0, 5), // 상위 5개
      error: null
    };
  }

  // 스타가이드 목록 API
  async getStarGuides() {
    await delay();
    
    const starGuides = mockData.guides
      .filter(guide => guide.is_star_guide)
      .map(guide => ({
        ...guide,
        company: mockData.landCompanies.find(c => c.id === guide.company_id) || null,
        recentRatings: mockData.guideRatings
          .filter(r => r.guide_id === guide.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
      }))
      .sort((a, b) => b.average_rating - a.average_rating);

    return {
      data: starGuides,
      error: null
    };
  }

  // 업셀링 수익 계산 API
  async getUpsellingRevenue() {
    await delay();
    
    const upsellingRevenue = mockData.events
      .filter(event => {
        const guide = mockData.guides.find(g => g.id === event.assigned_guide_id);
        const product = mockData.masterProducts.find(p => p.id === event.master_product_id);
        return guide && guide.is_star_guide && product && product.upselling_enabled;
      })
      .reduce((total, event) => {
        const basePrice = event.event_price || mockData.masterProducts.find(p => p.id === event.master_product_id).base_price;
        const upsellingAmount = event.final_price - basePrice;
        return total + (upsellingAmount * event.current_bookings);
      }, 0);

    return {
      data: { upsellingRevenue },
      error: null
    };
  }

  // 테스트용 후기 추가 API
  async createTestReview(guideId, rating = 5) {
    await delay(300);
    
    const newRating = {
      id: String(Date.now()),
      booking_id: 'test-booking',
      guide_id: guideId,
      guide_rating: rating,
      guide_review: '테스트 후기입니다.',
      professionalism_rating: rating,
      communication_rating: rating,
      friendliness_rating: rating,
      punctuality_rating: rating,
      would_recommend: rating >= 4,
      created_at: new Date().toISOString()
    };

    mockData.guideRatings.push(newRating);

    // 가이드 평균 평점 업데이트
    const guideRatings = mockData.guideRatings.filter(r => r.guide_id === guideId);
    const averageRating = guideRatings.reduce((sum, r) => sum + r.guide_rating, 0) / guideRatings.length;
    
    const guideIndex = mockData.guides.findIndex(g => g.id === guideId);
    if (guideIndex !== -1) {
      mockData.guides[guideIndex].average_rating = averageRating;
      mockData.guides[guideIndex].total_reviews = guideRatings.length;
      
      // 스타가이드 자동 승격/강등 로직 (4점 이상)
      const shouldBeStarGuide = averageRating >= 4.0;
      if (mockData.guides[guideIndex].is_star_guide !== shouldBeStarGuide) {
        mockData.guides[guideIndex].is_star_guide = shouldBeStarGuide;
        mockData.guides[guideIndex].star_guide_since = shouldBeStarGuide ? new Date().toISOString() : null;
        mockData.guides[guideIndex].star_guide_tier = shouldBeStarGuide ? 'bronze' : null;
      }
    }

    return {
      data: [newRating],
      error: null
    };
  }
}

// 싱글톤 인스턴스 생성
const mockApiService = new MockApiService();

export default mockApiService;