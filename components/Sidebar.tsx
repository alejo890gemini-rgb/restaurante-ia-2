import React, { useEffect, useState } from 'react';
import type { View, Permission, PrinterSettings, Sede } from '../types';
import { DashboardIcon, POSIcon, MenuBookIcon, TableIcon, ReportsIcon, InventoryIcon, MotorcycleIcon, LockIcon, BookOpenIcon, DownloadIcon, UsersIcon, ShoppingCartIcon, AwardIcon, ClipboardCheckIcon, DollarSignIcon, MegaphoneIcon, RestauranteIAIcon, QrCodeIcon, MapPinIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  closeSidebar: () => void;
  permissions: Permission[];
  onLogout: () => void;
  userName: string;
  roleName: string;
  isOnline?: boolean;
  settings?: PrinterSettings;
  isAdmin: boolean;
  sedes: Sede[];
  selectedSedeId: string;
  setSelectedSedeId: (id: string) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`relative flex items-center p-3 my-1 rounded-lg transition-colors duration-200 group ${
        isActive
          ? 'bg-red-900/40 text-white font-semibold'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-[var(--primary-red)] rounded-r-full"></span>
      )}
      {icon}
      <span className="ml-4">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, closeSidebar, permissions, onLogout, userName, roleName, isOnline = true, settings, isAdmin, sedes, selectedSedeId, setSelectedSedeId }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const shopName = settings?.shopName || "LOCO ALITAS";

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    closeSidebar();
  };

  const hasPermission = (perm: Permission) => permissions.includes(perm);

  return (
    <div className="flex flex-col h-full bg-[var(--card-bg)] text-white">
      <div className="flex items-center justify-center h-24 border-b border-[var(--card-border)] relative px-4 text-center">
        <div className="flex flex-col items-center">
            <RestauranteIAIcon className="w-12 h-12 mb-1 text-[var(--primary-red)]" />
            <h1 className="text-xl font-bangers tracking-wider uppercase leading-none text-white">
              {shopName}
            </h1>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px]">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></span>
            <span className="text-gray-500">{isOnline ? 'ON' : 'OFF'}</span>
        </div>
      </div>
      
      {isAdmin && (
        <div className="p-2 border-b border-[var(--card-border)]">
            <label className="text-xs text-gray-400 font-bold ml-2">Vista</label>
            <select
                value={selectedSedeId}
                onChange={(e) => setSelectedSedeId(e.target.value)}
                className="w-full mt-1 p-2 text-sm text-white bg-black/30 rounded-md border border-gray-600 focus:ring-1 focus:ring-purple-500 outline-none"
            >
                <option value="global" className="font-bold bg-gray-800">🌎 Visión Global (Todas)</option>
                {sedes.map(sede => (
                    <option key={sede.id} value={sede.id} className="bg-gray-800">{sede.name}</option>
                ))}
            </select>
        </div>
      )}

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul>
          {hasPermission('VIEW_DASHBOARD') && (
              <NavItem
                icon={<DashboardIcon />}
                label="Dashboard"
                isActive={currentView === 'DASHBOARD'}
                onClick={() => handleNavClick('DASHBOARD')}
              />
          )}
          {hasPermission('POS_ACCESS') && (
              <NavItem
                icon={<POSIcon />}
                label="POS"
                isActive={currentView === 'POS'}
                onClick={() => handleNavClick('POS')}
              />
          )}
          {hasPermission('KITCHEN_MONITOR') && (
              <NavItem
                icon={<ClipboardCheckIcon />}
                label="Monitor Cocina"
                isActive={currentView === 'KITCHEN'}
                onClick={() => handleNavClick('KITCHEN')}
              />
          )}
          {hasPermission('MANAGE_TABLES') && (
               <NavItem
                icon={<TableIcon />}
                label="Mesas"
                isActive={currentView === 'TABLES'}
                onClick={() => handleNavClick('TABLES')}
              />
          )}
          {hasPermission('MANAGE_MENU') && (
              <NavItem
                icon={<MenuBookIcon />}
                label="Menú"
                isActive={currentView === 'MENU'}
                onClick={() => handleNavClick('MENU')}
              />
          )}
           {hasPermission('MANAGE_INVENTORY') && (
              <NavItem
                icon={<InventoryIcon />}
                label="Inventario"
                isActive={currentView === 'INVENTORY'}
                onClick={() => handleNavClick('INVENTORY')}
              />
          )}
           {hasPermission('MANAGE_SHOPPING_LIST') && (
              <NavItem
                icon={<ShoppingCartIcon />}
                label="Lista de Compras"
                isActive={currentView === 'SHOPPING'}
                onClick={() => handleNavClick('SHOPPING')}
              />
          )}
          {hasPermission('MANAGE_CLIENTS') && (
              <NavItem
                icon={<UsersIcon />}
                label="Clientes Pro"
                isActive={currentView === 'CLIENTS'}
                onClick={() => handleNavClick('CLIENTS')}
              />
          )}
          {hasPermission('DELIVERY_MANAGER') && (
              <NavItem
                icon={<MotorcycleIcon />}
                label="Delivery Pro"
                isActive={currentView === 'DELIVERY_MANAGER'}
                onClick={() => handleNavClick('DELIVERY_MANAGER')}
              />
          )}
          {hasPermission('VIEW_REPORTS') && (
              <NavItem
                icon={<ReportsIcon />}
                label="Reportes"
                isActive={currentView === 'REPORTS'}
                onClick={() => handleNavClick('REPORTS')}
              />
          )}
          {hasPermission('MANAGE_EXPENSES') && (
            <NavItem
              icon={<DollarSignIcon />}
              label="Gastos"
              isActive={currentView === 'EXPENSES'}
              onClick={() => handleNavClick('EXPENSES')}
            />
          )}
          {hasPermission('MANAGE_MARKETING') && (
            <NavItem
              icon={<MegaphoneIcon />}
              label="Marketing IA"
              isActive={currentView === 'MARKETING'}
              onClick={() => handleNavClick('MARKETING')}
            />
          )}
          
          {/* SECTION FOR ADMIN TOOLS */}
           {hasPermission('MANAGE_SETTINGS') && (
              <>
                 <div className="my-2 border-t border-gray-700/50"></div>
                 <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2">Administración</p>
                 <NavItem
                    icon={<AwardIcon />}
                    label="Fidelización"
                    isActive={currentView === 'LOYALTY'}
                    onClick={() => handleNavClick('LOYALTY')}
                  />
                  {hasPermission('MANAGE_QR') && (
                    <NavItem
                        icon={<QrCodeIcon />}
                        label="Menú QR"
                        isActive={currentView === 'QR_MANAGER'}
                        onClick={() => handleNavClick('QR_MANAGER')}
                    />
                  )}
                 <NavItem
                    icon={<LockIcon />}
                    label="Configuración"
                    isActive={currentView === 'SETTINGS'}
                    onClick={() => handleNavClick('SETTINGS')}
                  />
                  <NavItem
                    icon={<BookOpenIcon />}
                    label="Manual de Uso"
                    isActive={currentView === 'MANUAL'}
                    onClick={() => handleNavClick('MANUAL')}
                  />
              </>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-[var(--card-border)] space-y-3">
         {isInstallable && (
             <button 
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 rounded-lg transition-colors animate-pulse shadow-lg shadow-emerald-900/20"
             >
                 <DownloadIcon className="w-4 h-4" /> Instalar App
             </button>
         )}
         <div className="flex items-center justify-between">
             <div>
                 <p className="text-sm font-bold text-white">{userName}</p>
                 <p className="text-xs text-gray-400">{roleName}</p>
             </div>
             <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/20 px-2 py-1 rounded hover:bg-red-900/40 transition-colors">
                 Salir
             </button>
         </div>
      </div>
    </div>
  );
};