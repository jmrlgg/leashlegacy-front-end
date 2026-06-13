
export interface Dog {
  id: string
  clientId: string
  name: string
  breed: string
  age?: number | null
  tags: string[]
  trainingProgram?: TrainingProgram | null
  scenarios?: Scenario[]
  trainingLogs?: TrainingLog[]
}

export interface TrainingProgram {
  name: string
  description: string
  startDate: string       // ISO date string
  goals: string           // free-form text / bullet list
}

export interface Scenario {
  id: string
  name: string            // e.g. "Sit", "Heel", "Place"
  rank: number            // 0–5
  max: number             // always 5
  notes: string
}

export interface TrainingLog {
  id: string
  publishedAt: string     // ISO – auto-stamped when saved
  performedOn: string     // ISO date – user selects
  notes: string
  duration: string        // e.g. "45 min" – free text
}

export interface Session {
  id: string
  dogId: string
  date: string
  type: string
  focus: string
  observations: string
  nextSteps: string
  tags: string[]
}
