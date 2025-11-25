

import type { MenuItem, Sauce, Table, InventoryItem, Role, User, Permission, Zone, PrinterSettings, CategoryConfig, LoyaltyTier, LoyaltyReward, LoyaltySettings } from './types';

export const SALSAS_ALITAS: Sauce[] = [
    { name: "BBQ", key: "BBQ" },
    { name: "BBQ Picante", key: "BBQ_PICANTE" },
    { name: "Mora", key: "MORA" },
    { name: "Miel Mostaza", key: "MIEL_MOSTAZA" },
    { name: "Maracuyá", key: "MARACUYA" },
    { name: "Maracuyá Picante", key: "MARACUYA_PICANTE" },
    { name: "Miel Limón", key: "MIEL_LIMON" },
    { name: "Miel Limón Tajín", key: "MIEL_LIMON_TAJIN" },
];

export const SALSAS_PAPAS: Sauce[] = [
    { name: "Rosada de la Casa", key: "ROSADA" }, 
    { name: "Tomate", key: "TOMATE" },
    { name: "Piña", key: "PIÑA" },
    { name: "BBQ", key: "BBQ_ADICIONAL" },
];

const SABORES_BASICOS = ['Mora', 'Mango', 'Guanábana', 'Maracuyá', 'Lulo', 'Limonada Natural'];
        
export const SUBMENU_CHOICES: { [key: string]: string[] } = {
    'jugos_naturales': SABORES_BASICOS,
    'limonadas_esp': ['Coco', 'Cereza', 'Sandía', 'Coco Cereza', 'Coco Café', 'Hierbabuena'], 
    'micheladas': ['Águila Light', 'Águila Negra'], 
    'sodas': ['Maracuyá', 'Frutos Rojos'], 
    'cerveza': ['Águila Light', 'Águila Negra'],
    'gaseosas': ['Coca-Cola', 'Colombiana', 'Manzana', 'Uva', 'Soda'],
};

export const GELATO_FLAVORS = [
    'Chocolatina Jumbo', 'Cafe Crunch', 'Cheesecake Mora', 'Stracciatella', 
    'Snickers', 'Yogurt de Maracuya', 'Amarena', 'Limonada Coco', 'Coco Puro', 'Dulce de Leche'
];

