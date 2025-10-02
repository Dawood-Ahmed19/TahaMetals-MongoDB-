// "use client";

// import { useEffect, useState } from "react";
// import { generateReturnPDF } from "@/utils/generateReturnPDF";

// interface ReturnItem {
//   itemName: string;
//   qty: number;
//   rate: number;
//   refundAmount: number;
//   refundProfit: number;
//   refundWeight: number;
// }

// interface ReturnRecord {
//   _id: string;
//   returnId: string;
//   referenceInvoice: string;
//   createdAt: string;
//   itemReturned: ReturnItem | ReturnItem[];
// }

// const ShowReturned = () => {
//   const [returns, setReturns] = useState<ReturnRecord[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   const fetchReturns = async () => {
//     try {
//       const res = await fetch("/api/returns");
//       const data = await res.json();
//       if (data.success) {
//         setReturns(data.returns || []);
//       } else {
//         setReturns([]);
//       }
//     } catch (err) {
//       console.error("Error fetching returns:", err);
//       setReturns([]);
//     }
//   };

//   useEffect(() => {
//     fetchReturns();
//   }, []);

//   const filteredReturns = returns.filter(
//     (r) =>
//       r.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       r.referenceInvoice.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <span className="relative max-h-[600px] w-full overflow-y-auto bg-cardBg rounded-lg">
//       {/* Header */}
//       <div className="flex justify-between items-center px-[50px] py-[20px]">
//         <p className="text-lg text-white">Recent Returns</p>
//         <div className="flex items-center gap-4">
//           <input
//             type="text"
//             placeholder="Search by Return ID or Invoice..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="px-3 py-1 rounded text-sm border border-gray-600 text-white bg-fieldBg focus:ring-0 focus:outline-none"
//           />
//         </div>
//       </div>

//       {/* Table Header */}
//       <div className="flex items-center justify-between h-[70px] w-full bg-fieldBg px-[50px]">
//         <p className="text-white text-xs w-[120px]">Return Id</p>
//         <p className="text-white text-xs w-[120px]">Reference Invoice</p>
//         <p className="text-white text-xs w-[120px]">Date</p>
//         <p className="text-white text-xs w-[100px] text-center">Refund Amt</p>
//         <p className="text-white text-xs w-[160px] text-center">Actions</p>
//       </div>

//       {/* Table Body */}
//       <div className="relative flex flex-col gap-4 px-[50px] py-[20px]">
//         {filteredReturns.length === 0 ? (
//           <p className="text-gray-400 text-sm">No returns found.</p>
//         ) : (
//           filteredReturns.map((r) => {
//             const items = Array.isArray((r as any).itemsReturned)
//               ? (r as any).itemsReturned
//               : r.itemReturned
//               ? Array.isArray(r.itemReturned)
//                 ? r.itemReturned
//                 : [r.itemReturned]
//               : [];

//             const refundTotal = items.reduce(
//               (sum, it) => sum + (it?.refundAmount || 0),
//               0
//             );

//             return (
//               <div
//                 key={r._id}
//                 className="flex items-center justify-between text-white text-xs"
//               >
//                 <p className="w-[120px]">{r.returnId}</p>
//                 <p className="w-[120px]">{r.referenceInvoice}</p>
//                 <p className="w-[120px]">
//                   {new Date(r.createdAt).toLocaleDateString()}
//                 </p>
//                 <p className="w-[100px] text-center">
//                   {refundTotal.toLocaleString("en-US")} Rs
//                 </p>
//                 <p className="w-[160px] text-center flex gap-2 justify-center">
//                   <button
//                     onClick={() => generateReturnPDF(r.returnId)}
//                     className="text-yellow-400 hover:cursor-pointer"
//                   >
//                     Download PDF
//                   </button>
//                 </p>
//               </div>
//             );
//           })
//         )}
//       </div>
//     </span>
//   );
// };

// export default ShowReturned;

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateReturnPDF } from "@/utils/generateReturnPDF";

interface ReturnItem {
  itemName: string;
  qty: number;
  rate: number;
  refundAmount: number;
  refundProfit: number;
  refundWeight: number;
}

interface ReturnRecord {
  _id: string;
  returnId: string;
  referenceInvoice: string;
  createdAt: string;
  itemReturned?: ReturnItem | ReturnItem[];
  itemsReturned?: ReturnItem[]; // new multi-item support
}

const ShowReturned = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const fetchReturns = async () => {
    try {
      const res = await fetch("/api/returns");
      const data = await res.json();
      if (data.success) {
        setReturns(data.returns || []);
      } else {
        setReturns([]);
      }
    } catch (err) {
      console.error("Error fetching returns:", err);
      setReturns([]);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filteredReturns = returns.filter(
    (r) =>
      r.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referenceInvoice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <span className="relative max-h-[600px] w-full overflow-y-auto bg-cardBg rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-[50px] py-[20px]">
        <p className="text-lg text-white">Recent Returns</p>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by Return ID or Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 rounded text-sm border border-gray-600 text-white bg-fieldBg focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between h-[70px] w-full bg-fieldBg px-[50px]">
        <p className="text-white text-xs w-[120px]">Return Id</p>
        <p className="text-white text-xs w-[120px]">Reference Invoice</p>
        <p className="text-white text-xs w-[120px]">Date</p>
        <p className="text-white text-xs w-[100px] text-center">Refund Amt</p>
        <p className="text-white text-xs w-[200px] text-center">Actions</p>
      </div>

      {/* Table Body */}
      <div className="relative flex flex-col gap-4 px-[50px] py-[20px]">
        {filteredReturns.length === 0 ? (
          <p className="text-gray-400 text-sm">No returns found.</p>
        ) : (
          filteredReturns.map((r) => {
            const items = Array.isArray(r.itemsReturned)
              ? r.itemsReturned
              : r.itemReturned
              ? Array.isArray(r.itemReturned)
                ? r.itemReturned
                : [r.itemReturned]
              : [];

            const refundTotal = items.reduce(
              (sum, it) => sum + (it?.refundAmount || 0),
              0
            );

            return (
              <div
                key={r._id}
                className="flex items-center justify-between text-white text-xs"
              >
                <p className="w-[120px]">{r.returnId}</p>
                <p className="w-[120px]">{r.referenceInvoice}</p>
                <p className="w-[120px]">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <p className="w-[100px] text-center">
                  {refundTotal.toLocaleString("en-US")} Rs
                </p>
                <p className="w-[200px] text-center flex gap-3 justify-center">
                  <button
                    onClick={() => router.push(`/Returned/${r.returnId}`)}
                    className="text-purple-400 hover:cursor-pointer"
                  >
                    View Invoice
                  </button>

                  <button
                    onClick={() => generateReturnPDF(r.returnId)}
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
    </span>
  );
};

export default ShowReturned;
