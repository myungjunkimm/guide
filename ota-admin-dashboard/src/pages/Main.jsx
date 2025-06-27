// src/pages/Main.jsx (사용자용 메인 페이지) - 후기 아이콘 추가
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Users, DollarSign, Star, Calendar, 
  TrendingUp, ArrowRight, Heart, Filter, Search, MessageSquare
} from 'lucide-react';

// API 서비스 import
import masterProductService from '../services/masterProductService';
import reviewService from '../services/reviewService'; // 🆕 후기 서비스 추가
import { testConnection } from '../lib/supabase';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">상품을 불러오는 중...</span>
  </div>
);

// 🆕 수정된 상품 카드 컴포넌트 (후기 정보 포함)
const ProductCard = ({ product, onProductClick, reviewStats = null }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div 
      onClick={() => onProductClick(product)}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
    >
      {/* 상품 이미지 */}
      <div className="relative h-64 overflow-hidden">
        {product.product_images && product.product_images.length > 0 ? (
          <img
            src={product.product_images[0]}
            alt={product.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* 우상단 아이콘들 */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* 🆕 후기 아이콘 및 개수 */}
          {reviewStats && reviewStats.count > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-white/90 rounded-full shadow-sm">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{reviewStats.count}</span>
              {reviewStats.averageRating > 0 && (
                <>
                  <Star className="w-4 h-4 text-yellow-400 fill-current ml-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          )}
          
          {/* 찜하기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorited(!isFavorited);
            }}
            className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
            />
          </button>
        </div>

        {/* 스타가이드 배지 */}
        {product.is_star_guide_product && (
          <div className="absolute top-4 left-4">
            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              스타가이드
            </div>
          </div>
        )}

        {/* 특가 혜택 배지 */}
        {product.upselling_enabled && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              특가 혜택
            </div>
          </div>
        )}
      </div>

      {/* 카드 내용 */}
      <div className="p-6">
        {/* 상품명 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {product.product_name}
        </h3>

        {/* 목적지 정보 */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">
            {product.destination_country} · {product.destination_city}
          </span>
        </div>

        {/* 🆕 후기 요약 (카드 내부에도 표시) */}
        {reviewStats && reviewStats.count > 0 && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-bold text-gray-900">{reviewStats.averageRating.toFixed(1)}</span>
            </div>
            <div className="text-sm text-gray-600">
              {reviewStats.count}개 후기
            </div>
          </div>
        )}

        {/* 여행 정보 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {product.duration_days}일 {product.duration_nights}박
            </span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm">
              최대 {product.max_participants}명
            </span>
          </div>
        </div>

        {/* 가격 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              ₩{product.base_price?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">1인 기준</div>
          </div>
          {product.upselling_enabled && (
            <div className="text-right">
              <div className="text-sm text-green-600 font-medium">
                특가 혜택 가능
              </div>
              <div className="text-xs text-gray-500">
                추가 옵션 상품 판매
              </div>
            </div>
          )}
        </div>

        {/* 설명 */}
        {product.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* 상품 코드 */}
        <div className="text-xs text-gray-400 mb-4">
          상품코드: {product.product_code}
        </div>

        {/* 버튼 */}
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-700">
          <span>일정 보기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// 필터 컴포넌트
const FilterSection = ({ filters, onFilterChange, countries }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Filter className="w-5 h-5" />
        여행 상품 검색
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 검색어 */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="상품명, 목적지로 검색..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 국가 필터 */}
        <select
          value={filters.country}
          onChange={(e) => onFilterChange({ ...filters, country: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 국가</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        {/* 기간 필터 */}
        <select
          value={filters.duration}
          onChange={(e) => onFilterChange({ ...filters, duration: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 기간</option>
          <option value="1-3">1-3일</option>
          <option value="4-6">4-6일</option>
          <option value="7+">7일 이상</option>
        </select>

        {/* 특성 필터 */}
        <select
          value={filters.special}
          onChange={(e) => onFilterChange({ ...filters, special: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 상품</option>
          <option value="star_guide">스타가이드</option>
          <option value="upselling">특가 혜택</option>
        </select>
      </div>
    </div>
  );
};

// EventList 컴포넌트 import 추가
import EventList from './EventList.jsx';

// 메인 컴포넌트
const Main = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [reviewsData, setReviewsData] = useState({}); // 🆕 후기 데이터 상태 추가
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    duration: '',
    special: ''
  });
  
  // 🆕 페이지 상태 관리 추가
  const [currentView, setCurrentView] = useState('products'); // 'products' | 'events'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 국가 목록 추출
  const countries = [...new Set(products.map(p => p.destination_country))].filter(Boolean);

  // 🆕 모든 상품의 후기 데이터 로딩
  const loadAllReviews = async (productList) => {
    try {
      console.log('🔍 모든 상품의 후기 데이터 로딩 시작...');
      const reviewsMap = {};

      for (const product of productList) {
        try {
          const result = await reviewService.getReviewsByMasterProduct(product.id);
          if (result.success) {
            const approvedReviews = result.data.filter(r => r.review_status === 'approved');
            reviewsMap[product.id] = {
              count: approvedReviews.length,
              averageRating: approvedReviews.length > 0 
                ? approvedReviews.reduce((sum, r) => sum + r.guide_rating, 0) / approvedReviews.length 
                : 0
            };
            console.log(`✅ ${product.product_name}: ${approvedReviews.length}개 후기`);
          }
        } catch (error) {
          console.warn(`⚠️ ${product.product_name} 후기 로딩 실패:`, error);
          reviewsMap[product.id] = { count: 0, averageRating: 0 };
        }
      }

      setReviewsData(reviewsMap);
      console.log('✅ 전체 후기 데이터 로딩 완료:', reviewsMap);
    } catch (error) {
      console.error('❌ 후기 데이터 로딩 오류:', error);
    }
  };

  // 데이터 로딩
  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (connected) {
        const result = await masterProductService.getAll({ status: 'active' });
        
        if (result.error) {
          console.error('상품 로딩 실패:', result.error);
        } else {
          setProducts(result.data || []);
          // 🆕 상품 로딩 후 후기 데이터도 로딩
          await loadAllReviews(result.data || []);
        }
      } else {
        // DB 연결 실패 시 더미 데이터
        const dummyProducts = [
          {
            id: '1',
            product_code: 'JP-TK-001',
            product_name: '도쿄 클래식 투어',
            destination_country: '일본',
            destination_city: '도쿄',
            duration_days: 4,
            duration_nights: 3,
            base_price: 890000,
            max_participants: 20,
            description: '도쿄의 전통과 현대가 어우러진 명소들을 탐방하는 클래식한 여행 코스입니다.',
            is_star_guide_product: true,
            upselling_enabled: true,
            status: 'active',
            product_images: []
          },
          {
            id: '2',
            product_code: 'JP-OS-002',
            product_name: '오사카 맛집 투어',
            destination_country: '일본',
            destination_city: '오사카',
            duration_days: 3,
            duration_nights: 2,
            base_price: 650000,
            max_participants: 15,
            description: '오사카의 유명한 맛집들을 돌아보며 현지 음식 문화를 체험하는 여행입니다.',
            is_star_guide_product: false,
            upselling_enabled: false,
            status: 'active',
            product_images: []
          },
          {
            id: '3',
            product_code: 'TH-BK-003',
            product_name: '방콕 시티 투어',
            destination_country: '태국',
            destination_city: '방콕',
            duration_days: 5,
            duration_nights: 4,
            base_price: 750000,
            max_participants: 25,
            description: '방콕의 화려한 사원과 현대적인 쇼핑몰을 함께 즐기는 도시 여행입니다.',
            is_star_guide_product: true,
            upselling_enabled: true,
            status: 'active',
            product_images: []
          }
        ];
        setProducts(dummyProducts);

        // 🆕 더미 후기 데이터
        const dummyReviews = {
          '1': { count: 15, averageRating: 4.8 },
          '2': { count: 8, averageRating: 4.2 },
          '3': { count: 22, averageRating: 4.6 }
        };
        setReviewsData(dummyReviews);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 상품 필터링
  useEffect(() => {
    let filtered = [...products];

    if (filters.search) {
      filtered = filtered.filter(p => 
        p.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.destination_country.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.destination_city.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.country) {
      filtered = filtered.filter(p => p.destination_country === filters.country);
    }

    if (filters.duration) {
      filtered = filtered.filter(p => {
        const days = p.duration_days;
        switch (filters.duration) {
          case '1-3': return days >= 1 && days <= 3;
          case '4-6': return days >= 4 && days <= 6;
          case '7+': return days >= 7;
          default: return true;
        }
      });
    }

    if (filters.special) {
      filtered = filtered.filter(p => {
        switch (filters.special) {
          case 'star_guide': return p.is_star_guide_product;
          case 'upselling': return p.upselling_enabled;
          default: return true;
        }
      });
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  useEffect(() => {
    loadProducts();
  }, []);

  // 상품 클릭 핸들러
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setCurrentView('events');
  };

  // 상품 목록으로 돌아가기
  const handleBackToProducts = () => {
    setCurrentView('products');
    setSelectedProduct(null);
  };

  // 이벤트 선택 핸들러 (필요시 구현)
  const handleEventSelect = (event) => {
    console.log('이벤트 선택:', event);
  };

  if (loading) return <LoadingSpinner />;

  // EventList 보기
  if (currentView === 'events' && selectedProduct) {
    return (
      <EventList
        masterProduct={selectedProduct}
        onBack={handleBackToProducts}
        onEventSelect={handleEventSelect}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">🌍 여행 상품</h1>
              {!isConnected && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  오프라인 모드
                </span>
              )}
            </div>
            <div className="text-gray-600">
              {filteredProducts.length}개의 상품
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 필터 섹션 */}
        <FilterSection 
          filters={filters}
          onFilterChange={setFilters}
          countries={countries}
        />

        {/* 상품 목록 */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                reviewStats={reviewsData[product.id]} // 🆕 후기 데이터 전달
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {filters.search || filters.country || filters.duration || filters.special
                ? '검색 조건에 맞는 상품이 없습니다'
                : '등록된 상품이 없습니다'
              }
            </h3>
            <p className="text-gray-600">
              {filters.search || filters.country || filters.duration || filters.special
                ? '다른 검색 조건을 시도해보세요.'
                : '관리자가 상품을 등록하면 여기에 표시됩니다.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Main;