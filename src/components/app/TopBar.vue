
<script setup>
import { computed } from "vue"
import { useUiStore } from "@/stores/uiStore"
const ui = useUiStore()
const darkLabel = computed(() => (ui.darkMode ? "Light" : "Dark"))
</script>
<template>
<header class="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
    <div class="flex items-center gap-3">
      <button class="rounded-xl border border-zinc-200 px-3 py-2 text-sm" @click="ui.toggleSidebar()">☰</button>
      <div>
        <div class="text-sm font-semibold">Leash Legacy K9</div>
        <div class="text-xs text-zinc-500 dark:text-zinc-400">Trainer Dashboard</div>
      </div>
    </div>
    <button class="rounded-xl border border-zinc-200 px-3 py-2 text-sm" @click="ui.setDarkMode(!ui.darkMode)">
      {{ darkLabel }}
    </button>
  </div>
</header>
</template>
