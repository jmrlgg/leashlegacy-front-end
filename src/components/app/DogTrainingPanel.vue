<script setup>
import { ref, computed, watch } from "vue"
import { useDogStore } from "@/stores/dogStore"

const props = defineProps({
  dogId: { type: String, required: true }
})

const emit = defineEmits(["close"])

const dogs = useDogStore()

const dog = computed(() => dogs.dogs[props.dogId] || null)

// ── Tabs ───────────────────────────────────────────────────────────
const activeTab = ref("program")

// ── Toast ──────────────────────────────────────────────────────────
const toast = ref(null)
let toastTimer = null
function notify(message, type = "success") {
  clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => (toast.value = null), 3000)
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1 — Training Program
// ═══════════════════════════════════════════════════════════════════
const programForm = ref({
  name: "",
  description: "",
  startDate: "",
  goals: ""
})
const programEditing = ref(false)

watch(
  () => dog.value?.trainingProgram,
  (p) => {
    if (p) {
      programForm.value = { name: p.name, description: p.description, startDate: p.startDate, goals: p.goals }
    } else {
      programForm.value = { name: "", description: "", startDate: "", goals: "" }
    }
  },
  { immediate: true }
)

function saveProgram() {
  if (!programForm.value.name.trim()) {
    notify("Program name is required.", "error")
    return
  }
  dogs.updateTrainingProgram(props.dogId, { ...programForm.value })
  programEditing.value = false
  notify("Training program saved! 🎯")
}

function editProgram() {
  const p = dog.value?.trainingProgram
  if (p) programForm.value = { ...p }
  programEditing.value = true
}

