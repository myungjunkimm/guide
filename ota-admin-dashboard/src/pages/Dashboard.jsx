// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Package, Users, Star, DollarSign, Award, AlertCircle, 
  Building2, MessageSquare, CheckCircle, Clock, Eye 
} from 'lucide-react';

// Supabase 서비스들 import
import masterProductService from '../services/masterProductService.js';
import { guideSupabaseApi } from '../services/guideSupabaseApi.js';
import reviewService from '../services/reviewService.js';
import landCompanyService from '../services/landCompanyService.js';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">로딩 중...</span>
  </div>
);

// 에러 컴포넌트
const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
    <div className="flex">
      <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-2 text-sm text-red-800 underline hover:text-red-600"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  </div>
);

// 통계 카드 컴포넌트
const StatCard = ({ title, value, icon: Icon, color = "blue", subtitle }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg bg-${color}-100 mr-4`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// 최근 후기 카드 컴포넌트
const RecentReviewCard = ({ review }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < (review.guide_rating || 0)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900">
          {review.guide_rating || 0}/5
        </span>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        review.review_status === 'approved' 
          ? 'bg-green-100 text-green-800'
          : review.review_status === 'pending'
          ? 'bg-yellow-100 text-yellow-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {review.review_status === 'approved' ? '승인됨' : 
         review.review_status === 'pending' ? '승인대기' : '거부됨'}
      </span>
    </div>
    
    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
      {review.review_text || '후기 내용이 없습니다.'}
    </p>
    
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>{review.author_name || '익명'}</span>
      <span>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
    </div>
  </div>
);

const Dashboard = ({ onMenuChange }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalGuides: 0,
    starGuides: 0,
    landCompanies: 0,
    totalReviews: 0,
    pendingReviews: 0
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 페이지 이동 핸들러들
  const handleQuickAction = (action) => {
    if (onMenuChange) {
      switch (action) {
        case 'products':
          onMenuChange('master_product');
          break;
        case 'guides':
          onMenuChange('guides');
          break;
        case 'companies':
          onMenuChange('companies');
          break;
        case 'reviews':
          onMenuChange('reviews');
          break;
        default:
          console.log('Unknown action:', action);
      }
    }
  };

  // 대시보드 데이터 로딩
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 대시보드 데이터 로딩 시작...');

      // 1. 마스터 상품 수 조회
      const productsResult = await masterProductService.getAll();
      const totalProducts = productsResult.data?.length || 0;

      // 2. 가이드 수 조회
      const guidesResult = await guideSupabaseApi.getGuides();
      const totalGuides = guidesResult.data?.length || 0;
      const starGuides = guidesResult.data?.filter(guide => guide.is_star_guide).length || 0;

      // 3. 랜드사 수 조회
      const companiesResult = await landCompanyService.getAll();
      const landCompanies = companiesResult.data?.length || 0;

      // 4. 후기 통계 조회 (기본 쿼리로 시작)
      let totalReviews = 0;
      let pendingReviews = 0;
      let recentReviewsData = [];

      try {
        const reviewsResult = await reviewService.testBasicQuery();
        if (reviewsResult.success && reviewsResult.data) {
          totalReviews = reviewsResult.data.length;
          pendingReviews = reviewsResult.data.filter(review => 
            review.review_status === 'pending'
          ).length;
          
          // 최근 후기 5개 (승인된 것만)
          recentReviewsData = reviewsResult.data
            .filter(review => review.review_status === 'approved')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
        }
      } catch (reviewError) {
        console.warn('⚠️ 후기 데이터 로딩 실패:', reviewError);
        // 후기 로딩 실패해도 다른 통계는 표시
      }

      // 통계 업데이트
      setStats({
        totalProducts,
        totalGuides,
        starGuides,
        landCompanies,
        totalReviews,
        pendingReviews
      });

      setRecentReviews(recentReviewsData);

      console.log('✅ 대시보드 데이터 로딩 완료:', {
        totalProducts,
        totalGuides,
        starGuides,
        landCompanies,
        totalReviews,
        pendingReviews
      });

    } catch (error) {
      console.error('❌ 대시보드 데이터 로딩 오류:', error);
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">OTA 여행 관리 시스템 현황</p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="총 상품 수"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
          subtitle="등록된 마스터 상품"
        />
        
        <StatCard
          title="총 가이드 수"
          value={stats.totalGuides}
          icon={Users}
          color="green"
          subtitle="활성 가이드 포함"
        />
        
        <StatCard
          title="스타 가이드"
          value={stats.starGuides}
          icon={Star}
          color="yellow"
          subtitle="우수 등급 가이드"
        />
        
        <StatCard
          title="랜드사 수"
          value={stats.landCompanies}
          icon={Building2}
          color="purple"
          subtitle="협력 랜드사"
        />
        
        <StatCard
          title="총 후기 수"
          value={stats.totalReviews}
          icon={MessageSquare}
          color="indigo"
          subtitle="고객 후기"
        />
        
        <StatCard
          title="승인 대기 후기"
          value={stats.pendingReviews}
          icon={Clock}
          color="orange"
          subtitle="검토 필요"
        />
      </div>

      {/* 최근 후기 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            최근 후기
          </h2>
          <button 
            onClick={() => onMenuChange && onMenuChange('reviews')}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors"
          >
            <Eye className="w-4 h-4 mr-1" />
            전체 보기
          </button>
        </div>

        {recentReviews.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentReviews.map((review) => (
              <RecentReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>최근 등록된 후기가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 빠른 액션 버튼 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('products')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
          >
            <Package className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-900">상품 관리</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('guides')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
          >
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-900">가이드 관리</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('companies')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
          >
            <Building2 className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-900">랜드사 관리</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('reviews')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors group"
          >
            <CheckCircle className="w-6 h-6 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-900">후기 관리</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;