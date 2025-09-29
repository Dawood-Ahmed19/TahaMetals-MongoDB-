"use client";

import { useState } from "react";

interface InvoiceItem {
  item: string;
  originalName: string;
  qty: number;
  amount: number;
  totalProfit: number;
  weight: number;
}

interface Invoice {
  quotationId: string;
  items: InvoiceItem[];
}

const ReturnItems = () => {
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [message, setMessage] = useState("");

  // 🔎 Fetch invoice details
  const fetchInvoice = async () => {
    if (!invoiceId) {
      setMessage("Please enter an Invoice ID.");
      return;
    }

    try {
      const res = await fetch(`/api/quotations?search=${invoiceId}`);
      const data = await res.json();
      if (data.success && data.quotations.length > 0) {
        setInvoice(data.quotations[0]);
        setMessage("");
      } else {
        setMessage("Invoice not found.");
        setInvoice(null);
      }
    } catch (err) {
      setMessage("Error fetching invoice.");
    }
  };

  // 🛠 Process return
  const handleReturn = async () => {
    if (!invoiceId || !selectedItem || !qty) {
      setMessage("Please select an invoice, item and quantity.");
      return;
    }

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, itemName: selectedItem, qty }),
      });
      const data = await res.json();
      console.log("⚡ API Response:", data);

      if (data.success) {
        setMessage("✅ Return processed successfully.");
      } else {
        setMessage("❌ Error: " + data.message);
      }
    } catch (err) {
      console.error("⚡ handleReturn error:", err);
      setMessage("❌ Error happened.");
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
          <h2 className="font-bold mb-2">Invoice: {invoice.quotationId}</h2>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full p-2 mb-3 bg-gray-900 border border-gray-600 rounded"
          >
            <option value="">Select item to return</option>
            {invoice.items.map((it) => (
              <option key={it.originalName} value={it.originalName}>
                {it.item} (Qty: {it.qty})
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            max={
              invoice.items.find((it) => it.originalName === selectedItem)
                ?.qty || 1
            }
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full p-2 mb-3 bg-gray-900 border border-gray-600 rounded"
            placeholder="Quantity"
          />

          <button
            onClick={handleReturn}
            className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Process Return
          </button>
        </div>
      )}

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
};

export default ReturnItems;
