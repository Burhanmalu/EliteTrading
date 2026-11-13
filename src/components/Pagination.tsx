"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize?: number;
  recordLabel: string; // e.g. "customers", "projects", "quotations"
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Near the start
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  // Near the end
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  // In the middle
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize = 10,
  recordLabel,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const start = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const end = Math.min(safeCurrentPage * pageSize, totalRecords);

  const pages = getPageNumbers(safeCurrentPage, safeTotalPages);

  return (
    <div className="px-4 py-3 bg-[#F7F8F4]/50 border-t border-[#E5EAE3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718075]">
      {/* Record info on bottom-left */}
      <div>
        Showing{" "}
        <span className="font-semibold text-[#1F2937]">
          {start}–{end}
        </span>{" "}
        of <span className="font-semibold text-[#1F2937]">{totalRecords}</span> {recordLabel}
      </div>

      {/* Pagination controls on bottom-right */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center sm:justify-end">
        {/* Previous Button */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1 || isLoading}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-[#E5EAE3] bg-white text-xs font-medium text-[#1F2937] hover:bg-[#F7F8F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          <span>Previous</span>
        </button>

        {/* Numbered Page Buttons & Ellipsis */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="min-w-[32px] h-8 flex items-center justify-center text-xs text-[#718075] select-none"
              >
                ...
              </span>
            );
          }

          const isSelected = p === safeCurrentPage;
          return (
            <button
              key={`page-${p}`}
              type="button"
              disabled={isLoading}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${
                isSelected
                  ? "bg-[#174535] text-white shadow-xs"
                  : "border border-[#E5EAE3] bg-white text-[#1F2937] hover:bg-[#F7F8F4]"
              }`}
              aria-current={isSelected ? "page" : undefined}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={safeCurrentPage >= safeTotalPages || isLoading}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-[#E5EAE3] bg-white text-xs font-medium text-[#1F2937] hover:bg-[#F7F8F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </div>
  );
}

