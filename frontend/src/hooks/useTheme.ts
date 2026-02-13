import { useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
}

export function applyTheme(theme: Theme) {
    const effective = getEffectiveTheme(theme);
    const root = document.documentElement;

    if (effective === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
    } else {
        root.classList.add('light');
        root.classList.remove('dark');
    }

    // Store for persistence
    localStorage.setItem('triadak_theme', theme);
}

export function useTheme() {
    useEffect(() => {
        // Load saved theme on mount
        const saved = localStorage.getItem('triadak_theme') as Theme | null;
        const settingsStr = localStorage.getItem('triadak_settings');
        let theme: Theme = 'dark';

        if (saved) {
            theme = saved;
        } else if (settingsStr) {
            try {
                const settings = JSON.parse(settingsStr);
                if (settings.theme) theme = settings.theme;
            } catch { /* ignore */ }
        }

        applyTheme(theme);

        // Listen for system theme changes when set to 'system'
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const current = localStorage.getItem('triadak_theme') as Theme | null;
            if (current === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
}
