import { createContext, useContext } from 'react';

// Night mode inside the canvas: lights, sky and window glow read it from here.
export const NightContext = createContext(false);
export const useNight = () => useContext(NightContext);
