// src/pages/EventList.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Users, DollarSign, Star, 
  Clock, Plane, UserCheck, TrendingUp, AlertCircle, 
  CheckCircle, XCircle, Heart
} from 'lucide-react';

// API 서비스 import
import eventService from '../services/eventService';
import { testConnection } from '../lib/supabase';

// 🆕 예약 플로우 컴포넌트 import
import SimpleBookingFlow from '../components/SimpleBookingFlow.jsx';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">행사 일정을 불러오는 중...</span>
  </div>
);

// 행사 상태 배지
const StatusBadge = ({ status, currentBookings, maxCapacity }) => {
  const getStatusConfig = () => {
    if (status === 'cancelled') {
      return { label: '취소됨', class: 'bg-red-100 text-red-800', icon: XCircle };
    }
    if (status === 'full' || currentBookings >= maxCapacity) {
      return { label: '마감', class: 'bg-blue-100 text-blue-800', icon: CheckCircle };
    }
    if (status === 'inactive') {
      return { label: '비활성', class: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    }
    return { label: '모집중', class: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </span>
  );
};

// 행사 카드 컴포넌트
const EventCard = ({ event, onEventClick }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  
  // 예약 가능 여부 계산
  const isBookable = event.status === 'active' && 
                     (event.current_bookings || 0) < event.max_capacity &&
                     new Date(event.departure_date) > new Date();

  // 최종 가격 계산
  const finalPrice = event.upselling_enabled && event.upselling_percentage 
    ? event.event_price * (1 + event.upselling_percentage / 100)
    : event.event_price;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200">
      {/* 헤더 - 날짜와 상태 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {event.departure_date} ~ {event.arrival_date}
              </span>
            </div>
            <div className="text-blue-100 text-sm">
              행사코드: {event.event_code}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorited(!isFavorited);
            }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorited ? 'text-red-300 fill-current' : 'text-white'}`}
            />
          </button>
        </div>

        <div className="flex justify-between items-end">
          <StatusBadge 
            status={event.status} 
            currentBookings={event.current_bookings}
            maxCapacity={event.max_capacity}
          />
          
          {event.master_products?.is_star_guide_product && (
            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              스타가이드
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="p-6 space-y-4">
        {/* 항공편 정보 */}
        {(event.departure_airline || event.arrival_airline) && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Plane className="w-4 h-4 text-blue-500" />
            <div>
              {event.departure_airline && (
                <span>출발: {event.departure_airline}</span>
              )}
              {event.departure_airline && event.arrival_airline && (
                <span className="mx-2">•</span>
              )}
              {event.arrival_airline && (
                <span>귀국: {event.arrival_airline}</span>
              )}
            </div>
          </div>
        )}

        {/* 가이드 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserCheck className="w-4 h-4 text-green-500" />
            {event.guides ? (
              <div className="flex items-center gap-1">
                <span>{event.guides.name_ko}</span>
                {event.guides.is_star_guide && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
                {event.guides.average_rating && (
                  <span className="text-yellow-600 font-medium">
                    ★{event.guides.average_rating}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400">가이드 미배정</span>
            )}
          </div>
        </div>

        {/* 예약 현황 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-purple-500" />
              <span>예약 현황</span>
            </div>
            <span className="font-medium">
              {event.current_bookings || 0} / {event.max_capacity}명
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, ((event.current_bookings || 0) / event.max_capacity) * 100)}%` 
              }}
            ></div>
          </div>
          
          <div className="text-xs text-gray-500">
            {event.max_capacity - (event.current_bookings || 0)}석 남음
          </div>
        </div>

        {/* 가격 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">여행 비용</span>
            {event.upselling_enabled && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                특가 혜택
              </span>
            )}
          </div>
          
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">
              ₩{Math.round(finalPrice).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">/ 1인</div>
          </div>
          
          {event.upselling_enabled && finalPrice > event.event_price && (
            <div className="text-xs text-gray-500 mt-1">
              기본가: ₩{event.event_price.toLocaleString()} 
              (+{event.upselling_percentage}% 특가혜택)
            </div>
          )}
        </div>

        {/* 관리자 메모 */}
        {event.admin_notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <strong>📝 특이사항:</strong> {event.admin_notes}
            </div>
          </div>
        )}

        {/* 예약 버튼 */}
        <button
          onClick={() => onEventClick(event)}
          disabled={!isBookable}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isBookable
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!isBookable ? (
            event.status === 'cancelled' ? '취소된 일정' :
            (event.current_bookings >= event.max_capacity) ? '예약 마감' :
            new Date(event.departure_date) <= new Date() ? '출발 완료' : '예약 불가'
          ) : (
            '예약하기 → 후기작성' // 🆕 버튼 텍스트 변경
          )}
        </button>
      </div>
    </div>
  );
};

