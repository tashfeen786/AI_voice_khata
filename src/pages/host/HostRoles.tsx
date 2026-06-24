import { RolesListPage } from "@/pages/admin/RolesListPage";

export default function HostRoles() {
  return (
    <RolesListPage
      host
      title="Host Roles"
      subtitle="Roles for SaaS administrators (HostAdmin, HostSupport, …)."
    />
  );
}
