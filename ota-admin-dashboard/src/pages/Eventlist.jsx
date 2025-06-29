// src/pages/EventList.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Users, DollarSign, Star, 
  Clock, Plane, UserCheck, TrendingUp, AlertCircle, 
  CheckCircle, XCircle, Heart, MessageSquare, Award, User
} from 'lucide-react';

// API 서비스 import
import eventService from '../services/eventService';
import reviewService from '../services/reviewService'; // 🆕 후기 서비스 추가
import { testConnection } from '../lib/supabase';

// 🆕 예약 플로우 컴포넌트 import
import SimpleBookingFlow from '../components/SimpleBookingFlow.jsx';

// 🆕 후기 미리보기 컴포넌트
const ReviewPreview = ({ reviews, productName }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-gray-500">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">아직 등록된 후기가 없습니다</span>
        </div>
      </div>
    );
  }

  const approvedReviews = reviews.filter(r => r.review_status === 'approved');
  const averageRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum, r) => sum + r.guide_rating, 0) / approvedReviews.length 
    : 0;

  return (
    <div className="mt-4 space-y-3">
      {/* 후기 요약 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{approvedReviews.length}개 후기</span>
              {averageRating > 0 && (
                <>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-sm text-gray-600">{productName} 여행 후기</div>
          </div>
        </div>
      </div>

      {/* 최신 후기 2-3개 미리보기 */}
      <div className="space-y-3">
        {approvedReviews.slice(0, 3).map((review) => (
          <div key={review.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{review.author_name}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  review.membership_type === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {review.membership_type === 'member' ? '회원' : '비회원'}
                </span>
                {review.guide?.is_star_guide && (
                  <Award className="w-4 h-4 text-yellow-500" title="스타가이드" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{review.guide_rating.toFixed(1)}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">
              {review.guide_review}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>가이드: {review.guide?.name_ko}</span>
              <span>{new Date(review.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기 버튼 (필요시) */}
      {approvedReviews.length > 3 && (
        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            후기 {approvedReviews.length - 3}개 더보기 →
          </button>
        </div>
      )}
    </div>
  );
};

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

// 🆕 수정된 행사 카드 컴포넌트 (후기 정보 포함)
const EventCard = ({ event, onEventClick, reviews = [] }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  
  // 예약 가능 여부 계산
  const isBookable = event.status === 'active' && 
                     (event.current_bookings || 0) < event.max_capacity &&
                     new Date(event.departure_date) > new Date();

  // 최종 가격 계산
  const finalPrice = event.upselling_enabled && event.upselling_percentage 
    ? event.event_price * (1 + event.upselling_percentage / 100)
    : event.event_price;

  // 🆕 이 행사의 후기들 (승인된 것만)
  const eventReviews = reviews.filter(r => 
    r.event_id === event.id && r.review_status === 'approved'
  );

  // 🆕 후기 통계
  const reviewStats = {
    count: eventReviews.length,
    average: eventReviews.length > 0 
      ? eventReviews.reduce((sum, r) => sum + r.guide_rating, 0) / eventReviews.length 
      : 0
  };

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
          
          {/* 찜하기 + 후기 아이콘 */}
          <div className="flex gap-2">
            {/* 🆕 후기 아이콘 및 개수 */}
            {reviewStats.count > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full">
                <MessageSquare className="w-4 h-4 text-white" />
                <span className="text-xs font-medium text-white">{reviewStats.count}</span>
              </div>
            )}
            
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
        {/* 🆕 후기 요약 정보 */}
        {reviewStats.count > 0 && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-bold text-gray-900">{reviewStats.average.toFixed(1)}</span>
            </div>
            <div className="text-sm text-gray-600">
              {reviewStats.count}개 후기
            </div>
          </div>
        )}

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

        {/* 🆕 행사별 후기 미리보기 (최근 1-2개만) */}
        {eventReviews.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">이 일정 후기</span>
              </div>
              
              {eventReviews.slice(0, 2).map((review) => (
                <div key={review.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{review.author_name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs font-medium">{review.guide_rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-xs leading-relaxed">{review.guide_review}</p>
                </div>
              ))}
              
              {eventReviews.length > 2 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-blue-600 font-medium">후기 {eventReviews.length - 2}개 더보기</span>
                </div>
              )}
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
  const [reviews, setReviews] = useState([]); // 🆕 후기 상태 추가
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [sortBy, setSortBy] = useState('departure_date'); // 정렬 기준
  
  // 🆕 현재 뷰에 따라 다른 컴포넌트 표시
  const [viewState, setViewState] = useState('list'); // 'list' | 'review'
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 🆕 후기 데이터 로딩
  const loadReviews = async () => {
    try {
      console.log('🔍 후기 데이터 로딩 시작...', masterProduct?.id);
      
      if (masterProduct?.id) {
        const result = await reviewService.getReviewsByMasterProduct(masterProduct.id);
        if (result.success) {
          setReviews(result.data || []);
          console.log('✅ 후기 데이터 로딩 성공:', result.data.length, '건');
          console.log('후기 샘플:', result.data.slice(0, 2));
        } else {
          console.warn('⚠️ 후기 데이터 로딩 실패:', result.error);
          setReviews([]);
        }
      } else {
        console.warn('⚠️ masterProduct.id가 없습니다');
        setReviews([]);
      }
    } catch (error) {
      console.error('❌ 후기 데이터 로딩 오류:', error);
      setReviews([]);
    }
  };

  // 이벤트 데이터 로딩
  const loadEvents = async () => {
    try {
      setLoading(true);
      
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (connected && masterProduct?.id) {
        // 특정 마스터 상품의 행사들만 조회
        const result = await eventService.getByMasterProduct(masterProduct.id, {
          future_only: false // 과거 일정도 포함
        });
        
        if (result.error) {
          console.error('❌ 행사 로딩 실패:', result.error);
        } else {
          setEvents(result.data || []);
          console.log('✅ 행사 데이터 로딩 성공:', result.data.length, '건');
        }

        // 🆕 후기 데이터도 함께 로딩
        await loadReviews();
      } else {
        console.log('🔄 DB 연결 실패 - 더미 데이터 사용');
        
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
          }
        ];
        setEvents(dummyEvents);
        
        // 더미 후기 데이터도 추가
        const dummyReviews = [
          {
            id: 'review1',
            event_id: '1',
            guide_id: '1',
            author_name: '홍길동',
            membership_type: 'member',
            guide_rating: 5,
            guide_review: '정말 멋진 여행이었습니다! 김가이드님이 너무 친절하시고 현지 문화에 대해 자세히 설명해주셔서 많이 배웠어요.',
            review_status: 'approved',
            created_at: '2025-06-20T10:00:00Z',
            guide: {
              id: '1',
              name_ko: '김가이드',
              is_star_guide: true
            }
          },
          {
            id: 'review2',
            event_id: '1',
            guide_id: '1',
            author_name: '김철수',
            membership_type: 'non_member',
            guide_rating: 4.5,
            guide_review: '가이드님이 전문적이고 시간도 잘 지켜주셔서 좋았습니다. 다음에도 이용하고 싶어요.',
            review_status: 'approved',
            created_at: '2025-06-15T14:30:00Z',
            guide: {
              id: '1',
              name_ko: '김가이드',
              is_star_guide: true
            }
          }
        ];
        setReviews(dummyReviews);
      }
    } catch (err) {
      console.error('❌ 데이터 로딩 중 오류:', err);
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

  // 이벤트 클릭 핸들러
  const handleEventClick = (event) => {
    console.log('🎯 행사 선택:', event);
    setSelectedEvent(event);
    setViewState('review');
  };

  // 후기 작성 완료 핸들러
  const handleReviewComplete = () => {
    setViewState('list');
    setSelectedEvent(null);
    // 후기 데이터 새로고침
    loadReviews();
  };

  if (loading) return <LoadingSpinner />;

  // 🆕 후기 작성 화면 표시
  if (viewState === 'review' && selectedEvent) {
    return (
      <SimpleBookingFlow
        event={selectedEvent}
        onBack={() => setViewState('list')}
        onComplete={handleReviewComplete}
      />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {/* 🆕 후기 통계 추가 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {reviews.filter(r => r.review_status === 'approved').length}개
                </div>
                <div className="text-sm text-gray-600">고객 후기</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 🆕 전체 상품 후기 미리보기 (상단에 표시) */}
        {reviews.length > 0 && (
          <div className="mb-8">
            <ReviewPreview 
              reviews={reviews} 
              productName={masterProduct?.product_name}
            />
          </div>
        )}

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
                reviews={reviews} // 🆕 후기 데이터 전달
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
              ⚠️ 오프라인 모드 - 샘플 데이터가 표시됩니다 (더미 후기 {reviews.length}개 포함)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;