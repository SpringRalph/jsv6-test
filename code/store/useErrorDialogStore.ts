"use client";

import { create } from "zustand";

interface ShowPayload {
  title: string;
  message: string;
  details?: unknown;
}

interface ErrorDialogState {
  open: boolean;
  title: string;
  message: string;
  details: unknown;
  show: (payload: ShowPayload) => void;
  hide: () => void;
}

export const useErrorDialogStore = create<ErrorDialogState>((set) => ({
  open: false,
  title: "",
  message: "",
  details: undefined,
  show: ({ title, message, details }) =>
    set({ open: true, title, message, details }),
  hide: () => set({ open: false }),
}));
