// src/pages/Main.jsx (사용자용 메인 페이지)
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Users, DollarSign, Star, Calendar, 
  TrendingUp, ArrowRight, Heart, Filter, Search
} from 'lucide-react';

// API 서비스 import
import masterProductService from '../services/masterProductService';
import { testConnection } from '../lib/supabase';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">상품을 불러오는 중...</span>
  </div>
);

// 상품 카드 컴포넌트
const ProductCard = ({ product, onProductClick }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
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
        
        {/* 찜하기 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <Heart 
            className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'}`}
          />
        </button>

        {/* 스타가이드 배지 */}
        {product.is_star_guide_product && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Star className="w-4 h-4 fill-current" />
            스타가이드
          </div>
        )}

        {/* 업셀링 배지 */}
        {product.upselling_enabled && (
          <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            특가 혜택
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="p-6" onClick={() => onProductClick(product)}>
        {/* 제목과 위치 */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {product.product_name}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{product.destination_country} • {product.destination_city}</span>
          </div>
        </div>

        {/* 여행 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-blue-500" />
            <span>{product.duration_days}일 {product.duration_nights}박</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2 text-green-500" />
            <span>최대 {product.max_participants}명</span>
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
            placeholder="상품명, 도시명으로 검색..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 국가 선택 */}
        <select
          value={filters.country}
          onChange={(e) => onFilterChange({ ...filters, country: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 국가</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        {/* 여행 기간 */}
        <select
          value={filters.duration}
          onChange={(e) => onFilterChange({ ...filters, duration: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 기간</option>
          <option value="2-3">2-3일</option>
          <option value="4-5">4-5일</option>
          <option value="6-7">6-7일</option>
          <option value="8+">8일 이상</option>
        </select>

        {/* 특별 옵션 */}
        <select
          value={filters.special}
          onChange={(e) => onFilterChange({ ...filters, special: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">전체 상품</option>
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
      }
    } catch (err) {
      console.error('데이터 로딩 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 필터링 로직
  useEffect(() => {
    let filtered = [...products];

    // 검색어 필터
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm) ||
        product.destination_city.toLowerCase().includes(searchTerm) ||
        product.destination_country.toLowerCase().includes(searchTerm)
      );
    }

    // 국가 필터
    if (filters.country) {
      filtered = filtered.filter(product => product.destination_country === filters.country);
    }

    // 기간 필터
    if (filters.duration) {
      filtered = filtered.filter(product => {
        const days = product.duration_days;
        switch (filters.duration) {
          case '2-3': return days >= 2 && days <= 3;
          case '4-5': return days >= 4 && days <= 5;
          case '6-7': return days >= 6 && days <= 7;
          case '8+': return days >= 8;
          default: return true;
        }
      });
    }

    // 특별 옵션 필터
    if (filters.special) {
      switch (filters.special) {
        case 'star_guide':
          filtered = filtered.filter(product => product.is_star_guide_product);
          break;
        case 'upselling':
          filtered = filtered.filter(product => product.upselling_enabled);
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  // 초기 데이터 로딩
  useEffect(() => {
    loadProducts();
  }, []);

  // 상품 클릭 핸들러 - 행사 목록 페이지로 이동
  const handleProductClick = (product) => {
    console.log('상품 선택:', product);
    setSelectedProduct(product);
    setCurrentView('events');
  };

  // 뒤로가기 핸들러
  const handleBackToProducts = () => {
    setCurrentView('products');
    setSelectedProduct(null);
  };

  // 행사 선택 핸들러 (추후 예약 페이지로 이동)
  const handleEventSelect = (event) => {
    console.log('행사 선택:', event);
    // TODO: 예약 페이지 구현
    alert(`"${event.event_code}" 일정 예약 페이지로 이동합니다.`);
  };

  if (loading) return <LoadingSpinner />;

  // 🆕 조건부 렌더링 - 현재 뷰에 따라 다른 컴포넌트 표시
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