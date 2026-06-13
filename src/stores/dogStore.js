import { defineStore } from "pinia"

export const useDogStore = defineStore("dogStore", {
  state: () => ({
    dogs: {
      dog_001: {
        id: "dog_001",
        clientId: "client_001",
        name: "Rico",
        breed: "GSD",
        tags: ["reactive", "high-drive"]
      }
    },
    activeDogId: "dog_001"
  }),

  getters: {
    activeDog(state) {
      return state.dogs[state.activeDogId] || null
    },
    allDogs: (state) => Object.values(state.dogs)
  },

  actions: {
    setActiveDog(id) {
      if (this.dogs[id]) this.activeDogId = id
    },

    addDog({ name, breed, age = null, tags = [], clientId = "client_001" }) {
      const id = `dog_${crypto.randomUUID().slice(0, 8)}`

      this.dogs[id] = {
        id,
        clientId,
        name,
        breed: breed || "Unknown",
        age,
        tags
      }

      // Auto-select the new dog
      this.activeDogId = id

      return id
    },

    removeDog(id) {
      if (!this.dogs[id]) return
      delete this.dogs[id]

      // If we removed the active dog, reset or pick the first remaining
      if (this.activeDogId === id) {
        const remaining = Object.keys(this.dogs)
        this.activeDogId = remaining.length ? remaining[0] : null
      }
    }
  }
})
