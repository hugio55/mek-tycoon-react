import { UserMek } from '../types';

export const USER_MEKS: UserMek[] = [
  { id: "1234", name: "Mek #1234", headSlot: "Gold", bodySlot: "Chrome", traitSlot: "Wings", headFilled: true, bodyFilled: true, traitFilled: false },
  { id: "2468", name: "Mek #2468", headSlot: null, bodySlot: "Iron", traitSlot: "Blasters", headFilled: false, bodyFilled: true, traitFilled: true },
  { id: "3691", name: "Mek #3691", headSlot: "Nuke", bodySlot: null, traitSlot: null, headFilled: true, bodyFilled: false, traitFilled: false },
  { id: "0013", name: "Mek #0013", headSlot: null, bodySlot: null, traitSlot: "Laser", headFilled: false, bodyFilled: false, traitFilled: true },
  { id: "5555", name: "Mek #5555", headSlot: "Mesh", bodySlot: "Luxury", traitSlot: null, headFilled: true, bodyFilled: true, traitFilled: false },
  { id: "7777", name: "Mek #7777", headSlot: null, bodySlot: null, traitSlot: null, headFilled: false, bodyFilled: false, traitFilled: false },
];

export const AVAILABLE_RECIPES = [
  'Accordion', 'Rolleiflex', 'Turret', 'Polaroid', 
  'Clean', 'Gatling', 'Drill', 'Brain', 'Gummy',
  'Defense', 'Assault', 'Tactical', 'Instant', 'Vintage',
  'Cartoon', 'Irons', 'Luxury', 'Stone',
  'Wings', 'Weapons', 'Laser', 'Instruments'
];