import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bill } from '@/types/types';
import { format } from 'date-fns';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useConrodsQuery } from '@/hooks/conrodHooks';
import { useProductionRecordsQuery } from '@/hooks/productionHooks';
import { useBillsQuery, useDeleteBillMutation } from '@/hooks/billHooks';
import { useCustomersQuery } from '@/hooks/customerHooks';

function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees';
  const oneToNineteen = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tensWords = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const parts: string[] = [];
  let remainder = num;
  const crore = Math.floor(remainder / 10000000);
  if (crore) { parts.push(oneToNineteen[crore] + ' Crores'); remainder %= 10000000; }
  const lakh = Math.floor(remainder / 100000);
  if (lakh) { parts.push(oneToNineteen[lakh] + ' Lakhs'); remainder %= 100000; }
  const thousand = Math.floor(remainder / 1000);
  if (thousand) { parts.push(oneToNineteen[thousand] + ' Thousand'); remainder %= 1000; }
  const hundred = Math.floor(remainder / 100);
  if (hundred) { parts.push(oneToNineteen[hundred] + ' Hundred'); remainder %= 100; }
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(oneToNineteen[remainder]);
    } else {
      const tenVal = Math.floor(remainder / 10);
      const unitVal = remainder % 10;
      let segment = tensWords[tenVal];
      if (unitVal) segment += ' ' + oneToNineteen[unitVal];
      parts.push(segment);
    }
  }
  return parts.join(' ') + ' Rupees';
}

