import { useState, useEffect, useRef } from "react";

const ENABLED_KEY = "draftAutoSaveEnabled";
const DATA_PREFIX = "draftData:";
const TTL_MS = 3 * 60 * 60 * 1000; // ৩ ঘণ্টা (শেষ change থেকে)
const EVENT = "draft-toggle-change";

export const isDraftEnabled = () => localStorage.getItem(ENABLED_KEY) === "true";

export const clearDraft = (key) => localStorage.removeItem(DATA_PREFIX + key);

export const clearAllDrafts = () => {
    Object.keys(localStorage)
        .filter((k) => k.startsWith(DATA_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
};

export const setDraftEnabled = (value) => {
    localStorage.setItem(ENABLED_KEY, String(value));
    if (!value) clearAllDrafts();
    window.dispatchEvent(new Event(EVENT));
};

const readDraft = (key) => {
    try {
        const raw = localStorage.getItem(DATA_PREFIX + key);
        if (!raw) return undefined;
        const { value, savedAt } = JSON.parse(raw);
        if (Date.now() - savedAt > TTL_MS) {
            localStorage.removeItem(DATA_PREFIX + key);
            return undefined;
        }
        return value;
    } catch {
        return undefined;
    }
};

// useState এর মতোই কাজ করে, toggle ON থাকলে localStorage এ save/restore করে
const useDraftState = (key, initialValue) => {
    const [state, setState] = useState(() => {
        if (isDraftEnabled()) {
            const saved = readDraft(key);
            if (saved !== undefined) return saved;
        }
        return typeof initialValue === "function" ? initialValue() : initialValue;
    });
    const [enabled, setEnabled] = useState(isDraftEnabled());
    const firstRun = useRef(true);

    useEffect(() => {
        const handler = () => setEnabled(isDraftEnabled());
        window.addEventListener(EVENT, handler);
        return () => window.removeEventListener(EVENT, handler);
    }, []);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        if (!enabled) return;
        try {
            localStorage.setItem(
                DATA_PREFIX + key,
                JSON.stringify({ value: state, savedAt: Date.now() })
            );
        } catch (e) {
            console.error("Draft save failed:", e);
        }
    }, [state, enabled, key]);

    return [state, setState];
};

export default useDraftState;