const LOCO_ALITAS_CATEGORIZED_MENU = [
    {
        category: "💥 PROMOCIONES / COMBOS PARA COMPARTIR",
        items: [
            { id: 'dos_locos_sueltos', name: 'Dos Locos Sueltos', price: 50000, desc: 'Dos hamburguesas (Loca Burguer o Loca de Atar), 2 alitas, papas y dos limonadas naturales.', hasWings: true, hasFries: true },
            { id: 'bipolar_burritos', name: 'Bipolar de Burritos', price: 50000, desc: 'Dos burritos de carne desmechada (res o cerdo), 2 alitas, papas y dos limonadas naturales.', hasWings: true, hasFries: true },
            { id: 'aletoso', name: 'Aletoso', price: 50000, desc: '16 alitas, papas grandes y dos limonadas naturales.', hasWings: true, hasFries: true },
            { id: 'megaloco', name: 'Megaloco', price: 138000, desc: '30 alitas en salsa a tu gusto + 4 hamburguesas o 4 burritos + 2 papitas familiares.', hasWings: true, hasFries: true },
        ]
    },
    {
        category: "🍗 COMBOS ALITAS (Selección de Salsas de Alitas)",
        items: [
            { id: 'chiflado', name: 'Chiflado', price: 16000, desc: '4 alitas en salsa a tu gusto y papitas.', hasWings: true, hasFries: true },
            { id: 'lunatico', name: 'Lunático', price: 24000, desc: '8 alitas en salsa a tu gusto y papitas.', hasWings: true, hasFries: true },
            { id: 'frenetico', name: 'Frenético', price: 32000, desc: '12 alitas en salsa a tu gusto y papitas.', hasWings: true, hasFries: true },
            { id: 'locomparte', name: 'Locomparte', price: 40000, desc: '16 alitas en salsa a tu gusto, papitas familiares.', hasWings: true, hasFries: true },
            { id: 'demente', name: 'Demente', price: 47000, desc: '20 alitas en salsa a tu gusto, papitas familiares.', hasWings: true, hasFries: true },
            { id: 'alocado', name: 'Alocado', price: 60000, desc: '30 alitas en salsa a tu gusto, papitas familiares.', hasWings: true, hasFries: true },
            { id: 'maniatico', name: 'Maniático', price: 85000, desc: '50 alitas en salsa a tu gusto, 2 papitas familiares.', hasWings: true, hasFries: true },
        ]
    },
    {
        category: "🍔 HAMBURGUESAS ARTESANALES (Incluyen Papitas)",
        items: [
            { id: 'locaburguer', name: 'Locaburguer', price: 24000, desc: 'Filete de pollo apanado, vegetales frescos, queso, 2 alitas, papitas y salsas de la casa.', hasWings: true, hasFries: true },
            { id: 'loca_de_atar', name: 'Loca de Atar', price: 24000, desc: 'Carne artesanal, vegetales frescos, queso, 2 alitas, papitas y salsas de la casa.', hasWings: true, hasFries: true },
            { id: 'loca_cheezbacon', name: 'Loca Cheezbacon', price: 26000, desc: 'Carne artesanal, queso cheddar, tocineta y vegetales, acompañada de alitas y papitas.', hasWings: true, hasFries: true },
            { id: 'loca_descontrolada', name: 'Loca Descontrolada', price: 27000, desc: 'Carne artesanal, carne desmechada de res, vegetales frescos, queso, 2 alitas, papitas y salsas de la casa.', hasWings: true, hasFries: true },
            { id: 'loca_desubicada', name: 'Loca Desubicada', price: 28000, desc: 'Carne artesanal, carne desmechada de cerdo, topping de chicharrón, vegetales frescos, queso, 2 alitas, papitas y salsas de la casa.', hasWings: true, hasFries: true },
            { id: 'loca_argentina', name: 'Loca Argentina', price: 32000, desc: 'Carne artesanal, carne desmechada, chorizo, vegetales frescos, queso, 2 alitas, papitas y salsas de la casa.', hasWings: true, hasFries: true },
            { id: 'loca_divertida_burger', name: 'Loca Divertida', price: 32000, desc: 'Doble carne artesanal, carne desmechada, vegetales frescos, doble queso, 2 alitas, papitas y salsas de la casa.', hasWings: true, hasFries: true },
        ]
    },
    {
        category: "🍟 PAPAS LOCAS",
        items: [
            { id: 'combate', name: 'Combate', price: 19000, desc: 'Maicitos, salchichas, queso mozzarella, salsa de maíz y 2 huevitos.', hasWings: false, hasFries: true },
            { id: 'delirantes', name: 'Papas Pollo Crujiente Maracuyá', price: 26000, desc: 'Pollo apanado en salsa de maracuyá, quesito, guacamole y 2 huevitos.', hasWings: false, hasFries: true },
            { id: 'caoticas', name: 'Caóticas', price: 26000, desc: 'Cerdo en salsa BBQ dulce, quesito, guacamole y 2 huevitos.', hasWings: false, hasFries: true },
            { id: 'desequilibradas', name: 'Desequilibradas', price: 30000, desc: 'Carne molida de res en salsa criolla, quesito, guacamole y 2 huevitos.', hasWings: false, hasFries: true },
            { id: 'alucinantes', name: 'Alucinantes', price: 28000, desc: 'Dos proteínas a elección, pico de gallo o guacamole, quesito y 2 huevitos.', hasWings: false, hasFries: true },
            { id: 'papafull', name: 'Papas Full Desubicadas', price: 33000, desc: 'Dos proteínas a elección, 2 alitas, guacamole, Quesito y dos huevitos.', hasWings: true, hasFries: true },
        ]
    },
    {
        category: "🌯 BURRITOS",
        items: [
            { id: 'paranoico', name: 'Paranoico (Pollo)', price: 24000, desc: 'Tortilla, fríjol, vegetales frescos, pollo en julianas, queso, salsas de la casa, 2 alitas y papitas.', hasWings: true, hasFries: true },
            { id: 'desesperado', name: 'Desesperado (Cerdo)', price: 24000, desc: 'Tortilla, fríjol, vegetales frescos, carne de cerdo en julianas, queso, salsas de la casa, 2 alitas y papitas.', hasWings: true, hasFries: true },
            { id: 'agresivo', name: 'Agresivo (Res)', price: 27000, desc: 'Tortilla, fríjol, vegetales frescos, carne de res en julianas, queso, salsas de la casa, 2 alitas y papitas.', hasWings: true, hasFries: true },
            { id: 'indeciso', name: 'Indeciso (Desmechada)', price: 28000, desc: 'Tortilla, fríjol, vegetales frescos, carne desmechada (res o cerdo), queso, salsas de la casa, 2 alitas y papitas.', hasWings: true, hasFries: true },
            { id: 'megaburrito', name: 'MegaBurrito', price: 32000, desc: 'Tortilla, fríjol, vegetales frescos, 200 g de carne molida en salsa, queso, 2 alitas y papitas.', hasWings: true, hasFries: true },
        ]
    },
    {
        category: "🧒 MENÚ INFANTIL",
        items: [
            { id: 'loco_divertido_infantil', name: 'Loco Divertido', price: 17900, desc: 'Salchipapas, juguito Hit, una alita y un juguete.', hasWings: true, hasFries: true },
            { id: 'loco_especial', name: 'Loco Especial', price: 20900, desc: 'Mini hamburguesa, papitas, juguito Hit, una alita y un juguete.', hasWings: true, hasFries: true },
            { id: 'loco_alegre', name: 'Loco Alegre', price: 18900, desc: 'Palomitas de pollo, papitas, juguito Hit, una alita y un juguete.', hasWings: true, hasFries: true },
        ]
    },
    {
        category: "🍨 LOCOGELATOS ARTESANALES",
        items: [
            { id: 'gelato-p1', name: 'Gelato (1 Sabor)', price: 6000, desc: 'Un delicioso sabor de nuestro gelato artesanal.', maxChoices: 1 },
            { id: 'gelato-p2', name: 'Gelato (2 Sabores)', price: 10000, desc: 'Combina dos de tus sabores favoritos de gelato.', maxChoices: 2 },
            { id: 'gelato-p3', name: 'Gelato (3 Sabores)', price: 15000, desc: 'Una mezcla perfecta de tres sabores de gelato artesanal.', maxChoices: 3 },
        ]
    },
    {
        category: "🥤 BEBIDAS REFRESCANTES",
        items: [
            { id: 'limonada_frutos_rojos_tajin', name: 'Limonada de Frutos Rojos', price: 10000, desc: 'Fresa, mora, arándanos, limón y cerezas.', hasWings: false, hasFries: false },
            { id: 'limonada_frutos_amarillos', name: 'Limonada de Frutos Amarillos', price: 10000, desc: 'Uchuva, piña, mango y maracuyá.', hasWings: false, hasFries: false },
            { id: 'limonada_verano', name: 'Limonada de Verano', price: 10000, desc: 'Refrescante combinación de limonada natural con vino tinto.', hasWings: false, hasFries: false },
            { id: 'agua', name: 'Aguas (1.5 L)', price: 7500, desc: 'Botella de agua (1.5 L).', hasWings: false, hasFries: false },
            { id: 'jugos_naturales', name: 'Jugo en Agua (Elige sabor)', price: 7500, desc: 'Mora, mango, guanábana, maracuyá, lulo, limonada natural.', hasWings: false, hasFries: false, submenuKey: 'jugos_naturales' }, 
            { id: 'jugo_frutas_leche', name: 'Jugo de Frutas en Leche (Elige sabor)', price: 8500, desc: 'Jugo cremoso en leche con la fruta de tu elección.', hasWings: false, hasFries: false, submenuKey: 'jugos_naturales' },
            { id: 'limonadas_esp', name: 'Limonadas Especiales (Elige opción)', price: 8500, desc: 'Coco, cereza, sandía, coco cereza, coco café, hierbabuena.', hasWings: false, hasFries: false, submenuKey: 'limonadas_esp' }, 
            { id: 'micheladas', name: 'Micheladas (Elige cerveza)', price: 8500, desc: 'Águila y Águila Light.', hasWings: false, hasFries: false, submenuKey: 'micheladas' }, 
            { id: 'sodas', name: 'Sodas (Elige sabor)', price: 8500, desc: 'Maracuyá, frutos rojos.', hasWings: false, hasFries: false, submenuKey: 'sodas' }, 
            { id: 'milo_frio', name: 'Milo Frío', price: 9000, desc: 'Milo frío.', hasWings: false, hasFries: false },
            { id: 'gaseosas', name: 'Gaseosas (Elige sabor)', price: 5000, desc: 'Coca-Cola, Colombiana, Manzana, Uva, Soda.', hasWings: false, hasFries: false, submenuKey: 'gaseosas' },
            { id: 'cerveza', name: 'Cerveza (Elige opción)', price: 6000, desc: 'Águila, Águila Light.', hasWings: false, hasFries: false, submenuKey: 'cerveza' },
        ]
    },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = LOCO_ALITAS_CATEGORIZED_MENU.flatMap(category =>
  category.items.map(item => ({
    id: item.id,
    name: item.name,
    description: item.desc,
    price: item.price,
    category: category.category,
    hasWings: item.hasWings,
    hasFries: item.hasFries,
    submenuKey: item.submenuKey,
    maxChoices: item.maxChoices,
    imageUrl: '', // Initialize with empty string
    recipe: [], // Initialize with empty recipe
  }))
);

export const INITIAL_ZONES: Zone[] = [
    { id: 'zone-main', name: 'Salón Principal' },
    { id: 'zone-terrace', name: 'Terraza' },
];

export const INITIAL_TABLES: Table[] = [
  { id: 't-1', name: 'Mesa 1', capacity: 2, status: 'available', zoneId: 'zone-main', x: 50, y: 50 },
  { id: 't-2', name: 'Mesa 2', capacity: 4, status: 'occupied', zoneId: 'zone-main', x: 150, y: 50 },
  { id: 't-3', name: 'Mesa 3', capacity: 4, status: 'available', zoneId: 'zone-main', x: 250, y: 50 },
  { id: 't-4', name: 'Mesa 4', capacity: 6, status: 'cleaning', zoneId: 'zone-main', x: 50, y: 150 },
  { id: 't-5', name: 'Mesa 5', capacity: 2, status: 'reserved', zoneId: 'zone-main', x: 150, y: 150 },
  { id: 't-6', name: 'Barra 1', capacity: 1, status: 'available', zoneId: 'zone-main', x: 350, y: 50 },
  { id: 't-7', name: 'Barra 2', capacity: 1, status: 'available', zoneId: 'zone-main', x: 350, y: 100 },
  { id: 't-8', name: 'Patio 1', capacity: 8, status: 'available', zoneId: 'zone-terrace', x: 50, y: 50 },
];

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
    { id: 'inv-1', name: 'Alitas de Pollo', stock: 20, unit: 'kg', cost: 15000, alertThreshold: 5 },
    { id: 'inv-2', name: 'Papas Crudas', stock: 30, unit: 'kg', cost: 3000, alertThreshold: 10 },
    { id: 'inv-3', name: 'Carne de Hamburguesa', stock: 50, unit: 'unidad', cost: 4000, alertThreshold: 10 },
    { id: 'inv-4', name: 'Pan de Hamburguesa', stock: 50, unit: 'unidad', cost: 800, alertThreshold: 10 },
    { id: 'inv-5', name: 'Salsa BBQ', stock: 5, unit: 'L', cost: 20000, alertThreshold: 1 },
    { id: 'inv-6', name: 'Queso Cheddar', stock: 2, unit: 'kg', cost: 35000, alertThreshold: 0.5 },
];