const BillingHistory: React.FC = () => {
  // React Query hooks
  const { 
    data: bills = [], 
    isLoading: isLoadingBills, 
    error: billsError 
  } = useBillsQuery();
  
  const { 
    data: conrods = [], 
    isLoading: isLoadingConrods, 
    error: conrodsError 
  } = useConrodsQuery();
  
  const { 
    data: productionRecords = [], 
    isLoading: isLoadingProduction, 
    error: productionError 
  } = useProductionRecordsQuery();
  
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    error: customersError
  } = useCustomersQuery();
  
  const deleteBillMutation = useDeleteBillMutation({
    onSuccess: () => {
      toast.success('Bill deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete bill: ${error.message}`);
    }
  });

  // Handle bill deletion
  const handleDeleteBill = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      deleteBillMutation.mutate(id);
    }
  };

  // Print functions - kept exactly as they were per user request
  const handlePrintBill = (billItems: Bill[]) => {
    // Get date from first bill item
    const firstBill = billItems[0];
    const invoiceNo = firstBill.invoiceNo;
    const rec0 = firstBill.productId ? productionRecords.find(r => r.id === firstBill.productId) : null;
    const dateSource = firstBill?.date || rec0?.date;
    const dateStr = dateSource ? format(new Date(dateSource), 'dd-MM-yy HH:mm') : '-';
    const customer = firstBill.customerId ? customers.find(c => c.id === firstBill.customerId) : null;
    // Calculate totals with GST
    const subTotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = subTotal * 0.28; // 28% GST
    const grandTotal = subTotal + gstAmount;
    const totalQty = billItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
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
        <img src="/image.png" alt="Logo" style="width: 80px;" />
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
          <td>To,<br><br> <strong>${customer?.name || ''},</strong>
          <br>
          ${customer?.address || ''}
          </td>
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
          // Include size info if available
          const sizeInfo = rec?.size ? ` ${rec.size}` : '';
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
        <!-- Add 5 empty rows -->
        <tr>
          <td style="height: 100px;"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </table>

      <table class="footer-table" style="width: 100%; border-collapse: collapse; margin-top:0;">
        <tr>
          <td rowspan="2" style="width: 10%; border: 1px solid black;">Debit<br>Entry</td>
          <td style="width: 10%; border: 1px solid black;">P.L.A.</td>
          <td style="width: 20%; border: 1px solid black;">S. No.</td>
          <td style="width: 20%; border: 1px solid black;">Date</td>
          <td style="width: 10%; border: 1px solid black;"> ${totalQty}</td>
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
          <td style="border: 1px solid black; text-align: right;">Subtotal</td>
          <td style="border: 1px solid black;">${subTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="5" style="border: 1px solid black;"></td>
          <td style="border: 1px solid black; text-align: right;">GST 28%</td>
          <td style="border: 1px solid black;">${gstAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="5" style="border: 1px solid black;"></td>
          <td style="border: 1px solid black; text-align: right;">Total</td>
          <td style="border: 1px solid black;">${grandTotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="5" style="border: 1px solid black;">Amount in words: ${numberToWords(Math.floor(grandTotal))}</td>
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
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Print after a slight delay to ensure styles are loaded
      setTimeout(() => {
        printWindow.print();
        // Close window after print dialog is closed (some browsers might block this)
        printWindow.onafterprint = () => printWindow.close();
      }, 500);
    } else {
      toast.error('Unable to open print window. Please check your popup settings.');
    }
  };

  const handlePrintInvoice = (billItems: Bill[]) => {
    // Get date from first bill item
    const firstBill = billItems[0];
    const invoiceNo = firstBill.invoiceNo;
    const rec0 = firstBill.productId ? productionRecords.find(r => r.id === firstBill.productId) : null;
    const dateSource = firstBill?.date || rec0?.date;
    const dateStr = dateSource ? format(new Date(dateSource), 'dd-MM-yy') : '-';
    const customer = firstBill.customerId ? customers.find(c => c.id === firstBill.customerId) : null;
    // Calculate totals with GST
    const subTotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = subTotal * 0.28; // 28% GST
    const grandTotal = subTotal + gstAmount;
    const totalQty = billItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
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
        <td style="width: 65%; height: 120px;">
          To,<br><br> <strong>${customer?.name || ''},</strong>
          <br>
          ${customer?.address || ''}
        </td>
        <td style="width: 35%; vertical-align: top; padding: 0;">
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="border-top: 0.5px solid #000;">PACKING NOTE NO. / DELIVERY CHALLAN NO.</td>
            </tr>
            <tr>
              <td style="height: 20px;"></td>
            </tr>
            <tr>
              <td style="border-top: 0.5px solid #000;">DOCUMENTS THROUGH</td>
            </tr>
            <tr>
              <td style="height: 20px;"></td>
            </tr>
          </table>
        </td>
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
        <td style="width: 5%; text-align: center;" class="section-header">SR.<br>No.</td>
        <td style="width: 10%; text-align: center;" class="section-header">PART<br>No.</td>
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
        // Rate is per-unit price
        const rate = bill.quantity ? (bill.amount / bill.quantity).toFixed(2) : '';
        // Amount is already total (rate * quantity)
        return `
          <tr>
            <td>${index + 1}</td>
            <td></td>
            <td>${productName}</td>
            <td>Nos</td>
            <td>${bill.quantity}</td>
            <td>${rate}</td>
            <td>${bill.amount ? bill.amount.toFixed(2) : ''}</td>
          </tr>`;
      }).join('')}
      ${billItems.length > 0 ? `
      <tr style="height: ${Math.max(400 - billItems.length * 30, 100)}px;">
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>` : `
      <tr style="height: 400px;">
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`}
      <tr>
        <td colspan="4" style="border: none; border-bottom: 0.5px solid black;"></td>
        <td style="text-align:center; border: none; border-bottom: 0.5px solid black;">${totalQty}</td>
        <td style="border: 0.5px solid black; text-align: right;">Subtotal</td>
        <td style="border: 0.5px solid black;">${subTotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="5" style="border: none;"></td>
        <td style="border: 0.5px solid black; text-align: right;">GST 28%</td>
        <td style="border: 0.5px solid black;">${gstAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="5" style="border: none;">
          Amount in words: ${numberToWords(Math.floor(grandTotal))}
        </td>
        <td style="border: 0.5px solid black; text-align: right;">Grand Total</td>
        <td style="border: 0.5px solid black;">${grandTotal.toFixed(2)}</td>
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
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Print after a slight delay to ensure styles are loaded
      setTimeout(() => {
        printWindow.print();
        // Close window after print dialog is closed (some browsers might block this)
        printWindow.onafterprint = () => printWindow.close();
      }, 500);
    } else {
      toast.error('Unable to open print window. Please check your popup settings.');
    }
  };

  // Loading state
  const isLoading = isLoadingBills || isLoadingConrods || isLoadingProduction || isLoadingCustomers;
  
  // Error handling
  const error = billsError || conrodsError || productionError || customersError;
  
  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load billing history. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

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
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No bills yet. Create a bill from the Billing section.
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedBills).map(([invoiceNo, items]) => {
                    const productItems = items.map(item => {
                      const rec = productionRecords.find(r => r.id === item.productId);
                      const prod = rec ? conrods.find(c => c.id === rec.conrodId) : undefined;
                      let productName = "Unknown";
                      if (prod?.name) {
                        productName = prod.name;
                      } else if (rec) {
                        // If we have a production record but not the conrod details
                        productName = `Production #${rec.id.substr(0, 6)}`;
                      }
                      // Add size information if available
                      const sizeInfo = rec?.size ? ` - Size: ${rec.size}` : '';
                      return {
                        name: `${productName}${sizeInfo}`,
                        quantity: item.quantity
                      };
                    });
                    
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
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {productItems.map((item, idx) => (
                              <div key={idx} className="inline-flex justify-between items-center border border-neutral-200 text-secondary-foreground rounded-full px-2 py-1 text-xs">
                                {item.name} <span className="ml-1 font-bold text-gray-500">{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{totalQty}</TableCell>
                        <TableCell>₹{totalAmount}</TableCell>
                        <TableCell>{dateStr}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePrintBill(items)}
                            >
                              Print Bill
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePrintInvoice(items)}
                            >
                              Print Invoice
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => items.forEach(it => handleDeleteBill(it.id))}
                              disabled={deleteBillMutation.isPending}
                            >
                              {deleteBillMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Delete
                            </Button>
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

export default BillingHistory;
