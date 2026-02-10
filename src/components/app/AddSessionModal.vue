
<script setup>
import { reactive } from "vue"
import { useUiStore } from "@/stores/uiStore"
import { useDogStore } from "@/stores/dogStore"
import { useSessionStore } from "@/stores/sessionStore"
const ui = useUiStore()
const dogs = useDogStore()
const sessions = useSessionStore()
const form = reactive({ type: "Private", focus: "", observations: "", nextSteps: "", tags: "" })
function close() { ui.closeModal() }
function save() {
  if (!dogs.activeDogId) { ui.notify("Pick a dog first.", "error"); return }
  const tags = form.tags.split(",").map(s => s.trim()).filter(Boolean)
  sessions.addSession({ dogId: dogs.activeDogId, type: form.type, focus: form.focus, observations: form.observations, nextSteps: form.nextSteps, tags })
  ui.notify("Session added.", "success")
  close()
  form.type="Private"; form.focus=""; form.observations=""; form.nextSteps=""; form.tags=""
}
</script>
<template>
<div class="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" @click.self="close">
  <div class="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <div class="text-lg font-semibold">Add Training Session</div>
        <div class="text-sm text-zinc-500 dark:text-zinc-400">
          For: <span class="font-medium">{{ dogs.activeDog?.name || "No dog selected" }}</span>
        </div>
      </div>
      <button class="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800" @click="close">Close</button>
    </div>
    <div class="grid gap-3">
      <label class="grid gap-1 text-sm">
        <span class="text-zinc-600 dark:text-zinc-300">Type</span>
        <select v-model="form.type" class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <option>Private</option><option>Evaluation</option><option>Board & Train</option><option>Group</option>
        </select>
      </label>
      <label class="grid gap-1 text-sm">
        <span class="text-zinc-600 dark:text-zinc-300">Tags (comma-separated)</span>
        <input v-model="form.tags" class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950" placeholder="loose-leash, reactivity" />
      </label>
      <label class="grid gap-1 text-sm">
        <span class="text-zinc-600 dark:text-zinc-300">Focus</span>
        <input v-model="form.focus" class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950" placeholder="What was today about?" />
      </label>
      <label class="grid gap-1 text-sm">
        <span class="text-zinc-600 dark:text-zinc-300">Observations</span>
        <textarea v-model="form.observations" rows="3" class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950" />
      </label>
      <label class="grid gap-1 text-sm">
        <span class="text-zinc-600 dark:text-zinc-300">Next steps</span>
        <textarea v-model="form.nextSteps" rows="3" class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950" />
      </label>
      <div class="mt-2 flex justify-end gap-2">
        <button class="rounded-2xl border border-zinc-200 px-4 py-2 text-sm" @click="close">Cancel</button>
        <button class="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" @click="save">Save Session</button>
      </div>
    </div>
  </div>
</div>
</template>
