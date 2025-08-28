import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types/core';

// Default settings
const defaultSettings: AppSettings = {
    appearance: {
        lineColor: '#60a5fa',
        lineWidth: 2,
        pointSize: 6,
        highlightColor: '#f59e0b',
        backgroundColor: '#ffffff',
        darkMode: false,
    },
    precision: {
        lengthDecimals: 2,
        angleDecimals: 1,
        units: 'imperial',
    },
    snapping: {
        enabled: true,
        tolerance: 10,
        snapToGrid: true,
        snapToPoints: true,
        snapToLines: true,
    },
    canvas: {
        showGrid: true,
        gridSize: 20,
        gridOpacity: 0.3,
        zoom: 1,
        panX: 0,
        panY: 0,
        showLengths: true,
        showLengthBubbles: true,
        showAngles: true,
    },
};

interface SettingsState {
    settings: AppSettings;
    isHydrated: boolean;

    // Actions
    updateAppearance: (updates: Partial<AppSettings['appearance']>) => void;
    updatePrecision: (updates: Partial<AppSettings['precision']>) => void;
    updateSnapping: (updates: Partial<AppSettings['snapping']>) => void;
    updateCanvas: (updates: Partial<AppSettings['canvas']>) => void;
    resetToDefaults: () => void;

    // Migration utility (for legacy settings)
    migrateLegacySettings: (legacySettings: Record<string, unknown>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            settings: defaultSettings,
            isHydrated: false,

            updateAppearance: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        appearance: { ...state.settings.appearance, ...updates },
                    },
                }));
            },

            updatePrecision: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        precision: { ...state.settings.precision, ...updates },
                    },
                }));
            },

            updateSnapping: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        snapping: { ...state.settings.snapping, ...updates },
                    },
                }));
            },

            updateCanvas: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        canvas: { ...state.settings.canvas, ...updates },
                    },
                }));
            },

            resetToDefaults: () => {
                set({ settings: { ...defaultSettings } });
            },

            migrateLegacySettings: (legacySettings) => {
                const { settings } = get();
                const migratedSettings = { ...settings };

                // Example migration logic (customize based on actual legacy format)
                if (legacySettings.lineColor && typeof legacySettings.lineColor === 'string') {
                    migratedSettings.appearance.lineColor = legacySettings.lineColor;
                }

                if (legacySettings.showGrid && typeof legacySettings.showGrid === 'boolean') {
                    migratedSettings.canvas.showGrid = legacySettings.showGrid;
                }

                if (legacySettings.precision && typeof legacySettings.precision === 'number') {
                    migratedSettings.precision.lengthDecimals = Math.max(0, Math.min(5, legacySettings.precision));
                }

                // Add more migration rules as needed

                set({ settings: migratedSettings });
            },
        }),
        {
            name: 'fc-settings-storage',
            version: 1,
            // Handle version migrations if needed
            migrate: (persistedState: unknown, version: number) => {
                if (version === 0) {
                    // Migration from version 0 to 1
                    return { settings: defaultSettings, isHydrated: true };
                }
                return persistedState as SettingsState;
            },
            onRehydrateStorage: () => (state) => {
                // Set hydrated flag when rehydration completes
                if (state) {
                    state.isHydrated = true;
                }
            },
            // Immediately set hydrated for new users (no persisted state)
            partialize: (state) => ({ settings: state.settings }),
        }
    )
);

// Immediately mark as hydrated for initial state
useSettingsStore.setState({ isHydrated: true });

export default useSettingsStore;
