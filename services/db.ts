
import { supabase } from './supabaseClient';
import type { User } from '../types';
import { 
    INITIAL_USERS, 
    INITIAL_ROLES, 
    INITIAL_MENU_ITEMS, 
    INITIAL_TABLES, 
    INITIAL_ZONES, 
    INITIAL_INVENTORY_ITEMS,
    INITIAL_PRINTER_SETTINGS,
    INITIAL_CATEGORY_CONFIG,
    INITIAL_LOYALTY_SETTINGS,
    EXPENSE_CATEGORIES
} from '../constants';

// Helper to unwrap the 'data' column from the table structure
const unwrap = (rows: any[]) => {
    if (!rows) return [];
    return rows.map(r => r.data);
};

export const db = {
    // Generic Fetch - Returns NULL on error to distinguish from empty table
    getAll: async <T>(table: string): Promise<T[] | null> => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase.from(table).select('data');
            if (error) {
                console.error(`Error fetching ${table}:`, error);
                return null; 
            }
            return unwrap(data || []);
        } catch (e) {
            console.error(`Connection error fetching ${table}:`, e);
            return null;
        }
    },

    // Fetch Single by ID
    getById: async <T>(table: string, id: string): Promise<T | null> => {
        if (!supabase) return null;
        const { data, error } = await supabase.from(table).select('data').eq('id', id).single();
        if (error) return null;
        return data?.data || null;
    },
    
    // Simple insert
    insert: async (table: string, item: any) => {
        if (!supabase) return;
        const payload = { data: item };
        if (item.id) {
            payload['id'] = item.id;
        }
        const { error } = await supabase.from(table).insert(payload);
        if (error) console.error(`Error inserting to ${table}:`, error);
    },

    // Insert or Update
    upsert: async (table: string, item: { id: string } & any) => {
        if (!supabase) return;
        const payload = { id: item.id, data: item };
        const { error } = await supabase.from(table).upsert(payload);
        if (error) console.error(`Error upserting to ${table}:`, error);
    },

    // Delete
    delete: async (table: string, id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) console.error(`Error deleting from ${table}:`, error);
    },

    // Realtime Subscription - Enhanced for Stability
    subscribe: (tables: string[], callback: (payload: any) => void) => {
        if (!supabase) return null;
        
        // Clean up any existing channels with the same name to prevent duplicates
        const channelName = 'db-changes-sync';
        const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
        if (existing) {
            supabase.removeChannel(existing);
        }

        const channel = supabase.channel(channelName);
        
        // Listen to all changes on public schema
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public' }, 
            (payload) => {
                // Filter by relevant tables if needed, or just pass everything
                if (tables.includes(payload.table)) {
                    callback(payload);
                }
            }
        );

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                // console.log('🟢 Conectado a tiempo real');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('🔴 Error en conexión tiempo real. Reintentando...');
            } else if (status === 'TIMED_OUT') {
                console.error('🔴 Tiempo de espera agotado en conexión.');
            }
        });
        
        return {
            unsubscribe: () => {
                supabase.removeChannel(channel);
            }
        };
    },
    
    // --- SPECIFIC FUNCTIONS ---

    fetchAllTables: async () => {
        // OFFLINE MODE FALLBACK
        if (!supabase) {
             console.warn("Modo Offline: Cargando datos locales.");
             const loadLocal = (key: string, fallback: any) => {
                 try {
                     const stored = localStorage.getItem(`loco_offline_${key}`);
                     return stored ? JSON.parse(stored) : fallback;
                 } catch { return fallback; }
             };

             return { 
                 users: loadLocal('users', INITIAL_USERS), 
                 roles: loadLocal('roles', INITIAL_ROLES), 
                 menu_items: loadLocal('menu_items', INITIAL_MENU_ITEMS), 
                 tables: loadLocal('tables', INITIAL_TABLES), 
                 zones: loadLocal('zones', INITIAL_ZONES), 
                 inventory: loadLocal('inventory', INITIAL_INVENTORY_ITEMS), 
                 orders: loadLocal('orders', []), 
                 sales: loadLocal('sales', []), 
                 customers: loadLocal('customers', []), 
                 expenses: loadLocal('expenses', []), 
                 delivery_rates: loadLocal('delivery_rates', []), 
                 settings: {
                     printer_settings: loadLocal('printer_settings', INITIAL_PRINTER_SETTINGS),
                     category_configs: loadLocal('category_configs', INITIAL_CATEGORY_CONFIG),
                     loyalty_settings: loadLocal('loyalty_settings', INITIAL_LOYALTY_SETTINGS),
                     expense_categories: loadLocal('expense_categories', EXPENSE_CATEGORIES)
                 } 
            };
        }

        // ONLINE FETCH
        const [
            users, roles, menu_items, tables, zones, inventory, orders, sales, customers, expenses, delivery_rates
        ] = await Promise.all([
            db.getAll('users'),
            db.getAll('roles'),
            db.getAll('menu_items'),
            db.getAll('tables'),
            db.getAll('zones'),
            db.getAll('inventory'),
            db.getAll('orders'),
            db.getAll('sales'),
            db.getAll('customers'),
            db.getAll('expenses'),
            db.getAll('delivery_rates')
        ]);

        // If any critical fetch returned null (error), throw to trigger offline mode or retry
        if (users === null || roles === null) {
            throw new Error("Error de conexión con la base de datos");
        }

        const { data: settingsData, error } = await supabase.from('settings').select('*');
        const settings: Record<string, any> = {};
        if (!error && settingsData) {
            settingsData.forEach(s => { settings[s.key] = s.value; });
        }

        return { 
            users: users || [], 
            roles: roles || [], 
            menu_items: menu_items || [], 
            tables: tables || [], 
            zones: zones || [], 
            inventory: inventory || [], 
            orders: orders || [], 
            sales: sales || [], 
            customers: customers || [], 
            expenses: expenses || [], 
            delivery_rates: delivery_rates || [], 
            settings 
        };
    },
    
    seedTable: async (table: string, items: any[]) => {
        if (!supabase) return;
        
        // Safety check: Only seed if truly empty to avoid wiping data in multi-user
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        
        if (count === 0) {
            console.log(`🌱 Sembrando datos iniciales para ${table}...`);
            const payload = items.map(item => ({ id: item.id, data: item }));
            const { error: insertError } = await supabase.from(table).insert(payload);
            if (insertError) console.error(`Error seeding ${table}:`, insertError);
        }
    },
    
    saveSetting: async (key: string, value: any) => {
        if (!supabase) {
            localStorage.setItem(`loco_offline_${key}`, JSON.stringify(value));
            return;
        }
        const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
        if (error) console.error(`Error saving setting ${key}:`, error);
    },

    login: async (username: string, pass: string): Promise<User | null> => {
        // 1. Backdoor de emergencia
        if (username === 'master' && pass === 'admin123') {
            return {
                id: 'master-user',
                username: 'master',
                name: 'Soporte Técnico',
                password: '',
                roleId: 'role-admin'
            } as User;
        }

        // 2. Modo Offline / Fallback Local
        if (!supabase) {
            const localUsers = JSON.parse(localStorage.getItem('loco_offline_users') || JSON.stringify(INITIAL_USERS));
            const localUser = localUsers.find((u: User) => u.username === username && u.password === pass);
            return localUser || null;
        }

        // 3. Autenticación Real con Supabase
        const { data, error } = await supabase
            .from('users')
            .select('data')
            .eq('data->>username', username)
            .eq('data->>password', pass)
            .single();
        
        if (error || !data) {
            // Fallback: Si es la primera vez y no hay usuarios, permitir admin por defecto
            const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
            if (count === 0) {
                 const localUser = INITIAL_USERS.find(u => u.username === username && u.password === pass);
                 if (localUser) return localUser;
            }
            return null;
        }
        return data.data as User;
    },

    logout: async (): Promise<void> => {
        return Promise.resolve();
    },
    
    updateFields: async (table: string, id: string, fields: Partial<any>) => {
        if (!supabase) return;

        // Optimistic approach for speed in multi-user: 
        // fetch current -> merge -> update. 
        // Note: In high concurrency, this could have race conditions, but for POS status updates it's generally acceptable.
        const { data: current, error: fetchError } = await supabase.from(table).select('data').eq('id', id).single();
        if (fetchError || !current) {
            console.error(`Error fetching for update on ${table} with id ${id}:`, fetchError);
            return;
        }
        
        const updatedData = { ...current.data, ...fields };
        const { error } = await supabase.from(table).update({ data: updatedData }).eq('id', id);
        if (error) console.error(`Error updating fields on ${table}:`, error);
    },
    
    updateField: async (table: string, id: string, field: string, value: any) => {
        if (!supabase) return;
        await db.updateFields(table, id, { [field]: value });
    },
    
    deleteAllData: async () => {
        if (!supabase) {
            localStorage.clear();
            return;
        }
        const tablesToDelete = ['users', 'roles', 'menu_items', 'tables', 'zones', 'inventory', 'orders', 'sales', 'customers', 'expenses', 'delivery_rates', 'settings'];
        for (const table of tablesToDelete) {
            const { error } = await supabase.from(table).delete().neq('id', `placeholder-${Date.now()}`);
            if (error) console.error(`Error deleting all data from ${table}:`, error);
        }
    },

    forceSeedUsers: async () => {
        if (!supabase) return;
        const payload = INITIAL_USERS.map(u => ({ id: u.id, data: u }));
        await supabase.from('users').insert(payload);
        const rolesPayload = INITIAL_ROLES.map(r => ({ id: r.id, data: r }));
        await supabase.from('roles').insert(rolesPayload);
    }
};
