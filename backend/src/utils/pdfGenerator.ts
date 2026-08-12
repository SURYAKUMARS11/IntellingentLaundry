import PDFDocument from 'pdfkit';

const toAmount = (val: any): string => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export const generateInvoicePDFBuffer = async (order: any, setting?: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const shopName = setting?.shopName || 'IntelligentLaundry';
      const address = setting?.address || '2/516 B Thiruvalluvar Nagar, Near ambal hospital, Malumichampatti, Coimbatore 641050';
      const phone = setting?.phone || '+91 98765 43210';
      const email = 'intelligentno1laundry@gmail.com';

      // Header Brand Accent
      doc.rect(40, 40, 515, 6).fill('#0284c7');

      // Top Title & Shop Info
      doc.fontSize(22).fillColor('#0f172a').font('Helvetica-Bold').text(shopName, 40, 60);
      doc.fontSize(9).fillColor('#64748b').font('Helvetica').text('Smart & Eco-Friendly Garment Care', 40, 85);
      doc.text(address, 40, 98, { width: 300 });
      doc.text(`Phone: ${phone} | Email: ${email}`, 40, 115);

      // Invoice Badge Right Side
      doc.fontSize(18).fillColor('#0284c7').font('Helvetica-Bold').text('TAX INVOICE', 380, 60, { align: 'right' });
      doc.fontSize(10).fillColor('#334155').font('Helvetica-Bold').text(`Invoice #: ${order.orderNumber}`, 380, 85, { align: 'right' });
      doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(`Date: ${order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'N/A'}`, 380, 100, { align: 'right' });
      doc.text(`Status: ${(order.status || 'Received').toUpperCase()}`, 380, 115, { align: 'right' });

      // Divider Line
      doc.moveTo(40, 140).lineTo(555, 140).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Customer Details Box
      doc.rect(40, 150, 515, 65).fill('#f8fafc').stroke('#cbd5e1');
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('CUSTOMER DETAILS', 50, 160);
      doc.fontSize(9).fillColor('#334155').font('Helvetica').text(`Name: ${order.customerSnapshot?.name || 'Walk-in Customer'}`, 50, 175);
      doc.text(`Phone: ${order.customerSnapshot?.mobile || 'N/A'}`, 50, 190);
      if (order.customerSnapshot?.address) {
        doc.text(`Address: ${order.customerSnapshot.address}`, 50, 202);
      }

      // Items Table Header
      let startY = 230;
      doc.rect(40, startY, 515, 24).fill('#0f172a');
      doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('#', 50, startY + 7);
      doc.text('ITEM & SERVICE', 80, startY + 7);
      doc.text('QTY', 330, startY + 7, { width: 40, align: 'center' });
      doc.text('UNIT PRICE', 380, startY + 7, { width: 70, align: 'right' });
      doc.text('TOTAL', 465, startY + 7, { width: 80, align: 'right' });

      // Items Rows
      startY += 24;
      doc.font('Helvetica').fillColor('#1e293b');

      const itemsList = Array.isArray(order.items) ? order.items : [];
      itemsList.forEach((item: any, index: number) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, startY, 515, 24).fill(rowBg);
        
        const serviceName = item.serviceName || item.serviceType || 'Care';
        const itemTotal = item.subtotal ?? item.itemTotal ?? ((item.unitPrice || 0) * (item.quantity || 1));

        doc.fontSize(9).fillColor('#334155').text(`${index + 1}`, 50, startY + 7);
        doc.text(`${item.itemName || 'Item'} (${serviceName})`, 80, startY + 7, { width: 240 });
        doc.text(`${item.quantity || 1}`, 330, startY + 7, { width: 40, align: 'center' });
        doc.text(`Rs. ${toAmount(item.unitPrice)}`, 380, startY + 7, { width: 70, align: 'right' });
        doc.text(`Rs. ${toAmount(itemTotal)}`, 465, startY + 7, { width: 80, align: 'right' });

        startY += 24;
      });

      // Divider Line
      doc.moveTo(40, startY + 5).lineTo(555, startY + 5).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Calculation Summary
      startY += 15;
      const summaryLeft = 360;

      doc.fontSize(9).fillColor('#475569').font('Helvetica');
      doc.text('Subtotal:', summaryLeft, startY, { width: 100, align: 'left' });
      doc.text(`Rs. ${toAmount(order.subtotal)}`, summaryLeft + 100, startY, { width: 95, align: 'right' });

      if (Number(order.discount) > 0) {
        startY += 15;
        doc.text('Discount:', summaryLeft, startY, { width: 100, align: 'left' });
        doc.text(`- Rs. ${toAmount(order.discount)}`, summaryLeft + 100, startY, { width: 95, align: 'right' });
      }

      if (Number(order.taxAmount) > 0) {
        startY += 15;
        doc.text(`Tax (${order.taxPercent || 0}%):`, summaryLeft, startY, { width: 100, align: 'left' });
        doc.text(`Rs. ${toAmount(order.taxAmount)}`, summaryLeft + 100, startY, { width: 95, align: 'right' });
      }

      startY += 18;
      doc.rect(summaryLeft - 10, startY - 4, 205, 25).fill('#0284c7');
      doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('Grand Total:', summaryLeft, startY + 3);
      doc.text(`Rs. ${toAmount(order.totalAmount)}`, summaryLeft + 90, startY + 3, { width: 95, align: 'right' });

      startY += 30;
      doc.fontSize(9).fillColor('#334155').font('Helvetica');
      doc.text('Advance Paid:', summaryLeft, startY, { width: 100, align: 'left' });
      doc.text(`Rs. ${toAmount(order.advancePaid)}`, summaryLeft + 100, startY, { width: 95, align: 'right' });

      startY += 15;
      const bal = Number(order.remainingBalance || 0);
      doc.font('Helvetica-Bold').fillColor(bal > 0 ? '#dc2626' : '#16a34a');
      doc.text('Balance Due:', summaryLeft, startY, { width: 100, align: 'left' });
      doc.text(`Rs. ${toAmount(order.remainingBalance)}`, summaryLeft + 100, startY, { width: 95, align: 'right' });

      // Footer Notes
      const footerY = 750;
      doc.moveTo(40, footerY - 10).lineTo(555, footerY - 10).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold').text('Thank you for choosing IntelligentLaundry!', 40, footerY, { align: 'center' });
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('This is a computer-generated invoice.', 40, footerY + 14, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
