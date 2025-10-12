"use client";
import { useEffect, useState } from "react";

export default function SalariesPage() {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    monthlySalary: "",
  });

  async function fetchEmployees() {
    const res = await fetch("/api/employees");
    if (res.ok) setEmployees(await res.json());
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function handleAddEmployee() {
    if (!newEmployee.name || !newEmployee.role || !newEmployee.monthlySalary)
      return;

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmployee),
    });

    if (res.ok) {
      setNewEmployee({ name: "", role: "", monthlySalary: "" });
      fetchEmployees();
    }
  }

  return (
    <div className="min-h-screen w-full p-8 text-white flex flex-col">
      {/* Header */}
      <h2 className="text-2xl font-semibold mb-6 text-white">Employees</h2>

      {/* Add employee inputs above table */}
      <div
        className="flex items-center gap-3 p-4 mb-6 rounded-md"
        style={{ backgroundColor: "var(--color-BgColor)" }}
      >
        <input
          placeholder="Name"
          value={newEmployee.name}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, name: e.target.value })
          }
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[200px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
        <input
          placeholder="Role"
          value={newEmployee.role}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, role: e.target.value })
          }
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[200px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
        <input
          type="number"
          placeholder="Monthly Salary"
          value={newEmployee.monthlySalary}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, monthlySalary: e.target.value })
          }
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[180px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />

        <button
          onClick={handleAddEmployee}
          className="px-5 py-2 rounded-md font-semibold text-sm transition-all"
          style={{
            backgroundColor: "var(--color-iconColor)",
            color: "white",
          }}
        >
          Add
        </button>
      </div>

      {/* Table */}
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
              <th className="text-left p-3">Employee Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Monthly Salary</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((emp: any, index: number) => (
                <tr
                  key={emp._id}
                  className="border-t text-gray-200"
                  style={{ borderColor: "var(--color-cardBg)" }}
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{emp.role}</td>
                  <td className="p-3">{emp.monthlySalary}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center p-6 text-gray-500"
                  style={{ backgroundColor: "var(--color-dashboardBg)" }}
                >
                  No employees added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