export const EXPENSE_CATEGORIES: string[] = ['Proveedores', 'Nómina', 'Arriendo', 'Servicios', 'Marketing', 'Impuestos', 'Mantenimiento', 'Varios'];

export const MENU_CATEGORIES = [...new Set(INITIAL_MENU_ITEMS.map(item => item.category))];

// Category Color Palette
export const CATEGORY_PALETTE = [
    { name: 'Rojo', color: '#EF4444' },
    { name: 'Naranja', color: '#F97316' },
    { name: 'Ámbar', color: '#F59E0B' },
    { name: 'Verde', color: '#10B981' },
    { name: 'Esmeralda', color: '#34D399' },
    { name: 'Azul', color: '#3B82F6' },
    { name: 'Cielo', color: '#0EA5E9' },
    { name: 'Índigo', color: '#6366F1' },
    { name: 'Violeta', color: '#8B5CF6' },
    { name: 'Fucsia', color: '#D946EF' },
    { name: 'Rosa', color: '#EC4899' },
    { name: 'Rosa', color: '#F43F5E' },
];

// Initial Configuration for Category Colors
export const INITIAL_CATEGORY_CONFIG: CategoryConfig[] = [
    { name: "💥 PROMOCIONES / COMBOS PARA COMPARTIR", color: "#8B5CF6" }, // Violeta
    { name: "🍗 COMBOS ALITAS (Selección de Salsas de Alitas)", color: "#EF4444" }, // Rojo
    { name: "🍔 HAMBURGUESAS ARTESANALES (Incluyen Papitas)", color: "#F97316" }, // Naranja
    { name: "🍟 PAPAS LOCAS", color: "#F59E0B" }, // Ámbar
    { name: "🌯 BURRITOS", color: "#10B981" }, // Verde
    { name: "🧒 MENÚ INFANTIL", color: "#EC4899" }, // Rosa
    { name: "🍨 LOCOGELATOS ARTESANALES", color: "#0EA5E9" }, // Cielo
    { name: "🥤 BEBIDAS REFRESCANTES", color: "#3B82F6" }, // Azul
];

