// "use client";

// import React, { useEffect, useState } from "react";
// import { v4 as uuidv4 } from "uuid";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// type QuotationRow = {
//   qty: number | "";
//   item: string;
//   weight: number | "";
//   rate: number | "";
//   amount: number;
//   uniqueKey: string;
// };

// interface InventoryItem {
//   name: string;
//   type: string; // 👈 important for branching
//   weight?: number; // total stock weight (per Kg items only)
//   quantity: number;
//   pricePerKg?: number; // per Kg items (pipe, plate)
//   pricePerUnit?: number; // Bands
// }

// const QuotationTable: React.FC<{ onSaveSuccess?: () => void }> = ({
//   onSaveSuccess,
// }) => {
//   const [rows, setRows] = useState<QuotationRow[]>(
//     Array.from({ length: 14 }, () => ({
//       qty: 0,
//       item: "",
//       weight: 0,
//       rate: 0,
//       amount: 0,
//       uniqueKey: uuidv4(),
//     }))
//   );

//   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
//   const [discount, setDiscount] = useState<number>(0);
//   const [received, setReceived] = useState<number>(0);
//   const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
//   const [quotationId, setQuotationId] = useState<string>("");

//   useEffect(() => {
//     const fetchInventory = async () => {
//       try {
//         const res = await fetch("/api/inventory");
//         const data = await res.json();
//         if (data.success) {
//           setInventoryItems(data.items || []);
//         }
//       } catch (err) {
//         console.error("Error fetching inventory:", err);
//       }
//     };
//     fetchInventory();
//   }, []);

//   // Totals
//   const total = rows.reduce((acc, row) => acc + row.amount, 0);
//   const grandTotal = total - discount;
//   const balance = grandTotal - received;

//   // =================== HELPERS ===================
//   const calculateRow = (selected: InventoryItem, qty: number) => {
//     // Default values
//     let weight = 0;
//     let rate = 0;
//     let amount = 0;

//     // ✅ Band: per-unit, no weight
//     if (
//       selected.type === "hardware" &&
//       selected.name.toLowerCase() === "band"
//     ) {
//       weight = 0;
//       rate = selected.pricePerUnit ?? 0;
//       amount = qty * rate;
//     }
//     // ✅ Normal: per-Kg
//     else {
//       const singlePieceWeight =
//         selected.quantity > 0 ? (selected.weight ?? 0) / selected.quantity : 0;

//       const sellingPricePerKg = (selected.pricePerKg ?? 0) + 10; // markup +10
//       const unitPrice = singlePieceWeight * sellingPricePerKg;

//       weight = qty * singlePieceWeight;
//       rate = unitPrice;
//       amount = qty * rate;
//     }

//     return { weight, rate, amount };
//   };

//   // =================== HandleChange ===================
//   const handleChange = (
//     index: number,
//     field: keyof QuotationRow,
//     value: any
//   ) => {
//     const newRows = [...rows];
//     let numValue = Number(value);
//     if (isNaN(numValue) || numValue < 0) numValue = 0;

//     if (field === "item") {
//       const selected = inventoryItems.find((inv) => inv.name === value);

//       if (selected) {
//         const qty = 1;
//         const { weight, rate, amount } = calculateRow(selected, qty);

//         newRows[index] = {
//           ...newRows[index],
//           item: value,
//           qty,
//           weight,
//           rate,
//           amount,
//         };
//       } else {
//         newRows[index] = { ...newRows[index], item: value };
//       }
//     } else if (field === "qty") {
//       const selected = inventoryItems.find(
//         (inv) => inv.name === newRows[index].item
//       );

//       if (selected) {
//         if (numValue > selected.quantity) {
//           numValue = selected.quantity;
//           alert(`Only ${selected.quantity} units available in stock!`);
//         }

//         newRows[index] = { ...newRows[index], qty: numValue };

