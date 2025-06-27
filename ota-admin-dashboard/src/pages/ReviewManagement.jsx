// src/pages/ReviewManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Search, Filter, CheckCircle, XCircle, 
  Eye, Calendar, User, MapPin, Award, Clock, 
  ThumbsUp, ThumbsDown, AlertCircle, Users, Package
} from 'lucide-react';

// API 서비스 import
import { testConnection } from '../lib/supabase';
import guideSupabaseApi from '../services/guideSupabaseApi';
import masterProductService from '../services/masterProductService';
import eventService from '../services/eventService';

// 상태별 배지 컴포넌트
const StatusBadge = ({ status }) => {
  const configs = {
    pending: { label: '검토 대기', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { label: '승인됨', class: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { label: '거절됨', class: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </span>
  );
};

// 별점 렌더링 컴포넌트
const StarRating = ({ rating, size = 'w-4 h-4' }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-600">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

// 후기 상세 모달 컴포넌트
const ReviewDetailModal = ({ review, isOpen, onClose, onApprove, onReject }) => {
  if (!isOpen || !review) return null;

  const categories = [
    { key: 'professionalism', label: '전문성', icon: Award },
    { key: 'communication', label: '의사소통', icon: MessageSquare },
    { key: 'knowledge', label: '현지 지식', icon: MapPin },
    { key: 'kindness', label: '친절도', icon: ThumbsUp },
    { key: 'punctuality', label: '시간 준수', icon: CheckCircle }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">후기 상세 보기</h2>
              <p className="text-gray-600 mt-1">작성자: {review.author}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={review.status} />
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* 모달 내용 */}
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                상품 정보
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">상품명:</span> <span className="font-medium">{review.masterProduct?.product_name}</span></div>
                <div><span className="text-gray-600">목적지:</span> <span>{review.masterProduct?.destination_country} • {review.masterProduct?.destination_city}</span></div>
                <div><span className="text-gray-600">행사 코드:</span> <span>{review.event?.event_code}</span></div>
                <div><span className="text-gray-600">여행 일정:</span> <span>{review.event?.departure_date} ~ {review.event?.arrival_date}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                가이드 정보
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">가이드명:</span> 
                  <span className="font-medium">{review.guide?.name_ko}</span>
                  {review.guide?.is_star_guide && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      스타가이드
                    </span>
                  )}
                </div>
                <div><span className="text-gray-600">작성자:</span> <span className="font-medium">{review.author}</span></div>
                <div><span className="text-gray-600">회원구분:</span> 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    review.membershipType === 'member' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {review.membershipType === 'member' ? '회원' : '비회원'}
                  </span>
                </div>
                <div><span className="text-gray-600">작성일:</span> <span>{new Date(review.submittedAt).toLocaleString('ko-KR')}</span></div>
              </div>
            </div>
          </div>

          {/* 종합 평점 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              종합 평점
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-yellow-600">
                {review.overallRating.toFixed(1)}
              </div>
              <StarRating rating={review.overallRating} size="w-6 h-6" />
            </div>
          </div>

          {/* 세부 평가 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">세부 평가</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const rating = review.categories?.[category.key] || 0;
                
                return (
                  <div key={category.key} className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{category.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={rating} size="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 후기 내용 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              후기 내용
            </h3>
            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>
          </div>

          {/* 승인/거절 이력 */}
          {(review.reviewedAt || review.reviewedBy) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">검토 이력</h3>
              <div className="text-sm text-gray-600">
                <div>검토자: {review.reviewedBy}</div>
                <div>검토일: {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString('ko-KR') : '-'}</div>
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 - 승인/거절 버튼 */}
        {review.status === 'pending' && (
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
    averageRating: 0
  });

  // 데이터 로딩
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const connected = await testConnection();
      setIsConnected(connected);

      if (connected) {
        // 실제 DB에서 후기 데이터 로드
        // TODO: 후기 API 서비스 구현 필요
        console.log('🔄 실제 DB에서 후기 데이터 로딩 예정');
        setReviews([]);
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          averageRating: 0
        });
      } else {
        // 오프라인 모드 - 빈 데이터
        setReviews([]);
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          averageRating: 0
        });
      }
    } catch (err) {
      console.error('후기 데이터 로딩 실패:', err);
      setError(`데이터 로딩 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 후기 승인
  const handleApprove = async (reviewId) => {
    try {
      setError(null);
      
      // TODO: 실제 승인 API 호출
      console.log('🟢 후기 승인:', reviewId);
      
      // 임시로 상태 업데이트
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              status: 'approved', 
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'admin'
            }
          : review
      ));
      
      setSuccessMessage('후기가 승인되었습니다.');
      setIsModalOpen(false);
      
      // 가이드 평점에 반영하는 로직도 추가 필요
      
    } catch (err) {
      setError(`승인 실패: ${err.message}`);
    }
  };

  // 후기 거절
  const handleReject = async (reviewId) => {
    try {
      setError(null);
      
      // TODO: 실제 거절 API 호출
      console.log('🔴 후기 거절:', reviewId);
      
      // 임시로 상태 업데이트
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              status: 'rejected', 
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'admin'
            }
          : review
      ));
      
      setSuccessMessage('후기가 거절되었습니다.');
      setIsModalOpen(false);
      
    } catch (err) {
      setError(`거절 실패: ${err.message}`);
    }
  };

  // 필터링된 후기 목록
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchTerm || 
      review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.guide?.name_ko.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.masterProduct?.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || review.status === statusFilter;
    const matchesMembership = !membershipFilter || review.membershipType === membershipFilter;
    
    return matchesSearch && matchesStatus && matchesMembership;
  });

  // 초기 데이터 로딩
  useEffect(() => {
    loadReviews();
  }, []);

  // 통계 업데이트
  useEffect(() => {
    const newStats = {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
      averageRating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length)
        : 0
    };
    setStats(newStats);
  }, [reviews]);

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

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 후기</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">검토 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">승인됨</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">거절됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 평점</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.averageRating.toFixed(1)}
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="작성자, 가이드명, 상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">모든 상태</option>
            <option value="pending">검토 대기</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거절됨</option>
          </select>

          <select
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">모든 회원</option>
            <option value="member">회원</option>
            <option value="non-member">비회원</option>
          </select>

          <button
            onClick={loadReviews}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Filter className="w-4 h-4" />
                새로고침
              </>
            )}
          </button>
        </div>
      </div>

      {/* 후기 목록 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        {filteredReviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상품 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가이드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{review.author}</div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                            review.membershipType === 'member' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {review.membershipType === 'member' ? '회원' : '비회원'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {review.masterProduct?.product_name}
                        </div>
                        <div className="text-gray-500">
                          {review.masterProduct?.destination_country} • {review.masterProduct?.destination_city}
                        </div>
                        <div className="text-xs text-gray-400">
                          {review.event?.event_code}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {review.guide?.name_ko}
                        </div>
                        {review.guide?.is_star_guide && (
                          <Star className="w-4 h-4 text-yellow-400 ml-1" />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StarRating rating={review.overallRating} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={review.status} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(review.submittedAt).toLocaleDateString('ko-KR')}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {review.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="승인"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(review.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="거절"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter || membershipFilter 
                ? '검색 결과가 없습니다' 
                : '등록된 후기가 없습니다'
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || membershipFilter 
                ? '다른 검색 조건을 시도해보세요.' 
                : '고객들이 후기를 작성하면 여기에 표시됩니다.'
              }
            </p>
          </div>
        )}

        {/* 연결 상태 표시 */}
        {!isConnected && (
          <div className="border-t p-4 bg-yellow-50">
            <div className="text-center">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                ⚠️ 오프라인 모드 - 실제 데이터베이스 연결 후 사용 가능
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 후기 상세 모달 */}
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