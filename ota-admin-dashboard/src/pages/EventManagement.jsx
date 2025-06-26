// src/pages/EventManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Plane, Users, DollarSign, Search, Eye, EyeOff, Star, Building2, UserCheck, Clock, Filter, TrendingUp, Calculator } from 'lucide-react';

// API 서비스 import
import eventService from '../services/eventService';
import masterProductService from '../services/masterProductService';
import guideService from '../services/guideService';
import landCompanyService from '../services/landCompanyService';
import { testConnection } from '../lib/supabase';

// 연결 상태 표시 컴포넌트
const ConnectionStatus = ({ isConnected }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
    isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }`}>
    {isConnected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    <span>{isConnected ? 'DB 연결됨' : 'DB 연결 안됨'}</span>
  </div>
);

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
  </div>
);

// 메시지 컴포넌트
const Message = ({ message, type = 'success', onClose }) => (
  <div className={`border rounded-md p-4 mb-4 ${
    type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }`}>
    <div className="flex justify-between items-center">
      <div className="flex">
        <svg className={`h-5 w-5 ${type === 'success' ? 'text-green-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
          {type === 'success' ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          )}
        </svg>
        <p className={`text-sm font-medium ml-3 ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
          {message}
        </p>
      </div>
      <button 
        onClick={onClose} 
        className={`${type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'}`}
      >
        ×
      </button>
    </div>
  </div>
);

// 행사 상태 배지
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { label: '모집중', class: 'bg-green-100 text-green-800' },
    inactive: { label: '비활성', class: 'bg-gray-100 text-gray-800' },
    full: { label: '마감', class: 'bg-blue-100 text-blue-800' },
    cancelled: { label: '취소', class: 'bg-red-100 text-red-800' }
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  );
};

