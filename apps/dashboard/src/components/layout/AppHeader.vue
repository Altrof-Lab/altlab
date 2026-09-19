<script setup lang="ts">
import { ref, onMounted } from 'vue';

defineProps<{
  isCollapsed: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void;
}>();

const isDark = ref(false);

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark');
});

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};
</script>

<template>
  <header class="h-16 px-6 border-b border-gray-100 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
    <!-- Left Area: Sidebar Toggle & Category -->
    <div class="flex items-center gap-4">
      <button 
        @click="emit('toggle-sidebar')"
        class="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Toggle Sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      <!-- Current Route Title -->
      <div class="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span class="font-semibold text-gray-900 dark:text-white">Centralized Space</span>
      </div>
    </div>

    <!-- Right Area: Search, Actions & User Profile -->
    <div class="flex items-center gap-3">
      <!-- Search Input -->
      <div class="relative hidden md:block">
        <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input 
          type="text" 
          placeholder="Search ports, servers, logs..."
          class="pl-10 pr-10 py-2 w-64 bg-gray-100/80 dark:bg-gray-800/60 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 text-xs rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all"
        />
        <kbd class="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">⌘K</kbd>
      </div>

      <!-- Dark/Light Theme Toggle -->
      <button 
        @click="toggleDarkMode"
        class="p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <svg v-if="isDark" class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Notifications Bell -->
      <button 
        class="relative p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Notifications"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-900"></span>
      </button>

      <!-- User Avatar -->
      <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          AT
        </div>
      </div>
    </div>
  </header>
</template>
