<script setup>
import { ref } from "vue";

const taglines = [
  "Better Dogs. Better Homes.",
  "Every Behavior Tells a Story.",
  "Structure First. Freedom Follows.",
  "Calm Is Trained.",
];

const tagline = ref("");

function pickDailyTagline() {
  const key = "llk9_tagline_day";
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const stored = localStorage.getItem(key);

  if (stored) {
    const [date, value] = stored.split("|");
    if (date === today && value) return value;
  }

  const value = taglines[Math.floor(Math.random() * taglines.length)];
  localStorage.setItem(key, `${today}|${value}`);
  return value;
}

// Runs only in browser (localStorage)
if (typeof window !== "undefined") {
  tagline.value = pickDailyTagline();
}
</script>

<template>
  <div class="flex flex-col leading-none">
    <div
      class="font-sans text-2xl sm:text-3xl font-bold text-gray-900 uppercase tracking-wide"
    >
      Leash Legacy K9 Training
    </div>

    <span
      class="mt-1 text-[10px] sm:text-xs font-semibold tracking-[0.18em] text-gray-600 uppercase"
    >
      {{ tagline }}
    </span>
  </div>
</template>
