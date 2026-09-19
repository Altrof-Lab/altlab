<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

defineProps<{
  isCollapsed: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-collapse'): void;
}>();

const route = useRoute();

const navSections = [
  {
    title: 'DASHBOARDS',
    items: [
      { name: 'Overview', path: '/', icon: 'home' },
      { name: 'Infrastructure', path: '/infrastructure', icon: 'server' },
      { name: 'Monitoring', path: '/monitoring', icon: 'activity' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Servers & VMs', path: '/servers', icon: 'cpu' },
      { name: 'Containers', path: '/containers', icon: 'box' },
      { name: 'Network & Ports', path: '/network', icon: 'network' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/settings', icon: 'settings' },
      { name: 'Logs & Audit', path: '/logs', icon: 'file-text' },
    ],
  },
];
</script>

<template>
  <aside 
    class="flex flex-col transition-all duration-300 ease-in-out select-none"
    :class="[
      isCollapsed ? 'w-20 px-3' : 'w-64 px-4',
      'py-5 text-gray-700 dark:text-gray-300'
    ]"
  >
    <!-- Brand Header -->
    <div class="flex items-center gap-3 px-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20 shrink-0">
        A
      </div>
      <div v-if="!isCollapsed" class="flex flex-col overflow-hidden">
        <span class="font-extrabold text-lg leading-tight tracking-tight text-gray-900 dark:text-white">ALT<span class="text-blue-600">LAB</span></span>
        <span class="text-[10px] uppercase font-semibold tracking-wider text-gray-400">Centralized Space</span>
      </div>
    </div>

    <!-- Navigation List -->
    <div class="flex-1 space-y-6 overflow-y-auto no-scrollbar">
      <div v-for="section in navSections" :key="section.title" class="space-y-1.5">
        <div 
          v-if="!isCollapsed" 
          class="px-3 text-[11px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase"
        >
          {{ section.title }}
        </div>

        <router-link
          v-for="item in section.items"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group"
          :class="[
            route.path === item.path
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'hover:bg-gray-200/60 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
          :title="isCollapsed ? item.name : undefined"
        >
          <!-- Icons -->
          <svg v-if="item.icon === 'home'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <svg v-else-if="item.icon === 'server'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
          <svg v-else-if="item.icon === 'activity'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <svg v-else-if="item.icon === 'cpu'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
          <svg v-else-if="item.icon === 'box'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <svg v-else-if="item.icon === 'network'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <svg v-else-if="item.icon === 'settings'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg v-else class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>

          <span v-if="!isCollapsed" class="truncate">{{ item.name }}</span>
        </router-link>
      </div>
    </div>

    <!-- Collapse Toggle Button at bottom -->
    <button 
      @click="emit('toggle-collapse')"
      class="mt-auto flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
      :title="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
    >
      <svg 
        class="w-5 h-5 transition-transform duration-300"
        :class="{ 'rotate-180': isCollapsed }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
      </svg>
    </button>
  </aside>
</template>
