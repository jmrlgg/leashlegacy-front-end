const STORAGE_KEY = "llk9_dogStore"

/**
 * Pinia plugin — persists dogStore state to localStorage.
 * Attach to the Pinia instance before any store is used:
 *   pinia.use(dogPersistPlugin)
 */
export function dogPersistPlugin({ store }) {
  if (store.$id !== "dogStore") return

  // ── Restore ────────────────────────────────────────────────────────
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const saved = JSON.parse(raw)
      // Merge saved data into the store (preserves reactivity)
      store.$patch(saved)
    } catch {
      // Corrupted data — start fresh
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // ── Persist on every mutation ──────────────────────────────────────
  store.$subscribe((_mutation, state) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          dogs: state.dogs,
          activeDogId: state.activeDogId
        })
      )
    } catch {
      // Storage quota exceeded or private browsing — silently skip
    }
  })
}
