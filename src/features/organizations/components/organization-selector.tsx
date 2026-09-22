"use client";

import { useRouter } from "next/navigation";

type OrganizationOption = {
  id: string;
  name: string;
  roleLabel: string;
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
    <label className="org-switch">
      <span className="visually-hidden">Organizationを切り替える</span>
      <select
        defaultValue={selectedId ?? ""}
        onChange={(event) => {
          if (event.target.value) router.push(`/workspace/${event.target.value}`);
        }}
      >
        <option disabled value="">
          Organizationを選択
        </option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}（{organization.roleLabel}）
          </option>
        ))}
      </select>
    </label>
  );
}
