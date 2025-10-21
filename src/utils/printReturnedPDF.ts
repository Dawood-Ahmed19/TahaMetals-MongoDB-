// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// interface ReturnItem {
//   itemName: string;
//   qty: number;
//   rate: number;
//   refundAmount: number;
//   refundProfit?: number;
//   refundWeight?: number;
// }

// interface ReturnRecord {
//   returnId: string;
//   referenceInvoice: string;
//   createdAt: string;
//   itemReturned?: ReturnItem | ReturnItem[];
//   itemsReturned?: ReturnItem[];
//   customerName?: string;
// }

// export const printReturnPDF = async (returnId: string) => {
//   try {
//     // Fetch return record
//     const res = await fetch(`/api/returns/${returnId}`);
//     if (!res.ok) {
//       const text = await res.text();
//       console.error("❌ API returned non-OK:", text);
//       alert("Failed to fetch return data for printing.");
//       return;
//     }

//     const data = await res.json();
//     if (!data.success || !data.returnRecord) {
//       console.error("❌ Invalid JSON:", data);
//       alert("No return record found.");
//       return;
//     }

//     const rtn: ReturnRecord = data.returnRecord;

//     // Normalize possible schema variations
//     const items: ReturnItem[] = Array.isArray(rtn.itemsReturned)
//       ? rtn.itemsReturned
//       : rtn.itemReturned
//       ? Array.isArray(rtn.itemReturned)
//         ? rtn.itemReturned
//         : [rtn.itemReturned]
//       : [];

//     if (items.length === 0) {
//       alert("⚠️ No return items found to print.");
//       return;
//     }

//     // Fetch inventory (so we can retrieve descriptive names)
//     const inventoryRes = await fetch("/api/inventory");
//     if (!inventoryRes.ok) {
//       console.error("❌ Failed to fetch inventory:", await inventoryRes.text());
//       alert("Failed to fetch inventory data for printing.");
//       return;
//     }

//     const inventoryData = await inventoryRes.json();
//     const inventoryItems = inventoryData.success
//       ? inventoryData.items || []
//       : [];

//     // ✨ Helper for descriptive item names
//     const getDisplayItem = (itemName: string) => {
//       const invItem = inventoryItems.find((inv: any) => inv.name === itemName);
//       if (invItem) {
//         if (invItem.type.toLowerCase().includes("pillar")) {
//           return `${invItem.type} ${invItem.size ? invItem.size : ""}${
//             invItem.gote &&
//             invItem.gote.trim() !== "" &&
//             invItem.gote.toLowerCase() !== "without gote"
//               ? invItem.gote
//               : ""
//           } - ${invItem.guage || ""}`.trim();
//         } else if (invItem.type.toLowerCase() === "hardware") {
//           return `${invItem.name} ${invItem.size ? invItem.size : ""}${
//             invItem.color && invItem.color.trim() !== "" ? invItem.color : ""
//           }`.trim();
//         } else {
//           return `${invItem.type}${invItem.size ? invItem.size : ""}${
//             invItem.guage || ""
//           }`.trim();
//         }
//       }
//       return itemName;
//     };

//     // 🧾 Start the PDF
//     const doc = new jsPDF({ unit: "pt", format: "a5" });
//     const brandX = 40,
//       brandY = 30;

//     // Header
//     doc.setFontSize(18).setFont("helvetica", "bold");
//     doc.text("Taha", brandX, brandY);
//     const tahaWidth = (doc as any).getTextWidth("Taha");
//     doc.text("Metals", brandX + tahaWidth + 6, brandY);

//     doc.setFontSize(11).setFont("helvetica", "normal");
//     doc.text("Return Invoice / Credit Note", brandX, brandY + 18);

//     const pageWidth = doc.internal.pageSize.getWidth();
//     const rightX = pageWidth - 50;
//     const today = new Date(rtn.createdAt).toLocaleDateString();

//     doc.setFontSize(8).text(`Date: ${today}`, rightX, brandY, {
//       align: "right",
//     });
//     doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(107, 114, 128);
//     doc.text(`Return ID: ${rtn.returnId}`, rightX, brandY + 12, {
//       align: "right",
//     });
//     doc.text(
//       `Reference Invoice: ${rtn.referenceInvoice}`,
//       rightX,
//       brandY + 24,
//       {
//         align: "right",
//       }
//     );
//     doc.setTextColor(0, 0, 0);

