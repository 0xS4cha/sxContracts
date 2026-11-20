import type { BoardData } from '../types/contracts'

const now = Math.floor(Date.now() / 1000)

export const MOCK_BOARD: BoardData = {
  me: { name: 'Lucas Martin', admin: true },
  money: true,
  settings: {
    categories: [
      { id: 'delivery', icon: 'package' },
      { id: 'transport', icon: 'car' },
      { id: 'escort', icon: 'shield' },
      { id: 'recovery', icon: 'key-round' },
      { id: 'protection', icon: 'swords' },
      { id: 'other', icon: 'clipboard-list' },
    ],
    minReward: 100,
    maxReward: 500000,
    fee: 0.05,
    durations: [2, 6, 24, 72],
    titleLength: { min: 4, max: 60 },
    descriptionLength: 600,
  },
  open: [
    {
      id: 12, title: 'Deliver 3 crates to Paleto', description: 'Pick up the crates behind the Sandy Shores airfield hangar and drop them at the Paleto Bay sawmill. No questions asked.',
      category: 'delivery', reward: 12500, status: 'open', poster: { name: 'Marcus Vance', isMe: false },
      location: { x: 1724.1, y: 3289.4, z: 41.1 }, createdAt: now - 1800, expiresAt: now + 5 * 3600,
    },
    {
      id: 13, title: 'Bring back my Sultan RS', description: 'Stolen last night in Vespucci, plate 82SXA174. Return it to the Legion Square garage.',
      category: 'recovery', reward: 8000, status: 'open', poster: { name: 'Sean Johnson', isMe: false },
      location: null, createdAt: now - 7200, expiresAt: now + 20 * 3600,
    },
    {
      id: 14, title: 'Escort a convoy to the docks', description: 'Two vans, one armored car. Bring your own vehicle and stay close.',
      category: 'escort', reward: 30000, status: 'open', poster: { name: 'Lucas Martin', isMe: true },
      location: { x: 1200.0, y: -2950.0, z: 5.9 }, createdAt: now - 600, expiresAt: now + 3600,
    },
    {
      id: 15, title: 'Guard the shop tonight', description: '',
      category: 'protection', reward: 4500, status: 'open', poster: { name: 'Wei Shen', isMe: false },
      location: null, createdAt: now - 300, expiresAt: now + 70 * 3600,
    },
  ],
  posted: [
    {
      id: 14, title: 'Escort a convoy to the docks', description: 'Two vans, one armored car.', category: 'escort', reward: 30000, status: 'open',
      poster: { name: 'Lucas Martin', isMe: true }, location: { x: 1200.0, y: -2950.0, z: 5.9 }, createdAt: now - 600, expiresAt: now + 3600,
    },
    {
      id: 9, title: 'Move my boat to Del Perro', description: '', category: 'transport', reward: 6000, status: 'taken',
      poster: { name: 'Lucas Martin', isMe: true }, contractor: { name: 'Tyrone King', isMe: false }, createdAt: now - 9000, expiresAt: now + 3000, takenAt: now - 4000,
    },
    {
      id: 4, title: 'Find my lost phone', description: '', category: 'other', reward: 500, status: 'expired',
      poster: { name: 'Lucas Martin', isMe: true }, createdAt: now - 90000, expiresAt: now - 3600, closedAt: now - 3600,
    },
  ],
  taken: [
    {
      id: 11, title: 'Pick up a package at the airport', description: 'Hangar 4, ask for Nico.', category: 'delivery', reward: 9500, status: 'taken',
      poster: { name: 'Nico Salazar', isMe: false }, contractor: { name: 'Lucas Martin', isMe: true },
      location: { x: -1037.0, y: -2737.0, z: 20.2 }, createdAt: now - 5000, expiresAt: now + 4 * 3600, takenAt: now - 2000,
    },
    {
      id: 7, title: 'Tow a car to the scrapyard', description: '', category: 'transport', reward: 2500, status: 'done',
      poster: { name: 'Darnell Carter', isMe: false }, contractor: { name: 'Lucas Martin', isMe: true }, createdAt: now - 200000, expiresAt: now - 100000, closedAt: now - 150000,
    },
  ],
  stats: { earned: 2500 },
  now,
}