// 메인 컴포넌트
const EventList = ({ masterProduct, onBack, onEventSelect }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [sortBy, setSortBy] = useState('departure_date'); // 정렬 기준
  
  // 🆕 현재 뷰에 따라 다른 컴포넌트 표시
  const [viewState, setViewState] = useState('list'); // 'list' | 'review'
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 이벤트 데이터 로딩
  const loadEvents = async () => {
    try {
      setLoading(true);
      
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (connected && masterProduct?.id) {
        // 🆕 특정 마스터 상품의 행사들만 조회하는 새로운 메서드 사용
        const result = await eventService.getByMasterProduct(masterProduct.id, {
          future_only: false // 과거 일정도 포함
        });
        
        if (result.error) {
          console.error('행사 로딩 실패:', result.error);
        } else {
          setEvents(result.data || []);
        }
      } else {
        // DB 연결 실패 시 더미 데이터
        const dummyEvents = [
          {
            id: '1',
            event_code: `${masterProduct?.product_code || 'DEMO'}-250715`,
            departure_date: '2025-07-15',
            arrival_date: '2025-07-18',
            departure_airline: 'KE123',
            arrival_airline: 'KE124',
            event_price: masterProduct?.base_price || 890000,
            max_capacity: 20,
            current_bookings: 12,
            status: 'active',
            upselling_enabled: true,
            upselling_percentage: 20,
            admin_notes: '성수기 일정입니다. 조기 마감 예상됩니다.',
            master_products: masterProduct,
            guides: {
              id: '1',
              name_ko: '김가이드',
              is_star_guide: true,
              average_rating: 4.8
            }
          },
          {
            id: '2',
            event_code: `${masterProduct?.product_code || 'DEMO'}-250805`,
            departure_date: '2025-08-05',
            arrival_date: '2025-08-08',
            departure_airline: 'OZ101',
            arrival_airline: 'OZ102',
            event_price: masterProduct?.base_price || 890000,
            max_capacity: 20,
            current_bookings: 8,
            status: 'active',
            upselling_enabled: false,
            admin_notes: null,
            master_products: masterProduct,
            guides: {
              id: '2',
              name_ko: '박가이드',
              is_star_guide: false,
              average_rating: 4.5
            }
          },
          {
            id: '3',
            event_code: `${masterProduct?.product_code || 'DEMO'}-250820`,
            departure_date: '2025-08-20',
            arrival_date: '2025-08-23',
            departure_airline: 'LJ201',
            arrival_airline: 'LJ202',
            event_price: masterProduct?.base_price || 890000,
            max_capacity: 15,
            current_bookings: 15,
            status: 'full',
            upselling_enabled: true,
            upselling_percentage: 15,
            master_products: masterProduct,
            guides: {
              id: '3',
              name_ko: '이가이드',
              is_star_guide: true,
              average_rating: 4.9
            }
          }
        ];
        setEvents(dummyEvents);
      }
    } catch (err) {
      console.error('데이터 로딩 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 정렬된 이벤트 목록
  const sortedEvents = [...events].sort((a, b) => {
    switch (sortBy) {
      case 'departure_date':
        return new Date(a.departure_date) - new Date(b.departure_date);
      case 'price':
        const priceA = a.upselling_enabled ? a.event_price * (1 + a.upselling_percentage / 100) : a.event_price;
        const priceB = b.upselling_enabled ? b.event_price * (1 + b.upselling_percentage / 100) : b.event_price;
        return priceA - priceB;
      case 'availability':
        const availA = a.max_capacity - (a.current_bookings || 0);
        const availB = b.max_capacity - (b.current_bookings || 0);
        return availB - availA; // 남은 자리가 많은 순
      default:
        return 0;
    }
  });

  // 초기 데이터 로딩
  useEffect(() => {
    loadEvents();
  }, [masterProduct]);

  // 행사 선택 핸들러 - 바로 후기 작성으로 이동
  const handleEventClick = (event) => {
    console.log('🎯 행사 선택:', event);
    console.log('📈 예약 현황 자동 +1 업데이트 (시뮬레이션)');
    console.log('⚡ 예약 완료! 바로 후기 작성 페이지로 이동');
    
    // 예약 현황 업데이트 시뮬레이션
    console.log('💾 업데이트 데이터:', {
      eventId: event.id,
      currentBookings: (event.current_bookings || 0) + 1,
      maxCapacity: event.max_capacity,
      bookingDate: new Date().toISOString()
    });
    
    setSelectedEvent(event);
    setViewState('review'); // 🆕 바로 후기 작성으로 변경
  };

  // 후기 작성에서 뒤로가기
  const handleBackFromReview = () => {
    setViewState('list');
    setSelectedEvent(null);
  };

  if (loading) return <LoadingSpinner />;

  // 🆕 후기 작성 화면 표시
  if (viewState === 'review' && selectedEvent) {
    // SimpleBookingFlow에서 GuideReviewForm 부분만 사용
    const GuideReviewForm = SimpleBookingFlow.GuideReviewForm || SimpleBookingFlow;
    
    return (
      <div>
        {/* GuideReviewForm을 직접 렌더링하는 대신 SimpleBookingFlow를 review 단계로 시작 */}
        <SimpleBookingFlow
          event={selectedEvent}
          onBack={handleBackFromReview}
          initialStep="review" // 🆕 초기 단계를 후기 작성으로 설정
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {masterProduct?.product_name} 일정
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {masterProduct?.destination_country} • {masterProduct?.destination_city}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {masterProduct?.duration_days}일 {masterProduct?.duration_nights}박
                </div>
              </div>
            </div>
          </div>

          {/* 상품 정보 요약 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₩{masterProduct?.base_price?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">기본 가격</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {events.length}개
                </div>
                <div className="text-sm text-gray-600">출발 일정</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.status === 'active' && (e.current_bookings || 0) < e.max_capacity).length}개
                </div>
                <div className="text-sm text-gray-600">예약 가능</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 정렬 옵션 */}
        {events.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-600">
              총 {events.length}개의 출발 일정
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="departure_date">출발일 순</option>
              <option value="price">가격 순</option>
              <option value="availability">예약 가능 순</option>
            </select>
          </div>
        )}

        {/* 행사 목록 */}
        {sortedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEventClick={handleEventClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              등록된 출발 일정이 없습니다
            </h3>
            <p className="text-gray-600">
              이 상품의 출발 일정이 곧 등록될 예정입니다.
            </p>
          </div>
        )}

        {/* 연결 상태 표시 */}
        {!isConnected && (
          <div className="mt-8 text-center">
            <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">
              ⚠️ 오프라인 모드 - 샘플 데이터가 표시됩니다
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;