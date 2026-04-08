export interface LeaderboardAgent {
  rank: number;
  name: string;
  ceaNumber: string;
  agency: string;
  transactions: number;
  year: number;
}

export interface Transaction {
  date: string;
  propertyType: string;
  transactionType: string;
  role: string;
  location: string;
}

export interface AgentProfile {
  name: string;
  ceaNumber: string;
  agency: string;
  phone?: string;
  email?: string;
  registrationStart?: string;
  registrationEnd?: string;
  totalTransactions: number;
  transactions: Transaction[];
}

export interface Movement {
  agentName: string;
  ceaNumber: string;
  previousAgency?: string;
  newAgency?: string;
  date: string;
  type: 'agency_change' | 'new_registration' | 'deregistration';
}

export interface Property {
  slug: string;
  name: string;
  transactions: Transaction[];
}
