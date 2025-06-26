// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Package, Users, Star, DollarSign, Award, AlertCircle } from 'lucide-react';
import mockApiService from '../services/mockApi.js';

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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [starGuides, setStarGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResult, productsResult, guidesResult] = await Promise.all([
        mockApiService.getDashboardStats(),
        mockApiService.getPopularProducts(),
        mockApiService.getStarGuides()
      ]);

      setStats(statsResult.data);
      setPopularProducts(productsResult.data);
      setStarGuides(guidesResult.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
      
      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 상품 수</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 가이드 수</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalGuides || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">스타가이드</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.starGuides || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-2xl font-bold text-gray-900">
                ₩{(stats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">스타가이드 현황</h3>
          <div className="space-y-3">
            {starGuides.slice(0, 5).map((guide) => (
              <div key={guide.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <span className="font-medium">{guide.name_ko}</span>
                    <p className="text-xs text-gray-500">{guide.company?.company_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">평점 {guide.average_rating}</span>
                  <p className="text-xs text-gray-500">{guide.total_reviews}개 후기</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">인기 상품</h3>
          <div className="space-y-3">
            {popularProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <span className="font-medium">{product.product_name}</span>
                  <p className="text-xs text-gray-500">₩{product.base_price?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600">{product.totalBookings}건 예약</span>
                  <p className="text-xs text-gray-500">{product.events?.length}개 행사</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;