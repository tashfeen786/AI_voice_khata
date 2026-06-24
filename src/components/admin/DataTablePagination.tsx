import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  page: number;             // 1-based
  pageSize: number;
  totalCount: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions?: number[];
}

export function DataTablePagination({
  page, pageSize, totalCount, onPageChange, onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalCount, page * pageSize);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}-{end}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span>
      </div>

      <div className="flex items-center gap-3">
        <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[110px] rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(opt => (
              <SelectItem key={opt} value={String(opt)}>{opt} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Pagination className="m-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => { e.preventDefault(); if (page > 1) onPageChange(page - 1); }}
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {pages.map((p, idx) => {
              const prev = pages[idx - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center">
                  {showEllipsis && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                  <PaginationItem>
                    <PaginationLink
                      isActive={p === page}
                      onClick={(e) => { e.preventDefault(); onPageChange(p); }}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                </span>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => { e.preventDefault(); if (page < totalPages) onPageChange(page + 1); }}
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
