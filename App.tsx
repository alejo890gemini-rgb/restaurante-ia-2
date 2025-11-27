
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
              readyAt: status === 'ready' ? new Date().toISOString() : order.readyAt 
          