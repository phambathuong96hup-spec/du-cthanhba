import React from 'react';
import { Header, Footer } from '../components/SharedLayout';

export default function DeepMedAI() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col">
        <iframe
          src="https://pbthuong-abc.hf.space"
          frameBorder="0"
          className="w-full flex-1"
          style={{ minHeight: 'calc(100vh - 80px)' }}
          title="DeepMed-AI"
          allow="microphone"
        />
      </div>
    </div>
  );
}
