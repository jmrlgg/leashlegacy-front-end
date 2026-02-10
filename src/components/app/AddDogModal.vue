<script setup>
import { reactive } from "vue"
import { useUiStore } from "@/stores/uiStore"
import { useDogStore } from "@/stores/dogStore"

const ui = useUiStore()
const dogs = useDogStore()

const form = reactive({
  name: "",
  breed: "",
  tags: ""
})

function close() {
  ui.closeModal()
}

function save() {
  if (!form.name.trim()) {
    ui.notify("Dog name is required.", "error")
    return
  }

  const tags = form.tags
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)

  dogs.addDog({
    name: form.name,
    breed: form.breed,
    tags
  })

  ui.notify("Dog added.", "success")
  close()

  // reset form
  form.name = ""
  form.breed = ""
  form.tags = ""
}
</script>

<template>
  <div class="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" @click.self="close">
    <div class="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <div class="text-lg font-semibold">Add Dog</div>
          <div class="text-sm text-zinc-500 dark:text-zinc-400">
            Create a new dog profile
          </div>
        </div>
        <button class="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800" @click="close">
          Close
        </button>
      </div>

      <div class="grid gap-3">
        <label class="grid gap-1 text-sm">
          <span class="text-zinc-600 dark:text-zinc-300">Name *</span>
          <input
            v-model="form.name"
            class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="e.g. Luna"
          />
        </label>

        <label class="grid gap-1 text-sm">
          <span class="text-zinc-600 dark:text-zinc-300">Breed</span>
          <input
            v-model="form.breed"
            class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="e.g. Border Collie"
          />
        </label>

        <label class="grid gap-1 text-sm">
          <span class="text-zinc-600 dark:text-zinc-300">Tags (comma-separated)</span>
          <input
            v-model="form.tags"
            class="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="reactive, nervous"
          />
        </label>

        <div class="mt-2 flex justify-end gap-2">
          <button
            class="rounded-2xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            @click="close"
          >
            Cancel
          </button>
          <button
            class="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 dark:bg-zinc-100 dark:text-zinc-900"
            @click="save"
          >
            Save Dog
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
