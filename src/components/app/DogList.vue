<script setup>
import { ref, computed, onMounted } from "vue"
import DogTrainingPanel from "@/components/app/DogTrainingPanel.vue"

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8000"

// ── Data ──────────────────────────────────────────────────────────
const dogList   = ref([])
const clients   = ref([])
const loading   = ref(true)
const loadError = ref(null)

// ── UI state ──────────────────────────────────────────────────────
const showAddModal   = ref(false)
const deleteTarget   = ref(null)
const trainingTarget = ref(null)
const toast          = ref(null)
let   toastTimer     = null

// ── Add form ───────────────────────────────────────────────────────
const form      = ref({ pet_name: "", breed: "", age: "", client: "" })
const formError = ref("")
const saving    = ref(false)

// ── Filter ─────────────────────────────────────────────────────
const activeFilter = ref("all")

const STATUS_LABELS = { upcoming: "Upcoming", active: "Active", completed: "Completed" }

const statusCounts = computed(() => ({
  all:       dogList.value.length,
  upcoming:  dogList.value.filter(d => !d.status || d.status === "upcoming").length,
  active:    dogList.value.filter(d => d.status === "active").length,
  completed: dogList.value.filter(d => d.status === "completed").length,
}))

const filteredDogs = computed(() => {
  if (activeFilter.value === "all")      return dogList.value
  if (activeFilter.value === "upcoming") return dogList.value.filter(d => !d.status || d.status === "upcoming")
  return dogList.value.filter(d => d.status === activeFilter.value)
})

