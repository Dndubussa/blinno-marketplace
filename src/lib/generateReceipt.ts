import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface PaymentTransaction {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  network: string;
  phone_number: string;
  reference: string;
  status: string;
  description: string | null;
  created_at: string;
  clickpesa_reference?: string | null;
}

const networkNames: Record<string, string> = {
  MPESA: "M-Pesa (Vodacom)",
  TIGOPESA: "Tigo Pesa",
  AIRTELMONEY: "Airtel Money",
  HALOPESA: "Halopesa",
};

export function generatePaymentReceipt(transaction: PaymentTransaction): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(27, 169, 76); // Blinno green
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("BLINNO", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Payment Receipt", pageWidth / 2, 28, { align: "center" });

  // Receipt Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const receiptDate = format(new Date(transaction.created_at), "MMMM d, yyyy 'at' HH:mm");
  doc.text(`Receipt Date: ${receiptDate}`, 14, 50);
  doc.text(`Receipt No: ${transaction.reference}`, 14, 57);

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    completed: [22, 163, 74],
    pending: [234, 179, 8],
    failed: [220, 38, 38],
    cancelled: [107, 114, 128],
    processing: [59, 130, 246],
  };
  const statusColor = statusColors[transaction.status] || [107, 114, 128];
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 60, 45, 46, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(transaction.status.toUpperCase(), pageWidth - 37, 51.5, { align: "center" });

  // Transaction Details Table
  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: 70,
    head: [["Transaction Details", ""]],
    body: [
      ["Transaction Reference", transaction.reference],
      ["ClickPesa Reference", transaction.clickpesa_reference || "N/A"],
      ["Payment Network", networkNames[transaction.network] || transaction.network],
      ["Phone Number", transaction.phone_number],
      ["Description", transaction.description || "Payment for Blinno purchase"],
      ["Transaction Date", format(new Date(transaction.created_at), "PPpp")],
    ],
    headStyles: {
      fillColor: [27, 169, 76],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
    theme: "grid",
  });

  // Amount Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(14, finalY, pageWidth - 28, 30, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Amount Paid", 20, finalY + 12);
  
  const formattedAmount = new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: transaction.currency,
    minimumFractionDigits: 0,
  }).format(transaction.amount);
  
  doc.setFontSize(18);
  doc.setTextColor(27, 169, 76);
  doc.text(formattedAmount, pageWidth - 20, finalY + 20, { align: "right" });

  // Footer
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const footerY = finalY + 50;
  doc.text("This is an electronically generated receipt.", pageWidth / 2, footerY, { align: "center" });
  doc.text("For any queries, please contact support@blinno.app", pageWidth / 2, footerY + 6, { align: "center" });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY + 15, pageWidth - 14, footerY + 15);
  
  doc.setFontSize(8);
  doc.text("Blinno Marketplace • www.blinno.app", pageWidth / 2, footerY + 22, { align: "center" });

  // Save the PDF
  const fileName = `Blinno-Receipt-${transaction.reference}.pdf`;
  doc.save(fileName);
}