//         if (numValue > 0) {
//           const { weight, rate, amount } = calculateRow(selected, numValue);
//           newRows[index].weight = weight;
//           newRows[index].rate = rate;
//           newRows[index].amount = amount;
//         } else {
//           newRows[index].weight = 0;
//           newRows[index].rate = 0;
//           newRows[index].amount = 0;
//         }
//       } else {
//         newRows[index].qty = numValue;
//       }
//     } else {
//       newRows[index] = { ...newRows[index], [field]: numValue };
//       const qty = Number(newRows[index].qty) || 0;
//       const rate = Number(newRows[index].rate) || 0;
//       newRows[index].amount = qty * rate;
//     }

//     setRows(newRows);
//   };

//   // =================== Save Quotation ===================
//   const saveQuotation = async () => {
//     const validRows = rows.filter((r) => r.item && r.qty && r.rate);

//     if (validRows.length === 0) {
//       alert("Please add at least one item before saving.");
//       return;
//     }

//     try {
//       const res = await fetch("/api/quotations", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           items: validRows.map((r) => ({
//             item: r.item,
//             qty: Number(r.qty),
//             weight: Number(r.weight),
//             rate: Number(r.rate),
//           })),
//           discount,
//           total,
//           grandTotal,
//           payments:
//             received > 0
//               ? [{ amount: received, date: new Date().toISOString() }]
//               : [],
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok || !data.success) {
//         throw new Error(data?.error || "Failed to save quotation");
//       }

//       setQuotationId(data.quotation?.quotationId || "");
//       alert("✅ Quotation saved & inventory updated!");

//       if (onSaveSuccess) onSaveSuccess();
//     } catch (err: any) {
//       console.error("Error in saveQuotation:", err.message);
//       alert("❌ Error saving quotation: " + err.message);
//     }
//   };

//   // =================== PDF Generation ===================
//   const handleDownloadPDF = async () => {
//     try {
//       setIsGeneratingPdf(true);
//       const doc = new jsPDF({ unit: "pt", format: "a4" });

//       const brandX = 40,
//         brandY = 30;
//       doc.setFontSize(18);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor(253, 186, 116);
//       doc.text("Taha", brandX, brandY);
//       const tahaWidth = (doc as any).getTextWidth("Taha");
//       doc.setTextColor(0, 0, 0);
//       doc.text("Metals", brandX + tahaWidth + 6, brandY);
//       doc.setFontSize(11);
//       doc.setFont("helvetica", "normal");
//       doc.text("Invoice / Quotation", brandX, brandY + 18);

//       const pageWidth =
//         typeof doc.internal.pageSize.getWidth === "function"
//           ? doc.internal.pageSize.getWidth()
//           : (doc.internal.pageSize as any).width;
//       const rightX = pageWidth - 50;
//       const today = new Date().toLocaleDateString();
//       doc.setFontSize(10);
//       doc.text(`Date: ${today}`, rightX, brandY, { align: "right" });

//       if (quotationId) {
//         doc.setFontSize(9);
//         doc.setFont("helvetica", "bold");
//         doc.setTextColor(107, 114, 128);
//         doc.text(`Quotation ID: ${quotationId}`, rightX, brandY + 15, {
//           align: "right",
//         });
//         doc.setTextColor(0, 0, 0);
//       }

//       const head = [["Qty", "Item", "Weight", "Rate", "Amount"]];
//       const body = rows
//         .filter((r) => r.item && r.qty && r.rate)
//         .map((r) => [
//           String(r.qty),
//           r.item,
//           Number.isNaN(Number(r.weight)) ? "0.00" : Number(r.weight).toFixed(2),
//           Number.isNaN(Number(r.rate)) ? "0.00" : Number(r.rate).toFixed(2),
//           Number.isNaN(Number(r.amount)) ? "0.00" : Number(r.amount).toFixed(2),
//         ]);

//       (autoTable as any)(doc, {
//         head,
//         body,
//         startY: 100,
//         theme: "striped",
//         styles: { fontSize: 10 },
//         headStyles: { fillColor: [45, 55, 72], textColor: 255 },
//         margin: { left: 40, right: 40 },
//       });

//       const finalY = (doc as any).lastAutoTable.finalY + 20;
//       const rightXTotal = pageWidth - 160;
//       doc.setFontSize(11);
//       doc.text(`TOTAL: ${total.toFixed(2)}`, rightXTotal, finalY);
//       doc.text(`DISCOUNT: ${discount.toFixed(2)}`, rightXTotal, finalY + 16);
//       doc.text(`BALANCE: ${balance.toFixed(2)}`, rightXTotal, finalY + 32);
//       doc.text(
//         `GRAND TOTAL: ${grandTotal.toFixed(2)}`,
//         rightXTotal,
//         finalY + 48
//       );

//       doc.setFontSize(10);
//       doc.text(
//         "Thank you for Purchasing!",
//         40,
//         (doc.internal.pageSize as any).height - 40
//       );

//       const filename = `invoice_${
//         quotationId || new Date().toISOString().slice(0, 10)
//       }.pdf`;
//       doc.save(filename);

//       // Reset
//       setRows(
//         Array.from({ length: 14 }, () => ({
//           qty: 0,
//           item: "",
//           weight: 0,
//           rate: 0,
//           amount: 0,
//           uniqueKey: uuidv4(),
//         }))
//       );
//       setDiscount(0);
//       setReceived(0);
//       setQuotationId("");
//     } catch (err) {
//       console.error("Error generating PDF:", err);
//       alert("Failed to generate PDF");
//     } finally {
//       setIsGeneratingPdf(false);
//     }
//   };

//   return (
//     <>
//       <div
//         id="invoice-section"
//         className="flex justify-center items-center max-w-[600px] max-h-[600px] h-full bg-gray-900 text-xs"
//       >
//         <table
//           className="text-white"
//           style={{ width: "600px", height: "600px" }}
//         >
//           <thead>
//             <tr className="bg-gray-800 text-center">
//               <th className="border border-white p-2 w-[60px]">Qty</th>
//               <th className="border border-white p-2 w-[180px]">Item</th>
//               <th className="border border-white p-2 w-[100px]">Weight</th>
//               <th className="border border-white p-2 w-[120px]">Rate</th>
//               <th className="border border-white p-2 w-[140px]">Amount</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((row, i) => (
//               <tr key={i} className="text-center">
//                 <td className="border border-white">
//                   <input
//                     min={0}
//                     type="number"
//                     step={1}
//                     value={Number.isNaN(row.qty) ? "" : row.qty}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       const parsedValue =
//                         value === "" ? 0 : parseInt(value, 10);
//                       handleChange(
//                         i,
//                         "qty",
//                         Number.isNaN(parsedValue) ? 0 : parsedValue
//                       );
//                     }}
//                     className="bg-transparent text-center w-full outline-none"
//                     max={
//                       inventoryItems.find((inv) => inv.name === row.item)
//                         ?.quantity || undefined
//                     }
//                   />
//                 </td>

//                 <td className="border border-white">
//                   <input
//                     type="text"
//                     value={row.item || ""}
//                     onChange={(e) => handleChange(i, "item", e.target.value)}
//                     className="bg-transparent text-center w-full outline-none"
//                     list="inventory-options"
//                   />
//                   <datalist id="inventory-options">
//                     {inventoryItems
//                       .filter((inv) => inv.quantity > 0)
//                       .map((inv, idx) => (
//                         <option key={idx} value={inv.name} />
//                       ))}
//                   </datalist>
//                 </td>

//                 <td className="border border-white">
//                   <input
//                     min={0}
//                     type="text"
//                     value={
//                       row.weight && !Number.isNaN(row.weight)
//                         ? Number(row.weight).toFixed(2)
//                         : ""
//                     }
//                     readOnly
//                     className="bg-transparent text-center w-full outline-none"
//                   />
//                 </td>

//                 <td className="border border-white">
//                   <input
//                     min={0}
//                     type="number"
//                     value={
//                       Number.isNaN(row.rate) || row.rate === 0 ? "" : row.rate
//                     }
//                     onChange={(e) => handleChange(i, "rate", e.target.value)}
//                     className="bg-transparent text-center w-full outline-none"
//                   />
//                 </td>

//                 <td className="border border-white">
//                   {Number.isNaN(row.amount) || row.amount === 0
//                     ? ""
//                     : row.amount.toLocaleString("en-US", {
//                         minimumFractionDigits: 0,
//                         maximumFractionDigits: 2,
//                       })}
//                 </td>
//               </tr>
//             ))}

//             {/* Totals */}
//             <tr className="bg-gray-800 font-bold">
//               <td colSpan={3} />
//               <td className="border border-white text-center">TOTAL</td>
//               <td className="border border-white text-center">
//                 {total.toFixed(2)}
//               </td>
//             </tr>
//             <tr className="bg-gray-800 font-bold">
//               <td colSpan={3} />
//               <td className="border border-white text-center">DISCOUNT</td>
//               <td className="border border-white text-center">
//                 <input
//                   type="number"
//                   min={0}
//                   value={discount}
//                   onChange={(e) => setDiscount(Number(e.target.value) || 0)}
//                   className="bg-transparent text-center w-full outline-none"
//                 />
//               </td>
//             </tr>
//             <tr className="bg-gray-800 font-bold">
//               <td colSpan={3} />
//               <td className="border border-white text-center">RECEIVED</td>
//               <td className="border border-white text-center">
//                 <input
//                   type="number"
//                   min={0}
//                   value={received}
//                   onChange={(e) => setReceived(Number(e.target.value) || 0)}
//                   className="bg-transparent text-center w-full outline-none"
//                 />
//               </td>
//             </tr>
//             <tr className="bg-gray-800 font-bold">
//               <td colSpan={3} />
//               <td className="border border-white text-center">BALANCE</td>
//               <td className="border border-white text-center">
//                 {balance.toFixed(2)}
//               </td>
//             </tr>
//             <tr className="bg-gray-800 font-bold">
//               <td colSpan={3} />
//               <td className="border border-white text-center">GRAND TOTAL</td>
//               <td className="border border-white text-center">
//                 {grandTotal.toFixed(2)}
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       <span className="no-print flex items-center gap-4">
//         <button
//           onClick={saveQuotation}
//           className="mt-4 bg-blue-600 px-4 py-2 rounded text-white hover:cursor-pointer"
//         >
//           Save
//         </button>
//         <button
//           onClick={handleDownloadPDF}
//           disabled={isGeneratingPdf || !quotationId}
//           className="mt-4 bg-green-600 px-4 py-2 rounded text-white hover:cursor-pointer"
//         >
//           {isGeneratingPdf
//             ? "Generating..."
//             : !quotationId
//             ? "Save first"
//             : "Download PDF"}
//         </button>
//       </span>
//     </>
//   );
// };

// export default QuotationTable;

"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type QuotationRow = {
  qty: number | "";
  item: string;
  weight: number | "";
  rate: number | "";
  amount: number;
  uniqueKey: string;
};

