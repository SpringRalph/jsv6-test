import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Bump this version whenever the shape of ButtonStyleState changes.
// The migrate function below will reset to defaults on version mismatch.
const STORE_VERSION = 3;

export type ButtonColor =
    | "paypal-gold"
    | "paypal-white"
    | "paypal-black"
    | "paypal-blue";

export type ButtonType =
    | "pay"
    | "buy-now"
    | "checkout"
    | "donate"
    | "subscribe";

export type BorderRadiusPreset = "none" | "sm" | "pill";

const BORDER_RADIUS_MAP: Record<BorderRadiusPreset, string> = {
    none: "0px",
    sm: "4px",
    pill: "55px",
};

export { BORDER_RADIUS_MAP };

export interface ButtonStyleState {
    color: ButtonColor;
    type: ButtonType;
    borderRadiusPreset: BorderRadiusPreset;
    width: number;
    height: number;
}

interface ButtonStyleStore extends ButtonStyleState {
    setProp: <K extends keyof ButtonStyleState>(
        key: K,
        value: ButtonStyleState[K]
    ) => void;
    reset: () => void;
}

const defaultState: ButtonStyleState = {
    color: "paypal-gold",
    type: "pay",
    borderRadiusPreset: "pill",
    width: 350,
    height: 45,
};

export const useButtonStyleStore = create<ButtonStyleStore>()(
    persist(
        (set) => ({
            ...defaultState,
            setProp: (key, value) => set({ [key]: value }),
            reset: () => set(defaultState),
        }),
        {
            name: "pp-v6-button-style",
            storage: createJSONStorage(() => localStorage),
            version: STORE_VERSION,
            migrate(persisted: unknown, version: number) {
                if (version !== STORE_VERSION) {
                    // Shape changed — reset to defaults to avoid runtime errors
                    return { ...defaultState };
                }
                return persisted as ButtonStyleState;
            },
        }
    )
);
