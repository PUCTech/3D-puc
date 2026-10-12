import { createContext, useContext } from 'react';
import type { Era } from '@/lib/campus';

// Which campus the canvas shows: today's, or the 1943 institute. Buildings, rooms, furniture and the city read it.
export const EraContext = createContext<Era>('hoje');
export const useEra = () => useContext(EraContext);