//     if (rtn.customerName) {
//       doc
//         .setFontSize(9)
//         .setFont("helvetica", "bold")
//         .text(`Customer: ${rtn.customerName}`, brandX, brandY + 40);
//     }

//     // Table
//     const head = [["Qty", "Item", "Weight", "Rate", "Refund"]];
//     const body = items.map((it) => [
//       String(it.qty),
//       getDisplayItem(it.itemName),
//       it.refundWeight
//         ? it.refundWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })
//         : "",
//       Number(it.rate).toLocaleString("en-US"),
//       `- ${Number(it.refundAmount).toLocaleString("en-US", {
//         maximumFractionDigits: 2,
//       })}`,
//     ]);

//     (autoTable as any)(doc, {
//       head,
//       body,
//       startY: 100,
//       theme: "striped",
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [45, 55, 72], textColor: 255 },
//       margin: { left: 40, right: 40 },
//     });

//     // --- Totals section with pagination handling ---
//     let finalY = (doc as any).lastAutoTable.finalY + 20;
//     const pageHeight = doc.internal.pageSize.height;

//     // If we’re near the bottom, start a new page
//     if (finalY + 80 > pageHeight) {
//       doc.addPage();
//       finalY = 40;
//     }

//     const rightMargin = 40;
//     const rightXTotal = pageWidth - rightMargin;
//     const labelX = rightXTotal - 100;

//     const totalRefund = items.reduce(
//       (sum, it) => sum + (it.refundAmount || 0),
//       0
//     );

//     doc.setFontSize(8);
//     doc.setFont("helvetica", "bold");
//     doc.text("REFUND TOTAL:", labelX, finalY, { align: "left" });
//     doc.text(`- ${totalRefund.toLocaleString()}`, rightXTotal, finalY, {
//       align: "right",
//     });

//     // --- Footer ---
//     const footerY = doc.internal.pageSize.height - 40;
//     doc
//       .setFontSize(10)
//       .setFont("helvetica", "normal")
//       .text("This is a system-generated Return Invoice", 40, footerY);

//     // --- Print directly ---
//     const pdfBlob = doc.output("blob");
//     const blobUrl = URL.createObjectURL(pdfBlob);

//     const printWindow = window.open(blobUrl);
//     if (printWindow) {
//       printWindow.addEventListener("load", () => {
//         printWindow.focus();
//         printWindow.print();
//       });
//     } else {
//       alert("Please allow pop-ups to enable printing.");
//     }
//   } catch (err) {
//     console.error("❌ Error printing Return PDF:", err);
//     alert("❌ Failed to print Return PDF");
//   }
// };

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReturnItem {
  itemName: string;
  qty: number;
  rate: number;
  refundAmount: number;
  refundProfit?: number;
  refundWeight?: number;
}

interface ReturnRecord {
  returnId: string;
  referenceInvoice: string;
  createdAt: string;
  itemReturned?: ReturnItem | ReturnItem[];
  itemsReturned?: ReturnItem[];
  customerName?: string;
}