// LOYALTY CONSTANTS
export const INITIAL_LOYALTY_TIERS: LoyaltyTier[] = [
    { id: 'tier-1', name: 'Loco Fan', minPoints: 0, perkDescription: 'Acceso a recompensas básicas', discountPercentage: 0, color: '#A3A3A3' },
    { id: 'tier-2', name: 'Super Loco', minPoints: 500, perkDescription: '5% de descuento en todas las compras', discountPercentage: 5, color: '#F59E0B' },
    { id: 'tier-3', name: 'Ultra Loco', minPoints: 2000, perkDescription: '10% de descuento en todas las compras', discountPercentage: 10, color: '#8B5CF6' },
];

export const INITIAL_LOYALTY_REWARDS: LoyaltyReward[] = [
    { id: 'reward-1', name: 'Gaseosa Gratis', pointCost: 50, type: 'free_item', value: 0, menuItemId: 'gaseosas' },
    { id: 'reward-2', name: '$5.000 de Descuento', pointCost: 100, type: 'discount_fixed', value: 5000 },
    { id: 'reward-3', name: 'Papas Chiflado Gratis', pointCost: 150, type: 'free_item', value: 0, menuItemId: 'chiflado' },
];

export const INITIAL_LOYALTY_SETTINGS: LoyaltySettings = {
    isEnabled: true,
    pointsPerPeso: 0.001, // 1 punto por cada $1,000 COP
    tiers: INITIAL_LOYALTY_TIERS,
    rewards: INITIAL_LOYALTY_REWARDS,
};

