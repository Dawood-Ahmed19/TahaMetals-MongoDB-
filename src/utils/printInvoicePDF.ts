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
//   customerName?: string;
// }

// export const printInvoicePDF = async (quotationId: string) => {
//   try {
//     // === Fetch quotation ===
//     const res = await fetch(`/api/quotations/${quotationId}`);
//     if (!res.ok) throw new Error(await res.text());
//     const data = await res.json();
//     if (!data.success || !data.quotation?.items)
//       throw new Error("No quotation items found.");

//     const quotation: Quotation = data.quotation;
//     const items = quotation.items || [];

//     // === Fetch inventory ===
//     const invRes = await fetch("/api/inventory");
//     if (!invRes.ok) throw new Error(await invRes.text());
//     const invData = await invRes.json();
//     const invItems = invData.success ? invData.items || [] : [];

//     const getDisplayItem = (itemName: string) => {
//       const invItem = invItems.find((i: any) => i.name === itemName);
//       if (!invItem) return itemName;
//       if (invItem.type.toLowerCase().includes("pillar"))
//         return `${invItem.type} ${invItem.size || ""}${
//           invItem.gote &&
//           invItem.gote.trim() !== "" &&
//           invItem.gote.toLowerCase() !== "without gote"
//             ? invItem.gote
//             : ""
//         } - ${invItem.guage || ""}`.trim();
//       if (invItem.type.toLowerCase() === "hardware")
//         return `${invItem.name} ${invItem.size || ""}${
//           invItem.color && invItem.color.trim() !== "" ? invItem.color : ""
//         }`.trim();
//       return `${invItem.type}${invItem.size || ""}${
//         invItem.guage || ""
//       }`.trim();
//     };

//     // === Page setup: A4-half / A5 ===
//     const pageWidth = 419.53; // 148 mm (A5 width)
//     const pageHeight = 595.28; // 210 mm (A5 height)
//     const marginX = 28; // ≈10 mm each side
//     const printableWidth = pageWidth - marginX * 2;
//     const rightX = marginX + printableWidth;

//     const doc = new jsPDF({
//       unit: "pt",
//       format: [pageWidth, pageHeight],
//     });

//     // === Header (company left-aligned in printable area) ===
//     const drawHeader = (pageNum?: number) => {
//       // Increased top margin from 30 → 50 pt (~7 mm extra space)
//       const topMargin = 50;

//       const qid =
//         quotation.quotationId + (pageNum && pageNum > 1 ? ` (${pageNum})` : "");

//       doc.setFont("helvetica", "bold").setFontSize(13);
//       doc.text("Taha Metals", marginX, topMargin);

//       doc.setFont("helvetica", "normal").setFontSize(8);
//       doc.text("Invoice / Quotation", marginX, topMargin + 14);

//       const dateStr = new Date(quotation.date).toLocaleDateString();
//       doc.text(`Date: ${dateStr}`, rightX, topMargin, { align: "right" });

//       doc
//         .setFont("helvetica", "bold")
//         .setFontSize(8)
//         .setTextColor(107, 114, 128)
//         .text(`Quotation ID: ${qid}`, rightX, topMargin + 12, {
//           align: "right",
//         })
//         .setTextColor(0, 0, 0);

//       if (quotation.customerName)
//         doc
//           .setFont("helvetica", "bold")
//           .setFontSize(9)
//           .text(`Customer: ${quotation.customerName}`, marginX, topMargin + 28);

//       // push table start slightly farther down relative to header height
//       return topMargin + 42;
//     };

//     let startY = drawHeader();

