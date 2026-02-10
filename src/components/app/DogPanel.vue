
<script setup>
import { computed } from "vue"
import { useUiStore } from "@/stores/uiStore"
import { useDogStore } from "@/stores/dogStore"
import { useSessionStore } from "@/stores/sessionStore"
const ui = useUiStore()
const dogs = useDogStore()
const sessionStore = useSessionStore()
const sessions = computed(() => (dogs.activeDogId ? sessionStore.sessionsByDog(dogs.activeDogId) : []))
function openAddSession() {
  if (!dogs.activeDogId) { ui.notify("Select a dog first.", "error"); return }
  ui.openModal("addSession")
}
</script>
<template>
<section class="flex-1">
  <div class="mx-auto max-w-6xl p-4">
    <div class="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="text-xl font-semibold">{{ dogs.activeDog?.name || "Select a dog" }}</div>
          <div class="text-sm text-zinc-500 dark:text-zinc-400">
            {{ dogs.activeDog ? dogs.activeDog.breed : "Pick a dog from the sidebar." }}
          </div>
        </div>
        <button class="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          @click="openAddSession">+ Add Session</button>
      </div>
      <div class="mt-6">
        <div class="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Sessions</div>
        <div v-if="!sessions.length" class="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No sessions yet. Add one to start tracking progress.
        </div>
        <div v-else class="space-y-3">
          <article v-for="s in sessions" :key="s.id"
            class="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div class="font-semibold">{{ s.type }} • {{ s.focus || "No focus set" }}</div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ new Date(s.date).toLocaleString() }}</div>
            <div class="mt-2 text-sm text-zinc-800 dark:text-zinc-200">{{ s.observations || "—" }}</div>
          </article>
        </div>
      </div>
    </div>
  </div>
</section>
</template>
