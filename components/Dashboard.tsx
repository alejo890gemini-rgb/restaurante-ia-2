
import React from 'react';
import type { Sale, MenuItem, Table, PaymentMethod, User } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { ProfeLoco } from './ProfeLoco';

interface DashboardProps {
  sales: Sale[];
  menuItems: MenuItem[];
  tables: Table[];
  users: User[];
  currentUser: User;
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; icon: React.ReactNode; color: string }> = ({ title, value, subtext, icon, color }) => (
  <div className={`bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg flex items-center space-x-5 border border-[var(--card-border)] relative overflow-hidden group transition-transform hover:scale-[1.02]`}>
    <div className={`absolute right-0 top-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-opacity group-hover:opacity-20`}></div>
    <div className={`flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
      {icon}
    </div>
    <div className="relative z-10">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white font-mono">{value}</p>
      {subtext && <p className="mt-1 text-xs font-medium text-gray-500">{subtext}</p>}
    </div>
  </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ sales, menuItems, tables, users, currentUser }) => {
  const todaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === new Date().toDateString());
  const totalRevenue = todaySales.reduce((acc, sale) => acc + sale.total, 0);
  const totalOrders = todaySales.length;

  const revenueByPaymentMethod = todaySales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    return acc;
  }, {} as Record<PaymentMethod, number>);

  const getTopSellingItems = () => {
    const itemCounts: { [key: string]: number } = {};
    todaySales.forEach(sale => {
      sale.order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };
  
  const topItems = getTopSellingItems();
  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  const getSaleDestination = (sale: Sale): string => {
      if (sale.order.orderType === 'delivery') {
          return `🛵 ${sale.order.deliveryInfo?.name || 'N/A'}`;
      }
      if (sale.order.orderType === 'to-go') {
        return `🛍️ ${sale.order.toGoName || 'N/A'}`;
      }
      const tableName = tables.find(t => t.id === sale.order.tableId)?.name;
      return `🍽️ ${tableName || 'Mesa N/A'}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-4xl font-bold text-white font-bangers tracking-wide">
                HOLA, <span className="text-[var(--accent-yellow)]">{currentUser.name.split(' ')[0].toUpperCase()}</span>
            </h2>
            <p className="text-gray-400 text-sm">Resumen de operación en tiempo real</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventas de Hoy" value={formatPrice(totalRevenue)} subtext={`${totalOrders} órdenes completadas`} color="from-emerald-500 to-emerald-700" icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Mesas Disponibles" value={`${availableTables}`} subtext={`de ${tables.length} totales`} color="from-blue-500 to-blue-700" icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6m-6 4h6" /></svg>} />
        <StatCard title="Mesas Ocupadas" value={`${occupiedTables}`} subtext={`${((occupiedTables / tables.length) * 100 || 0).toFixed(0)}% de ocupación`} color="from-red-500 to-red-700" icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Platillos Activos" value={menuItems.length.toString()} subtext="En menú principal" color="from-purple-500 to-purple-700" icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
      </div>

      <div className="mb-8">
        <ProfeLoco sales={sales} users={users} menuItems={menuItems} currentUser={currentUser} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg border border-[var(--card-border)]">
          <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
              <span className="bg-emerald-500 w-2 h-6 rounded-full"></span> Ventas Recientes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--text-secondary)]">
              <thead className="text-xs text-gray-500 uppercase bg-black/20 rounded-lg">
                <tr>
                  <th scope="col" className="px-4 py-3 rounded-l-lg">ID</th>
                  <th scope="col" className="px-4 py-3">Destino</th>
                  <th scope="col" className="px-4 py-3">Pago</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="px-4 py-3 text-right rounded-r-lg">Hora</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 5).map(sale => (
                  <tr key={sale.id} className="border-b border-[var(--card-border)] hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-mono text-gray-400">#{sale.id.slice(-4)}</td>
                    <td className="px-4 py-4 font-medium text-white">{getSaleDestination(sale)}</td>
                    <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${sale.paymentMethod === 'Efectivo' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'}`}>
                            {sale.paymentMethod}
                        </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-[var(--accent-yellow)] text-right">{formatPrice(sale.total)}</td>
                    <td className="px-4 py-4 text-right text-gray-500">{new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500 italic">No hay ventas registradas hoy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
            <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg border border-[var(--card-border)]">
                <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                    <span className="bg-blue-500 w-2 h-6 rounded-full"></span> Métodos de Pago
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-gray-800">
                        <span className="text-gray-300 flex items-center gap-2">💵 Efectivo</span>
                        <span className="font-bold text-white text-lg">{formatPrice(revenueByPaymentMethod['Efectivo'] || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-gray-800">
                        <span className="text-gray-300 flex items-center gap-2">💳 Tarjeta</span>
                        <span className="font-bold text-white text-lg">{formatPrice(revenueByPaymentMethod['Tarjeta'] || 0)}</span>
                    </div>
                     <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-gray-800">
                        <span className="text-gray-300 flex items-center gap-2">📲 Transferencia</span>
                        <span className="font-bold text-white text-lg">{formatPrice(revenueByPaymentMethod['Transferencia'] || 0)}</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg border border-[var(--card-border)] flex-1">
              <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                  <span className="bg-[var(--accent-yellow)] w-2 h-6 rounded-full"></span> Top Platillos
              </h3>
              {topItems.length > 0 ? (
                <ul className="space-y-3">
                  {topItems.map(([name, count], index) => (
                    <li key={name} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'}`}>
                            {index+1}
                        </div>
                        <span className="text-gray-200 font-medium">{name}</span>
                      </div>
                      <span className="font-bold text-white bg-white/10 px-2 py-1 rounded text-xs">{count} und</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                    Sin datos suficientes.
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};