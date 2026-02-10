<script setup>
import { onMounted } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { useUiStore } from "@/stores/uiStore"

import TopBar from "./TopBar.vue"
import Sidebar from "./Sidebar.vue"
import DogPanel from "./DogPanel.vue"
import Toast from "../ui/Toast.vue"
import AddSessionModal from "./AddSessionModal.vue"
import AddDogModal from "./AddDogModal.vue"



// Activate Pinia for Astro
const pinia = createPinia()
setActivePinia(pinia)

// Safe to create the store now
const ui = useUiStore()

// 👉 ONLY run browser code AFTER mount (client-side)
onMounted(() => {
  watch(
    () => ui.darkMode,
    (val) => {
      document.documentElement.classList.toggle("dark", val)
    },
    { immediate: true }
  )
})
</script>


<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
    <TopBar />
    <div class="flex">
      <Sidebar />
      <DogPanel />
    </div>
    <AddSessionModal v-if="ui.activeModal === 'addSession'" />
    <AddDogModal v-if="ui.activeModal === 'addDog'" />

    <Toast />
  </div>
</template>