// SECURITY CONSTANTS
export const AVAILABLE_PERMISSIONS: { key: Permission; label: string }[] = [
    { key: 'VIEW_DASHBOARD', label: 'Ver Dashboard' },
    { key: 'POS_ACCESS', label: 'Acceder al POS' },
    { key: 'MANAGE_MENU', label: 'Gestionar Menú (Crear/Editar/Eliminar)' },
    { key: 'MANAGE_TABLES', label: 'Gestionar Mesas' },
    { key: 'MANAGE_INVENTORY', label: 'Gestionar Inventario' },
    { key: 'VIEW_REPORTS', label: 'Ver Reportes y Analíticas' },
    { key: 'DELIVERY_MANAGER', label: 'Gestión de Delivery Pro' },
    { key: 'MANAGE_CLIENTS', label: 'Gestionar Clientes Frecuentes' },
    { key: 'MANAGE_LOYALTY', label: 'Gestionar Sistema de Fidelización' },
    { key: 'MANAGE_SHOPPING_LIST', label: 'Gestionar Lista de Compras' },
    { key: 'KITCHEN_MONITOR', label: 'Monitor de Cocina (KDS)' },
    { key: 'MANAGE_EXPENSES', label: 'Gestionar Gastos' },
    { key: 'MANAGE_MARKETING', label: 'Marketing IA' },
    { key: 'MANAGE_QR', label: 'Gestor de Menú QR' },
    { key: 'MANAGE_SETTINGS', label: 'Configuración (Usuarios y Roles)' },
];

