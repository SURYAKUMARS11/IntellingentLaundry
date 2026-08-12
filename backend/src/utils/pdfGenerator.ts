import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';

const toAmount = (val: any): string => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export const generateInvoicePDFBuffer = async (order: any, setting?: any): Promise<Buffer> => {
  // Generate QR Code PNG Buffer
  let qrBuffer: Buffer | null = null;
  const upiId = setting?.upiId || 'intelligentno1laundry@gmail.com';
  const shopName = setting?.shopName && setting.shopName !== 'IntelligentLaundry & Dry Cleaners'
    ? setting.shopName
    : 'IntelligentLaundry';
  const dueAmount = (order.remainingBalance && order.remainingBalance > 0) ? order.remainingBalance : order.totalAmount;
  const upiPaymentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${dueAmount}&cu=INR&tn=${encodeURIComponent('Order #' + order.orderNumber)}`;

  if (setting?.paymentQrUrl && setting.paymentQrUrl.startsWith('data:image')) {
    try {
      const base64Data = setting.paymentQrUrl.replace(/^data:image\/\w+;base64,/, '');
      qrBuffer = Buffer.from(base64Data, 'base64');
    } catch (e) {}
  }

  if (!qrBuffer) {
    try {
      const qrDataUrl = await QRCode.toDataURL(upiPaymentUrl, { margin: 1, width: 200 });
      const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
      qrBuffer = Buffer.from(base64Data, 'base64');
    } catch (e) {}
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const address = setting?.address || '2/516 B Thiruvalluvar Nagar, Near ambal hospital, Malumichampatti, Coimbatore 641050';
      const phone = setting?.phone || '+91 98765 43210';
      const email = setting?.email || 'intelligentno1laundry@gmail.com';
      const gstNumber = setting?.gstNumber || '';

      // Check for store logo image
      const possibleLogoPaths = [
        path.join(process.cwd(), '../frontend/public/logo.jpg'),
        path.join(process.cwd(), 'public/logo.jpg'),
        path.join(process.cwd(), '../frontend/public/logo.png'),
      ];
      let logoPath: string | null = null;
      for (const p of possibleLogoPaths) {
        if (fs.existsSync(p)) {
          logoPath = p;
          break;
        }
      }

      // Top Header Row
      let headerY = 45;

      // Draw Logo or Brand Accent
      if (logoPath) {
        try {
          doc.image(logoPath, 40, headerY, { width: 45, height: 45 });
          doc.fontSize(20).fillColor('#0369a1').font('Helvetica-Bold').text(shopName, 95, headerY + 2);
          doc.fontSize(8.5).fillColor('#64748b').font('Helvetica').text('Smart & Premium Laundry Management', 95, headerY + 24);
        } catch (e) {
          doc.fontSize(20).fillColor('#0369a1').font('Helvetica-Bold').text(shopName, 40, headerY);
          doc.fontSize(8.5).fillColor('#64748b').font('Helvetica').text('Smart & Premium Laundry Management', 40, headerY + 22);
        }
      } else {
        doc.fontSize(20).fillColor('#0369a1').font('Helvetica-Bold').text(shopName, 40, headerY);
        doc.fontSize(8.5).fillColor('#64748b').font('Helvetica').text('Smart & Premium Laundry Management', 40, headerY + 22);
      }

      // Store Details under header
      const storeDetailsY = headerY + 42;
      doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(address, 40, storeDetailsY, { width: 300 });
      doc.text(`Phone: ${phone}  |  Email: ${email}`, 40, storeDetailsY + 14);
      if (gstNumber) {
        doc.font('Helvetica-Bold').fillColor('#334155').text(`GSTIN: ${gstNumber}`, 40, storeDetailsY + 26);
      }

      // Top Right Invoice Pill & Metadata
      doc.rect(380, 42, 175, 24).fill('#0f172a');
      doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold').text(`INVOICE #${order.orderNumber}`, 380, 49, { width: 175, align: 'center' });

      doc.fontSize(8.5).fillColor('#64748b').font('Helvetica');
      doc.text(`Order Date: ${order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'N/A'}`, 380, 72, { width: 175, align: 'right' });

      // Payment Status Pill (Right side)
      const pStatus = (order.paymentStatus || 'Pending').toUpperCase();
      let pBg = '#fef3c7'; // Amber (Pending)
      let pTxt = '#b45309';
      if (pStatus === 'PAID') {
        pBg = '#dcfce7'; // Green
        pTxt = '#15803d';
      } else if (pStatus === 'PARTIALLY PAID') {
        pBg = '#e0f2fe'; // Blue
        pTxt = '#0369a1';
      }

      doc.rect(455, 86, 100, 18).fill(pBg);
      doc.fontSize(8).fillColor(pTxt).font('Helvetica-Bold').text(pStatus, 455, 91, { width: 100, align: 'center' });

      // Divider Line
      doc.moveTo(40, 135).lineTo(555, 135).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Billed To & Current Status Card Box
      const cardY = 145;
      doc.rect(40, cardY, 515, 60).fill('#f8fafc').stroke('#e2e8f0');

      // Left: Customer Info
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica-Bold').text('BILLED TO CUSTOMER', 52, cardY + 10);
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(order.customerSnapshot?.name || 'Walk-in Customer', 52, cardY + 22);
      doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(`Mobile: +91 ${order.customerSnapshot?.mobile || 'N/A'}`, 52, cardY + 36);
      if (order.customerSnapshot?.address) {
        doc.text(order.customerSnapshot.address, 52, cardY + 47, { width: 260 });
      }

      // Right: Order Status
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica-Bold').text('CURRENT STATUS', 380, cardY + 10, { width: 160, align: 'right' });
      const statusStr = (order.status || 'Received').toUpperCase();
      doc.rect(435, cardY + 24, 105, 20).fill('#0284c7');
      doc.fontSize(8.5).fillColor('#ffffff').font('Helvetica-Bold').text(statusStr, 435, cardY + 30, { width: 105, align: 'center' });

      // Itemized Table Header
      let tableY = 220;
      doc.rect(40, tableY, 515, 24).fill('#0f172a');
      doc.fontSize(8.5).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('#', 50, tableY + 7);
      doc.text('ITEM & SERVICE DESCRIPTION', 80, tableY + 7);
      doc.text('QTY', 320, tableY + 7, { width: 40, align: 'center' });
      doc.text('UNIT PRICE', 370, tableY + 7, { width: 80, align: 'right' });
      doc.text('SUBTOTAL', 460, tableY + 7, { width: 85, align: 'right' });

      // Table Rows
      tableY += 24;
      const itemsList = Array.isArray(order.items) ? order.items : [];
      itemsList.forEach((item: any, index: number) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, tableY, 515, 24).fill(rowBg);

        const serviceName = item.serviceName || item.serviceType || 'Care';
        const itemTotal = item.subtotal ?? item.itemTotal ?? ((item.unitPrice || 0) * (item.quantity || 1));

        doc.fontSize(8.5).fillColor('#64748b').font('Helvetica').text(`${index + 1}`, 50, tableY + 7);
        
        // Item Name & Service Name
        doc.fontSize(8.5).fillColor('#0f172a').font('Helvetica-Bold').text(`${item.itemName || 'Item'}`, 80, tableY + 7, { width: 230 });
        doc.fontSize(7.5).fillColor('#0284c7').font('Helvetica-Bold').text(` (${serviceName})`, 80 + doc.widthOfString(`${item.itemName || 'Item'}`), tableY + 7.5);

        doc.fontSize(8.5).fillColor('#1e293b').font('Helvetica').text(`${item.quantity || 1}`, 320, tableY + 7, { width: 40, align: 'center' });
        doc.text(`Rs. ${toAmount(item.unitPrice)}`, 370, tableY + 7, { width: 80, align: 'right' });
        doc.fontSize(8.5).fillColor('#0f172a').font('Helvetica-Bold').text(`Rs. ${toAmount(itemTotal)}`, 460, tableY + 7, { width: 85, align: 'right' });

        tableY += 24;
      });

      // Table Bottom Border Line
      doc.moveTo(40, tableY).lineTo(555, tableY).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Calculation Summary Box & UPI Payment Scan Box
      tableY += 15;

      // Left: UPI Payment Notice Box with Rendered QR Code
      doc.rect(40, tableY, 240, 75).fill('#f8fafc').stroke('#e2e8f0');
      
      let textX = 50;
      if (qrBuffer) {
        try {
          doc.image(qrBuffer, 48, tableY + 7.5, { width: 60, height: 60 });
          textX = 118;
        } catch (e) {
          textX = 50;
        }
      }

      doc.fontSize(8.5).fillColor('#0f172a').font('Helvetica-Bold').text('Scan & Pay via UPI', textX, tableY + 10);
      doc.fontSize(7.5).fillColor('#475569').font('Helvetica').text(`UPI ID: ${upiId}`, textX, tableY + 24, { width: 150 });
      doc.text(`Accepted: GPay / PhonePe / Paytm`, textX, tableY + 37, { width: 150 });
      doc.fontSize(7).fillColor('#0369a1').font('Helvetica-Bold').text('Instant Online Payment', textX, tableY + 52);

      // Right: Financial Summary Breakdown
      const summaryLeft = 360;
      let sumY = tableY;

      doc.fontSize(8.5).fillColor('#475569').font('Helvetica');
      doc.text('Subtotal:', summaryLeft, sumY, { width: 100, align: 'left' });
      doc.text(`Rs. ${toAmount(order.subtotal)}`, summaryLeft + 100, sumY, { width: 95, align: 'right' });

      if (Number(order.discount) > 0) {
        sumY += 14;
        doc.text('Discount:', summaryLeft, sumY, { width: 100, align: 'left' });
        doc.text(`- Rs. ${toAmount(order.discount)}`, summaryLeft + 100, sumY, { width: 95, align: 'right' });
      }

      if (Number(order.taxAmount) > 0) {
        sumY += 14;
        doc.text(`Tax (${order.taxPercent || 0}%):`, summaryLeft, sumY, { width: 100, align: 'left' });
        doc.text(`Rs. ${toAmount(order.taxAmount)}`, summaryLeft + 100, sumY, { width: 95, align: 'right' });
      }

      // Grand Total Highlighted Box
      sumY += 16;
      doc.rect(summaryLeft - 10, sumY - 3, 205, 22).fill('#0f172a');
      doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('Grand Total:', summaryLeft, sumY + 2);
      doc.text(`Rs. ${toAmount(order.totalAmount)}`, summaryLeft + 90, sumY + 2, { width: 95, align: 'right' });

      // Advance & Remaining Balance
      sumY += 26;
      doc.fontSize(8.5).fillColor('#475569').font('Helvetica');
      doc.text('Advance Paid:', summaryLeft, sumY, { width: 100, align: 'left' });
      doc.text(`Rs. ${toAmount(order.advancePaid)}`, summaryLeft + 100, sumY, { width: 95, align: 'right' });

      sumY += 14;
      const bal = Number(order.remainingBalance || 0);
      doc.font('Helvetica-Bold').fillColor(bal > 0 ? '#dc2626' : '#16a34a');
      doc.text('Balance Due:', summaryLeft, sumY, { width: 100, align: 'left' });
      doc.text(`Rs. ${toAmount(order.remainingBalance)}`, summaryLeft + 100, sumY, { width: 95, align: 'right' });

      // Bottom Footer Banner with Exact Terms & Conditions
      const footerY = 720;
      doc.moveTo(40, footerY - 10).lineTo(555, footerY - 10).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fontSize(9).fillColor('#0284c7').font('Helvetica-Bold').text(`Thank you for choosing ${shopName}!`, 40, footerY, { align: 'center' });
      
      doc.fontSize(7.5).fillColor('#475569').font('Helvetica');
      doc.text('1. Please inspect clothes upon delivery.', 40, footerY + 14, { align: 'center' });
      doc.text('2. Clothes not collected within 30 days are subject to storage charges.', 40, footerY + 25, { align: 'center' });
      doc.text('3. Colors may bleed on delicate items if not pre-informed.', 40, footerY + 36, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