// ── API calls ──────────────────────────────────────────────────────
async function loadDogs() {
  loading.value   = true
  loadError.value = null
  try {
    const res = await fetch(`${API_BASE}/api/dogs/`)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    dogList.value = await res.json()
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadClients() {
  try {
    const res = await fetch(`${API_BASE}/api/clients/`)
    if (!res.ok) return
    clients.value = await res.json()
  } catch {}
}

onMounted(() => { loadDogs(); loadClients() })

// ── Add Dog ────────────────────────────────────────────────────────
function openAdd() {
  form.value = { pet_name: "", breed: "", age: "", client: "" }
  formError.value = ""
  showAddModal.value = true
}
function closeAdd() { showAddModal.value = false }

async function saveDog() {
  if (!form.value.pet_name.trim()) { formError.value = "Dog name is required."; return }
  if (!form.value.client)          { formError.value = "Client is required."; return }
  saving.value = true
  try {
    const res = await fetch(`${API_BASE}/api/dogs/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pet_name: form.value.pet_name.trim(),
        breed:    form.value.breed.trim() || "Unknown",
        age:      form.value.age ? Number(form.value.age) : null,
        client:   Number(form.value.client)
      })
    })
    if (!res.ok) throw new Error(`${res.status}`)
    await loadDogs()
    notify(`${form.value.pet_name} added! 🐾`, "success")
    closeAdd()
  } catch {
    formError.value = "Failed to save. Check the fields and try again."
  } finally {
    saving.value = false
  }
}

// ── Delete Dog ─────────────────────────────────────────────────────
function confirmDelete(id) { deleteTarget.value = id }
function cancelDelete()    { deleteTarget.value = null }

async function executeDelete() {
  const dog  = dogList.value.find(d => d.id === deleteTarget.value)
  const name = dog?.pet_name ?? "Dog"
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${deleteTarget.value}/detail/`, {
      method: "DELETE"
    })
    if (!res.ok) throw new Error()
    dogList.value  = dogList.value.filter(d => d.id !== deleteTarget.value)
    deleteTarget.value = null
    notify(`${name} removed.`, "info")
  } catch {
    notify("Failed to remove dog.", "error")
    deleteTarget.value = null
  }
}

// ── Training Panel ─────────────────────────────────────────────────
function openTraining(id) { trainingTarget.value = id }
function closeTraining()  { trainingTarget.value = null }

// ── Toast ──────────────────────────────────────────────────────────
function notify(message, type = "info") {
  clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer  = setTimeout(() => (toast.value = null), 3000)
}
</script>

<template>
  <section class="dogs-page">

    <!-- ─── Header ──────────────────────────────────────────────── -->
    <div class="dogs-header">
      <div class="dogs-header-left">
        <h1 class="dogs-title">
          <span class="paw-icon">🐾</span> Dogs
        </h1>
        <p class="dogs-subtitle">
          {{ filteredDogs.length }}
          <span v-if="activeFilter !== 'all'"> of {{ dogList.length }}</span>
          dog{{ dogList.length !== 1 ? "s" : "" }}
        </p>
      </div>
      <button class="btn-add" @click="openAdd" id="add-dog-btn">
        <span class="btn-icon">+</span> Add Dog
      </button>
    </div>

    <!-- ─── Filter Bar ──────────────────────────────────────────── -->
    <div v-if="!loading && !loadError" class="filter-bar">
      <button
        v-for="f in [
          { key: 'all',       label: 'All',       icon: '🐾' },
          { key: 'upcoming',  label: 'Upcoming',  icon: '⏳' },
          { key: 'active',    label: 'Active',    icon: '🟢' },
          { key: 'completed', label: 'Completed', icon: '✅' },
        ]"
        :key="f.key"
        class="filter-pill"
        :class="{ 'filter-pill--on': activeFilter === f.key }"
        @click="activeFilter = f.key"
        :id="`filter-${f.key}`"
      >
        <span class="filter-pill-label">{{ f.icon }} {{ f.label }}</span>
        <span class="filter-pill-count">{{ statusCounts[f.key] }}</span>
      </button>
    </div>

    <!-- ─── Loading ─────────────────────────────────────────────── -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p class="loading-text">Loading dogs…</p>
    </div>

    <!-- ─── Error ───────────────────────────────────────────────── -->
    <div v-else-if="loadError" class="error-state">
      <p class="error-icon">⚠️</p>
      <p class="error-msg">Could not load dogs: {{ loadError }}</p>
      <button class="btn-add" @click="loadDogs">Retry</button>
    </div>

    <!-- ─── Empty state ─────────────────────────────────────────── -->
    <div v-else-if="dogList.length === 0" class="empty-state">
      <div class="empty-icon">🐶</div>
      <p class="empty-title">No dogs yet</p>
      <p class="empty-sub">Add your first dog to get started.</p>
      <button class="btn-add" @click="openAdd">+ Add Dog</button>
    </div>

    <!-- No filter results -->
    <div v-else-if="filteredDogs.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-title">No {{ STATUS_LABELS[activeFilter] }} dogs</p>
      <p class="empty-sub">Try a different filter or change a dog's status.</p>
      <button class="btn-ghost" @click="activeFilter = 'all'" style="margin-top:4px">Show all dogs</button>
    </div>

    <!-- ─── Dog grid ─────────────────────────────────────────────── -->
    <div v-else class="dog-grid">
      <article
        v-for="dog in filteredDogs"
        :key="dog.id"
        class="dog-card"
        :class="{ 'dog-card--deleting': deleteTarget === dog.id }"
      >
        <!-- Avatar -->
        <div class="dog-avatar">
          <span class="dog-avatar-letter">{{ dog.pet_name[0].toUpperCase() }}</span>
        </div>

        <!-- Info -->
        <div class="dog-body">
          <div class="dog-top">
            <h2 class="dog-name">{{ dog.pet_name }}</h2>
            <span v-if="dog.age" class="dog-pill">{{ dog.age }} yr{{ dog.age !== 1 ? "s" : "" }}</span>
          </div>

          <p class="dog-breed">{{ dog.breed || "Unknown breed" }}</p>

          <div class="dog-tags">
            <span
              class="dog-tag dog-tag--status"
              :class="`dog-tag--${dog.status || 'upcoming'}`"
            >{{ STATUS_LABELS[dog.status] || 'Upcoming' }}</span>
            <span v-if="dog.client_name" class="dog-tag">👤 {{ dog.client_name }}</span>
            <span v-if="dog.training_program_name" class="dog-tag dog-tag--program">🎯 {{ dog.training_program_name }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="dog-actions">
          <template v-if="deleteTarget === dog.id">
            <span class="delete-confirm-label">Remove?</span>
            <button class="btn-danger-confirm" @click="executeDelete">Yes, remove</button>
            <button class="btn-ghost" @click="cancelDelete">Cancel</button>
          </template>
          <template v-else>
            <button
              class="btn-training"
              :id="`training-dog-${dog.id}`"
              @click="openTraining(dog.id)"
              title="View training profile"
            >
              📋 Training
            </button>
            <button
              class="btn-delete"
              :id="`delete-dog-${dog.id}`"
              @click="confirmDelete(dog.id)"
              title="Remove dog"
            >
              🗑
            </button>
          </template>
        </div>
      </article>
    </div>

    <!-- ─── Add Dog Modal ─────────────────────────────────────────── -->
    <Transition name="modal">
      <div
        v-if="showAddModal"
        class="modal-backdrop"
        @click.self="closeAdd"
        id="add-dog-modal"
      >
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <div class="modal-title">Add Dog</div>
              <div class="modal-sub">Create a new dog profile</div>
            </div>
            <button class="btn-ghost modal-close" @click="closeAdd">✕</button>
          </div>

          <div class="form-grid">
            <label class="form-field">
              <span class="form-label">Name <span class="required">*</span></span>
              <input
                v-model="form.pet_name"
                class="form-input"
                placeholder="e.g. Luna"
                id="dog-name-input"
                @keydown.enter="saveDog"
              />
            </label>

            <label class="form-field">
              <span class="form-label">Breed</span>
              <input
                v-model="form.breed"
                class="form-input"
                placeholder="e.g. Border Collie"
                id="dog-breed-input"
              />
            </label>

            <label class="form-field">
              <span class="form-label">Age (years)</span>
              <input
                v-model="form.age"
                type="number"
                min="0"
                max="30"
                class="form-input"
                placeholder="e.g. 3"
                id="dog-age-input"
              />
            </label>

            <label class="form-field">
              <span class="form-label">Client <span class="required">*</span></span>
              <select v-model="form.client" class="form-input form-select" id="dog-client-input">
                <option value="">Select client…</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">
                  {{ c.first_name }} {{ c.last_name }}
                </option>
              </select>
            </label>

            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeAdd" id="cancel-add-dog">Cancel</button>
            <button class="btn-primary" @click="saveDog" :disabled="saving" id="save-dog-btn">
              {{ saving ? "Saving…" : "Save Dog" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ─── Toast ─────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="`toast--${toast.type}`">
        {{ toast.message }}
      </div>
    </Transition>

    <!-- ─── Training Panel ───────────────────────────────────────── -->
    <DogTrainingPanel
      v-if="trainingTarget"
      :dog-id="trainingTarget"
      @close="closeTraining"
    />

  </section>
</template>

<style scoped>
/* ── Page layout ─────────────────────────────────────────────────── */
.dogs-page {
  padding: 32px 24px;
  min-height: 100vh;
  background: #f8f7ff;
  font-family: "Poppins", system-ui, sans-serif;
}

/* ── Header ──────────────────────────────────────────────────────── */
.dogs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
}

.dogs-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1a1028;
  letter-spacing: -0.5px;
}

.paw-icon {
  display: inline-block;
  animation: wiggle 2.5s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  20%       { transform: rotate(-10deg); }
  40%       { transform: rotate(10deg); }
  60%       { transform: rotate(-6deg); }
  80%       { transform: rotate(6deg); }
}

.dogs-subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: #7c6f9a;
}

/* ── Loading / Error ─────────────────────────────────────────────── */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #ede8ff;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text { font-size: 0.9rem; color: #7c6f9a; margin: 0; }

.error-icon { font-size: 2.5rem; margin: 0; }
.error-msg  { font-size: 0.9rem; color: #7c6f9a; margin: 0; }

/* ── Add button ──────────────────────────────────────────────────── */
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.btn-add:hover  { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45); }
.btn-add:active { transform: translateY(0); }

.btn-icon { font-size: 1.1rem; font-weight: 400; line-height: 1; }

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 8px;
  animation: bounce 1.6s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}

