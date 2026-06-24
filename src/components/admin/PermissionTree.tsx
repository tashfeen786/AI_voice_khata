import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PermissionGroupDto, PermissionGrantInfoDto } from "@/lib/api/permissions-api";

interface Props {
  groups: PermissionGroupDto[];
  granted: Set<string>;
  onChange: (next: Set<string>) => void;
  readOnly?: boolean;
}

/** Build child→parents children map */
function indexChildren(perms: PermissionGrantInfoDto[]) {
  const childrenOf = new Map<string, string[]>();
  perms.forEach(p => {
    if (p.parentName) {
      const arr = childrenOf.get(p.parentName) ?? [];
      arr.push(p.name);
      childrenOf.set(p.parentName, arr);
    }
  });
  return childrenOf;
}

function descendants(name: string, childrenOf: Map<string, string[]>): string[] {
  const out: string[] = [];
  const stack = [...(childrenOf.get(name) ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n);
    stack.push(...(childrenOf.get(n) ?? []));
  }
  return out;
}

export function PermissionTree({ groups, granted, onChange, readOnly }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(g => [g.name, true])),
  );

  const toggle = (name: string, group: PermissionGroupDto) => {
    if (readOnly) return;
    const childrenOf = indexChildren(group.permissions);
    const next = new Set(granted);
    const turnOn = !next.has(name);
    if (turnOn) {
      next.add(name);
      // also turn on all parents
      let parent = group.permissions.find(p => p.name === name)?.parentName;
      while (parent) {
        next.add(parent);
        parent = group.permissions.find(p => p.name === parent)?.parentName ?? null;
      }
    } else {
      next.delete(name);
      descendants(name, childrenOf).forEach(d => next.delete(d));
    }
    onChange(next);
  };

  const groupState = (group: PermissionGroupDto): "all" | "some" | "none" => {
    const total = group.permissions.length;
    const on = group.permissions.filter(p => granted.has(p.name)).length;
    if (on === 0) return "none";
    if (on === total) return "all";
    return "some";
  };

  const toggleGroup = (group: PermissionGroupDto) => {
    if (readOnly) return;
    const state = groupState(group);
    const next = new Set(granted);
    if (state === "all") {
      group.permissions.forEach(p => next.delete(p.name));
    } else {
      group.permissions.forEach(p => next.add(p.name));
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const open = openGroups[group.name] ?? true;
        const state = groupState(group);
        return (
          <div key={group.name} className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-2 p-3 hover:bg-secondary/40 transition-colors text-left"
              onClick={() => setOpenGroups(s => ({ ...s, [group.name]: !open }))}
            >
              {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <Checkbox
                checked={state === "all" ? true : state === "some" ? "indeterminate" : false}
                onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                disabled={readOnly}
              />
              <span className="font-semibold text-sm">{group.displayName}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {group.permissions.filter(p => granted.has(p.name)).length} / {group.permissions.length}
              </span>
            </button>

            {open && (
              <div className="px-4 py-3 space-y-1.5 border-t border-border/60 bg-secondary/20">
                {group.permissions.map(p => {
                  const depth = depthOf(p, group.permissions);
                  return (
                    <label
                      key={p.name}
                      className={cn(
                        "flex items-center gap-2 py-1 text-sm rounded-md hover:bg-card/80 px-2 transition-colors",
                        readOnly && "cursor-not-allowed opacity-70",
                      )}
                      style={{ paddingLeft: `${depth * 18 + 8}px` }}
                    >
                      <Checkbox
                        checked={granted.has(p.name)}
                        onCheckedChange={() => toggle(p.name, group)}
                        disabled={readOnly}
                      />
                      <span>{p.displayName}</span>
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function depthOf(p: PermissionGrantInfoDto, all: PermissionGrantInfoDto[]): number {
  let d = 0;
  let parent = p.parentName;
  while (parent) {
    d++;
    parent = all.find(x => x.name === parent)?.parentName ?? null;
    if (d > 10) break;
  }
  return d;
}
