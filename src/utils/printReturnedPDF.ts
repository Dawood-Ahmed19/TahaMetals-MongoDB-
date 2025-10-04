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
  itemReturned?: ReturnItem | ReturnItem[]; // old schema
  itemsReturned?: ReturnItem[]; // new schema
}

export const printReturnPDF = async (returnId: string) => {
  try {
    const res = await fetch(`/api/returns/${returnId}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ API returned non-OK:", text);
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

    // Handle both old and new schema versions
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

    const doc = new jsPDF({ unit: "pt", format: "a5" });
    const brandX = 40,
      brandY = 30;

    // Logo / company name
    doc.setFontSize(18).setFont("helvetica", "bold").setTextColor(0, 0, 0);
    doc.text("Taha", brandX, brandY);
    const tahaWidth = (doc as any).getTextWidth("Taha");
    doc.text("Metals", brandX + tahaWidth + 6, brandY);

    // Title
    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text("Return Invoice / Credit Note", brandX, brandY + 18);

    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - 50;
    const today = new Date(rtn.createdAt).toLocaleDateString();

    doc
      .setFontSize(10)
      .text(`Date: ${today}`, rightX, brandY, { align: "right" });
    doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(107, 114, 128);
    doc.text(`Return ID: ${rtn.returnId}`, rightX, brandY + 12, {
      align: "right",
    });
    doc.text(
      `Reference Invoice: ${rtn.referenceInvoice}`,
      rightX,
      brandY + 24,
      { align: "right" }
    );
    doc.setTextColor(0, 0, 0);

    const head = [["Qty", "Item", "Weight", "Rate", "Refund"]];
    const body = items.map((it) => [
      String(it.qty),
      it.itemName,
      it.refundWeight
        ? it.refundWeight.toLocaleString("en-US", { maximumFractionDigits: 2 })
        : "",
      Number(it.rate).toLocaleString("en-US"),
      `- ${Number(it.refundAmount).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
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

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const rightXTotal = pageWidth - 160;

    const totalRefund = items.reduce(
      (sum, it) => sum + (it.refundAmount || 0),
      0
    );

    doc.setFontSize(11);
    doc.text(
      `REFUND TOTAL: - ${totalRefund.toLocaleString()}`,
      rightXTotal,
      finalY
    );

    // Footer
    doc
      .setFontSize(10)
      .text(
        "This is a system-generated Return Invoice",
        40,
        doc.internal.pageSize.height - 40
      );

    // 💡 Print (not save)
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
