import React, { useState } from 'react';
import { Header, Footer } from '../components/SharedLayout';
import { LayoutDashboard, ClipboardList, Wrench, ChevronDown } from 'lucide-react';

const apps = [
  {
    id: 'cong-viec',
    title: 'Quản lý công việc',
    icon: <ClipboardList className="w-5 h-5" />,
    href: `${import.meta.env.BASE_URL}webapp/quan-ly-cong-viec.html`,
  },
  {
    id: 'thiet-bi',
    title: 'Quản lý trang thiết bị',
    icon: <Wrench className="w-5 h-5" />,
    href: `${import.meta.env.BASE_URL}webapp/quan-ly-thiet-bi/index.html`,
  },
];

export default function WebAppDuocKhoa() {
  const [selected, setSelected] = useState(apps[0]);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
        <LayoutDashboard className="w-5 h-5 text-rose-600 shrink-0" />
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-800 min-w-[240px]"
          >
            {selected.icon}
            {selected.title}
            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { setSelected(app); setOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors ${selected.id === app.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  {app.icon}
                  {app.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full page iframe */}
      <div className="flex-1 flex flex-col">
        <iframe
          key={selected.id}
          src={selected.href}
          frameBorder="0"
          className="w-full flex-1"
          style={{ minHeight: 'calc(100vh - 140px)' }}
          title={selected.title}
        />
      </div>
    </div>
  );
}
