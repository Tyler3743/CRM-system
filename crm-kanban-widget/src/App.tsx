import React, { useState } from 'react';

interface Deal {
  id: number;
  title: string;
  customer: string;
  amount: string;
}

export const App: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([
    { id: 1, title: 'Tư vấn phần mềm Liferay', customer: 'Cty Alpha', amount: '50.000.000 đ' },
    { id: 2, title: 'Báo giá gói CRM nâng cao', customer: 'Tập đoàn Beta', amount: '120.000.000 đ' },
  ]);

  const [testCount, setTestCount] = useState<number>(0);

  const handleAddDeal = () => {
    const nextId = deals.length + 1;
    const newDeal: Deal = {
      id: nextId,
      title: `Cơ hội mới #${nextId}`,
      customer: `Khách hàng ${nextId}`,
      amount: `${nextId * 20}.000.000 đ`,
    };
    setDeals([newDeal, ...deals]);
    setTestCount((prev) => prev + 1);
  };

  return (
    // Bọc widget trong container thu gọn, không chiếm full màn hình để nhúng vừa vặn vào trang Portal
    <div className="crm-kanban-widget-container w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans text-slate-800">
      {/* Header thanh công cụ của Widget */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 m-0">Phễu Tư Vấn Bán Hàng (CRM Widget)</h3>
          <span className="text-xs text-slate-500">Module Client Extension</span>
        </div>

        {/* Nút test State nội bộ của Widget */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
            State clicks: {testCount}
          </span>
          <button
            onClick={handleAddDeal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-lg shadow-sm transition cursor-pointer"
          >
            + Test State (Thêm deal)
          </button>
        </div>
      </div>

      {/* 3 Cột phễu mẫu hiển thị dạng Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Cột 1 */}
        <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b-2 border-blue-500">
            <span className="text-xs font-bold uppercase text-slate-700">1. Mới tiếp cận</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-slate-600">{deals.length}</span>
          </div>
          <div className="space-y-2">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white p-2.5 rounded-md shadow-xs border border-slate-200">
                <div className="text-xs font-semibold text-slate-800">{deal.title}</div>
                <div className="text-[11px] text-slate-500">{deal.customer}</div>
                <div className="text-xs font-bold text-blue-600 mt-1">{deal.amount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột 2 */}
        <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b-2 border-amber-500">
            <span className="text-xs font-bold uppercase text-slate-700">2. Đang đàm phán</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-slate-600">1</span>
          </div>
          <div className="bg-white p-2.5 rounded-md shadow-xs border border-slate-200">
            <div className="text-xs font-semibold text-slate-800">Hợp đồng đào tạo kỹ thuật</div>
            <div className="text-[11px] text-slate-500">Cty Giải Pháp Việt</div>
            <div className="text-xs font-bold text-amber-600 mt-1">80.000.000 đ</div>
          </div>
        </div>

        {/* Cột 3 */}
        <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b-2 border-emerald-500">
            <span className="text-xs font-bold uppercase text-slate-700">3. Đã chốt (Won)</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-slate-600">1</span>
          </div>
          <div className="bg-white p-2.5 rounded-md shadow-xs border border-slate-200">
            <div className="text-xs font-semibold text-slate-800">Hệ thống Cloud Portal</div>
            <div className="text-[11px] text-slate-500">Tập đoàn Bất Động Sản X</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">250.000.000 đ</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
