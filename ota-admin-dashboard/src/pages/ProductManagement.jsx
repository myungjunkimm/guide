// src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
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

// 상품 폼 컴포넌트
const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    product_name: product?.product_name || '',
    product_code: product?.product_code || '',
    base_price: product?.base_price || '',
    destination_country: product?.destination_country || '',
    destination_city: product?.destination_city || '',
    duration_days: product?.duration_days || '',
    upselling_enabled: product?.upselling_enabled || false,
    upselling_rate: product?.upselling_rate || 0,
    guide_commission_rate: product?.guide_commission_rate || 0,
    company_commission_rate: product?.company_commission_rate || 0,
    ota_commission_rate: product?.ota_commission_rate || 0,
    ...product
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {product ? '상품 수정' : '새 상품 등록'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상품명 *
              </label>
              <input
                type="text"
                required
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상품코드 *
              </label>
              <input
                type="text"
                required
                value={formData.product_code}
                onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기본 가격 *
              </label>
              <input
                type="number"
                required
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: parseInt(e.target.value) || 0})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                여행 기간 (일) *
              </label>
              <input
                type="number"
                required
                value={formData.duration_days}
                onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 0})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                목적지 국가 *
              </label>
              <input
                type="text"
                required
                value={formData.destination_country}
                onChange={(e) => setFormData({...formData, destination_country: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                목적지 도시 *
              </label>
              <input
                type="text"
                required
                value={formData.destination_city}
                onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">업셀링 설정</h4>
            
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="upselling_enabled"
                checked={formData.upselling_enabled}
                onChange={(e) => setFormData({...formData, upselling_enabled: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="upselling_enabled" className="ml-2 text-sm text-gray-700">
                업셀링 활성화
              </label>
            </div>

            {formData.upselling_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전체 업셀링 비율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={(formData.upselling_rate * 100).toFixed(1)}
                    onChange={(e) => setFormData({...formData, upselling_rate: parseFloat(e.target.value) / 100})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가이드 배분 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={(formData.guide_commission_rate * 100).toFixed(1)}
                    onChange={(e) => setFormData({...formData, guide_commission_rate: parseFloat(e.target.value) / 100})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    랜드사 배분 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={(formData.company_commission_rate * 100).toFixed(1)}
                    onChange={(e) => setFormData({...formData, company_commission_rate: parseFloat(e.target.value) / 100})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OTA 배분 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={(formData.ota_commission_rate * 100).toFixed(1)}
                    onChange={(e) => setFormData({...formData, ota_commission_rate: parseFloat(e.target.value) / 100})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {product ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await mockApiService.getMasterProducts();
      setProducts(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        await mockApiService.updateMasterProduct(editingProduct.id, productData);
      } else {
        await mockApiService.createMasterProduct(productData);
      }
      setShowForm(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await mockApiService.deleteMasterProduct(id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadProducts} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 상품 등록
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상품명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                코드
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                목적지
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기본가격
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                업셀링
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
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                  <div className="text-sm text-gray-500">{product.duration_days}일</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.product_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.destination_country} {product.destination_city}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₩{product.base_price?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.upselling_enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.upselling_enabled ? `${(product.upselling_rate * 100).toFixed(1)}%` : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'active' ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="수정"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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

      {/* 상품 폼 모달 */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductManagement;