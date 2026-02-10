
<script setup>
defineProps({ session: Object })
</script>
<template>
<article class="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
  <div class="font-semibold">{{ session.type }} • {{ session.focus || "No focus set" }}</div>
</article>
</template>
