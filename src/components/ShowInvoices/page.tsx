"use client";

import { useEffect, useState } from "react";

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
  grandTotal: number;
  received?: number;
  balance?: number;
  payments?: Payment[];
}

const ShowInvoices = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayments, setShowPayments] = useState<Quotation | null>(null);
  const [addPaymentFor, setAddPaymentFor] = useState<Quotation | null>(null);
  const [newPayment, setNewPayment] = useState({ amount: 0, date: "" });
  const [filterOption, setFilterOption] = useState("All");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (addPaymentFor) {
      setErrorMessage("");
    }
  }, [addPaymentFor]);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await fetch("/api/quotations");
        const data = await res.json();
        if (data.success) {
          setQuotations(data.quotations);
        } else {
          console.error("Fetch failed:", data.message);
        }
      } catch (err) {
        console.error("Error fetching quotations:", err);
      }
    };
    fetchQuotations();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPaymentFor?._id) return;

    const payments = Array.isArray(addPaymentFor.payments)
      ? addPaymentFor.payments
      : addPaymentFor.received
      ? [{ amount: addPaymentFor.received, date: addPaymentFor.date }]
      : [];
    const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
    const balance =
      (addPaymentFor.grandTotal || addPaymentFor.amount) - totalReceived;

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
        console.error("Failed to add payment:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      if (data.success && data.quotation) {
        setQuotations((prev) =>
          prev.map((q) => (q._id === data.quotation._id ? data.quotation : q))
        );
      }
    } catch (err) {
      console.error("Error while adding payment:", err);
    } finally {
      setAddPaymentFor(null);
      setNewPayment({ amount: 0, date: "" });
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const payments = Array.isArray(q.payments)
      ? q.payments
      : q.received
      ? [{ amount: q.received, date: q.date }]
      : [];
    const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
    const balance = q.grandTotal
      ? q.grandTotal - totalReceived
      : q.amount - totalReceived;

    const matchesSearch = q.quotationId
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (filterOption === "Paid") return matchesSearch && balance <= 0;
    if (filterOption === "Unpaid") return matchesSearch && balance > 0;
    return matchesSearch;
  });

  return (
    <span className="relative max-h-[600px] w-full overflow-y-auto bg-cardBg rounded-lg">
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
        <p className="text-white text-xs w-[120px] text-center">Actions</p>
      </div>

      {/* Table Body */}
      <div className="relative flex flex-col gap-4 px-[50px] py-[20px]">
        {filteredQuotations.length === 0 ? (
          <p className="text-gray-400 text-sm">No matching invoices.</p>
        ) : (
          filteredQuotations.map((q) => {
            const payments = Array.isArray(q.payments)
              ? q.payments
              : q.received
              ? [{ amount: q.received, date: q.date }]
              : [];
            const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
            const balance = q.grandTotal
              ? q.grandTotal - totalReceived
              : q.amount - totalReceived;

            return (
              <div
                key={q._id}
                className="flex items-center justify-between text-white text-xs"
              >
                <p className="w-[100px]">{q.quotationId}</p>
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
                  {q.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}{" "}
                  Rs
                </p>
                <p className="w-[100px] text-center">
                  {totalReceived > 0 ? (
                    `${totalReceived.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} Rs`
                  ) : (
                    <span className="text-red-400 font-semibold">Unpaid</span>
                  )}
                </p>
                <p className="w-[100px] text-center">
                  {balance > 0 ? (
                    `${balance.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} Rs`
                  ) : (
                    <span className="text-green-400 font-semibold">Paid</span>
                  )}
                </p>
                <p className="w-[120px] text-center flex gap-2">
                  <button
                    onClick={() => setShowPayments({ ...q, payments })}
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
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* View Payments Modal */}
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