export const printReturnPDF = async (returnId: string) => {
  try {
    // === Fetch return record ===
    const res = await fetch(`/api/returns/${returnId}`);
    if (!res.ok) {
      console.error("❌ API returned non-OK:", await res.text());
      alert("Failed to fetch return data for printing.");
      return;
    }

    const data = await res.json();
    if (!data.success || !data.returnRecord) {
      console.error("❌ Invalid JSON:", data);
      alert("No return record found.");
      return;
    }

    const rtn: ReturnRecord = data.returnRecord;

    // === Normalize item schema ===
    const items: ReturnItem[] = Array.isArray(rtn.itemsReturned)
      ? rtn.itemsReturned
      : rtn.itemReturned
      ? Array.isArray(rtn.itemReturned)
        ? rtn.itemReturned
        : [rtn.itemReturned]
      : [];

    if (items.length === 0) {
      alert("⚠️ No return items found to print.");
      return;
    }

    // === Fetch inventory (for descriptive item names) ===
    const inventoryRes = await fetch("/api/inventory");
    if (!inventoryRes.ok) {
      console.error("❌ Failed to fetch inventory:", await inventoryRes.text());
      alert("Failed to fetch inventory data for printing.");
      return;
    }

    const inventoryData = await inventoryRes.json();
    const inventoryItems = inventoryData.success
      ? inventoryData.items || []
      : [];

    const getDisplayItem = (itemName: string) => {
      const invItem = inventoryItems.find((inv: any) => inv.name === itemName);
      if (invItem) {
        if (invItem.type.toLowerCase().includes("pillar")) {
          return `${invItem.type} ${invItem.size || ""}${
            invItem.gote &&
            invItem.gote.trim() !== "" &&
            invItem.gote.toLowerCase() !== "without gote"
              ? invItem.gote
              : ""
          } - ${invItem.guage || ""}`.trim();
        } else if (invItem.type.toLowerCase() === "hardware") {
          return `${invItem.name} ${invItem.size || ""}${
            invItem.color && invItem.color.trim() !== "" ? invItem.color : ""
          }`.trim();
        } else {
          return `${invItem.type}${invItem.size || ""}${
            invItem.guage || ""
          }`.trim();
        }
      }
      return itemName;
    };

    // === PDF setup (80mm) ===
    const pageWidth = 226.77; // 80mm
    const pageHeight = 566.93; // ~200mm
    const printableWidth = 178.58; // 63mm safe zone
    const leftMargin = (pageWidth - printableWidth) / 2;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
    });

    const today = new Date(rtn.createdAt).toLocaleDateString();

    // === Header generator ===
    const addHeader = (pageNumber: number) => {
      const brandY = 30;
      const rightX = pageWidth - leftMargin;

      doc.setFont("helvetica", "bold").setFontSize(14);
      doc.text("Taha", leftMargin, brandY);
      const tahaWidth = (doc as any).getTextWidth("Taha");
      doc.text("Metals", leftMargin + tahaWidth + 6, brandY);

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text("Return Invoice", leftMargin, brandY + 14);

      doc
        .setFont("helvetica", "normal")
        .setFontSize(7)
        .text(`Date: ${today}`, rightX, brandY, { align: "right" });

      // Add (2), (3) etc. suffix if page > 1
      const returnIdText =
        pageNumber > 1 ? `${rtn.returnId} (${pageNumber})` : `${rtn.returnId}`;

      doc
        .setFont("helvetica", "bold")
        .setFontSize(7)
        .setTextColor(107, 114, 128)
        .text(`Return ID: ${returnIdText}`, rightX, brandY + 10, {
          align: "right",
        })
        .text(`Ref Invoice: ${rtn.referenceInvoice}`, rightX, brandY + 20, {
          align: "right",
        })
        .setTextColor(0, 0, 0);

      if (rtn.customerName) {
        doc
          .setFont("helvetica", "bold")
          .setFontSize(8)
          .text(`Customer: ${rtn.customerName}`, leftMargin, brandY + 30);
      }
    };

    // === Table head & body ===
    const head = [["Qty", "Item", "Wt", "Rate", "Refund"]];
    const body = items.map((it) => [
      String(it.qty),
      getDisplayItem(it.itemName),
      it.refundWeight
        ? it.refundWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })
        : "",
      Number(it.rate).toLocaleString("en-US"),
      `- ${Number(it.refundAmount).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
    ]);

    // === Draw first header ===
    addHeader(1);

    // === AutoTable with pagination handling ===
    (autoTable as any)(doc, {
      head,
      body,
      startY: 80,
      theme: "striped",
      styles: { fontSize: 7 },
      headStyles: { fillColor: [45, 55, 72], textColor: 255, fontSize: 7 },
      margin: { left: leftMargin, right: leftMargin },
      tableWidth: printableWidth,
      didDrawPage: (data: any) => {
        const pageNumber = doc.getNumberOfPages();
        if (pageNumber > 1) addHeader(pageNumber);
      },
    });

    // === Totals ===
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const rightXTotal = pageWidth - leftMargin;
    const labelX = rightXTotal - 80;

    const totalRefund = items.reduce(
      (sum, it) => sum + (it.refundAmount || 0),
      0
    );

    doc.setFont("helvetica", "bold").setFontSize(8);
    doc.text("REFUND TOTAL:", labelX, finalY, { align: "left" });
    doc.text(`- ${totalRefund.toLocaleString()}`, rightXTotal, finalY, {
      align: "right",
    });

    // === Footer ===
    const footerY = pageHeight - 40;
    doc
      .setFont("helvetica", "normal")
      .setFontSize(7)
      .text(
        "System-generated Return Invoice — No signature required",
        leftMargin,
        footerY
      );

    // === Print ===
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl);
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.focus();
        printWindow.print();
      });
    } else {
      alert("Please allow pop-ups to enable printing.");
    }
  } catch (err) {
    console.error("❌ Error printing Return PDF:", err);
    alert("❌ Failed to print Return PDF");
  }
};
