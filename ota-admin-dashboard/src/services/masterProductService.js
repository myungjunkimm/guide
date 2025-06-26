// src/services/masterProductService.js
import { supabase } from '../lib/supabase';

// 스토리지 설정
const STORAGE_BUCKET = 'product-images';

/**
 * 마스터 상품 서비스
 * 모든 API 호출을 중앙에서 관리
 */
class MasterProductService {
  /**
   * 모든 마스터 상품 조회
   */
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('master_products')
        .select('*')
        .order('created_at', { ascending: false });

      // 필터 적용
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.destination_country && filters.destination_country !== 'all') {
        query = query.eq('destination_country', filters.destination_country);
      }

      if (filters.is_star_guide_product !== undefined) {
        query = query.eq('is_star_guide_product', filters.is_star_guide_product);
      }

      // 업셀링 활성화 필터 추가
      if (filters.upselling_enabled !== undefined) {
        query = query.eq('upselling_enabled', filters.upselling_enabled);
      }

      // 검색어 적용
      if (filters.search) {
        query = query.or(`
          product_name.ilike.%${filters.search}%,
          product_code.ilike.%${filters.search}%,
          destination_country.ilike.%${filters.search}%,
          destination_city.ilike.%${filters.search}%
        `);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('MasterProductService.getAll 오류:', error);
      return { data: [], error: error.message };
    }
  }

  /**
   * 특정 마스터 상품 조회
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('master_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('MasterProductService.getById 오류:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * 상품 코드 중복 확인
   */
  async checkCodeDuplicate(productCode, excludeId = null) {
    try {
      let query = supabase
        .from('master_products')
        .select('id')
        .eq('product_code', productCode);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { isDuplicate: data && data.length > 0, error: null };
    } catch (error) {
      console.error('MasterProductService.checkCodeDuplicate 오류:', error);
      return { isDuplicate: false, error: error.message };
    }
  }

  /**
   * 이미지 업로드
   */
  async uploadImage(file, productCode) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${productCode}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('MasterProductService.uploadImage 오류:', error);
      return { url: null, error: error.message };
    }
  }

  /**
   * 다중 이미지 업로드
   */
  async uploadMultipleImages(files, productCode) {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, productCode));
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results
        .filter(result => result.url)
        .map(result => result.url);
      
      const errors = results
        .filter(result => result.error)
        .map(result => result.error);

      return { 
        urls: successfulUploads, 
        error: errors.length > 0 ? errors.join(', ') : null 
      };
    } catch (error) {
      console.error('MasterProductService.uploadMultipleImages 오류:', error);
      return { urls: [], error: error.message };
    }
  }

  /**
   * 이미지 삭제
   */
  async deleteImage(imageUrl) {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl('');
      
      const filePath = imageUrl.replace(publicUrl, '');

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('MasterProductService.deleteImage 오류:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 업셀링 데이터 검증 함수
   */
  validateUpsellingData(data) {
    const validated = { ...data };

    // 업셀링이 활성화된 경우 필수 검증
    if (validated.upselling_enabled) {
      // 비율 범위 검증 (0-50%)
      validated.upselling_rate = Math.max(0, Math.min(0.5, validated.upselling_rate || 0));
      validated.guide_commission_rate = Math.max(0, validated.guide_commission_rate || 0);
      validated.company_commission_rate = Math.max(0, validated.company_commission_rate || 0);
      validated.ota_commission_rate = Math.max(0, validated.ota_commission_rate || 0);

      // 커미션 합계 검증
      const totalCommission = validated.guide_commission_rate + 
                             validated.company_commission_rate + 
                             validated.ota_commission_rate;

      if (Math.abs(totalCommission - validated.upselling_rate) > 0.001) {
        console.warn('커미션 합계가 총 업셀링 비율과 일치하지 않습니다:', {
          total: validated.upselling_rate,
          commission: totalCommission
        });
      }
    } else {
      // 업셀링 비활성화 시 모든 비율을 0으로 설정
      validated.upselling_rate = 0;
      validated.guide_commission_rate = 0;
      validated.company_commission_rate = 0;
      validated.ota_commission_rate = 0;
    }

    return validated;
  }

  /**
   * 새 마스터 상품 생성
   */
  async create(productData) {
    try {
      // 상품 코드 중복 확인
      const { isDuplicate } = await this.checkCodeDuplicate(productData.product_code);
      if (isDuplicate) {
        throw new Error('이미 존재하는 상품 코드입니다.');
      }

      // 업셀링 데이터 검증
      const validatedData = this.validateUpsellingData(productData);

      // 이미지 업로드 처리
      let processedImages = [];
      if (validatedData.product_images && validatedData.product_images.length > 0) {
        const imageFiles = validatedData.product_images.filter(img => img.file);
        if (imageFiles.length > 0) {
          const files = imageFiles.map(img => img.file);
          const { urls, error: uploadError } = await this.uploadMultipleImages(files, validatedData.product_code);
          
          if (uploadError) {
            console.warn('이미지 업로드 중 일부 실패:', uploadError);
          }
          
          processedImages = urls;
        }
        
        // 기존 URL들도 포함
        const existingUrls = validatedData.product_images
          .filter(img => !img.file && img.url)
          .map(img => img.url);
        
        processedImages = [...processedImages, ...existingUrls];
      }

      // DB에 저장할 데이터 준비
      const insertData = {
        ...validatedData,
        product_images: processedImages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('master_products')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        // 실패 시 업로드된 이미지들 정리
        if (processedImages.length > 0) {
          await Promise.all(processedImages.map(url => this.deleteImage(url)));
        }
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('MasterProductService.create 오류:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * 마스터 상품 수정
   */
  async update(id, productData) {
    try {
      // 상품 코드 중복 확인 (자신 제외)
      const { isDuplicate } = await this.checkCodeDuplicate(productData.product_code, id);
      if (isDuplicate) {
        throw new Error('이미 존재하는 상품 코드입니다.');
      }

      // 업셀링 데이터 검증
      const validatedData = this.validateUpsellingData(productData);

      // 기존 상품 정보 조회
      const { data: existingProduct } = await this.getById(id);
      const existingImages = existingProduct?.product_images || [];

      // 이미지 업로드 처리
      let processedImages = [];
      if (validatedData.product_images && validatedData.product_images.length > 0) {
        // 새로 업로드할 파일들
        const imageFiles = validatedData.product_images.filter(img => img.file);
        if (imageFiles.length > 0) {
          const files = imageFiles.map(img => img.file);
          const { urls } = await this.uploadMultipleImages(files, validatedData.product_code);
          processedImages = [...processedImages, ...urls];
        }
        
        // 기존 URL들 중 유지되는 것들
        const existingUrls = validatedData.product_images
          .filter(img => !img.file && img.url)
          .map(img => img.url);
        
        processedImages = [...processedImages, ...existingUrls];
      }

      // 삭제된 이미지들 정리
      const deletedImages = existingImages.filter(url => !processedImages.includes(url));
      if (deletedImages.length > 0) {
        await Promise.all(deletedImages.map(url => this.deleteImage(url)));
      }

      // DB 업데이트
      const updateData = {
        ...validatedData,
        product_images: processedImages,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('master_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 마스터 상품 업데이트 시 관련 행사들의 업셀링 설정도 업데이트 (선택사항)
      if (validatedData.upselling_enabled !== undefined) {
        await this.updateRelatedEventsUpselling(id, validatedData);
      }

      return { data, error: null };
    } catch (error) {
      console.error('MasterProductService.update 오류:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * 관련 행사들의 업셀링 설정 업데이트 (마스터 상품 변경 시)
   */
  async updateRelatedEventsUpselling(masterProductId, upsellingData) {
    try {
      const updateData = {
        upselling_enabled: upsellingData.upselling_enabled,
        upselling_rate: upsellingData.upselling_rate,
        guide_commission_rate: upsellingData.guide_commission_rate,
        company_commission_rate: upsellingData.company_commission_rate,
        ota_commission_rate: upsellingData.ota_commission_rate
      };

      // 아직 출발하지 않은 행사들만 업데이트
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('master_product_id', masterProductId)
        .gte('departure_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('관련 행사 업셀링 설정 업데이트 오류:', error);
      }
    } catch (err) {
      console.error('관련 행사 업셀링 설정 업데이트 예외:', err);
    }
  }

  /**
   * 마스터 상품 삭제
   */
  async delete(id) {
    try {
      // 먼저 상품 정보 조회 (이미지 정리를 위해)
      const { data: product } = await this.getById(id);
      
      // 연관된 행사가 있는지 확인
      const hasEvents = await this.hasRelatedEvents(id);
      if (hasEvents) {
        throw new Error('연관된 행사가 있어 삭제할 수 없습니다. 먼저 관련 행사를 삭제해주세요.');
      }
      
      // 상품 삭제
      const { error } = await supabase
        .from('master_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 관련 이미지들 삭제
      if (product?.product_images && product.product_images.length > 0) {
        await Promise.all(product.product_images.map(url => this.deleteImage(url)));
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('MasterProductService.delete 오류:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 연관된 행사가 있는지 확인
   */
  async hasRelatedEvents(productId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('master_product_id', productId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('MasterProductService.hasRelatedEvents 오류:', error);
      // 테이블이 없을 수도 있으므로 false 반환
      return false;
    }
  }

  /**
   * 마스터 상품 통계 조회
   */
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('master_products')
        .select('status, is_star_guide_product, base_price, destination_country, upselling_enabled');

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(p => p.status === 'active').length,
        inactive: data.filter(p => p.status === 'inactive').length,
        starGuide: data.filter(p => p.is_star_guide_product).length,
        upsellingEnabled: data.filter(p => p.upselling_enabled).length,
        avgPrice: data.length > 0 
          ? Math.round(data.reduce((sum, p) => sum + (p.base_price || 0), 0) / data.length)
          : 0,
        byCountry: data.reduce((acc, p) => {
          acc[p.destination_country] = (acc[p.destination_country] || 0) + 1;
          return acc;
        }, {})
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('MasterProductService.getStats 오류:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * 활성 상품 목록 조회 (행사 생성 시 사용)
   */
  async getActiveProducts() {
    try {
      const { data, error } = await supabase
        .from('master_products')
        .select(`
          id, 
          product_code, 
          product_name, 
          destination_country, 
          destination_city, 
          duration_days, 
          duration_nights, 
          base_price, 
          base_airline, 
          is_star_guide_product,
          upselling_enabled,
          upselling_rate,
          guide_commission_rate,
          company_commission_rate,
          ota_commission_rate
        `)
        .eq('status', 'active')
        .order('product_name');

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('MasterProductService.getActiveProducts 오류:', error);
      return { data: [], error: error.message };
    }
  }

  /**
   * 업셀링 통계 조회
   */
  async getUpsellingStats() {
    try {
      const { data, error } = await supabase
        .from('master_products')
        .select(`
          id,
          product_name,
          upselling_enabled,
          upselling_rate,
          base_price,
          guide_commission_rate,
          company_commission_rate,
          ota_commission_rate
        `)
        .eq('upselling_enabled', true);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }
}

// 싱글톤 인스턴스 생성
const masterProductService = new MasterProductService();

export default masterProductService;