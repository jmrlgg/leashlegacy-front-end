<script setup>
import { ref, computed, onMounted } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { useDogStore } from "@/stores/dogStore"

// Bootstrap Pinia for this Astro island
const pinia = createPinia()
setActivePinia(pinia)

const dogs = useDogStore()

// ── Modal state ────────────────────────────────────────────────────
const showAddModal   = ref(false)
const deleteTarget   = ref(null)   // dog id pending removal
const toast          = ref(null)   // { message, type }
let   toastTimer     = null

// ── Add-dog form ───────────────────────────────────────────────────
const form = ref({ name: "", breed: "", age: "", tags: "" })
const formError = ref("")

function resetForm() {
  form.value = { name: "", breed: "", age: "", tags: "" }
  formError.value = ""
}

function openAdd() {
  resetForm()
  showAddModal.value = true
}

function closeAdd() {
  showAddModal.value = false
}

function savedog() {
  if (!form.value.name.trim()) {
    formError.value = "Dog name is required."
    return
  }

  const tags = form.value.tags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  dogs.addDog({
    name:  form.value.name.trim(),
    breed: form.value.breed.trim(),
    age:   form.value.age ? Number(form.value.age) : null,
    tags,
  })

  notify(`${form.value.name} added! 🐾`, "success")
  closeAdd()
}

// ── Delete flow ────────────────────────────────────────────────────
function confirmDelete(id) {
  deleteTarget.value = id
}

function cancelDelete() {
  deleteTarget.value = null
}

function executDelete() {
  const dog = dogs.dogs[deleteTarget.value]
  const name = dog?.name ?? "Dog"
  dogs.removeDog(deleteTarget.value)
  deleteTarget.value = null
  notify(`${name} removed.`, "info")
}

// ── Toast helper ───────────────────────────────────────────────────
function notify(message, type = "info") {
  clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => (toast.value = null), 3000)
}

// ── Computed list ──────────────────────────────────────────────────
const dogList = computed(() => dogs.allDogs)
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
          {{ dogList.length }} dog{{ dogList.length !== 1 ? "s" : "" }} in the system
        </p>
      </div>
      <button class="btn-add" @click="openAdd" id="add-dog-btn">
        <span class="btn-icon">+</span>
        Add Dog
      </button>
    </div>

    <!-- ─── Empty state ─────────────────────────────────────────── -->
    <div v-if="dogList.length === 0" class="empty-state">
      <div class="empty-icon">🐶</div>
      <p class="empty-title">No dogs yet</p>
      <p class="empty-sub">Add your first dog to get started.</p>
      <button class="btn-add" @click="openAdd">+ Add Dog</button>
    </div>

    <!-- ─── Dog grid ─────────────────────────────────────────────── -->
    <div v-else class="dog-grid">
      <article
        v-for="dog in dogList"
        :key="dog.id"
        class="dog-card"
        :class="{ 'dog-card--deleting': deleteTarget === dog.id }"
      >
        <!-- Avatar -->
        <div class="dog-avatar">
          <span class="dog-avatar-letter">{{ dog.name[0].toUpperCase() }}</span>
        </div>

        <!-- Info -->
        <div class="dog-body">
          <div class="dog-top">
            <h2 class="dog-name">{{ dog.name }}</h2>
            <span v-if="dog.age" class="dog-pill">{{ dog.age }} yr{{ dog.age !== 1 ? "s" : "" }}</span>
          </div>

          <p class="dog-breed">{{ dog.breed }}</p>

          <div v-if="dog.tags && dog.tags.length" class="dog-tags">
            <span v-for="tag in dog.tags" :key="tag" class="dog-tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="dog-actions">
          <template v-if="deleteTarget === dog.id">
            <span class="delete-confirm-label">Remove?</span>
            <button class="btn-danger-confirm" @click="executDelete">Yes, remove</button>
            <button class="btn-ghost" @click="cancelDelete">Cancel</button>
          </template>
          <template v-else>
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
                v-model="form.name"
                class="form-input"
                placeholder="e.g. Luna"
                id="dog-name-input"
                @keydown.enter="savedog"
              />
            </label>

            <label class="form-field">
              <span class="form-label">Breed</span>
              <input
                v-model="form.breed"
                class="form-input"
                placeholder="e.g. Border Collie"
                id="dog-breed-input"
                @keydown.enter="savedog"
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
                @keydown.enter="savedog"
              />
            </label>

            <label class="form-field">
              <span class="form-label">Tags <span class="form-hint">(comma-separated)</span></span>
              <input
                v-model="form.tags"
                class="form-input"
                placeholder="reactive, high-drive"
                id="dog-tags-input"
                @keydown.enter="savedog"
              />
            </label>

            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeAdd" id="cancel-add-dog">Cancel</button>
            <button class="btn-primary" @click="savedog" id="save-dog-btn">Save Dog</button>
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

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45);
}

