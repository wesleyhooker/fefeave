"use client";

import { useState, type ReactNode } from "react";
import { BalancesTable, type WholesalerBalanceRow } from "./BalancesTable";
import {
  VendorsResourceToolbar,
  type VendorsTableSortKey,
} from "./VendorsResourceToolbar";
import type { VendorsAccountStatusFilter } from "./vendorsAccountStatusFilter";
import type { VendorsPaymentView } from "./vendorsPaymentView";

export function VendorsTableSection({
  data,
  paymentView,
  accountStatusFilter,
  onAccountStatusFilterChange,
  tabs,
  onNewVendor,
}: {
  data: WholesalerBalanceRow[];
  paymentView: VendorsPaymentView;
  accountStatusFilter: VendorsAccountStatusFilter;
  onAccountStatusFilterChange: (value: VendorsAccountStatusFilter) => void;
  tabs: ReactNode;
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
        paymentView={paymentView}
        accountStatusFilter={accountStatusFilter}
        onAccountStatusFilterChange={onAccountStatusFilterChange}
        sortKey={sortKey}
        sortDir={sortDir}
        onNewVendor={onNewVendor}
      />
      {tabs}
      <BalancesTable
        data={data}
        paymentView={paymentView}
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
