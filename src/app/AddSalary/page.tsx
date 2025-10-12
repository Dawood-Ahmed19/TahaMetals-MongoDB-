"use client";
import { useEffect, useState } from "react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PaySalaryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  const startYear = 2025;
  const now = new Date();
  const includeNextYear = now.getMonth() === 11;
  const endYear = includeNextYear ? now.getFullYear() + 1 : now.getFullYear();

  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  async function fetchEmployees(page = 1, query = "") {
    const url = new URL(`/api/employees`, window.location.origin);
    url.searchParams.append("page", page.toString());
    if (query) url.searchParams.append("search", query);

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const emps = Array.isArray(data) ? data : data.employees || [];
      setEmployees(emps);
      if (data.total) setTotalPages(Math.ceil(data.total / limit));
    }
  }

  async function fetchSalaryRecords() {
    const url = new URL("/api/salaries", window.location.origin);
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}`;
    url.searchParams.append("month", monthKey);

    const res = await fetch(url);
    if (res.ok) setRecords(await res.json());
  }

  useEffect(() => {
    fetchEmployees(currentPage, searchTerm);
    fetchSalaryRecords();
  }, [currentPage, searchTerm, selectedMonth, selectedYear]);

  async function handlePay(emp: any, monthIndex: number) {
    try {
      const year = selectedYear;
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

      const existing = records.find(
        (r) =>
          r.employeeId === emp._id && r.month === monthKey && r.year === year
      );

      const alreadyAdvance = Number(existing?.advancePaid || 0);
      const alreadyPaid = Number(existing?.paidAmount || 0);
      const totalSalary = Number(emp.monthlySalary || 0);
      const remaining = Math.max(0, totalSalary - alreadyAdvance - alreadyPaid);

      const payload = {
        employeeId: emp._id,
        month: monthKey,
        year,
        totalSalary,
        paidAmount: remaining,
        advancePaid: 0,
        balanceRemaining: 0,
        fullyPaid: true,
      };

      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to save salary record:", await res.text());
        return;
      }

      await fetchSalaryRecords(); // refresh table
    } catch (err) {
      console.error("Error paying salary:", err);
    }
  }

  function openAdvanceModal(emp: any) {
    setSelectedEmp(emp);
    setAdvanceAmount("");
    setShowModal(true);
  }

  async function handleAdvancePayment() {
    if (!advanceAmount || !selectedEmp) return;

    // current month/year (for actual cash outflow)
    const currentMonthKey = `${selectedYear}-${String(
      selectedMonth + 1
    ).padStart(2, "0")}`;

    // next month/year (salary record)
    const nextMonthIndex = (selectedMonth + 1) % 12;
    const nextYear = nextMonthIndex === 0 ? selectedYear + 1 : selectedYear;
    const nextMonthKey = `${nextYear}-${String(nextMonthIndex + 1).padStart(
      2,
      "0"
    )}`;

    // amounts
    const adv = Number(advanceAmount);
    const balance =
      adv >= selectedEmp.monthlySalary ? 0 : selectedEmp.monthlySalary - adv;

    const salaryPayload = {
      employeeId: selectedEmp._id,
      month: nextMonthKey,
      year: nextYear,
      totalSalary: selectedEmp.monthlySalary,
      paidAmount: 0,
      advancePaid: adv,
      balanceRemaining: balance,
      fullyPaid: balance <= 0,
    };

    const expensePayload = {
      employeeId: selectedEmp._id,
      month: currentMonthKey,
      year: selectedYear,
      totalSalary: selectedEmp.monthlySalary,
      paidAmount: adv,
      advancePaid: 0,
      balanceRemaining: selectedEmp.monthlySalary - adv,
      fullyPaid: false,
    };

    await fetch("/api/salaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(salaryPayload),
    });

    await fetch("/api/salaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expensePayload),
    });

    setShowModal(false);
    setAdvanceAmount("");
    setSelectedMonth(nextMonthIndex);

    setTimeout(() => {
      fetchSalaryRecords();
    }, 150);
  }

  const getStatus = (emp: any) => {
    const year = selectedYear;
    const monthKey = `${year}-${String(selectedMonth + 1).padStart(2, "0")}`;

    const rec = records.find(
      (r: any) =>
        r.employeeId === emp._id && r.month === monthKey && r.year === year
    );

    const nextMonthIndex = (selectedMonth + 1) % 12;
    const nextYear = nextMonthIndex === 0 ? year + 1 : year;
    const nextMonthKey = `${nextYear}-${String(nextMonthIndex + 1).padStart(
      2,
      "0"
    )}`;

    const nextRec = records.find(
      (r: any) =>
        r.employeeId === emp._id &&
        r.month === nextMonthKey &&
        r.year === nextYear
    );

    const advanceFromNext = nextRec?.advancePaid || 0;

    if (!rec)
      return {
        paid: 0,
        status: "Unpaid",
        advance: advanceFromNext,
        balance: emp.monthlySalary - advanceFromNext,
      };

    return {
      paid: rec.paidAmount,
      advance: rec.advancePaid || advanceFromNext || 0,
      status: rec.fullyPaid ? "Paid" : "Partial",
      balance: rec.balanceRemaining,
    };
  };

  return (
    <div className="w-full p-8 text-white">
      {/* Header row */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-white">Pay Salaries</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* 🔍 Search field */}
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            className="px-3 py-2 rounded-md text-sm text-white outline-none w-[220px]"
            style={{
              backgroundColor: "var(--color-cardBg)",
              border: "1px solid var(--color-IconBg)",
            }}
          />
          {/* Months */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-md text-sm text-white outline-none"
            style={{ backgroundColor: "var(--color-cardBg)" }}
          >
            {months.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          {/* Years */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-md text-sm text-white outline-none"
            style={{ backgroundColor: "var(--color-cardBg)" }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Salary Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--color-BgColor)" }}
      >
        <table className="w-full border-collapse text-sm">
          <thead
            style={{ backgroundColor: "var(--color-cardBg)", color: "#ccc" }}
          >
            <tr>
              <th className="text-left p-3">S.no</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Salary</th>
              <th className="text-left p-3">Advance</th>
              <th className="text-left p-3">Balance</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((emp: any, index: number) => {
                const { balance, status, advance } = getStatus(emp);
                return (
                  <tr
                    key={emp._id}
                    className="border-t text-gray-200"
                    style={{ borderColor: "var(--color-cardBg)" }}
                  >
                    <td className="p-3">
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td className="p-3">{emp.name}</td>
                    <td className="p-3">{emp.role}</td>
                    <td className="p-3">{emp.monthlySalary}</td>
                    <td className="p-3">{advance || 0}</td>
                    <td className="p-3">{Math.max(balance, 0)}</td>
                    <td
                      className="p-3 font-medium"
                      style={{
                        color:
                          status === "Paid"
                            ? "#22c55e"
                            : status === "Partial"
                            ? "var(--color-iconColor)"
                            : "#ef4444",
                      }}
                    >
                      {status}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handlePay(emp, selectedMonth)}
                        disabled={status === "Paid"}
                        className="px-4 py-1 text-sm rounded-md font-semibold transition-all"
                        style={{
                          backgroundColor:
                            status === "Paid"
                              ? "var(--color-cardBg)"
                              : "var(--color-iconColor)",
                          color: "white",
                          opacity: status === "Paid" ? 0.6 : 1,
                        }}
                      >
                        {status === "Paid" ? "Paid" : "Pay Now"}
                      </button>
                      <button
                        onClick={() => openAdvanceModal(emp)}
                        className="px-3 py-1 text-sm rounded-md font-semibold"
                        style={{
                          backgroundColor: "var(--color-IconBg)",
                          color: "white",
                        }}
                      >
                        Advance
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6 mb-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md border border-gray-500 disabled:opacity-30"
            >
              Prev
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md border border-gray-500 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Advance Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50">
          <div className="p-6 rounded-md shadow-xl w-[360px] bg-IconBg">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Advance Payment for {selectedEmp?.name}
            </h3>

            <input
              type="number"
              placeholder="Enter advance amount"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-white mb-5 outline-none"
              style={{ backgroundColor: "var(--color-cardBg)" }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md font-semibold"
                style={{
                  backgroundColor: "var(--color-cardBg)",
                  color: "white",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdvancePayment}
                className="px-4 py-2 rounded-md font-semibold"
                style={{
                  backgroundColor: "var(--color-iconColor)",
                  color: "white",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
