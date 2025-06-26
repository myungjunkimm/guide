// src/pages/EventManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Plane, Users, DollarSign, Search, Eye, EyeOff, Star, Building2, UserCheck, Clock, Filter } from 'lucide-react';

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

// 성공 메시지 컴포넌트
const SuccessMessage = ({ message, onClose }) => (
  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
    <div className="flex justify-between items-center">
      <div className="flex">
        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <p className="text-sm font-medium text-green-800 ml-3">{message}</p>
      </div>
      <button onClick={onClose} className="text-green-400 hover:text-green-600">×</button>
    </div>
  </div>
);

// 행사 상태 배지 컴포넌트
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

// 행사 폼 컴포넌트
const EventForm = ({ event, onSave, onCancel, isLoading, masterProducts, guides, landCompanies }) => {
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
    final_price: event?.final_price || '',
    max_capacity: event?.max_capacity || 20,
    status: event?.status || 'active',
    admin_notes: event?.admin_notes || '',
    upselling_enabled: event?.upselling_enabled || false,
    upselling_guide_rate: event?.upselling_guide_rate || 0,
    upselling_company_rate: event?.upselling_company_rate || 0,
    upselling_ota_rate: event?.upselling_ota_rate || 0
  });

  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('');
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [filteredLandCompanies, setFilteredLandCompanies] = useState([]);

  // 마스터 상품 선택 시 자동 설정
  useEffect(() => {
    if (formData.master_product_id && masterProducts.length > 0) {
      const selectedProduct = masterProducts.find(p => p.id === formData.master_product_id);
      if (selectedProduct) {
        setSelectedCountry(selectedProduct.destination_country);
        
        // 출발일이 설정되어 있으면 도착일 자동 계산
        if (formData.departure_date) {
          const departureDate = new Date(formData.departure_date);
          const arrivalDate = new Date(departureDate);
          arrivalDate.setDate(departureDate.getDate() + (selectedProduct.duration_days - 1));
          
          setFormData(prev => ({
            ...prev,
            arrival_date: arrivalDate.toISOString().split('T')[0],
            event_price: selectedProduct.base_price,
            final_price: selectedProduct.base_price,
            max_capacity: selectedProduct.max_participants || 20,
            departure_airline: selectedProduct.base_airline || '',
            arrival_airline: selectedProduct.base_airline || '',
            // 마스터 상품의 업셀링/커미션 설정 복사 (기존 값이 없을 때만)
            upselling_enabled: prev.upselling_enabled || selectedProduct.upselling_enabled || false,
            upselling_guide_rate: prev.upselling_guide_rate || selectedProduct.guide_commission_rate || 0,
            upselling_company_rate: prev.upselling_company_rate || selectedProduct.company_commission_rate || 0,
            upselling_ota_rate: prev.upselling_ota_rate || selectedProduct.ota_commission_rate || 0
          }));
        }
      }
    }
  }, [formData.master_product_id, formData.departure_date, masterProducts]);

  // 국가 변경 시 가이드와 랜드사 필터링
  useEffect(() => {
    if (selectedCountry) {
      // 해당 국가의 가이드 필터링
      const countryGuides = guides.filter(guide => 
        guide.land_companies && guide.land_companies.country === selectedCountry
      );
      setFilteredGuides(countryGuides);

      // 해당 국가의 랜드사 필터링
      const countryLandCompanies = landCompanies.filter(company => 
        company.country === selectedCountry
      );
      setFilteredLandCompanies(countryLandCompanies);
    } else {
      setFilteredGuides(guides);
      setFilteredLandCompanies(landCompanies);
    }
  }, [selectedCountry, guides, landCompanies]);

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

    if (!formData.final_price || formData.final_price <= 0) {
      newErrors.final_price = '올바른 최종 가격을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const processedData = {
      ...formData,
      event_price: parseFloat(formData.event_price),
      final_price: parseFloat(formData.final_price),
      max_capacity: parseInt(formData.max_capacity),
      upselling_guide_rate: parseFloat(formData.upselling_guide_rate),
      upselling_company_rate: parseFloat(formData.upselling_company_rate),
      upselling_ota_rate: parseFloat(formData.upselling_ota_rate)
    };

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
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
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
                    </option>
                  ))}
                </select>
                {errors.master_product_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.master_product_id}</p>
                )}
              </div>

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

            {/* 시간 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출발 시간
                </label>
                <input
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  도착 시간
                </label>
                <input
                  type="time"
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({...formData, arrival_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  귀국 출발 시간
                </label>
                <input
                  type="time"
                  value={formData.departure_return_time}
                  onChange={(e) => setFormData({...formData, departure_return_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  귀국 도착 시간
                </label>
                <input
                  type="time"
                  value={formData.arrival_return_time}
                  onChange={(e) => setFormData({...formData, arrival_return_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 항공편 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출발 항공편
                </label>
                <input
                  type="text"
                  value={formData.departure_airline}
                  onChange={(e) => setFormData({...formData, departure_airline: e.target.value})}
                  placeholder="예: KE123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  귀국 항공편
                </label>
                <input
                  type="text"
                  value={formData.arrival_airline}
                  onChange={(e) => setFormData({...formData, arrival_airline: e.target.value})}
                  placeholder="예: KE124"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출발 공항
                </label>
                <input
                  type="text"
                  value={formData.departure_airport}
                  onChange={(e) => setFormData({...formData, departure_airport: e.target.value})}
                  placeholder="예: 인천국제공항"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  도착 공항
                </label>
                <input
                  type="text"
                  value={formData.arrival_airport}
                  onChange={(e) => setFormData({...formData, arrival_airport: e.target.value})}
                  placeholder="예: 나리타국제공항"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 가이드 및 랜드사 배정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배정 가이드
                </label>
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
                      {guide.land_companies && ` - ${guide.land_companies.company_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  협력 랜드사
                </label>
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

            {/* 가격 및 참가자 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  행사 가격 (₩) <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최종 가격 (₩) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.final_price}
                  onChange={(e) => setFormData({...formData, final_price: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.final_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.final_price && (
                  <p className="text-red-500 text-xs mt-1">{errors.final_price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 참가자 수
                </label>
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

            {/* 상태 및 메모 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  행사 상태
                </label>
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
            </div>

            {/* 업셀링 및 커미션 설정 */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">업셀링 및 커미션 설정 (행사별 개별 설정)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="event_upselling_enabled"
                    checked={formData.upselling_enabled}
                    onChange={(e) => setFormData({...formData, upselling_enabled: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  />
                  <label htmlFor="event_upselling_enabled" className="ml-2 text-sm font-medium text-gray-700">
                    이 행사에서 업셀링 활성화
                  </label>
                </div>
              </div>

              {formData.upselling_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      가이드 업셀링 커미션 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.upselling_guide_rate}
                      onChange={(e) => setFormData({...formData, upselling_guide_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: 5.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">가이드가 업셀링 시 받을 추가 커미션</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사 업셀링 수익 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.upselling_company_rate}
                      onChange={(e) => setFormData({...formData, upselling_company_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: 10.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">회사가 업셀링으로 얻는 수익률</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OTA 업셀링 커미션 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.upselling_ota_rate}
                      onChange={(e) => setFormData({...formData, upselling_ota_rate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: 3.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">OTA에 지급할 업셀링 커미션</p>
                  </div>
                </div>
              )}

              {!formData.upselling_enabled && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 업셀링을 활성화하면 가이드가 추가 상품/서비스를 판매했을 때의 커미션을 설정할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관리자 메모
              </label>
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

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [landCompanies, setLandCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  // 실제 API를 사용한 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Supabase 연결 확인
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (connected) {
        // 실제 API 호출
        const [eventsResult, masterProductsResult, guidesResult, landCompaniesResult] = await Promise.all([
          eventService.getAll({ search: searchTerm, status: statusFilter }),
          masterProductService.getAll({ status: 'active' }),
          guideService.getAll({ status: 'active' }),
          landCompanyService.getAll({ status: 'active' })
        ]);

        if (eventsResult.error) {
          console.error('행사 로딩 오류:', eventsResult.error);
          setEvents(getDummyEvents());
        } else {
          setEvents(eventsResult.data || []);
        }

        if (masterProductsResult.error) {
          console.error('마스터 상품 로딩 오류:', masterProductsResult.error);
          setMasterProducts(getDummyMasterProducts());
        } else {
          setMasterProducts(masterProductsResult.data || []);
        }

        if (guidesResult.error) {
          console.error('가이드 로딩 오류:', guidesResult.error);
          setGuides(getDummyGuides());
        } else {
          setGuides(guidesResult.data || []);
        }

        if (landCompaniesResult.error) {
          console.error('랜드사 로딩 오류:', landCompaniesResult.error);
          setLandCompanies(getDummyLandCompanies());
        } else {
          setLandCompanies(landCompaniesResult.data || []);
        }
      } else {
        // 연결 실패 시 더미 데이터 사용
        setEvents(getDummyEvents());
        setMasterProducts(getDummyMasterProducts());
        setGuides(getDummyGuides());
        setLandCompanies(getDummyLandCompanies());
      }
    } catch (err) {
      console.error('데이터 로딩 오류:', err);
      setIsConnected(false);
      setEvents(getDummyEvents());
      setMasterProducts(getDummyMasterProducts());
      setGuides(getDummyGuides());
      setLandCompanies(getDummyLandCompanies());
    } finally {
      setLoading(false);
    }
  };

  // 더미 데이터들
  const getDummyEvents = () => {
    const dummyEvents = [
      {
        id: '1',
        event_code: 'JP-TK-001-250715',
        departure_date: '2025-07-15',
        arrival_date: '2025-07-18',
        departure_time: '09:30',
        arrival_time: '12:45',
        departure_airline: 'KE123',
        arrival_airline: 'KE124',
        event_price: 890000,
        final_price: 890000,
        max_capacity: 20,
        current_bookings: 8,
        status: 'active',
        upselling_enabled: true,
        upselling_guide_rate: 5.0,
        upselling_company_rate: 10.0,
        upselling_ota_rate: 3.0,
        master_products: {
          id: '1',
          product_name: '도쿄 클래식 투어',
          product_code: 'JP-TK-001',
          destination_country: '일본',
          destination_city: '도쿄',
          duration_days: 4,
          duration_nights: 3
        },
        guides: {
          id: '1',
          name_ko: '김현수',
          guide_id: 'GD001',
          is_star_guide: true,
          average_rating: 4.8
        },
        land_companies: {
          id: '1',
          company_name: '도쿄 트래블 서비스',
          country: '일본'
        }
      },
      {
        id: '2',
        event_code: 'JP-OS-002-250803',
        departure_date: '2025-08-03',
        arrival_date: '2025-08-05',
        departure_time: '14:20',
        arrival_time: '16:35',
        departure_airline: 'OZ101',
        arrival_airline: 'OZ102',
        event_price: 650000,
        final_price: 650000,
        max_capacity: 15,
        current_bookings: 12,
        status: 'full',
        upselling_enabled: false,
        upselling_guide_rate: 0,
        upselling_company_rate: 0,
        upselling_ota_rate: 0,
        master_products: {
          id: '2',
          product_name: '오사카 맛집 투어',
          product_code: 'JP-OS-002',
          destination_country: '일본',
          destination_city: '오사카',
          duration_days: 3,
          duration_nights: 2
        },
        guides: {
          id: '2',
          name_ko: '박지은',
          guide_id: 'GD002',
          is_star_guide: false,
          average_rating: 4.5
        },
        land_companies: {
          id: '2',
          company_name: '오사카 로컬 투어',
          country: '일본'
        }
      }
    ];

    // 검색 필터 적용
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return dummyEvents.filter(event =>
        event.event_code.toLowerCase().includes(searchLower) ||
        event.master_products?.product_name.toLowerCase().includes(searchLower) ||
        event.master_products?.destination_country.toLowerCase().includes(searchLower)
      );
    }

    // 상태 필터 적용
    if (statusFilter) {
      return dummyEvents.filter(event => event.status === statusFilter);
    }

    return dummyEvents;
  };

  const getDummyMasterProducts = () => [
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
      base_airline: 'JAL',
      upselling_enabled: true,
      guide_commission_rate: 8.0,
      company_commission_rate: 12.0,
      ota_commission_rate: 5.0
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
      base_airline: 'ANA',
      upselling_enabled: false,
      guide_commission_rate: 10.0,
      company_commission_rate: 15.0,
      ota_commission_rate: 3.0
    }
  ];

  const getDummyGuides = () => [
    {
      id: '1',
      guide_id: 'GD001',
      name_ko: '김현수',
      is_star_guide: true,
      average_rating: 4.8,
      experience_year: 5,
      languages: ['일본어', '영어'],
      land_companies: {
        id: '1',
        company_name: '도쿄 트래블 서비스',
        country: '일본'
      }
    },
    {
      id: '2',
      guide_id: 'GD002',
      name_ko: '박지은',
      is_star_guide: false,
      average_rating: 4.5,
      experience_year: 3,
      languages: ['일본어'],
      land_companies: {
        id: '2',
        company_name: '오사카 로컬 투어',
        country: '일본'
      }
    }
  ];

  const getDummyLandCompanies = () => [
    {
      id: '1',
      company_name: '도쿄 트래블 서비스',
      country: '일본',
      region: '도쿄'
    },
    {
      id: '2',
      company_name: '오사카 로컬 투어',
      country: '일본',
      region: '오사카'
    },
    {
      id: '3',
      company_name: '방콕 투어 컴퍼니',
      country: '태국',
      region: '방콕'
    }
  ];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, countryFilter]);

  const handleSave = async (eventData) => {
    try {
      setSaving(true);
      
      if (isConnected) {
        // 실제 API 사용
        let result;
        if (editingEvent) {
          result = await eventService.update(editingEvent.id, eventData);
        } else {
          result = await eventService.create(eventData);
        }
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setSuccessMessage(editingEvent ? '행사가 수정되었습니다.' : '새 행사가 생성되었습니다.');
        await loadData(); // 데이터 다시 로드
      } else {
        // 더미 데이터 모드
        if (editingEvent) {
          setEvents(prev => prev.map(e => 
            e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e
          ));
          setSuccessMessage('행사가 수정되었습니다.');
        } else {
          const newEvent = {
            ...eventData,
            id: Date.now().toString(),
            event_code: `EVT-${Date.now()}`,
            current_bookings: 0
          };
          setEvents(prev => [...prev, newEvent]);
          setSuccessMessage('새 행사가 생성되었습니다.');
        }
      }
      
      setShowForm(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('저장 오류:', err);
      setSuccessMessage(`저장 실패: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, eventCode) => {
    if (!window.confirm(`정말로 "${eventCode}" 행사를 삭제하시겠습니까?`)) return;
    
    try {
      if (isConnected) {
        // 실제 API 사용
        const { success, error } = await eventService.delete(id);
        
        if (error) {
          throw new Error(error);
        }
        
        if (success) {
          setSuccessMessage('행사가 삭제되었습니다.');
          await loadData(); // 데이터 다시 로드
        }
      } else {
        // 더미 데이터 모드
        setEvents(prev => prev.filter(e => e.id !== id));
        setSuccessMessage('행사가 삭제되었습니다.');
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      setSuccessMessage(`삭제 실패: ${err.message}`);
    }
  };

  const stats = {
    total: events.length,
    active: events.filter(e => e.status === 'active').length,
    full: events.filter(e => e.status === 'full').length,
    totalBookings: events.reduce((sum, e) => sum + (e.current_bookings || 0), 0)
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              새 행사 생성
            </button>
          </div>
        </div>

        {/* 성공 메시지 */}
        {successMessage && (
          <SuccessMessage 
            message={successMessage} 
            onClose={() => setSuccessMessage('')}
          />
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">모든 국가</option>
              <option value="일본">일본</option>
              <option value="태국">태국</option>
              <option value="베트남">베트남</option>
              <option value="싱가포르">싱가포르</option>
            </select>
          </div>
        </div>

        {/* 행사 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    행사 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    일정
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가이드/랜드사
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약 현황
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가격/업셀링
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
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
                            {event.master_products?.destination_city && 
                              ` · ${event.master_products.destination_city}`}
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
                        {event.departure_time && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 text-gray-400 mr-1" />
                            {event.departure_time} 출발
                          </div>
                        )}
                        {event.departure_airline && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Plane className="w-4 h-4 text-gray-400 mr-1" />
                            {event.departure_airline}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {event.guides && (
                          <div className="flex items-center text-sm text-gray-900">
                            <UserCheck className="w-4 h-4 text-gray-400 mr-1" />
                            {event.guides.name_ko}
                            {event.guides.is_star_guide && <Star className="w-3 h-3 text-yellow-500 ml-1" />}
                          </div>
                        )}
                        {event.land_companies && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Building2 className="w-4 h-4 text-gray-400 mr-1" />
                            {event.land_companies.company_name}
                          </div>
                        )}
                      </div>
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
                        <div className="text-sm font-medium text-gray-900">
                          ₩{(event.final_price || 0).toLocaleString()}
                        </div>
                        {event.event_price !== event.final_price && (
                          <div className="text-sm text-gray-500 line-through">
                            ₩{(event.event_price || 0).toLocaleString()}
                          </div>
                        )}
                        {event.upselling_enabled && (
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <DollarSign className="w-3 h-3 mr-1" />
                              업셀링
                            </span>
                          </div>
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
                          className="text-blue-600 hover:text-blue-900"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id, event.event_code)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
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
        </div>

        {/* 빈 상태 */}
        {events.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter ? '검색 결과가 없습니다' : '등록된 행사가 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter ? '다른 검색 조건을 시도해보세요.' : '마스터 상품을 기반으로 새 행사를 생성해보세요.'}
            </p>
            {!searchTerm && !statusFilter && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                첫 번째 행사 생성
              </button>
            )}
          </div>
        )}

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