interface InventoryItem {
  name: string;
  type: string; // 👈 important for branching
  weight?: number; // total stock weight (per Kg items only)
  quantity: number;
  pricePerKg?: number; // per Kg items (pipe, plate)
  pricePerUnit?: number; // Bands
}

const QuotationTable: React.FC<{ onSaveSuccess?: () => void }> = ({
  onSaveSuccess,
}) => {
  const [rows, setRows] = useState<QuotationRow[]>(
    Array.from({ length: 14 }, () => ({
      qty: 0,
      item: "",
      weight: 0,
      rate: 0,
      amount: 0,
      uniqueKey: uuidv4(),
    }))
  );

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [received, setReceived] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [quotationId, setQuotationId] = useState<string>("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (data.success) {
          console.log("Fetched Inventory Items:", data.items); // Debug log
          setInventoryItems(data.items || []);
        } else {
          console.error("Fetch failed:", data.message);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    };
    fetchInventory();
  }, []);

  // Totals
  const total = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
  const grandTotal = total - discount;
  const balance = grandTotal - received;

  // =================== HELPERS ===================
  const calculateRow = (selected: InventoryItem, qty: number) => {
    let weight = 0;
    let rate = 0;
    let amount = 0;

    if (!selected || !selected.name) {
      console.warn("Invalid selected item:", selected);
      return { weight, rate, amount };
    }

    if (
      selected.type === "hardware" &&
      selected.name.toLowerCase() === "band"
    ) {
      weight = 0;
      rate = selected.pricePerUnit ?? 0;
      if (isNaN(rate) || rate < 0 || rate > 1e6) {
        console.warn("Invalid pricePerUnit for band:", selected.name, rate);
        rate = 0;
      }
      amount = qty * rate;
    } else {
      const singlePieceWeight =
        selected.quantity > 0 ? (selected.weight ?? 0) / selected.quantity : 0;
      if (
        isNaN(singlePieceWeight) ||
        singlePieceWeight <= 0 ||
        singlePieceWeight > 1e6
      ) {
        console.warn(
          "Invalid singlePieceWeight:",
          selected.name,
          singlePieceWeight,
          "quantity:",
          selected.quantity,
          "weight:",
          selected.weight
        );
        return { weight: 0, rate: 0, amount: 0 };
      }

      const sellingPricePerKg = (selected.pricePerKg ?? 0) + 10; // markup +10
      if (
        isNaN(sellingPricePerKg) ||
        sellingPricePerKg <= 0 ||
        sellingPricePerKg > 1e6
      ) {
        console.warn(
          "Invalid sellingPricePerKg:",
          selected.name,
          sellingPricePerKg
        );
        return { weight: 0, rate: 0, amount: 0 };
      }

      const unitPrice = singlePieceWeight * sellingPricePerKg;
      if (isNaN(unitPrice) || unitPrice <= 0 || unitPrice > 1e6) {
        console.warn("Invalid unitPrice:", selected.name, unitPrice);
        return { weight: 0, rate: 0, amount: 0 };
      }

      weight = qty * singlePieceWeight;
      rate = unitPrice;
      amount = qty * rate;
    }

    console.log("Calculated values:", {
      weight,
      rate,
      amount,
      item: selected.name,
      qty,
    }); // Debug log
    return { weight, rate, amount };
  };

  // =================== HandleChange ===================
  const handleChange = (
    index: number,
    field: keyof QuotationRow,
    value: any
  ) => {
    const newRows = [...rows];
    let numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) numValue = 0;

    if (field === "item") {
      const selected = inventoryItems.find((inv) => inv.name === value);
      if (selected) {
        const qty = newRows[index].qty || 1;
        const { weight, rate, amount } = calculateRow(selected, qty);
        newRows[index] = {
          ...newRows[index],
          item: value,
          qty,
          weight,
          rate,
          amount,
        };
      } else {
        newRows[index] = {
          ...newRows[index],
          item: value,
          rate: 0,
          weight: 0,
          amount: 0,
        }; // Reset if no item
      }
    } else if (field === "qty") {
      const selected = inventoryItems.find(
        (inv) => inv.name === newRows[index].item
      );
      if (selected) {
        if (numValue > selected.quantity) {
          numValue = selected.quantity;
          alert(`Only ${selected.quantity} units available in stock!`);
        }
        newRows[index] = { ...newRows[index], qty: numValue };
        if (numValue > 0) {
          const { weight, rate, amount } = calculateRow(selected, numValue);
          newRows[index].weight = weight;
          newRows[index].rate = rate;
          newRows[index].amount = amount;
        } else {
          newRows[index].weight = 0;
          newRows[index].rate = 0;
          newRows[index].amount = 0;
        }
      } else {
        newRows[index].qty = numValue;
        newRows[index].weight = 0;
        newRows[index].rate = 0;
        newRows[index].amount = 0;
      }
    } else {
      newRows[index] = { ...newRows[index], [field]: numValue };
      const qty = Number(newRows[index].qty) || 0;
      const rate = Number(newRows[index].rate) || 0;
      newRows[index].amount = qty * rate;
    }

    setRows(newRows);
  };

  // =================== Save Quotation ===================
  const saveQuotation = async () => {
    const validRows = rows.filter((r) => r.item && r.qty && r.rate);

    if (validRows.length === 0) {
      alert("Please add at least one item before saving.");
      return;
    }

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validRows.map((r) => ({
            item: r.item,
            qty: Number(r.qty),
            weight: Number(r.weight),
            rate: Number(r.rate),
          })),
          discount,
          total,
          grandTotal,
          payments:
            received > 0
              ? [{ amount: received, date: new Date().toISOString() }]
              : [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to save quotation");
      }

      setQuotationId(data.quotation?.quotationId || "");
      alert("✅ Quotation saved & inventory updated!");

      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      console.error("Error in saveQuotation:", err.message);
      alert("❌ Error saving quotation: " + err.message);
    }
  };

  // =================== PDF Generation ===================
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const brandX = 40,
        brandY = 30;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(253, 186, 116);
      doc.text("Taha", brandX, brandY);
      const tahaWidth = (doc as any).getTextWidth("Taha");
      doc.setTextColor(0, 0, 0);
      doc.text("Metals", brandX + tahaWidth + 6, brandY);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Invoice / Quotation", brandX, brandY + 18);

      const pageWidth =
        typeof doc.internal.pageSize.getWidth === "function"
          ? doc.internal.pageSize.getWidth()
          : (doc.internal.pageSize as any).width;
      const rightX = pageWidth - 50;
      const today = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.text(`Date: ${today}`, rightX, brandY, { align: "right" });

      if (quotationId) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 114, 128);
        doc.text(`Quotation ID: ${quotationId}`, rightX, brandY + 15, {
          align: "right",
        });
        doc.setTextColor(0, 0, 0);
      }

      const head = [["Qty", "Item", "Weight", "Rate", "Amount"]];
      const body = rows
        .filter((r) => r.item && r.qty && r.rate)
        .map((r) => [
          String(r.qty),
          r.item,
          Number.isNaN(Number(r.weight))
            ? "0"
            : Number(r.weight).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          Number.isNaN(Number(r.rate))
            ? "0"
            : Number(r.rate).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          Number.isNaN(Number(r.amount))
            ? "0"
            : Number(r.amount).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
        ]);

      (autoTable as any)(doc, {
        head,
        body,
        startY: 100,
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [45, 55, 72], textColor: 255 },
        margin: { left: 40, right: 40 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;
      const rightXTotal = pageWidth - 160;
      doc.setFontSize(11);
      doc.text(
        `TOTAL: ${total.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
        rightXTotal,
        finalY
      );
      doc.text(
        `DISCOUNT: ${discount.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
        rightXTotal,
        finalY + 16
      );
      doc.text(
        `BALANCE: ${balance.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
        rightXTotal,
        finalY + 32
      );
      doc.text(
        `GRAND TOTAL: ${grandTotal.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
        rightXTotal,
        finalY + 48
      );

      doc.setFontSize(10);
      doc.text(
        "Thank you for Purchasing!",
        40,
        (doc.internal.pageSize as any).height - 40
      );

      const filename = `invoice_${
        quotationId || new Date().toISOString().slice(0, 10)
      }.pdf`;
      doc.save(filename);

      // Reset
      setRows(
        Array.from({ length: 14 }, () => ({
          qty: 0,
          item: "",
          weight: 0,
          rate: 0,
          amount: 0,
          uniqueKey: uuidv4(),
        }))
      );
      setDiscount(0);
      setReceived(0);
      setQuotationId("");
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      <div
        id="invoice-section"
        className="flex justify-center items-center max-w-[600px] max-h-[600px] h-full bg-gray-900 text-xs"
      >
        <table
          className="text-white"
          style={{ width: "600px", height: "600px" }}
        >
          <thead>
            <tr className="bg-gray-800 text-center">
              <th className="border border-white p-2 w-[60px]">Qty</th>
              <th className="border border-white p-2 w-[180px]">Item</th>
              <th className="border border-white p-2 w-[100px]">Weight</th>
              <th className="border border-white p-2 w-[120px]">Rate</th>
              <th className="border border-white p-2 w-[140px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="text-center">
                <td className="border border-white">
                  <input
                    min={0}
                    type="number"
                    step={1}
                    value={Number.isNaN(row.qty) ? "" : row.qty}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsedValue =
                        value === "" ? 0 : parseInt(value, 10);
                      handleChange(
                        i,
                        "qty",
                        Number.isNaN(parsedValue) ? 0 : parsedValue
                      );
                    }}
                    className="bg-transparent text-center w-full outline-none"
                    max={
                      inventoryItems.find((inv) => inv.name === row.item)
                        ?.quantity || undefined
                    }
                  />
                </td>

                <td className="border border-white">
                  <input
                    type="text"
                    value={row.item || ""}
                    onChange={(e) => handleChange(i, "item", e.target.value)}
                    className="bg-transparent text-center w-full outline-none"
                    list="inventory-options"
                  />
                  <datalist id="inventory-options">
                    {inventoryItems
                      .filter((inv) => inv.quantity > 0)
                      .map((inv, idx) => (
                        <option key={idx} value={inv.name} />
                      ))}
                  </datalist>
                </td>

                <td className="border border-white">
                  <input
                    min={0}
                    type="text"
                    value={
                      row.weight && !Number.isNaN(row.weight)
                        ? row.weight.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })
                        : ""
                    }
                    readOnly
                    className="bg-transparent text-center w-full outline-none"
                  />
                </td>

                <td className="border border-white">
                  <input
                    min={0}
                    type="number"
                    value={
                      Number.isNaN(row.rate) || row.rate === 0
                        ? ""
                        : Number(row.rate).toFixed(2) // Enforce 2 decimal places
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsedValue = value === "" ? 0 : parseFloat(value);
                      const limitedValue = Math.round(parsedValue * 100) / 100; // Round to 2 decimals
                      handleChange(
                        i,
                        "rate",
                        Number.isNaN(limitedValue) ? 0 : limitedValue
                      );
                    }}
                    className="bg-transparent text-center w-full outline-none"
                    step="0.01" // Enforce 2 decimal increments
                  />
                </td>

                <td className="border border-white">
                  {Number.isNaN(row.amount) || row.amount === 0
                    ? ""
                    : row.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                </td>
              </tr>
            ))}

            {/* Totals */}
            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">TOTAL</td>
              <td className="border border-white text-center">
                {total.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">DISCOUNT</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">RECEIVED</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={received}
                  onChange={(e) => setReceived(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">BALANCE</td>
              <td className="border border-white text-center">
                {balance.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">GRAND TOTAL</td>
              <td className="border border-white text-center">
                {grandTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <span className="no-print flex items-center gap-4">
        <button
          onClick={saveQuotation}
          className="mt-4 bg-blue-600 px-4 py-2 rounded text-white hover:cursor-pointer"
        >
          Save
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf || !quotationId}
          className="mt-4 bg-green-600 px-4 py-2 rounded text-white hover:cursor-pointer"
        >
          {isGeneratingPdf
            ? "Generating..."
            : !quotationId
            ? "Save first"
            : "Download PDF"}
        </button>
      </span>
    </>
  );
};

export default QuotationTable;
