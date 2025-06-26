// src/App.jsx
import React, { useState } from 'react';
import { 
  Package, Users, Building2, Settings, BarChart3,
  Calendar, MessageSquare, TrendingUp,
  Home
} from 'lucide-react';

// 페이지 컴포넌트 import
import Dashboard from './pages/Dashboard.jsx';
import ProductManagement from './pages/ProductManagement.jsx';
import CompanyManagement from './pages/CompanyManagement.jsx';
import GuideManagement from './pages/GuideManagement.jsx';
import MasterProductManagement from './pages/MasterProductManagement.jsx';
import EventManagement from './pages/EventManagement.jsx';
import Main from './pages/Main.jsx'

import './App.css';

// 사이드바 메뉴 항목
const menuItems = [

  { id: 'dashboard', label: '대시보드', icon: BarChart3 },
  { id :'main', label :  '메인' ,icon : Home},
  { id : 'master_product', label : '마스터 상품', icon: Package},
  { id : 'event', label : '행사', icon :Calendar},
  // { id: 'products', label: '상품 관리', icon: Package },
  // { id: 'events', label: '행사 관리', icon: Calendar },
  { id: 'companies', label: '랜드사 관리', icon: Building2 },
  { id: 'guides', label: '가이드 관리', icon: Users },
  { id: 'reviews', label: '후기 관리', icon: MessageSquare },
  { id: 'upselling', label: '업셀링 설정', icon: TrendingUp },
];

// 빈 페이지 컴포넌트 (아직 구현되지 않은 기능들)
const EmptyPage = ({ title }) => (
  <div className="bg-white p-8 rounded-lg shadow text-center">
    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">
      이 기능은 아직 구현되지 않았습니다. 곧 추가될 예정입니다.
    </p>
  </div>
);

// 메인 관리자 대시보드 컴포넌트
const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeMenu) {
      case 'main':
        return <Main/>;
      case 'master_product':
        return <MasterProductManagement />;
      case 'event':
        return <EventManagement />;
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductManagement />;
      case 'companies':
        return <CompanyManagement />;
      case 'guides':
        return <GuideManagement />;
      case 'events':
        return <EmptyPage title="행사 관리" />;
      case 'reviews':
        return <EmptyPage title="후기 관리" />;
      case 'upselling':
        return <EmptyPage title="업셀링 설정" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            {sidebarOpen && (
              <span className="ml-3 text-xl font-bold text-gray-900">OT Guide & Upselling PoC</span>
            )}
          </div>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeMenu === item.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && (
                  <span className="ml-3">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Settings className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">관리자</span>
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return <AdminDashboard />;
}

export default App;