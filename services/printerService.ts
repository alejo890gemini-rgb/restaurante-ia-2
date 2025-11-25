import type { Order, PrinterSettings, Table, OrderItem } from '../types';
import { formatPrice } from '../utils/formatPrice';

// --- TYPE DEFINITIONS FOR WEB BLUETOOTH ---
interface BluetoothRemoteGATTCharacteristic {
    writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: (event: Event) => void): void;
    removeEventListener(type: string, listener: (event: Event) => void): void;
}

declare global {
    interface Navigator {
        bluetooth: {
            requestDevice(options: { filters: any[]; optionalServices?: string[] }): Promise<BluetoothDevice>;
        };
    }
}
// ------------------------------------------

// UUIDs standard for many portable printers (GOOJPRT, MTP, etc.)
const PRINT_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINT_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

class ReceiptBuilder {
    private buffer: number[] = [];

    constructor() {
        this.reset();
    }

    // Initialize printer
    reset() {
        this.buffer = [0x1B, 0x40]; // ESC @
        return this;
    }

    // Align: 0=Left, 1=Center, 2=Right
    align(align: 0 | 1 | 2) {
        this.buffer.push(0x1B, 0x61, align);
        return this;
    }

    // Bold: 0=Off, 1=On
    bold(on: boolean) {
        this.buffer.push(0x1B, 0x45, on ? 1 : 0);
        return this;
    }

    // Text size: 0=Normal, 1=DoubleHeight, 16=DoubleWidth, 17=DoubleBoth
    size(mode: 0 | 1 | 16 | 17) {
        this.buffer.push(0x1D, 0x21, mode);
        return this;
    }

    // Add text (Supports simplified ASCII/Latin conversion)
    text(content: string) {
        const encoder = new TextEncoder(); // UTF-8
        const sanitized = content
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/Ñ/g, 'N').replace(/ñ/g, 'n'); 
        
        const data = encoder.encode(sanitized);
        data.forEach(b => this.buffer.push(b));
        return this;
    }

    textLn(content: string) {
        this.text(content);
        this.buffer.push(0x0A); // LF
        return this;
    }

    feed(lines: number = 1) {
        for (let i = 0; i < lines; i++) {
            this.buffer.push(0x0A);
        }
        return this;
    }

    cut() {
        this.buffer.push(0x1D, 0x56, 66, 0); 
        return this;
    }

    line() {
        this.textLn("-".repeat(32));
        return this;
    }

    doubleLine() {
        this.textLn("=".repeat(32));
        return this;
    }

    kv(key: string, value: string) {
        const maxLen = 32;
        const keyLen = key.length;
        const valLen = value.length;
        
        if (keyLen + valLen + 1 > maxLen) {
            this.textLn(key);
            this.align(2).textLn(value).align(0);
        } else {
            const spaces = maxLen - keyLen - valLen;
            this.text(key + " ".repeat(spaces) + value + "\n");
        }
        return this;
    }

    getBuffer(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}

class BluetoothPrinter {
    private device: BluetoothDevice | null = null;
    private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private onStateChange: ((isConnected: boolean, statusMsg?: string) => void) | null = null;
    private isReconnecting = false;
    
    // Register a callback to update UI when connection state changes
    setOnStateChange(callback: (isConnected: boolean, statusMsg?: string) => void) {
        this.onStateChange = callback;
    }

    private notifyState(isConnected: boolean, msg?: string) {
        if (this.onStateChange) {
            this.onStateChange(isConnected, msg);
        }
    }
    
