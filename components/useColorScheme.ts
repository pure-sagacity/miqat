import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemePreference } from './ThemeProvider';

export function useColorScheme() {
    try {
        const { effectiveScheme } = useThemePreference();
        return effectiveScheme;
    } catch {
        return useSystemColorScheme() ?? 'light';
    }
}
