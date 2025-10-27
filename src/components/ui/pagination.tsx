<<<<<<< HEAD
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showQuickJumper?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

const SmartPagination: React.FC<SmartPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showQuickJumper = true,
  showSizeChanger = true,
  pageSizeOptions = [12, 24, 48, 96],
  onPageSizeChange,
  className = ""
}) => {
  const [jumpPage, setJumpPage] = React.useState('');
  
  // Calculate the range of items being shown
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, array) => array.indexOf(item) === index);
  };

  const handleQuickJump = () => {
    const page = parseInt(jumpPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickJump();
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-6 ${className}`}>
      {/* Items info and page size selector */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Showing <span className="font-medium text-gray-900">{startItem}</span> to{' '}
          <span className="font-medium text-gray-900">{endItem}</span> of{' '}
          <span className="font-medium text-gray-900">{totalItems}</span> results
        </span>
        
        {showSizeChanger && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Quick jump input */}
        {showQuickJumper && (
          <div className="hidden sm:flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={currentPage.toString()}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickJump}
              disabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > totalPages}
              className="px-3 py-1 h-8"
            >
              Go
            </Button>
          </div>
        )}

        {/* Previous button */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-2">
            <p className="text-sm">Previous page</p>
          </HoverCardContent>
        </HoverCard>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <HoverCard key={`dots-${index}`}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center justify-center h-9 w-9 text-gray-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-2">
                    <p className="text-sm">More pages...</p>
                  </HoverCardContent>
                </HoverCard>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <HoverCard key={pageNumber}>
                <HoverCardTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                    className={`h-9 w-9 p-0 ${
                      isActive 
                        ? "bg-orange-600 hover:bg-orange-700 border-orange-600" 
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <p className="text-sm">
                    {isActive ? 'Current page' : `Go to page ${pageNumber}`}
                  </p>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>

        {/* Next button */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-2">
            <p className="text-sm">Next page</p>
          </HoverCardContent>
        </HoverCard>

        {/* Page info for mobile */}
        <div className="sm:hidden ml-4 text-sm text-gray-600">
          {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
};

=======
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showQuickJumper?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

const SmartPagination: React.FC<SmartPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showQuickJumper = true,
  showSizeChanger = true,
  pageSizeOptions = [12, 24, 48, 96],
  onPageSizeChange,
  className = ""
}) => {
  const [jumpPage, setJumpPage] = React.useState('');
  
  // Calculate the range of items being shown
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, array) => array.indexOf(item) === index);
  };

  const handleQuickJump = () => {
    const page = parseInt(jumpPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickJump();
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-6 ${className}`}>
      {/* Items info and page size selector */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Showing <span className="font-medium text-gray-900">{startItem}</span> to{' '}
          <span className="font-medium text-gray-900">{endItem}</span> of{' '}
          <span className="font-medium text-gray-900">{totalItems}</span> results
        </span>
        
        {showSizeChanger && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Quick jump input */}
        {showQuickJumper && (
          <div className="hidden sm:flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={currentPage.toString()}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickJump}
              disabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > totalPages}
              className="px-3 py-1 h-8"
            >
              Go
            </Button>
          </div>
        )}

        {/* Previous button */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-2">
            <p className="text-sm">Previous page</p>
          </HoverCardContent>
        </HoverCard>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <HoverCard key={`dots-${index}`}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center justify-center h-9 w-9 text-gray-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-2">
                    <p className="text-sm">More pages...</p>
                  </HoverCardContent>
                </HoverCard>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <HoverCard key={pageNumber}>
                <HoverCardTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                    className={`h-9 w-9 p-0 ${
                      isActive 
                        ? "bg-orange-600 hover:bg-orange-700 border-orange-600" 
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <p className="text-sm">
                    {isActive ? 'Current page' : `Go to page ${pageNumber}`}
                  </p>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>

        {/* Next button */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-2">
            <p className="text-sm">Next page</p>
          </HoverCardContent>
        </HoverCard>

        {/* Page info for mobile */}
        <div className="sm:hidden ml-4 text-sm text-gray-600">
          {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
};

>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
export default SmartPagination;