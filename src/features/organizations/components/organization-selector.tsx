"use client";

import { useRouter } from "next/navigation";

type OrganizationOption = {
  id: string;
  name: string;
  role: string;
};

export function OrganizationSelector({
  organizations,
  selectedId,
}: {
  organizations: OrganizationOption[];
  selectedId?: string;
}) {
  const router = useRouter();

  return (
    <label className="organization-selector">
      Organization
      <select
        aria-label="Organizationを選択"
        defaultValue={selectedId ?? ""}
        onChange={(event) => {
          if (event.target.value) router.push(`/workspace/${event.target.value}`);
        }}
      >
        <option disabled value="">
          選択してください
        </option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}（{organization.role}）
          </option>
        ))}
      </select>
    </label>
  );
}
