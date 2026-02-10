
import { defineStore } from "pinia"
export const useUiStore = defineStore("uiStore", {
  state: () => ({ sidebarOpen: true, darkMode: false, activeModal: null, notification: null }),
  actions: {
    toggleSidebar() { this.sidebarOpen = !this.sidebarOpen },
    setDarkMode(v) { this.darkMode = !!v },
    openModal(name) { this.activeModal = name },
    closeModal() { this.activeModal = null },
    notify(message, type = "info") {
      this.notification = { message, type }
      setTimeout(() => { if (this.notification?.message === message) this.notification = null }, 2500)
    }
  }
})
