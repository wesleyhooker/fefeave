"use client";

import { useState, type ReactNode } from "react";
import { BalancesTable, type WholesalerBalanceRow } from "./BalancesTable";
import {
  VendorsResourceToolbar,
  type VendorsTableSortKey,
} from "./VendorsResourceToolbar";
import type { VendorsPaymentView } from "./vendorsPaymentView";

export function VendorsTableSection({
  data,
  paymentView,
  tabs,
}: {
  data: WholesalerBalanceRow[];
  paymentView: VendorsPaymentView;
  tabs: ReactNode;
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
        sortKey={sortKey}
        sortDir={sortDir}
      />
      {tabs}
      <BalancesTable
        data={data}
        paymentView={paymentView}
        search={search}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortKeyChange={setSortKey}
        onSortDirChange={setSortDir}
      />
    </>
  );
}
