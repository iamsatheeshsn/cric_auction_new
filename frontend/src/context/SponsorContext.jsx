
import React, { createContext, useContext, useState, useEffect } from 'react';

const SponsorContext = createContext();

export const useSponsors = () => {
    return useContext(SponsorContext);
};

export const SponsorProvider = ({ children }) => {
    const [sponsors, setSponsors] = useState([]);

    useEffect(() => {
        const storedSponsors = localStorage.getItem('tournament_sponsors');
        if (storedSponsors) {
            try {
                setSponsors(JSON.parse(storedSponsors));
            } catch (error) {
                console.error("Failed to parse sponsors", error);
            }
        }
    }, []);

    const addSponsor = (sponsor) => {
        const updated = [...sponsors, { ...sponsor, id: Date.now().toString() }];
        setSponsors(updated);
        localStorage.setItem('tournament_sponsors', JSON.stringify(updated));
    };

    const removeSponsor = (id) => {
        const updated = sponsors.filter(s => s.id !== id);
        setSponsors(updated);
        localStorage.setItem('tournament_sponsors', JSON.stringify(updated));
    };

    const updateSponsorOrder = (newOrder) => {
        setSponsors(newOrder);
        localStorage.setItem('tournament_sponsors', JSON.stringify(newOrder));
    };

    return (
        <SponsorContext.Provider value={{ sponsors, addSponsor, removeSponsor, updateSponsorOrder }}>
            {children}
        </SponsorContext.Provider>
    );
};
