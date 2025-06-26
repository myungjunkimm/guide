// src/components/SimpleBookingFlow.jsx
import React, { useState } from 'react';
import { 
  CheckCircle, Star, Send, ArrowLeft, Calendar, 
  MapPin, UserCheck, Heart, MessageSquare, User,
  TrendingUp, Award, ThumbsUp, AlertCircle // 🆕 AlertCircle 추가
} from 'lucide-react';

// 가이드 후기 작성 컴포넌트
const GuideReviewForm = ({ event, onBack, onComplete }) => {
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
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

  // 별점 렌더링 함수 - 🆕 바로 제출 방지
  const renderStars = (rating, onRate, onHover, size = 'w-8 h-8') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button" // 🆕 명시적으로 type="button" 추가 (form submit 방지)
            onClick={(e) => {
              e.preventDefault(); // 🆕 기본 동작 방지
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
    const validRatings = categoryRatings.filter(rating => rating > 0); // 🆕 0점 제외
    return validRatings.length > 0 ? Math.round(validRatings.reduce((acc, rating) => acc + rating, 0) / validRatings.length * 10) / 10 : 0;
  };

  // 🆕 필수 항목 완료 여부 확인
  const checkRequiredCategories = () => {
    const categoryRatings = Object.values(reviewData.categories);
    return categoryRatings.every(rating => rating > 0); // 모든 카테고리가 1점 이상
  };

  // 후기 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 시뮬레이션: API 호출
    await new Promise(resolve => setTimeout(resolve, 1500));

    const finalReview = {
      ...reviewData,
      eventId: event.id,
      guideId: event.guides?.id,
      overallRating: calculateOverallRating(),
      reviewDate: new Date().toISOString(),
      customerInfo: 'Anonymous User' // 실제로는 로그인 정보에서 가져옴
    };

    console.log('💬 제출된 후기:', finalReview);
    
    setIsSubmitting(false);
    onComplete(finalReview);
  };

  const overallRating = calculateOverallRating();
  const requiredCategoriesComplete = checkRequiredCategories(); // 🆕 필수 항목 완료 여부
  const isFormValid = requiredCategoriesComplete; // 🆕 후기 작성은 선택사항으로 변경

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">가이드 후기 작성</h1>
              <p className="text-gray-600 mt-1">즐거운 여행이었다면 가이드에게 후기를 남겨주세요 ⭐</p>
            </div>
          </div>

          {/* 여행 정보 요약 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
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
              {event.guides?.average_rating && (
                <div className="text-sm text-gray-600 mt-1">
                  평균 평점: ⭐ {event.guides.average_rating}/5.0
                </div>
              )}
            </div>
          </div>

          {/* 카테고리별 평가 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">🏆 세부 평가 <span className="text-red-500">*</span></h3>
            <div className="space-y-6">
              {categories.map((category) => {
                const Icon = category.icon;
                const rating = reviewData.categories[category.key];
                
                return (
                  <div key={category.key} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div>
                          <span className="font-medium text-gray-900">
                            {category.label} <span className="text-red-500">*</span> {/* 🆕 필수 표시 */}
                          </span>
                          <p className="text-sm text-gray-500">{category.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(
                          rating,
                          (star) => setReviewData(prev => ({
                            ...prev,
                            categories: { ...prev.categories, [category.key]: star }
                          }))
                        )}
                        <span className="text-sm text-gray-600 ml-2 w-8">
                          {rating > 0 ? `${rating}.0` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 전체 평점 표시 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">전체 평점</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= overallRating ? 'text-yellow-400' : 'text-gray-300'
                        } fill-current`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {overallRating > 0 ? overallRating.toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
              
              {/* 🆕 필수 항목 완료 상태 표시 */}
              <div className="mt-3 text-sm">
                {requiredCategoriesComplete ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>모든 필수 평가 완료</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {5 - Object.values(reviewData.categories).filter(r => r > 0).length}개 항목 평가 필요
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 후기 작성 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💭 후기 작성 <span className="text-gray-500 text-sm font-normal">(선택사항)</span></h3> {/* 🆕 선택사항 표시 */}
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="가이드와 함께한 여행은 어떠셨나요? 다른 여행자들을 위해 솔직한 후기를 남겨주세요. (작성하지 않아도 됩니다)"
              rows="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {reviewData.comment.length}자 {reviewData.comment.length > 0 && '(선택사항 작성중)'}
              </span>
              {reviewData.comment.length > 0 && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  후기 작성됨
                </span>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              이전으로
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  후기 등록중...
                </>
              ) : !requiredCategoriesComplete ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  모든 평가 항목 선택 필요
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  후기 등록하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 완료 페이지 컴포넌트
const ReviewCompleteScreen = ({ review, event, onGoHome }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          후기 등록 완료! 🎉
        </h2>
        
        <p className="text-gray-600 mb-6">
          소중한 후기를 남겨주셔서 감사합니다.<br />
          다른 여행자들에게 큰 도움이 될 거예요!
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg font-bold text-blue-900">평점: {review.overallRating}/5.0</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= review.overallRating ? 'text-yellow-400' : 'text-gray-300'
                  } fill-current`}
                />
              ))}
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
                reviewCount: '기존 리뷰 수 + 1'
              });
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
          후기는 24시간 내에 검토 후 공개됩니다
        </div>
      </div>
    </div>
  );
};

// 메인 플로우 컴포넌트
const SimpleBookingFlow = ({ event, onBack, initialStep = 'booking' }) => {
  const [currentStep, setCurrentStep] = useState(initialStep); // 🆕 초기 단계 설정 가능
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
      onBack(); // 🆕 바로 이전 페이지로
    } else {
      setCurrentStep('booking'); // 기본 플로우에서는 예약 단계로
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
        onBack={handleBackFromReview} // 🆕 수정된 뒤로가기 핸들러 사용
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