"use client";

export function AddSettlementButton() {
  return (
    <button
      type="button"
      onClick={() => console.log("Add Settlement (placeholder)")}
      className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
    >
      + Add Settlement
    </button>
  );
}