//     // === Table ===
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
//       startY,
//       theme: "grid",
//       styles: {
//         fontSize: 8,
//         cellPadding: 3,
//         lineColor: [220, 220, 220],
//         overflow: "linebreak",
//       },
//       headStyles: {
//         fillColor: [45, 55, 72],
//         textColor: 255,
//         fontSize: 8,
//         halign: "center",
//         valign: "middle",
//       },
//       columnStyles: {
//         0: { halign: "center", cellWidth: printableWidth * 0.08 },
//         1: { halign: "left", cellWidth: printableWidth * 0.38 },
//         2: { halign: "center", cellWidth: printableWidth * 0.1 },
//         3: { halign: "right", cellWidth: printableWidth * 0.14 },
//         4: { halign: "right", cellWidth: printableWidth * 0.14 },
//         5: { halign: "right", cellWidth: printableWidth * 0.16 },
//       },
//       margin: { left: marginX, right: marginX },
//       tableWidth: printableWidth,
//       didDrawPage: (data: any) => {
//         if (data.pageNumber > 1) drawHeader(data.pageNumber);
//       },
//     });

//     // === Totals ===
//     let finalY = (doc as any).lastAutoTable.finalY + 20;
//     if (finalY + 120 > pageHeight) {
//       doc.addPage();
//       finalY = drawHeader((doc as any).internal.getNumberOfPages()) + 10;
//     }

//     const paid =
//       quotation.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) ||
//       0;
//     const loading = quotation.loading || 0;
//     const balance = quotation.grandTotal - paid;

//     const labelX = rightX - 130;
//     const drawRow = (label: string, value: number | string, bold = false) => {
//       doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(9);
//       doc.text(`${label}:`, labelX, finalY, { align: "left" });
//       doc.text(String(value), rightX, finalY, { align: "right" });
//       finalY += 14;
//     };

//     drawRow("TOTAL", quotation.total.toLocaleString());
//     drawRow("DISCOUNT", quotation.discount.toLocaleString());
//     drawRow("LOADING", loading.toLocaleString());
//     drawRow("BALANCE", balance.toLocaleString());
//     if (quotation.loading)
//       drawRow("LOADING", quotation.loading.toLocaleString());
//     drawRow("GRAND TOTAL", quotation.grandTotal.toLocaleString(), true);

//     // === Footer ===
//     doc
//       .setFont("helvetica", "normal")
//       .setFontSize(8)
//       .text(
//         "Thank you for purchasing!",
//         marginX + printableWidth / 2,
//         pageHeight - 30,
//         { align: "center" }
//       );

//     // === Print / view ===
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
//     alert("❌ Failed to print invoice.");
//   }
// };

import { jsPDF } from "jspdf";
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
  customerName?: string;
}

