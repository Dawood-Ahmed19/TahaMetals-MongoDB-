"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/quotations/${id}`);
        const result = await res.json();
        if (result.success) setData(result.quotation);
      } catch (err) {
        console.error("Error loading invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Loading invoice…
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white">
        <p>Invoice not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-3 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          ← Back
        </button>
      </div>
    );

  const items = data.items || [];
  const totalProfit = items.reduce(
    (sum: number, i: any) => sum + (i.totalProfit || 0),
    0
  );

  return (
    <div className="p-8 text-white">
      <button
        onClick={() => router.back()}
        className="mb-5 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Invoice Details – {data.quotationId || id}
      </h1>

      <table className="w-full text-sm border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-800 text-center">
            <th className="border border-gray-600 p-3">Item</th>
            <th className="border border-gray-600 p-3">Qty</th>
            <th className="border border-gray-600 p-3">Rate / Unit</th>
            <th className="border border-gray-600 p-3">Cost / Unit</th>
            <th className="border border-gray-600 p-3">Profit / Unit</th>
            <th className="border border-gray-600 p-3">Total Profit</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i: any, idx: number) => (
            <tr key={idx} className="text-center hover:bg-gray-700">
              <td className="border border-gray-600 p-2">{i.item}</td>
              <td className="border border-gray-600 p-2">{i.qty}</td>
              <td className="border border-gray-600 p-2">
                {i.invoiceRatePerUnit.toLocaleString("en-US")} Rs
              </td>
              <td className="border border-gray-600 p-2">
                {i.costPerUnit.toLocaleString("en-US")} Rs
              </td>
              <td className="border border-gray-600 p-2 text-green-400">
                {i.profitPerUnit.toLocaleString("en-US")} Rs
              </td>
              <td className="border border-gray-600 p-2 text-green-400 font-semibold">
                {i.totalProfit.toLocaleString("en-US")} Rs
              </td>
            </tr>
          ))}
          <tr className="bg-gray-800 font-bold text-center">
            <td
              colSpan={5}
              className="border border-gray-600 p-2 text-right pr-4"
            >
              Total Invoice Profit:
            </td>
            <td className="border border-gray-600 p-2 text-green-400">
              {totalProfit.toLocaleString("en-US")} Rs
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