// 💰 업셀링 수익 계산기
const UpsellRevenueCalculator = ({ basePrice, upsellRates, isEnabled }) => {
  if (!isEnabled || !basePrice) return null;

  // 업셀링 시나리오들 (기본가의 10%, 20%, 30% 추가)
  const scenarios = [
    { name: '10% 업셀', rate: 0.1, color: 'text-blue-600' },
    { name: '20% 업셀', rate: 0.2, color: 'text-green-600' },
    { name: '30% 업셀', rate: 0.3, color: 'text-purple-600' }
  ];

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-green-600" />
        <span className="text-lg font-semibold text-gray-800">💰 업셀링 수익 미리보기</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const upsellAmount = basePrice * scenario.rate;
          const totalPrice = basePrice + upsellAmount;
          
          // 업셀링 금액에서 커미션 계산
          const guideCommission = upsellAmount * (upsellRates.guide || 0) / 100;
          const companyRevenue = upsellAmount * (upsellRates.company || 0) / 100;
          const otaCommission = upsellAmount * (upsellRates.ota || 0) / 100;
          const totalCommission = guideCommission + companyRevenue + otaCommission;
          
          return (
            <div key={scenario.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-center mb-3">
                <div className={`text-lg font-bold ${scenario.color}`}>
                  {scenario.name}
                </div>
                <div className="text-sm text-gray-600">
                  총 판매가: ₩{totalPrice.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  (기본 {basePrice.toLocaleString()} + 업셀 {upsellAmount.toLocaleString()})
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">가이드 커미션:</span>
                  <span className="font-medium">₩{guideCommission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">회사 수익:</span>
                  <span className="font-medium">₩{companyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-600">OTA 커미션:</span>
                  <span className="font-medium">₩{otaCommission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>총 커미션:</span>
                  <span className="text-green-600">₩{totalCommission.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          💡 <strong>업셀링 로직:</strong> 기본 패키지 가격 + 추가 옵션 금액 = 최종 판매가
        </div>
      </div>
    </div>
  );
};

// 행사 폼 컴포넌트
const EventForm = ({ event, onSave, onCancel, isLoading, masterProducts, guides, landCompanies }) => {
  // 상태 관리 - upselling_percentage 추가
  const [formData, setFormData] = useState({
    master_product_id: event?.master_product_id || '',
    departure_date: event?.departure_date || '',
    arrival_date: event?.arrival_date || '',
    departure_time: event?.departure_time || '',
    arrival_time: event?.arrival_time || '',
    departure_return_time: event?.departure_return_time || '',
    arrival_return_time: event?.arrival_return_time || '',
    departure_airline: event?.departure_airline || '',
    arrival_airline: event?.arrival_airline || '',
    departure_airport: event?.departure_airport || '',
    arrival_airport: event?.arrival_airport || '',
    assigned_guide_id: event?.assigned_guide_id || '',
    land_company_id: event?.land_company_id || '',
    event_price: event?.event_price || '',
    max_capacity: event?.max_capacity || 20,
    status: event?.status || 'active',
    admin_notes: event?.admin_notes || '',
    upselling_enabled: event?.upselling_enabled || false,
    upselling_percentage: event?.upselling_percentage || 20, // 업셀링 비율 추가
    upselling_guide_rate: event?.upselling_guide_rate || 0,
    upselling_company_rate: event?.upselling_company_rate || 0,
    upselling_ota_rate: event?.upselling_ota_rate || 0
  });

  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('');
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [filteredLandCompanies, setFilteredLandCompanies] = useState([]);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState(null);

  // 최종 가격 계산 함수
  const calculateFinalPrice = (basePrice, upsellPercent, isUpselling) => {
    if (!basePrice) return 0;
    
    const base = parseFloat(basePrice);
    if (!isUpselling) return base;
    
    // 업셀링: 기본 가격 + (기본 가격 × 업셀링 비율)
    const upsellAmount = base * (parseFloat(upsellPercent) / 100);
    return base + upsellAmount;
  };

  // 마스터 상품 선택 시 자동 설정
  useEffect(() => {
    if (formData.master_product_id && masterProducts.length > 0) {
      const selectedProduct = masterProducts.find(p => p.id === formData.master_product_id);
      if (selectedProduct) {
        setSelectedMasterProduct(selectedProduct);
        setSelectedCountry(selectedProduct.destination_country);
        
        if (formData.departure_date) {
          const departureDate = new Date(formData.departure_date);
          const arrivalDate = new Date(departureDate);
          arrivalDate.setDate(departureDate.getDate() + (selectedProduct.duration_days - 1));
          
          setFormData(prev => ({
            ...prev,
            arrival_date: arrivalDate.toISOString().split('T')[0],
            event_price: selectedProduct.base_price,
            max_capacity: selectedProduct.max_participants || 20,
            departure_airline: selectedProduct.base_airline || '',
            arrival_airline: selectedProduct.base_airline || ''
          }));
        }

        // 새 행사 생성 시에만 마스터 상품의 업셀링 설정 적용
        if (!event) {
          setFormData(prev => ({
            ...prev,
            upselling_enabled: selectedProduct.upselling_enabled || false,
            upselling_guide_rate: selectedProduct.guide_commission_rate || 0,
            upselling_company_rate: selectedProduct.company_commission_rate || 0,
            upselling_ota_rate: selectedProduct.ota_commission_rate || 0
          }));
        }
      }
    } else {
      setSelectedMasterProduct(null);
    }
  }, [formData.master_product_id, formData.departure_date, masterProducts, event]);

  // 국가별 가이드/랜드사 필터링
  useEffect(() => {
    if (selectedCountry) {
      const countryGuides = guides.filter(guide => 
        guide.land_companies && guide.land_companies.country === selectedCountry
      );
      setFilteredGuides(countryGuides);

      const countryLandCompanies = landCompanies.filter(company => 
        company.country === selectedCountry
      );
      setFilteredLandCompanies(countryLandCompanies);
    } else {
      setFilteredGuides(guides);
      setFilteredLandCompanies(landCompanies);
    }
  }, [selectedCountry, guides, landCompanies]);

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.master_product_id) {
      newErrors.master_product_id = '마스터 상품을 선택해주세요.';
    }
    
    if (!formData.departure_date) {
      newErrors.departure_date = '출발일을 선택해주세요.';
    }

    if (!formData.arrival_date) {
      newErrors.arrival_date = '도착일을 선택해주세요.';
    }

    if (formData.departure_date && formData.arrival_date) {
      if (new Date(formData.departure_date) >= new Date(formData.arrival_date)) {
        newErrors.arrival_date = '도착일은 출발일보다 늦어야 합니다.';
      }
    }

    if (!formData.event_price || formData.event_price <= 0) {
      newErrors.event_price = '올바른 행사 가격을 입력해주세요.';
    }

    if (formData.upselling_enabled) {
      const totalRate = parseFloat(formData.upselling_guide_rate || 0) + 
                       parseFloat(formData.upselling_company_rate || 0) + 
                       parseFloat(formData.upselling_ota_rate || 0);
      
      if (totalRate > 100) {
        newErrors.upselling_total = '전체 업셀링 커미션 비율이 100%를 초과할 수 없습니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const basePrice = parseFloat(formData.event_price) || 0;
    const currentUpsellPercentage = parseFloat(formData.upselling_percentage) || 0;
    const finalPrice = calculateFinalPrice(
      basePrice, 
      currentUpsellPercentage, 
      formData.upselling_enabled
    );

    console.log('💰 가격 계산 상세:', {
      기본가격: basePrice,
      업셀링비율: currentUpsellPercentage + '%',
      업셀링활성화: formData.upselling_enabled,
      업셀링추가금액: formData.upselling_enabled ? (basePrice * currentUpsellPercentage / 100) : 0,
      계산된최종가격: finalPrice,
      upselling_percentage상태값: formData.upselling_percentage
    });

    const processedData = {
      ...formData,
      event_price: basePrice,
      final_price: Math.round(finalPrice), // 최종 가격 명시적 설정
      max_capacity: parseInt(formData.max_capacity) || 20,
      upselling_percentage: parseFloat(formData.upselling_percentage) || 0, // 업셀링 비율 저장
      upselling_guide_rate: parseFloat(formData.upselling_guide_rate) || 0,
      upselling_company_rate: parseFloat(formData.upselling_company_rate) || 0,
      upselling_ota_rate: parseFloat(formData.upselling_ota_rate) || 0,
      // null 처리
      assigned_guide_id: formData.assigned_guide_id || null,
      land_company_id: formData.land_company_id || null,
      departure_time: formData.departure_time || null,
      arrival_time: formData.arrival_time || null,
      departure_return_time: formData.departure_return_time || null,
      arrival_return_time: formData.arrival_return_time || null,
      departure_airline: formData.departure_airline || null,
      arrival_airline: formData.arrival_airline || null,
      departure_airport: formData.departure_airport || null,
      arrival_airport: formData.arrival_airport || null,
      admin_notes: formData.admin_notes || null
    };

    console.log('📤 전송할 데이터:', processedData);
    console.log('🔍 전송 데이터 가격 확인:', {
      event_price: processedData.event_price,
      final_price: processedData.final_price,
      upselling_enabled: processedData.upselling_enabled,
      upselling_percentage: processedData.upselling_percentage,
      '업셀링비율': currentUpsellPercentage + '%'
    });

    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {event ? '행사 수정' : '새 행사 생성'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 마스터 상품 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마스터 상품 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.master_product_id}
                onChange={(e) => setFormData({...formData, master_product_id: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.master_product_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">마스터 상품 선택</option>
                {masterProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} ({product.product_code}) - {product.destination_country}
                    {product.upselling_enabled ? ' 🔥' : ''}
                  </option>
                ))}
              </select>
              {errors.master_product_id && (
                <p className="text-red-500 text-xs mt-1">{errors.master_product_id}</p>
              )}
              
              {selectedMasterProduct && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <div className="font-medium">{selectedMasterProduct.product_name}</div>
                    <div>기본가격: ₩{selectedMasterProduct.base_price?.toLocaleString()}</div>
                    <div>{selectedMasterProduct.duration_days}일 {selectedMasterProduct.duration_nights}박</div>
                  </div>
                </div>
              )}
            </div>

            {/* 날짜 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출발일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.departure_date}
                  onChange={(e) => setFormData({...formData, departure_date: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.departure_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.departure_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.departure_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  도착일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.arrival_date}
                  onChange={(e) => setFormData({...formData, arrival_date: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.arrival_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.arrival_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.arrival_date}</p>
                )}
              </div>
            </div>

            {/* 항공편 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">출발 항공편</label>
                <input
                  type="text"
                  value={formData.departure_airline}
                  onChange={(e) => setFormData({...formData, departure_airline: e.target.value})}
                  placeholder="예: KE123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">귀국 항공편</label>
                <input
                  type="text"
                  value={formData.arrival_airline}
                  onChange={(e) => setFormData({...formData, arrival_airline: e.target.value})}
                  placeholder="예: KE124"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 가이드 및 랜드사 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">배정 가이드</label>
                <select
                  value={formData.assigned_guide_id}
                  onChange={(e) => setFormData({...formData, assigned_guide_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">가이드 선택</option>
                  {filteredGuides.map(guide => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name_ko} ({guide.guide_id})
                      {guide.is_star_guide && ' ⭐'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">협력 랜드사</label>
                <select
                  value={formData.land_company_id}
                  onChange={(e) => setFormData({...formData, land_company_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">랜드사 선택</option>
                  {filteredLandCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.company_name} - {company.region || company.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 가격 설정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기본 패키지 가격 (₩) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.event_price}
                  onChange={(e) => setFormData({...formData, event_price: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.event_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.event_price && (
                  <p className="text-red-500 text-xs mt-1">{errors.event_price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">최대 참가자 수</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 행사 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">행사 상태</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">모집중</option>
                <option value="inactive">비활성</option>
                <option value="full">마감</option>
                <option value="cancelled">취소</option>
              </select>
            </div>

            {/* 업셀링 설정 */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                업셀링 설정
              </h4>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="upselling_enabled"
                    checked={formData.upselling_enabled}
                    onChange={(e) => setFormData({...formData, upselling_enabled: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  />
                  <label htmlFor="upselling_enabled" className="ml-2 text-sm font-medium text-gray-700">
                    업셀링 활성화 (추가 옵션 판매)
                  </label>
                </div>

                {formData.upselling_enabled && (
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                    {/* 업셀링 비율 설정 - formData.upselling_percentage 사용 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        업셀링 비율 (%)
                      </label>
                      <select
                        value={formData.upselling_percentage}
                        onChange={(e) => setFormData({...formData, upselling_percentage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="10">10% (기본가 + 10%)</option>
                        <option value="15">15% (기본가 + 15%)</option>
                        <option value="20">20% (기본가 + 20%)</option>
                        <option value="25">25% (기본가 + 25%)</option>
                        <option value="30">30% (기본가 + 30%)</option>
                      </select>
                    </div>

                    {/* 커미션 비율 설정 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          가이드 커미션 (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.upselling_guide_rate}
                          onChange={(e) => setFormData({...formData, upselling_guide_rate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          회사 수익 (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.upselling_company_rate}
                          onChange={(e) => setFormData({...formData, upselling_company_rate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OTA 커미션 (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.upselling_ota_rate}
                          onChange={(e) => setFormData({...formData, upselling_ota_rate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* 최종 가격 표시 - formData.upselling_percentage 사용 */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <div className="font-medium mb-2">💰 가격 계산 결과</div>
                        <div>기본 패키지: ₩{formData.event_price ? parseFloat(formData.event_price).toLocaleString() : '0'}</div>
                        <div>업셀링 추가: ₩{formData.event_price ? 
                          (parseFloat(formData.event_price) * parseFloat(formData.upselling_percentage) / 100).toLocaleString() : '0'} 
                          ({formData.upselling_percentage}%)
                        </div>
                        <div className="font-bold text-lg text-blue-900 mt-2">
                          최종 판매가: ₩{formData.event_price ? 
                            calculateFinalPrice(
                              formData.event_price, 
                              formData.upselling_percentage, 
                              formData.upselling_enabled
                            ).toLocaleString() : '0'}
                        </div>
                      </div>
                    </div>

                    {/* 수익 미리보기 */}
                    {formData.event_price && (
                      <UpsellRevenueCalculator
                        basePrice={parseFloat(formData.event_price)}
                        upsellRates={{
                          guide: parseFloat(formData.upselling_guide_rate || 0),
                          company: parseFloat(formData.upselling_company_rate || 0),
                          ota: parseFloat(formData.upselling_ota_rate || 0)
                        }}
                        isEnabled={formData.upselling_enabled}
                      />
                    )}

                    {errors.upselling_total && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{errors.upselling_total}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 관리자 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">관리자 메모</label>
              <textarea
                rows="3"
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                placeholder="행사 관련 특이사항이나 메모를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {event ? '수정 완료' : '행사 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 메인 EventManagement 컴포넌트
const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [landCompanies, setLandCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (connected) {
        const [eventsResult, masterProductsResult, guidesResult, landCompaniesResult] = await Promise.all([
          eventService.getAll({ search: searchTerm, status: statusFilter }),
          masterProductService.getAll({ status: 'active' }),
          guideService.getAll({ status: 'active' }),
          landCompanyService.getAll({ status: 'active' })
        ]);

        if (eventsResult.error) {
          showMessage(`행사 데이터 로딩 실패: ${eventsResult.error}`, 'error');
        } else {
          setEvents(eventsResult.data || []);
        }

        if (masterProductsResult.error) {
          showMessage(`마스터 상품 로딩 실패: ${masterProductsResult.error}`, 'error');
        } else {
          setMasterProducts(masterProductsResult.data || []);
        }

        if (guidesResult.error) {
          showMessage(`가이드 데이터 로딩 실패: ${guidesResult.error}`, 'error');
        } else {
          setGuides(guidesResult.data || []);
        }

        if (landCompaniesResult.error) {
          showMessage(`랜드사 데이터 로딩 실패: ${landCompaniesResult.error}`, 'error');
        } else {
          setLandCompanies(landCompaniesResult.data || []);
        }
      } else {
        setEvents([]);
        setMasterProducts([]);
        setGuides([]);
        setLandCompanies([]);
        showMessage('데이터베이스에 연결할 수 없습니다.', 'error');
      }
    } catch (err) {
      setIsConnected(false);
      setEvents([]);
      setMasterProducts([]);
      setGuides([]);
      setLandCompanies([]);
      showMessage(`데이터 로딩 중 오류: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(loadData, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleSave = async (eventData) => {
    try {
      setSaving(true);
      
      if (isConnected) {
        let result;
        if (editingEvent) {
          result = await eventService.update(editingEvent.id, eventData);
        } else {
          result = await eventService.create(eventData);
        }
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        showMessage(editingEvent ? '행사가 성공적으로 수정되었습니다.' : '새 행사가 성공적으로 생성되었습니다.');
        await loadData();
        setShowForm(false);
        setEditingEvent(null);
      } else {
        showMessage('데이터베이스에 연결되지 않았습니다.', 'error');
      }
    } catch (err) {
      showMessage(`저장 실패: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, eventCode) => {
    if (!window.confirm(`정말로 "${eventCode}" 행사를 삭제하시겠습니까?`)) return;
    
    try {
      if (isConnected) {
        const result = await eventService.delete(id);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (result.success) {
          showMessage('행사가 성공적으로 삭제되었습니다.');
          await loadData();
        }
      } else {
        showMessage('데이터베이스에 연결되지 않았습니다.', 'error');
      }
    } catch (err) {
      showMessage(`삭제 실패: ${err.message}`, 'error');
    }
  };

  const stats = {
    total: events.length,
    active: events.filter(e => e.status === 'active').length,
    full: events.filter(e => e.status === 'full').length,
    totalBookings: events.reduce((sum, e) => sum + (e.current_bookings || 0), 0),
    totalUpselling: events.reduce((sum, e) => sum + (e.total_upselling_revenue || 0), 0)
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              행사 관리
            </h1>
            <p className="text-gray-600 mt-1">실제 출발 일정과 행사를 관리합니다</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus isConnected={isConnected} />
            <button 
              onClick={() => setShowForm(true)}
              disabled={!isConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              새 행사 생성
            </button>
          </div>
        </div>

        {/* 메시지 */}
        {message && (
          <Message 
            message={message} 
            type={messageType}
            onClose={() => setMessage('')}
          />
        )}

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 행사</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">모집중</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">마감</p>
                <p className="text-2xl font-bold text-blue-600">{stats.full}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 예약자</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalBookings}명</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">업셀링 수익</p>
                <p className="text-2xl font-bold text-green-600">₩{stats.totalUpselling.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="행사 코드, 상품명, 목적지로 검색..."
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
              <option value="active">모집중</option>
              <option value="inactive">비활성</option>
              <option value="full">마감</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>

        {/* 행사 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">행사 정보</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">일정</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가이드</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">예약 현황</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {event.master_products?.product_name || '상품명 없음'}
                          </div>
                          <div className="text-sm text-gray-500">{event.event_code}</div>
                          <div className="flex items-center mt-1">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">
                              {event.master_products?.destination_country}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            {event.departure_date} ~ {event.arrival_date}
                          </div>
                          {event.departure_airline && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Plane className="w-4 h-4 text-gray-400 mr-1" />
                              {event.departure_airline}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {event.guides ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <UserCheck className="w-4 h-4 text-gray-400 mr-1" />
                            {event.guides.name_ko}
                            {event.guides.is_star_guide && <Star className="w-3 h-3 text-yellow-500 ml-1" />}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">미배정</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {event.current_bookings || 0} / {event.max_capacity}명
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(100, ((event.current_bookings || 0) / event.max_capacity) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(() => {
                            const basePrice = event.event_price || event.master_products?.base_price || 0;
                            let displayPrice = basePrice;
                            
                            // 업셀링이 활성화된 경우 실제 최종가격 계산
                            if (event.upselling_enabled && event.upselling_percentage) {
                              // 저장된 업셀링 비율로 계산
                              const upsellAmount = basePrice * (event.upselling_percentage / 100);
                              displayPrice = basePrice + upsellAmount;
                            }
                            
                            return (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  ₩{Math.round(displayPrice).toLocaleString()}
                                </div>
                                {event.upselling_enabled && displayPrice > basePrice && (
                                  <div className="text-sm text-gray-500">
                                    기본: ₩{basePrice.toLocaleString()} (+{event.upselling_percentage}%)
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          {event.upselling_enabled ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              업셀링
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              기본 패키지
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={event.status} />
                      </td>

                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingEvent(event);
                              setShowForm(true);
                            }}
                            disabled={!isConnected}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(event.id, event.event_code)}
                            disabled={!isConnected}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter ? '검색 결과가 없습니다' : '등록된 행사가 없습니다'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter ? '다른 검색 조건을 시도해보세요.' : '마스터 상품을 기반으로 새 행사를 생성해보세요.'}
              </p>
              {!searchTerm && !statusFilter && isConnected && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  첫 번째 행사 생성
                </button>
              )}
            </div>
          )}
        </div>

        {/* 행사 폼 모달 */}
        {showForm && (
          <EventForm
            event={editingEvent}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
            isLoading={saving}
            masterProducts={masterProducts}
            guides={guides}
            landCompanies={landCompanies}
          />
        )}
      </div>
    </div>
  );
};

export default EventManagement;