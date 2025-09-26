// "use client";

// import { useEffect, useState } from "react";

// interface Quotation {
//   _id: string;
//   quotationId: string;
//   date: string;
//   grandTotal: number;
//   quotationTotalProfit: number;
// }

// const Reports = () => {
//   const [quotations, setQuotations] = useState<Quotation[]>([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const pageSize = 15;

//   const today = new Date();
//   const formattedDate = today.toLocaleDateString("en-US", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

//   const fetchQuotations = async () => {
//     try {
//       const res = await fetch("/api/quotations");
//       const data = await res.json();
//       if (data.success) {
//         setQuotations(data.quotations || []);
//       }
//     } catch (err) {
//       console.error("Error fetching quotations:", err);
//     }
//   };

//   useEffect(() => {
//     fetchQuotations();
//   }, []);

//   // ✅ Pagination logic
//   const totalPages = Math.ceil(quotations.length / pageSize) || 1;
//   const startIndex = (currentPage - 1) * pageSize;
//   const paginatedData = quotations.slice(startIndex, startIndex + pageSize);

//   // Calculate page totals
//   const totalAmount = paginatedData.reduce((sum, q) => sum + q.grandTotal, 0);
//   const netProfit = paginatedData.reduce(
//     (sum, q) => sum + (q.quotationTotalProfit || 0),
//     0
//   );

//   return (
//     <div className="px-[75px] py-[35px] h-full flex flex-col items-center gap-[50px]">
//       {/* Header */}
//       <span className="flex justify-between w-full">
//         <h1 className="text-xl font-bold text-white">Business Reports</h1>
//         <p className="text-sm text-white">{formattedDate}</p>
//       </span>

//       {/* Table */}
//       <span className="w-full h-full max-h-[700px]">
//         <div className="h-full w-full">
//           <table className="w-full text-white border-collapse">
//             <thead>
//               <tr className="bg-gray-800 text-center text-sm">
//                 <th className="border border-gray-600 p-3">Date</th>
//                 <th className="border border-gray-600 p-3">Bill No</th>
//                 <th className="border border-gray-600 p-3">Amount</th>
//                 <th className="border border-gray-600 p-3">Profit</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedData.length > 0 ? (
//                 <>
//                   {paginatedData.map((q) => (
//                     <tr
//                       key={q._id}
//                       className="text-center text-sm hover:bg-gray-700"
//                     >
//                       <td className="border border-gray-700 p-2">
//                         {new Date(q.date).toLocaleDateString()}
//                       </td>
//                       <td className="border border-gray-700 p-2">
//                         {q.quotationId}
//                       </td>
//                       <td className="border border-gray-700 p-2">
//                         {q.grandTotal.toLocaleString("en-US")} Rs
//                       </td>
//                       <td className="border border-gray-700 p-2 text-green-400 font-semibold">
//                         {q.quotationTotalProfit?.toLocaleString("en-US") || 0}{" "}
//                         Rs
//                       </td>
//                     </tr>
//                   ))}
//                   <tr className="bg-gray-800 font-bold text-center text-sm">
//                     <td
//                       colSpan={2}
//                       className="border border-gray-700 p-2 text-right pr-4"
//                     >
//                       Totals:
//                     </td>
//                     <td className="border border-gray-700 p-2">
//                       {totalAmount.toLocaleString("en-US")} Rs
//                     </td>
//                     <td className="border border-gray-700 p-2 text-green-400">
//                       {netProfit.toLocaleString("en-US")} Rs
//                     </td>
//                   </tr>
//                 </>
//               ) : (
//                 <tr>
//                   <td colSpan={4} className="text-center text-gray-400 p-4">
//                     No records found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex justify-between items-center mt-4">
//           <button
//             className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
//             onClick={() => setCurrentPage((p) => p - 1)}
//             disabled={currentPage === 1}
//           >
//             Previous
//           </button>
//           <span className="text-gray-300">
//             Page {currentPage} of {totalPages}
//           </span>
//           <button
//             className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
//             onClick={() => setCurrentPage((p) => p + 1)}
//             disabled={currentPage === totalPages}
//           >
//             Next
//           </button>
//         </div>
//       </span>
//     </div>
//   );
// };

// export default Reports;

"use client";

import { useEffect, useState } from "react";

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  grandTotal: number;
  quotationTotalProfit: number;
  status: string; // Included for type safety
}

const Reports = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchQuotations = async () => {
    try {
      const res = await fetch("/api/quotations?status=active"); // Explicitly request active invoices
      const data = await res.json();
      if (data.success) {
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(quotations.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = quotations.slice(startIndex, startIndex + pageSize);

  // Calculate page totals
  const totalAmount = paginatedData.reduce((sum, q) => sum + q.grandTotal, 0);
  const netProfit = paginatedData.reduce(
    (sum, q) => sum + (q.quotationTotalProfit || 0),
    0
  );

  return (
    <div className="px-[75px] py-[35px] h-full flex flex-col items-center gap-[50px]">
      {/* Header */}
      <span className="flex justify-between w-full">
        <h1 className="text-xl font-bold text-white">Business Reports</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      {/* Table */}
      <span className="w-full h-full max-h-[700px]">
        <div className="h-full w-full">
          <table className="w-full text-white border-collapse">
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
                    No active records found
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
