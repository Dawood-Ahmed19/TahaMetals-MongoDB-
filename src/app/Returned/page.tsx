"use client";

import { useState } from "react";

const ReturnItems = () => {
  const [invoiceId, setInvoiceId] = useState("");
  const [message, setMessage] = useState("");

  const handleReturn = async () => {
    if (!invoiceId) {
      setMessage("Please enter an Invoice ID.");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to mark invoice ${invoiceId} as returned? This will update Reports and Dashboard.`
      )
    ) {
      try {
        const res = await fetch("/api/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId }),
        });
        const data = await res.json();
        if (data.success) {
          setMessage(
            "Return processed successfully. Reports and Dashboard updated."
          );
          setInvoiceId("");
        } else {
          setMessage("Error processing return: " + data.message);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setMessage("Error: " + errorMessage);
      }
    }
  };

  return (
    <div className="px-[75px] py-[35px] h-full flex flex-col items-center gap-[50px] text-white">
      <h1 className="text-xl font-bold">Return Items</h1>
      <div className="w-full max-w-md">
        <input
          type="text"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          placeholder="Enter Invoice ID (e.g., INV-0001)"
          className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded"
        />
        <button
          onClick={handleReturn}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Process Return
        </button>
        {message && <p className="mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default ReturnItems;
