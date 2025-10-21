// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// interface Payment {
//   amount: number;
//   date: string;
// }

// interface Quotation {
//   _id: string;
//   quotationId: string;
//   date: string;
//   total: number;
//   discount: number;
//   loading?: number;
//   grandTotal: number;
//   payments?: Payment[];
//   items?: any[];
// }

// export const printInvoicePDF = async (quotationId: string) => {
//   try {
//     // Fetch quotation data
//     const res = await fetch(`/api/quotations/${quotationId}`);
//     if (!res.ok) {
//       const text = await res.text();
//       console.error("❌ API returned non-OK:", text);
//       alert("Failed to fetch quotation data for printing.");
//       return;
//     }

//     const data = await res.json();
//     if (!data.success || !data.quotation?.items) {
//       console.error("❌ Invalid quotation data:", data);
//       alert("No items found for this quotation.");
//       return;
//     }

//     const quotation: Quotation = data.quotation;
//     const items = quotation.items || [];

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

//     // Create a new PDF document
//     const doc = new jsPDF({
//       unit: "pt",
//       format: "a5",
//     });

//     const brandX = 40,
//       brandY = 30;

//     // Header and branding
//     doc.setFontSize(18).setFont("helvetica", "bold").setTextColor(0, 0, 0);
//     doc.text("Taha", brandX, brandY);
//     const tahaWidth = (doc as any).getTextWidth("Taha");
//     doc.text("Metals", brandX + tahaWidth + 6, brandY);

//     doc.setFontSize(9).setFont("helvetica", "normal");
//     doc.text("Invoice / Quotation", brandX, brandY + 18);

//     const pageWidth = doc.internal.pageSize.getWidth();
//     const rightX = pageWidth - 50;
//     const today = new Date(quotation.date).toLocaleDateString();

//     doc.setFontSize(8).text(`Date: ${today}`, rightX, brandY, {
//       align: "right",
//     });

//     if (quotation.quotationId) {
//       doc
//         .setFontSize(8)
//         .setFont("helvetica", "bold")
//         .setTextColor(107, 114, 128);
//       doc.text(`Quotation ID: ${quotation.quotationId}`, rightX, brandY + 15, {
//         align: "right",
//       });
//       doc.setTextColor(0, 0, 0);
//     }

//     if ((quotation as any).customerName) {
//       doc
//         .setFontSize(9)
//         .setFont("helvetica", "bold")
//         .text(
//           `Customer: ${(quotation as any).customerName}`,
//           brandX,
//           brandY + 35
//         );
//     }

//     // Table structure
//     const head = [["Qty", "Item", "Guage", "Weight", "Rate", "Amount"]];
//     const body = items.map((r: any) => [
//       String(r.qty),
//       getDisplayItem(r.item),
//       r.guage || "",
//       Number(r.weight).toLocaleString("en-US", { maximumFractionDigits: 2 }),
//       Number(r.rate).toLocaleString("en-US"),
//       Number(r.amount).toLocaleString("en-US", { maximumFractionDigits: 2 }),
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

//     // --- Totals section ---
//     let finalY = (doc as any).lastAutoTable.finalY + 20;
//     const pageHeight = doc.internal.pageSize.height;

//     if (finalY + 100 > pageHeight) {
//       doc.addPage();
//       finalY = 40;
//     }

//     const rightMargin = 40;
//     const rightXTotal = pageWidth - rightMargin;
//     const labelX = rightXTotal - 100;

//     doc.setFontSize(8);
//     let yPos = finalY;

//     const drawRightText = (
//       label: string,
//       value: number | string,
//       bold = false
//     ) => {
//       if (bold) doc.setFont("helvetica", "bold");
//       else doc.setFont("helvetica", "normal");

//       doc.text(label + ":", labelX, yPos, { align: "left" });
//       doc.text(String(value), rightXTotal, yPos, { align: "right" });

//       yPos += 16;
//     };

//     drawRightText("TOTAL", quotation.total.toLocaleString());
//     drawRightText("DISCOUNT", quotation.discount.toLocaleString());

//     const paid =
//       quotation.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) ||
//       0;
//     const balance = quotation.grandTotal - paid;

//     drawRightText("BALANCE", balance.toLocaleString());

//     if (
//       quotation.hasOwnProperty("loading") &&
//       quotation.loading !== undefined &&
//       quotation.loading !== null
//     ) {
//       drawRightText("LOADING", quotation.loading.toLocaleString());
//     }

//     drawRightText("GRAND TOTAL", quotation.grandTotal.toLocaleString(), true);

