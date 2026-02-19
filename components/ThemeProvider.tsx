import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemePreference = 'system' | 'light' | 'dark';

type ThemePreferenceContextValue = {
    preference: ThemePreference;
    setPreference: (next: ThemePreference) => void;
    effectiveScheme: 'light' | 'dark';
};

const THEME_PREFERENCE_KEY = 'themePreference';

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useSystemColorScheme() ?? 'light';
    const [preference, setPreferenceState] = useState<ThemePreference>('system');

    useEffect(() => {
        let isMounted = true;

        AsyncStorage.getItem(THEME_PREFERENCE_KEY)
            .then((value) => {
                if (!isMounted || !value) return;
                if (value === 'system' || value === 'light' || value === 'dark') {
                    setPreferenceState(value);
                }
            })
            .catch(() => {
                // Non-fatal: stick with the default preference.
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const setPreference = (next: ThemePreference) => {
        setPreferenceState(next);
        AsyncStorage.setItem(THEME_PREFERENCE_KEY, next).catch(() => {
            // Non-fatal: preference will remain for this session.
        });
    };

    const effectiveScheme = preference === 'system' ? systemScheme : preference;

    const value = useMemo(
        () => ({ preference, setPreference, effectiveScheme }),
        [preference, effectiveScheme]
    );

    return (
        <ThemePreferenceContext.Provider value={value}>
            {children}
        </ThemePreferenceContext.Provider>
    );
}

export function useThemePreference() {
    const context = useContext(ThemePreferenceContext);
    if (!context) {
        throw new Error('useThemePreference must be used within ThemePreferenceProvider');
    }
    return context;
}
