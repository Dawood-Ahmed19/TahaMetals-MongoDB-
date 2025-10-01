"use client";

import { useEffect, useState } from "react";

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  grandTotal: number;
  quotationTotalProfit: number;
  status: string;
}

const Reports = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [filterType, setFilterType] = useState("all");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchQuotations = async () => {
    try {
      const query = new URLSearchParams({ status: "active" });

      if (filterType === "monthly") {
        query.append("month", String(month));
        query.append("year", String(year));
      } else if (filterType === "yearly") {
        query.append("year", String(year));
      } else if (filterType === "custom") {
        if (fromDate) query.append("fromDate", fromDate);
        if (toDate) query.append("toDate", toDate);
      }

      const res = await fetch(`/api/quotations?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuotations(data.quotations || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [filterType, month, year, fromDate, toDate]);

  const totalPages = Math.ceil(quotations.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = quotations.slice(startIndex, startIndex + pageSize);

  const totalAmount = paginatedData.reduce((sum, q) => sum + q.grandTotal, 0);
  const netProfit = paginatedData.reduce(
    (sum, q) => sum + (q.quotationTotalProfit || 0),
    0
  );

  return (
    <div className="h-full flex flex-col items-center gap-[30px] px-[40px] py-[30px]">
      {/* Header */}
      <span className="flex justify-between w-full items-center">
        <h1 className="text-xl font-bold text-white">Business Reports</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      {/* 🔍 Filter Section */}
      <div className="w-full flex flex-wrap gap-4 bg-gray-800 p-4 rounded">
        {/* Select filter type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-gray-900 text-white p-2 rounded"
        >
          <option value="all">All Records</option>
          <option value="monthly">Monthly Report</option>
          <option value="yearly">Yearly Report</option>
          <option value="custom">Custom Date Range</option>
        </select>

        {filterType === "monthly" && (
          <>
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-gray-900 text-white p-2 rounded w-[120px]"
              placeholder="Month"
            />
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-gray-900 text-white p-2 rounded w-[120px]"
              placeholder="Year"
            />
          </>
        )}

        {filterType === "yearly" && (
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-gray-900 text-white p-2 rounded w-[120px]"
            placeholder="Year"
          />
        )}

        {filterType === "custom" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-gray-900 text-white p-2 rounded"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-gray-900 text-white p-2 rounded"
            />
          </>
        )}

        <button
          onClick={fetchQuotations}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Apply Filter
        </button>
      </div>

      {/* Table */}
      <span className="w-full h-full max-h-[700px]">
        <div className="h-full w-full overflow-x-auto">
          <table className="w-full text-white border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-800 text-center text-sm">
                <th className="border border-gray-600 p-3">Date</th>
                <th className="border border-gray-600 p-3">Bill No</th>
                <th className="border border-gray-600 p-3">Amount</th>
                <th className="border border-gray-600 p-3">Profit</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                <>
                  {paginatedData.map((q) => (
                    <tr
                      key={q._id}
                      className="text-center text-sm hover:bg-gray-700"
                    >
                      <td className="border border-gray-700 p-2">
                        {new Date(q.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-700 p-2">
                        {q.quotationId}
                      </td>
                      <td className="border border-gray-700 p-2">
                        {q.grandTotal.toLocaleString("en-US")} Rs
                      </td>
                      <td className="border border-gray-700 p-2 text-green-400 font-semibold">
                        {q.quotationTotalProfit?.toLocaleString("en-US") || 0}{" "}
                        Rs
                      </td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="bg-gray-800 font-bold text-center text-sm">
                    <td
                      colSpan={2}
                      className="border border-gray-700 p-2 text-right pr-4"
                    >
                      Totals:
                    </td>
                    <td className="border border-gray-700 p-2">
                      {totalAmount.toLocaleString("en-US")} Rs
                    </td>
                    <td className="border border-gray-700 p-2 text-green-400">
                      {netProfit.toLocaleString("en-US")} Rs
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 p-4">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </span>
    </div>
  );
};

export default Reports;
