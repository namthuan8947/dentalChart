import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, Settings2, X } from 'lucide-react';
import {
  DEFAULT_EXPORT_OPTIONS,
  ExportOptions,
  copyPngBlobToClipboard,
  downloadPngBlob,
  renderSvgToPngBlob,
} from '../utils/exportPng';

interface ExportModalProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  onClose: () => void;
}

const BG_PRESETS = [
  { id: 'transparent', label: 'Trong suốt', color: 'transparent' },
  { id: '#FFFFFF', label: 'Trắng', color: '#FFFFFF' },
  { id: '#F8FAFC', label: 'Xám nhạt', color: '#F8FAFC' },
  { id: '#F0F9FF', label: 'Xanh nhạt', color: '#F0F9FF' },
];

const BORDER_COLOR_PRESETS = [
  { color: '#CBD5E1', label: 'Xám nhạt' },
  { color: '#94A3B8', label: 'Xám đậm' },
  { color: '#1E3A8A', label: 'Xanh nha khoa' },
  { color: '#111827', label: 'Đen' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  svgRef,
  onClose,
}) => {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let currentUrl: string | null = null;

    const generatePreview = async () => {
      if (!svgRef.current) return;
      try {
        const blob = await renderSvgToPngBlob(svgRef.current, options);
        if (cancelled) return;
        currentUrl = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return currentUrl;
        });
      } catch {
        // Ignore transient preview errors
      }
    };

    generatePreview();

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [svgRef, options]);

  const handleDownload = async () => {
    if (!svgRef.current) return;
    const blob =
      previewBlob ?? (await renderSvgToPngBlob(svgRef.current, options));
    downloadPngBlob(blob, 'so-do-rang.png');
  };

  const handleCopy = async () => {
    if (!svgRef.current) return;
    setCopyError(null);
    try {
      const blob =
        previewBlob ?? (await renderSvgToPngBlob(svgRef.current, options));
      await copyPngBlobToClipboard(blob);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopyError(
        err instanceof Error ? err.message : 'Không thể copy ảnh.'
      );
    }
  };

  const isTransparent = options.backgroundColor === 'transparent';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Xem trước & Cài đặt xuất ảnh PNG
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: Preview (left) + Settings (right) */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-y-auto">
          {/* Preview Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-5 bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200 min-h-[260px]">
            <div
              className="w-full max-w-2xl rounded-xl p-4 flex items-center justify-center overflow-hidden"
              style={
                isTransparent
                  ? {
                      backgroundImage:
                        'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                      backgroundSize: '18px 18px',
                      backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0px',
                      backgroundColor: '#f8fafc',
                    }
                  : { backgroundColor: '#e2e8f0' }
              }
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Xem trước sơ đồ răng"
                  className="max-h-[420px] w-auto object-contain"
                />
              ) : (
                <span className="text-sm text-slate-500">Đang tạo xem trước...</span>
              )}
            </div>
            <p className="mt-2.5 text-xs text-slate-500">
              {isTransparent
                ? 'Nền ca-rô biểu thị vùng trong suốt khi xuất PNG'
                : 'Xem trước ảnh thực tế sẽ được tải xuống hoặc copy'}
            </p>
          </div>

          {/* Settings Tab/Panel */}
          <div className="w-full lg:w-80 shrink-0 p-5 space-y-5 bg-white">
            {/* Visibility options */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nội dung hiển thị
              </h3>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <span className="text-slate-800">
                  Hiện chữ &quot;Răng vĩnh viễn&quot; / &quot;Răng sữa&quot;
                </span>
                <input
                  type="checkbox"
                  checked={options.showDentitionTitles}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      showDentitionTitles: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <span className="text-slate-800">Hiện nhãn Phải / Trái</span>
                <input
                  type="checkbox"
                  checked={options.showSideLabels}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      showSideLabels: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Background options */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Màu nền
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {BG_PRESETS.map((preset) => {
                  const active = options.backgroundColor === preset.color;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setOptions((prev) => ({
                          ...prev,
                          backgroundColor: preset.color,
                        }))
                      }
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
                        active
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded border border-slate-300"
                        style={
                          preset.color === 'transparent'
                            ? {
                                backgroundImage:
                                  'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
                                backgroundSize: '8px 8px',
                                backgroundPosition:
                                  '0 0, 0 4px, 4px -4px, -4px 0px',
                              }
                            : { backgroundColor: preset.color }
                        }
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600">Hoặc chọn màu tùy chỉnh:</span>
                <input
                  type="color"
                  value={isTransparent ? '#ffffff' : options.backgroundColor}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value,
                    }))
                  }
                  className="h-7 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                  aria-label="Chọn màu nền tùy chỉnh"
                />
              </div>
            </div>

            {/* Border options (only when background is not transparent) */}
            {!isTransparent && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <label className="flex cursor-pointer items-center justify-between text-sm font-medium text-slate-800">
                  <span>Thêm thanh bo viền</span>
                  <input
                    type="checkbox"
                    checked={options.hasBorder}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        hasBorder: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {options.hasBorder && (
                  <>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>Độ bo góc</span>
                        <span className="font-semibold tabular-nums">
                          {options.borderRadius}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={32}
                        step={4}
                        value={options.borderRadius}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            borderRadius: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <span className="mb-1.5 block text-xs text-slate-600">
                        Màu viền
                      </span>
                      <div className="flex gap-2">
                        {BORDER_COLOR_PRESETS.map((b) => (
                          <button
                            key={b.color}
                            type="button"
                            title={b.label}
                            onClick={() =>
                              setOptions((prev) => ({
                                ...prev,
                                borderColor: b.color,
                              }))
                            }
                            className={`h-6 w-6 rounded-full border-2 transition ${
                              options.borderColor === b.color
                                ? 'scale-110 border-blue-600 ring-2 ring-blue-200'
                                : 'border-white shadow-xs'
                            }`}
                            style={{ backgroundColor: b.color }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Resolution */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Độ phân giải
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[2, 3].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() =>
                      setOptions((prev) => ({ ...prev, scale: sc }))
                    }
                    className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                      options.scale === sc
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sc}x ({sc * 900}px)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="text-xs text-red-600">{copyError}</div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã copy!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy ảnh</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Tải xuống PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
