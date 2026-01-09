import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCurrencyValue } from '../utils/currencyHelper';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    // Mode: 'INR' (Crores/Lakhs), 'Standard' (Millions/Thousands), 'Points'
    const [currencyMode, setCurrencyMode] = useState(localStorage.getItem('currencyMode') || 'INR');

    useEffect(() => {
        localStorage.setItem('currencyMode', currencyMode);
    }, [currencyMode]);

    const formatCurrency = (amount) => {
        return formatCurrencyValue(amount, currencyMode);
    };

    return (
        <CurrencyContext.Provider value={{ currencyMode, setCurrencyMode, formatCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    return useContext(CurrencyContext);
};
