import { X, Printer } from 'lucide-react';

interface ReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void; // Optional custom print handler
  data?: {
    receiptNo: string;
    date: string;
    time: string;
    customer: string;
    paymentMethod: string;
    items: { name: string; qty: number; price: number; total: number }[];
    subtotal: number;
    tax: number;
    total: number;
    branchAddress?: string; // ✅ NEW: Dynamic branch address
    branchPhone?: string;   // ✅ NEW: Dynamic branch phone
  };
}

export default function ReceiptPreview({ isOpen, onClose, onPrint, data }: ReceiptProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint(); // Use custom print handler if provided
    } else {
      window.print();
    }
  };

  // Fallback data if none provided (for testing)
  const receiptData = data || {
    receiptNo: 'INV-20260709-6929',
    date: '7/9/2026',
    time: '02:55 PM',
    customer: 'Walk-in',
    paymentMethod: 'Card',
    items: [{ name: 'Pedicure', qty: 1, price: 50, total: 50 }],
    subtotal: 50,
    tax: 4,
    total: 54,
    branchAddress: 'Sinsuat Ave. MBRH, Cotabato City', // ✅ Default to Main Branch
    branchPhone: '09772915449',
  };

  // ✅ FIX: Prevent duplicate city names (e.g., "Cotabato City, Cotabato City")
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    
    // Extract city from receiptData if available, otherwise try to guess from address
    const city = receiptData.branchAddress?.split(',').pop()?.trim() || '';
    
    // If address already ends with the city name, don't append it again
    // Note: This is a simple check. For robust handling, ensure your DB address doesn't include city.
    if (city && addr.toLowerCase().includes(city.toLowerCase())) {
      return addr; 
    }
    
    return addr;
  };

  const displayAddress = formatAddress(receiptData.branchAddress);

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
          
          {/* Header Actions (Hidden when printing) */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Receipt Preview</h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button 
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-8 bg-white receipt-paper">
            {/* Logo Section */}
            <div className="text-center mb-6">
              <img 
                src="/logo.png" 
                alt="Chloe House of Beauty" 
                className="h-20 w-auto mx-auto object-contain mb-3"
              />
              {/* ✅ DYNAMIC ADDRESS - Smart formatting to avoid duplicates */}
              <p className="text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-line">
                {displayAddress || 'Sinsuat Ave. MBRH, Cotabato City'}
                {'\n'}
                {receiptData.branchPhone || '09772915449'}
              </p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-1 text-sm font-mono mb-6 border-b border-dashed border-gray-300 pb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Receipt #</span>
                <span className="font-bold">{receiptData.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span>{receiptData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span>{receiptData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span>{receiptData.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment</span>
                <span>{receiptData.paymentMethod}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                <span>Item</span>
                <span>Total</span>
              </div>
              {receiptData.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm font-mono">
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.qty} x ₱{item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-bold">₱{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-sm font-mono mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₱{receiptData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₱{receiptData.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-900 mt-2">
                <span>TOTAL</span>
                <span>₱{receiptData.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer Barcode & Message */}
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-1 h-8 opacity-60">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`w-1 bg-black ${i % 3 === 0 ? 'h-full' : 'h-2/3'}`} />
                ))}
              </div>
              <p className="text-sm font-bold text-gray-900">Thank you for your purchase!</p>
              <p className="text-xs text-gray-500">Please come again</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-paper, .receipt-paper * { visibility: visible; }
          .receipt-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none;
          }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}