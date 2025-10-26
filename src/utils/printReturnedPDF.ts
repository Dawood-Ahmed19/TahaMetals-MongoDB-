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

    // === PDF setup (A4-Half / A5) ===
    const pageWidth = 419.53; // 148 mm (A5 width)
    const pageHeight = 595.28; // 210 mm (A5 height)
    const printableWidth = 368.5; // ~130 mm content zone
    const marginX = (pageWidth - printableWidth) / 2; // balanced margins ~25pt
    const rightX = marginX + printableWidth;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
    });

    const today = new Date(rtn.createdAt).toLocaleDateString();

    // === Header generator ===
    const addHeader = (pageNumber: number) => {
      const topY = 50;

      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text("Taha Metals", marginX, topY);

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text("Return Invoice", marginX, topY + 14);

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text(`Date: ${today}`, rightX, topY, { align: "right" });

      const returnIdText =
        pageNumber > 1 ? `${rtn.returnId} (${pageNumber})` : `${rtn.returnId}`;

      doc
        .setFont("helvetica", "bold")
        .setFontSize(8)
        .setTextColor(107, 114, 128)
        .text(`Return ID: ${returnIdText}`, rightX, topY + 12, {
          align: "right",
        })
        .text(`Ref Invoice: ${rtn.referenceInvoice}`, rightX, topY + 24, {
          align: "right",
        })
        .setTextColor(0, 0, 0);

      if (rtn.customerName)
        doc
          .setFont("helvetica", "bold")
          .setFontSize(9)
          .text(`Customer: ${rtn.customerName}`, marginX, topY + 28);

      return topY + 42;
    };

    // === Table ===
    const head = [["Qty", "Item", "Weight", "Rate", "Refund"]];
    const body = items.map((it) => [
      String(it.qty),
      getDisplayItem(it.itemName),
      it.refundWeight
        ? it.refundWeight.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })
        : "",
      Number(it.rate).toLocaleString("en-US"),
      `- ${Number(it.refundAmount).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
    ]);

    // === Draw initial header ===
    addHeader(1);

    // === Data table ===
    (autoTable as any)(doc, {
      head,
      body,
      startY: 80,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [45, 55, 72],
        textColor: 255,
        fontSize: 7.5,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 25, halign: "center" },
        1: { cellWidth: 120 },
        2: { cellWidth: 45, halign: "right" },
        3: { cellWidth: 45, halign: "right" },
        4: { cellWidth: 45, halign: "right" },
      },
      margin: { left: marginX, right: marginX },
      tableWidth: printableWidth,
      didDrawPage: () => {
        const pageNumber = (doc as any).getNumberOfPages();
        if (pageNumber > 1) addHeader(pageNumber);
      },
    });

    // === Totals ===
    let finalY = (doc as any).lastAutoTable.finalY + 25;
    if (finalY + 100 > pageHeight) {
      doc.addPage();
      addHeader((doc as any).internal.getNumberOfPages());
      finalY = 80;
    }

    const totalRefund = items.reduce(
      (sum, it) => sum + (it.refundAmount || 0),
      0
    );

    doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .text("REFUND TOTAL:", rightX - 120, finalY, { align: "left" })
      .text(`- ${totalRefund.toLocaleString()}`, rightX, finalY, {
        align: "right",
      });

    // === Footer ===
    const footerY = pageHeight - 30;
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8)
      .text(
        "System-generated Return Invoice — No signature required",
        marginX + printableWidth / 2,
        footerY,
        { align: "center" }
      );

    // === Output ===
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
