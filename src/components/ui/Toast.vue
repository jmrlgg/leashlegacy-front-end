
<script setup>
import { computed } from "vue"
import { useUiStore } from "@/stores/uiStore"
const ui = useUiStore()
const tone = computed(() => {
  const t = ui.notification?.type
  if (t === "success") return "border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950/40 dark:text-green-100"
  if (t === "error") return "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100"
  return "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
})
</script>
<template>
  <div v-if="ui.notification" class="fixed bottom-4 right-4 z-50 max-w-sm">
    <div :class="tone" class="rounded-2xl border px-4 py-3 shadow-lg">
      <div class="text-sm font-medium">{{ ui.notification.message }}</div>
    </div>
  </div>
</template>
