import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

const SmartPagination: React.FC<SmartPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const getVisiblePages = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-1.5 py-6 ${className}`}>
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={15} strokeWidth={1.5} />
      </button>

      {/* Page numbers */}
      {getVisiblePages().map((page, i) =>
        page === '...' ? (
          <span
            key={`dots-${i}`}
            className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none"
          >
            ···
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-150"
            style={
              page === currentPage
                ? { background: '#111', color: '#fff', fontWeight: 500 }
                : { color: '#374151' }
            }
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default SmartPagination;