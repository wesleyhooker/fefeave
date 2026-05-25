"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { WorkspaceToolbarMenu } from "@/app/(admin)/admin/_components/WorkspaceToolbarMenu";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import { downloadCsv } from "@/lib/csv";
import { apiGetText } from "@/lib/api";

/**
 * Ledger section export — same menu primitive as Balances toolbar Export.
 */
export function WholesalerLedgerExportMenu({
  wholesalerId,
  onStatementError,
  onLedgerError,
}: {
  wholesalerId: string;
  onStatementError: (message: string | null) => void;
  onLedgerError: (message: string | null) => void;
}) {
  const downloadStatement = async () => {
    onStatementError(null);
    try {
      const csvText = await apiGetText("exports/wholesaler-statement.csv", {
        wholesalerId,
      });
      const d = new Date();
      const filename = `wholesaler-statement-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.csv`;
      downloadCsv(filename, csvText, { includeBom: false });
    } catch {
      onStatementError("Statement export failed. Please retry.");
    }
  };

  const downloadLedger = async () => {
    onLedgerError(null);
    try {
      const y = new Date().getFullYear();
      const csvText = await apiGetText("exports/ledger.csv", {
        wholesalerId,
        start: `${y}-01-01`,
        end: `${y}-12-31`,
      });
      const d = new Date();
      const filename = `ledger-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.csv`;
      downloadCsv(filename, csvText, { includeBom: false });
    } catch {
      onLedgerError("Ledger export failed. Please retry.");
    }
  };

  return (
    <WorkspaceToolbarMenu
      label="Export"
      leadingIcon={<ArrowDownTrayIcon className={workspaceActionIconMd} />}
      menuId="wholesaler-ledger-export"
      items={[
        {
          id: "statement-csv",
          label: "Download statement CSV",
          onSelect: () => {
            void downloadStatement();
          },
        },
        {
          id: "ledger-csv",
          label: "Download ledger CSV",
          onSelect: () => {
            void downloadLedger();
          },
        },
      ]}
    />
  );
}
