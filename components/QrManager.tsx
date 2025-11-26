import React, { useState, useRef, useEffect } from 'react';
import QRCode from "react-qr-code";
import type { PrinterSettings } from '../types';
import { QrCodeIcon, DownloadIcon, ShareIcon, SparklesIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface QrManagerProps {
    settings: PrinterSettings;
    onSaveSettings: (settings: PrinterSettings) => void;
}

export const QrManager: React.FC<QrManagerProps> = ({ settings, onSaveSettings }) => {
    const [publicUrl, setPublicUrl] = useState('');
    const qrCodeRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        // New robust URL generation logic
        const origin = window.location.origin;
        // Correctly handle pathname for dev vs. deployed (e.g., / vs. /repo-name/)
        const pathname = window.location.pathname.replace(/index\.html$/, '');
        // Ensure there's a single slash between path and file
        const fullPath = `${origin}${pathname}menu.html`.replace(/([^:]\/)\/+/g, "$1");
        
        const generatedUrl = settings.publicMenuUrl || fullPath;
        setPublicUrl(generatedUrl);
        
        if (!settings.publicMenuUrl || settings.publicMenuUrl !== generatedUrl) {
            onSaveSettings({ ...settings, publicMenuUrl: generatedUrl });
        }
    }, [settings, onSaveSettings]);

    const downloadAs = (format: 'svg' | 'png') => {
        if (!qrCodeRef.current) return;
        const svgElement = qrCodeRef.current.querySelector('svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        
        if (format === 'svg') {
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `menu-qr-${settings.shopName}.svg`;
            link.click();
            window.URL.revokeObjectURL(url);
            addToast('QR Code (SVG) descargado', 'success');
        } else { // PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = 512; // Upscale for better quality
                canvas.height = 512;
                ctx?.drawImage(img, 0, 0, 512, 512);
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `menu-qr-${settings.shopName}.png`;
                link.click();
                addToast('QR Code (PNG) descargado', 'success');
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }
    };
    
    const copyUrlToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        addToast('URL copiada al portapapeles', 'success');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
                    <QrCodeIcon className="w-8 h-8"/>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white font-bangers tracking-wide">GESTOR DE MENÚ QR</h2>
                    <p className="text-gray-400">Genera y descarga el código QR para que tus clientes vean el menú.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* QR Code Display */}
                <div className="bg-[var(--card-bg)] p-8 rounded-xl border border-[var(--card-border)] flex flex-col items-center justify-center text-center">
                    <h3 className="text-2xl font-bold text-white mb-4">¡Listo para Escanear!</h3>
                    <div ref={qrCodeRef} className="bg-white p-6 rounded-lg shadow-2xl">
                        {publicUrl ? (
                            <QRCode
                                value={publicUrl}
                                size={256}
                                level="H"
                                bgColor="#FFFFFF"
                                fgColor="#0A0A0A"
                            />
                        ) : (
                            <div className="w-64 h-64 bg-gray-200 flex items-center justify-center text-gray-500">Generando URL...</div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-4 max-w-xs truncate">{publicUrl}</p>
                