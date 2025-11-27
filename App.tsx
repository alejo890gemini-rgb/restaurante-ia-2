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
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        // Robust validation to prevent crash if stored data is corrupted or old format
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.name) {
            return parsed;
        }
        return null;
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
        ['*'], 
        (payload) => {
            fetchData(); 
        }
    );

    return () => {
        subscription?.unsubscribe();
    };
  }, [fetchData]);

  useEffect(() => {
      if (currentUser && currentUser.sedeId) {
          setSelectedSedeId(currentUser.sedeId);
      }
  }, [currentUser]);

  // -- HANDLERS --

  const handleLogin = async (u: string, p: string) => {
    try {
        const user = await db.login(u, p);
        if (user && user.id && user.name) {
            setCurrentUser(user);
            localStorage.setItem('loco_session', JSON.stringify(user));
            setLoginError('');
            setSelectedSedeId(user.sedeId || 'sede-principal');
            return true;
        } else {
            setLoginError('Credenciales inválidas');
            return false;
        }
    } catch (e) {
        console.error("Login error", e);
        setLoginError('Error al iniciar sesión');
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
      const newTable: Table = { ...table, id: generateId('table'), status: 'available', sedeId: selectedSedeId };
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
      const newZone = { ...zone, id: generateId('zone'), sedeId: selectedSedeId };
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
              readyAt: status === 'ready' ? new Date().toISOString() : order.readyAt,
          };
          
          if (status === 'completed' && order.tableId) {
               handleUpdateTableStatus(order.tableId, 'available');
          }
          
          const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
          setOrders(updatedOrders);
          db.upsert('orders', updatedOrder);
      }
  };

  const handleUpdateDeliveryStatus = (orderId: string, status: DeliveryStatus, driverName?: string) => {
      const order = orders.find(o => o.id === orderId);
      if (order && order.deliveryInfo) {
          const updatedInfo = { ...order.deliveryInfo, deliveryStatus: status };
          if(driverName) updatedInfo.driverName = driverName;
          
          // Timestamp logic for analytics
          const now = new Date().toISOString();
          if(status === 'kitchen') updatedInfo.confirmedAt = now;
          if(status === 'ready') updatedInfo.readyAt = now;
          if(status === 'on-way') updatedInfo.dispatchedAt = now;
          if(status === 'delivered') updatedInfo.deliveredAt = now;

          const updatedOrder = { ...order, deliveryInfo: updatedInfo, status: status === 'delivered' ? 'completed' : order.status };
          const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
          setOrders(updatedOrders);
          db.upsert('orders', updatedOrder);
      }
  };

  // --- PAYMENT & SALES ---
  const handleCompleteSale = (order: Order, paymentMethod: PaymentMethod) => {
      // 1. Create Sale Record
      const newSale: Sale = {
          id: generateId('sale'),
          order: order,
          total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (order.deliveryInfo?.deliveryCost || 0),
          timestamp: new Date().toISOString(),
          paymentMethod,
          sedeId: order.sedeId,
      };
      setSales(prev => [...prev, newSale]);
      db.insert('sales', newSale);

      // 2. Update Order Status
      handleUpdateOrderStatus(order.id, 'completed');
      if (order.tableId) {
          handleUpdateTableStatus(order.tableId, 'available');
      }

      // 3. Update Inventory
      const newInventory = [...inventory];
      let inventoryChanged = false;

      order.items.forEach(orderItem => {
          if (orderItem.recipe && orderItem.recipe.length > 0) {
              orderItem.recipe.forEach(ingredient => {
                  const invItemIndex = newInventory.findIndex(i => i.id === ingredient.inventoryItemId);
                  if (invItemIndex >= 0) {
                      newInventory[invItemIndex].stock -= (ingredient.quantity * orderItem.quantity);
                      inventoryChanged = true;
                      // Trigger low stock alert if needed (UI handled in Inventory Manager)
                  }
              });
          }
      });

      if (inventoryChanged) {
          setInventory(newInventory);
          // Batch update would be better, but loop works for now
          newInventory.forEach(item => db.upsert('inventory', item)); 
      }
      
      // 4. Update Customer (CRM) if applicable
      const customerName = order.deliveryInfo?.name || order.toGoName;
      const customerPhone = order.deliveryInfo?.phone || order.toGoPhone;
      
      if (customerName && customerPhone) {
          const existingCustomer = customers.find(c => c.phone === customerPhone);
          const saleTotal = newSale.total;
          
          if (existingCustomer) {
              const updatedCustomer = {
                  ...existingCustomer,
                  totalSpent: existingCustomer.totalSpent + saleTotal,
                  visitCount: existingCustomer.visitCount + 1,
                  lastVisit: new Date().toISOString(),
                  // Loyalty Logic
                  loyaltyPoints: loyaltySettings.isEnabled 
                    ? (existingCustomer.loyaltyPoints || 0) + Math.floor(saleTotal * loyaltySettings.pointsPerPeso)
                    : existingCustomer.loyaltyPoints
              };
              // Check for tier upgrade
              if (loyaltySettings.isEnabled) {
                  const qualifiedTier = [...loyaltySettings.tiers]
                    .reverse()
                    .find(t => (updatedCustomer.loyaltyPoints || 0) >= t.minPoints);
                  if (qualifiedTier && qualifiedTier.id !== updatedCustomer.loyaltyTierId) {
                      updatedCustomer.loyaltyTierId = qualifiedTier.id;
                      addToast(`¡Cliente subió a nivel ${qualifiedTier.name}!`, 'success');
                  }
              }
              
              setCustomers(prev => prev.map(c => c.id === existingCustomer.id ? updatedCustomer : c));
              db.upsert('customers', updatedCustomer);
          } else {
              const newCustomer: Customer = {
                  id: generateId('cust'),
                  name: customerName,
                  phone: customerPhone,
                  totalSpent: saleTotal,
                  visitCount: 1,
                  lastVisit: new Date().toISOString(),
                  loyaltyPoints: loyaltySettings.isEnabled ? Math.floor(saleTotal * loyaltySettings.pointsPerPeso) : 0,
                  loyaltyTierId: loyaltySettings.tiers.length > 0 ? loyaltySettings.tiers[0].id : undefined,
                  sedeId: order.sedeId,
              };
              setCustomers(prev => [...prev, newCustomer]);
              db.insert('customers', newCustomer);
          }
      }

      addToast(`Venta registrada: ${formatPrice(newSale.total)}`, 'success');
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
  const handleStockAdjust = (itemId: string, newStock: number) => {
      const item = inventory.find(i => i.id === itemId);
      if (item) {
          const updated = { ...item, stock: newStock };
          handleUpdateInventoryItem(updated);
          addToast(`Stock de ${item.name} actualizado`, 'info');
      }
  }

  // --- SETTINGS HANDLERS ---
  const handleSavePrinterSettings = (settings: PrinterSettings) => {
      setPrinterSettings(settings);
      db.saveSetting('printer_settings', settings);
  };
  const handleUpdateCategoryConfigs = (configs: CategoryConfig[]) => {
      setCategoryConfigs(configs);
      db.saveSetting('category_configs', configs);
  }
  const handleSaveDeliveryRate = (rate: Omit<DeliveryRate, 'id'>) => {
      const newRate = { ...rate, id: generateId('rate'), sedeId: selectedSedeId };
      setDeliveryRates(prev => [...prev, newRate]);
      db.insert('delivery_rates', newRate);
  }
  const handleDeleteDeliveryRate = (id: string) => {
      setDeliveryRates(prev => prev.filter(r => r.id !== id));
      db.delete('delivery_rates', id);
  }
  
  // --- USER & ROLE HANDLERS ---
  const handleAddUser = (user: Omit<User, 'id'>) => {
      const newUser = { ...user, id: generateId('user') };
      setUsers(prev => [...prev, newUser]);
      db.insert('users', newUser);
      addToast('Usuario creado', 'success');
  }
  const handleUpdateUser = (user: User) => {
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      db.upsert('users', user);
      addToast('Usuario actualizado', 'success');
  }
  const handleDeleteUser = (id: string) => {
      if (users.length <= 1) { addToast('No puedes eliminar al último usuario', 'error'); return; }
      setUsers(prev => prev.filter(u => u.id !== id));
      db.delete('users', id);
      addToast('Usuario eliminado', 'success');
  }
  const handleAddRole = (role: Omit<Role, 'id'>) => {
      const newRole = { ...role, id: generateId('role') };
      setRoles(prev => [...prev, newRole]);
      db.insert('roles', newRole);
  }
  const handleUpdateRole = (role: Role) => {
      setRoles(prev => prev.map(r => r.id === role.id ? role : r));
      db.upsert('roles', role);
  }
  const handleDeleteRole = (id: string) => {
      if (users.some(u => u.roleId === id)) { addToast('Hay usuarios con este rol. Reasigna primero.', 'error'); return; }
      setRoles(prev => prev.filter(r => r.id !== id));
      db.delete('roles', id);
  }

  // --- CLIENT HANDLERS ---
  const handleAddCustomer = (customer: Omit<Customer, 'id' | 'totalSpent' | 'visitCount' | 'lastVisit'>) => {
      const newCustomer: Customer = {
          ...customer,
          id: generateId('cust'),
          totalSpent: 0,
          visitCount: 0,
          lastVisit: '',
          sedeId: selectedSedeId,
      };
      setCustomers(prev => [...prev, newCustomer]);
      db.insert('customers', newCustomer);
      addToast('Cliente añadido', 'success');
  }
  const handleUpdateCustomer = (customer: Customer) => {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      db.upsert('customers', customer);
      addToast('Cliente actualizado', 'success');
  }
  const handleDeleteCustomer = (id: string) => {
      setCustomers(prev => prev.filter(c => c.id !== id));
      db.delete('customers', id);
      addToast('Cliente eliminado', 'success');
  }
  const handleSaveLoyaltySettings = (settings: LoyaltySettings) => {
      setLoyaltySettings(settings);
      db.saveSetting('loyalty_settings', settings);
      addToast('Configuración de fidelización guardada', 'success');
  }

  // --- EXPENSE HANDLERS ---
  const handleAddExpense = (expense: Omit<Expense, 'id'>, imageFile?: File) => {
      const id = generateId('exp');
      let imageUrl = '';
      
      const saveExpense = (url: string = '') => {
          const newExpense = { ...expense, id, imageUrl: url, sedeId: selectedSedeId };
          setExpenses(prev => [...prev, newExpense]);
          db.insert('expenses', newExpense);
      };

      if (imageFile) {
          db.uploadReceiptImage(imageFile).then(url => {
              if(url) saveExpense(url);
              else {
                  addToast('Error subiendo imagen, guardando sin recibo', 'error');
                  saveExpense();
              }
          });
      } else {
          saveExpense();
      }
  }
  
  const handleUpdateExpense = (expense: Expense, imageFile?: File, removeImage?: boolean) => {
      const updateDb = (updatedExpense: Expense) => {
          setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
          db.upsert('expenses', updatedExpense);
      }

      if (removeImage && expense.imageUrl) {
          db.deleteReceiptImage(expense.imageUrl);
          updateDb({ ...expense, imageUrl: undefined });
      } else if (imageFile) {
          if (expense.imageUrl) db.deleteReceiptImage(expense.imageUrl);
          db.uploadReceiptImage(imageFile).then(url => {
              if (url) updateDb({ ...expense, imageUrl: url });
              else addToast('Error actualizando imagen', 'error');
          });
      } else {
          updateDb(expense);
      }
  }

  const handleDeleteExpense = (id: string) => {
      const expense = expenses.find(e => e.id === id);
      if (expense?.imageUrl) {
          db.deleteReceiptImage(expense.imageUrl);
      }
      setExpenses(prev => prev.filter(e => e.id !== id));
      db.delete('expenses', id);
  }
  
  const handleSaveExpenseCategories = (cats: string[]) => {
      setExpenseCategories(cats);
      db.saveSetting('expense_categories', cats);
  }

  // --- ADMIN HANDLERS ---
  const handleFactoryReset = async () => {
      await db.deleteAllData();
      await db.forceSeedUsers(); // Re-create admin
      window.location.reload();
  };

  const handleImportData = (type: 'menu' | 'inventory', data: any[]) => {
      if (type === 'menu') {
          const newItems = data.map(d => ({ ...d, id: generateId('menu') }));
          setMenuItems(prev => [...prev, ...newItems]);
          db.bulkUpsert('menu_items', newItems);
      } else {
          const newItems = data.map(d => ({ ...d, id: generateId('inv'), sedeId: selectedSedeId }));
          setInventory(prev => [...prev, ...newItems]);
          db.bulkUpsert('inventory', newItems);
      }
  };

  // --- SEDE HANDLERS ---
  const handleAddSede = (sede: Omit<Sede, 'id'>) => {
      const newSede = { ...sede, id: generateId('sede') };
      setSedes(prev => [...prev, newSede]);
      db.insert('sedes', newSede);
  };
  const handleUpdateSede = (sede: Sede) => {
      setSedes(prev => prev.map(s => s.id === sede.id ? sede : s));
      db.upsert('sedes', sede);
  };
  const handleDeleteSede = (id: string) => {
      setSedes(prev => prev.filter(s => s.id !== id));
      db.delete('sedes', id);
  };

  // --- RENDER HELPERS ---
  const getFilteredData = () => {
      if (selectedSedeId === 'global') {
          // Global admin sees all, but specific views might be aggregated
          return {
              orders, sales, inventory, customers, tables, zones, deliveryRates, expenses, menuItems
          };
      }
      return {
          orders: orders.filter(o => o.sedeId === selectedSedeId),
          sales: sales.filter(s => s.sedeId === selectedSedeId),
          inventory: inventory.filter(i => i.sedeId === selectedSedeId),
          customers: customers.filter(c => c.sedeId === selectedSedeId),
          tables: tables.filter(t => t.sedeId === selectedSedeId),
          zones: zones.filter(z => z.sedeId === selectedSedeId),
          deliveryRates: deliveryRates.filter(r => r.sedeId === selectedSedeId),
          expenses: expenses.filter(e => e.sedeId === selectedSedeId),
          menuItems: menuItems.filter(m => m.sedeId === null || m.sedeId === selectedSedeId), // Global items + Sede items
      };
  };

  const filteredData = getFilteredData();

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-screen bg-[var(--black-bg)]">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
                  <p className="text-white font-bangers tracking-wider text-xl">Cargando Sistema...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} settings={printerSettings} />;
  }

  const role = roles.find(r => r.id === currentUser.roleId);
  const permissions = role?.permissions || [];
  const isAdmin = role?.id === 'role-admin';

  // --- AI ACTION HANDLER ---
  const handleProfeLocoAction = async (action: ProfeLocoAction): Promise<string> => {
      if (action.name === 'addExpense') {
          const { description, amount, category } = action.args;
          handleAddExpense({ description, amount, category, date: new Date().toISOString(), sedeId: selectedSedeId });
          return `Listo, jefe. He registrado el gasto: "${description}" por ${formatPrice(amount)}. 📉`;
      }
      if (action.name === 'addInventoryItem') {
          const { name, stock, unit, cost, alertThreshold } = action.args;
          handleAddInventoryItem({ name, stock, unit, cost, alertThreshold: alertThreshold || 5, sedeId: selectedSedeId });
          return `¡Oído cocina! Ingrediente "${name}" añadido al inventario. 🥕`;
      }
      if (action.name === 'navigateToView') {
          const view = action.args.view as View;
          setCurrentView(view);
          return `Navegando a ${view}... ¡Vámonos! 🚀`;
      }
      if (action.name === 'getQuickStats') {
          const today = new Date().toDateString();
          const todaySales = filteredData.sales.filter(s => new Date(s.timestamp).toDateString() === today);
          const total = todaySales.reduce((sum, s) => sum + s.total, 0);
          return `📊 Reporte Flash:\nHoy llevamos ${todaySales.length} ventas.\nTotal: ${formatPrice(total)}.\n¡A seguir vendiendo! 🔥`;
      }
      return "No sé cómo hacer eso todavía, ¡pero aprendo rápido!";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--black-bg)] text-white font-sans selection:bg-red-900 selection:text-white">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-[var(--card-bg)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-[var(--card-border)]`}>
        <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            closeSidebar={() => setSidebarOpen(false)} 
            permissions={permissions}
            onLogout={handleLogout}
            userName={currentUser.name}
            roleName={role?.name || 'Usuario'}
            isOnline={isOnline}
            settings={printerSettings}
            isAdmin={isAdmin}
            sedes={sedes}
            selectedSedeId={selectedSedeId}
            setSelectedSedeId={setSelectedSedeId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[var(--card-bg)] border-b border-[var(--card-border)]">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-300 hover:text-white">
            <MenuIcon />
          </button>
          <h1 className="text-xl font-bangers tracking-wider">{printerSettings.shopName}</h1>
          <div className="w-6"></div> {/* Spacer */}
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 relative">
          {currentView === 'DASHBOARD' && <Dashboard sales={filteredData.sales} menuItems={filteredData.menuItems} tables={filteredData.tables} users={users} currentUser={currentUser} sedes={sedes} selectedSedeId={selectedSedeId}/>}
          {currentView === 'POS' && <POS menuItems={filteredData.menuItems} tables={filteredData.tables} zones={filteredData.zones} orders={filteredData.orders} createOrder={handleCreateOrder} completeSale={handleCompleteSale} printerSettings={printerSettings} currentUser={currentUser} initialTableId={selectedTableIdForPos} clearInitialTable={() => setSelectedTableIdForPos(null)} categoryConfigs={categoryConfigs} selectedSedeId={selectedSedeId} />}
          {currentView === 'MENU' && <MenuManager menuItems={filteredData.menuItems} addMenuItem={handleAddMenuItem} updateMenuItem={handleUpdateMenuItem} deleteMenuItem={handleDeleteMenuItem} inventoryItems={filteredData.inventory} categoryConfigs={categoryConfigs} updateCategoryConfigs={handleUpdateCategoryConfigs} selectedSedeId={selectedSedeId} />}
          {currentView === 'TABLES' && <TableManager tables={filteredData.tables} zones={filteredData.zones} addTable={handleAddTable} updateTable={handleUpdateTable} deleteTable={handleDeleteTable} updateTableStatus={handleUpdateTableStatus} addZone={handleAddZone} updateZone={handleUpdateZone} deleteZone={handleDeleteZone} onOpenTableInPOS={(id) => { setSelectedTableIdForPos(id); setCurrentView('POS'); }} selectedSedeId={selectedSedeId} />}
          {currentView === 'REPORTS' && <Reports sales={filteredData.sales} />}
          {currentView === 'WHATSAPP' && <WhatsAppManager orders={filteredData.orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')} printerSettings={printerSettings} />}
          {currentView === 'INVENTORY' && <InventoryManager inventoryItems={filteredData.inventory} addInventoryItem={handleAddInventoryItem} updateInventoryItem={handleUpdateInventoryItem} adjustStock={handleStockAdjust} />}
          {currentView === 'DELIVERY_MANAGER' && <DeliveryManager orders={filteredData.orders} updateOrderDeliveryStatus={handleUpdateDeliveryStatus} printerSettings={printerSettings} deliveryRates={filteredData.deliveryRates} saveDeliveryRate={handleSaveDeliveryRate} deleteDeliveryRate={handleDeleteDeliveryRate} />}
          {currentView === 'MANUAL' && <UserManual />}
          {currentView === 'CLIENTS' && <ClientManager customers={filteredData.customers} sales={filteredData.sales} addCustomer={handleAddCustomer} updateCustomer={handleUpdateCustomer} deleteCustomer={handleDeleteCustomer} loyaltySettings={loyaltySettings} />}
          {currentView === 'SHOPPING' && <ShoppingManager inventoryItems={filteredData.inventory} sales={filteredData.sales} menuItems={filteredData.menuItems} />}
          {currentView === 'LOYALTY' && <LoyaltyManager settings={loyaltySettings} onSave={handleSaveLoyaltySettings} menuItems={filteredData.menuItems} />}
          {currentView === 'KITCHEN' && <KitchenMonitor orders={filteredData.orders} updateOrderStatus={handleUpdateOrderStatus} tables={filteredData.tables} sales={filteredData.sales} inventory={filteredData.inventory} printerSettings={printerSettings} sedes={sedes} selectedSedeId={selectedSedeId} />}
          {currentView === 'EXPENSES' && <ExpensesManager expenses={filteredData.expenses} addExpense={handleAddExpense} updateExpense={handleUpdateExpense} deleteExpense={handleDeleteExpense} categories={expenseCategories} saveCategories={handleSaveExpenseCategories} />}
          {currentView === 'MARKETING' && <MarketingManager customers={filteredData.customers} />}
          {currentView === 'QR_MANAGER' && <QrManager settings={printerSettings} onSaveSettings={handleSavePrinterSettings} />}
          {currentView === 'SETTINGS' && (
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
          {currentView === 'SEDES' && (
              <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Gestión de Sedes movida a Configuración.</p>
              </div>
          )}
        </main>

        {/* Floating Chatbot Button */}
        <button 
            onClick={() => setChatbotOpen(true)}
            className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform z-40 border-2 border-white/20"
        >
            <BrainCircuitIcon className="w-8 h-8" />
        </button>

        {/* Chatbot Overlay */}
        {isChatbotOpen && <Chatbot isOpen={isChatbotOpen} onClose={() => setChatbotOpen(false)} onExecuteAction={handleProfeLocoAction} />}
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default App;