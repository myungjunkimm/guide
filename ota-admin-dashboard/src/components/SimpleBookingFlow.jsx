// src/components/SimpleBookingFlow.jsx
import React, { useState } from 'react';
import { 
  CheckCircle, Star, Send, ArrowLeft, Calendar, 
  MapPin, UserCheck, Heart, MessageSquare, User,
  TrendingUp, Award, ThumbsUp, AlertCircle, Users // 🆕 Users 아이콘 추가
} from 'lucide-react';

// 가이드 후기 작성 컴포넌트
const GuideReviewForm = ({ event, onBack, onComplete }) => {
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
    author: '', // 🆕 작성자 필드 추가
    membershipType: 'member', // 🆕 회원/비회원 선택 (기본값: 회원)
    categories: {
      professionalism: 0,    // 전문성
      communication: 0,      // 의사소통
      knowledge: 0,          // 현지 지식
      kindness: 0,          // 친절도
      punctuality: 0        // 시간 준수
    }
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 카테고리별 평가 항목
  const categories = [
    { key: 'professionalism', label: '전문성', icon: Award, desc: '가이드의 전문 지식과 경험' },
    { key: 'communication', label: '의사소통', icon: MessageSquare, desc: '명확하고 친근한 설명' },
    { key: 'knowledge', label: '현지 지식', icon: MapPin, desc: '현지 문화와 역사 지식' },
    { key: 'kindness', label: '친절도', icon: Heart, desc: '따뜻하고 배려하는 마음' },
    { key: 'punctuality', label: '시간 준수', icon: CheckCircle, desc: '약속 시간과 일정 관리' }
  ];

  // 별점 렌더링 함수
  const renderStars = (rating, onRate, onHover, size = 'w-8 h-8') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRate(star);
            }}
            onMouseEnter={() => onHover && onHover(star)}
            onMouseLeave={() => onHover && onHover(0)}
            className={`${size} transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
    );
  };

  // 전체 평점 계산
  const calculateOverallRating = () => {
    const categoryRatings = Object.values(reviewData.categories);
    const validRatings = categoryRatings.filter(rating => rating > 0);
    return validRatings.length > 0 ? 
      (validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length).toFixed(1) : 0;
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🆕 유효성 검사 강화
    if (!reviewData.author.trim()) {
      alert('작성자 이름을 입력해주세요.');
      return;
    }
    
    if (!reviewData.comment.trim()) {
      alert('후기 내용을 입력해주세요.');
      return;
    }

    const validCategoryRatings = Object.values(reviewData.categories).filter(rating => rating > 0);
    if (validCategoryRatings.length === 0) {
      alert('적어도 하나의 항목에 대한 평가를 해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalReview = {
        ...reviewData,
        overallRating: calculateOverallRating(),
        eventId: event.id,
        guideId: event.guides?.id,
        submittedAt: new Date().toISOString()
      };

      console.log('🎯 후기 제출 완료:', finalReview);
      onComplete(finalReview);
    } catch (error) {
      console.error('후기 제출 실패:', error);
      alert('후기 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              이전으로
            </button>
            <h1 className="text-xl font-bold text-gray-900">가이드 후기 작성</h1>
            <div className="w-20" />
          </div>

          {/* 여행 정보 요약 */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{event.master_products?.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{event.departure_date} ~ {event.arrival_date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>{event.master_products?.destination_country} • {event.master_products?.destination_city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>{event.guides?.name_ko} 가이드</span>
                {event.guides?.is_star_guide && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 🆕 작성자 정보 섹션 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">작성자 정보</h2>
            </div>

            <div className="space-y-6">
              {/* 작성자 이름 입력 */}
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  작성자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="author"
                  value={reviewData.author}
                  onChange={(e) => setReviewData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="이름을 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* 회원/비회원 선택 라디오 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  회원 구분 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="membershipType"
                      value="member"
                      checked={reviewData.membershipType === 'member'}
                      onChange={(e) => setReviewData(prev => ({ ...prev, membershipType: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-blue-600" />
                      회원
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="membershipType"
                      value="guest"
                      checked={reviewData.membershipType === 'guest'}
                      onChange={(e) => setReviewData(prev => ({ ...prev, membershipType: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      <User className="w-4 h-4 text-gray-600" />
                      비회원
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {reviewData.membershipType === 'member' 
                    ? '회원 혜택: 포인트 적립 및 할인 쿠폰 제공' 
                    : '비회원도 후기 작성이 가능합니다'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 가이드 정보 카드 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{event.guides?.name_ko} 가이드</h2>
              {event.guides?.is_star_guide && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-yellow-600 font-medium">스타 가이드</span>
                </div>
              )}
              <p className="text-gray-600 mt-2">이번 여행은 어떠셨나요?</p>
            </div>

            {/* 전체 평점 표시 */}
            <div className="text-center mb-8 p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {calculateOverallRating()}/5.0
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(calculateOverallRating() * 2) / 2, () => {}, null, 'w-6 h-6')}
              </div>
              <p className="text-sm text-gray-600">종합 평점</p>
            </div>
          </div>

          {/* 카테고리별 평가 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">상세 평가</h3>
            <div className="space-y-6">
              {categories.map((category) => {
                const Icon = category.icon;
                const rating = reviewData.categories[category.key];
                
                return (
                  <div key={category.key} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{category.label}</h4>
                          <p className="text-sm text-gray-600">{category.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {rating > 0 ? `${rating}.0` : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      {renderStars(
                        rating,
                        (star) => setReviewData(prev => ({
                          ...prev,
                          categories: { ...prev.categories, [category.key]: star }
                        })),
                        null
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 후기 작성 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">후기 작성</h3>
            </div>

            <div className="space-y-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                가이드와의 여행 경험을 공유해주세요 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="comment"
                rows={6}
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="가이드의 서비스, 현지 지식, 친절도 등에 대한 솔직한 후기를 작성해주세요. 다른 여행자들에게 도움이 되는 구체적인 경험을 공유해주시면 더욱 좋습니다."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                required
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>최소 20자 이상 작성해주세요</span>
                <span>{reviewData.comment.length}/1000</span>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              이전으로
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reviewData.comment.trim() || !reviewData.author.trim()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  후기 제출하기
                </>
              )}
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">후기 작성 안내</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 작성된 후기는 24시간 내에 검토 후 공개됩니다</li>
                  <li>• {reviewData.membershipType === 'member' ? '회원님께는 후기 작성 완료 후 100포인트가 적립됩니다' : '비회원도 후기 작성이 가능하며, 회원 가입 시 더 많은 혜택을 받으실 수 있습니다'}</li>
                  <li>• 허위 정보나 부적절한 내용이 포함된 후기는 삭제될 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// 후기 완료 화면 컴포넌트
const ReviewCompleteScreen = ({ review, event, onGoHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          후기 제출 완료!
        </h1>
        
        <p className="text-gray-600 mb-6">
          소중한 후기를 작성해주셔서 감사합니다.<br />
          다른 여행자들에게 큰 도움이 될 거예요.
        </p>

        {/* 작성된 후기 요약 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-sm text-gray-600">작성자:</span>
              <span className="ml-2 font-medium">{review.author}</span>
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {review.membershipType === 'member' ? '회원' : '비회원'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-600">{review.overallRating}</div>
              <div className="flex justify-end">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(review.overallRating) 
                        ? 'text-yellow-400' : 'text-gray-300'
                    } fill-current`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            "{review.comment.substring(0, 50)}{review.comment.length > 50 ? '...' : ''}"
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              // 가이드의 평점 업데이트 시뮬레이션
              console.log('📊 가이드 평점 업데이트:', {
                guideId: event.guides?.id,
                newRating: review.overallRating,
                reviewCount: '기존 리뷰 수 + 1',
                author: review.author,
                membershipType: review.membershipType
              });
              
              // 회원 포인트 적립 시뮬레이션
              if (review.membershipType === 'member') {
                console.log('🎁 포인트 적립:', {
                  author: review.author,
                  points: 100,
                  reason: '후기 작성 완료'
                });
              }
              
              onGoHome();
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            메인으로 돌아가기
          </button>
          
          <button
            onClick={() => {
              // 추가 후기 작성하기 (다른 여행에 대한)
              alert('다른 여행 후기도 작성해보세요!');
            }}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            다른 후기 작성하기
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          {review.membershipType === 'member' 
            ? '후기는 24시간 내에 검토 후 공개되며, 100포인트가 적립됩니다' 
            : '후기는 24시간 내에 검토 후 공개됩니다'
          }
        </div>
      </div>
    </div>
  );
};

