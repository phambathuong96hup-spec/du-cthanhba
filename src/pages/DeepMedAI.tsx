import React from 'react';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { Brain } from 'lucide-react';

export default function DeepMedAI() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Breadcrumb items={[{ label: 'DeepMed-AI' }]} />

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 mb-4">
              <Brain className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-violet-700">DeepMed-AI</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">
              AI hỗ trợ ra quyết định <em className="text-violet-600">lâm sàng</em>
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Công cụ trí tuệ nhân tạo hỗ trợ dược sĩ và bác sĩ trong việc phân tích, tra cứu và ra quyết định lâm sàng nhanh chóng.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">
            <iframe
              src="https://pbthuong-abc.hf.space"
              frameBorder="0"
              width="100%"
              height="450"
              className="w-full"
              title="DeepMed-AI"
              allow="microphone"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
