// src/pages/MasterProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Star, Calendar, MapPin, Plane, Users, DollarSign, Search, Eye, EyeOff } from 'lucide-react';

// API 서비스 import
import masterProductService from '../services/masterProductService';
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

// 상품 폼 컴포넌트
const ProductForm = ({ product, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    product_code: product?.product_code || '',
    product_name: product?.product_name || '',
    base_price: product?.base_price || '',
    duration_nights: product?.duration_nights || 3,
    duration_days: product?.duration_days || 4,
    destination_country: product?.destination_country || '',
    destination_city: product?.destination_city || '',
    description: product?.description || '',
    min_participants: product?.min_participants || 1,
    max_participants: product?.max_participants || 30,
    base_airline: product?.base_airline || '',
    is_star_guide_product: product?.is_star_guide_product || false,
    status: product?.status || 'active',
    // 업셀링 필드 추가
    upselling_enabled: product?.upselling_enabled || false,
    upselling_rate: product?.upselling_rate || 0,
    guide_commission_rate: product?.guide_commission_rate || 0,
    company_commission_rate: product?.company_commission_rate || 0,
    ota_commission_rate: product?.ota_commission_rate || 0,
    // 이미지 필드 추가
    product_images: product?.product_images || []
  });

  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  // 이미지 미리보기 설정
  useEffect(() => {
    if (product?.product_images) {
      setImagePreview(product.product_images.map(url => ({ url, isExisting: true })));
    }
  }, [product]);

  // 업셀링 활성화 시 기본값 10% 설정
  const handleUpsellingToggle = (enabled) => {
    if (enabled) {
      // 체크 시 바로 10% (3:3:4 비율) 설정
      setFormData({
        ...formData,
        upselling_enabled: true,
        upselling_rate: 0.10,
        guide_commission_rate: 0.03,
        company_commission_rate: 0.03,
        ota_commission_rate: 0.04
      });
    } else {
      // 체크 해제 시 모든 비율 0으로
      setFormData({
        ...formData,
        upselling_enabled: false,
        upselling_rate: 0,
        guide_commission_rate: 0,
        company_commission_rate: 0,
        ota_commission_rate: 0
      });
    }
  };

  // 총 업셀링 비율 변경 시 3:3:4 비율로 자동 분배
  const handleUpsellingRateChange = (totalRate) => {
    const rate = totalRate / 100 || 0;
    setFormData({
      ...formData,
      upselling_rate: rate,
      guide_commission_rate: rate * 0.3,
      company_commission_rate: rate * 0.3,
      ota_commission_rate: rate * 0.4
    });
  };

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = imagePreview.length + files.length;
    
    if (totalImages > 5) {
      alert('이미지는 최대 5개까지 업로드 가능합니다.');
      return;
    }

    // 파일 미리보기 생성
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      file: file,
      isExisting: false
    }));

    setImagePreview(prev => [...prev, ...newPreviews]);
    setImageFiles(prev => [...prev, ...files]);
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index) => {
    const removedImage = imagePreview[index];
    
    if (!removedImage.isExisting && removedImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedImage.url);
    }

    setImagePreview(prev => prev.filter((_, i) => i !== index));
    
    if (!removedImage.isExisting) {
      setImageFiles(prev => prev.filter((_, i) => {
        const previewIndex = imagePreview.findIndex((p, idx) => idx === index && !p.isExisting);
        return i !== previewIndex;
      }));
    }
  };

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      imagePreview.forEach(img => {
        if (!img.isExisting && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.product_code.trim()) {
      newErrors.product_code = '상품 코드는 필수입니다.';
    }
    
    if (!formData.product_name.trim()) {
      newErrors.product_name = '상품명은 필수입니다.';
    }

    if (!formData.base_price || formData.base_price <= 0) {
      newErrors.base_price = '올바른 가격을 입력해주세요.';
    }

    if (!formData.destination_country.trim()) {
      newErrors.destination_country = '목적지 국가는 필수입니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const processedData = {
      ...formData,
      base_price: parseFloat(formData.base_price),
      duration_days: parseInt(formData.duration_days),
      duration_nights: parseInt(formData.duration_nights),
      min_participants: parseInt(formData.min_participants),
      max_participants: parseInt(formData.max_participants),
      // 이미지 데이터 준비
      product_images: [
        ...imagePreview.filter(img => img.isExisting).map(img => img.url),
        ...imageFiles.map(file => ({ file }))
      ]
    };

    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? '상품 수정' : '새 상품 등록'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.product_code}
                  onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.product_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="예: JP-TK-001"
                />
                {errors.product_code && (
                  <p className="text-red-500 text-xs mt-1">{errors.product_code}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="예: 도쿄 클래식 투어"
                />
                {errors.product_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기본 가격 (₩) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.base_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="예: 890000"
                />
                {errors.base_price && (
                  <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  여행 기간
                </label>
                <select
                  value={formData.duration_nights}
                  onChange={(e) => {
                    const nights = parseInt(e.target.value);
                    setFormData({
                      ...formData, 
                      duration_nights: nights,
                      duration_days: nights + 1
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1박 2일</option>
                  <option value={2}>2박 3일</option>
                  <option value={3}>3박 4일</option>
                  <option value={4}>4박 5일</option>
                  <option value={5}>5박 6일</option>
                  <option value={6}>6박 7일</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  목적지 국가 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.destination_country}
                  onChange={(e) => setFormData({...formData, destination_country: e.target.value, destination_city: ''})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.destination_country ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">국가 선택</option>
                  <option value="일본">일본</option>
                  <option value="태국">태국</option>
                  <option value="베트남">베트남</option>
                  <option value="싱가포르">싱가포르</option>
                  <option value="대만">대만</option>
                </select>
                {errors.destination_country && (
                  <p className="text-red-500 text-xs mt-1">{errors.destination_country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  목적지 도시
                </label>
                <select
                  value={formData.destination_city}
                  onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.destination_country}
                >
                  <option value="">도시 선택</option>
                  {formData.destination_country === '일본' && (
                    <>
                      <option value="도쿄">도쿄</option>
                      <option value="오사카">오사카</option>
                      <option value="교토">교토</option>
                      <option value="후쿠오카">후쿠오카</option>
                    </>
                  )}
                  {formData.destination_country === '태국' && (
                    <>
                      <option value="방콕">방콕</option>
                      <option value="푸켓">푸켓</option>
                      <option value="파타야">파타야</option>
                    </>
                  )}
                  {formData.destination_country === '베트남' && (
                    <>
                      <option value="호치민">호치민</option>
                      <option value="하노이">하노이</option>
                      <option value="다낭">다낭</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기본 항공편
                </label>
                <select
                  value={formData.base_airline}
                  onChange={(e) => setFormData({...formData, base_airline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">항공편 선택</option>
                  <option value="대한항공">대한항공</option>
                  <option value="아시아나항공">아시아나항공</option>
                  <option value="제주항공">제주항공</option>
                  <option value="진에어">진에어</option>
                  <option value="JAL">JAL</option>
                  <option value="ANA">ANA</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_star_guide_product"
                  checked={formData.is_star_guide_product}
                  onChange={(e) => setFormData({...formData, is_star_guide_product: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <label htmlFor="is_star_guide_product" className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  스타가이드 전용
                </label>
              </div>
            </div>

            {/* 참가자 설정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 참가자 수
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.min_participants}
                  onChange={(e) => setFormData({...formData, min_participants: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 참가자 수
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 상품 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 설명
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="상품에 대한 자세한 설명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 상품 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 이미지 (최대 5개)
              </label>
              
              {/* 이미지 미리보기 */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {imagePreview.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.url}
                        alt={`상품 이미지 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                      {img.isExisting && (
                        <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          기존
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 이미지 업로드 버튼 */}
              {imagePreview.length < 5 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="product_images"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="product_images"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">이미지 업로드</span>
                    <span className="text-sm text-gray-500">클릭하여 이미지를 선택하세요</span>
                    <span className="text-xs text-gray-400 mt-1">
                      {imagePreview.length}/5개 등록됨
                    </span>
                  </label>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, GIF 파일을 업로드할 수 있습니다. 각 파일은 최대 5MB까지 가능합니다.
              </p>
            </div>
           
            {/* 업셀링 및 커미션 설정 */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                업셀링 및 커미션 설정
              </h4>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="upselling_enabled"
                  checked={formData.upselling_enabled}
                  onChange={(e) => handleUpsellingToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="upselling_enabled" className="ml-3 text-sm font-medium text-gray-700">
                  업셀링 활성화 
                  <span className="text-gray-500 ml-1">(체크 시 자동으로 10% 설정됩니다)</span>
                </label>
              </div>

              {formData.upselling_enabled && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        총 업셀링 비율 (%) *
                      </label>
                      <input
                        type="text"
                        value={(formData.upselling_rate * 100).toFixed(1)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value >= 0 && value <= 50) {
                            handleUpsellingRateChange(value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">직접 입력 (최대 50%)</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        가이드 커미션 (30%)
                      </label>
                      <input
                        type="text"
                        value={(formData.guide_commission_rate * 100).toFixed(1)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFormData({...formData, guide_commission_rate: value / 100});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="3.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">개별 조정 가능</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        랜드사 커미션 (30%)
                      </label>
                      <input
                        type="text"
                        value={(formData.company_commission_rate * 100).toFixed(1)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFormData({...formData, company_commission_rate: value / 100});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="3.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">개별 조정 가능</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OTA 커미션 (40%)
                      </label>
                      <input
                        type="text"
                        value={(formData.ota_commission_rate * 100).toFixed(1)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFormData({...formData, ota_commission_rate: value / 100});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="4.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">개별 조정 가능</p>
                    </div>
                  </div>
                  
                  {/* 실시간 계산 미리보기 */}
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 mb-2">💰 수익 계산 미리보기</div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-blue-600 font-medium">가이드</div>
                          <div className="text-xs text-gray-500">₩{((formData.base_price || 0) * formData.guide_commission_rate).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-green-600 font-medium">랜드사</div>
                          <div className="text-xs text-gray-500">₩{((formData.base_price || 0) * formData.company_commission_rate).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-purple-600 font-medium">OTA</div>
                          <div className="text-xs text-gray-500">₩{((formData.base_price || 0) * formData.ota_commission_rate).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t text-center">
                        <div className="text-gray-600">총 업셀링 수익: ₩{((formData.base_price || 0) * formData.upselling_rate).toLocaleString()}</div>
                        <div className="text-gray-600">업셀링 적용가: ₩{((formData.base_price || 0) * (1 + formData.upselling_rate)).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!formData.upselling_enabled && (
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                  <div className="flex items-center gap-2">
                    <span>💡</span>
                    <div>
                      <div className="font-medium">업셀링이 비활성화되어 있습니다</div>
                      <div className="mt-1">활성화하면 이 상품으로 생성된 모든 행사에 업셀링 기본값이 적용됩니다. 각 행사에서 개별 조정도 가능합니다.</div>
                    </div>
                  </div>
                </div>
              )}
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
                {product ? '수정 완료' : '상품 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MasterProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 실제 API를 사용한 데이터 로드
  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Supabase 연결 확인
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (connected) {
        // 실제 API 호출
        const filters = { search: searchTerm };
        const { data, error } = await masterProductService.getAll(filters);
        
        if (error) {
          console.error('API 오류:', error);
          setProducts(getDummyData());
        } else {
          setProducts(data);
        }
      } else {
        setProducts(getDummyData());
      }
    } catch (err) {
      console.error('데이터 로딩 오류:', err);
      setIsConnected(false);
      setProducts(getDummyData());
    } finally {
      setLoading(false);
    }
  };

  // 더미 데이터 (업셀링 필드 포함)
  const getDummyData = () => {
    const dummyProducts = [
      {
        id: '1',
        product_code: 'JP-TK-001',
        product_name: '도쿄 클래식 투어',
        base_price: 890000,
        duration_nights: 3,
        duration_days: 4,
        destination_country: '일본',
        destination_city: '도쿄',
        base_airline: 'JAL',
        is_star_guide_product: true,
        min_participants: 2,
        max_participants: 20,
        status: 'active',
        description: '도쿄의 주요 명소를 둘러보는 클래식한 투어입니다.',
        product_images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&h=200&fit=crop'],
        // 업셀링 필드 추가
        upselling_enabled: true,
        upselling_rate: 0.10, // 10%
        guide_commission_rate: 0.03, // 3%
        company_commission_rate: 0.03, // 3%
        ota_commission_rate: 0.04 // 4%
      },
      {
        id: '2',
        product_code: 'JP-OS-002',
        product_name: '오사카 맛집 투어',
        base_price: 650000,
        duration_nights: 2,
        duration_days: 3,
        destination_country: '일본',
        destination_city: '오사카',
        base_airline: 'ANA',
        is_star_guide_product: false,
        min_participants: 4,
        max_participants: 15,
        status: 'active',
        description: '오사카의 유명한 맛집들을 탐방하는 미식 투어입니다.',
        product_images: ['https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop'],
        // 업셀링 필드 추가
        upselling_enabled: true,
        upselling_rate: 0.12, // 12%
        guide_commission_rate: 0.036, // 3.6%
        company_commission_rate: 0.036, // 3.6%
        ota_commission_rate: 0.048 // 4.8%
      },
      {
        id: '3',
        product_code: 'TH-BK-001',
        product_name: '방콕 자유여행',
        base_price: 450000,
        duration_nights: 4,
        duration_days: 5,
        destination_country: '태국',
        destination_city: '방콕',
        base_airline: '제주항공',
        is_star_guide_product: false,
        min_participants: 1,
        max_participants: 25,
        status: 'active',
        description: '방콕에서 즐기는 자유로운 여행입니다.',
        product_images: [],
        // 업셀링 비활성화
        upselling_enabled: false,
        upselling_rate: 0,
        guide_commission_rate: 0,
        company_commission_rate: 0,
        ota_commission_rate: 0
      }
    ];
    
    // 검색 필터 적용
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return dummyProducts.filter(product =>
        product.product_name.toLowerCase().includes(searchLower) ||
        product.product_code.toLowerCase().includes(searchLower) ||
        product.destination_country.toLowerCase().includes(searchLower)
      );
    }
    
    return dummyProducts;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSave = async (productData) => {
    try {
      setSaving(true);
      
      if (isConnected) {
        let result;
        if (editingProduct) {
          result = await masterProductService.update(editingProduct.id, productData);
        } else {
          result = await masterProductService.create(productData);
        }
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setSuccessMessage(editingProduct ? '상품이 수정되었습니다.' : '새 상품이 등록되었습니다.');
        await loadProducts();
      } else {
        // 더미 데이터 모드
        if (editingProduct) {
          setProducts(prev => prev.map(p => 
            p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
          ));
          setSuccessMessage('상품이 수정되었습니다.');
        } else {
          const newProduct = {
            ...productData,
            id: Date.now().toString(),
            product_images: []
          };
          setProducts(prev => [...prev, newProduct]);
          setSuccessMessage('새 상품이 등록되었습니다.');
        }
      }
      
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('저장 오류:', err);
      setSuccessMessage(`저장 실패: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, productName) => {
    if (!window.confirm(`정말로 "${productName}" 상품을 삭제하시겠습니까?`)) return;
    
    try {
      if (isConnected) {
        const { success, error } = await masterProductService.delete(id);
        
        if (error) {
          throw new Error(error);
        }
        
        if (success) {
          setSuccessMessage('상품이 삭제되었습니다.');
          await loadProducts();
        }
      } else {
        setProducts(prev => prev.filter(p => p.id !== id));
        setSuccessMessage('상품이 삭제되었습니다.');
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      setSuccessMessage(`삭제 실패: ${err.message}`);
    }
  };

  const stats = {
    total: products.length,
    starGuide: products.filter(p => p.is_star_guide_product).length,
    active: products.filter(p => p.status === 'active').length,
    upsellingEnabled: products.filter(p => p.upselling_enabled).length,
    avgPrice: products.length > 0 
      ? Math.round(products.reduce((sum, p) => sum + (p.base_price || 0), 0) / products.length / 1000)
      : 0
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              마스터 상품 관리
            </h1>
            <p className="text-gray-600 mt-1">여행 상품의 기본 템플릿을 관리합니다</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus isConnected={isConnected} />
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              새 상품 등록
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
                <p className="text-sm font-medium text-gray-600">전체 상품</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">업셀링 활성화</p>
                <p className="text-2xl font-bold text-green-600">{stats.upsellingEnabled}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">스타가이드 상품</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.starGuide}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 가격</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgPrice}만원</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="상품명, 상품코드, 목적지로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상품 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    목적지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간/가격
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    참가자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업셀링
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    특성
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {product.product_images && product.product_images.length > 0 ? (
                            <img 
                              src={product.product_images[0]} 
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <Package className={`w-6 h-6 text-gray-400 ${
                            product.product_images && product.product_images.length > 0 ? 'hidden' : 'block'
                          }`} />
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{product.product_name}</div>
                          <div className="text-sm text-gray-500">{product.product_code}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.destination_country}</div>
                          {product.destination_city && (
                            <div className="text-sm text-gray-500">{product.destination_city}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {product.duration_nights}박 {product.duration_days}일
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          ₩{(product.base_price || 0).toLocaleString()}
                        </div>
                        {product.base_airline && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Plane className="w-4 h-4 text-gray-400 mr-1" />
                            {product.base_airline}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        {product.min_participants} ~ {product.max_participants}명
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        {product.upselling_enabled ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              업셀링 {(product.upselling_rate * 100).toFixed(1)}%
                            </span>
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                              <div>가이드: {(product.guide_commission_rate * 100).toFixed(1)}%</div>
                              <div>랜드사: {(product.company_commission_rate * 100).toFixed(1)}%</div>
                              <div>OTA: {(product.ota_commission_rate * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            비활성
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {product.is_star_guide_product && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            스타가이드
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id, product.product_name)}
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
        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '등록된 상품이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? '다른 검색어를 시도해보세요.' : '새 마스터 상품을 등록해서 시작해보세요.'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                첫 번째 상품 등록
              </button>
            )}
          </div>
        )}

        {/* 상품 폼 모달 */}
        {showForm && (
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
            isLoading={saving}
          />
        )}
      </div>
    </div>
  );
};

export default MasterProductManagement;