/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  LIVE = "LIVE",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED"
}

export enum PredictionStatus {
  WON = "WON",
  LOST = "LOST",
  VOID = "VOID",
  HALF_WON = "HALF_WON",
  HALF_LOST = "HALF_LOST",
  UNKNOWN = "UNKNOWN"
}

export enum RiskLevel {
  LOW = "Nízke riziko",
  MEDIUM = "Stredné riziko",
  HIGH = "Vysoké riziko"
}

export enum PlacementAdvice {
  TIKET = "Pridať na tiket pre-match",
  LIVE_TRACK = "Sledovať live a staviť v priebehu"
}

export interface MatchLiveStats {
  possession?: string; // e.g. "55% - 45%"
  shots?: string; // e.g. "12 - 8"
  shotsOnTarget?: string; // e.g. "5 - 3"
  corners?: string; // e.g. "6 - 4"
  fouls?: string; // e.g. "10 - 12"
  yellowCards?: string; // e.g. "1 - 2"
  redCards?: string; // e.g. "0 - 0"
}

export interface Match {
  id: string;
  sport: string;       // e.g. "Futbal", "Hokej", "Tenis"
  league: string;      // e.g. "Niké Liga", "NHL", "A-Skupina MS"
  homeTeam: string;
  awayTeam: string;
  dateTime: string;    // ISO string or YYYY-MM-DD HH:mm
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  currentPeriod?: string; // e.g. "1. polčas", "2. polčas", "3. tretina", "Koniec"
  currentMinute?: number;
  liveStats?: MatchLiveStats;
  headToHead?: string; // e.g. "Posledné zápasy: 2:1, 1:1, 0:3"
  homeForm?: string;   // e.g. "V-V-R-P-V"
  awayForm?: string;   // e.g. "P-R-V-V-P"
}

export interface OddItem {
  outcome: string; // e.g. "1", "X", "2", "Góly nad 2.5", "Góly pod 2.5", "Oba dajú gól - Áno", "Oba dajú gól - Nie", "1X", "X2"
  odds: number;
}

export interface MarketOdds {
  marketName: string; // e.g. "Zápas 1X2", "Počet gólov nad/pod", "Oba tímy dajú gól", "Dvojitá šanca"
  odds: OddItem[];
}

export interface OddsSnapshot {
  id: string;
  matchId: string;
  timestamp: string; // ISO string of when it was fetched
  bookmaker: string; // e.g. "Niké", "Fortuna", "Tipsport"
  markets: MarketOdds[];
}

export interface AIPrediction {
  id: string;
  matchId: string;
  matchName: string; // e.g. "Trnava vs Slovan"
  sport: string;
  league: string;
  dateTime: string;
  marketName: string; // e.g. "Oba tímy dajú gól"
  recommendedTip: string; // e.g. "Áno"
  recommendedOdds: number; // e.g. 1.85
  openingOdds: number; // odds at prediction time
  closingOdds?: number; // odds before match start
  riskLevel: RiskLevel;
  reasons: string[]; // Bulgarian/Slovak bullet points
  keyDataUsed: {
    formRatio?: string;
    headToHeadSentiment?: string;
    importanceOfMatch?: string;
    liveStatsInfluence?: string;
  };
  confidenceScore: number; // 0 to 100
  placementAdvice: PlacementAdvice;
  createdAt: string; // ISO timestamp
  status: PredictionStatus;
  evaluationReason?: string; // Description of outcome evaluation
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  source: string; // e.g. "Tipsport API simulator", "Fortuna feed parser"
  status: "SUCCESS" | "ERROR";
  message: string;
  itemsProcessed: number;
}
