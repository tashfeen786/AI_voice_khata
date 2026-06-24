import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChangeLogModal, ChangeLogEntry } from "@/components/ChangeLogModal";
import { History } from "lucide-react";

const sampleLogs: ChangeLogEntry[] = [
  {
    id: "1",
    action: "created",
    date: "Mar 11, 2026 — 09:15 AM",
    agent: "Sarah Johnson",
    fields: [
      { name: "Full Name", newValue: "Acme Corporation" },
      { name: "Email", newValue: "contact@acme.com" },
      { name: "Phone", newValue: "+1 (555) 123-4567" },
      { name: "Address", newValue: "123 Main St, New York, NY" },
      { name: "Plan", newValue: "Enterprise" },
    ],
  },
  {
    id: "2",
    action: "edited",
    date: "Mar 12, 2026 — 02:30 PM",
    agent: "Mike Rivera",
    fields: [
      { name: "Email", oldValue: "contact@acme.com", newValue: "info@acme.com" },
      { name: "Phone", oldValue: "+1 (555) 123-4567", newValue: "+1 (555) 987-6543" },
    ],
  },
  {
    id: "3",
    action: "edited",
    date: "Mar 13, 2026 — 11:00 AM",
    agent: "Sarah Johnson",
    fields: [
      { name: "Address", oldValue: "123 Main St, New York, NY", newValue: "456 Park Ave, New York, NY" },
    ],
  },
  {
    id: "4",
    action: "suspended",
    date: "Mar 14, 2026 — 04:45 PM",
    agent: "Admin System",
    fields: [
      { name: "Status", oldValue: "Active", newValue: "Suspended" },
      { name: "Reason", newValue: "Payment overdue" },
    ],
  },
  {
    id: "5",
    action: "edited",
    date: "Mar 15, 2026 — 10:20 AM",
    agent: "Mike Rivera",
    fields: [
      { name: "Status", oldValue: "Suspended", newValue: "Active" },
      { name: "Plan", oldValue: "Enterprise", newValue: "Premium" },
    ],
  },
  {
    id: "6",
    action: "deleted",
    date: "Mar 16, 2026 — 03:00 PM",
    agent: "Sarah Johnson",
  },
];

const Index = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
        <p className="text-muted-foreground">Click below to view the change log modal design</p>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <History className="h-4 w-4" />
          View Change Log
        </Button>
      </div>

      <ChangeLogModal
        open={open}
        onOpenChange={setOpen}
        clientName="Acme Corporation"
        logs={sampleLogs}
      />
    </div>
  );
};

export default Index;
