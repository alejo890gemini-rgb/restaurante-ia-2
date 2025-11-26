import React, { useMemo, useRef } from 'react';
import type { MenuItem, CategoryConfig, PrinterSettings } from '../types';
import { RestauranteIAIcon } from './Icons';
import { CategoryIcon } from './CategoryIcon';
import { formatPrice } from '../utils/formatPrice';

interface PublicMenuProps {
    menuItems: MenuItem[];
    categoryConfigs: CategoryConfig[];
    settings: PrinterSettings;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({ menuItems, categoryConfigs, settings }) => {
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const itemsByCategory = useMemo(() => {
        return menuItems.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, MenuItem[]>);
    }, [menuItems]);
    
    // Sort categories based on the order in categoryConfigs, then alphabetically
    const sortedCategories = useMemo(() => {
        const configuredOrder = categoryConfigs.map(c => c.name);
        return Object.keys(itemsByCategory).sort((a, b) => {
            const indexA = configuredOrder.indexOf(a);
            const indexB = configuredOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [itemsByCategory, categoryConfigs]);

    const getCategoryColor = (catName: string) => {
      const config = categoryConfigs.find(c => c.name === catName);
      return config ? config.color : '#6B7280';
    }

    const handleCategoryClick = (categoryId: string) => {
        categoryRefs.current[categoryId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    return (
        <div className="bg-[var(--black-bg)] min-h-screen">
            <header className="py-8 text-center bg-[var(--card-bg)] border-b-4 border-[var(--primary-red)] shadow-2xl">
                <RestauranteIAIcon className="w-24 h-24 mx-auto mb-4"/>
                <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-white uppercase">{settings.shopName}</h1>
                <p className="text-gray-400 text-sm mt-2">{settings.shopSlogan}</p>
            </header>

            <nav className="sticky top-0 bg-[var(--black-bg)]/80 backdrop-blur-sm z-20 py-3 shadow-md">
                <div className="px-4 overflow-x-auto custom-scrollbar">
                    <div className="flex space-x-3 justify-center">
                        {sortedCategories.map(category => (
                            <button 
                                key={category} 
                                onClick={() => handleCategoryClick(category)}
                                className="flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow-sm bg-[var(--card-bg)] border-transparent text-gray-300 hover:text-white hover:bg-white/10"
                            >
                                <CategoryIcon category={category} className="w-5 h-5" style={{ color: getCategoryColor(category) }} />
                                {category.split('(')[0].split('/')[0].trim()}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
                {sortedCategories.map(category => (
                    <section 
                        key={category} 
                        ref={el => categoryRefs.current[category] = el}
                        className="scroll-mt-24"
                    >
                        <h2 className="text-3xl font-bangers tracking-wider text-white mb-6 flex items-center gap-3">
                            <span className="p-2.5 rounded-full" style={{ backgroundColor: `${getCategoryColor(category)}30` }}>
                                <CategoryIcon category={category} className="w-6 h-6" style={{ color: getCategoryColor(category) }} />
                            </span>
                            <span className="border-b-2 pb-1" style={{ borderColor: getCategoryColor(category) }}>{category}</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {itemsByCategory[category].map(item => (
                                <div key={item.id} className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden flex flex-col sm:flex-row gap-4 p-4">
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-40 sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0 border-2 border-gray-700"/>
                                    )}
                                    <div className="flex flex-col flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-white">{item.name}</h3>
                                            <p className="font-bold text-lg text-[var(--accent-yellow)] font-mono whitespace-nowrap pl-4">{formatPrice(item.price)}</p>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1 flex-grow">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </main>
            
            <footer className="text-center py-6 mt-10 border-t border-[var(--card-border)] text-xs text-gray-600">
                <p>Menú generado con Restaurante IA Pro</p>
                <p>{settings.socialMedia}</p>
            </footer>
        </div>
    );
};
