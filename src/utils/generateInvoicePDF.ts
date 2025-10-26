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

export const generateInvoicePDF = async (quotationId: string) => {
  try {
    // === Fetch quotation data ===
    const res = await fetch(`/api/quotations/${quotationId}`);
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    if (!data.success || !data.quotation?.items)
      throw new Error("No items found for this quotation.");

    const quotation: Quotation = data.quotation;
    const items = quotation.items || [];

    // === Fetch inventory for descriptive names ===
    const inventoryRes = await fetch("/api/inventory");
    if (!inventoryRes.ok) throw new Error(await inventoryRes.text());

    const inventoryData = await inventoryRes.json();
    const inventoryItems = inventoryData.success
      ? inventoryData.items || []
      : [];

    const getDisplayItem = (itemName: string) => {
      const invItem = inventoryItems.find((inv: any) => inv.name === itemName);
      if (!invItem) return itemName;
      if (invItem.type.toLowerCase().includes("pillar"))
        return `${invItem.type} ${invItem.size || ""}${
          invItem.gote &&
          invItem.gote.trim() !== "" &&
          invItem.gote.toLowerCase() !== "without gote"
            ? invItem.gote
            : ""
        } - ${invItem.guage || ""}`.trim();
      if (invItem.type.toLowerCase() === "hardware")
        return `${invItem.name} ${invItem.size || ""}${
          invItem.color && invItem.color.trim() !== "" ? invItem.color : ""
        }`.trim();
      return `${invItem.type}${invItem.size || ""}${
        invItem.guage || ""
      }`.trim();
    };

    // === Page setup (A4-half/A5) ===
    const pageWidth = 419.53; // 148 mm
    const pageHeight = 595.28; // 210 mm
    const printableWidth = 368.5; // ~130 mm content width
    const marginX = (pageWidth - printableWidth) / 2; // ≈25 pt (~9 mm) margins
    const rightX = marginX + printableWidth;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
    });

    // === Header generator ===
    const addHeader = (pageNum: number) => {
      const y = 50;

      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text("Taha Metals", marginX, y);

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text("Invoice / Quotation", marginX, y + 14);

      const dateStr = new Date(quotation.date).toLocaleDateString();
      doc.text(`Date: ${dateStr}`, rightX, y, { align: "right" });

      const idSuffix = pageNum > 1 ? ` (${pageNum})` : "";
      if (quotation.quotationId)
        doc
          .setFont("helvetica", "bold")
          .setFontSize(8)
          .setTextColor(107, 114, 128)
          .text(
            `Quotation ID: ${quotation.quotationId}${idSuffix}`,
            rightX,
            y + 12,
            { align: "right" }
          )
          .setTextColor(0, 0, 0);
    };

    // === Footer generator ===
    const addFooter = () => {
      doc
        .setFont("helvetica", "normal")
        .setFontSize(8)
        .text(
          "Thank you for purchasing!",
          marginX + printableWidth / 2,
          pageHeight - 25,
          { align: "center" }
        );
    };

    // === Table data ===
    const head = [["Qty", "Item", "Guage", "Weight", "Rate", "Amount"]];
    const body = items.map((r: any) => [
      String(r.qty),
      getDisplayItem(r.item),
      r.guage || "",
      Number(r.weight).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      Number(r.rate).toLocaleString("en-US"),
      Number(r.amount).toLocaleString("en-US", { maximumFractionDigits: 2 }),
    ]);

    // === Render header for page 1 ===
    let pageNum = 1;
    addHeader(pageNum);

    // === Create AutoTable ===
    (autoTable as any)(doc, {
      head,
      body,
      startY: 80,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, lineColor: [220, 220, 220] },
      headStyles: {
        fillColor: [45, 55, 72],
        textColor: 255,
        fontSize: 7.5,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 25, halign: "center" },
        1: { cellWidth: 120 },
        2: { cellWidth: 35, halign: "center" },
        3: { cellWidth: 45, halign: "right" },
        4: { cellWidth: 45, halign: "right" },
        5: { cellWidth: 45, halign: "right" },
      },
      margin: { left: marginX, right: marginX },
      tableWidth: printableWidth,
      didDrawPage: () => {
        addFooter();
        const totalPages = (doc as any).getNumberOfPages();
        if (totalPages > pageNum) {
          pageNum = totalPages;
          addHeader(pageNum);
        }
      },
    });

    // === Totals section ===
    doc.setPage((doc as any).getNumberOfPages());
    let finalY = (doc as any).lastAutoTable.finalY + 25;
    if (finalY + 120 > pageHeight) {
      doc.addPage();
      addHeader((doc as any).getNumberOfPages());
      finalY = 80;
    }

    const paid = quotation.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const balance = quotation.grandTotal - paid;
    const labelX = rightX - 120;
    const gap = 14;

    const drawRow = (label: string, value: number | string, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(9);
      doc.text(`${label}:`, labelX, finalY, { align: "left" });
      doc.text(String(value), rightX, finalY, { align: "right" });
      finalY += gap;
    };

    drawRow("TOTAL", quotation.total.toLocaleString());
    drawRow("DISCOUNT", quotation.discount.toLocaleString());
    if (
      quotation.hasOwnProperty("loading") &&
      quotation.loading !== undefined &&
      quotation.loading !== null
    )
      drawRow("LOADING", quotation.loading.toLocaleString());
    drawRow("PAID", paid.toLocaleString());
    drawRow("BALANCE", balance.toLocaleString(), true);
    drawRow("GRAND TOTAL", quotation.grandTotal.toLocaleString(), true);

    // === Output ===
    const filename = `invoice_${quotation.quotationId || quotation._id}.pdf`;
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
    console.error("❌ Error generating PDF:", err);
    alert("❌ Failed to generate PDF.");
  }
};
