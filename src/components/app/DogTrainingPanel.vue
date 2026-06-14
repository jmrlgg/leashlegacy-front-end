<script setup>
import { ref, computed, onMounted } from "vue"

const props = defineProps({
  dogId: { type: [String, Number], required: true }
})
const emit = defineEmits(["close"])

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8000"

// ── Core state ─────────────────────────────────────────────────────
const dog       = ref(null)
const loading   = ref(true)
const activeTab = ref("program")

// ── Toast ──────────────────────────────────────────────────────────
const toast = ref(null)
let toastTimer = null
function notify(message, type = "success") {
  clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => (toast.value = null), 3500)
}

// ── Load dog (returns full detail including nested notes + progress) ─
async function loadDog() {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/detail/`)
    if (!res.ok) throw new Error(`${res.status}`)
    dog.value = await res.json()
  } catch (e) {
    notify(`Could not load dog data: ${e.message}`, "error")
  } finally {
    loading.value = false
  }
}

onMounted(loadDog)

// ═══════════════════════════════════════════════════════════════════
// TAB 1 — Training Program
// ═══════════════════════════════════════════════════════════════════
const skills         = ref([])
const programEditing = ref(false)
const programSaving  = ref(false)
const programForm    = ref({ training_program: null, program_description: "" })

// Status quick-switch
const STATUS_OPTIONS = [
  { value: "upcoming",  label: "Upcoming",  icon: "⏳" },
  { value: "active",    label: "Active",    icon: "🟢" },
  { value: "completed", label: "Completed", icon: "✅" },
]

async function setStatus(newStatus) {
  if (!dog.value || dog.value.status === newStatus) return
  const prev = dog.value.status
  dog.value.status = newStatus   // optimistic
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/detail/`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
    if (!res.ok) throw new Error()
    notify(`Status: ${newStatus} ✓`)
  } catch {
    dog.value.status = prev
    notify("Failed to update status.", "error")
  }
}

async function loadSkills() {
  if (skills.value.length) return
  try {
    const res = await fetch(`${API_BASE}/api/skills/`)
    if (!res.ok) return
    skills.value = await res.json()
  } catch {}
}

function editProgram() {
  programForm.value = {
    training_program:    dog.value?.training_program    ?? null,
    program_description: dog.value?.program_description ?? ""
  }
  programEditing.value = true
  loadSkills()
}

function cancelProgram() { programEditing.value = false }

async function saveProgram() {
  programSaving.value = true
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/detail/`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(programForm.value)
    })
    if (!res.ok) throw new Error(`${res.status}`)
    await loadDog()
    programEditing.value = false
    notify("Training program saved! 🎯")
  } catch (e) {
    notify(`Save failed: ${e.message}`, "error")
  } finally {
    programSaving.value = false
  }
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2 — Scenarios (TrainingProgress)
// ═══════════════════════════════════════════════════════════════════
const scenarios = computed(() => dog.value?.progress ?? [])

const STATUS_CYCLE = ["Not Started", "In Progress", "Mastered"]
const STATUS_META  = {
  "Not Started": { cls: "s--none", pips: 0 },
  "In Progress": { cls: "s--wip",  pips: 1 },
  "Mastered":    { cls: "s--done", pips: 3 },
}

async function cycleStatus(sc) {
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(sc.status) + 1) % STATUS_CYCLE.length]
  const prev = sc.status
  sc.status = next   // optimistic update
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/progress/${sc.id}/`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    })
    if (!res.ok) throw new Error()
    notify(`${sc.skill_name}: ${next}`)
  } catch {
    sc.status = prev   // rollback
    notify("Update failed.", "error")
  }
}

