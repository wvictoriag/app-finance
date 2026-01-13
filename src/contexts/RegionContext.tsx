import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Region = 'CL' | 'CO';

export interface RegionalSettings {
    countryCode: Region;
    currency: string;
    locale: string;
    taxName?: string; // e.g., '4x1000'
    taxRate?: number; // e.g., 0.004
}

const SETTINGS: Record<Region, RegionalSettings> = {
    'CL': {
        countryCode: 'CL',
        currency: 'CLP',
        locale: 'es-CL'
    },
    'CO': {
        countryCode: 'CO',
        currency: 'COP',
        locale: 'es-CO',
        taxName: '4x1000',
        taxRate: 0.004
    }
};

interface RegionContextType {
    settings: RegionalSettings;
    setRegion: (region: Region) => void;
}

const RegionContext = createContext<RegionContextType>({ settings: SETTINGS['CL'], setRegion: () => { } });

export const useRegion = () => useContext(RegionContext);

export const RegionProvider = ({ children }: { children: ReactNode }) => {
    const [region, setRegionState] = useState<Region>(() => {
        const saved = localStorage.getItem('app_region');
        return (saved === 'CO' ? 'CO' : 'CL') as Region;
    });

    const setRegion = (r: Region) => {
        setRegionState(r);
        localStorage.setItem('app_region', r);
        // Force reload to apply formatting changes globally if helpers read from storage
        // window.location.reload(); 
    };

    return (
        <RegionContext.Provider value={{ settings: SETTINGS[region], setRegion }}>
            {children}
        </RegionContext.Provider>
    );
};
