





export type View = 'DASHBOARD' | 'POS' | 'MENU' | 'TABLES' | 'REPORTS' | 'WHATSAPP' | 'INVENTORY' | 'DELIVERY_MANAGER' | 'SETTINGS' | 'MANUAL' | 'CLIENTS' | 'SHOPPING' | 'LOYALTY' | 'KITCHEN' | 'EXPENSES' | 'MARKETING' | 'QR_MANAGER';

// This is now a string to accommodate descriptive categories
export type MenuItemCategory = string;

export interface CategoryConfig {
    name: string;
    color: string; // Hex code
}

export interface Sauce {
  name: string;
  key: string;
}

// Inventory & Recipe Types
export type InventoryUnit = 'kg' | 'g' | 'L' | 'ml' | 'unidad';

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: InventoryUnit;
  cost: number; // Cost per unit
  alertThreshold: number;
}

export interface Ingredient {
  inventoryItemId: string; // links to InventoryItem id
  quantity: number;
}


export interface MenuItem {
  id: string; // Changed from number
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  hasWings?: boolean;
  hasFries?: boolean;
  submenuKey?: string;
  maxChoices?: number; // For limiting gelato flavor selections
  imageUrl?: string; // For AI-generated images
  recipe?: Ingredient[]; // For inventory tracking
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Zone {
    id: string;
    name: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  zoneId: string; // Linked to Zone id
  x?: number; // For table map view
  y?: number; // For table map view
}

export interface OrderItem extends MenuItem {
  instanceId: string; // Unique ID for this specific item in the order
  quantity: number;
  selectedWingSauces: Sauce[];
  selectedFrySauces: Sauce[];
  selectedChoice: string | null;
  selectedGelatoFlavors: string[];
  notes?: string; // For special requests like 'no onions'
  isPrinted?: boolean; // Tracks if sent to kitchen
}

export type OrderType = 'dine-in' | 'delivery' | 'to-go';

export type DeliveryStatus = 'quoting' | 'customer_confirmation' | 'kitchen' | 'ready' | 'on-way' | 'delivered';

export interface DeliveryInfo {
    name: string;
    phone: string;
    address: string;
    normalizedAddress?: string; // For AI matching
    googleMapsLink?: string; // AI Generated Link
    driverName?: string;
    deliveryStatus?: DeliveryStatus;
    deliveryCost?: number; // Cost charged by external company
    estimatedTime?: string; // e.g., "30 mins"
    
    // Timestamps for Analytics
    confirmedAt?: string; // When customer accepted and moved to kitchen
    readyAt?: string; // When kitchen finished
    dispatchedAt?: string; // When driver took it (on-way)
    deliveredAt?: string; // When status became delivered
}

export type OrderStatus = 'open' | 'completed' | 'cancelled' | 'ready' | 'pending_confirmation';

export interface Order {
  id: string;
  orderType: OrderType;
  tableId?: string; // Optional for delivery/to-go orders
  userId?: string; // ID of the user (waiter/cashier) who created the order
  deliveryInfo?: DeliveryInfo; // Optional for dine-in/to-go orders
  toGoName?: string; // Optional for dine-in/delivery orders
  toGoPhone?: string; // Optional phone for to-go orders
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  readyAt?: string; // Timestamp for when the order was marked as 'ready'
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';

export interface Sale {
  id: string;
  order: Order;
  total: number;
  timestamp: string;
  paymentMethod: PaymentMethod;
}

export interface DeliveryRate {
    id: string;
    keywords: string[]; // e.g., ["calle 10", "barrio centro"]
    cost: number;
    averageTime: string;
    usageCount: number; // To learn which are most frequent
}

// --- LOYALTY SYSTEM TYPES ---

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  perkDescription: string;
  discountPercentage: number;
  color: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointCost: number;
  type: 'free_item' | 'discount_percentage' | 'discount_fixed';
  value: number; // menu item ID for free_item, percentage for discount, fixed amount for discount
  menuItemId?: string; // Only for free_item type
}

export interface LoyaltySettings {
  isEnabled: boolean;
  pointsPerPeso: number; // e.g., 0.001 for 1 point per 1000 pesos
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
}

// --- NEW CUSTOMER MODULE TYPE ---
export interface Customer {
  id: string; // Primary key, can be phone number or generated ID
  name: string;
  phone: string; // Used for matching delivery/togo orders
  email?: string;
  totalSpent: number;
  visitCount: number;
  lastVisit: string; // ISO date string
  tags?: string[]; // AI-generated tags like 'burger_lover', 'weekend_regular'
  notes?: string;
  // Loyalty Data
  loyaltyPoints?: number;
  loyaltyTierId?: string;
}

// --- NEW SHOPPING LIST TYPE ---
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  justification?: string;
  checked: boolean;
}

