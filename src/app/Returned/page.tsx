"use client";

import { useState } from "react";

interface InvoiceItem {
  item: string;
  originalName: string;
  qty: number;
  amount: number;
  totalProfit: number;
  weight: number;
  guage?: string;
  size?: string;
  gote?: string;
  type?: string;
  name?: string;
  color?: string;
  pipeType?: string;
}

interface Invoice {
  quotationId: string;
  items: InvoiceItem[];
}

const ReturnItems = () => {
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    { itemName: string; qty: number }[]
  >([]);
  const [message, setMessage] = useState("");
  const [returnId, setReturnId] = useState<string | null>(null);

  const getDisplayName = (item: InvoiceItem): string => {
    if (!item) return "";

    const type = item.type?.toLowerCase() || "";
    if (type === "hardware") {
      return `${item.name || ""}${item.size ? " " + item.size : ""}${
        item.color && item.color.trim() !== "" ? " " + item.color : ""
      }`;
    }
    if (type.includes("pillar")) {
      return `${item.type || "Pillar"}${item.size ? " " + item.size : ""}${
        item.guage ? " " + item.guage : ""
      }${item.gote && item.gote.trim() !== "" ? " - " + item.gote : ""}`;
    }
    if (type === "pipe") {
      return `${item.type || "Pipe"}${item.size ? " " + item.size : ""}`;
    }
    return `${item.type || ""}${item.size ? " " + item.size : ""}`.trim();
  };

  const fetchInvoice = async () => {
    if (!invoiceId) return;

    try {
      const res = await fetch(`/api/quotations?search=${invoiceId}`);
      const data = await res.json();

      if (data.success && data.quotations.length > 0) {
        const invRes = await fetch("/api/inventory");
        const invData = await invRes.json();
        const inventory = invData.items || [];

        const enrichedItems = data.quotations[0].items.map((it: any) => {
          const invMatch = inventory.find(
            (inv: any) => inv.name === it.originalName
          );
          return invMatch ? { ...it, ...invMatch } : it;
        });

        setInvoice({ ...data.quotations[0], items: enrichedItems });
        setSelectedItems([]); // reset selections
      }
    } catch (err) {
      setMessage("Error fetching invoice.");
    }
  };

  // toggle an item with qty
  const toggleItem = (itemName: string, qty: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, { itemName, qty }]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.itemName !== itemName));
    }
  };

  const updateQty = (itemName: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.itemName === itemName ? { ...i, qty } : i))
    );
  };

  const handleReturn = async () => {
    if (!invoiceId || selectedItems.length === 0) {
      setMessage("Please select items and quantities.");
      return;
    }

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, items: selectedItems }),
      });

      const data = await res.json();
      console.log("⚡ API Response:", data);

      if (data.success) {
        setReturnId(data.returnId || null);
        setMessage(
          `✅ Return processed successfully. Return ID: ${data.returnId}`
        );
        setInvoice(null);
        setSelectedItems([]);
        setInvoiceId("");
      } else {
        setMessage("❌ Error: " + data.message);
        setReturnId(null);
      }
    } catch (err) {
      console.error("⚡ handleReturn error:", err);
      setMessage("❌ Error happened.");
      setReturnId(null);
    }
  };

  return (
    <div className="px-[75px] py-[35px] h-full flex flex-col items-center gap-[30px] text-white">
      <h1 className="text-xl font-bold">Return Items</h1>

      {/* 🔍 Step 1: Enter Invoice ID */}
      <div className="w-full max-w-md flex gap-2">
        <input
          type="text"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          placeholder="Enter Invoice ID (e.g., INV-0001)"
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
        />
        <button
          onClick={fetchInvoice}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Fetch
        </button>
      </div>

      {invoice && (
        <div className="w-full max-w-md bg-gray-800 rounded p-4">
          <h2 className="font-bold mb-4">Invoice: {invoice.quotationId}</h2>

          {invoice.items.map((it) => {
            const selected = selectedItems.find(
              (s) => s.itemName === it.originalName
            );
            return (
              <div
                key={it.originalName}
                className="flex items-center gap-3 mb-2"
              >
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={(e) =>
                    toggleItem(it.originalName, 1, e.target.checked)
                  }
                />
                <span className="flex-1">
                  {getDisplayName(it)} (Qty: {it.qty})
                </span>
                <input
                  type="number"
                  min={1}
                  max={it.qty}
                  value={selected?.qty || 1}
                  disabled={!selected}
                  onChange={(e) =>
                    updateQty(it.originalName, Number(e.target.value))
                  }
                  className="w-16 bg-gray-900 border border-gray-600 rounded text-center"
                />
              </div>
            );
          })}

          <button
            onClick={handleReturn}
            className="mt-4 w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Process Return
          </button>
        </div>
      )}

      {message && (
        <div className="mt-4 text-center">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default ReturnItems;
