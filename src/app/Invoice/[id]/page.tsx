"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { printInvoicePDF } from "@/utils/printInvoicePDF";

const InvoiceDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/quotations/${id}`);
        const data = await res.json();
        if (data.success) {
          setInvoice(data.quotation);
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading)
    return <p className="text-white text-center p-6">Loading invoice…</p>;

  if (!invoice)
    return <p className="text-red-500 text-center p-6">Invoice not found</p>;

  // Totals
  const total = invoice.items.reduce(
    (acc: number, row: any) => acc + (row.amount || 0),
    0
  );
  const grandTotal = total - (invoice.discount || 0) + (invoice.loading || 0);
  const received =
    invoice.payments?.reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0
    ) || 0;
  const balance = grandTotal - received;
  const isPaid = balance === 0 && received === grandTotal;

  // Helper for item names
  const formatItemName = (row: any) => {
    const type = row.type?.toLowerCase();
    if (!type) return row.item;
    if (type.includes("pipe")) return `${row.type} ${row.size || ""}`.trim();
    if (type.includes("pillar")) return `${row.type} ${row.gote || ""}G`.trim();
    if (type === "hardware")
      return `${row.originalName || ""} ${row.size || ""} ${
        row.color || ""
      }`.trim();
    return row.item;
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="relative w-full max-w-3xl bg-dashboardBg p-6 rounded-lg shadow-lg overflow-hidden">
        {isPaid && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] text-[140px] font-extrabold text-white/5 tracking-widest whitespace-nowrap pointer-events-none select-none z-0">
            PAID
          </div>
        )}

        <div className="relative z-10">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-300"
          >
            ← Back
          </button>

          {/* Print Invoice button */}

          <button
            onClick={async () => {
              await printInvoicePDF(invoice.quotationId);
            }}
            className="mb-4 ml-3 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
          >
            Print Invoice
          </button>

          {invoice.customerName && (
            <p className="text-center text-white text-lg font-semibold mb-2">
              Customer: {invoice.customerName}
            </p>
          )}

          {invoice.createdBy && (
            <p className="text-center text-gray-300 text-sm mb-2">
              Created by:{" "}
              <span className="font-semibold text-white">
                {invoice.createdBy}
              </span>
            </p>
          )}

          <h1 className="text-2xl font-bold mb-2 text-center text-white">
            Invoice {invoice.quotationId}
          </h1>
          <p className="text-center text-gray-300 mb-6">
            Date: {new Date(invoice.date).toLocaleDateString()} | Status:{" "}
            <span className="capitalize">{invoice.status}</span>
          </p>

          <div className="flex justify-center">
            <table className="text-white table-auto border-collapse border border-gray-600 w-full bg-transparent">
              <thead>
                <tr className="bg-bgColor text-center h-[40px]">
                  <th className="border border-white p-2 w-[60px]">Qty</th>
                  <th className="border border-white p-2 w-[200px]">Item</th>
                  <th className="border border-white p-2 w-[80px]">Guage</th>
                  <th className="border border-white p-2 w-[80px]">Weight</th>
                  <th className="border border-white p-2 w-[100px]">Rate</th>
                  <th className="border border-white p-2 w-[100px]">Amount</th>
                </tr>
              </thead>
              <tbody className="align-top bg-transparent">
                {invoice.items.map((row: any, i: number) => (
                  <tr
                    key={row.uniqueKey || i}
                    className="text-center h-[30px] bg-transparent"
                  >
                    <td className="border border-white">{row.qty}</td>
                    <td className="border border-white">
                      {formatItemName(row)}
                    </td>
                    <td className="border border-white">{row.guage || ""}</td>
                    <td className="border border-white">
                      {row.weight
                        ? Number(row.weight).toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })
                        : ""}
                    </td>
                    <td className="border border-white">
                      {Number(row.rate).toLocaleString("en-US")}
                    </td>
                    <td className="border border-white">
                      {Number(row.amount).toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}

                {/* Totals */}
                <tr className="font-bold">
                  <td colSpan={4}></td>
                  <td className="border border-white text-center">TOTAL</td>
                  <td className="border border-white text-center">
                    {total.toLocaleString("en-US")}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4}></td>
                  <td className="border border-white text-center">DISCOUNT</td>
                  <td className="border border-white text-center">
                    {invoice.discount || 0}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4}></td>
                  <td className="border border-white text-center">LOADING</td>
                  <td className="border border-white text-center">
                    {invoice.loading || 0}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4}></td>
                  <td className="border border-white text-center">
                    GRAND TOTAL
                  </td>
                  <td className="border border-white text-center">
                    {grandTotal.toLocaleString("en-US")}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4}></td>
                  <td className="border border-white text-center">RECEIVED</td>
                  <td className="border border-white text-center">
                    {received.toLocaleString("en-US")}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4}></td>
                  <td className="border border-white text-center">BALANCE</td>
                  <td className="border border-white text-center">
                    {balance.toLocaleString("en-US")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-lg font-semibold text-white">Payments</h2>
          {invoice.payments?.length ? (
            <ul className="list-disc pl-6 mt-2 text-gray-200">
              {invoice.payments.map((p: any, i: number) => (
                <li key={i}>
                  {new Date(p.date).toLocaleDateString()} — {p.amount} Rs
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 mt-2">No payments recorded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
