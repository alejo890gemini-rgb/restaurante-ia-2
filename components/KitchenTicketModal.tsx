
import React from 'react';
import type { Order, Table, PrinterSettings } from '../types';
import { Receipt } from './Receipt';
import { bluetoothPrinter } from '../services/printerService';

interface KitchenTicketModalProps {
  order: Order;
  onClose: () => void;
  tables: Table[];
  printerSettings: PrinterSettings;
}

export const KitchenTicketModal: React.FC<KitchenTicketModalProps> = ({ order, onClose, tables, printerSettings }) => {
  const handlePrint = async () => {
    if (bluetoothPrinter.isConnected()) {
        try {
            await bluetoothPrinter.printOrder(order, printerSettings, 'kitchen', tables);
        } catch (e) {
            window.print(); // Fallback
        }
    } else {
        window.print();
    }
  };

  return (
    // The outer wrapper handles the modal positioning on screen. 
    // The .printable-content class is inside, ensuring only the receipt prints.
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 no-print-backdrop">
      <div className="bg-[var(--card-bg)] rounded-lg shadow-xl w-full max-w-sm border-t-4 border-[var(--accent-yellow)]">
        <div className="p-4 bg-white text-black max-h-[70vh] overflow-y-auto">
            {/* This div is what becomes visible during print */}
            <div className="printable-content">
                <Receipt order={order} settings={printerSettings} type="kitchen" tables={tables} />
            </div>
        </div>
        <div className="p-4 flex justify-end gap-4 bg-[var(--card-bg)] rounded-b-lg no-print">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 text-sm">Cerrar</button>
            <button type="button" onClick={handlePrint} className="px-4 py-2 bg-[var(--primary-red)] text-white rounded-lg hover:bg-[var(--dark-red)] text-sm">
                {bluetoothPrinter.isConnected() ? 'Imprimir Bluetooth' : 'Imprimir Comanda'}
            </button>
        </div>
      </div>
    </div>
  );
};