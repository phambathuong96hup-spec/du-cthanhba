import React, { useState, useEffect } from 'react';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { Loader2 } from 'lucide-react';

export default function DeepMedAI() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'DeepMed-AI | Khoa Dược - TTYT Thanh Ba';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col pt-[120px]">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100 px-8 md:px-16 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-500 font-sans">
            <a href="/" className="hover:text-green-700 transition-colors font-semibold">Trang chủ</a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold">DeepMed-AI</span>
          </div>
        </div>

        {/* Iframe container */}
        <div className="relative flex-1">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" 
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">Đang tải DeepMed-AI</p>
                <p className="text-gray-500 text-sm mt-1">Vui lòng chờ trong giây lát...</p>
              </div>
              <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}
          <iframe
            src="https://pbthuong-abc.hf.space"
            frameBorder="0"
            className="w-full flex-1"
            style={{ minHeight: 'calc(100vh - 170px)' }}
            title="DeepMed-AI"
            allow="microphone"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
