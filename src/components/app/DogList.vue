<script setup>
import { ref, onMounted } from "vue";

const dogs = ref([]);
const loading = ref(true);
const error = ref(null);

// Backend base (Django)
const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8000";

// If your backend serves media from the same domain/port, this is correct:
const MEDIA_BASE = API_BASE;

function mediaUrl(path) {
  // picture can be null or "/media/..."
  if (!path) return null;
  // If backend ever returns full URL, keep it
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Ensure it becomes "http://localhost:8000/media/..."
  return `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function loadDogs() {
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`${API_BASE}/api/dogs/`, {
      headers: { Accept: "application/json" },
      // credentials: "include", // uncomment if using cookie/session auth
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);

    dogs.value = await res.json(); // your API returns an array
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadDogs);
</script>

<template>
  <section class="dogs-page">
    <div class="dogs-container">
      <header class="dogs-header">
        <h2 class="dogs-title">Dogs</h2>
        <p class="dogs-subtitle">Client dogs currently in the system.</p>
      </header>

      <p v-if="loading" class="dogs-state">Loading…</p>
      <p v-else-if="error" class="dogs-error">Error: {{ error }}</p>

      <div v-else class="dog-grid">
        <article v-for="dog in dogs" :key="dog.id" class="dog-card">
          <div class="dog-media">
            <img
              v-if="dog.picture"
              :src="mediaUrl(dog.picture)"
              :alt="`${dog.pet_name} photo`"
              class="dog-img"
              loading="lazy"
            />
            <div v-else class="dog-img--placeholder">
              <span>No photo</span>
            </div>
          </div>

          <div class="dog-body">
            <div class="dog-top">
              <h3 class="dog-name">{{ dog.pet_name }}</h3>
              <span class="dog-badge" v-if="dog.training_program">
                Program {{ dog.training_program }}
              </span>
            </div>

            <p class="dog-meta">
              <span v-if="dog.breed">{{ dog.breed }}</span>
              <span v-if="dog.age !== null && dog.age !== undefined"> • {{ dog.age }} yrs</span>
              <span v-if="dog.client"> • Client {{ dog.client }}</span>
            </p>

            <p v-if="dog.program_description" class="dog-desc">
              {{ dog.program_description }}
            </p>

            <div class="dog-actions">
              <a :href="`/dogs/${dog.id}`" class="dog-link">View</a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* page padding so the grid isn't glued to the edges */
.dogs-page {
  padding: 24px 16px;
}

/* centered container so cards don't stretch across the whole screen */
.dogs-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* header spacing */
.dogs-header {
  margin-bottom: 16px;
}
.dogs-title {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.2;
}
.dogs-subtitle {
  margin: 6px 0 0;
  opacity: 0.75;
}

.dogs-state {
  margin: 12px 0;
}
.dogs-error {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #f3c7c7;
  background: #fff3f3;
  border-radius: 10px;
}

/*
  Key fix:
  - use a stronger min width (280px) to create real cards
  - add more gap
*/
.dog-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: start;
}

.dog-card {
  border: 1px solid #e7e7e7;
  border-radius: 14px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}

/* media area keeps consistent card look */
.dog-media {
  background: #f6f6f6;
}
.dog-img {
  width: 100%;
  height: 170px;
  object-fit: cover;
  display: block;
}
.dog-img--placeholder {
  height: 170px;
  display: grid;
  place-items: center;
  color: rgba(0, 0, 0, 0.55);
  font-size: 0.95rem;
}

.dog-body {
  padding: 14px;
}

.dog-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.dog-name {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.2;
}

.dog-badge {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e7e7e7;
  background: #fafafa;
  white-space: nowrap;
}

.dog-meta {
  margin: 8px 0 10px;
  opacity: 0.75;
}

.dog-desc {
  margin: 0 0 12px;
  line-height: 1.35;
}

.dog-actions {
  display: flex;
  justify-content: flex-end;
}

.dog-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e7e7e7;
  text-decoration: none;
}

.dog-link:hover {
  background: #fafafa;
}

/* mobile polish */
@media (max-width: 420px) {
  .dogs-page {
    padding: 18px 12px;
  }
  .dog-img,
  .dog-img--placeholder {
    height: 150px;
  }
}
</style>

