"use client";

import { useEffect, useState } from "react";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";
import { useRouter } from "next/navigation";

interface Payment {
  amount: number;
  date: string;
}

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  discount: number;
  amount: number;
  total: number;
  grandTotal: number;
  payments?: Payment[];
  status: string;
  quotationTotalProfit?: number;
}

const ShowInvoices = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayments, setShowPayments] = useState<Quotation | null>(null);
  const [addPaymentFor, setAddPaymentFor] = useState<Quotation | null>(null);
  const [newPayment, setNewPayment] = useState({ amount: 0, date: "" });
  const [filterOption, setFilterOption] = useState("All");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const getReceived = (q: Quotation): number =>
    q.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const getBalance = (q: Quotation): number => q.grandTotal - getReceived(q);

  const fetchQuotations = async () => {
    try {
      const query = new URLSearchParams();
      if (filterOption !== "All") query.append("status", filterOption);
      if (searchTerm.trim()) query.append("search", searchTerm.trim());

      const res = await fetch(`/api/quotations?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuotations(data.quotations || []);
      } else {
        setQuotations([]);
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
      setQuotations([]);
    }
  };

  useEffect(() => {
    if (addPaymentFor) setErrorMessage("");
  }, [addPaymentFor]);

  useEffect(() => {
    fetchQuotations();
  }, [filterOption, searchTerm]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPaymentFor?._id) return;

    const balance = getBalance(addPaymentFor);
    if (newPayment.amount > balance) {
      setErrorMessage("You can't add more amount than Balance remaining");
      return;
    }
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/quotations/${encodeURIComponent(addPaymentFor._id)}/addPayments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(newPayment.amount),
            date: newPayment.date || new Date().toISOString(),
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(
          `Failed to add payment: ${errorData.message || res.statusText}`
        );
        return;
      }

      const data = await res.json();
      if (data.success) {
        await fetchQuotations();
      } else {
        setErrorMessage("Invalid server response");
      }
    } catch (err) {
      setErrorMessage("An error occurred while adding payment");
    } finally {
      setAddPaymentFor(null);
      setNewPayment({ amount: 0, date: "" });
    }
  };

  return (
    <span className="relative max-h-[600px] w-full overflow-y-auto bg-cardBg rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-[50px] py-[20px]">
        <p className="text-lg text-white">Recent Invoices</p>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by Invoice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 rounded text-sm border border-gray-600 text-white bg-fieldBg focus:ring-0 focus:outline-none"
          />
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="px-3 py-1 rounded text-sm border border-gray-600 text-white bg-fieldBg focus:ring-0 focus:outline-none"
          >
            <option value="All">All</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between h-[70px] w-full bg-fieldBg px-[50px]">
        <p className="text-white text-xs w-[100px]">Invoice Id</p>
        <p className="text-white text-xs w-[120px]">Date</p>
        <p className="text-white text-xs w-[80px] text-center">Discount</p>
        <p className="text-white text-xs w-[100px] text-center">Amount</p>
        <p className="text-white text-xs w-[100px] text-center">Received</p>
        <p className="text-white text-xs w-[100px] text-center">Balance</p>
        <p className="text-white text-xs w-[160px] text-center">Actions</p>
      </div>

      {/* Table Body */}
      <div className="relative flex flex-col gap-4 px-[50px] py-[20px]">
        {quotations.length === 0 ? (
          <p className="text-gray-400 text-sm">No matching invoices.</p>
        ) : (
          quotations.map((q) => {
            const received = getReceived(q);
            const balance = getBalance(q);
            const isReturned = q.status === "returned";

            return (
              <div
                key={q._id}
                className={`flex items-center justify-between text-white text-xs ${
                  isReturned ? "opacity-50" : ""
                }`}
              >
                <p className="w-[100px]">
                  {q.quotationId} {isReturned ? "(returned)" : ""}
                </p>
                <p className="w-[120px]">
                  {new Date(q.date).toLocaleDateString()}
                </p>
                <p className="w-[80px] text-center">
                  {q.discount.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}{" "}
                  Rs
                </p>
                <p className="w-[100px] text-center">
                  {q.grandTotal.toLocaleString("en-US")} Rs
                </p>
                <p className="w-[100px] text-center">
                  {isReturned ? (
                    <span className="text-red-400 font-bold">Returned</span>
                  ) : received > 0 ? (
                    `${received.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} Rs`
                  ) : (
                    <span className="text-red-400 font-semibold">Unpaid</span>
                  )}
                </p>
                <p className="w-[100px] text-center">
                  {isReturned ? (
                    <span className="text-red-400 font-bold">Returned</span>
                  ) : balance > 0 ? (
                    `${balance.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} Rs`
                  ) : (
                    <span className="text-green-400 font-semibold">Paid</span>
                  )}
                </p>
                <p className="w-[160px] text-center flex gap-2 justify-center">
                  <button
                    onClick={() =>
                      setShowPayments({
                        ...q,
                        payments: q.payments || [],
                      })
                    }
                    className="text-blue-400 hover:cursor-pointer"
                  >
                    View Payments
                  </button>
                  <button
                    disabled={balance <= 0}
                    onClick={() => balance > 0 && setAddPaymentFor(q)}
                    className={`${
                      balance <= 0
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-green-400 hover:cursor-pointer"
                    }`}
                  >
                    Add Payment
                  </button>
                  {/* View Invoice */}
                  <button
                    onClick={() => router.push(`/Invoice/${q._id}`)}
                    className="text-purple-400 hover:cursor-pointer"
                  >
                    View Invoice
                  </button>

                  {/* Download PDF */}

                  <button
                    onClick={async () => {
                      await generateInvoicePDF(q.quotationId);
                    }}
                    className="text-yellow-400 hover:cursor-pointer"
                  >
                    Download PDF
                  </button>
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Payments Modal */}
      {showPayments && (
        <div className="fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-2">
              Payments for {showPayments.quotationId}
            </h2>
            <ul>
              {showPayments.payments?.map((p, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b py-1 text-sm"
                >
                  <span>{new Date(p.date).toLocaleDateString()}</span>
                  <span>
                    {p.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Rs
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="mt-4 px-3 py-1 bg-gray-600 text-white rounded"
              onClick={() => setShowPayments(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {addPaymentFor && (
        <div className="fixed inset-0 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-2">
              Add Payment for {addPaymentFor.quotationId}
            </h2>
            <form onSubmit={handleAddPayment} className="flex flex-col gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={newPayment.amount}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, amount: +e.target.value })
                }
                min="0"
                className="border p-2 text-sm"
              />
              <input
                type="date"
                value={newPayment.date}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, date: e.target.value })
                }
                className="border p-2 text-sm"
              />
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              <button
                type="submit"
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            </form>
            <button
              className="mt-2 px-3 py-1 bg-gray-500 text-white rounded"
              onClick={() => {
                setAddPaymentFor(null);
                setErrorMessage("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </span>
  );
};

export default ShowInvoices;
