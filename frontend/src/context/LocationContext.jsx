import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

const PRESET_LOCATIONS = [
  { name: 'Sangamner', lat: 19.5679, lng: 74.2153 },
  { name: 'Kopargaon', lat: 19.8906, lng: 74.4789 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
];

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    const saved = localStorage.getItem('getsy_location');
    return saved ? JSON.parse(saved) : null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const setLocation = (loc) => {
    setLocationState(loc);
    if (loc) {
      localStorage.setItem('getsy_location', JSON.stringify(loc));
    } else {
      localStorage.removeItem('getsy_location');
    }
  };

  const promptLocation = (onSuccessAction) => {
    if (location) {
      if (onSuccessAction) onSuccessAction(location);
      return;
    }
    setPendingAction(() => onSuccessAction);
    setIsModalOpen(true);
  };

  const confirmLocation = (loc) => {
    setLocation(loc);
    setIsModalOpen(false);
    if (pendingAction) {
      pendingAction(loc);
      setPendingAction(null);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation: confirmLocation,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        promptLocation,
        PRESET_LOCATIONS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