// 메인 플로우 컴포넌트
const SimpleBookingFlow = ({ event, onBack, initialStep = 'booking' }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [reviewData, setReviewData] = useState(null);

  // 예약 완료 핸들러 (바로 후기 작성으로)
  const handleBookingComplete = () => {
    console.log('🎯 예약 완료! 바로 후기 작성으로 이동');
    
    // 예약 현황 +1 업데이트 시뮬레이션
    console.log('📈 예약 현황 업데이트:', {
      eventId: event.id,
      currentBookings: (event.current_bookings || 0) + 1,
      maxCapacity: event.max_capacity
    });
    
    setCurrentStep('review');
  };

  // 후기 작성 완료 핸들러
  const handleReviewComplete = (review) => {
    setReviewData(review);
    setCurrentStep('complete');
  };

  // 메인으로 돌아가기 (최종)
  const handleGoHome = () => {
    onBack();
  };

  // 후기 작성에서 뒤로가기 (초기 단계가 review인 경우 바로 onBack 호출)
  const handleBackFromReview = () => {
    if (initialStep === 'review') {
      onBack();
    } else {
      setCurrentStep('booking');
    }
  };

  // 예약하기 간단 화면
  if (currentStep === 'booking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">여행 예약하기</h2>
            <p className="text-gray-600">선택하신 일정을 예약하시겠어요?</p>
          </div>

          {/* 선택한 일정 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">여행 일정</span>
              <span className="text-sm font-medium">{event.departure_date} ~ {event.arrival_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">목적지</span>
              <span className="text-sm font-medium">{event.master_products?.destination_country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">가이드</span>
              <span className="text-sm font-medium">{event.guides?.name_ko}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-medium">총 비용</span>
              <span className="text-lg font-bold text-blue-600">
                ₩{(event.upselling_enabled ? 
                  event.event_price * (1 + event.upselling_percentage / 100) : 
                  event.event_price
                ).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleBookingComplete}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              예약 확정하기
            </button>
            <button
              onClick={onBack}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              이전으로
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            💡 데모용: 예약 후 바로 가이드 후기 작성 화면으로 이동합니다
          </div>
        </div>
      </div>
    );
  }

  // 후기 작성 화면
  if (currentStep === 'review') {
    return (
      <GuideReviewForm
        event={event}
        onBack={handleBackFromReview}
        onComplete={handleReviewComplete}
      />
    );
  }

  // 완료 화면
  if (currentStep === 'complete') {
    return (
      <ReviewCompleteScreen
        review={reviewData}
        event={event}
        onGoHome={handleGoHome}
      />
    );
  }

  return null;
};

export default SimpleBookingFlow;