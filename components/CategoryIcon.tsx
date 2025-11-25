import React from 'react';
import { SparklesIcon, DrumstickIcon, BurgerIcon, PotatoIcon, WrapTextIcon, SmileIcon, CupSodaIcon, IceCreamIcon } from './Icons';

interface CategoryIconProps {
    category: string;
    className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className }) => {
    const defaultClassName = "w-7 h-7";
    const iconClass = className || defaultClassName;

    if (category.includes('PROMOCIONES')) {
        return <SparklesIcon className={iconClass} />;
    }
    if (category.includes('ALITAS')) {
        return <DrumstickIcon className={iconClass} />;
    }
    if (category.includes('HAMBURGUESAS')) {
        return <BurgerIcon className={iconClass} />;
    }
    if (category.includes('PAPAS')) {
        return <PotatoIcon className={iconClass} />;
    }
    if (category.includes('BURRITOS')) {
        return <WrapTextIcon className={iconClass} />;
    }
    if (category.includes('INFANTIL')) {
        return <SmileIcon className={iconClass} />;
    }
     if (category.includes('LOCOGELATOS')) {
        return <IceCreamIcon className={iconClass} />;
    }
    if (category.includes('BEBIDAS')) {
        return <CupSodaIcon className={iconClass} />;
    }
    return <BurgerIcon className={iconClass} />; // Default icon
};