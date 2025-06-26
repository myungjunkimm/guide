// src/data/mockData.js
export const mockData = {
    // 랜드사 데이터
    landCompanies: [
      {
        id: '1',
        company_name: '도쿄 트래블 서비스',
        country: '일본',
        region: '도쿄',
        contact_person: '다나카 히로시',
        phone: '+81-3-1234-5678',
        email: 'tanaka@tokyo-travel.jp',
        address: '도쿄도 시부야구 시부야 1-1-1',
        status: 'active',
        created_at: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        company_name: '오사카 투어 컴퍼니',
        country: '일본',
        region: '오사카',
        contact_person: '사토 유키',
        phone: '+81-6-9876-5432',
        email: 'sato@osaka-tours.jp',
        address: '오사카부 오사카시 난바 2-2-2',
        status: 'active',
        created_at: '2024-01-20T10:30:00Z'
      },
      {
        id: '3',
        company_name: '방콕 가이드 센터',
        country: '태국',
        region: '방콕',
        contact_person: '솜차이 라타나',
        phone: '+66-2-555-1234',
        email: 'somchai@bangkok-guide.th',
        address: '방콕 수쿰빗 로드 123번지',
        status: 'active',
        created_at: '2024-02-01T08:15:00Z'
      },
      {
        id: '4',
        company_name: '푸켓 아일랜드 투어',
        country: '태국',
        region: '푸켓',
        contact_person: '니란 파타나',
        phone: '+66-76-123-456',
        email: 'niran@phuket-island.th',
        address: '푸켓 파통 비치 로드 456번지',
        status: 'active',
        created_at: '2024-02-10T14:20:00Z'
      }
    ],
  
    // 가이드 데이터
    guides: [
      {
        id: '1',
        guide_id: 'TKY001',
        name_ko: '김도쿄',
        phone: '+81-90-1234-5678',
        emergency_phone: '+81-90-1234-9999',
        email: 'kim.tokyo@email.com',
        guide_type: '전문가이드',
        employment_type: '정규직',
        company_id: '1',
        status: 'active',
        languages: ['한국어', '일본어', '영어'],
        specialties: ['문화관광', '쇼핑', '미식투어'],
        certification: '일본관광가이드 1급',
        experience_year: 5,
        introduction: '안녕하세요! 도쿄에서 5년째 가이드를 하고 있는 김도쿄입니다.',
        motto: '여행은 새로운 경험, 가이드는 그 경험의 다리!',
        is_star_guide: false,
        average_rating: 4.0,
        total_reviews: 1,
        created_at: '2024-03-01T09:00:00Z'
      },
      {
        id: '2',
        guide_id: 'TKY002',
        name_ko: '박하라주쿠',
        phone: '+81-90-2345-6789',
        emergency_phone: '+81-90-2345-9999',
        email: 'park.harajuku@email.com',
        guide_type: '전문가이드',
        employment_type: '정규직',
        company_id: '1',
        status: 'active',
        languages: ['한국어', '일본어'],
        specialties: ['쇼핑', '트렌드', '젊은문화'],
        certification: '일본관광가이드 2급',
        experience_year: 3,
        introduction: '하라주쿠와 시부야의 트렌드를 가장 빠르게 알려드리는 박하라주쿠입니다!',
        motto: '트렌드는 따라가는 것이 아니라 만들어가는 것!',
        is_star_guide: true,
        star_guide_since: '2024-06-15T12:00:00Z',
        star_guide_tier: 'bronze',
        average_rating: 5.0,
        total_reviews: 1,
        created_at: '2024-03-05T10:30:00Z'
      },
      {
        id: '3',
        guide_id: 'OSK001',
        name_ko: '이오사카',
        phone: '+81-90-3456-7890',
        emergency_phone: '+81-90-3456-9999',
        email: 'lee.osaka@email.com',
        guide_type: '전문가이드',
        employment_type: '프리랜서',
        company_id: '2',
        status: 'active',
        languages: ['한국어', '일본어'],
        specialties: ['미식투어', '역사문화', '전통시장'],
        certification: '간사이 지역 관광가이드 특급',
        experience_year: 7,
        introduction: '오사카 토박이 이오사카입니다! 진짜 오사카 맛을 보여드리겠습니다.',
        motto: '맛있는 여행, 따뜻한 추억!',
        is_star_guide: true,
        star_guide_since: '2024-06-20T15:30:00Z',
        star_guide_tier: 'silver',
        average_rating: 4.5,
        total_reviews: 2,
        created_at: '2024-03-10T11:45:00Z'
      },
      {
        id: '4',
        guide_id: 'BKK001',
        name_ko: '김방콕',
        phone: '+66-89-123-4567',
        emergency_phone: '+66-89-123-9999',
        email: 'kim.bangkok@email.com',
        guide_type: '전문가이드',
        employment_type: '정규직',
        company_id: '3',
        status: 'active',
        languages: ['한국어', '태국어', '영어'],
        specialties: ['사원투어', '수상시장', '야시장'],
        certification: '태국 관광청 인증 가이드',
        experience_year: 4,
        introduction: '사와디크랍! 방콕에서 4년째 한국분들을 모시고 있는 김방콕입니다.',
        motto: '미소와 친절로 소통하는 여행!',
        is_star_guide: false,
        average_rating: 3.5,
        total_reviews: 2,
        created_at: '2024-03-15T13:20:00Z'
      },
      {
        id: '5',
        guide_id: 'PKT001',
        name_ko: '박푸켓',
        phone: '+66-87-987-6543',
        emergency_phone: '+66-87-987-9999',
        email: 'park.phuket@email.com',
        guide_type: '전문가이드',
        employment_type: '프리랜서',
        company_id: '4',
        status: 'active',
        languages: ['한국어', '태국어', '영어'],
        specialties: ['해양스포츠', '아일랜드호핑', '선셋투어'],
        certification: '태국 해양스포츠 강사',
        experience_year: 6,
        introduction: '푸켓의 바다를 사랑하는 박푸켓입니다!',
        motto: '바다와 함께하는 힐링 여행!',
        is_star_guide: true,
        star_guide_since: '2024-06-25T09:45:00Z',
        star_guide_tier: 'gold',
        average_rating: 4.8,
        total_reviews: 3,
        created_at: '2024-03-20T16:10:00Z'
      }
    ],
  
    // 마스터 상품 데이터
    masterProducts: [
      {
        id: '1',
        product_code: 'JP-TKY-4D5N-001',
        product_name: '일본 도쿄 4박 5일 클래식',
        product_points: '아사쿠사 센소지, 시부야 스카이, 츠키지 시장, 하라주쿠 투어 포함',
        base_price: 450000,
        duration_days: 5,
        destination_country: '일본',
        destination_city: '도쿄',
        description: '도쿄의 대표 명소들을 모두 둘러보는 클래식 코스입니다.',
        included_services: ['왕복 항공료', '호텔 4박', '조식 4회', '전용 차량', '가이드 서비스', '입장료'],
        excluded_services: ['중식/석식', '개인경비', '쇼핑비', '팁'],
        min_participants: 2,
        max_participants: 20,
        upselling_enabled: true,
        upselling_rate: 0.10,
        guide_commission_rate: 0.03,
        company_commission_rate: 0.03,
        ota_commission_rate: 0.04,
        status: 'active',
        created_at: '2024-04-01T09:00:00Z'
      },
      {
        id: '2',
        product_code: 'JP-OSK-3D4N-001',
        product_name: '일본 오사카 3박 4일 미식투어',
        product_points: '도톤보리, 오사카성, 교토 당일치기, 현지 맛집 투어',
        base_price: 380000,
        duration_days: 4,
        destination_country: '일본',
        destination_city: '오사카',
        description: '오사카의 진짜 맛을 찾아가는 미식 여행!',
        included_services: ['왕복 항공료', '호텔 3박', '조식 3회', '미식투어 3회', '가이드 서비스'],
        excluded_services: ['중식/석식 일부', '개인경비', '쇼핑비', '교토 교통비'],
        min_participants: 2,
        max_participants: 15,
        upselling_enabled: true,
        upselling_rate: 0.12,
        guide_commission_rate: 0.04,
        company_commission_rate: 0.04,
        ota_commission_rate: 0.04,
        status: 'active',
        created_at: '2024-04-05T10:30:00Z'
      },
      {
        id: '3',
        product_code: 'TH-BKK-3D4N-001',
        product_name: '태국 방콕 3박 4일 문화탐방',
        product_points: '왓 포, 왓 아룬, 수상시장, 짜뚜짝 주말시장, 태국 전통 마사지',
        base_price: 320000,
        duration_days: 4,
        destination_country: '태국',
        destination_city: '방콕',
        description: '방콕의 깊은 문화를 체험하는 여행입니다.',
        included_services: ['왕복 항공료', '호텔 3박', '조식 3회', '사원 입장료', '보트 투어', '가이드 서비스'],
        excluded_services: ['중식/석식', '개인경비', '마사지비', '쇼핑비'],
        min_participants: 2,
        max_participants: 25,
        upselling_enabled: true,
        upselling_rate: 0.08,
        guide_commission_rate: 0.025,
        company_commission_rate: 0.025,
        ota_commission_rate: 0.03,
        status: 'active',
        created_at: '2024-04-10T11:45:00Z'
      },
      {
        id: '4',
        product_code: 'TH-PKT-4D5N-001',
        product_name: '태국 푸켓 4박 5일 해양 리조트',
        product_points: '피피섬, 제임스본드섬, 코랄섬, 선셋 크루즈, 해양 스포츠',
        base_price: 520000,
        duration_days: 5,
        destination_country: '태국',
        destination_city: '푸켓',
        description: '푸켓의 에메랄드 바다를 만끽하는 힐링 여행!',
        included_services: ['왕복 항공료', '리조트 4박', '조식 4회', '아일랜드 호핑', '스노클링 장비', '가이드 서비스'],
        excluded_services: ['중식/석식', '개인경비', '추가 액티비티', '스파/마사지'],
        min_participants: 2,
        max_participants: 18,
        upselling_enabled: true,
        upselling_rate: 0.15,
        guide_commission_rate: 0.05,
        company_commission_rate: 0.05,
        ota_commission_rate: 0.05,
        status: 'active',
        created_at: '2024-04-15T14:20:00Z'
      }
    ],
  
    // 행사 데이터 (실제 여행 일정)
    events: [
      {
        id: '1',
        event_code: 'JP-TKY-240701',
        master_product_id: '1',
        departure_date: '2024-07-01',
        arrival_date: '2024-07-05',
        departure_airline: '대한항공',
        arrival_airline: '대한항공',
        departure_airport: '인천국제공항',
        arrival_airport: '나리타공항',
        event_price: null, // null이면 마스터 상품 가격 사용
        assigned_guide_id: '1',
        max_capacity: 20,
        current_bookings: 3,
        final_price: 450000, // 업셀링 미적용 (일반가이드)
        status: 'active',
        created_at: '2024-05-01T09:00:00Z'
      },
      {
        id: '2',
        event_code: 'JP-TKY-240715',
        master_product_id: '1',
        departure_date: '2024-07-15',
        arrival_date: '2024-07-19',
        departure_airline: 'JAL',
        arrival_airline: 'JAL',
        departure_airport: '인천국제공항',
        arrival_airport: '하네다공항',
        event_price: 480000, // 성수기 가격
        assigned_guide_id: '2', // 스타가이드
        max_capacity: 20,
        current_bookings: 5,
        final_price: 528000, // 업셀링 적용 (480000 * 1.1)
        status: 'active',
        created_at: '2024-05-05T10:30:00Z'
      },
      {
        id: '3',
        event_code: 'JP-TKY-240801',
        master_product_id: '1',
        departure_date: '2024-08-01',
        arrival_date: '2024-08-05',
        departure_airline: '아시아나항공',
        arrival_airline: '아시아나항공',
        departure_airport: '인천국제공항',
        arrival_airport: '나리타공항',
        event_price: null,
        assigned_guide_id: '1',
        max_capacity: 20,
        current_bookings: 0,
        final_price: 450000,
        status: 'active',
        created_at: '2024-05-10T11:45:00Z'
      },
      {
        id: '4',
        event_code: 'JP-OSK-240710',
        master_product_id: '2',
        departure_date: '2024-07-10',
        arrival_date: '2024-07-13',
        departure_airline: '대한항공',
        arrival_airline: '대한항공',
        departure_airport: '인천국제공항',
        arrival_airport: '간사이공항',
        event_price: null,
        assigned_guide_id: '3', // 스타가이드
        max_capacity: 15,
        current_bookings: 8,
        final_price: 425600, // 업셀링 적용 (380000 * 1.12)
        status: 'active',
        created_at: '2024-05-15T13:20:00Z'
      },
      {
        id: '5',
        event_code: 'TH-BKK-240705',
        master_product_id: '3',
        departure_date: '2024-07-05',
        arrival_date: '2024-07-08',
        departure_airline: '타이항공',
        arrival_airline: '타이항공',
        departure_airport: '인천국제공항',
        arrival_airport: '수완나품공항',
        event_price: null,
        assigned_guide_id: '4', // 일반가이드
        max_capacity: 25,
        current_bookings: 12,
        final_price: 320000, // 업셀링 미적용
        status: 'active',
        created_at: '2024-05-20T14:35:00Z'
      },
      {
        id: '6',
        event_code: 'TH-PKT-240712',
        master_product_id: '4',
        departure_date: '2024-07-12',
        arrival_date: '2024-07-16',
        departure_airline: '타이항공',
        arrival_airline: '타이항공',
        departure_airport: '인천국제공항',
        arrival_airport: '푸켓공항',
        event_price: null,
        assigned_guide_id: '5', // 스타가이드
        max_capacity: 18,
        current_bookings: 10,
        final_price: 598000, // 업셀링 적용 (520000 * 1.15)
        status: 'active',
        created_at: '2024-05-25T16:50:00Z'
      }
    ],
  
    // 예약 데이터 (테스트용)
    bookings: [
      {
        id: '1',
        booking_code: 'BK240701001',
        event_id: '1',
        customer_name: '김고객',
        customer_phone: '010-1234-5678',
        customer_email: 'kim.customer@email.com',
        participants_count: 2,
        total_amount: 900000,
        booking_status: 'completed',
        travel_status: 'completed',
        review_eligible: true,
        review_submitted: false,
        booking_date: '2024-06-01T10:00:00Z',
        travel_completion_date: '2024-07-05T18:00:00Z'
      },
      {
        id: '2',
        booking_code: 'BK240715001',
        event_id: '2',
        customer_name: '박여행',
        customer_phone: '010-2345-6789',
        customer_email: 'park.travel@email.com',
        participants_count: 1,
        total_amount: 528000,
        booking_status: 'completed',
        travel_status: 'completed',
        review_eligible: true,
        review_submitted: true,
        booking_date: '2024-06-10T14:30:00Z',
        travel_completion_date: '2024-07-19T19:30:00Z'
      }
    ],
  
    // 가이드 평가 데이터
    guideRatings: [
      {
        id: '1',
        booking_id: '1',
        guide_id: '1',
        guide_rating: 4,
        guide_review: '정말 친절하시고 도쿄에 대해 많이 알고 계셔서 좋았어요!',
        professionalism_rating: 4,
        communication_rating: 5,
        friendliness_rating: 5,
        punctuality_rating: 4,
        would_recommend: true,
        created_at: '2024-07-06T10:00:00Z'
      },
      {
        id: '2',
        booking_id: '2',
        guide_id: '2',
        guide_rating: 5,
        guide_review: '젊은 감각의 하라주쿠 투어가 정말 재미있었어요!',
        professionalism_rating: 5,
        communication_rating: 5,
        friendliness_rating: 5,
        punctuality_rating: 5,
        would_recommend: true,
        created_at: '2024-07-20T11:30:00Z'
      }
    ],
  
    // 여행 후기 데이터
    reviews: [
      {
        id: '1',
        booking_id: '1',
        event_id: '1',
        guide_id: '1',
        travel_review: '도쿄 4박5일 여행 정말 만족스러웠어요! 호텔도 깨끗하고 위치도 좋았고, 특히 가이드님이 친절해서 편안한 여행이었습니다.',
        review_photos: ['https://example.com/reviews/tokyo1_1.jpg', 'https://example.com/reviews/tokyo1_2.jpg'],
        overall_rating: 4,
        accommodation_rating: 4,
        transportation_rating: 4,
        food_rating: 5,
        is_public: true,
        admin_approved: true,
        created_at: '2024-07-06T15:20:00Z'
      },
      {
        id: '2',
        booking_id: '2',
        event_id: '2',
        guide_id: '2',
        travel_review: '하라주쿠 쇼핑과 트렌드 투어가 정말 재미있었어요! 젊은 가이드님 덕분에 요즘 일본 젊은이들이 좋아하는 곳들을 많이 알게 되었습니다.',
        review_photos: ['https://example.com/reviews/tokyo2_1.jpg'],
        overall_rating: 5,
        accommodation_rating: 5,
        transportation_rating: 4,
        food_rating: 4,
        is_public: true,
        admin_approved: true,
        created_at: '2024-07-20T16:45:00Z'
      }
    ]
  };
  
  // Helper 함수들
  export const mockHelpers = {
    // 가이드별 평균 평점 계산
    calculateGuideAverageRating: (guideId) => {
      const ratings = mockData.guideRatings.filter(r => r.guide_id === guideId);
      if (ratings.length === 0) return 0;
      const sum = ratings.reduce((acc, r) => acc + r.guide_rating, 0);
      return (sum / ratings.length).toFixed(1);
    },
  
    // 랜드사별 가이드 수 계산
    getGuideCountByCompany: (companyId) => {
      return mockData.guides.filter(g => g.company_id === companyId).length;
    },
  
    // 상품별 총 예약 수 계산
    getTotalBookingsByProduct: (productId) => {
      const events = mockData.events.filter(e => e.master_product_id === productId);
      return events.reduce((total, event) => total + event.current_bookings, 0);
    },
  
    // 스타가이드 수 계산
    getStarGuideCount: () => {
      return mockData.guides.filter(g => g.is_star_guide).length;
    },
  
    // 총 매출 계산
    getTotalRevenue: () => {
      return mockData.bookings.reduce((total, booking) => total + booking.total_amount, 0);
    },
  
    // 행사의 최종 가격 계산 (업셀링 적용)
    calculateFinalPrice: (eventId) => {
      const event = mockData.events.find(e => e.id === eventId);
      if (!event) return 0;
  
      const product = mockData.masterProducts.find(p => p.id === event.master_product_id);
      const guide = mockData.guides.find(g => g.id === event.assigned_guide_id);
      
      const basePrice = event.event_price || product.base_price;
      
      if (guide && guide.is_star_guide && product.upselling_enabled) {
        return Math.round(basePrice * (1 + product.upselling_rate));
      }
      
      return basePrice;
    },
  
    // 랜드사 이름 가져오기
    getCompanyName: (companyId) => {
      const company = mockData.landCompanies.find(c => c.id === companyId);
      return company ? company.company_name : '미배정';
    },
  
    // 상품 이름 가져오기
    getProductName: (productId) => {
      const product = mockData.masterProducts.find(p => p.id === productId);
      return product ? product.product_name : '미등록';
    },
  
    // 가이드 이름 가져오기
    getGuideName: (guideId) => {
      const guide = mockData.guides.find(g => g.id === guideId);
      return guide ? guide.name_ko : '미배정';
    },
  
    // 예약률 계산
    getBookingRate: (eventId) => {
      const event = mockData.events.find(e => e.id === eventId);
      if (!event) return 0;
      return Math.round((event.current_bookings / event.max_capacity) * 100);
    }
  };