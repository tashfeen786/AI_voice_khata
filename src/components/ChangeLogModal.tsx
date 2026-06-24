import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  Pencil,
  PauseCircle,
  Trash2,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChangeAction = "created" | "edited" | "suspended" | "deleted";

export interface ChangeLogEntry {
  id: string;
  action: ChangeAction;
  date: string;
  agent: string;
  fields?: {
    name: string;
    oldValue?: string;
    newValue: string;
  }[];
}

interface ChangeLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  logs: ChangeLogEntry[];
}

const actionConfig: Record<
  ChangeAction,
  { label: string; icon: React.ReactNode; variant: "created" | "edited" | "suspended" | "deleted" }
> = {
  created: { label: "Created", icon: <UserPlus className="h-4 w-4" />, variant: "created" },
  edited: { label: "Edited", icon: <Pencil className="h-4 w-4" />, variant: "edited" },
  suspended: { label: "Suspended", icon: <PauseCircle className="h-4 w-4" />, variant: "suspended" },
  deleted: { label: "Deleted", icon: <Trash2 className="h-4 w-4" />, variant: "deleted" },
};

const actionFilters: ChangeAction[] = ["created", "edited", "suspended", "deleted"];

export function ChangeLogModal({ open, onOpenChange, clientName, logs }: ChangeLogModalProps) {
  const [activeFilter, setActiveFilter] = useState<ChangeAction | "all">("all");

  const filteredLogs = activeFilter === "all" ? logs : logs.filter((l) => l.action === activeFilter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Change Log
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            History of changes for <span className="font-semibold text-foreground">{clientName}</span>
          </DialogDescription>

          {/* Filters */}
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Button
              size="sm"
              variant={activeFilter === "all" ? "default" : "outline"}
              className="h-7 text-xs rounded-full px-3"
              onClick={() => setActiveFilter("all")}
            >
              All
            </Button>
            {actionFilters.map((action) => (
              <Button
                key={action}
                size="sm"
                variant={activeFilter === action ? "default" : "outline"}
                className="h-7 text-xs rounded-full px-3 capitalize"
                onClick={() => setActiveFilter(action)}
              >
                {actionConfig[action].label}
              </Button>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[55vh]">
          <div className="px-6 py-4">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No changes found.</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[hsl(var(--log-timeline))]" />

                <div className="space-y-6">
                  {filteredLogs.map((log) => {
                    const config = actionConfig[log.action];
                    return (
                      <div key={log.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border-2 border-background shadow-sm">
                          {config.icon}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={config.variant} className="text-[11px] px-2 py-0.5">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {log.date}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1">
                            by <span className="font-medium text-foreground">{log.agent}</span>
                          </p>

                          {/* Field changes */}
                          {log.fields && log.fields.length > 0 && (
                            <div className="mt-3 rounded-lg border border-border bg-muted/40 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Field</th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Old Value</th>
                                    <th className="w-6" />
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">New Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {log.fields.map((field, i) => (
                                    <tr key={i} className="border-b border-border last:border-0">
                                      <td className="px-3 py-2 font-medium text-foreground">{field.name}</td>
                                      <td className="px-3 py-2 text-muted-foreground line-through">
                                        {field.oldValue || "—"}
                                      </td>
                                      <td className="text-center">
                                        <ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" />
                                      </td>
                                      <td className="px-3 py-2 text-foreground font-medium">{field.newValue}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
