import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

/** A designed, accessible confirmation window — replaces native window.confirm(). */
const ConfirmDialog: React.FC<Props> = ({
  open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel',
  busy = false, tone = 'danger', onConfirm, onCancel,
}) => {
  if (!open) return null;
  const danger = tone === 'danger';
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2 flex items-start gap-3.5">
          <span
            className={`shrink-0 w-11 h-11 grid place-items-center rounded-full ${
              danger ? 'bg-red-50 text-red-500' : 'bg-[#F3EFFF] text-[#6E44FF]'
            }`}
          >
            <AlertTriangle size={20} />
          </span>
          <div className="flex-1 pt-0.5">
            <h3 className="font-serif text-lg text-[#1D1D1D] leading-snug">{title}</h3>
            <p className="text-sm text-[#777] mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} disabled={busy} className="text-[#bbb] hover:text-[#444] -mt-1 -mr-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-3 px-6 py-5">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-[#ddd] text-[#555] hover:bg-[#f7f7f7] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-white flex items-center justify-center gap-2 disabled:opacity-60 ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#6E44FF] hover:bg-[#5a35e0]'
            }`}
          >
            {busy ? <><Loader2 size={15} className="animate-spin" /> Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
