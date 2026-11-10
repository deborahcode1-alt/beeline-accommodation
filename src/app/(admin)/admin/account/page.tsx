import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { KeyIcon, PageHeader, SectionCard, UserIcon } from "@/components/admin/DashUI";

export default function AdminAccountPage() {
  return (
    <div>
      <PageHeader icon={<UserIcon />} title="Account" />

      <SectionCard icon={<KeyIcon />} title="Change password">
        <ChangePasswordForm />
      </SectionCard>
    </div>
  );
}
