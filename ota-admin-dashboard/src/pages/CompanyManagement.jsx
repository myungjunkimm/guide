// src/pages/CompanyManagement.jsx (Supabase 연동 버전)
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin, AlertCircle, Wifi, WifiOff } from 'lucide-react';
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
    <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
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

// 랜드사 폼 컴포넌트
const CompanyForm = ({ company, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    company_name: company?.company_name || '',
    country: company?.country || '',
    region: company?.region || '',
    contact_person: company?.contact_person || '',
    phone: company?.phone || '',
    email: company?.email || '',
    address: company?.address || '',
    business_registration: company?.business_registration || '',
    status: company?.status || 'active',
    admin_notes: company?.admin_notes || '',
    ...company
  });

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.company_name?.trim()) {
      errors.company_name = '회사명은 필수 입력 항목입니다.';
    }
    
    if (!formData.country?.trim()) {
      errors.country = '국가는 필수 입력 항목입니다.';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 빈 문자열을 null로 변환 (Supabase에서 더 깔끔하게 처리)
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key, 
        value === '' ? null : value
      ])
    );

    onSave(cleanData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {company ? '랜드사 수정' : '새 랜드사 등록'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                랜드사명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.company_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="예: 도쿄 투어 컴퍼니"
              />
              {formErrors.company_name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.company_name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                국가 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.country ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="예: 일본"
              />
              {formErrors.country && (
                <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지역/도시
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 도쿄"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자명
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 김담당"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: +81-3-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="예: info@tokyotour.co.jp"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 일본 도쿄도 신주쿠구..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자등록번호
              </label>
              <input
                type="text"
                value={formData.business_registration}
                onChange={(e) => setFormData({...formData, business_registration: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 123-45-67890"
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
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관리자 메모
              </label>
              <textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="관리자용 내부 메모..."
              />
            </div>
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
              {company ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await companySupabaseApi.getCompanies();
      
      if (result.success) {
        setCompanies(result.data);
        setIsConnected(true);
      } else {
        setError(result.error);
        setIsConnected(false);
      }
    } catch (err) {
      setError(`데이터 로딩 실패: ${err.message}`);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSave = async (companyData) => {
    try {
      setSaving(true);
      setError(null);
      
      let result;
      if (editingCompany) {
        result = await companySupabaseApi.updateCompany(editingCompany.id, companyData);
      } else {
        result = await companySupabaseApi.createCompany(companyData);
      }
      
      if (result.success) {
        setSuccessMessage(result.message || '작업이 완료되었습니다.');
        setShowForm(false);
        setEditingCompany(null);
        loadCompanies();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`저장 실패: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, companyName) => {
    const confirmMessage = `정말로 "${companyName}"을(를) 삭제하시겠습니까?\n\n삭제된 데이터는 복구할 수 없습니다.`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setError(null);
      const result = await companySupabaseApi.deleteCompany(id);
      
      if (result.success) {
        setSuccessMessage(result.message || '랜드사가 삭제되었습니다.');
        loadCompanies();
      } else {
        setError(result.error);
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
          <h1 className="text-2xl font-bold text-gray-900">랜드사 관리</h1>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 랜드사 등록
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
          onRetry={loadCompanies}
          onClose={() => setError(null)}
        />
      )}

      {/* 통계 */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">전체 현황</h2>
          <span className="text-2xl font-bold text-blue-600">{companies.length}개 랜드사</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          활성: {companies.filter(c => c.status === 'active').length}개 | 
          비활성: {companies.filter(c => c.status === 'inactive').length}개
        </div>
      </div>

      {/* 랜드사 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-lg shadow border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                company.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {company.status === 'active' ? '활성' : '비활성'}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {company.company_name}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{company.country}</span>
                {company.region && <span className="text-gray-400 ml-1">/ {company.region}</span>}
              </div>
              {company.contact_person && (
                <div>
                  <span className="font-medium">담당자:</span> {company.contact_person}
                </div>
              )}
              {company.phone && (
                <div>
                  <span className="font-medium">연락처:</span> {company.phone}
                </div>
              )}
              {company.email && (
                <div>
                  <span className="font-medium">이메일:</span> {company.email}
                </div>
              )}
              {company.business_registration && (
                <div className="text-xs text-gray-500">
                  사업자: {company.business_registration}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setEditingCompany(company);
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="수정"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleDelete(company.id, company.company_name)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {companies.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 랜드사가 없습니다</h3>
          <p className="text-gray-600 mb-4">새 랜드사를 등록해서 시작해보세요.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            첫 번째 랜드사 등록
          </button>
        </div>
      )}

      {/* 랜드사 폼 모달 */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCompany(null);
          }}
          isLoading={saving}
        />
      )}
    </div>
  );
};

export default CompanyManagement;