import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-200">
      <div className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{startRecord}</span> to{' '}
        <span className="font-semibold text-slate-700">{endRecord}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalRecords}</span> entries
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </button>
        <span className="px-3 py-1 text-sm font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
