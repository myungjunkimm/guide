// src/pages/ReviewManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, Filter, Eye, CheckCircle, XCircle, 
  Star, User, Calendar, MapPin, AlertCircle, MoreVertical,
  Clock, Users, Award, Trash2
} from 'lucide-react';

// 🆕 실제 후기 서비스 import
import reviewService from '../services/reviewService';

// 데이터베이스 연결 테스트 함수
const testConnection = async () => {
  try {
    const result = await reviewService.getReviewStats();
    return result.success;
  } catch (error) {
    console.error('DB 연결 테스트 실패:', error);
    return false;
  }
};

// 후기 상세보기 모달 컴포넌트
const ReviewDetailModal = ({ review, isOpen, onClose, onApprove, onReject }) => {
  if (!isOpen || !review) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">후기 상세보기</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              review.review_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              review.review_status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {review.review_status === 'pending' ? '승인 대기' :
               review.review_status === 'approved' ? '승인됨' : '거절됨'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            ✕
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">작성자</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{review.author_name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    review.membership_type === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {review.membership_type === 'member' ? '회원' : '비회원'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">가이드</label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{review.guide?.name_ko}</span>
                  {review.guide?.is_star_guide && (
                    <Award className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">여행 상품</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {review.event?.master_products?.product_name}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">여행 일정</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {formatDate(review.event?.departure_date)} ~ {formatDate(review.event?.arrival_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">전체 평점</label>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(review.guide_rating)}
                  <span className="text-lg font-semibold text-gray-900">
                    {review.guide_rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">작성일</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(review.created_at)}</span>
                </div>
              </div>

              {review.reviewed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">검토일</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(review.reviewed_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 후기 내용 */}
          <div>
            <label className="text-sm font-medium text-gray-500">후기 내용</label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{review.guide_review}</p>
            </div>
          </div>

          {/* 세부 평가 항목 */}
          {review.detailed_ratings && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-3 block">세부 평가</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(review.detailed_ratings).map(([key, rating]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {key === 'professionalism' ? '전문성' :
                       key === 'communication' ? '의사소통' :
                       key === 'knowledge' ? '현지 지식' :
                       key === 'kindness' ? '친절도' :
                       key === 'punctuality' ? '시간 준수' : key}
                    </span>
                    <div className="flex items-center gap-2">
                      {renderStars(rating)}
                      <span className="text-sm font-semibold">{rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 거절 사유 (거절된 경우) */}
          {review.review_status === 'rejected' && review.rejection_reason && (
            <div>
              <label className="text-sm font-medium text-gray-500">거절 사유</label>
              <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{review.rejection_reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 - 승인/거절 버튼 */}
        {review.review_status === 'pending' && (
          <div className="sticky bottom-0 bg-white border-t p-6">
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => onReject(review.id)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                거절
              </button>
              <button
                onClick={() => onApprove(review.id)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                승인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 메인 후기 관리 컴포넌트
const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 통계 상태
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    members: 0,
    nonMembers: 0,
    averageRating: 0
  });

  // 🆕 디버깅이 포함된 실제 데이터 로딩 함수
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const connected = await testConnection();
      setIsConnected(connected);

      if (connected) {
        console.log('🔍 DB 연결 확인 완료, 후기 데이터 로딩 시작...');

        // 1단계: 기본 쿼리 테스트
        const basicTest = await reviewService.testBasicQuery();
        console.log('1단계 - 기본 쿼리 테스트:', basicTest);

        if (!basicTest.success) {
          throw new Error(`기본 쿼리 실패: ${basicTest.error}`);
        }

        // 2단계: JOIN 쿼리 테스트
        const joinTest = await reviewService.testJoinQueries();
        console.log('2단계 - JOIN 쿼리 테스트:', joinTest);

        // 3단계: 실제 데이터 로드 (단순화 버전 먼저 시도)
        console.log('3단계 - 단순화 버전으로 데이터 로드 시도...');
        let reviewsResult = await reviewService.getAllReviews({
          limit: 100,
          offset: 0
        });

        // 단순화 버전이 실패하면 원래 방식 시도
        if (!reviewsResult.success) {
          console.log('🔄 단순화 버전 실패, 원래 방식 시도...');
          reviewsResult = await reviewService.getAllReviewsOriginal({
            limit: 100,
            offset: 0
          });
        }

        if (reviewsResult.success) {
          setReviews(reviewsResult.data);
          console.log('✅ 후기 데이터 로딩 성공:', reviewsResult.data.length, '건');
          console.log('샘플 데이터:', reviewsResult.data[0]);
        } else {
          throw new Error(reviewsResult.error);
        }

        // 통계 데이터 로드
        console.log('4단계 - 통계 데이터 로드...');
        const statsResult = await reviewService.getReviewStats();
        if (statsResult.success) {
          setStats(statsResult.data);
          console.log('✅ 통계 데이터 로딩 성공:', statsResult.data);
        } else {
          console.warn('⚠️ 통계 데이터 로딩 실패:', statsResult.error);
          // 통계 실패해도 계속 진행
        }
      } else {
        // 오프라인 모드
        setReviews([]);
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          members: 0,
          nonMembers: 0,
          averageRating: 0
        });
        console.warn('⚠️ DB 연결 실패 - 오프라인 모드');
      }
    } catch (err) {
      console.error('❌ 후기 데이터 로딩 실패:', err);
      setError(`데이터 로딩 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 실제 후기 승인 함수
  const handleApprove = async (reviewId) => {
    try {
      setError(null);
      
      const result = await reviewService.approveReview(reviewId, 'admin');
      
      if (result.success) {
        // 로컬 상태 업데이트
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                review_status: 'approved', 
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'admin'
              }
            : review
        ));
        
        setSuccessMessage('후기가 승인되었습니다.');
        setIsModalOpen(false);
        
        // 통계 새로고침
        const statsResult = await reviewService.getReviewStats();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
        
        console.log('✅ 후기 승인 성공:', reviewId);
      } else {
        throw new Error(result.error);
      }
      
    } catch (err) {
      console.error('❌ 후기 승인 실패:', err);
      setError(`승인 실패: ${err.message}`);
    }
  };

  // 🆕 실제 후기 거절 함수
  const handleReject = async (reviewId) => {
    try {
      setError(null);
      
      const reason = prompt('거절 사유를 입력해주세요 (선택사항):');
      
      const result = await reviewService.rejectReview(reviewId, 'admin', reason || '');
      
      if (result.success) {
        // 로컬 상태 업데이트
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                review_status: 'rejected', 
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'admin',
                rejection_reason: reason || ''
              }
            : review
        ));
        
        setSuccessMessage('후기가 거절되었습니다.');
        setIsModalOpen(false);
        
        // 통계 새로고침
        const statsResult = await reviewService.getReviewStats();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
        
        console.log('✅ 후기 거절 성공:', reviewId);
      } else {
        throw new Error(result.error);
      }
      
    } catch (err) {
      console.error('❌ 후기 거절 실패:', err);
      setError(`거절 실패: ${err.message}`);
    }
  };

  // 필터링된 후기 목록
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchTerm || 
      review.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.guide?.name_ko?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.event?.master_products?.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || review.review_status === statusFilter;
    const matchesMembership = !membershipFilter || review.membership_type === membershipFilter;
    
    return matchesSearch && matchesStatus && matchesMembership;
  });

  // 초기 데이터 로딩
  useEffect(() => {
    loadReviews();
  }, []);

  // 메시지 자동 숨김
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">후기 데이터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">후기 관리</h1>
            <p className="text-gray-600">고객 후기를 검토하고 승인/거절할 수 있습니다</p>
          </div>
        </div>

        {/* 연결 상태 표시 */}
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          isConnected ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-medium">
            {isConnected ? 'DB 연결됨' : 'DB 연결 안됨 (오프라인 모드)'}
          </span>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">전체 후기</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">승인됨</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">거절됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">회원</p>
              <p className="text-2xl font-bold text-blue-600">{stats.members}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">비회원</p>
              <p className="text-2xl font-bold text-gray-600">{stats.nonMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">평균 평점</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="작성자, 가이드명, 상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">모든 상태</option>
            <option value="pending">승인 대기</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거절됨</option>
          </select>

          {/* 회원 타입 필터 */}
          <select
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">회원/비회원</option>
            <option value="member">회원</option>
            <option value="non_member">비회원</option>
          </select>

          {/* 새로고침 버튼 */}
          <button
            onClick={loadReviews}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 후기 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter || membershipFilter ? '검색 결과가 없습니다' : '등록된 후기가 없습니다'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || membershipFilter 
                ? '검색 조건을 변경해보세요' 
                : '고객이 후기를 작성하면 여기에 표시됩니다'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{review.author_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        review.membership_type === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {review.membership_type === 'member' ? '회원' : '비회원'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        review.review_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        review.review_status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.review_status === 'pending' ? '승인 대기' :
                         review.review_status === 'approved' ? '승인됨' : '거절됨'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>가이드: {review.guide?.name_ko}</span>
                      <span>상품: {review.event?.master_products?.product_name}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{review.guide_rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 line-clamp-2">{review.guide_review}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span>작성: {new Date(review.created_at).toLocaleDateString('ko-KR')}</span>
                      {review.reviewed_at && (
                        <span>검토: {new Date(review.reviewed_at).toLocaleDateString('ko-KR')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      상세보기
                    </button>

                    {review.review_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          거절
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 후기 상세보기 모달 */}
      <ReviewDetailModal
        review={selectedReview}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReview(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default ReviewManagement;