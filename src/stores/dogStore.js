import { defineStore } from "pinia"

export const useDogStore = defineStore("dogStore", {
  state: () => ({
    dogs: {
      dog_001: {
        id: "dog_001",
        clientId: "client_001",
        name: "Rico",
        breed: "GSD",
        age: 3,
        tags: ["reactive", "high-drive"],

        trainingProgram: {
          name: "Foundation Obedience",
          description: "Building a solid obedience foundation with focus on impulse control and handler engagement.",
          startDate: "2026-01-15",
          goals: "- Reliable sit, heel, and place on first cue\n- Leash walking without tension\n- Calm greetings with strangers"
        },

        scenarios: [
          { id: "sc_001", name: "Sit",        rank: 4, max: 5, notes: "Solid in low-distraction. Working on proofing." },
          { id: "sc_002", name: "Heel",        rank: 2, max: 5, notes: "Needs work on left turns and duration." },
          { id: "sc_003", name: "Place",       rank: 3, max: 5, notes: "Getting better on the cot, needs distance." },
          { id: "sc_004", name: "Down",        rank: 3, max: 5, notes: "Drops well from sit, slow from stand." },
          { id: "sc_005", name: "Come",        rank: 2, max: 5, notes: "Good in yard, unreliable with distractions." }
        ],

        trainingLogs: [
          {
            id: "log_001",
            publishedAt: "2026-06-10T14:22:00.000Z",
            performedOn: "2026-06-10",
            notes: "Focused heel work in parking lot. Rico showed great improvement maintaining position. Ended on a strong note with a 30-second place hold.",
            duration: "45 min"
          },
          {
            id: "log_002",
            publishedAt: "2026-06-07T09:15:00.000Z",
            performedOn: "2026-06-07",
            notes: "Intro to place board. Took about 10 reps to understand. High drive today — used tug as reward.",
            duration: "30 min"
          }
        ]
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
        tags,
        trainingProgram: null,
        scenarios: [],
        trainingLogs: []
      }

      this.activeDogId = id
      return id
    },

    removeDog(id) {
      if (!this.dogs[id]) return
      delete this.dogs[id]

      if (this.activeDogId === id) {
        const remaining = Object.keys(this.dogs)
        this.activeDogId = remaining.length ? remaining[0] : null
      }
    },

    // ── Training Program ───────────────────────────────────────────
    updateTrainingProgram(dogId, program) {
      if (!this.dogs[dogId]) return
      this.dogs[dogId].trainingProgram = { ...program }
    },

    // ── Scenarios ──────────────────────────────────────────────────
    addScenario(dogId, { name, notes = "" }) {
      if (!this.dogs[dogId]) return
      const id = `sc_${crypto.randomUUID().slice(0, 8)}`
      if (!this.dogs[dogId].scenarios) this.dogs[dogId].scenarios = []
      this.dogs[dogId].scenarios.push({ id, name, rank: 0, max: 5, notes })
      return id
    },

    updateScenarioRank(dogId, scenarioId, rank) {
      const dog = this.dogs[dogId]
      if (!dog?.scenarios) return
      const sc = dog.scenarios.find(s => s.id === scenarioId)
      if (sc) sc.rank = Math.max(0, Math.min(5, rank))
    },

    updateScenarioNotes(dogId, scenarioId, notes) {
      const dog = this.dogs[dogId]
      if (!dog?.scenarios) return
      const sc = dog.scenarios.find(s => s.id === scenarioId)
      if (sc) sc.notes = notes
    },

    removeScenario(dogId, scenarioId) {
      const dog = this.dogs[dogId]
      if (!dog?.scenarios) return
      dog.scenarios = dog.scenarios.filter(s => s.id !== scenarioId)
    },

    // ── Training Logs ──────────────────────────────────────────────
    addTrainingLog(dogId, { performedOn, notes, duration }) {
      if (!this.dogs[dogId]) return
      const id = `log_${crypto.randomUUID().slice(0, 8)}`
      if (!this.dogs[dogId].trainingLogs) this.dogs[dogId].trainingLogs = []
      this.dogs[dogId].trainingLogs.unshift({
        id,
        publishedAt: new Date().toISOString(),
        performedOn,
        notes,
        duration: duration || ""
      })
      return id
    },

    removeTrainingLog(dogId, logId) {
      const dog = this.dogs[dogId]
      if (!dog?.trainingLogs) return
      dog.trainingLogs = dog.trainingLogs.filter(l => l.id !== logId)
    }
  }
})
