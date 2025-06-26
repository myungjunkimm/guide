// src/pages/GuideManagement.jsx (완전히 개선된 버전)
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Star, Award, AlertCircle, Upload, Camera, Wifi, WifiOff, Instagram, Youtube, Globe } from 'lucide-react';
import guideSupabaseApi from '../services/guideSupabaseApi.js';
import companySupabaseApi from '../services/companySupabaseApi.js';

// 연결 상태 표시 컴포넌트
const ConnectionStatus = ({ isConnected }) => (
  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
    isConnected 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }`}>
    {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
    <span>{isConnected ? 'DB 연결됨' : 'DB 연결 안됨'}</span>
  </div>
);

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">DB에서 데이터를 불러오는 중...</span>
  </div>
);

// 성공 메시지 컴포넌트
const SuccessMessage = ({ message, onClose }) => (
  <div className="bg-green-50 border border-green-200 rounded-md p-4 m-4">
    <div className="flex justify-between items-center">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
      </div>
      <button 
        onClick={onClose}
        className="text-green-400 hover:text-green-600"
      >
        ×
      </button>
    </div>
  </div>
);

// 에러 컴포넌트
const ErrorMessage = ({ message, onRetry, onClose }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
    <div className="flex justify-between items-start">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
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
      {onClose && (
        <button 
          onClick={onClose}
          className="text-red-400 hover:text-red-600 ml-4"
        >
          ×
        </button>
      )}
    </div>
  </div>
);

// 이미지 업로드 컴포넌트
const ImageUpload = ({ currentImage, onImageUpload, isUploading }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    } else {
      alert('이미지 파일만 업로드 가능합니다.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        프로필 이미지
      </label>
      
      {/* 현재 이미지 미리보기 */}
      {currentImage && (
        <div className="flex items-center space-x-4">
          <img 
            src={currentImage} 
            alt="프로필 이미지" 
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
          />
          <span className="text-sm text-gray-600">현재 프로필 이미지</span>
        </div>
      )}

      {/* 파일 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">업로드 중...</span>
          </div>
        ) : (
          <>
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              이미지를 드래그하여 놓거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-gray-500 mb-4">
              JPG, PNG, GIF, WebP (최대 5MB)
            </p>
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              파일 선택
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

// 가이드 폼 컴포넌트
const GuideForm = ({ guide, companies, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name_ko: guide?.name_ko || '',
    phone: guide?.phone || '',
    emergency_phone: guide?.emergency_phone || '',
    email: guide?.email || '',
    guide_type: guide?.guide_type || '전문가이드',
    employment_type: guide?.employment_type || '정규직',
    company_id: guide?.company_id || '',
    languages: guide?.languages || ['한국어'],
    specialties: guide?.specialties || ['문화관광'],
    certification: guide?.certification || '',
    experience_year: guide?.experience_year || 0,
    introduction: guide?.introduction || '',
    motto: guide?.motto || '',
    profile_image: guide?.profile_image || '',
    instagram_url: guide?.instagram_url || '',
    youtube_url: guide?.youtube_url || '',
    blog_url: guide?.blog_url || '',
    status: guide?.status || 'active',
    admin_notes: guide?.admin_notes || '',
    ...guide
  });

  const [languagesInput, setLanguagesInput] = useState(
    Array.isArray(formData.languages) ? formData.languages.join(', ') : '한국어'
  );
  const [specialtiesInput, setSpecialtiesInput] = useState(
    Array.isArray(formData.specialties) ? formData.specialties.join(', ') : '문화관광'
  );
  const [formErrors, setFormErrors] = useState({});
  const [imageUploading, setImageUploading] = useState(false);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name_ko?.trim()) {
      errors.name_ko = '가이드명은 필수 입력 항목입니다.';
    }
    
    if (!formData.email?.trim()) {
      errors.email = '이메일은 필수 입력 항목입니다.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.company_id) {
      errors.company_id = '소속 랜드사를 선택해주세요.';
    }

    if (!formData.phone?.trim()) {
      errors.phone = '연락처는 필수 입력 항목입니다.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = async (file) => {
    try {
      setImageUploading(true);
      
      if (guide?.id) {
        // 기존 가이드 수정 시: Supabase Storage에 업로드
        const result = await guideSupabaseApi.uploadProfileImage(file, guide.id);
        
        if (result.success) {
          setFormData(prev => ({ ...prev, profile_image: result.data.url }));
          alert('프로필 이미지가 성공적으로 업로드되었습니다.');
        } else {
          alert(`이미지 업로드 실패: ${result.error}`);
        }
      } else {
        // 새 가이드 등록 시: 임시로 Base64로 저장 (미리보기용)
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({ ...prev, profile_image: e.target.result }));
        };
        reader.readAsDataURL(file);
        alert('이미지가 임시로 추가되었습니다. 가이드 등록 완료 후 정식 업로드됩니다.');
      }
    } catch (error) {
      alert(`이미지 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 언어와 전문분야를 배열로 변환
    const processedData = {
      ...formData,
      languages: languagesInput.split(',').map(lang => lang.trim()).filter(lang => lang),
      specialties: specialtiesInput.split(',').map(spec => spec.trim()).filter(spec => spec),
      experience_year: parseInt(formData.experience_year) || 0
    };

    // 빈 문자열을 null로 변환
    const cleanData = Object.fromEntries(
      Object.entries(processedData).map(([key, value]) => [
        key, 
        value === '' ? null : value
      ])
    );
    
    onSave(cleanData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {guide ? '가이드 수정' : '새 가이드 등록'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로필 이미지 */}
          <div className="border-b pb-4">
            <ImageUpload
              currentImage={formData.profile_image}
              onImageUpload={handleImageUpload}
              isUploading={imageUploading}
            />
            {!guide && (
              <p className="text-xs text-gray-500 mt-2">
                💡 새 가이드 등록 시: 이미지는 임시로 미리보기되며, 가이드 등록 완료 후 정식 업로드됩니다.
              </p>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-900 mb-3">기본 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가이드명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_ko}
                  onChange={(e) => setFormData({...formData, name_ko: e.target.value})}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name_ko ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="예: 김가이드"
                />
                {formErrors.name_ko && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name_ko}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="예: +81-90-1234-5678"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비상연락처
                </label>
                <input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: +81-90-9876-5432"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="예: guide@example.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가이드 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.guide_type}
                  onChange={(e) => setFormData({...formData, guide_type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="전문가이드">전문가이드</option>
                  <option value="일반가이드">일반가이드</option>
                  <option value="인솔자">인솔자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고용 형태 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="정규직">정규직</option>
                  <option value="프리랜서">프리랜서</option>
                  <option value="파트타임">파트타임</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  소속 랜드사 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.company_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">랜드사를 선택하세요</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.company_name} ({company.country})
                    </option>
                  ))}
                </select>
                {formErrors.company_id && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.company_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경력 (년)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_year}
                  onChange={(e) => setFormData({...formData, experience_year: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="pending">대기</option>
                </select>
              </div>
            </div>
          </div>

          {/* 전문 분야 */}
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-900 mb-3">전문 분야</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가능 언어 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  placeholder="한국어, 영어, 일본어"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">예: 한국어, 영어, 일본어</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전문 분야 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={specialtiesInput}
                  onChange={(e) => setSpecialtiesInput(e.target.value)}
                  placeholder="문화관광, 쇼핑, 미식투어"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">예: 문화관광, 쇼핑, 미식투어</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자격증/인증
                </label>
                <input
                  type="text"
                  value={formData.certification}
                  onChange={(e) => setFormData({...formData, certification: e.target.value})}
                  placeholder="관광가이드 자격증, 언어 인증 등"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 소개 및 SNS */}
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-900 mb-3">소개 및 SNS</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자기소개
                </label>
                <textarea
                  rows="3"
                  value={formData.introduction}
                  onChange={(e) => setFormData({...formData, introduction: e.target.value})}
                  placeholder="가이드 경험과 특징을 소개해주세요"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가이드 모토
                </label>
                <input
                  type="text"
                  value={formData.motto}
                  onChange={(e) => setFormData({...formData, motto: e.target.value})}
                  placeholder="가이드로서의 철학이나 모토"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    인스타그램 URL
                  </label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                    placeholder="https://instagram.com/username"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    유튜브 URL
                  </label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                    placeholder="https://youtube.com/channel/..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    블로그 URL
                  </label>
                  <input
                    type="url"
                    value={formData.blog_url}
                    onChange={(e) => setFormData({...formData, blog_url: e.target.value})}
                    placeholder="https://blog.example.com"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 관리자 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              관리자 메모
            </label>
            <textarea
              rows="2"
              value={formData.admin_notes}
              onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
              placeholder="관리자용 내부 메모..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {guide ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GuideManagement = () => {
  const [guides, setGuides] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedRating, setSelectedRating] = useState(5); // 추가: 평점 선택 state

  const loadGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await guideSupabaseApi.getGuides();
      
      if (result.success) {
        setGuides(result.data);
        setIsConnected(true);
      } else {
        setError(result.error);
        setIsConnected(false);
      }
    } catch (err) {
      setError(`가이드 데이터 로딩 실패: ${err.message}`);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const result = await companySupabaseApi.getActiveCompanies();
      if (result.success) {
        setCompanies(result.data);
      } else {
        console.error('랜드사 로딩 실패:', result.error);
      }
    } catch (err) {
      console.error('랜드사 로딩 실패:', err);
    }
  };

  useEffect(() => {
    loadGuides();
    loadCompanies();
  }, []);

  const handleSave = async (guideData) => {
    try {
      setSaving(true);
      setError(null);
      
      let result;
      if (editingGuide) {
        result = await guideSupabaseApi.updateGuide(editingGuide.id, guideData);
      } else {
        result = await guideSupabaseApi.createGuide(guideData);
        
        // 새 가이드 등록 후 Base64 이미지가 있다면 정식 업로드
        if (result.success && guideData.profile_image && guideData.profile_image.startsWith('data:')) {
          try {
            const response = await fetch(guideData.profile_image);
            const blob = await response.blob();
            const file = new File([blob], 'profile_image.jpg', { type: 'image/jpeg' });
            
            const uploadResult = await guideSupabaseApi.uploadProfileImage(file, result.data.id);
            if (uploadResult.success) {
              console.log('프로필 이미지가 정식으로 업로드되었습니다.');
            }
          } catch (imageError) {
            console.error('이미지 업로드 실패:', imageError);
          }
        }
      }
      
      if (result.success) {
        setSuccessMessage(result.message || '작업이 완료되었습니다.');
        setShowForm(false);
        setEditingGuide(null);
        loadGuides();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`저장 실패: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 개선된 스타가이드 토글 (수동 제어)
  const toggleStarGuide = async (guide) => {
    try {
      setError(null);
      
      const newStatus = !guide.is_star_guide;
      const currentRating = guide.average_rating || 0;
      const currentReviews = guide.total_reviews || 0;
      
      // 자동 승격 조건 확인
      const meetsAutoCondition = currentRating >= 4.0 && currentReviews >= 3;
      
      // 수동 해제 또는 승격 확인
      let confirmMessage;
      if (newStatus) {
        // 스타가이드로 승격
        if (meetsAutoCondition) {
          confirmMessage = `"${guide.name_ko}"를 스타가이드로 승격하시겠습니까?\n\n✅ 자동 승격 조건 충족: 평균 ${currentRating.toFixed(1)}점, ${currentReviews}개 후기`;
        } else {
          confirmMessage = [
            `"${guide.name_ko}"를 스타가이드로 수동 승격하시겠습니까?`,
            ``,
            `⚠️ 자동 승격 조건 미충족:`,
            `현재: 평균 ${currentRating.toFixed(1)}점, ${currentReviews}개 후기`,
            `필요: 평균 4.0점 이상, 3개 이상 후기`,
            ``,
            `수동 승격하시겠습니까?`
          ].join('\n');
        }
      } else {
        // 스타가이드 해제
        confirmMessage = [
          `"${guide.name_ko}"의 스타가이드 상태를 해제하시겠습니까?`,
          ``,
          `현재: 평균 ${currentRating.toFixed(1)}점, ${currentReviews}개 후기`,
          meetsAutoCondition ? `⚠️ 자동 승격 조건을 충족하고 있지만 수동으로 해제됩니다.` : '',
          ``,
          `해제하시겠습니까?`
        ].join('\n');
      }
      
      const userConfirmed = confirm(confirmMessage);
      if (!userConfirmed) return;
      
      const result = await guideSupabaseApi.toggleStarGuide(guide.id, newStatus, true); // 수동 플래그 추가
      
      if (result.success) {
        setSuccessMessage(result.message || '스타가이드 상태가 변경되었습니다.');
        loadGuides();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`스타가이드 상태 변경 실패: ${err.message}`);
    }
  };

  // 개선된 테스트 후기 추가
  const testAddReview = async (guideId, rating = 5) => {
    try {
      console.log('🚀 testAddReview 호출:', { guideId, rating, type: typeof guideId });
      
      setError(null);
      
      if (!guideId) {
        throw new Error('가이드 ID가 없습니다');
      }
      
      const result = await guideSupabaseApi.addTestReview(guideId, rating);
      
      if (result.success) {
        setSuccessMessage(result.message || '테스트 후기가 추가되었습니다.');
        loadGuides();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('💥 testAddReview 에러:', err);
      setError(`테스트 후기 추가 실패: ${err.message}`);
    }
  };

  // 일괄 후기 추가 함수
  const batchAddReviews = async (rating) => {
    const confirmMessage = `모든 가이드(${guides.length}명)에게 ${rating}점 후기를 추가하시겠습니까?`;
    if (!confirm(confirmMessage)) return;
    
    try {
      setError(null);
      let successCount = 0;
      
      for (const guide of guides) {
        const result = await guideSupabaseApi.addTestReview(guide.id, rating);
        if (result.success) successCount++;
      }
      
      setSuccessMessage(`${successCount}명의 가이드에게 ${rating}점 후기가 추가되었습니다.`);
      loadGuides();
    } catch (err) {
      setError(`일괄 후기 추가 실패: ${err.message}`);
    }
  };

  // 3개 연속 5점 후기 추가 함수
  const addMultipleReviews = async () => {
    const firstGuide = guides[0];
    if (!firstGuide) return;
    
    const confirmMessage = `"${firstGuide.name_ko}"에게 5점 후기를 3개 연속 추가하여 스타가이드 승격을 테스트하시겠습니까?`;
    if (!confirm(confirmMessage)) return;
    
    try {
      setError(null);
      
      for (let i = 0; i < 3; i++) {
        const result = await guideSupabaseApi.addTestReview(firstGuide.id, 5);
        if (!result.success) {
          throw new Error(`${i + 1}번째 후기 추가 실패: ${result.error}`);
        }
      }
      
      setSuccessMessage(`${firstGuide.name_ko}에게 5점 후기 3개가 추가되었습니다! 스타가이드 승격 여부를 확인하세요.`);
      loadGuides();
    } catch (err) {
      setError(`연속 후기 추가 실패: ${err.message}`);
    }
  };

  // 개선된 삭제 함수
  const handleDelete = async (id, guideName) => {
    try {
      setError(null);
      
      // 1단계: 먼저 후기 확인 (강제 삭제 없이)
      const checkResult = await guideSupabaseApi.deleteGuide(id, false);
      
      if (!checkResult.success && checkResult.data?.needsConfirmation) {
        // 후기가 있는 경우 - 사용자에게 확인
        const reviewCount = checkResult.data.reviewCount;
        const reviewPreview = checkResult.data.reviews
          ?.map(r => `"${r.guide_review.substring(0, 50)}..."`)
          .join('\n') || '';
        
        const confirmMessage = [
          `"${guideName}" 가이드를 삭제하려고 합니다.`,
          ``,
          `⚠️ 이 가이드에는 ${reviewCount}개의 후기가 연결되어 있습니다:`,
          reviewPreview,
          ``,
          `삭제 옵션을 선택하세요:`,
          ``,
          `[확인] = 가이드와 모든 후기를 함께 삭제`,
          `[취소] = 삭제 취소`,
          ``,
          `⚠️ 삭제된 데이터는 복구할 수 없습니다!`
        ].join('\n');
        
        const userConfirmed = confirm(confirmMessage);
        
        if (!userConfirmed) {
          return; // 사용자가 취소
        }
        
        // 2단계: 사용자가 확인한 경우 강제 삭제 실행
        const forceResult = await guideSupabaseApi.deleteGuide(id, true);
        
        if (forceResult.success) {
          setSuccessMessage(forceResult.message);
          loadGuides();
        } else {
          setError(forceResult.error);
        }
      } else if (checkResult.success) {
        // 후기가 없어서 바로 삭제된 경우
        setSuccessMessage(checkResult.message);
        loadGuides();
      } else {
        // 다른 오류
        setError(checkResult.error);
      }
    } catch (err) {
      setError(`삭제 실패: ${err.message}`);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">가이드 관리</h1>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 가이드 등록
        </button>
      </div>

      {/* 성공 메시지 */}
      {successMessage && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setSuccessMessage('')}
        />
      )}

      {/* 에러 메시지 */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={loadGuides}
          onClose={() => setError(null)}
        />
      )}

      {/* 개선된 테스트 기능 */}
      {guides.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">테스트 기능</h3>
          <p className="text-sm text-yellow-700 mb-3">
            가이드에게 테스트 후기를 추가하여 스타가이드 자동 승격을 확인할 수 있습니다.
          </p>
          
          {/* 평점 선택 드롭다운 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-yellow-800 mb-1">
              추가할 평점 선택:
            </label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(parseInt(e.target.value))}
              className="px-3 py-1 border border-yellow-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value={1}>⭐ 1점 (매우 불만족)</option>
              <option value={2}>⭐⭐ 2점 (불만족)</option>
              <option value={3}>⭐⭐⭐ 3점 (보통)</option>
              <option value={4}>⭐⭐⭐⭐ 4점 (만족)</option>
              <option value={5}>⭐⭐⭐⭐⭐ 5점 (매우 만족)</option>
            </select>
          </div>
          
          {/* 가이드별 테스트 버튼 */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {guides.slice(0, 5).map(guide => (
                <div key={guide.id} className="flex items-center space-x-2">
                  <button
                    onClick={() => testAddReview(guide.id, selectedRating)}
                    className={`text-xs px-3 py-1 rounded hover:opacity-80 transition-colors ${
                      selectedRating >= 4 
                        ? 'bg-green-600 text-white' 
                        : selectedRating === 3 
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {guide.name_ko}에게 {selectedRating}점 추가
                  </button>
                  
                  {/* 현재 평점 표시 */}
                  <span className="text-xs text-gray-600">
                    (현재: {guide.average_rating?.toFixed(1) || '0.0'}점, 
                    {guide.total_reviews || 0}개 후기)
                  </span>
                </div>
              ))}
            </div>
            
            {/* 일괄 테스트 버튼 */}
            <div className="flex space-x-2 mt-3 pt-2 border-t border-yellow-200">
              <button
                onClick={() => batchAddReviews(selectedRating)}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  selectedRating >= 4 
                    ? 'bg-green-700 text-white hover:bg-green-800' 
                    : selectedRating === 3 
                    ? 'bg-yellow-700 text-white hover:bg-yellow-800'
                    : 'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                모든 가이드에게 {selectedRating}점 추가
              </button>
              
              <button
                onClick={() => addMultipleReviews()}
                className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                3개 연속 5점 후기 추가 (스타가이드 테스트)
              </button>
            </div>
          </div>
          
          {/* 통계 표시 */}
          <div className="mt-3 pt-2 border-t border-yellow-200">
            <p className="text-xs text-yellow-700">
              💡 <strong>스타가이드 승격 조건:</strong> 평균 4.0점 이상 + 3개 이상 후기
            </p>
          </div>
        </div>
      )}

      {/* 통계 */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">전체 가이드</h3>
            <p className="text-2xl font-bold text-blue-600">{guides.length}명</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">스타가이드</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {guides.filter(g => g.is_star_guide).length}명
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">활성 가이드</h3>
            <p className="text-2xl font-bold text-green-600">
              {guides.filter(g => g.status === 'active').length}명
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">평균 평점</h3>
            <p className="text-2xl font-bold text-purple-600">
              {guides.length > 0 
                ? (guides.reduce((sum, g) => sum + (g.average_rating || 0), 0) / guides.length).toFixed(1)
                : '0.0'
              }점
            </p>
          </div>
        </div>
      </div>

      {/* 가이드 테이블 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                가이드정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                소속 랜드사
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                평가
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SNS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                스타가이드
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {guides.map((guide) => (
              <tr key={guide.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                      {guide.profile_image ? (
                        <img 
                          src={guide.profile_image} 
                          alt={guide.name_ko}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{guide.name_ko}</div>
                      <div className="text-sm text-gray-500">{guide.guide_id}</div>
                      <div className="text-xs text-gray-400">
                        {guide.experience_year}년 경력 | {guide.guide_type}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium">
                      {guide.company ? guide.company.company_name : '미배정'}
                    </div>
                    {guide.company && (
                      <div className="text-xs text-gray-400">
                        {guide.company.country} {guide.company.region}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900 font-medium">
                        {guide.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {guide.total_reviews || 0}개 후기
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {/* 인스타그램 아이콘 */}
                    {guide.instagram_url ? (
                      <a 
                        href={guide.instagram_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-700 transition-colors"
                        title="인스타그램 보기"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    ) : (
                      <Instagram className="h-4 w-4 text-gray-300" title="인스타그램 없음" />
                    )}
                    
                    {/* 유튜브 아이콘 */}
                    {guide.youtube_url ? (
                      <a 
                        href={guide.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="유튜브 보기"
                      >
                        <Youtube className="h-4 w-4" />
                      </a>
                    ) : (
                      <Youtube className="h-4 w-4 text-gray-300" title="유튜브 없음" />
                    )}
                    
                    {/* 블로그 아이콘 */}
                    {guide.blog_url ? (
                      <a 
                        href={guide.blog_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="블로그 보기"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    ) : (
                      <Globe className="h-4 w-4 text-gray-300" title="블로그 없음" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleStarGuide(guide)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      guide.is_star_guide
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Award className="h-3 w-3 mr-1" />
                    {guide.is_star_guide ? '스타가이드' : '일반가이드'}
                  </button>
                  {guide.is_star_guide && guide.star_guide_since && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(guide.star_guide_since).toLocaleDateString()} 부터
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    guide.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : guide.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {guide.status === 'active' ? '활성' 
                     : guide.status === 'pending' ? '대기' 
                     : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setEditingGuide(guide);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="수정"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(guide.id, guide.name_ko)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 빈 상태 */}
      {guides.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 가이드가 없습니다</h3>
          <p className="text-gray-600 mb-4">새 가이드를 등록해서 시작해보세요.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            첫 번째 가이드 등록
          </button>
        </div>
      )}

      {/* 가이드 폼 모달 */}
      {showForm && (
        <GuideForm
          guide={editingGuide}
          companies={companies}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingGuide(null);
          }}
          isLoading={saving}
        />
      )}
    </div>
  );
};

export default GuideManagement;