export const INITIAL_ROLES: Role[] = [
    {
        id: 'role-admin',
        name: 'Administrador',
        isSystem: true,
        permissions: AVAILABLE_PERMISSIONS.map(p => p.key), // Admin has all permissions
    },
    {
        id: 'role-waiter',
        name: 'Mesero / Cajero',
        permissions: ['POS_ACCESS', 'VIEW_DASHBOARD', 'DELIVERY_MANAGER', 'MANAGE_CLIENTS', 'KITCHEN_MONITOR'],
    },
    {
        id: 'role-chef',
        name: 'Cocinero',
        permissions: ['KITCHEN_MONITOR'],
    },
];

export const INITIAL_USERS: User[] = [
    {
        id: 'user-admin',
        name: 'Gerente General',
        username: 'admin',
        password: '123', // Simple default for demo
        roleId: 'role-admin',
    },
    {
        id: 'user-waiter',
        name: 'Juan Mesero',
        username: 'mesero',
        password: '123',
        roleId: 'role-waiter',
    },
    {
        id: 'user-chef',
        name: 'Chef Cocina',
        username: 'chef',
        password: '123',
        roleId: 'role-chef',
    },
];

export const INITIAL_PRINTER_SETTINGS: PrinterSettings = {
    paperSize: '80mm',
    shopName: 'Restaurante IA Pro',
    shopSlogan: 'La Mente Maestra en Tu Cocina',
    shopAddress: 'Calle 10 # 5-5, Centro',
    shopPhone: '+57 300 123 4567',
    shopNit: '900.123.456-7',
    footerMessage: '¡Gracias por tu compra!\nSíguenos en redes @restaurantia',
    socialMedia: '@restaurantia',
    autoPrintKitchen: false,
    autoPrintReceipt: false,
    purchasingContacts: [], // Initialize empty list for purchasing managers
    kitchenTimer: 12,
    publicMenuUrl: '',
};