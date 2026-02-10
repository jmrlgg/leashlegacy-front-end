
export interface Dog {
  id: string
  clientId: string
  name: string
  breed: string
  tags: string[]
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
