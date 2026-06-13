"use client";

import { useEffect, useRef } from "react";
import { VENDOR_BALANCES_INVALIDATE_EVENT } from "@/lib/vendorBalancesInvalidate";
import { WORKSPACE_INVALIDATE_EVENT } from "@/lib/workspaceInvalidate";
import { fetchShows } from "@/src/lib/api/shows";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";
import {
  buildWorkspaceAttentionItems,
  countActiveShows,
  countAttentionItemsForBell,
  countVendorsOwing,
  parseBalanceAmount,
} from "../_lib/workspaceAttentionItems";
import { useWorkspaceAttention } from "./WorkspaceAttentionContext";

/**
 * Loads workspace attention signals for the bell dropdown Needs attention section.
 * Mounted once in the admin shell — not tied to Dashboard page lifecycle.
 */
export function WorkspaceAttentionSync() {
  const { setAttentionState } = useWorkspaceAttention();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      Promise.allSettled([fetchWholesalerBalances(), fetchShows()])
        .then(([balancesResult, showsResult]) => {
          if (cancelled) return;

          const showsError =
            showsResult.status === "rejected"
              ? showsResult.reason instanceof Error
                ? showsResult.reason.message
                : String(showsResult.reason)
              : null;

          const balancesError =
            balancesResult.status === "rejected"
              ? balancesResult.reason instanceof Error
                ? balancesResult.reason.message
                : String(balancesResult.reason)
              : null;

          const balances =
            balancesResult.status === "fulfilled" ? balancesResult.value : [];

          const totalOutstandingBalance = balances.reduce(
            (sum, row) => sum + parseBalanceAmount(row.balance_owed),
            0,
          );

          const items = buildWorkspaceAttentionItems({
            showsError,
            balancesError,
            openShowsCount:
              showsResult.status === "fulfilled"
                ? countActiveShows(showsResult.value)
                : 0,
            vendorsOwingCount: countVendorsOwing(balances),
            totalOutstandingBalance,
          });

          setAttentionState(countAttentionItemsForBell(items), items);
        })
        .finally(() => {
          isFetchingRef.current = false;
        });
    };

    refresh();

    const onInvalidate = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(VENDOR_BALANCES_INVALIDATE_EVENT, onInvalidate);
    window.addEventListener(WORKSPACE_INVALIDATE_EVENT, onInvalidate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener(
        VENDOR_BALANCES_INVALIDATE_EVENT,
        onInvalidate,
      );
      window.removeEventListener(WORKSPACE_INVALIDATE_EVENT, onInvalidate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [setAttentionState]);

  return null;
}
