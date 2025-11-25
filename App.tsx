

import React, { Component, useState, useEffect, ReactNode, ErrorInfo, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { MenuManager } from './components/MenuManager';
import { TableManager } from './components/TableManager';
import type { View, MenuItem, Table, Order, Sale, TableStatus, PaymentMethod, OrderStatus, InventoryItem, Ingredient, DeliveryStatus, User, Role, Zone, PrinterSettings, CategoryConfig, Customer, DeliveryRate, LoyaltySettings, Expense, ProfeLocoAction, Permission } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_INVENTORY_ITEMS, INITIAL_USERS, INITIAL_ROLES, INITIAL_ZONES, INITIAL_PRINTER_SETTINGS, INITIAL_CATEGORY_CONFIG, INITIAL_LOYALTY_SETTINGS, EXPENSE_CATEGORIES, AVAILABLE_PERMISSIONS } from './constants';
import { MenuIcon, XIcon, BrainCircuitIcon } from './components/Icons';
import { KitchenTicketModal } from './components/KitchenTicketModal';
import { useToast } from './hooks/useToast';
import { WhatsAppManager } from './components/WhatsAppManager';
import { Chatbot } from './components/Chatbot';
import { InventoryManager } from './components/InventoryManager';
import { Reports } from './components/Reports';
import { DeliveryManager } from './components/DeliveryManager';
import { Login } from './components/Login';
import { AdminSettings } from './components/AdminSettings';
import { UserManual } from './components/UserManual';
import { ClientManager } from './components/ClientManager';
import { ShoppingManager } from './components/ShoppingManager';
import { LoyaltyManager } from './components/LoyaltyManager';
import { db } from './services/db';
import { supabase } from './services/supabaseClient';
import { KitchenMonitor } from './components/KitchenMonitor';
import { ExpensesManager } from './components/ExpensesManager';
import { MarketingManager } from './components/MarketingManager';
import { formatPrice } from './utils/formatPrice';
import { generateId } from './utils/generateId';

