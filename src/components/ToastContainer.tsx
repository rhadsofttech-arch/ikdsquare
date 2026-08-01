import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-3 sm:px-0 pointer-events-none transition-all">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto relative overflow-hidden flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-slate-900/95 text-white border-emerald-500/60 shadow-emerald-950/20'
              : toast.type === 'error'
              ? 'bg-slate-900/95 text-white border-rose-500/60 shadow-rose-950/20'
              : 'bg-slate-900/95 text-white border-sky-500/60 shadow-sky-950/20'
          }`}
        >
          {/* Subtle Accent Glow */}
          <div
            className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-25 pointer-events-none ${
              toast.type === 'success'
                ? 'bg-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-500'
                : 'bg-sky-500'
            }`}
          />

          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Info className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <h5 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
              <span>{toast.title}</span>
              {toast.type === 'success' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
            </h5>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">
              {toast.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