    async connect(): Promise<string> {
        if (!navigator.bluetooth) {
            throw new Error("Bluetooth no soportado en este navegador. Usa Chrome en Android/PC.");
        }

        try {
            // Request device
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [PRINT_SERVICE_UUID] }],
                optionalServices: [PRINT_SERVICE_UUID]
            });

            if (!this.device) {
                throw new Error("Dispositivo no seleccionado.");
            }

            // Add listener for disconnection
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

            await this.connectGatt();

            return this.device.name || "Impresora";

        } catch (error) {
            console.error(error);
            this.notifyState(false, "Error de conexión");
            throw error;
        }
    }

    private async connectGatt() {
        if (!this.device || !this.device.gatt) return;

        const server = await this.device.gatt.connect();
        const service = await server.getPrimaryService(PRINT_SERVICE_UUID);
        this.characteristic = await service.getCharacteristic(PRINT_CHARACTERISTIC_UUID);
        
        this.notifyState(true, "Conectado");
        console.log("Impresora conectada exitosamente");
    }

    private handleDisconnect() {
        console.log('¡Impresora desconectada! Intentando reconexión automática...');
        this.characteristic = null;
        this.notifyState(false, "Desconectado. Reintentando...");
        this.attemptAutoReconnect();
    }

    private async attemptAutoReconnect() {
        if (this.isReconnecting || !this.device) return;
        
        this.isReconnecting = true;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts && (!this.device.gatt || !this.device.gatt.connected)) {
            try {
                console.log(`Intento de reconexión ${attempts + 1}/${maxAttempts}...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between attempts
                await this.connectGatt();
                console.log("¡Reconectado!");
                this.isReconnecting = false;
                return;
            } catch (error) {
                console.warn("Reconexión fallida:", error);
                attempts++;
            }
        }
        
        this.isReconnecting = false;
        this.notifyState(false, "Fallo reconexión automática");
        this.device = null; // Give up
    }

    isConnected() {
        return this.device && this.device.gatt && this.device.gatt.connected && this.characteristic;
    }

    disconnect() {
        if (this.device) {
            // Remove listener to prevent auto-reconnect on manual disconnect
            this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
            if (this.device.gatt) {
                this.device.gatt.disconnect();
            }
        }
        this.device = null;
        this.characteristic = null;
        this.notifyState(false, "Desconectado manualmente");
    }

    async printData(data: Uint8Array) {
        if (!this.isConnected()) {
            // Try one last quick reconnect if device object exists
            if (this.device) {
                try {
                    await this.connectGatt();
                } catch (e) {
                    throw new Error("Impresora desconectada y falló reconexión.");
                }
            } else {
                throw new Error("Impresora no conectada.");
            }
        }
        
        if (!this.characteristic) throw new Error("Error de característica GATT.");

        const chunkSize = 100; 
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.characteristic.writeValue(chunk);
        }
    }

    async printOrder(order: Order, settings: PrinterSettings, type: 'customer' | 'kitchen', tables: Table[], specificItems?: OrderItem[]) {
        const builder = new ReceiptBuilder();
        const tableName = order.orderType === 'dine-in' 
            ? (tables.find(t => t.id === order.tableId)?.name || 'Mesa ?') 
            : (order.orderType === 'delivery' ? 'DELIVERY' : 'LLEVAR');
        
        const clientName = order.orderType === 'delivery' ? order.deliveryInfo?.name : order.toGoName;
        const itemsToPrint = specificItems || order.items;
        const isPartialPrint = specificItems && specificItems.length < order.items.length;

        // --- HEADER ---
        builder.align(1).bold(true).size(1);
        if (type === 'customer') {
            builder.textLn(settings.shopName.toUpperCase());
        } else {
            builder.textLn("** COCINA **");
            if (isPartialPrint) {
                builder.textLn("** ADICION **");
            }
        }
        builder.size(0).bold(false);
        
        if (type === 'customer') {
            builder.textLn(settings.shopAddress);
            builder.textLn(`NIT: ${settings.shopNit}`);
            builder.textLn(`Tel: ${settings.shopPhone}`);
        }

        builder.feed(1);
        builder.align(0).textLn(`Fecha: ${new Date(order.createdAt).toLocaleString()}`);
        builder.textLn(`Orden #: ${order.id.slice(-6).toUpperCase()}`);
        builder.bold(true).size(1).textLn(tableName).size(0).bold(false);
        if (clientName) builder.textLn(`Cliente: ${clientName}`);
        
        builder.doubleLine();

        // --- ITEMS ---
        builder.align(0);
        let total = 0;

        itemsToPrint.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            builder.bold(true);
            if (type === 'customer') {
                builder.kv(`${item.quantity} x ${item.name}`, formatPrice(itemTotal));
            } else {
                builder.size(1); // Double height for kitchen clarity
                builder.textLn(`${item.quantity} x ${item.name}`);
                builder.size(0);
            }
            builder.bold(false);

            if (item.selectedChoice) builder.textLn(`  (Op: ${item.selectedChoice})`);
            if (item.selectedWingSauces.length > 0) builder.textLn(`  Salsas: ${item.selectedWingSauces.map(s => s.name).join(',')}`);
            if (item.selectedFrySauces.length > 0) builder.textLn(`  Papas: ${item.selectedFrySauces.map(s => s.name).join(',')}`);
            if (item.selectedGelatoFlavors.length > 0) builder.textLn(`  Gelato: ${item.selectedGelatoFlavors.join(',')}`);
            if (item.notes) builder.bold(true).textLn(`  NOTA: ${item.notes}`).bold(false);
            
            builder.feed(1); 
        });

        builder.line();

        // --- FOOTER ---
        if (type === 'customer') {
            builder.align(2).size(1).bold(true);
            builder.textLn(`TOTAL: ${formatPrice(total)}`);
            builder.size(0).bold(false).align(1);
            builder.feed(1);
            builder.textLn(settings.footerMessage);
        } else {
            builder.align(1).bold(true).textLn("--- FIN COMANDA ---");
        }

        builder.feed(3); 
        
        await this.printData(builder.getBuffer());
    }
}

// Export Singleton
export const bluetoothPrinter = new BluetoothPrinter();