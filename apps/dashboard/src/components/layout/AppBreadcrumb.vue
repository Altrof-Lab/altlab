<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <nav class="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium px-6 py-3">
    <router-link to="/" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
      Homelab
    </router-link>
    <span>/</span>
    <span class="text-gray-700 dark:text-gray-200 capitalize">
      {{ route.name || 'Overview' }}
    </span>
  </nav>
</template>
