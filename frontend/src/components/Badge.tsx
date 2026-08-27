import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'status' | 'employment';
}

export const Badge: React.FC<BadgeProps> = ({ status, variant = 'status' }) => {
  if (variant === 'employment') {
    const isActive = status === 'ACTIVE';
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            isActive ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        ></span>
        {status}
      </span>
    );
  }

  // Attendance status badge
  switch (status) {
    case 'PRESENT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          PRESENT
        </span>
      );
    case 'LATE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          LATE
        </span>
      );
    case 'ABSENT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          ABSENT
        </span>
      );
    case 'ON_LEAVE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5"></span>
          ON LEAVE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
};
