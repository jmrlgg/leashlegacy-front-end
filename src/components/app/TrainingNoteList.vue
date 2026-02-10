<script setup>
import { ref, onMounted, computed } from "vue";

const notes = ref([]);
const loading = ref(true);
const error = ref(null);

// Filter
const dogFilter = ref(""); // set to "1" to filter

// Backend base (Django)
const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8000";
const MEDIA_BASE = API_BASE;

// Build endpoint with optional ?dog=
const endpoint = computed(() => {
  const base = `${API_BASE}/api/training-notes/`;
  const dogId = String(dogFilter.value || "").trim();
  if (!dogId) return base;
  const params = new URLSearchParams({ dog: dogId });
  return `${base}?${params.toString()}`;
});

function fileUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString();
}

async function loadNotes() {
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(endpoint.value, {
      headers: { Accept: "application/json" },
      // credentials: "include",
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);

    notes.value = await res.json(); // array
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadNotes);
</script>

<template>
  <section class="notes-page">
    <div class="notes-container">
      <header class="notes-header">
        <div>
          <h2 class="notes-title">Training Notes</h2>
          <p class="notes-subtitle">Notes logged per dog, with attachments.</p>
        </div>

        <div class="notes-controls">
          <label class="notes-label">
            Dog ID
            <input
              v-model="dogFilter"
              class="notes-input"
              inputmode="numeric"
              placeholder="All"
              @keyup.enter="loadNotes"
            />
          </label>

          <button class="notes-btn" @click="loadNotes">Refresh</button>
        </div>
      </header>

      <p v-if="loading" class="notes-state">Loading…</p>
      <p v-else-if="error" class="notes-error">Error: {{ error }}</p>

      <div v-else class="notes-grid">
        <article v-for="n in notes" :key="n.id" class="note-card">
          <div class="note-top">
            <div class="note-badges">
              <span class="note-badge">Dog {{ n.dog }}</span>
              <span class="note-badge note-badge--muted">Note #{{ n.id }}</span>
            </div>

            <time class="note-date" :datetime="n.created_at">
              {{ formatDate(n.created_at) }}
            </time>
          </div>

          <p class="note-text">{{ n.note }}</p>

          <div class="note-attachments">
            <p class="note-attachments-title">Attachments</p>

            <ul v-if="n.attachments?.length" class="note-attachments-list">
              <li v-for="a in n.attachments" :key="a.id" class="note-attachment-item">
                <a
                  class="note-attachment-link"
                  :href="fileUrl(a.file)"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open file
                </a>
              </li>
            </ul>

            <p v-else class="note-attachments-empty">No attachments</p>
          </div>

          <div class="note-actions">
            <a class="note-link" :href="`/dogs/${n.dog}`">View Dog</a>
          </div>
        </article>

        <p v-if="notes.length === 0" class="notes-empty">No training notes found.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.notes-page { padding: 24px 16px; }
.notes-container { max-width: 1100px; margin: 0 auto; }

.notes-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.notes-title { margin: 0; font-size: 1.5rem; line-height: 1.2; }
.notes-subtitle { margin: 6px 0 0; opacity: 0.75; }

.notes-controls { display: flex; align-items: end; gap: 10px; }
.notes-label { display: grid; gap: 6px; font-size: 0.85rem; opacity: 0.85; }

.notes-input {
  width: 120px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e7e7e7;
  outline: none;
}
.notes-input:focus { border-color: #cfcfcf; }

.notes-btn {
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #e7e7e7;
  background: white;
  cursor: pointer;
}
.notes-btn:hover { background: #fafafa; }

.notes-state { margin: 12px 0; }
.notes-error {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #f3c7c7;
  background: #fff3f3;
  border-radius: 10px;
}

.notes-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  align-items: start;
}

.note-card {
  border: 1px solid #e7e7e7;
  border-radius: 14px;
  background: white;
  padding: 14px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.04);
}

.note-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.note-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.note-badge {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e7e7e7;
  background: #fafafa;
  white-space: nowrap;
}
.note-badge--muted { opacity: 0.7; }

.note-date { font-size: 0.8rem; opacity: 0.7; white-space: nowrap; }

.note-text {
  margin: 0;
  line-height: 1.4;
  white-space: pre-wrap;
}

.note-attachments { margin-top: 12px; padding-top: 12px; border-top: 1px solid #efefef; }
.note-attachments-title { margin: 0 0 8px; font-weight: 600; font-size: 0.95rem; }
.note-attachments-list { margin: 0; padding-left: 18px; }
.note-attachments-empty { margin: 0; opacity: 0.7; }

.note-attachment-link {
  text-decoration: underline;
  display: inline-block;
  padding: 2px 0;
}

.note-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
.note-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e7e7e7;
  text-decoration: none;
}
.note-link:hover { background: #fafafa; }

.notes-empty { opacity: 0.7; }

@media (max-width: 420px) {
  .notes-page { padding: 18px 12px; }
  .notes-grid { grid-template-columns: 1fr; }
}
</style>
