'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';

const translations: Record<string, any> = { en, fr, ar };

type LanguageContextType = {
    language: string;
    setLanguage: (language: string) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState('en');
    const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') || 'en';
        setLanguageState(savedLanguage);
        const newDir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
        setDir(newDir);
        document.documentElement.lang = savedLanguage;
        document.documentElement.dir = newDir;
    }, []);

    const setLanguage = (lang: string) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        const newDir = lang === 'ar' ? 'rtl' : 'ltr';
        setDir(newDir);
        document.documentElement.lang = lang;
        document.documentElement.dir = newDir;
        // Force a re-render to apply direction changes
        window.location.reload();
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let result = translations[language];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                // Fallback to English if translation is missing
                let fallback = translations['en'];
                for (const fk of keys) {
                    fallback = fallback?.[fk];
                }
                return fallback || key;
            }
        }
        return result || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