//     // Footer
//     const footerY = doc.internal.pageSize.height - 40;
//     doc
//       .setFontSize(10)
//       .setFont("helvetica", "normal")
//       .text("Thank you for Purchasing!", 40, footerY);

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
//     console.error("❌ Error printing invoice:", err);
//     alert("Failed to print invoice.");
//   }
// };

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Payment {
  amount: number;
  date: string;
}

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  total: number;
  discount: number;
  loading?: number;
  grandTotal: number;
  payments?: Payment[];
  items?: any[];
}

export const printInvoicePDF = async (quotationId: string) => {
  try {
    // Fetch quotation data
    const res = await fetch(`/api/quotations/${quotationId}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ API returned non-OK:", text);
      alert("Failed to fetch quotation data for printing.");
      return;
    }

    const data = await res.json();
    if (!data.success || !data.quotation?.items) {
      console.error("❌ Invalid quotation data:", data);
      alert("No items found for this quotation.");
      return;
    }

    const quotation: Quotation = data.quotation;
    const items = quotation.items || [];

    // Fetch inventory data
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

    // Create PDF for 80mm thermal roll
    const pageWidth = 226.77; // 80mm
    const pageHeight = 566.93; // 200mm
    const printableWidth = 178.58; // 63mm
    const leftMargin = (pageWidth - printableWidth) / 2; // ~24pt
    const rightMargin = leftMargin;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
      orientation: "portrait",
    });

    const rightX = pageWidth - rightMargin;
    const brandX = leftMargin;
    const brandY = 25;

    // === Header ===
    doc.setFont("helvetica", "bold").setFontSize(13);
    doc.text("Taha", brandX, brandY);
    const tahaWidth = (doc as any).getTextWidth("Taha");
    doc.text("Metals", brandX + tahaWidth + 5, brandY);

    doc.setFont("helvetica", "normal").setFontSize(8);
    doc.text("Invoice / Quotation", brandX, brandY + 14);

    const today = new Date(quotation.date).toLocaleDateString();
    doc.setFont("helvetica", "normal").setFontSize(7);
    doc.text(`Date: ${today}`, rightX, brandY, { align: "right" });

    if (quotation.quotationId) {
      doc
        .setFont("helvetica", "bold")
        .setFontSize(7)
        .setTextColor(107, 114, 128)
        .text(`Quotation ID: ${quotation.quotationId}`, rightX, brandY + 12, {
          align: "right",
        })
        .setTextColor(0, 0, 0);
    }

    if ((quotation as any).customerName) {
      doc
        .setFont("helvetica", "bold")
        .setFontSize(8)
        .text(
          `Customer: ${(quotation as any).customerName}`,
          brandX,
          brandY + 28
        );
    }

    // === Table ===
    const head = [["Qty", "Item", "Guage", "Weight", "Rate", "Amount"]];
    const body = items.map((r: any) => [
      String(r.qty),
      getDisplayItem(r.item),
      r.guage || "",
      Number(r.weight).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      Number(r.rate).toLocaleString("en-US"),
      Number(r.amount).toLocaleString("en-US", { maximumFractionDigits: 2 }),
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY: 60,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2, lineColor: [220, 220, 220] },
      headStyles: { fillColor: [45, 55, 72], textColor: 255, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30 },
        5: { cellWidth: 40 },
      },
      margin: { left: leftMargin, right: rightMargin },
      tableWidth: printableWidth,
    });

    // === Totals ===
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    const labelX = rightX - 100;

    const paid =
      quotation.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) ||
      0;
    const balance = quotation.grandTotal - paid;

    const drawRow = (label: string, value: number | string, bold = false) => {
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(`${label}:`, labelX, finalY, { align: "left" });
      doc.text(String(value), rightX, finalY, { align: "right" });
      finalY += 12;
    };

    doc.setFontSize(8);
    drawRow("TOTAL", quotation.total.toLocaleString());
    drawRow("DISCOUNT", quotation.discount.toLocaleString());
    drawRow("BALANCE", balance.toLocaleString());
    if (quotation.loading)
      drawRow("LOADING", quotation.loading.toLocaleString());
    drawRow("GRAND TOTAL", quotation.grandTotal.toLocaleString(), true);

    // === Footer ===
    doc
      .setFont("helvetica", "normal")
      .setFontSize(7)
      .text("Thank you for purchasing!", brandX, pageHeight - 25);

    // === Print directly ===
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
    console.error("❌ Error printing invoice:", err);
    alert("❌ Failed to print invoice.");
  }
};