// Explicitly define props and state interfaces for ErrorBoundary
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// --- ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  declare props: Readonly<ErrorBoundaryProps>;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white font-sans">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full border border-red-600">
            <div className="flex items-center gap-3 mb-4 text-red-500">
               <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               <h1 className="text-2xl font-bold">Algo salió mal</h1>
            </div>
            <p className="text-gray-300 mb-4">La aplicación ha encontrado un error inesperado.</p>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  // -- STATE --
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const stored = localStorage.getItem('loco_session');
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [orderForTicket, setOrderForTicket] = useState<Order | null>(null);
  const [isChatbotOpen, setChatbotOpen] = useState(false);
  const { addToast } = useToast();
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(!!supabase);
  
  const [selectedTableIdForPos, setSelectedTableIdForPos] = useState<string | null>(null);

  // Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(INITIAL_PRINTER_SETTINGS);
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>(INITIAL_CATEGORY_CONFIG);
  const [deliveryRates, setDeliveryRates] = useState<DeliveryRate[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(INITIAL_LOYALTY_SETTINGS);
  
  // Helper to set initial data when DB fails or is empty
  const loadFallbackData = () => {
      setMenuItems(INITIAL_MENU_ITEMS);
      setTables(INITIAL_TABLES);
      setZones(INITIAL_ZONES);
      setInventoryItems(INITIAL_INVENTORY_ITEMS);
      setUsers(INITIAL_USERS);
      setRoles(INITIAL_ROLES);
      setPrinterSettings(INITIAL_PRINTER_SETTINGS);
      setCategoryConfigs(INITIAL_CATEGORY_CONFIG);
      setLoyaltySettings(INITIAL_LOYALTY_SETTINGS);
      setExpenseCategories(EXPENSE_CATEGORIES);
      // Empty arrays for transactional data
      setOrders([]);
      setSales([]);
      setCustomers([]);
      setExpenses([]);
      setDeliveryRates([]);
  };

  // -- REALTIME SYNC & DATA LOADING --
  const fetchData = useCallback(async () => {
    try {
      const results = await db.fetchAllTables();
      
      setIsOnline(!!supabase); // Update online status

      // Initial Seeding only if strictly empty (and we are online)
      if (supabase && results.users.length === 0 && results.roles.length === 0) {
          console.log("DB Vacía. Sembrando datos...");
          await db.seedTable('users', INITIAL_USERS);
          await db.seedTable('roles', INITIAL_ROLES);
          await db.seedTable('menu_items', INITIAL_MENU_ITEMS);
          await db.seedTable('tables', INITIAL_TABLES);
          await db.seedTable('zones', INITIAL_ZONES);
          await db.seedTable('inventory', INITIAL_INVENTORY_ITEMS);
          
          // Initialize settings
          await db.saveSetting('printer_settings', INITIAL_PRINTER_SETTINGS);
          await db.saveSetting('category_configs', INITIAL_CATEGORY_CONFIG);
          await db.saveSetting('loyalty_settings', INITIAL_LOYALTY_SETTINGS);
          await db.saveSetting('expense_categories', EXPENSE_CATEGORIES);
          
          // Refresh after seeding
          const fresh = await db.fetchAllTables();
          Object.assign(results, fresh);
      }

      // Update State
      setMenuItems(results.menu_items);
      setTables(results.tables);
      setZones(results.zones);
      setOrders(results.orders);
      setSales(results.sales);
      setInventoryItems(results.inventory);
      setUsers(results.users);
      setRoles(results.roles);
      setCustomers(results.customers);
      setExpenses(results.expenses);
      setDeliveryRates(results.delivery_rates);
      
      // Settings with safe defaults
      setPrinterSettings(results.settings.printer_settings || INITIAL_PRINTER_SETTINGS);
      setCategoryConfigs(results.settings.category_configs || INITIAL_CATEGORY_CONFIG);
      setLoyaltySettings(results.settings.loyalty_settings || INITIAL_LOYALTY_SETTINGS);
      setExpenseCategories(results.settings.expense_categories || EXPENSE_CATEGORIES);

    } catch (error) {
      console.error("Error loading data (Switching to Offline):", error);
      setIsOnline(false);
      loadFallbackData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    if (supabase) {
      const tablesToSubscribe = ['users', 'roles', 'menu_items', 'tables', 'zones', 'inventory', 'orders', 'sales', 'customers', 'expenses', 'delivery_rates', 'settings'];
      
      // Debounce fetch to avoid flashing on rapid updates
      let debounceTimer: any;
      const subscription = db.subscribe(tablesToSubscribe, (payload) => {
        // console.log('Realtime change:', payload); // Debug
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchData();
        }, 300); // 300ms delay to group updates
      });
      
      return () => { subscription?.unsubscribe(); };
    }
  }, [fetchData]);
  
  // -- LOGIC --

  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    setLoginError('');
    setIsLoading(true);
    try {
        const user = await db.login(username, pass);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('loco_session', JSON.stringify(user));
            
            // Permissions Logic
            const role = roles.find(r => r.id === user.roleId);
            if (user.username === 'admin' || user.username === 'master' || user.roleId === 'role-admin') {
                setCurrentView('DASHBOARD');
            } else if (role?.permissions.includes('POS_ACCESS')) {
                setCurrentView('POS');
            } else if (role?.permissions.includes('KITCHEN_MONITOR')) {
                setCurrentView('KITCHEN');
            } else {
                setCurrentView('DASHBOARD');
            }
            return true;
        } else {
            setLoginError('Usuario o contraseña incorrectos');
            // If login fails and DB is potentially empty (first run issue), try to force seed
            if (users.length === 0 && isOnline) {
                console.warn("Posible primer inicio. Forzando usuarios por defecto...");
                await db.forceSeedUsers();
                return handleLogin(username, pass); // Retry once
            }
            return false;
        }
    } catch (e) {
        setLoginError("Error de conexión.");
        return false;
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
      await db.logout();
      setCurrentUser(null);
      localStorage.removeItem('loco_session');
  };
  
  const handleOpenTableInPOS = (tableId: string) => {
      setSelectedTableIdForPos(tableId);
      setCurrentView('POS');
  };

  // --- CRUD OPERATIONS with Robust IDs ---

  const addUser = async (user: Omit<User, 'id'>) => {
      const newUser = { ...user, id: generateId('user') };
      await db.upsert('users', newUser);
  };
  const updateUser = async (user: User) => await db.upsert('users', user);
  const deleteUser = async (userId: string) => await db.delete('users', userId);
  
  const addRole = async (role: Omit<Role, 'id'>) => await db.upsert('roles', { ...role, id: generateId('role') });
  const updateRole = async (role: Role) => await db.upsert('roles', role);
  const deleteRole = async (roleId: string) => await db.delete('roles', roleId);
  
  const savePrinterSettings = async (settings: PrinterSettings) => {
      setPrinterSettings(settings); 
      await db.saveSetting('printer_settings', settings);
  };
  const updateCategoryConfigs = async (newConfigs: CategoryConfig[]) => {
    setCategoryConfigs(newConfigs);
    await db.saveSetting('category_configs', newConfigs);
  }
  
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => await db.upsert('menu_items', { ...item, id: generateId('menu') });
  const updateMenuItem = async (updatedItem: MenuItem) => await db.upsert('menu_items', updatedItem);
  const deleteMenuItem = async (itemId: string) => await db.delete('menu_items', itemId);
  
  const addZone = async (zone: Omit<Zone, 'id'>) => {
    const newZone = { ...zone, id: generateId('zone') };
    // Optimistic
    setZones(prev => [...prev, newZone]);
    await db.upsert('zones', newZone);
  };

  const updateZone = async (zone: Zone) => {
    setZones(prev => prev.map(z => z.id === zone.id ? zone : z));
    await db.upsert('zones', zone);
  };
  
  const deleteZone = async (zoneId: string): Promise<boolean> => {
       if (tables.some(t => t.zoneId === zoneId)) {
           addToast('No se puede eliminar un salón con mesas.', 'error');
           return false;
       }
      setZones(prev => prev.filter(z => z.id !== zoneId));
      await db.delete('zones', zoneId);
      return true;
  };
  
  const addTable = async (table: Omit<Table, 'id' | 'status'>) => {
    const newTable = { ...table, id: generateId('table'), status: 'available' as TableStatus };
    setTables(prev => [...prev, newTable]);
    await db.upsert('tables', newTable);
  };
  
  const updateTable = async (updatedTable: Table) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    await db.upsert('tables', updatedTable);
  };

  const deleteTable = async (tableId: string) => {
    if(tables.find(t => t.id === tableId)?.status === 'occupied') {
        addToast('Mesa ocupada, no se puede eliminar', 'error');
        return;
    }
    setTables(prev => prev.filter(t => t.id !== tableId));
    await db.delete('tables', tableId);
  };
  
  const updateTableStatus = async (tableId: string, status: TableStatus) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    await db.updateField('tables', tableId, 'status', status);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    let readyAt = null;
    if (status === 'ready') readyAt = new Date().toISOString();

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, readyAt: readyAt || o.readyAt } : o));
    await db.updateFields('orders', orderId, { status, readyAt });

    const order = orders.find(o => o.id === orderId);
    if(status === 'ready' && order?.orderType === 'delivery') {
      await updateOrderDeliveryStatus(orderId, 'ready');
    }
    addToast(status === 'ready' ? 'Orden marcada como lista' : 'Orden actualizada', 'info');
  };

  const updateOrderDeliveryStatus = async (orderId: string, status: DeliveryStatus, driverName?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.deliveryInfo) return;

    const now = new Date().toISOString();
    let updatedTimestamps = { ...order.deliveryInfo };
    switch(status) {
        case 'kitchen': updatedTimestamps.confirmedAt = now; break;
        case 'ready': updatedTimestamps.readyAt = now; break;
        case 'on-way': updatedTimestamps.dispatchedAt = now; break;
        case 'delivered': updatedTimestamps.deliveredAt = now; break;
    }

    const newDeliveryInfo = { ...order.deliveryInfo, ...updatedTimestamps, deliveryStatus: status, driverName: driverName || order.deliveryInfo.driverName };
    const orderStatusUpdate = (status === 'kitchen') ? { status: 'open' as OrderStatus } : {};
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryInfo: newDeliveryInfo, ...orderStatusUpdate } : o));
    await db.updateFields('orders', orderId, { deliveryInfo: newDeliveryInfo, ...orderStatusUpdate });
  };

  const createOrder = async (order: Order, showTicket: boolean = true) => {
    const isNew = !orders.some(o => o.id === order.id);
    const itemsForTicket = isNew ? order.items : order.items.filter(i => !i.isPrinted);
    
    if (showTicket && itemsForTicket.length > 0) {
      setOrderForTicket({ ...order, items: itemsForTicket });
    }
    
    const orderToSave = { ...order, items: order.items.map(i => ({ ...i, isPrinted: true })) };
    // Ensure Status Consistency
    if (orderToSave.orderType === 'dine-in' || orderToSave.orderType === 'to-go') {
        if(orderToSave.status !== 'completed' && orderToSave.status !== 'cancelled') {
            orderToSave.status = 'open';
        }
    }
    
    setOrders(prev => isNew ? [...prev, orderToSave] : prev.map(o => o.id === orderToSave.id ? orderToSave : o));
    await db.upsert('orders', orderToSave);

    if (orderToSave.orderType === 'dine-in' && orderToSave.tableId) updateTableStatus(orderToSave.tableId, 'occupied');
    addToast(isNew ? 'Orden creada' : 'Orden actualizada', isNew ? 'success' : 'info');
  };

  const deductStockFromRecipe = async (recipe: Ingredient[], quantitySold: number) => {
      for (const ing of recipe) {
          const item = inventoryItems.find(i => i.id === ing.inventoryItemId);
          if(item) {
              const newStock = Math.max(0, item.stock - (ing.quantity * quantitySold));
              await db.updateField('inventory', item.id, 'stock', newStock);
          }
      }
  };

  const updateCustomerData = async (order: Order, saleTotal: number) => {
    const phone = order.deliveryInfo?.phone || order.toGoPhone;
    if (!phone) return;

    const name = order.deliveryInfo?.name || order.toGoName || 'Cliente';
    const existingCustomer = customers.find(c => c.phone === phone);
    const pointsEarned = Math.floor(saleTotal * loyaltySettings.pointsPerPeso);

    let customerToUpdate: Customer;
    if (existingCustomer) {
        const newPoints = (existingCustomer.loyaltyPoints || 0) + pointsEarned;
        const newTier = loyaltySettings.tiers.slice().reverse().find(t => newPoints >= t.minPoints);
        customerToUpdate = {
            ...existingCustomer,
            totalSpent: existingCustomer.totalSpent + saleTotal,
            visitCount: existingCustomer.visitCount + 1,
            lastVisit: new Date().toISOString(),
            loyaltyPoints: newPoints,
            loyaltyTierId: newTier?.id || existingCustomer.loyaltyTierId,
        };
    } else {
        const newTier = loyaltySettings.tiers.slice().reverse().find(t => pointsEarned >= t.minPoints);
        customerToUpdate = {
            id: generateId('cust'), 
            name, phone,
            totalSpent: saleTotal,
            visitCount: 1,
            lastVisit: new Date().toISOString(),
            loyaltyPoints: pointsEarned,
            loyaltyTierId: newTier?.id || loyaltySettings.tiers[0].id,
        };
    }
    await db.upsert('customers', customerToUpdate);
  };

  const completeSale = async (order: Order, paymentMethod: PaymentMethod) => {
    const total = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (order.deliveryInfo?.deliveryCost || 0);
    const newSale: Omit<Sale, 'id'> = { order, timestamp: new Date().toISOString(), total, paymentMethod };

    // Update Orders locally first
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o));
    
    // Persist
    await db.insert('sales', { ...newSale, id: generateId('sale') });
    await db.updateFields('orders', order.id, { status: 'completed' as OrderStatus });
    
    order.items.forEach(item => {
        const menuItem = menuItems.find(mi => mi.id === item.id);
        if(menuItem?.recipe) deductStockFromRecipe(menuItem.recipe, item.quantity);
    });

    if (loyaltySettings.isEnabled && (order.orderType === 'delivery' || order.orderType === 'to-go')) await updateCustomerData(order, total);
    if (order.orderType === 'dine-in' && order.tableId) await updateTableStatus(order.tableId, 'available');
    addToast('Venta completada', 'success');
  };

  const deleteSale = async (saleId: string) => await db.delete('sales', saleId);
  const updateSale = async (updatedSale: Sale) => await db.upsert('sales', updatedSale);
  
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => await db.insert('inventory', { ...item, id: generateId('inv') });
  const updateInventoryItem = async (updatedItem: InventoryItem) => await db.upsert('inventory', updatedItem);
  const adjustInventoryItemStock = async (itemId: string, newStock: number) => await db.updateField('inventory', itemId, 'stock', newStock);
  
  const addCustomer = async (customer: Omit<Customer, 'id' | 'totalSpent' | 'visitCount' | 'lastVisit'>) => {
      const newCustomer = { ...customer, id: generateId('cust'), totalSpent: 0, visitCount: 0, lastVisit: new Date().toISOString() };
      await db.insert('customers', newCustomer);
  };
  const updateCustomer = async (customer: Customer) => await db.upsert('customers', customer);
  const deleteCustomer = async (customerId: string) => await db.delete('customers', customerId);
  
  const saveDeliveryRate = async (rate: Omit<DeliveryRate, 'id'>) => await db.insert('delivery_rates', { ...rate, id: generateId('rate') });
  const deleteDeliveryRate = async (rateId: string) => await db.delete('delivery_rates', rateId);
  
  const saveLoyaltySettings = async (settings: LoyaltySettings) => {
    setLoyaltySettings(settings);
    await db.saveSetting('loyalty_settings', settings);
  }
  
  const addExpense = async (expense: Omit<Expense, 'id'>) => await db.insert('expenses', { ...expense, id: generateId('exp') });
  const updateExpense = async (expense: Expense) => await db.upsert('expenses', expense);
  const deleteExpense = async (expenseId: string) => await db.delete('expenses', expenseId);
  
  const saveExpenseCategories = async (categories: string[]) => {
    setExpenseCategories(categories);
    await db.saveSetting('expense_categories', categories);
  }

  const handleFactoryReset = async () => { 
      if(window.confirm("¿ESTÁS SEGURO?")) { 
          await db.deleteAllData(); 
          localStorage.clear(); 
          window.location.reload(); 
      }
  };
  
  const handleBulkImport = async (type: 'menu' | 'inventory', data: any[]) => {
      const items = data.map(i => ({...i, id: generateId(type === 'menu' ? 'menu' : 'inv')}));
      await db.seedTable(type === 'menu' ? 'menu_items' : 'inventory', items);
      addToast(`Importados ${data.length} registros`, 'success');
  };

  const handleChatbotAction = async (action: ProfeLocoAction) => {
    switch (action.name) {
      case 'addExpense':
        await addExpense({
          description: action.args.description,
          amount: action.args.amount,
          category: action.args.category,
          date: action.args.date || new Date().toISOString(),
        });
        return `¡Gasto de ${formatPrice(action.args.amount)} para "${action.args.description}" registrado! 👍`;
      
      case 'addInventoryItem':
        await addInventoryItem({
          name: action.args.name,
          stock: action.args.stock,
          unit: action.args.unit,
          cost: action.args.cost,
          alertThreshold: action.args.alertThreshold || 0,
        });
        return `¡"${action.args.name}" añadido al inventario! 🔥`;

      case 'navigateToView':
        setCurrentView(action.args.view);
        return `¡Claro! Navegando a ${action.args.view}... 🚀`;
      
      case 'getQuickStats':
         const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
         const total = todaySales.reduce((sum, s) => sum + s.total, 0);
         return `¡Hoy hemos vendido ${formatPrice(total)} en ${todaySales.length} órdenes! 💪`;

      default:
        return 'No reconozco esa acción, ¡pero suena interesante!';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div></div>;
  if (!currentUser) return <Login onLogin={handleLogin} error={loginError} settings={printerSettings} />;
  
  // --- PERMISSIONS ---
  let currentPermissions: Permission[] = [];
  if (currentUser.roleId === 'role-admin' || currentUser.username === 'admin' || currentUser.username === 'master') {
      currentPermissions = AVAILABLE_PERMISSIONS.map(p => p.key);
  } else {
      const currentRole = roles.find(r => r.id === currentUser.roleId);
      currentPermissions = currentRole?.permissions || [];
  }

  const currentRoleName = roles.find(r => r.id === currentUser.roleId)?.name || (currentUser.roleId === 'role-admin' ? 'Administrador' : 'Usuario');

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard sales={sales} menuItems={menuItems} tables={tables} users={users} currentUser={currentUser} />;
      case 'POS': return <POS menuItems={menuItems} tables={tables} zones={zones} createOrder={createOrder} completeSale={completeSale} orders={orders} printerSettings={printerSettings} currentUser={currentUser} initialTableId={selectedTableIdForPos} clearInitialTable={() => setSelectedTableIdForPos(null)} categoryConfigs={categoryConfigs} />;
      case 'MENU': return <MenuManager menuItems={menuItems} addMenuItem={addMenuItem} updateMenuItem={updateMenuItem} deleteMenuItem={deleteMenuItem} inventoryItems={inventoryItems} categoryConfigs={categoryConfigs} updateCategoryConfigs={updateCategoryConfigs} />;
      case 'TABLES': return <TableManager tables={tables} zones={zones} addTable={addTable} updateTable={updateTable} deleteTable={deleteTable} updateTableStatus={updateTableStatus} addZone={addZone} updateZone={updateZone} deleteZone={deleteZone} onOpenTableInPOS={handleOpenTableInPOS} />;
      case 'KITCHEN': return <KitchenMonitor orders={orders} updateOrderStatus={updateOrderStatus} tables={tables} sales={sales} inventory={inventoryItems} printerSettings={printerSettings} />;
      case 'REPORTS': return <Reports sales={sales} tables={tables} zones={zones} users={users} currentUser={currentUser} deleteSale={deleteSale} updateSale={updateSale} />;
      case 'EXPENSES': return <ExpensesManager expenses={expenses} addExpense={addExpense} updateExpense={updateExpense} deleteExpense={deleteExpense} categories={expenseCategories} saveCategories={saveExpenseCategories} />;
      case 'WHATSAPP': return <WhatsAppManager orders={orders.filter(o => (o.orderType === 'delivery' || o.orderType === 'to-go') && o.status !== 'completed' && o.status !== 'cancelled')} printerSettings={printerSettings}/>;
      case 'INVENTORY': return <InventoryManager inventoryItems={inventoryItems} addInventoryItem={addInventoryItem} updateInventoryItem={updateInventoryItem} adjustStock={adjustInventoryItemStock} />;
      case 'DELIVERY_MANAGER': return <DeliveryManager orders={orders} updateOrderDeliveryStatus={updateOrderDeliveryStatus} printerSettings={printerSettings} deliveryRates={deliveryRates} saveDeliveryRate={saveDeliveryRate} deleteDeliveryRate={deleteDeliveryRate} />;
      case 'CLIENTS': return <ClientManager customers={customers} sales={sales} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} loyaltySettings={loyaltySettings} />;
      case 'SHOPPING': return <ShoppingManager inventoryItems={inventoryItems} sales={sales} menuItems={menuItems} />;
      case 'LOYALTY': return <LoyaltyManager settings={loyaltySettings} onSave={saveLoyaltySettings} menuItems={menuItems} />;
      case 'SETTINGS': return <AdminSettings users={users} roles={roles} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} addRole={addRole} updateRole={updateRole} deleteRole={deleteRole} printerSettings={printerSettings} savePrinterSettings={savePrinterSettings} onFactoryReset={handleFactoryReset} onImportData={handleBulkImport} />;
      case 'MANUAL': return <UserManual />;
      case 'MARKETING': return <MarketingManager customers={customers} />;
      default: return <Dashboard sales={sales} menuItems={menuItems} tables={tables} users={users} currentUser={currentUser} />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-[var(--black-bg)] text-gray-100">
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-[var(--card-bg)] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-[var(--card-border)]`}>
          <Sidebar currentView={currentView} setCurrentView={setCurrentView} closeSidebar={() => setSidebarOpen(false)} permissions={currentPermissions} onLogout={handleLogout} userName={currentUser.name} roleName={currentRoleName} isOnline={isOnline} settings={printerSettings} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center p-4 bg-[var(--card-bg)] border-b border-[var(--card-border)] md:hidden">
            <h1 className="text-2xl font-bangers tracking-wider uppercase">{printerSettings.shopName}</h1>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-400 focus:outline-none">{isSidebarOpen ? <XIcon /> : <MenuIcon />}</button>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
            {renderView()}
          </main>
        </div>
      </div>
      {orderForTicket && <KitchenTicketModal order={orderForTicket} onClose={() => setOrderForTicket(null)} tables={tables} printerSettings={printerSettings} />}
      <button onClick={() => setChatbotOpen(true)} className="fixed bottom-6 right-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40" aria-label="Abrir Entrenador IA"><BrainCircuitIcon className="w-8 h-8"/></button>
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setChatbotOpen(false)}
        onExecuteAction={handleChatbotAction}
      />
    </>
  );
};

const App: React.FC = () => (
    <ErrorBoundary>
        <AppContent />
    </ErrorBoundary>
);

export default App;