async function removeScenario(sc) {
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/progress/${sc.id}/`, {
      method: "DELETE"
    })
    if (!res.ok) throw new Error()
    dog.value.progress = dog.value.progress.filter(p => p.id !== sc.id)
    notify(`"${sc.skill_name}" removed.`, "info")
  } catch {
    notify("Remove failed.", "error")
  }
}

// Add skill
const showAddScenario = ref(false)
const newSkillId      = ref("")
const scenarioError   = ref("")

const trackedSkillIds = computed(() => new Set((dog.value?.progress ?? []).map(p => p.skill)))
const availableSkills = computed(() => skills.value.filter(s => !trackedSkillIds.value.has(s.id)))

async function openAddScenario() {
  newSkillId.value    = ""
  scenarioError.value = ""
  showAddScenario.value = true
  await loadSkills()
}

async function saveScenario() {
  if (!newSkillId.value) { scenarioError.value = "Please select a skill."; return }
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/progress/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: Number(newSkillId.value), status: "Not Started" })
    })
    if (!res.ok) throw new Error()
    showAddScenario.value = false
    await loadDog()
    const sName = skills.value.find(s => s.id === Number(newSkillId.value))?.name
    notify(`"${sName}" added! 🏆`)
  } catch {
    scenarioError.value = "Failed to add. It may already be tracked."
  }
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3 — Training Log (TrainingNote)
// ═══════════════════════════════════════════════════════════════════
const trainingLogs = computed(() => {
  const notes = dog.value?.notes ?? []
  return [...notes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const showAddLog = ref(false)
const logSaving  = ref(false)
const logForm    = ref({ performed_on: "", note: "", duration: "" })
const logError   = ref("")

function openAddLog() {
  logForm.value  = { performed_on: new Date().toISOString().slice(0, 10), note: "", duration: "" }
  logError.value = ""
  showAddLog.value = true
}

async function saveLog() {
  if (!logForm.value.performed_on)   { logError.value = "Training date is required."; return }
  if (!logForm.value.note.trim())    { logError.value = "Notes are required."; return }
  logSaving.value = true
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/notes/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note:         logForm.value.note.trim(),
        performed_on: logForm.value.performed_on
      })
    })
    if (!res.ok) throw new Error(`${res.status}`)
    showAddLog.value = false
    await loadDog()
    notify("Training log entry saved! 📋")
  } catch {
    logError.value = "Failed to save. Try again."
  } finally {
    logSaving.value = false
  }
}

async function deleteLog(noteId) {
  try {
    const res = await fetch(`${API_BASE}/api/dogs/${props.dogId}/notes/${noteId}/`, {
      method: "DELETE"
    })
    if (!res.ok) throw new Error()
    dog.value.notes = dog.value.notes.filter(n => n.id !== noteId)
    notify("Log entry removed.", "info")
  } catch {
    notify("Remove failed.", "error")
  }
}

// ── Date helpers ───────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—"
  // Date-only strings (YYYY-MM-DD) need T00:00:00 to avoid timezone shift
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso)
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
            <div class="panel-avatar">{{ dog?.pet_name?.[0]?.toUpperCase() || "?" }}</div>
            <div>
              <div class="panel-title">{{ dog?.pet_name || "Loading…" }}</div>
              <div class="panel-subtitle">Training Profile</div>
            </div>
          </div>
          <button class="panel-close" @click="$emit('close')" id="close-training-panel">✕</button>
        </div>

        <!-- ── Loading ─────────────────────────────────────────── -->
        <div v-if="loading" class="panel-loading">
          <div class="panel-spinner" />
        </div>

        <template v-else>
          <!-- ── Tabs ──────────────────────────────────────────── -->
          <div class="panel-tabs">
            <button class="panel-tab" :class="{ 'panel-tab--active': activeTab === 'program' }"  @click="activeTab = 'program'"  id="tab-program">🎯 Program</button>
            <button class="panel-tab" :class="{ 'panel-tab--active': activeTab === 'scenarios' }" @click="activeTab = 'scenarios'" id="tab-scenarios">🏆 Skills</button>
            <button class="panel-tab" :class="{ 'panel-tab--active': activeTab === 'logs' }"      @click="activeTab = 'logs'"      id="tab-logs">📋 Log</button>
          </div>

          <!-- ── Panel Body ────────────────────────────────────── -->
          <div class="panel-body">

            <!-- ══ TAB: Training Program ═══════════════════════ -->
            <div v-if="activeTab === 'program'" class="tab-content">

              <!-- Status quick-switch -->
              <div class="status-switcher">
                <span class="status-sw-label">Training Status</span>
                <div class="status-sw-pills">
                  <button
                    v-for="opt in STATUS_OPTIONS"
                    :key="opt.value"
                    class="status-sw-btn"
                    :class="[`status-sw-btn--${opt.value}`, { 'status-sw-btn--on': dog?.status === opt.value || (!dog?.status && opt.value === 'upcoming') }]"
                    @click="setStatus(opt.value)"
                    :id="`status-${opt.value}-btn`"
                  >
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </div>

              <div v-if="!dog?.training_program && !programEditing" class="empty-tab">
                <div class="empty-tab-icon">🎯</div>
                <p class="empty-tab-title">No training program set</p>
                <p class="empty-tab-sub">Assign a skill-based program and add a description.</p>
                <button class="btn-primary" @click="editProgram" id="create-program-btn">Set Program</button>
              </div>

              <div v-else-if="!programEditing" class="program-view">
                <div class="program-view-header">
                  <h3 class="program-name">{{ dog.training_program_name }}</h3>
                  <button class="btn-edit" @click="editProgram" id="edit-program-btn">✏️ Edit</button>
                </div>
                <p class="program-desc">{{ dog.program_description || "No description added yet." }}</p>
              </div>

              <div v-else class="program-form">
                <div class="form-grid">
                  <label class="form-field form-field--full">
                    <span class="form-label">Training Program (Skill)</span>
                    <select v-model="programForm.training_program" class="form-input form-select" id="program-skill-select">
                      <option :value="null">— None —</option>
                      <option v-for="s in skills" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                  </label>

                  <label class="form-field form-field--full">
                    <span class="form-label">Program Description / Goals</span>
                    <textarea
                      v-model="programForm.program_description"
                      class="form-input form-textarea"
                      placeholder="Detailed breakdown, goals, and notes for this dog's program…"
                      id="program-desc-input"
                      rows="6"
                    />
                  </label>
                </div>

                <div class="form-actions">
                  <button class="btn-ghost" @click="cancelProgram">Cancel</button>
                  <button class="btn-primary" @click="saveProgram" :disabled="programSaving" id="save-program-btn">
                    {{ programSaving ? "Saving…" : "Save Program" }}
                  </button>
                </div>
              </div>
            </div>

            <!-- ══ TAB: Skills / Scenarios ═════════════════════ -->
            <div v-if="activeTab === 'scenarios'" class="tab-content">
              <div class="tab-actions-bar">
                <div class="tab-actions-info">{{ scenarios.length }} skill{{ scenarios.length !== 1 ? 's' : '' }} tracked</div>
                <button class="btn-primary btn-sm" @click="openAddScenario" id="add-scenario-btn">+ Track Skill</button>
              </div>

              <div v-if="scenarios.length === 0 && !showAddScenario" class="empty-tab">
                <div class="empty-tab-icon">🏆</div>
                <p class="empty-tab-title">No skills tracked yet</p>
                <p class="empty-tab-sub">Add skills from your library to track progress.</p>
              </div>

              <!-- Add Skill form -->
              <Transition name="slide">
                <div v-if="showAddScenario" class="inline-form-card">
                  <div class="inline-form-title">Track a Skill</div>
                  <label class="form-field">
                    <span class="form-label">Skill <span class="required">*</span></span>
                    <select v-model="newSkillId" class="form-input form-select" id="new-scenario-skill">
                      <option value="">Choose a skill…</option>
                      <option v-for="s in availableSkills" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                  </label>
                  <p v-if="!availableSkills.length && skills.length" class="form-hint-text">All available skills are already tracked.</p>
                  <p v-if="scenarioError" class="form-error">{{ scenarioError }}</p>
                  <div class="form-actions">
                    <button class="btn-ghost" @click="showAddScenario = false">Cancel</button>
                    <button class="btn-primary" @click="saveScenario" id="save-scenario-btn">Add</button>
                  </div>
                </div>
              </Transition>

              <!-- Skill cards -->
              <div class="scenarios-list">
                <div v-for="sc in scenarios" :key="sc.id" class="scenario-card">
                  <div class="scenario-top">
                    <div class="scenario-name">{{ sc.skill_name }}</div>
                    <button class="btn-icon-del" @click="removeScenario(sc)" :title="`Remove ${sc.skill_name}`">🗑</button>
                  </div>

                  <!-- 3-pip status + cycle button -->
                  <div class="rank-row">
                    <div class="rank-pips">
                      <div
                        v-for="n in 3"
                        :key="n"
                        class="rank-pip"
                        :class="{ 'rank-pip--filled': n <= STATUS_META[sc.status].pips }"
                      />
                    </div>
                    <button
                      class="status-badge"
                      :class="STATUS_META[sc.status].cls"
                      @click="cycleStatus(sc)"
                      :title="`Click to advance (currently ${sc.status})`"
                    >
                      {{ sc.status }}
                    </button>
                  </div>

                  <!-- Progress bar -->
                  <div class="rank-bar-track">
                    <div class="rank-bar-fill" :style="{ width: `${(STATUS_META[sc.status].pips / 3) * 100}%` }" />
                  </div>

                  <!-- Step-level progress -->
                  <div v-if="sc.step_progress?.length" class="steps-list">
                    <div v-for="step in sc.step_progress" :key="step.step" class="step-item" :class="{ 'step-item--done': step.completed }">
                      <span class="step-check">{{ step.completed ? "✓" : "○" }}</span>
                      <span class="step-name">{{ step.step_name }}</span>
                    </div>
                  </div>

                  <p v-if="sc.comment" class="scenario-notes">{{ sc.comment }}</p>
                </div>
              </div>
            </div>

            <!-- ══ TAB: Training Log ════════════════════════════ -->
            <div v-if="activeTab === 'logs'" class="tab-content">
              <div class="tab-actions-bar">
                <div class="tab-actions-info">{{ trainingLogs.length }} entr{{ trainingLogs.length !== 1 ? 'ies' : 'y' }}</div>
                <button class="btn-primary btn-sm" @click="openAddLog" id="add-log-btn">+ Log Session</button>
              </div>

              <!-- Add Log form -->
              <Transition name="slide">
                <div v-if="showAddLog" class="inline-form-card">
                  <div class="inline-form-title">New Training Entry</div>
                  <div class="form-grid">
                    <label class="form-field">
                      <span class="form-label">Training Date <span class="required">*</span></span>
                      <input v-model="logForm.performed_on" type="date" class="form-input" id="log-performed-on" />
                    </label>
                    <label class="form-field form-field--full">
                      <span class="form-label">Notes <span class="required">*</span></span>
                      <textarea v-model="logForm.note" class="form-input form-textarea" placeholder="What was worked on? How did it go?" rows="4" id="log-notes" />
                    </label>
                    <p v-if="logError" class="form-error">{{ logError }}</p>
                  </div>
                  <div class="form-actions">
                    <button class="btn-ghost" @click="showAddLog = false">Cancel</button>
                    <button class="btn-primary" @click="saveLog" :disabled="logSaving" id="save-log-btn">
                      {{ logSaving ? "Saving…" : "Save Entry" }}
                    </button>
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
                        <span class="log-date-value">{{ fmtDate(log.performed_on) }}</span>
                      </div>
                      <div class="log-divider" />
                      <div class="log-published">
                        <span class="log-date-label">Published</span>
                        <span class="log-date-value log-date-value--muted">{{ fmtDateTime(log.created_at) }}</span>
                      </div>
                    </div>
                    <p class="log-notes">{{ log.note }}</p>
                    <div class="log-actions">
                      <button class="btn-icon-del" @click="deleteLog(log.id)" title="Remove entry">🗑 Remove</button>
                    </div>
                  </div>
                </article>
              </div>
            </div>

          </div><!-- /panel-body -->
        </template>

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

.panel-header-left { display: flex; align-items: center; gap: 14px; }

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

.panel-title    { font-size: 1.15rem; font-weight: 700; color: #1a1028; line-height: 1.2; }
.panel-subtitle { font-size: 0.8rem; color: #9d8fc0; margin-top: 1px; }

.panel-close {
  background: none;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 11px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #6b7280;
  transition: background 0.15s;
  line-height: 1;
}
.panel-close:hover { background: #f3f4f6; }

/* ── Loading ─────────────────────────────────────────────────────── */
.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}
.panel-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #ede8ff;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

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
.panel-tab:hover       { color: #7c3aed; background: #faf5ff; }
.panel-tab--active     { color: #7c3aed; background: #fff; border: 1.5px solid #f3efff; border-bottom-color: #fff; }

/* ── Body ────────────────────────────────────────────────────────── */
.panel-body { flex: 1; overflow-y: auto; padding: 24px; }

/* ── Empty Tab ───────────────────────────────────────────────────── */
.empty-tab      { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 24px; gap: 8px; }
.empty-tab-icon  { font-size: 2.5rem; margin-bottom: 6px; }
.empty-tab-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: #1a1028; }
.empty-tab-sub   { margin: 0 0 16px; font-size: 0.875rem; color: #9d8fc0; }

/* ── Tab Actions Bar ─────────────────────────────────────────────── */
.tab-actions-bar  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
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
.btn-primary:hover    { opacity: 0.9; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn-primary.btn-sm   { padding: 7px 14px; font-size: 0.82rem; }

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
.form-grid      { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field     { display: grid; gap: 5px; }
.form-field--full { grid-column: 1 / -1; }
.form-label     { font-size: 0.82rem; font-weight: 600; color: #4b4060; }
.required       { color: #a855f7; }
.form-hint-text { font-size: 0.8rem; color: #9ca3af; margin: 4px 0 0; }

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
.form-input:focus   { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.15); }
.form-input::placeholder { color: #c4b5fd; }
.form-textarea { resize: vertical; min-height: 80px; }
.form-select   { cursor: pointer; appearance: auto; }
.form-error    { margin: 0; grid-column: 1/-1; font-size: 0.82rem; color: #ef4444; font-weight: 500; }
.form-actions  { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

/* ── Program View ────────────────────────────────────────────────── */
.program-view-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.program-name  { margin: 0; font-size: 1.2rem; font-weight: 700; color: #1a1028; }
.program-desc  { margin: 0; font-size: 0.9rem; color: #4b4060; line-height: 1.7; white-space: pre-wrap; }

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

.scenario-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.scenario-name { font-size: 1rem; font-weight: 700; color: #1a1028; }
.scenario-notes { margin: 10px 0 0; font-size: 0.82rem; color: #7c6f9a; line-height: 1.5; }

/* Pips */
.rank-row  { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.rank-pips { display: flex; gap: 8px; }

.rank-pip {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2.5px solid #ddd6fe;
  background: #fff;
  transition: background 0.2s, border-color 0.2s;
}
.rank-pip--filled { background: linear-gradient(135deg, #7c3aed, #c084fc); border-color: #7c3aed; }

/* Status badge — cycles on click */
.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  font-family: inherit;
  letter-spacing: 0.02em;
}
.status-badge:hover   { opacity: 0.85; transform: scale(1.04); }
.status-badge.s--none { background: #f3f4f6; color: #6b7280; border-color: #e5e7eb; }
.status-badge.s--wip  { background: #fef9c3; color: #854d0e; border-color: #fde047; }
.status-badge.s--done { background: #f0fdf4; color: #166534; border-color: #86efac; }

/* Progress bar */
.rank-bar-track { height: 5px; border-radius: 999px; background: #ede8ff; overflow: hidden; }
.rank-bar-fill  { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #7c3aed, #c084fc); transition: width 0.35s cubic-bezier(0.34,1.56,0.64,1); }

/* Steps */
.steps-list { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #ddd6fe; display: grid; gap: 5px; }
.step-item  { display: flex; align-items: baseline; gap: 8px; font-size: 0.82rem; }
.step-check { font-size: 0.78rem; width: 14px; flex-shrink: 0; color: #c4b5fd; }
.step-name  { color: #4b4060; }
.step-item--done .step-check { color: #22c55e; }
.step-item--done .step-name  { color: #9d8fc0; text-decoration: line-through; }

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

/* ── Training Log Timeline ───────────────────────────────────────── */
.log-timeline {
  display: flex;
  flex-direction: column;
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

.log-entry        { display: flex; gap: 14px; position: relative; padding-bottom: 20px; }
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

.log-performed, .log-published { display: flex; flex-direction: column; gap: 2px; }
.log-date-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9d8fc0; }
.log-date-value { font-size: 0.88rem; font-weight: 600; color: #1a1028; }
.log-date-value--muted { color: #9d8fc0; font-weight: 500; }
.log-divider    { width: 1px; height: 30px; background: #ede8ff; }

.log-notes   { margin: 0 0 10px; font-size: 0.88rem; color: #4b4060; line-height: 1.65; white-space: pre-wrap; }
.log-actions { display: flex; justify-content: flex-end; }

/* ── Status Switcher ─────────────────────────────────────────────── */
.status-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
  padding: 14px 16px;
  background: #faf5ff;
  border: 1.5px solid #ede8ff;
  border-radius: 16px;
  flex-wrap: wrap;
}
.status-sw-label { font-size: 0.78rem; font-weight: 700; color: #9d8fc0; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
.status-sw-pills { display: flex; gap: 6px; flex-wrap: wrap; }

.status-sw-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid transparent;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  background: #fff;
  color: #7c6f9a;
  border-color: #ede8ff;
}
.status-sw-btn:hover { border-color: #c4b5fd; color: #7c3aed; transform: translateY(-1px); }

/* On state per status */
.status-sw-btn--upcoming.status-sw-btn--on  { background: #e0f2fe; color: #0369a1; border-color: #7dd3fc; }
.status-sw-btn--active.status-sw-btn--on    { background: #dcfce7; color: #166534; border-color: #86efac; }
.status-sw-btn--completed.status-sw-btn--on { background: #ede8ff; color: #5b21b6; border-color: #c4b5fd; }

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
.panel-enter-from .panel-modal  { transform: translateY(16px) scale(0.97); }
.panel-leave-to .panel-modal    { transform: translateY(8px) scale(0.97); }

.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from, .slide-leave-to       { opacity: 0; transform: translateY(-8px); }

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translateY(10px); }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .panel-body { padding: 16px; }
  .form-grid  { grid-template-columns: 1fr; }
  .log-dates  { gap: 10px; }
  .log-divider { display: none; }
  .panel-tabs { padding: 10px 16px 0; }
  .panel-tab  { padding: 7px 10px; font-size: 0.78rem; }
}
</style>
