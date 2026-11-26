import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { LEGEND_ITEMS } from '../data/dentalConditions';
import { LegendItem } from '../types/dental';
import { ToothSymbolSvg } from './ToothSymbolSvg';

interface LegendModalProps {
  onClose: () => void;
}

const BLUE = '#1D4ED8';

const LegendSymbolPreview: React.FC<{ item: LegendItem }> = ({ item }) => {
  if (item.kind === 'single' && item.conditionId) {
    const sampleDisplay = (() => {
      switch (item.stt) {
        case 1:
        case 3:
        case 13:
        case 33:
          return '1';
        case 4:
        case 7:
        case 8:
          return '8';
        case 5:
        case 9:
        case 15:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
        case 22:
        case 23:
        case 29:
        case 30:
        case 34:
          return '6';
        case 6:
          return '5';
        case 10:
          return '7';
        case 24:
        case 31:
        case 32:
          return '4';
        case 35:
          return '2';
        case 37:
          return '3';
        default:
          return '6';
      }
    })();

    return (
      <svg width="84" height="58" viewBox="-42 -22 84 58" className="mx-auto">
        <ToothSymbolSvg
          display={sampleDisplay}
          jaw="lower"
          annotation={{
            conditionId: item.conditionId,
            tiltDirection: 'right',
            deviationDirection: 'G',
            cariesPosition: 'occlusal',
            tempMaterial: 'Cav, Eu',
          }}
        />
      </svg>
    );
  }

  if (item.stt === 11) {
    return (
      <svg width="96" height="48" viewBox="0 0 96 48" className="mx-auto">
        <text x="20" y="28" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fill="#111827">4</text>
        <line x1="36" y1="12" x2="36" y2="38" stroke={BLUE} strokeWidth="1.4" />
        <line x1="60" y1="12" x2="60" y2="38" stroke={BLUE} strokeWidth="1.4" />
        <text x="48" y="23" textAnchor="middle" fontSize="8.5" fontWeight="600" fill={BLUE}>2</text>
        <text x="48" y="33" textAnchor="middle" fontSize="8" fontWeight="600" fill={BLUE}>mm</text>
        <text x="76" y="28" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fill="#111827">5</text>
      </svg>
    );
  }

  if (item.stt === 25) {
    return (
      <svg width="96" height="48" viewBox="0 0 96 48" className="mx-auto">
        <text x="32" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fill="#111827">5</text>
        <text x="64" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fill="#111827">6</text>
        <path d="M 32 30 L 32 38 L 64 38 L 64 30" fill="none" stroke={BLUE} strokeWidth="1.7" />
      </svg>
    );
  }

  if (item.stt === 26) {
    return (
      <svg width="96" height="48" viewBox="0 0 96 48" className="mx-auto">
        <text x="32" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fill="#111827">4</text>
        <g transform="translate(64, 18)" stroke={BLUE} strokeWidth="2.1" strokeLinecap="round">
          <line x1="-6" y1="-6" x2="6" y2="6" />
          <line x1="6" y1="-6" x2="-6" y2="6" />
        </g>
        <path d="M 32 30 L 32 38 L 64 38" fill="none" stroke={BLUE} strokeWidth="1.7" />
      </svg>
    );
  }

  if (item.stt === 27) {
    return (
      <svg width="110" height="48" viewBox="0 0 110 48" className="mx-auto">
        <text x="24" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fill="#111827">5</text>
        <g transform="translate(55, 18)" stroke={BLUE} strokeWidth="2.1" strokeLinecap="round">
          <line x1="-6" y1="-6" x2="6" y2="6" />
          <line x1="6" y1="-6" x2="-6" y2="6" />
        </g>
        <text x="86" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="16" fill="#111827">7</text>
        <path d="M 24 30 L 24 38 L 86 38 L 86 30" fill="none" stroke={BLUE} strokeWidth="1.7" />
      </svg>
    );
  }

  if (item.stt === 28) {
    return (
      <svg width="150" height="48" viewBox="0 0 150 48" className="mx-auto">
        <text x="14" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="14" fill="#111827">3</text>
        <g transform="translate(34, 19)" stroke={BLUE} strokeWidth="1.8"><line x1="-4" y1="-5" x2="4" y2="5" /><line x1="4" y1="-5" x2="-4" y2="5" /></g>
        <text x="54" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="14" fill="#111827">1</text>
        <text x="74" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="14" fill="#111827">1</text>
        <g transform="translate(94, 19)" stroke={BLUE} strokeWidth="1.8"><line x1="-4" y1="-5" x2="4" y2="5" /><line x1="4" y1="-5" x2="-4" y2="5" /></g>
        <g transform="translate(114, 19)" stroke={BLUE} strokeWidth="1.8"><line x1="-4" y1="-5" x2="4" y2="5" /><line x1="4" y1="-5" x2="-4" y2="5" /></g>
        <text x="134" y="24" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="14" fill="#111827">4</text>
        <path d="M 14 30 L 14 38 L 134 38 L 134 30 M 54 30 L 54 38 M 74 30 L 74 38" fill="none" stroke={BLUE} strokeWidth="1.6" />
      </svg>
    );
  }

  if (item.stt === 36) {
    return (
      <svg width="140" height="54" viewBox="0 0 140 54" className="mx-auto">
        <text x="20" y="22" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fill="#111827">3</text>
        <text x="40" y="22" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fill="#111827">2</text>
        <text x="60" y="22" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fill="#111827">1</text>
        <line x1="70" y1="8" x2="70" y2="27" stroke="#374151" strokeWidth="1" />
        <text x="80" y="22" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fill="#111827">1</text>
        <text x="100" y="22" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fill="#111827">2</text>
        <text x="120" y="22" textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize="13" fill="#111827">3</text>
        <path d="M 16 27 L 16 34 L 124 34 L 124 27" fill="none" stroke={BLUE} strokeWidth="1.4" />
        <text x="70" y="46" textAnchor="middle" fontSize="9.5" fontWeight="600" fill={BLUE}>chen chúc</text>
      </svg>
    );
  }

  return (
    <span className="text-xs italic text-slate-500">Ghi chú bên dưới sơ đồ</span>
  );
};

export const LegendModal: React.FC<LegendModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LEGEND_ITEMS;
    return LEGEND_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q) ||
        item.notationDescription.toLowerCase().includes(q) ||
        String(item.stt) === q
    );
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Chú giải — Cách ghi sơ đồ răng
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Các ví dụ minh họa cho răng hàm dưới. Đối với răng hàm trên, các ký hiệu và chữ đặt bên trên số răng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm nội dung hoặc ghi chú..."
                className="w-56 rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Đóng chú giải"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-center w-14">STT</th>
                <th className="border-b border-slate-200 px-4 py-3 w-1/3">Nội dung</th>
                <th className="border-b border-slate-200 px-4 py-3 text-center w-44">Cách ghi trên sơ đồ răng</th>
                <th className="border-b border-slate-200 px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.stt} className="hover:bg-slate-50/80">
                  <td className="px-4 py-2.5 text-center font-medium text-slate-500 tabular-nums">
                    {item.stt}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <LegendSymbolPreview item={item} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {item.note}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy mục nào phù hợp với "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
          <span>Tổng cộng {LEGEND_ITEMS.length} quy ước ghi sơ đồ răng</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