// AUTHENTICATION & RBAC TYPES

export type Permission = 
  | 'VIEW_DASHBOARD'
  | 'POS_ACCESS'
  | 'MANAGE_MENU'
  | 'MANAGE_TABLES'
  | 'MANAGE_INVENTORY'
  | 'VIEW_REPORTS'
  | 'DELIVERY_MANAGER'
  | 'MANAGE_CLIENTS'
  | 'MANAGE_LOYALTY'
  | 'MANAGE_SHOPPING_LIST'
  | 'KITCHEN_MONITOR'
  | 'MANAGE_EXPENSES'
  | 'MANAGE_MARKETING'
  | 'MANAGE_QR'
  | 'MANAGE_SETTINGS';

// --- NEWLY ADDED TYPES TO FIX ERRORS ---

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  roleId: string;
}

export interface Role {
  id: string;
  name: string;
  isSystem?: boolean;
  permissions: Permission[];
}

export interface PurchasingContact {
    name: string;
    phone: string;
}

export interface PrinterSettings {
    paperSize: '58mm' | '80mm';
    shopName: string;
    shopSlogan: string;
    shopAddress: string;
    shopPhone: string;
    shopNit: string;
    footerMessage: string;
    socialMedia: string;
    autoPrintKitchen: boolean;
    autoPrintReceipt: boolean;
    deliveryProviderName?: string;
    deliveryProviderPhone?: string;
    purchasingContacts: PurchasingContact[];
    kitchenTimer?: number;
    publicMenuUrl?: string;
    bluetoothDeviceName?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export type ExpenseCategory = string;

// AI & Chatbot Types
export type ProfeLocoActionName = 'addExpense' | 'addInventoryItem' | 'navigateToView' | 'getQuickStats';

export interface ProfeLocoAction {
  name: ProfeLocoActionName;
  args: any;
}

export interface ProfeLocoActionResponse {
    type: 'text' | 'function_call';
    text?: string;
    functionCall?: ProfeLocoAction;
    clarification?: string;
}

export interface ProfeLocoResponse {
    tip: string;
    topWaiter: string;
}

// AI Parsing Types
export interface ParsedCustomerInfo {
    name: string;
    phone: string;
    address?: string;
}
export interface ParsedOrderItem {
    menuItemId: string;
    quantity: number;
    notes?: string;
}
export interface ParsedOrder {
    customer: ParsedCustomerInfo;
    items: ParsedOrderItem[];
}

export interface ParsedVoiceCommand {}

export interface ParsedInventoryCommand {
    intent: 'adjust' | 'create' | 'update' | 'unknown';
    itemName: string;
    adjustStockValue?: number;
    itemData?: Partial<Omit<InventoryItem, 'id'>>;
    message?: string;
}

export interface ShoppingList {
  [category: string]: {
    name: string;
    suggestedQuantity: string;
    justification: string;
  }[];
}

// AI Reporting Types
export interface MenuEngineeringItem {
    id: string;
    name: string;
    popularity: number;
    profit: number;
    classification: 'Star' | 'Plow-Horse' | 'Puzzle' | 'Dog';
    marginPercent: number;
}

export interface ReportData {
    // Define structure based on usage if needed
}

// UI Types
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}