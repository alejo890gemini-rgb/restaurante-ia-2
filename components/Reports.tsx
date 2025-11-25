
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { Sale, Table, Zone, PaymentMethod, User } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { SparklesIcon, DownloadIcon, EditIcon, TrashIcon, MotorcycleIcon, SpinnerIcon } from './Icons';
// FIX: Remove unused ReportData import that was causing an error
import { generateSalesReport, generateKitchenPerformanceReport } from '../services/geminiService';

// 1. REGISTER CHART.JS COMPONENTS MANUALLY TO PREVENT CRASHES
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ReportsProps {
  sales: Sale[];
  tables: Table[];
  zones: Zone[];
  users: User[];
  currentUser: User;
  deleteSale: (saleId: string) => void;
  updateSale: (sale: Sale) => void;
}

// --- COMPONENTS FOR LAYOUT ---

const StatCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)]">
        <h3 className="text-sm text-gray-400 font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
);

export const Reports: React.FC<ReportsProps> = ({ sales, tables, zones, users, currentUser, deleteSale, updateSale }) => {
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const filteredSales = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return sales.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            return saleDate >= start && saleDate <= end;
        });
    }, [sales, startDate, endDate]);

    const totalRevenue = useMemo(() => filteredSales.reduce((sum, s) => sum + s.total, 0), [filteredSales]);
    const totalOrders = filteredSales.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const salesByDay = useMemo(() => {
        const data: Record<string, number> = {};
        filteredSales.forEach(s => {
            const day = new Date(s.timestamp).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
            data[day] = (data[day] || 0) + s.total;
        });
        return data;
    }, [filteredSales]);

    const lineChartData = {
        labels: Object.keys(salesByDay),
        datasets: [{
            label: 'Ventas Diarias',
            data: Object.values(salesByDay),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            fill: true,
            tension: 0.3,
        }]
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Reportes y Analíticas</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div>
                    <label className="text-sm text-gray-400">Desde</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                </div>
                <div>
                    <label className="text-sm text-gray-400">Hasta</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 rounded bg-black/20 border-gray-600 text-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Ingresos Totales" value={formatPrice(totalRevenue)} subtext={`${totalOrders} órdenes`} />
                <StatCard title="Ticket Promedio" value={formatPrice(averageTicket)} />
                <StatCard title="Total de Órdenes" value={totalOrders.toString()} />
            </div>

            <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--card-border)]">
                <h3 className="font-bold text-white mb-4">Ventas en el Periodo</h3>
                <Line data={lineChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            
            {/* Placeholder for more charts and tables */}
        </div>
    );
};
