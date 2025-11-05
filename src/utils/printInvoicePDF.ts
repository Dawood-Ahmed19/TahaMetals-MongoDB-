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

    doc.setFont("helvetica");

    // === Header Function ===
    const drawHeader = (leftSide: boolean, topY: number = 40) => {
      const offsetX = leftSide ? 0 : halfWidth;

      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text("Taha Metals", marginX + offsetX, topY);

      doc.setFont("helvetica", "normal").setFontSize(9);
      doc.text("Chow Road, Shahrah Kashmir", marginX + offsetX, topY + 14);
      doc.text("Mureed Chowk, Kallar Syedan", marginX + offsetX, topY + 28);
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

      return topY + 68;
    };

    // === Draw Invoice Function ===
    const drawInvoice = (leftSide: boolean) => {
      const offsetX = leftSide ? 0 : halfWidth;

      const estimatedInvoiceHeight = 400; // adjust if needed
      const verticalPadding = (pageHeight - estimatedInvoiceHeight) / 2;
      let startY = verticalPadding + 10;
      startY = drawHeader(leftSide, startY);

      const head = [["Qty", "Item", "Guage", "Weight", "Rate", "Amount"]];
      const body = items.map((r: any) => [
        String(r.qty),
        r.item,
        r.guage || "",
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
          lineColor: [100, 100, 100],
          lineWidth: 0.3,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [100, 100, 100],
          lineWidth: 0.4,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: printableWidth * 0.08 },
          1: { halign: "left", cellWidth: printableWidth * 0.38 },
          2: { halign: "center", cellWidth: printableWidth * 0.15 },
          3: { halign: "right", cellWidth: printableWidth * 0.14 },
          4: { halign: "right", cellWidth: printableWidth * 0.14 },
          5: { halign: "right", cellWidth: printableWidth * 0.16 },
        },
        margin: { left: marginX + offsetX, right: marginX },
        tableWidth: printableWidth,
      });

      let finalY = (doc as any).lastAutoTable.finalY + 15;
      const paid = quotation.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
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

      // === Footer ===
      const footerText =
        "After 30 days, products will not be returned or exchanged. Thank you. Apologies for any commission or billing errors. Please check your items and gauges before leaving the counter, as we will not be responsible for any issues after that. No warranty for rust.";

      const footerMarginBottom = 40;
      const footerMaxWidth = printableWidth - 20;
      const footerX = offsetX + marginX + footerMaxWidth / 2;
      const footerY = pageHeight - footerMarginBottom;

      doc
        .setFont("helvetica", "normal")
        .setFontSize(8)
        .text(footerText, footerX, footerY, {
          align: "center",
          maxWidth: footerMaxWidth,
        });
    };

    // === Draw Both Invoices ===
    drawInvoice(true);
    drawInvoice(false);

    // === Tear/Cut Line ===
    doc.setDrawColor(150);
    doc.setLineWidth(0.5);

    // small marks at top & bottom center
    const markLength = 15;
    const centerX = halfWidth;
    // top mark
    doc.line(centerX, 10, centerX, 10 + markLength);
    // bottom mark
    doc.line(centerX, pageHeight - 10 - markLength, centerX, pageHeight - 10);

    // optional hint text (tiny dashed line)
    doc.setLineDashPattern([2, 2], 0);
    doc.setDrawColor(180);
    doc.line(centerX, 25, centerX, pageHeight - 25);
    doc.setLineDashPattern([], 0);

    // === Open for Printing ===
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