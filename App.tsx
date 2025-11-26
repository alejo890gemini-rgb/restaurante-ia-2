
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { MenuManager } from './components/MenuManager';
import { TableManager } from './components/TableManager';
import type { View, MenuItem, Table, Order, Sale, TableStatus, PaymentMethod, OrderStatus, InventoryItem, DeliveryStatus, User, Role, Zone, PrinterSettings, CategoryConfig, Customer, DeliveryRate, LoyaltySettings, Expense, ProfeLocoAction, Sede } from './types';
import { BASE_MENU_ITEMS, INITIAL_TABLES, INITIAL_INVENTORY_ITEMS, INITIAL_USERS, INITIAL_ROLES, INITIAL_ZONES, INITIAL_PRINTER_SETTINGS, INITIAL_CATEGORY_CONFIG, INITIAL_LOYALTY_SETTINGS, EXPENSE_CATEGORIES, INITIAL_SEDES } from './constants';
import { MenuIcon, BrainCircuitIcon } from './components/Icons';
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
import { QrManager } from './components/QrManager';
import { generateId } from './utils/generateId';
import { formatPrice } from './utils/formatPrice';

const App: React.FC = () => {
  // -- AUTH STATE --
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const stored = localStorage.getItem('loco_session');
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // -- UI STATE --
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isChatbotOpen, setChatbotOpen] = useState(false);
  const { addToast } = useToast();
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(!!supabase);
  const [selectedTableIdForPos, setSelectedTableIdForPos] = useState<string | null>(null);

  // -- DATA STATE --
  const [menuItems, setMenuItems] = useState<MenuItem[]>(BASE_MENU_ITEMS);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY_ITEMS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(INITIAL_PRINTER_SETTINGS);
  const [deliveryRates, setDeliveryRates] = useState<DeliveryRate[]>([]);
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>(INITIAL_CATEGORY_CONFIG);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(INITIAL_LOYALTY_SETTINGS);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(EXPENSE_CATEGORIES);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [sedes, setSedes] = useState<Sede[]>(INITIAL_SEDES);
  const [selectedSedeId, setSelectedSedeId] = useState<string>('sede-principal');

  // -- INITIALIZATION --
  const fetchData = useCallback(async () => {
    try {
        const data = await db.fetchAllTables();
        if (data) {
            if (data.menu_items?.length) setMenuItems(data.menu_items);
            if (data.tables?.length) setTables(data.tables);
            if (data.zones?.length) setZones(data.zones);
            if (data.orders?.length) setOrders(data.orders);
            if (data.sales?.length) setSales(data.sales);
            if (data.inventory?.length) setInventory(data.inventory);
            if (data.customers?.length) setCustomers(data.customers);
            if (data.delivery_rates?.length) setDeliveryRates(data.delivery_rates);
            if (data.expenses?.length) setExpenses(data.expenses);
            if (data.users?.length) setUsers(data.users);
            if (data.roles?.length) setRoles(data.roles);
            if (data.sedes?.length) {
                setSedes(data.sedes);
            }

            // Settings
            if (data.settings) {
                if (data.settings.printer_settings) setPrinterSettings(data.settings.printer_settings);
                if (data.settings.category_configs) setCategoryConfigs(data.settings.category_configs);
                if (data.settings.loyalty_settings) setLoyaltySettings(data.settings.loyalty_settings);
                if (data.settings.expense_categories) setExpenseCategories(data.settings.expense_categories);
            }
        }
    } catch (error) {
        console.error("Error initializing data:", error);
        addToast('Error cargando datos. Modo Offline activado.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();

    // Realtime Subscription
    const subscription = db.subscribe(
        ['orders', 'tables', 'inventory', 'sales', 'users', 'menu_items'], 
        (payload) => {
            fetchData(); 
        }
    );

    return () => {
        subscription?.unsubscribe();
    };
  }, [fetchData]);

  useEffect(() => {
      if (currentUser) {
          setSelectedSedeId(currentUser.sedeId);
      }
  }, [currentUser]);

  // -- HANDLERS --

  const handleLogin = async (u: string, p: string) => {
    const user = await db.login(u, p);
    if (user) {
        setCurrentUser(user);
        localStorage.setItem('loco_session', JSON.stringify(user));
        setLoginError('');
        setSelectedSedeId(user.sedeId);
        return true;
    } else {
        setLoginError('Credenciales inválidas');
        return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('loco_session');
    setCurrentView('DASHBOARD');
  };

  // --- MENU HANDLERS ---
  const handleAddMenuItem = (item: Omit<MenuItem, 'id'>) => {
      const newItem = { ...item, id: generateId('menu') };
      setMenuItems(prev => [...prev, newItem]);
      db.insert('menu_items', newItem);
  };
  const handleUpdateMenuItem = (item: MenuItem) => {
      setMenuItems(prev => prev.map(i => i.id === item.id ? item : i));
      db.upsert('menu_items', item);
  };
  const handleDeleteMenuItem = (id: string) => {
      setMenuItems(prev => prev.filter(i => i.id !== id));
      db.delete('menu_items', id);
  };

  // --- TABLE & ZONE HANDLERS ---
  const handleAddTable = (table: Omit<Table, 'id' | 'status'>) => {
      const newTable: Table = { ...table, id: generateId('table'), status: 'available' };
      setTables(prev => [...prev, newTable]);
      db.insert('tables', newTable);
  };
  const handleUpdateTable = (table: Table) => {
      setTables(prev => prev.map(t => t.id === table.id ? table : t));
      db.upsert('tables', table);
  };
  const handleDeleteTable = (id: string) => {
      setTables(prev => prev.filter(t => t.id !== id));
      db.delete('tables', id);
  };
  const handleUpdateTableStatus = (id: string, status: TableStatus) => {
      const table = tables.find(t => t.id === id);
      if (table) {
          const updated = { ...table, status };
          handleUpdateTable(updated);
      }
  };
  
  const handleAddZone = (zone: Omit<Zone, 'id'>) => {
      const newZone = { ...zone, id: generateId('zone') };
      setZones(prev => [...prev, newZone]);
      db.insert('zones', newZone);
  }
  const handleUpdateZone = (zone: Zone) => {
      setZones(prev => prev.map(z => z.id === zone.id ? zone : z));
      db.upsert('zones', zone);
  }
  const handleDeleteZone = async (id: string) => {
      if (tables.some(t => t.zoneId === id)) {
          addToast('No se puede eliminar un salón con mesas.', 'error');
          return false;
      }
      setZones(prev => prev.filter(z => z.id !== id));
      await db.delete('zones', id);
      return true;
  }

  // --- POS & ORDER HANDLERS ---
  const handleCreateOrder = (order: Order) => {
      const existingIndex = orders.findIndex(o => o.id === order.id);
      if (existingIndex >= 0) {
          const updatedOrders = [...orders];
          updatedOrders[existingIndex] = order;
          setOrders(updatedOrders);
          db.upsert('orders', order);
      } else {
          setOrders(prev => [...prev, order]);
          db.insert('orders', order);
      }

      if (order.tableId && order.status === 'open') {
          handleUpdateTableStatus(order.tableId, 'occupied');
      }
      addToast('Orden guardada', 'success');
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          const updatedOrder = { 
              ...order, 
              status,
              readyAt: status === 'ready' ? new Date().toISOString() : order.readyAt 
          };
          setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
          db.upsert('orders', updatedOrder);
          
          // If completed or cancelled, free the table
          if ((status === 'completed' || status === 'cancelled') && order.tableId) {
              handleUpdateTableStatus(order.tableId, 'available');
          }
      }
  };

  const handleCompleteSale = async (order: Order, paymentMethod: PaymentMethod) => {
      const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (order.deliveryInfo?.deliveryCost || 0);
      
      // 1. Create Sale
      const sale: Sale = {
          id: generateId('sale'),
          order: { ...order, status: 'completed' },
          total,
          timestamp: new Date().toISOString(),
          paymentMethod,
          sedeId: order.sedeId
      };
      setSales(prev => [...prev, sale]);
      await db.insert('sales', sale);

      // 2. Update Order Status
      handleUpdateOrderStatus(order.id, 'completed');

      // 3. Deduct Inventory
      const newInventory = [...inventory];
      let inventoryChanged = false;

      for (const item of order.items) {
          // Recipe deduction
          if (item.recipe && item.recipe.length > 0) {
              item.recipe.forEach(ing => {
                  const invIndex = newInventory.findIndex(inv => inv.id === ing.inventoryItemId);
                  if (invIndex > -1) {
                      newInventory[invIndex].stock = Math.max(0, newInventory[invIndex].stock - (ing.quantity * item.quantity));
                      inventoryChanged = true;
                      db.upsert('inventory', newInventory[invIndex]); // Sync individual item
                  }
              });
          } 
          // Direct mapping deduction (fallback if name matches)
          else {
              const invIndex = newInventory.findIndex(inv => inv.name.toLowerCase() === item.name.toLowerCase());
              if (invIndex > -1 && newInventory[invIndex].unit === 'unidad') {
                  newInventory[invIndex].stock = Math.max(0, newInventory[invIndex].stock - item.quantity);
                  inventoryChanged = true;
                  db.upsert('inventory', newInventory[invIndex]);
              }
          }
      }
      if (inventoryChanged) setInventory(newInventory);

      // 4. Loyalty Points
      if (loyaltySettings.isEnabled) {
          const customerPhone = order.deliveryInfo?.phone || order.toGoPhone;
          const customerName = order.deliveryInfo?.name || order.toGoName;
          
          if (customerPhone && customerName) {
              let customer = customers.find(c => c.phone === customerPhone);
              const pointsEarned = Math.floor(total * loyaltySettings.pointsPerPeso);
              
              if (customer) {
                  const updatedCustomer = {
                      ...customer,
                      totalSpent: customer.totalSpent + total,
                      visitCount: customer.visitCount + 1,
                      lastVisit: new Date().toISOString(),
                      loyaltyPoints: (customer.loyaltyPoints || 0) + pointsEarned
                  };
                  handleUpdateCustomer(updatedCustomer);
              } else {
                  const newCustomer: Customer = {
                      id: generateId('cust'),
                      name: customerName,
                      phone: customerPhone,
                      totalSpent: total,
                      visitCount: 1,
                      lastVisit: new Date().toISOString(),
                      loyaltyPoints: pointsEarned,
                      sedeId: selectedSedeId
                  };
                  handleAddCustomer(newCustomer);
              }
          }
      }

      addToast(`Venta registrada: $${total.toLocaleString()}`, 'success');
  };

  // --- INVENTORY HANDLERS ---
  const handleAddInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
      const newItem = { ...item, id: generateId('inv'), sedeId: selectedSedeId };
      setInventory(prev => [...prev, newItem]);
      db.insert('inventory', newItem);
  };
  const handleUpdateInventoryItem = (item: InventoryItem) => {
      setInventory(prev => prev.map(i => i.id === item.id ? item : i));
      db.upsert('inventory', item);
  };
  const handleAdjustStock = (itemId: string, newStock: number) => {
      const item = inventory.find(i => i.id === itemId);
      if (item) {
          handleUpdateInventoryItem({ ...item, stock: newStock });
      }
  };

  // --- CUSTOMER HANDLERS ---
  const handleAddCustomer = (customer: Omit<Customer, 'id' | 'totalSpent' | 'visitCount' | 'lastVisit'>) => {
      const newCustomer: Customer = {
          ...customer,
          id: generateId('cust'),
          totalSpent: 0,
          visitCount: 0,
          lastVisit: '',
          sedeId: selectedSedeId
      };
      setCustomers(prev => [...prev, newCustomer]);
      db.insert('customers', newCustomer);
  };
  const handleUpdateCustomer = (customer: Customer) => {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      db.upsert('customers', customer);
  };
  const handleDeleteCustomer = (id: string) => {
      setCustomers(prev => prev.filter(c => c.id !== id));
      db.delete('customers', id);
  };

  // --- DELIVERY HANDLERS ---
  const handleUpdateOrderDeliveryStatus = (orderId: string, status: DeliveryStatus, driverName?: string) => {
      const order = orders.find(o => o.id === orderId);
      if (order && order.deliveryInfo) {
          const updatedInfo = { ...order.deliveryInfo, deliveryStatus: status };
          if (driverName) updatedInfo.driverName = driverName;
          
          // Track timestamps
          if (status === 'kitchen') updatedInfo.confirmedAt = new Date().toISOString();
          if (status === 'ready') updatedInfo.readyAt = new Date().toISOString();
          if (status === 'on-way') updatedInfo.dispatchedAt = new Date().toISOString();
          if (status === 'delivered') updatedInfo.deliveredAt = new Date().toISOString();

          const updatedOrder = { ...order, deliveryInfo: updatedInfo };
          
          // Sync status with main order status for consistency
          if (status === 'delivered') updatedOrder.status = 'completed'; 
          
          handleCreateOrder(updatedOrder);
      }
  };
  const handleSaveDeliveryRate = (rate: Omit<DeliveryRate, 'id'>) => {
      const newRate = { ...rate, id: generateId('rate'), sedeId: selectedSedeId };
      setDeliveryRates(prev => [...prev, newRate]);
      db.insert('delivery_rates', newRate);
  };
  const handleDeleteDeliveryRate = (id: string) => {
      setDeliveryRates(prev => prev.filter(r => r.id !== id));
      db.delete('delivery_rates', id);
  }

  // --- SETTINGS HANDLERS ---
  const handleSavePrinterSettings = (settings: PrinterSettings) => {
      setPrinterSettings(settings);
      db.saveSetting('printer_settings', settings);
  };
  const handleUpdateCategoryConfigs = (configs: CategoryConfig[]) => {
      setCategoryConfigs(configs);
      db.saveSetting('category_configs', configs);
  };
  const handleSaveLoyaltySettings = (settings: LoyaltySettings) => {
      setLoyaltySettings(settings);
      db.saveSetting('loyalty_settings', settings);
  };
  
  const handleFactoryReset = async () => {
      await db.deleteAllData();
      window.location.reload();
  };

  // --- ADMIN HANDLERS ---
  const handleAddUser = (user: Omit<User, 'id'>) => {
      const newUser = { ...user, id: generateId('user') };
      setUsers(prev => [...prev, newUser]);
      db.insert('users', newUser);
  };
  const handleUpdateUser = (user: User) => {
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      db.upsert('users', user);
  };
  const handleDeleteUser = (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id));
      db.delete('users', id);
  };
  
  const handleAddRole = (role: Omit<Role, 'id'>) => {
      const newRole = { ...role, id: generateId('role') };
      setRoles(prev => [...prev, newRole]);
      db.insert('roles', newRole);
  };
  const handleUpdateRole = (role: Role) => {
      setRoles(prev => prev.map(r => r.id === role.id ? role : r));
      db.upsert('roles', role);
  };
  const handleDeleteRole = (id: string) => {
      setRoles(prev => prev.filter(r => r.id !== id));
      db.delete('roles', id);
  };

  const handleAddSede = (sede: Omit<Sede, 'id'>) => {
      const newSede = { ...sede, id: generateId('sede') };
      setSedes(prev => [...prev, newSede]);
      db.insert('sedes', newSede);
  }
  const handleUpdateSede = (sede: Sede) => {
      setSedes(prev => prev.map(s => s.id === sede.id ? sede : s));
      db.upsert('sedes', sede);
  }
  const handleDeleteSede = (id: string) => {
      setSedes(prev => prev.filter(s => s.id !== id));
      db.delete('sedes', id);
  }

  // --- EXPENSE HANDLERS ---
  const handleAddExpense = async (expense: Omit<Expense, 'id'>, imageFile?: File) => {
      let imageUrl = undefined;
      if (imageFile) {
          const url = await db.uploadReceiptImage(imageFile);
          if (url) imageUrl = url;
      }
      const newExpense = { ...expense, id: generateId('exp'), imageUrl, sedeId: selectedSedeId };
      setExpenses(prev => [...prev, newExpense]);
      db.insert('expenses', newExpense);
  };
  const handleUpdateExpense = async (expense: Expense, imageFile?: File, removeImage?: boolean) => {
      let imageUrl = expense.imageUrl;
      
      if (removeImage && expense.imageUrl) {
          await db.deleteReceiptImage(expense.imageUrl);
          imageUrl = undefined;
      }
      
      if (imageFile) {
          const url = await db.uploadReceiptImage(imageFile);
          if (url) imageUrl = url;
      }

      const updatedExpense = { ...expense, imageUrl };
      setExpenses(prev => prev.map(e => e.id === expense.id ? updatedExpense : e));
      db.upsert('expenses', updatedExpense);
  };
  const handleDeleteExpense = (id: string) => {
      const expense = expenses.find(e => e.id === id);
      if (expense?.imageUrl) {
          db.deleteReceiptImage(expense.imageUrl);
      }
      setExpenses(prev => prev.filter(e => e.id !== id));
      db.delete('expenses', id);
  };
  const handleSaveExpenseCategories = (categories: string[]) => {
      setExpenseCategories(categories);
      db.saveSetting('expense_categories', categories);
  };

  const handleImportData = (type: 'menu' | 'inventory', data: any[]) => {
      if (type === 'menu') {
          const newItems = data.map(item => ({
              ...item,
              id: generateId('menu'),
              sedeId: selectedSedeId === 'global' ? null : selectedSedeId
          }));
          setMenuItems(prev => [...prev, ...newItems]);
          db.bulkUpsert('menu_items', newItems);
      } else {
          const newItems = data.map(item => ({
              ...item,
              id: generateId('inv'),
              sedeId: selectedSedeId
          }));
          setInventory(prev => [...prev, ...newItems]);
          db.bulkUpsert('inventory', newItems);
      }
  };

  // --- PROFE LOCO ACTION HANDLER ---
  const handleProfeLocoAction = async (action: ProfeLocoAction): Promise<string> => {
      switch(action.name) {
          case 'addExpense':
              handleAddExpense({
                  description: action.args.description,
                  amount: action.args.amount,
                  category: action.args.category,
                  date: new Date().toISOString(),
                  sedeId: selectedSedeId
              });
              return `Gasto de ${formatPrice(action.args.amount)} registrado en ${action.args.category}.`;
          
          case 'addInventoryItem':
              handleAddInventoryItem({
                  name: action.args.name,
                  stock: action.args.stock,
                  unit: action.args.unit,
                  cost: action.args.cost,
                  alertThreshold: action.args.alertThreshold,
                  sedeId: selectedSedeId
              });
              return `Producto ${action.args.name} añadido al inventario.`;
          
          case 'navigateToView':
              setCurrentView(action.args.view as View);
              return `Navegando a ${action.args.view}...`;
          
          case 'getQuickStats':
              const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
              const total = todaySales.reduce((acc, s) => acc + s.total, 0);
              return `Hoy llevamos ${todaySales.length} ventas por un total de ${formatPrice(total)}.`;
              
          default:
              return "Acción no reconocida.";
      }
  };

  // --- PERMISSIONS CHECK ---
  const currentUserRole = roles.find(r => r.id === currentUser?.roleId);
  const userPermissions = currentUserRole?.permissions || [];
  const isAdmin = currentUserRole?.isSystem || false;

  const checkPermission = (permission: any) => {
      if (isAdmin) return true;
      return userPermissions.includes(permission);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-[var(--black-bg)] flex items-center justify-center">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
                  <p className="text-white font-bangers text-xl tracking-wide">Cargando Sistema...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} settings={printerSettings} />;
  }

  // Filter Data based on Sede (except for Admin Global View)
  const filteredOrders = selectedSedeId === 'global' ? orders : orders.filter(o => o.sedeId === selectedSedeId);
  const filteredSales = selectedSedeId === 'global' ? sales : sales.filter(s => s.sedeId === selectedSedeId);
  const filteredInventory = selectedSedeId === 'global' ? inventory : inventory.filter(i => i.sedeId === selectedSedeId);
  const filteredCustomers = selectedSedeId === 'global' ? customers : customers.filter(c => c.sedeId === selectedSedeId);
  const filteredExpensesData = selectedSedeId === 'global' ? expenses : expenses.filter(e => e.sedeId === selectedSedeId);
  // Menu items: Show Master (null) + Sede Specific
  const filteredMenu = selectedSedeId === 'global' 
    ? menuItems 
    : menuItems.filter(i => i.sedeId === null || i.sedeId === selectedSedeId);
  const filteredTables = selectedSedeId === 'global' ? tables : tables.filter(t => t.sedeId === selectedSedeId);
  const filteredZones = selectedSedeId === 'global' ? zones : zones.filter(z => z.sedeId === selectedSedeId);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--black-bg)] text-white font-sans">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[var(--card-bg)] transform transition-transform duration-300 ease-in-out z-40 md:relative md:translate-x-0 border-r border-[var(--card-border)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            closeSidebar={() => setSidebarOpen(false)}
            permissions={userPermissions}
            onLogout={handleLogout}
            userName={currentUser.name}
            roleName={currentUserRole?.name || 'Usuario'}
            isOnline={isOnline}
            settings={printerSettings}
            isAdmin={isAdmin}
            sedes={sedes}
            selectedSedeId={selectedSedeId}
            setSelectedSedeId={setSelectedSedeId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-[var(--card-bg)] p-4 flex justify-between items-center border-b border-[var(--card-border)] z-20 shadow-md">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-2 rounded-lg hover:bg-white/10">
            <MenuIcon />
          </button>
          <h1 className="text-xl font-bangers tracking-wider text-white">{printerSettings.shopName}</h1>
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 relative">
            {currentView === 'DASHBOARD' && checkPermission('VIEW_DASHBOARD') && (
                <Dashboard 
                    sales={filteredSales} 
                    menuItems={filteredMenu} 
                    tables={filteredTables} 
                    users={users} 
                    currentUser={currentUser}
                    sedes={sedes}
                    selectedSedeId={selectedSedeId}
                />
            )}
            {currentView === 'POS' && checkPermission('POS_ACCESS') && (
                <POS 
                    menuItems={filteredMenu} 
                    tables={filteredTables} 
                    zones={filteredZones}
                    orders={filteredOrders} 
                    createOrder={handleCreateOrder}
                    completeSale={handleCompleteSale}
                    printerSettings={printerSettings}
                    currentUser={currentUser}
                    initialTableId={selectedTableIdForPos}
                    clearInitialTable={() => setSelectedTableIdForPos(null)}
                    categoryConfigs={categoryConfigs}
                    selectedSedeId={selectedSedeId}
                />
            )}
            {currentView === 'KITCHEN' && checkPermission('KITCHEN_MONITOR') && (
                <KitchenMonitor 
                    orders={filteredOrders} 
                    updateOrderStatus={handleUpdateOrderStatus} 
                    tables={filteredTables} 
                    sales={filteredSales}
                    inventory={filteredInventory}
                    printerSettings={printerSettings}
                    sedes={sedes}
                    selectedSedeId={selectedSedeId}
                />
            )}
            {currentView === 'MENU' && checkPermission('MANAGE_MENU') && (
                <MenuManager 
                    menuItems={filteredMenu} 
                    addMenuItem={handleAddMenuItem} 
                    updateMenuItem={handleUpdateMenuItem} 
                    deleteMenuItem={handleDeleteMenuItem} 
                    inventoryItems={filteredInventory}
                    categoryConfigs={categoryConfigs}
                    updateCategoryConfigs={handleUpdateCategoryConfigs}
                    selectedSedeId={selectedSedeId}
                />
            )}
            {currentView === 'TABLES' && checkPermission('MANAGE_TABLES') && (
                <TableManager 
                    tables={filteredTables} 
                    zones={filteredZones}
                    addTable={handleAddTable} 
                    updateTable={handleUpdateTable} 
                    deleteTable={handleDeleteTable}
                    updateTableStatus={handleUpdateTableStatus}
                    addZone={handleAddZone}
                    updateZone={handleUpdateZone}
                    deleteZone={handleDeleteZone}
                    onOpenTableInPOS={(tableId) => {
                        setSelectedTableIdForPos(tableId);
                        setCurrentView('POS');
                    }}
                    selectedSedeId={selectedSedeId}
                />
            )}
            {currentView === 'INVENTORY' && checkPermission('MANAGE_INVENTORY') && (
                <InventoryManager 
                    inventoryItems={filteredInventory} 
                    addInventoryItem={handleAddInventoryItem} 
                    updateInventoryItem={handleUpdateInventoryItem}
                    adjustStock={handleAdjustStock}
                />
            )}
            {currentView === 'SHOPPING' && checkPermission('MANAGE_SHOPPING_LIST') && (
                <ShoppingManager 
                    inventoryItems={filteredInventory}
                    sales={filteredSales}
                    menuItems={filteredMenu}
                />
            )}
            {currentView === 'REPORTS' && checkPermission('VIEW_REPORTS') && (
                <Reports sales={filteredSales} />
            )}
            {currentView === 'DELIVERY_MANAGER' && checkPermission('DELIVERY_MANAGER') && (
                <DeliveryManager 
                    orders={filteredOrders} 
                    updateOrderDeliveryStatus={handleUpdateOrderDeliveryStatus}
                    printerSettings={printerSettings}
                    deliveryRates={deliveryRates}
                    saveDeliveryRate={handleSaveDeliveryRate}
                    deleteDeliveryRate={handleDeleteDeliveryRate}
                />
            )}
            {currentView === 'WHATSAPP' && checkPermission('DELIVERY_MANAGER') && (
                <WhatsAppManager orders={filteredOrders} printerSettings={printerSettings} />
            )}
            {currentView === 'CLIENTS' && checkPermission('MANAGE_CLIENTS') && (
                <ClientManager 
                    customers={filteredCustomers}
                    sales={filteredSales}
                    addCustomer={handleAddCustomer}
                    updateCustomer={handleUpdateCustomer}
                    deleteCustomer={handleDeleteCustomer}
                    loyaltySettings={loyaltySettings}
                />
            )}
            {currentView === 'LOYALTY' && checkPermission('MANAGE_LOYALTY') && (
                <LoyaltyManager 
                    settings={loyaltySettings}
                    onSave={handleSaveLoyaltySettings}
                    menuItems={filteredMenu}
                />
            )}
            {currentView === 'EXPENSES' && checkPermission('MANAGE_EXPENSES') && (
                <ExpensesManager 
                    expenses={filteredExpensesData}
                    addExpense={handleAddExpense}
                    updateExpense={handleUpdateExpense}
                    deleteExpense={handleDeleteExpense}
                    categories={expenseCategories}
                    saveCategories={handleSaveExpenseCategories}
                />
            )}
            {currentView === 'MARKETING' && checkPermission('MANAGE_MARKETING') && (
                <MarketingManager customers={filteredCustomers} />
            )}
            {currentView === 'QR_MANAGER' && checkPermission('MANAGE_QR') && (
                <QrManager settings={printerSettings} onSaveSettings={handleSavePrinterSettings} />
            )}
            {currentView === 'SETTINGS' && checkPermission('MANAGE_SETTINGS') && (
                <AdminSettings 
                    users={users}
                    roles={roles}
                    sedes={sedes}
                    addUser={handleAddUser}
                    updateUser={handleUpdateUser}
                    deleteUser={handleDeleteUser}
                    addRole={handleAddRole}
                    updateRole={handleUpdateRole}
                    deleteRole={handleDeleteRole}
                    addSede={handleAddSede}
                    updateSede={handleUpdateSede}
                    deleteSede={handleDeleteSede}
                    printerSettings={printerSettings}
                    savePrinterSettings={handleSavePrinterSettings}
                    onFactoryReset={handleFactoryReset}
                    onImportData={handleImportData}
                    selectedSedeId={selectedSedeId}
                />
            )}
            {currentView === 'MANUAL' && <UserManual />}
        </main>

        {/* Global Components */}
        <button 
            onClick={() => setChatbotOpen(true)} 
            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white p-4 rounded-full shadow-2xl z-50 transition-transform hover:scale-110 border-2 border-white/20 animate-pulse-slow"
            title="Asistente IA"
        >
            <BrainCircuitIcon className="w-8 h-8" />
        </button>
        
        <Chatbot 
            isOpen={isChatbotOpen} 
            onClose={() => setChatbotOpen(false)} 
            onExecuteAction={handleProfeLocoAction}
        />
      </div>
    </div>
  );
};

export default App;
