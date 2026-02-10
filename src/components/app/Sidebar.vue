

<script setup>
import { computed } from "vue"
import { useUiStore } from "@/stores/uiStore"
import { useDogStore } from "@/stores/dogStore"
const ui = useUiStore()
const dogs = useDogStore()
const classes = computed(() => ui.sidebarOpen ? "w-72" : "w-0 overflow-hidden")
</script>
<template>
<aside :class="classes" class="h-[calc(100vh-57px)] border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
  <div class="p-4">
<div class="mb-3 flex items-center justify-between">
  <div class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
    Dogs
  </div>
  <button
    class="rounded-xl border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
    @click="ui.openModal('addDog')"
  >
    + Add
  </button>
</div>
    <div class="space-y-2">
      <button v-for="d in dogs.allDogs" :key="d.id"
        class="w-full rounded-2xl border px-3 py-3 text-left transition"
        :class="d.id === dogs.activeDogId ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-200 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'"
        @click="dogs.setActiveDog(d.id)">
        <div class="flex items-center justify-between gap-2">
          <div class="font-medium">{{ d.name }}</div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ d.breed }}</div>
        </div>
        <div class="mt-2 flex flex-wrap gap-1">
          <span v-for="t in d.tags" :key="t"
            class="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {{ t }}
          </span>
        </div>
      </button>
    </div>
  </div>
</aside>
</template>
