<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ServerStatusDto } from '@altlab/shared';

const servers = ref<ServerStatusDto[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('/api/servers');
    if (res.ok) {
      servers.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to load servers:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Top Blue Hero Feature Banner (Matching Screenshot #2) -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-md">
      <div class="relative z-10 space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Lab Cluster Online
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">Centralized Lab Control Space</h2>
        <p class="text-sm text-blue-100 max-w-xl">
          Real-time monitoring for homelab infrastructure, Docker containers, virtual machines, and network ports.
        </p>
      </div>

      <!-- Decorative background graphics -->
      <div class="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute right-32 -top-12 w-48 h-48 bg-indigo-400/20 rounded-full blur-xl pointer-events-none"></div>
    </div>

    <!-- 4 Metrics Stat Cards (Matching Screenshot #2) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-2">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Active Nodes</span>
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">2 / 2</span>
          <span class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">100% Up</span>
        </div>
        <p class="text-[11px] text-gray-400">All lab servers healthy</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-2">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Avg CPU Load</span>
          <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">10.35%</span>
          <span class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">Optimal</span>
        </div>
        <p class="text-[11px] text-gray-400">Normal load range</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-2">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Active Containers</span>
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">17</span>
          <span class="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">Docker</span>
        </div>
        <p class="text-[11px] text-gray-400">Across 2 host nodes</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-2">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Network Ports</span>
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">61</span>
          <span class="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">Exposed</span>
        </div>
        <p class="text-[11px] text-gray-400">All services mapped</p>
      </div>
    </div>

    <!-- Server List Data Table (Matching Screenshot #1 & #2) -->
    <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">Infrastructure Nodes</h3>
          <p class="text-xs text-gray-500">Live metrics returned from altlab-core BFF</p>
        </div>
        <button class="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/60 rounded-xl transition-colors">
          + Add Node
        </button>
      </div>

      <div v-if="loading" class="text-center py-8 text-sm text-gray-400">
        Fetching server nodes...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800/60 text-xs text-gray-400 font-semibold uppercase tracking-wider">
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Node Name</th>
              <th class="py-3 px-4">IP Address</th>
              <th class="py-3 px-4">CPU Load</th>
              <th class="py-3 px-4">RAM Load</th>
              <th class="py-3 px-4">Containers</th>
              <th class="py-3 px-4">VMs</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800/40">
            <tr v-for="server in servers" :key="server.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
              <td class="py-3.5 px-4">
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="server.status === 'online' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-red-700'"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {{ server.status }}
                </span>
              </td>
              <td class="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                {{ server.name }}
              </td>
              <td class="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                {{ server.ip }}
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-600 rounded-full" :style="{ width: server.cpuUsagePercent + '%' }"></div>
                  </div>
                  <span class="text-xs font-medium">{{ server.cpuUsagePercent }}%</span>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 rounded-full" :style="{ width: server.memoryUsagePercent + '%' }"></div>
                  </div>
                  <span class="text-xs font-medium">{{ server.memoryUsagePercent }}%</span>
                </div>
              </td>
              <td class="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                {{ server.containersCount }}
              </td>
              <td class="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                {{ server.virtualMachinesCount }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
