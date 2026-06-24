import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Props {
  field: string;
  currentField: string;
  direction: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function SortableHeader({ field, currentField, direction, onSort, className, children }: Props) {
  const active = currentField === field;
  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {active
          ? (direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
          : <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />}
      </span>
    </TableHead>
  );
}