function cancelProgram() {
  const p = dog.value?.trainingProgram
  if (p) programForm.value = { ...p }
  else programForm.value = { name: "", description: "", startDate: "", goals: "" }
  programEditing.value = false
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2 — Scenarios
// ═══════════════════════════════════════════════════════════════════
const scenarios = computed(() => dog.value?.scenarios ?? [])
const showAddScenario = ref(false)
const newScenarioName = ref("")
const newScenarioNotes = ref("")
const scenarioError = ref("")

function openAddScenario() {
  newScenarioName.value = ""
  newScenarioNotes.value = ""
  scenarioError.value = ""
  showAddScenario.value = true
}

function saveScenario() {
  if (!newScenarioName.value.trim()) {
    scenarioError.value = "Name is required."
    return
  }
  dogs.addScenario(props.dogId, {
    name: newScenarioName.value.trim(),
    notes: newScenarioNotes.value.trim()
  })
  showAddScenario.value = false
  notify(`"${newScenarioName.value.trim()}" added! 🏆`)
}

function setRank(scenarioId, rank) {
  dogs.updateScenarioRank(props.dogId, scenarioId, rank)
}

function deleteScenario(scenarioId, name) {
  dogs.removeScenario(props.dogId, scenarioId)
  notify(`"${name}" removed.`, "info")
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3 — Training Log
// ═══════════════════════════════════════════════════════════════════
const trainingLogs = computed(() => {
  const logs = dog.value?.trainingLogs ?? []
  return [...logs].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
})

const showAddLog = ref(false)
const logForm = ref({ performedOn: "", notes: "", duration: "" })
const logError = ref("")

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function openAddLog() {
  logForm.value = { performedOn: todayDate(), notes: "", duration: "" }
  logError.value = ""
  showAddLog.value = true
}

function saveLog() {
  if (!logForm.value.performedOn) {
    logError.value = "Training date is required."
    return
  }
  if (!logForm.value.notes.trim()) {
    logError.value = "Notes are required."
    return
  }
  dogs.addTrainingLog(props.dogId, { ...logForm.value })
  showAddLog.value = false
  notify("Training log entry saved! 📋")
}

function deleteLog(logId) {
  dogs.removeTrainingLog(props.dogId, logId)
  notify("Log entry removed.", "info")
}

function fmtDate(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmtDateTime(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d) ? iso : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}
</script>

<template>
  <Transition name="panel">
    <div class="panel-backdrop" @click.self="$emit('close')" id="training-panel-backdrop">
      <div class="panel-modal">

        <!-- ── Panel Header ─────────────────────────────────────── -->
        <div class="panel-header">
          <div class="panel-header-left">
            <div class="panel-avatar">{{ dog?.name?.[0]?.toUpperCase() || "?" }}</div>
            <div>
              <div class="panel-title">{{ dog?.name || "Dog" }}</div>
              <div class="panel-subtitle">Training Profile</div>
            </div>
          </div>
          <button class="panel-close" @click="$emit('close')" id="close-training-panel">✕</button>
        </div>

        <!-- ── Tabs ────────────────────────────────────────────── -->
        <div class="panel-tabs">
          <button
            class="panel-tab"
            :class="{ 'panel-tab--active': activeTab === 'program' }"
            @click="activeTab = 'program'"
            id="tab-program"
          >🎯 Program</button>
          <button
            class="panel-tab"
            :class="{ 'panel-tab--active': activeTab === 'scenarios' }"
            @click="activeTab = 'scenarios'"
            id="tab-scenarios"
          >🏆 Scenarios</button>
          <button
            class="panel-tab"
            :class="{ 'panel-tab--active': activeTab === 'logs' }"
            @click="activeTab = 'logs'"
            id="tab-logs"
          >📋 Training Log</button>
        </div>

        <!-- ── Panel Body ──────────────────────────────────────── -->
        <div class="panel-body">

          <!-- ══ TAB: Training Program ══════════════════════════ -->
          <div v-if="activeTab === 'program'" class="tab-content">
            <div v-if="!dog?.trainingProgram && !programEditing" class="empty-tab">
              <div class="empty-tab-icon">🎯</div>
              <p class="empty-tab-title">No training program yet</p>
              <p class="empty-tab-sub">Set up a program to track goals and progress.</p>
              <button class="btn-primary" @click="programEditing = true" id="create-program-btn">Create Program</button>
            </div>

            <div v-else-if="!programEditing" class="program-view">
              <div class="program-view-header">
                <h3 class="program-name">{{ dog.trainingProgram.name }}</h3>
                <button class="btn-edit" @click="editProgram" id="edit-program-btn">✏️ Edit</button>
              </div>
              <div class="program-meta">
                <span class="meta-badge">📅 Started {{ fmtDate(dog.trainingProgram.startDate) }}</span>
              </div>
              <p class="program-desc">{{ dog.trainingProgram.description || "No description." }}</p>
              <div v-if="dog.trainingProgram.goals" class="program-goals">
                <div class="goals-label">Goals</div>
                <pre class="goals-text">{{ dog.trainingProgram.goals }}</pre>
              </div>
            </div>

            <div v-else class="program-form">
              <div class="form-grid">
                <label class="form-field form-field--full">
                  <span class="form-label">Program Name <span class="required">*</span></span>
                  <input v-model="programForm.name" class="form-input" placeholder="e.g. Foundation Obedience" id="program-name-input" />
                </label>

                <label class="form-field">
                  <span class="form-label">Start Date</span>
                  <input v-model="programForm.startDate" type="date" class="form-input" id="program-start-input" />
                </label>

                <label class="form-field form-field--full">
                  <span class="form-label">Description</span>
                  <textarea v-model="programForm.description" class="form-input form-textarea" placeholder="Brief overview of the program…" id="program-desc-input" rows="3" />
                </label>

                <label class="form-field form-field--full">
                  <span class="form-label">Goals <span class="form-hint">(one per line)</span></span>
                  <textarea v-model="programForm.goals" class="form-input form-textarea" placeholder="- Reliable sit&#10;- Leash manners&#10;- Focus drills" id="program-goals-input" rows="5" />
                </label>
              </div>

              <div class="form-actions">
                <button class="btn-ghost" @click="cancelProgram" id="cancel-program-btn">Cancel</button>
                <button class="btn-primary" @click="saveProgram" id="save-program-btn">Save Program</button>
              </div>
            </div>
          </div>

          <!-- ══ TAB: Scenarios ══════════════════════════════════ -->
          <div v-if="activeTab === 'scenarios'" class="tab-content">
            <div class="tab-actions-bar">
              <div class="tab-actions-info">{{ scenarios.length }} skill{{ scenarios.length !== 1 ? 's' : '' }}</div>
              <button class="btn-primary btn-sm" @click="openAddScenario" id="add-scenario-btn">+ Add Skill</button>
            </div>

            <div v-if="scenarios.length === 0" class="empty-tab">
              <div class="empty-tab-icon">🏆</div>
              <p class="empty-tab-title">No skills tracked yet</p>
              <p class="empty-tab-sub">Add commands like Sit, Heel, Place to track progress.</p>
            </div>

            <div v-else class="scenarios-list">
              <div v-for="sc in scenarios" :key="sc.id" class="scenario-card">
                <div class="scenario-top">
                  <div class="scenario-name">{{ sc.name }}</div>
                  <button class="btn-icon-del" @click="deleteScenario(sc.id, sc.name)" :title="`Remove ${sc.name}`">🗑</button>
                </div>

                <!-- Rank pips -->
                <div class="rank-row">
                  <div class="rank-pips">
                    <button
                      v-for="n in sc.max"
                      :key="n"
                      class="rank-pip"
                      :class="{ 'rank-pip--filled': n <= sc.rank }"
                      @click="setRank(sc.id, sc.rank === n ? n - 1 : n)"
                      :title="`Set rank to ${n}`"
                      :id="`pip-${sc.id}-${n}`"
                    />
                  </div>
                  <span class="rank-label">{{ sc.rank }} / {{ sc.max }}</span>
                </div>

                <!-- Progress bar -->
                <div class="rank-bar-track">
                  <div class="rank-bar-fill" :style="{ width: `${(sc.rank / sc.max) * 100}%` }" />
                </div>

                <p v-if="sc.notes" class="scenario-notes">{{ sc.notes }}</p>
              </div>
            </div>

            <!-- Add Scenario Inline Form -->
            <Transition name="slide">
              <div v-if="showAddScenario" class="inline-form-card">
                <div class="inline-form-title">New Skill</div>
                <div class="form-grid">
                  <label class="form-field form-field--full">
                    <span class="form-label">Skill Name <span class="required">*</span></span>
                    <input v-model="newScenarioName" class="form-input" placeholder="e.g. Heel, Place, Come" id="new-scenario-name" @keydown.enter="saveScenario" />
                  </label>
                  <label class="form-field form-field--full">
                    <span class="form-label">Notes</span>
                    <textarea v-model="newScenarioNotes" class="form-input form-textarea" placeholder="Any context…" rows="2" id="new-scenario-notes" />
                  </label>
                  <p v-if="scenarioError" class="form-error">{{ scenarioError }}</p>
                </div>
                <div class="form-actions">
                  <button class="btn-ghost" @click="showAddScenario = false">Cancel</button>
                  <button class="btn-primary" @click="saveScenario" id="save-scenario-btn">Add Skill</button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- ══ TAB: Training Log ════════════════════════════════ -->
          <div v-if="activeTab === 'logs'" class="tab-content">
            <div class="tab-actions-bar">
              <div class="tab-actions-info">{{ trainingLogs.length }} entr{{ trainingLogs.length !== 1 ? 'ies' : 'y' }}</div>
              <button class="btn-primary btn-sm" @click="openAddLog" id="add-log-btn">+ Log Session</button>
            </div>

            <!-- Add Log Inline Form -->
            <Transition name="slide">
              <div v-if="showAddLog" class="inline-form-card">
                <div class="inline-form-title">New Training Entry</div>
                <div class="form-grid">
                  <label class="form-field">
                    <span class="form-label">Training Date <span class="required">*</span></span>
                    <input v-model="logForm.performedOn" type="date" class="form-input" id="log-performed-on" />
                  </label>
                  <label class="form-field">
                    <span class="form-label">Duration</span>
                    <input v-model="logForm.duration" class="form-input" placeholder="e.g. 45 min" id="log-duration" />
                  </label>
                  <label class="form-field form-field--full">
                    <span class="form-label">Notes <span class="required">*</span></span>
                    <textarea v-model="logForm.notes" class="form-input form-textarea" placeholder="What was worked on? How did it go?" rows="4" id="log-notes" />
                  </label>
                  <p v-if="logError" class="form-error">{{ logError }}</p>
                </div>
                <div class="form-actions">
                  <button class="btn-ghost" @click="showAddLog = false">Cancel</button>
                  <button class="btn-primary" @click="saveLog" id="save-log-btn">Save Entry</button>
                </div>
              </div>
            </Transition>

            <div v-if="trainingLogs.length === 0 && !showAddLog" class="empty-tab">
              <div class="empty-tab-icon">📋</div>
              <p class="empty-tab-title">No log entries yet</p>
              <p class="empty-tab-sub">Start logging daily training sessions to track progress over time.</p>
            </div>

            <!-- Log Timeline -->
            <div v-else class="log-timeline">
              <article v-for="log in trainingLogs" :key="log.id" class="log-entry">
                <div class="log-dot" />
                <div class="log-card">
                  <div class="log-dates">
                    <div class="log-performed">
                      <span class="log-date-label">Performed</span>
                      <span class="log-date-value">{{ fmtDate(log.performedOn) }}</span>
                    </div>
                    <div class="log-divider" />
                    <div class="log-published">
                      <span class="log-date-label">Published</span>
                      <span class="log-date-value log-date-value--muted">{{ fmtDateTime(log.publishedAt) }}</span>
                    </div>
                    <span v-if="log.duration" class="log-duration-badge">⏱ {{ log.duration }}</span>
                  </div>
                  <p class="log-notes">{{ log.notes }}</p>
                  <div class="log-actions">
                    <button class="btn-icon-del btn-sm" @click="deleteLog(log.id)" title="Remove entry">🗑 Remove</button>
                  </div>
                </div>
              </article>
            </div>
          </div>

        </div><!-- /panel-body -->

      </div>
    </div>
  </Transition>

  <!-- Toast -->
  <Transition name="toast">
    <div v-if="toast" class="tp-toast" :class="`tp-toast--${toast.type}`">{{ toast.message }}</div>
  </Transition>
</template>

<style scoped>
/* ── Backdrop / Modal ─────────────────────────────────────────────── */
.panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 10, 30, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.panel-modal {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 28px;
  border: 1.5px solid #ede8ff;
  box-shadow: 0 32px 80px rgba(124, 58, 237, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "Poppins", system-ui, sans-serif;
}

/* ── Header ──────────────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 16px;
  border-bottom: 1.5px solid #f3efff;
  flex-shrink: 0;
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.panel-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a1028;
  line-height: 1.2;
}

.panel-subtitle {
  font-size: 0.8rem;
  color: #9d8fc0;
  margin-top: 1px;
}

.panel-close {
  background: none;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 11px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #6b7280;
  transition: background 0.15s, border-color 0.15s;
  line-height: 1;
}
.panel-close:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

/* ── Tabs ─────────────────────────────────────────────────────────── */
.panel-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px 0;
  border-bottom: 1.5px solid #f3efff;
  flex-shrink: 0;
}

.panel-tab {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 10px 10px 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #9d8fc0;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  font-family: inherit;
  position: relative;
  bottom: -1.5px;
}
.panel-tab:hover { color: #7c3aed; background: #faf5ff; }
.panel-tab--active {
  color: #7c3aed;
  background: #fff;
  border: 1.5px solid #f3efff;
  border-bottom-color: #fff;
}

/* ── Body / Scroll ───────────────────────────────────────────────── */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* ── Empty State ─────────────────────────────────────────────────── */
.empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  gap: 8px;
}
.empty-tab-icon { font-size: 2.5rem; margin-bottom: 6px; }
.empty-tab-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: #1a1028; }
.empty-tab-sub { margin: 0 0 16px; font-size: 0.875rem; color: #9d8fc0; }

/* ── Tab Actions Bar ─────────────────────────────────────────────── */
.tab-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.tab-actions-info { font-size: 0.82rem; color: #9d8fc0; font-weight: 500; }

/* ── Buttons ─────────────────────────────────────────────────────── */
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
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-primary.btn-sm { padding: 7px 14px; font-size: 0.82rem; }

.btn-ghost {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.btn-ghost:hover { background: #f3f4f6; }

.btn-edit {
  background: #faf5ff;
  border: 1.5px solid #ddd6fe;
  color: #7c3aed;
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.btn-edit:hover { background: #ede8ff; }

.btn-icon-del {
  background: none;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 9px;
  font-size: 0.8rem;
  cursor: pointer;
  color: #9ca3af;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.btn-icon-del:hover { border-color: #fca5a5; background: #fff1f2; color: #ef4444; }

/* ── Forms ───────────────────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.form-field { display: grid; gap: 5px; }
.form-field--full { grid-column: 1 / -1; }
.form-label { font-size: 0.82rem; font-weight: 600; color: #4b4060; }
.form-hint { font-weight: 400; color: #9ca3af; font-size: 0.78rem; }
.required { color: #a855f7; }
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
.form-input:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.15); }
.form-input::placeholder { color: #c4b5fd; }
.form-textarea { resize: vertical; min-height: 80px; }
.form-error { margin: 0; grid-column: 1/-1; font-size: 0.82rem; color: #ef4444; font-weight: 500; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* ── Program View ────────────────────────────────────────────────── */
.program-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.program-name { margin: 0; font-size: 1.2rem; font-weight: 700; color: #1a1028; }
.program-meta { margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
.meta-badge {
  display: inline-block;
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 999px;
  background: #ede8ff;
  color: #6d28d9;
  font-weight: 600;
}
.program-desc { margin: 0 0 16px; font-size: 0.9rem; color: #4b4060; line-height: 1.6; }
.program-goals { background: #faf5ff; border: 1.5px solid #ede8ff; border-radius: 14px; padding: 14px 16px; }
.goals-label { font-size: 0.78rem; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.goals-text { margin: 0; font-family: inherit; font-size: 0.88rem; color: #1a1028; white-space: pre-wrap; line-height: 1.7; }

/* ── Scenarios ───────────────────────────────────────────────────── */
.scenarios-list { display: grid; gap: 14px; }

.scenario-card {
  background: #faf5ff;
  border: 1.5px solid #ede8ff;
  border-radius: 16px;
  padding: 16px 18px;
  transition: border-color 0.2s;
}
.scenario-card:hover { border-color: #c4b5fd; }

.scenario-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.scenario-name { font-size: 1rem; font-weight: 700; color: #1a1028; }
.scenario-notes { margin: 10px 0 0; font-size: 0.82rem; color: #7c6f9a; line-height: 1.5; }

/* Rank pips */
.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.rank-pips { display: flex; gap: 8px; }
.rank-pip {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2.5px solid #ddd6fe;
  background: #fff;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.1s;
  padding: 0;
}
.rank-pip:hover { transform: scale(1.15); border-color: #a855f7; }
.rank-pip--filled { background: linear-gradient(135deg, #7c3aed, #c084fc); border-color: #7c3aed; }
.rank-label { font-size: 0.82rem; font-weight: 700; color: #7c3aed; white-space: nowrap; }

/* Progress bar */
.rank-bar-track {
  height: 5px;
  border-radius: 999px;
  background: #ede8ff;
  overflow: hidden;
}
.rank-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c3aed, #c084fc);
  transition: width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── Inline Form Card ────────────────────────────────────────────── */
.inline-form-card {
  background: #fff;
  border: 1.5px solid #ddd6fe;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(124,58,237,0.08);
}
.inline-form-title { font-size: 0.95rem; font-weight: 700; color: #1a1028; margin-bottom: 14px; }

/* ── Training Log ────────────────────────────────────────────────── */
.log-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 20px;
}
.log-timeline::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(180deg, #c4b5fd 0%, #ede8ff 100%);
  border-radius: 999px;
}

.log-entry {
  display: flex;
  gap: 14px;
  position: relative;
  padding-bottom: 20px;
}
.log-entry:last-child { padding-bottom: 0; }

.log-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #c4b5fd;
  flex-shrink: 0;
  margin-top: 6px;
  position: relative;
  left: -27px;
  margin-right: -14px;
}

.log-card {
  flex: 1;
  background: #fff;
  border: 1.5px solid #ede8ff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(124,58,237,0.05);
}

.log-dates {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3efff;
}
.log-performed, .log-published {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.log-date-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9d8fc0;
}
.log-date-value {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1028;
}
.log-date-value--muted { color: #9d8fc0; font-weight: 500; }
.log-divider { width: 1px; height: 30px; background: #ede8ff; }
.log-duration-badge {
  margin-left: auto;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 999px;
  background: #ede8ff;
  color: #6d28d9;
  font-weight: 600;
  white-space: nowrap;
  align-self: center;
}

.log-notes {
  margin: 0 0 10px;
  font-size: 0.88rem;
  color: #4b4060;
  line-height: 1.65;
  white-space: pre-wrap;
}
.log-actions { display: flex; justify-content: flex-end; }

/* ── Toast ───────────────────────────────────────────────────────── */
.tp-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  padding: 12px 20px;
  border-radius: 14px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  pointer-events: none;
  font-family: "Poppins", system-ui, sans-serif;
}
.tp-toast--success { background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0; }
.tp-toast--info    { background: #ede8ff; color: #5b21b6; border: 1.5px solid #ddd6fe; }
.tp-toast--error   { background: #fff1f2; color: #991b1b; border: 1.5px solid #fecaca; }

/* ── Transitions ─────────────────────────────────────────────────── */
.panel-enter-active, .panel-leave-active { transition: opacity 0.25s; }
.panel-enter-active .panel-modal, .panel-leave-active .panel-modal { transition: transform 0.25s, opacity 0.25s; }
.panel-enter-from, .panel-leave-to { opacity: 0; }
.panel-enter-from .panel-modal { transform: translateY(16px) scale(0.97); }
.panel-leave-to .panel-modal { transform: translateY(8px) scale(0.97); }

.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .panel-body { padding: 16px; }
  .form-grid { grid-template-columns: 1fr; }
  .log-dates { gap: 10px; }
  .log-divider { display: none; }
  .panel-tabs { padding: 10px 16px 0; }
  .panel-tab { padding: 7px 10px; font-size: 0.78rem; }
}
</style>
