export interface Registration {
  nickname: string
  originalNickname: string
  registrationDateTime: Date,
  isStaff?: boolean
}

export type LapTime = string;
export type IsoDate = string;
export type GroupLetter = string;
export type SessionType = 'qualifications' | 'race';

export interface QualificationEntry {
  position: number;
  kartNumber: number;
  driver: string;
  laps: number;
  bestLap: LapTime;
  gap: string | null;
  avgLap?: LapTime;
}

export interface RaceEntry {
  position: number;
  kartNumber: number;
  driver: string;
  laps: number;
  gap: string | null;
  bestLap: LapTime;
}

export interface Session {
  group: GroupLetter;
  type: SessionType;
  entries: QualificationEntry[] | RaceEntry[];
}

export interface RaceEvent {
  date: IsoDate;
  label: string;
  sessions: Session[];
  upcoming?: boolean;
}

export interface Season {
  year: number;
  events: RaceEvent[];
}

export interface TotalResultEntry {
  position: number;
  nickname: string;
  scorePercent: number;
  racesCount: number;
  raceScores: Record<IsoDate, number | null>;
}

export interface AppData {
  generatedAt: string;
  totalResults: TotalResultEntry[];
  seasons: Season[];
}

export interface RaceScore {
  date: IsoDate;
  group: GroupLetter;
  points: number;
  counted: boolean;
}

export interface ClassificationEntry {
  position: number;
  driver: string;
  totalPoints: number;
  racesCount: number;
  raceScores: RaceScore[];
}

export interface GridEntry {
  registration: Registration
  standing: TotalResultEntry | undefined
}

export interface PartitionResult {
  grid: GridEntry[]
  reserve: GridEntry[]
}
