
import { defineStore } from "pinia"
export const useSessionStore = defineStore("sessionStore", {
  state: () => ({ sessions: {} }),
  getters: {
    sessionsByDog: (state) => (dogId) =>
      Object.values(state.sessions).filter(s => s.dogId === dogId)
        .sort((a,b) => new Date(b.date) - new Date(a.date))
  },
  actions: {
    addSession(data) {
      const id = `sess_${crypto.randomUUID().slice(0,8)}`
      this.sessions[id] = {
        id, dogId: data.dogId, date: new Date().toISOString(),
        type: data.type || "Private", focus: data.focus || "",
        observations: data.observations || "", nextSteps: data.nextSteps || "",
        tags: data.tags || []
      }
      return id
    }
  }
})
