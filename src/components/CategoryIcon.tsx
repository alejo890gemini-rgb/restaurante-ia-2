
import React from 'react';
import { SparklesIcon, DrumstickIcon, BurgerIcon, PotatoIcon, WrapTextIcon, SmileIcon, CupSodaIcon, IceCreamIcon } from './Icons';

interface CategoryIconProps {
    category: string;
    className?: string;
    style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className, style }) => {
    const defaultClassName = "w-7 h-7";
    const iconClass = className || defaultClassName;

    // Apply style if provided
    const commonProps = { className: iconClass, style };

    // Safety check: ensure category is a valid string
    if (!category || typeof category !== 'string') return <BurgerIcon {...commonProps} />;

    if (category.includes('PROMOCIONES')) {
        return <SparklesIcon {...commonProps} />;
    }
    if (category.includes('ALITAS')) {
        return <DrumstickIcon {...commonProps} />;
    }
    if (category.includes('HAMBURGUESAS')) {
        return <BurgerIcon {...commonProps} />;
    }
    if (category.includes('PAPAS')) {
        return <PotatoIcon {...commonProps} />;
    }
    if (category.includes('BURRITOS')) {
        return <WrapTextIcon {...commonProps} />;
    }
    if (category.includes('INFANTIL')) {
        return <SmileIcon {...commonProps} />;
    }
     if (category.includes('LOCOGELATOS')) {
        return <IceCreamIcon {...commonProps} />;
    }
    if (category.includes('BEBIDAS')) {
        return <CupSodaIcon {...commonProps} />;
    }
    return <BurgerIcon {...commonProps} />; // Default icon
};