export const printInvoicePDF = async (quotationId: string) => {
  try {
    // === Fetch quotation ===
    const res = await fetch(`/api/quotations/${quotationId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data.success || !data.quotation?.items)
      throw new Error("No quotation items found.");

    const quotation: Quotation = data.quotation;
    const items = quotation.items || [];

    // === A5 Landscape Setup ===
    const pageWidth = 595.28; // 210 mm
    const pageHeight = 419.53; // 148 mm
    const marginX = 28;
    const halfWidth = pageWidth / 2;
    const printableWidth = halfWidth - marginX * 2;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
      orientation: "landscape",
    });

    // Load the Urdu font (ensure the path is correct)
    doc.addFileToVFS("NotoNastaliqUrdu-Regular.ttf", "/NotoNastaliqUrdu-Regular.ttf"); // Path to the font file in the public folder
    doc.setFont("NotoNastaliqUrdu-Regular"); // Set to the correct Urdu font name

    // === Header ===
    const drawHeader = (leftSide: boolean) => {
      const offsetX = leftSide ? 0 : halfWidth;
      const topY = 40;

      // Company Name
      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text("Taha Metals", marginX + offsetX, topY);

      // Address (split into two lines for better alignment)
      doc.setFont("NotoNastaliqUrdu-Regular", "normal").setFontSize(9);
      doc.text("Chow Road, Shahrah Kashmir", marginX + offsetX, topY + 14);
      doc.text("Mureed Chowk, Kallar Syedan", marginX + offsetX, topY + 28);

      // Phone Number
      doc.setFont("helvetica", "normal").setFontSize(9);
      doc.text("03488416096", marginX + offsetX, topY + 42);

      const dateStr = new Date(quotation.date).toLocaleDateString();
      doc.text(`Date: ${dateStr}`, offsetX + halfWidth - marginX, topY, { align: "right" });

      doc
        .setFont("helvetica", "bold")
        .setFontSize(8)
        .setTextColor(107, 114, 128)
        .text(`Quotation ID: ${quotation.quotationId}`, offsetX + halfWidth - marginX, topY + 12, {
          align: "right",
        })
        .setTextColor(0, 0, 0);

      if (quotation.customerName)
        doc
          .setFont("helvetica", "bold")
          .setFontSize(9)
          .text(`Customer: ${quotation.customerName}`, marginX + offsetX, topY + 56);

      return topY + 68; // Adjusting for the address text length
    };

    // === Draw Invoice (Left or Right Side) ===
    const drawInvoice = (leftSide: boolean) => {
      const offsetX = leftSide ? 0 : halfWidth;
      let startY = drawHeader(leftSide);

      const head = [["Qty", "Item", "Guage", "Weight", "Rate", "Amount"]];
      const body = items.map((r: any) => [
        String(r.qty),
        r.item,
        r.guage || "", // Ensure gauge data is added here
        Number(r.weight).toLocaleString("en-US", { maximumFractionDigits: 2 }),
        Number(r.rate).toLocaleString("en-US"),
        Number(r.amount).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      ]);

      (autoTable as any)(doc, {
        head,
        body,
        startY,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [100, 100, 100], // darker border lines
          lineWidth: 0.3,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255], // white background
          textColor: [0, 0, 0], // normal black text
          fontStyle: "bold",
          lineColor: [100, 100, 100],
          lineWidth: 0.4,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: printableWidth * 0.08 }, // Qty
          1: { halign: "left", cellWidth: printableWidth * 0.38 }, // Item
          2: { halign: "center", cellWidth: printableWidth * 0.15 }, // Increased Guage width
          3: { halign: "right", cellWidth: printableWidth * 0.14 }, // Weight
          4: { halign: "right", cellWidth: printableWidth * 0.14 }, // Rate
          5: { halign: "right", cellWidth: printableWidth * 0.16 }, // Amount
        },
        margin: { left: marginX + offsetX, right: marginX },
        tableWidth: printableWidth,
      });

      let finalY = (doc as any).lastAutoTable.finalY + 15;
      const paid =
        quotation.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
      const balance = quotation.grandTotal - paid;

      const labelX = offsetX + halfWidth - marginX - 130;
      const valueX = offsetX + halfWidth - marginX;

      const drawRow = (label: string, value: number | string, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(8);
        doc.text(`${label}:`, labelX, finalY, { align: "left" });
        doc.text(String(value), valueX, finalY, { align: "right" });
        finalY += 12;
      };

      drawRow("TOTAL", quotation.total.toLocaleString());
      drawRow("DISCOUNT", quotation.discount.toLocaleString());
      drawRow("LOADING", (quotation.loading || 0).toLocaleString());
      drawRow("BALANCE", balance.toLocaleString());
      drawRow("GRAND TOTAL", quotation.grandTotal.toLocaleString(), true);

      // === Footer (English text) ===
      const footerText = `After 30 days, products will not be returned or exchanged. Thank you. Apologies for any commission or billing errors. Please check your items and gauges before leaving the counter, as we will not be responsible for any issues after that. No warranty for rust.`;
      const footerMargin = 20; // Margin from bottom
      doc.setFont("helvetica", "normal")
        .setFontSize(9)
        .text(footerText, marginX, pageHeight - footerMargin, { align: "left", maxWidth: printableWidth });

    };

    // === Draw Separator Lines for Cutting ===
    doc.setDrawColor(120);
    doc.setLineWidth(0.7);
    doc.line(halfWidth, 20, halfWidth, pageHeight - 20); // middle vertical
    doc.line(20, 20, pageWidth - 20, 20); // top
    doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20); // bottom

    // === Draw Both Invoices ===
    drawInvoice(true);
    drawInvoice(false);

    // === Print/View ===
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


