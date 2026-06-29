import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Loader2, Archive, ArrowRightLeft, Trash2, FolderTree, ShieldCheck } from 'lucide-react';

interface Cat {
  id?: string; title: string; parent_id?: string | null;
}

interface Props {
  open: boolean;
  category: Cat | null;
  /** All categories (used to populate the "move products to…" list & count subs). */
  allCategories: Cat[];
  /** number of products currently assigned to this category */
  productCount: number;
  busy?: boolean;
  /** Archive instead of deleting. */
  onArchive: () => void;
  /** Permanently delete. moveToId may be '' (detach products). subBehavior: keep or delete subs. */
  onDelete: (opts: { moveToId: string; subBehavior: 'delete' | 'promote' }) => void;
  onCancel: () => void;
}

/**
 * Premium, multi-option category delete confirmation.
 * Clearly explains consequences and offers safe alternatives:
 *  • Move products to another category
 *  • Keep or remove subcollections
 *  • Archive instead of deleting
 *  • Permanent delete only after typing-style explicit confirmation
 * Deleting one category NEVER affects any other category.
 */
const DeleteCategoryDialog: React.FC<Props> = ({
  open, category, allCategories, productCount, busy = false, onArchive, onDelete, onCancel,
}) => {
  const [moveToId, setMoveToId] = useState('');
  const [subBehavior, setSubBehavior] = useState<'delete' | 'promote'>('delete');
  const [confirmed, setConfirmed] = useState(false);

  const subCount = category?.id ? allCategories.filter((c) => c.parent_id === category.id).length : 0;
  const hasRelations = productCount > 0 || subCount > 0;

  // Reset state whenever the dialog (re)opens for a category.
  useEffect(() => {
    if (open) { setMoveToId(''); setSubBehavior('delete'); setConfirmed(false); }
  }, [open, category?.id]);

  if (!open || !category) return null;

  const moveTargets = allCategories.filter((c) => c.id && c.id !== category.id && c.parent_id == null);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex items-start gap-3.5 border-b border-[#f2f2f2]">
          <span className="shrink-0 w-11 h-11 grid place-items-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={20} />
          </span>
          <div className="flex-1 pt-0.5">
            <h3 className="font-serif text-lg text-[#1D1D1D] leading-snug">Delete “{category.title}”?</h3>
            <p className="text-sm text-[#777] mt-1.5 leading-relaxed">
              This affects <b>only this category</b>. No other category will be renamed, reordered,
              hidden, or removed.
            </p>
          </div>
          <button onClick={onCancel} disabled={busy} className="text-[#bbb] hover:text-[#444] -mt-1 -mr-1">
            <X size={18} />
          </button>
        </div>

        {/* Relations summary */}
        <div className="px-6 py-4 space-y-4 max-h-[55vh] overflow-auto">
          {hasRelations ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
              <FolderTree size={15} className="mt-0.5 shrink-0" />
              <span>
                This category has{productCount > 0 ? <> <b>{productCount} product{productCount === 1 ? '' : 's'}</b></> : ''}
                {productCount > 0 && subCount > 0 ? ' and' : ''}
                {subCount > 0 ? <> <b>{subCount} subcategor{subCount === 1 ? 'y' : 'ies'}</b></> : ''}. Choose how to handle them below.
              </span>
            </div>
          ) : (
            <div className="bg-[#F3F8F4] border border-[#d7ecdd] rounded-xl px-4 py-3 text-xs text-emerald-700 flex items-start gap-2">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              <span>This category is empty — it has no products or subcategories.</span>
            </div>
          )}

          {/* Move products */}
          {productCount > 0 && (
            <div>
              <label className="text-xs font-medium text-[#555] flex items-center gap-1.5 mb-1.5">
                <ArrowRightLeft size={13} className="text-[#6E44FF]" /> Move its products to
              </label>
              <select
                value={moveToId}
                onChange={(e) => setMoveToId(e.target.value)}
                className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Don't move (just unassign) —</option>
                {moveTargets.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <p className="text-[11px] text-[#aaa] mt-1">Products are never deleted — only their category link changes.</p>
            </div>
          )}

          {/* Subcollection behavior */}
          {subCount > 0 && (
            <div>
              <p className="text-xs font-medium text-[#555] flex items-center gap-1.5 mb-1.5">
                <FolderTree size={13} className="text-[#6E44FF]" /> Its {subCount} subcategor{subCount === 1 ? 'y' : 'ies'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSubBehavior('promote')}
                  className={`text-xs px-3 py-2 rounded-lg border text-left ${subBehavior === 'promote' ? 'border-[#6E44FF] bg-[#F3EFFF] text-[#5333d6]' : 'border-[#e6e6e6] text-[#666] hover:border-[#bbb]'}`}
                >
                  Keep them<br /><span className="text-[10px] opacity-70">promote to top level</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubBehavior('delete')}
                  className={`text-xs px-3 py-2 rounded-lg border text-left ${subBehavior === 'delete' ? 'border-red-400 bg-red-50 text-red-600' : 'border-[#e6e6e6] text-[#666] hover:border-[#bbb]'}`}
                >
                  Delete them too<br /><span className="text-[10px] opacity-70">remove subcategories</span>
                </button>
              </div>
            </div>
          )}

          {/* Explicit confirmation */}
          <label className="flex items-start gap-2.5 bg-[#FAFAFA] border border-[#eee] rounded-xl px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-red-500"
            />
            <span className="text-xs text-[#555] leading-relaxed">
              I understand this <b>permanently deletes</b> this category and its relationships. This cannot be undone.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#f2f2f2] space-y-2.5">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={busy}
              className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-[#ddd] text-[#555] hover:bg-[#f7f7f7] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onArchive}
              disabled={busy}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Archive size={15} /> Archive instead
            </button>
          </div>
          <button
            onClick={() => onDelete({ moveToId, subBehavior })}
            disabled={busy || !confirmed}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg text-white flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <><Loader2 size={15} className="animate-spin" /> Deleting…</> : <><Trash2 size={15} /> Permanently delete</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryDialog;
