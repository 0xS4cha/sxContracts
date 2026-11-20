export type ContractStatus = 'open' | 'taken' | 'done' | 'cancelled' | 'expired'

export interface ContractParty {
  name: string
  isMe: boolean
}

export interface Contract {
  id: number
  title: string
  description: string
  category: string
  reward: number
  status: ContractStatus
  poster: ContractParty
  contractor?: ContractParty | null
  location?: { x: number; y: number; z: number } | null
  createdAt: number
  expiresAt: number
  takenAt?: number | null
  closedAt?: number | null
}

export interface ContractCategory {
  id: string
  icon: string
}

export interface BoardSettings {
  categories: ContractCategory[]
  minReward: number
  maxReward: number
  fee: number
  durations: number[]
  titleLength: { min: number; max: number }
  descriptionLength: number
}

export interface BoardData {
  me: { name: string; admin: boolean }
  money: boolean
  settings: BoardSettings
  open: Contract[]
  posted: Contract[]
  taken: Contract[]
  stats: { earned: number }
  now: number
}

export interface CreateContractPayload {
  title: string
  description: string
  category: string
  reward: number
  duration: number
  attachLocation: boolean
}

export type BoardCategory = 'board' | 'posted' | 'taken'

export interface ContractPaper {
  id: number
  title: string
  description: string
  category: string
  reward: number
  status: ContractStatus
  poster: string
  contractor?: string | null
  location?: { x: number; y: number; z: number } | null
  place?: { street: string; zone: string } | null
  createdAt: number
  expiresAt: number
  takenAt?: number | null
  closedAt?: number | null
}

export interface ShowPaperData {
  paper: ContractPaper
  standalone: boolean
}
