import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bill, ProductionRecord, Customer } from '@/types/types';
import { format } from 'date-fns';
import { fetchCustomers } from '@/lib/api';

const BillingHistoryPage: React.FC = () => {
  const { conrods, bills, productionRecords, deleteBill } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  useEffect(() => {
    // Fetch customers to display customer names in the bills
    fetchCustomers().then(setCustomers).catch(err => console.error('Error fetching customers:', err));
  }, []);

  const handlePrintInvoice = (billItems: Bill[]) => {
    // Get date from first bill item
    const firstBill = billItems[0];
    const invoiceNo = firstBill.invoiceNo;
    const rec0 = firstBill.productId ? productionRecords.find(r => r.id === firstBill.productId) : null;
    const dateSource = firstBill?.date || rec0?.date;
    const dateStr = dateSource ? format(new Date(dateSource), 'dd-MM-yy') : '-';
    
    // Find customer information if available
    const customer = firstBill.customerId ? customers.find(c => c.id === firstBill.customerId) : null;
    
    // Calculate grand total
    const grandTotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    
    const html = `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - The Globe Stores Co.</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background-color: #f8f8f8; 
    }
    .invoice-box { 
      max-width: 800px; 
      margin: auto; 
      padding: 0; 
      background-color: white; 
      border: 1.5px solid #000; /* Thicker outer border */
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
    }
    td { 
      padding: 4px; 
      vertical-align: top; 
      font-size: 12px; 
      border: 0.5px solid #000; /* Thinner inner borders */
    }
    
    /* Main items table outer border and header separators */
    .main-table {
      border: 1px solid #000;
      margin-top: -1px;
    }
    .main-table tr:first-child td {
      border-bottom: 1px solid #000; /* Header bottom line */
    }
    .company-name { 
      font-size: 22px; 
      font-weight: bold; 
      color: #1a3c78; 
      margin-bottom: 2px; 
      letter-spacing: 1px; 
    }
    .tax-invoice { 
      font-size: 14px; 
      font-weight: bold; 
      color: #1a3c78; 
      text-align: center; 
      margin-bottom: 5px;
      text-decoration: underline; 
    }
    .jurisdiction { 
      font-size: 10px; 
      color: #1a3c78; 
      padding: 2px 0; 
      text-align: center; 
      font-weight: bold; 
    }
    .company-details { 
      font-size: 11px; 
      color: #1a3c78; 
    }
    .logo { 
      float: left;
      width: 100px; 
      margin-right: 10px; 
    }
    .tagline { 
      color: #1a3c78; 
      font-weight: bold; 
      font-size: 12px; 
      margin-top: 5px;
    }
    .business-type { 
      color: #1a3c78; 
      font-size: 11px; 
    }
    .description-header {
      letter-spacing: 3px;
      text-align: center;
    }
    .footer-signature { 
      text-align: right; 
      vertical-align: bottom; 
      font-size: 11px; 
      padding-right: 10px; 
    }
    .eo-text { 
      font-size: 10px; 
      padding-left: 5px; 
      text-align: left; 
    }
    .section-header {
      font-size: 11px;
      color: #1a3c78;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="tax-invoice">TAX INVOICE</div>
    
    <!-- Header Section -->
    <table>
      <tr>
        <td style="width: 65%; vertical-align: top; padding: 10px; border-right: none;">
          <div style="display: flex;">
            <div class="logo" style="width: 120px; margin-right: 10px;">
              <img src="/image.png" alt="Logo" style="width: 100%; height: 100%;" />
            </div>
            <div>
              <div class="company-name">THE GLOBE STORES CO.</div>
              <div class="company-details">4-D Block, Greenstone Heritage, D. N. Road, Mumbai - 400 001.</div>
              <div class="company-details">Mob.: 98201 25895 • Email: sarangtagare@gmail.com</div>
              <div class="company-details">GSTIN: 27AABFT4424E1ZG</div>
            </div>
          </div>
          
          <div class="tagline">QUALITY TRUST EXCELLENCE</div>
          <div class="business-type">Dealers & Exporters: Two / Three Wheeler Spares & Accessories</div>
        </td>
        
        <td style="width: 35%; padding: 0; vertical-align: top; border-left: none;">
          <div class="jurisdiction" style="border-bottom: 1px solid #000;">SUBJECT TO MUMBAI JURISDICTION</div>
          
          <!-- Invoice no and date -->
          <table style="border-collapse: collapse; margin: 0;">
            <tr>
              <td style="width: 60%; border-right: 1px solid #000;">INVOICE NO.</td>
              <td style="width: 40%">${invoiceNo}</td>
            </tr>
            <tr>
              <td style="height: 20px; border-right: 1px solid #000;">DATE</td>
              <td style="height: 20px;">${dateStr}</td>
            </tr>
          </table>
          
          <!-- Order no and date -->
          <table style="border-collapse: collapse; margin: 0; border-top: none;">
            <tr>
              <td style="width: 60%; border-right: 1px solid #000; border-top: 1px solid #000;">YOUR ORDER NO.</td>
              <td style="width: 40%; border-top: 1px solid #000;">DATE</td>
            </tr>
            <tr>
              <td style="height: 20px; border-right: 1px solid #000;"></td>
              <td style="height: 20px;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Customer/Address Section with Packing & Documents -->
    <table style="border-collapse: collapse; margin-top: -1px;">
      <tr>
        <td style="width: 65%; height: 120px;"></td>
        <td style="width: 35%; vertical-align: top; padding: 10px; border-left: none;">
          <div style="font-size: 13px; margin-top: 8px;">
            <div><strong>Invoice No. : </strong>${invoiceNo}</div>
            <div><strong>Dated : </strong>${dateStr}</div>
          </div>

          <div style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 8px;">
            <div style="margin-bottom: 5px;"><strong>${customer ? customer.name : 'Deliver To:'}</strong></div>
            <div>
              ${customer ? customer.address.replace(/\n/g, '<br>') : '[CLIENT ADDRESS]'}<br>
            </div>
          </div>
      </tr>
    </table>
    
    <!-- Transport Section -->
    <table style="border-collapse: collapse; margin-top: -1px;">
      <tr>
        <td style="width: 15%;" class="section-header">TRANSPORTER</td>
        <td style="width: 50%;"></td>
        <td style="width: 10%; text-align: center;" class="section-header">LR./RR.<br>NO.</td>
        <td style="width: 25%;"></td>
      </tr>
    </table>
    
    <!-- Items Table -->
    <table class="main-table">
      <tr>
        <td style="width: 5%; text-align: center;" class="section-header">SR.<br>NO.</td>
        <td style="width: 10%; text-align: center;" class="section-header">PART<br>NO.</td>
        <td style="width: 40%;" class="description-header section-header">D E S C R I P T I O N</td>
        <td style="width: 10%; text-align: center;" class="section-header">UNIT</td>
        <td style="width: 10%; text-align: center;" class="section-header">QTY.</td>
        <td style="width: 10%; text-align: center;" class="section-header">RATE</td>
        <td style="width: 15%; text-align: center;" class="section-header">AMOUNT</td>
      </tr>
      ${billItems.map((bill, index) => {
        const rec = productionRecords.find(r => r.id === bill.productId);
        const conrod = rec && conrods.find(c => c.id === rec.conrodId);
        // Ensure we have a product name
        let productName = "Unknown Product";
        if (conrod?.name) {
          productName = conrod.name;
        } else if (rec) {
          productName = `Production #${rec.id.substr(0, 6)}`;
        }
        // Add size information if available
        const sizeInfo = rec?.size ? ` Size: ${rec.size}` : '';
        // Rate is per-unit price
        const rate = bill.quantity ? (bill.amount / bill.quantity).toFixed(2) : '';
        // Amount is already total (rate * quantity)
        return `
          <tr>
            <td>${index + 1}</td>
            <td></td>
            <td>${productName}${sizeInfo}</td>
            <td>Nos</td>
            <td>${bill.quantity}</td>
            <td>${rate}</td>
            <td>${bill.amount ? bill.amount.toFixed(2) : ''}</td>
          </tr>`;
      }).join('')}${billItems.length > 0 ? `
      <tr style="height: ${Math.max(400 - billItems.length * 30, 100)}px;">
        <td colspan="7"></td>
      </tr>` : `
      <tr style="height: 400px;">
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>`}
      <tr>
        <td colspan="5" style="border: none;"></td>
        <td style="border: 1px solid black; text-align: right;">Total</td>
        <td style="border: 1px solid black;">${grandTotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="5" class="eo-text" style="border-right: none; vertical-align: bottom;">E. & O. E.</td>
        <td colspan="2" class="footer-signature" style="border-left: none;">
          For THE GLOBE STORES CO.<br><br><br>
          Partner
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
  };

  const handlePrintBill = (billItems: Bill[]) => {
    // Get date from first bill item
    const firstBill = billItems[0];
    const invoiceNo = firstBill.invoiceNo;
    const rec = firstBill.productId ? productionRecords.find(r => r.id === firstBill.productId) : null;
    const dateSource = firstBill?.date || rec?.date;
    const dateStr = dateSource ? format(new Date(dateSource), 'dd-MM-yy HH:mm') : '-';
    
    // Calculate grand total
    const grandTotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    
    const html = `
  <html>
  <head>
    <title>Invoice ${invoiceNo}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      .invoice-box { max-width: 800px; margin: auto; padding: 20px; background-color:rgb(249, 226, 113); border: 1px solid #000; }
      table { width: 100%; border-collapse: collapse; }
      .header { font-size: 20px; font-weight: bold; text-align: left; margin-bottom: 5px; }
      .address { font-size: 12px; margin-bottom: 15px; }
      td { font-size: 12px; }
      .main-table td { border: 1px solid #000; padding: 4px; vertical-align: top; }
      .items-table { border-collapse: collapse; margin: 0; }
      .items-table td { border: 1px solid #000; padding: 4px; }
      .footer-table td { border: 1px solid #000; padding: 4px; }
      .no-border { border: none !important; }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <div class="header">GLOBE ACCESSORIES PVT. LTD.</div>
      <div style="float: right; margin-top: -30px; margin-right: 20px;">
        <img src="/image.png" alt="Logo" style="width: 50px; height: 50px;" />
      </div>
      <div class="address">Gate No.: 2145/2146, Nanekarwadi, Chakan,<br>Tal.: Khed, Dist.: Pune - 410 501.</div>
      
      <table class="main-table">
        <tr>
          <td style="width: 65%">Range - CHAKAN VII Tal. Khed, Dist. Pune - 410 501.</td>
          <td style="width: 35%">INVOICE NO. ${invoiceNo}</td>
        </tr>
        <tr>
          <td>Division - Pune V, Dr. Ambedkar Road, Excise Bhavan,<br>Akurdi Pune - 411 044.</td>
          <td>Date: ${dateStr}</td>
        </tr>
        <tr>
          <td>To,</td>
          <td rowspan="1">
            *CLEARANCE FOR HOME CONSUMPTION /<br>
            EXPORT NATURE FOR REMOVAL (e.g. Stock<br>
            Transfer / Captive use Related Person /<br>
            Independent Buyer etc.<br>
            <br>
            I.T. PAN No.: AAACG 4166 H
          </td>
        </tr>
        <tr>
          <td>E.C.C. No.:</td>
          <td>P.L.A. No.: 170 / 87 / 97</td>
        </tr>
        <tr>
          <td>GST No.:</td>
          <td>Name of Excisable Commodity : Parts & Accessories of Vehicles</td>
        </tr>
        <tr>
          <td>Category of Consignee<br>Wholesale dealer / Industrial Consumer / Government Department / etc.</td>
          <td>Tariff Heading No. 8714 19 00<br>Exemption Notification No.</td>
        </tr>
        <tr>
          <td>Your P. O. No. & Date</td>
          <td>Rate of Duty:<br>[Notification No.] 8 / 2003 dated 01/03/2003</td>
        </tr>
        <tr>
          <td>Delivery Challan No. & Date</td>
          <td></td>
        </tr>
      </table>

      <table class="items-table" style="width: 100%; margin-top:0; border-top:0;">
        <tr>
          <td style="width: 5%">Sr.<br>No.</td>
          <td style="width: 40%">Description and Specification<br>of goods</td>
          <td style="width: 15%">No. & description<br>of Packages</td>
          <td style="width: 10%">Total Qty. of<br>goods (net)</td>
          <td style="width: 15%">Rate per Unit Rs.</td>
          <td style="width: 15%">Total Amount<br>Rs.</td>
        </tr>
        ${billItems.map((bill, index) => {
          const rec = productionRecords.find(r => r.id === bill.productId);
          const conrod = rec && conrods.find(c => c.id === rec.conrodId);
          // Ensure we have a product name
          let productName = "Unknown Product";
          if (conrod?.name) {
            productName = conrod.name;
          } else if (rec) {
            productName = `Production #${rec.id.substr(0, 6)}`;
          }
          // Add size information if available
          const sizeInfo = rec?.size ? ` Size: ${rec.size}` : '';
          // Rate is per-unit price
          const rate = bill.quantity ? (bill.amount / bill.quantity).toFixed(2) : '';
          // Amount is already total (rate * quantity)
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${productName}${sizeInfo}</td>
              <td></td>
              <td>${bill.quantity || ''}</td>
              <td>${rate || ''}</td>
              <td>${bill.amount ? bill.amount.toFixed(2) : ''}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <table class="footer-table" style="width: 100%; border-collapse: collapse; margin-top:0;">
        <tr>
          <td rowspan="2" style="width: 10%; border: 1px solid black;">Debit<br>Entry</td>
          <td style="width: 10%; border: 1px solid black;">P.L.A.</td>
          <td style="width: 20%; border: 1px solid black;">S. No.</td>
          <td style="width: 20%; border: 1px solid black;">Date</td>
          <td style="width: 10%; border: 1px solid black;">Rs.</td>
          <td style="width: 15%; border: 1px solid black;"></td>
          <td style="width: 15%; border: 1px solid black;"></td>
        </tr>
        <tr>
          <td style="border: 1px solid black;">Cenvat</td>
          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid black;">Date of issue of Invoice:</td>
          <td style="border: 1px solid black;">Time of issue of Invoice:</td>
          <td style="border: 1px solid black;">Hrs.</td>
          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid black;">Date of removal:</td>
          <td style="border: 1px solid black;">Time of removal:</td>
          <td style="border: 1px solid black;">Hrs.</td>

          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid black;">Mode of Transport:</td>
          <td colspan="2" style="border: 1px solid black;">Veh. No.:</td>

          <td style="border: 1px solid black;"></td>
          <td style="border: 1px solid black;"></td>
        </tr>
        <tr>
          <td colspan="5" style="border: 1px solid black; font-size: 11px;">Certified that the particulars given above are true and correct and the amount indicated represents the price<br>actually charged and that there is no flow additional consideration directly or indirectly from the buyer.</td>
          <td style="border: 1px solid black; text-align: right;">Total</td>
        
          <td style="border: 1px solid black;">${grandTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="5 style="border: 1px solid black;">Amount in words:</td>
          <td style="border: 1px solid black; text-align: right;">Round Off</td>

          <td style="border: 1px solid black;"></td>
        </tr>
        <tr>
          <td colspan="5" style="border: 1px solid black;"></td>
          <td style="border: 1px solid black; text-align: right;">Grand Total</td>

          <td style="border: 1px solid black;">${grandTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid black;">GST No.: 27AAACG4173B1Z0</td>
          <td style="border: 1px solid black; text-align: center;">Space for Pre-authentication</td>
          <td colspan="5" style="border: 1px solid black; text-align: center;">For Globe Accessories Pvt. Ltd.<br><br><br>Authorised Signatories</td>
        </tr>
      </table>
    </div>
  </body>
  </html>`;
    const w = window.open('', '_blank', 'width=600,height=600');
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
  };

  // Group bills by invoiceNo for multiple products
  const groupedBills = bills.reduce((acc: Record<string, Bill[]>, b) => {
    if (!acc[b.invoiceNo]) acc[b.invoiceNo] = [];
    acc[b.invoiceNo].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Billing History</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product(s)</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">No bills yet.</TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedBills).map(([invoiceNo, items]) => {
                    const productNames = items.map(item => {
                      const rec = productionRecords.find(r => r.id === item.productId);
                      const prod = rec ? conrods.find(c => c.id === rec.conrodId) : undefined;
                      let productName = "Unknown";
                      if (prod?.name) {
                        productName = prod.name;
                      } else if (rec) {
                        // If we have a production record but not the conrod details, display a meaningful name
                        productName = `Production #${rec.id.substr(0, 6)}`;
                      }
                      // Add size information if available
                      const sizeInfo = rec?.size ? ` Size: ${rec.size}` : '';
                      return `${productName}${sizeInfo} (x${item.quantity})`;
                    }).join(', ');
                    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
                    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
                    const rec0 = productionRecords.find(r => r.id === items[0].productId);
                    const dateSource = items[0]?.date || rec0?.date;
                    const dateStr = dateSource ? format(new Date(dateSource), 'dd-MM-yy HH:mm') : '-';
                    // Get customer information
                    const customer = items[0]?.customerId 
                      ? customers.find(c => c.id === items[0].customerId)
                      : null;
                      
                    return (
                      <TableRow key={invoiceNo}>
                        <TableCell>{invoiceNo}</TableCell>
                        <TableCell>{customer ? customer.name : 'N/A'}</TableCell>
                        <TableCell>{productNames}</TableCell>
                        <TableCell>{totalQty}</TableCell>
                        <TableCell>₹{totalAmount}</TableCell>
                        <TableCell>{dateStr}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handlePrintBill(items)}>Print Bill</Button>
                            <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(items)}>Print Invoice</Button>
                            <Button variant="destructive" size="sm" onClick={() => items.forEach(it => deleteBill(it.id))}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingHistoryPage;