.btn-add:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1;
}

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

.empty-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a1028;
}

.empty-sub {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: #7c6f9a;
}

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

.dog-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(124, 58, 237, 0.12);
  border-color: #c4b5fd;
}

.dog-card--deleting {
  border-color: #fca5a5;
  background: #fff8f8;
}

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

.dog-avatar-letter {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

/* ── Card body ───────────────────────────────────────────────────── */
.dog-body {
  flex: 1;
}

.dog-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.dog-name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a1028;
  line-height: 1.2;
}

.dog-pill {
  font-size: 0.75rem;
  padding: 2px 9px;
  border-radius: 999px;
  background: #ede8ff;
  color: #6d28d9;
  font-weight: 600;
  white-space: nowrap;
}

.dog-breed {
  margin: 0 0 10px;
  font-size: 0.875rem;
  color: #7c6f9a;
}

.dog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.dog-tag {
  font-size: 0.72rem;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid #ddd6fe;
  color: #7c3aed;
  background: #faf5ff;
  font-weight: 500;
}

/* ── Card actions ────────────────────────────────────────────────── */
.dog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

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

.btn-delete:hover {
  border-color: #fca5a5;
  background: #fff1f2;
  color: #ef4444;
}

.delete-confirm-label {
  font-size: 0.8rem;
  color: #ef4444;
  font-weight: 600;
}

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

.btn-danger-confirm:hover {
  opacity: 0.85;
}

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

.btn-ghost:hover {
  background: #f3f4f6;
}

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

.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1028;
}

.modal-sub {
  font-size: 0.85rem;
  color: #7c6f9a;
  margin-top: 2px;
}

.modal-close {
  padding: 6px 10px;
  font-size: 0.85rem;
  line-height: 1;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.form-field {
  display: grid;
  gap: 5px;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #4b4060;
}

.form-hint {
  font-weight: 400;
  color: #9ca3af;
}

.required {
  color: #a855f7;
}

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

.form-input:focus {
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
}

.form-input::placeholder {
  color: #c4b5fd;
}

.form-error {
  margin: 0;
  font-size: 0.82rem;
  color: #ef4444;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

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

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

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

.toast--success {
  background: #f0fdf4;
  color: #166534;
  border: 1.5px solid #bbf7d0;
}

.toast--info {
  background: #ede8ff;
  color: #5b21b6;
  border: 1.5px solid #ddd6fe;
}

.toast--error {
  background: #fff1f2;
  color: #991b1b;
  border: 1.5px solid #fecaca;
}

/* ── Transitions ─────────────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.2s, opacity 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-card {
  transform: translateY(12px) scale(0.97);
}
.modal-leave-to .modal-card {
  transform: translateY(8px) scale(0.97);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 500px) {
  .dogs-page {
    padding: 20px 14px;
  }
  .dogs-title {
    font-size: 1.5rem;
  }
  .modal-card {
    padding: 20px 16px;
  }
}
</style>