.empty-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: #1a1028; }
.empty-sub   { margin: 0 0 12px; font-size: 0.9rem; color: #7c6f9a; }

/* ── Dog grid ────────────────────────────────────────────────────── */
.dog-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* ── Dog card ────────────────────────────────────────────────────── */
.dog-card {
  background: #fff;
  border-radius: 20px;
  border: 1.5px solid #ede8ff;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.06);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  animation: fadeUp 0.3s ease both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dog-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(124, 58, 237, 0.12); border-color: #c4b5fd; }
.dog-card--deleting { border-color: #fca5a5; background: #fff8f8; }

/* ── Avatar ──────────────────────────────────────────────────────── */
.dog-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.dog-avatar-letter { font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1; }

/* ── Card body ───────────────────────────────────────────────────── */
.dog-body { flex: 1; }
.dog-top  { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.dog-name { margin: 0; font-size: 1.15rem; font-weight: 700; color: #1a1028; line-height: 1.2; }

.dog-pill {
  font-size: 0.75rem;
  padding: 2px 9px;
  border-radius: 999px;
  background: #ede8ff;
  color: #6d28d9;
  font-weight: 600;
  white-space: nowrap;
}

.dog-breed { margin: 0 0 10px; font-size: 0.875rem; color: #7c6f9a; }

.dog-tags { display: flex; flex-wrap: wrap; gap: 5px; }

.dog-tag {
  font-size: 0.72rem;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid #ddd6fe;
  color: #7c3aed;
  background: #faf5ff;
  font-weight: 500;
}
.dog-tag--status    { font-weight: 700; }
.dog-tag--upcoming  { border-color: #bae6fd; color: #0369a1; background: #e0f2fe; }
.dog-tag--active    { border-color: #86efac; color: #166534; background: #dcfce7; }
.dog-tag--completed { border-color: #ddd6fe; color: #5b21b6; background: #ede8ff; }

/* ── Filter bar ────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1.5px solid #ede8ff;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  color: #7c6f9a;
  transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.12s;
}
.filter-pill:hover   { border-color: #c4b5fd; color: #7c3aed; transform: translateY(-1px); }
.filter-pill--on     { background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(124,58,237,0.3); }

.filter-pill-label  { white-space: nowrap; }
.filter-pill-count  {
  background: rgba(255,255,255,0.25);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.75rem;
}
.filter-pill--on .filter-pill-count { background: rgba(255,255,255,0.3); }

/* ── Card actions ────────────────────────────────────────────────── */
.dog-actions { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }

.btn-training {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #faf5ff;
  border: 1.5px solid #ddd6fe;
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7c3aed;
  transition: background 0.15s, border-color 0.15s;
  font-family: inherit;
}
.btn-training:hover { background: #ede8ff; border-color: #c4b5fd; }

.btn-delete {
  background: none;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  color: #9ca3af;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.btn-delete:hover { border-color: #fca5a5; background: #fff1f2; color: #ef4444; }

.delete-confirm-label { font-size: 0.8rem; color: #ef4444; font-weight: 600; }

.btn-danger-confirm {
  font-size: 0.8rem;
  padding: 5px 12px;
  border-radius: 9px;
  border: none;
  background: #ef4444;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-danger-confirm:hover { opacity: 0.85; }

.btn-ghost {
  font-size: 0.8rem;
  padding: 5px 12px;
  border-radius: 9px;
  border: 1.5px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-ghost:hover { background: #f3f4f6; }

/* ── Modal ───────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 10, 30, 0.5);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 24px 64px rgba(124, 58, 237, 0.18);
  padding: 28px;
  border: 1.5px solid #ede8ff;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-title { font-size: 1.2rem; font-weight: 700; color: #1a1028; }
.modal-sub   { font-size: 0.85rem; color: #7c6f9a; margin-top: 2px; }
.modal-close { padding: 6px 10px; font-size: 0.85rem; line-height: 1; }

.form-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field { display: grid; gap: 5px; }
.form-label { font-size: 0.82rem; font-weight: 600; color: #4b4060; }
.required   { color: #a855f7; }

.form-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid #ede8ff;
  background: #faf5ff;
  font-size: 0.9rem;
  color: #1a1028;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.form-input:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15); }
.form-input::placeholder { color: #c4b5fd; }

.form-select { cursor: pointer; appearance: auto; }

.form-error {
  margin: 0;
  grid-column: 1 / -1;
  font-size: 0.82rem;
  color: #ef4444;
  font-weight: 500;
}

.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }

.btn-primary {
  padding: 10px 22px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
  transition: opacity 0.15s, transform 0.15s;
  font-family: inherit;
}
.btn-primary:hover    { opacity: 0.9; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Toast ───────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  padding: 12px 20px;
  border-radius: 14px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}
.toast--success { background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0; }
.toast--info    { background: #ede8ff; color: #5b21b6; border: 1.5px solid #ddd6fe; }
.toast--error   { background: #fff1f2; color: #991b1b; border: 1.5px solid #fecaca; }

/* ── Transitions ─────────────────────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card      { transform: translateY(12px) scale(0.97); }
.modal-leave-to .modal-card        { transform: translateY(8px) scale(0.97); }

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translateY(10px); }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 500px) {
  .dogs-page   { padding: 20px 14px; }
  .dogs-title  { font-size: 1.5rem; }
  .modal-card  { padding: 20px 16px; }
  .form-grid   { grid-template-columns: 1fr; }
}
</style>
