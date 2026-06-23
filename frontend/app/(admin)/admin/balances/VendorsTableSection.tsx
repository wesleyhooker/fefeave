"use client";

import { useState } from "react";
import { BalancesTable, type WholesalerBalanceRow } from "./BalancesTable";
import {
  VendorsResourceToolbar,
  type VendorsTableSortKey,
} from "./VendorsResourceToolbar";
import type { VendorsAccountStatusFilter } from "./vendorsAccountStatusFilter";

export function VendorsTableSection({
  data,
  accountStatusFilter,
  onAccountStatusFilterChange,
  onNewVendor,
}: {
  data: WholesalerBalanceRow[];
  accountStatusFilter: VendorsAccountStatusFilter;
  onAccountStatusFilterChange: (value: VendorsAccountStatusFilter) => void;
  onNewVendor: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<VendorsTableSortKey>("balance_owed");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  return (
    <>
      <VendorsResourceToolbar
        search={search}
        onSearchChange={setSearch}
        accountStatusFilter={accountStatusFilter}
        onAccountStatusFilterChange={onAccountStatusFilterChange}
        sortKey={sortKey}
        sortDir={sortDir}
        onNewVendor={onNewVendor}
      />
      <BalancesTable
        data={data}
        accountStatusFilter={accountStatusFilter}
        search={search}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortKeyChange={setSortKey}
        onSortDirChange={setSortDir}
      />
    </>
  );
}
