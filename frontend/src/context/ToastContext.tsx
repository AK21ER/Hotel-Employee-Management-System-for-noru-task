import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global dispatcher for non-react modules (e.g. api client)
let globalToastEmitter: ((type: ToastType, message: string, title?: string) => void) | null = null;

export const toast = {
  error: (msg: string, title?: string) => globalToastEmitter?.('error', msg, title),
  success: (msg: string, title?: string) => globalToastEmitter?.('success', msg, title),
  warning: (msg: string, title?: string) => globalToastEmitter?.('warning', msg, title),
  info: (msg: string, title?: string) => globalToastEmitter?.('info', msg, title),
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast('error', message, title || 'Error Encountered'),
    [showToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast('success', message, title || 'Success'),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast('warning', message, title || 'Notice'),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast('info', message, title || 'Information'),
    [showToast]
  );

  // Bind global emitter
  globalToastEmitter = (type, message, title) => {
    showToast(type, message, title);
  };

  return (
    <ToastContext.Provider value={{ showToast, error, success, warning, info, removeToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          let bg = 'bg-white';
          let border = 'border-slate-200';
          let text = 'text-slate-800';
          let icon = <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />;

          if (t.type === 'error') {
            bg = 'bg-[#fff5f5]';
            border = 'border-rose-300';
            text = 'text-rose-950';
            icon = <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
          } else if (t.type === 'success') {
            bg = 'bg-[#f4fbf7]';
            border = 'border-emerald-300';
            text = 'text-emerald-950';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
          } else if (t.type === 'warning') {
            bg = 'bg-[#fdf9ee]';
            border = 'border-amber-300';
            text = 'text-amber-950';
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`${bg} ${border} ${text} pointer-events-auto border rounded-2xl shadow-2xl p-4 flex items-start space-x-3 transform transition-all duration-200 animate-in slide-in-from-bottom-5 fade-in`}
              style={{ minWidth: '280px' }}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 pr-2">
                {t.title && <div className="font-bold text-xs uppercase tracking-wider mb-0.5">{t.title}</div>}
                <div className="text-xs leading-relaxed font-medium">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
