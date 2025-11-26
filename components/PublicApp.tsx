import React, { useState, useEffect } from 'react';
import { PublicMenu } from './PublicMenu';
import { db } from '../services/db';
import type { MenuItem, CategoryConfig, PrinterSettings } from '../types';
// FIX: Renamed `INITIAL_MENU_ITEMS` to `BASE_MENU_ITEMS` to match the exported variable from `constants.ts`.
import { BASE_MENU_ITEMS, INITIAL_CATEGORY_CONFIG, INITIAL_PRINTER_SETTINGS } from '../constants';

const PublicApp: React.FC = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([]);
    const [settings, setSettings] = useState<PrinterSettings>(INITIAL_PRINTER_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                // Fetch only the data needed for the public menu
                const menuPromise = db.getAll<MenuItem>('menu_items');
                const settingsPromise = db.getAll<{key: string, value: any}>('settings');
                
                const [menuResult, settingsResult] = await Promise.all([menuPromise, settingsPromise]);

                // Use BASE_MENU_ITEMS as a fallback if the database returns null or empty
                const menuData = (menuResult && menuResult.length > 0) ? menuResult : BASE_MENU_ITEMS;
                setMenuItems(menuData);
                
                if (settingsResult && settingsResult.length > 0) {
                    const settingsMap: Record<string, any> = {};
                    settingsResult.forEach(s => { settingsMap[s.key] = s.value; });
                    setCategoryConfigs(settingsMap.category_configs || INITIAL_CATEGORY_CONFIG);
                    setSettings(settingsMap.printer_settings || INITIAL_PRINTER_SETTINGS);
                } else {
                    // Fallback for offline mode or error
                    setCategoryConfigs(INITIAL_CATEGORY_CONFIG);
                    setSettings(INITIAL_PRINTER_SETTINGS);
                }

            } catch (error) {
                console.error("Error fetching public menu data:", error);
                // Set fallback data on error
                setMenuItems(BASE_MENU_ITEMS);
                setCategoryConfigs(INITIAL_CATEGORY_CONFIG);
                setSettings(INITIAL_PRINTER_SETTINGS);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return <PublicMenu menuItems={menuItems} categoryConfigs={categoryConfigs} settings={settings} />;
};

export default PublicApp;