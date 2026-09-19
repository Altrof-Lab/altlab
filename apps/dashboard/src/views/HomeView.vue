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
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Centralized Lab Space</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Server Overview & System Metrics</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading lab nodes...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="server in servers" 
        :key="server.id"
        class="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full" :class="server.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'"></span>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ server.name }}</h3>
          </div>
          <span class="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {{ server.ip }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-gray-100 dark:border-gray-900">
          <div>
            <span class="text-gray-500 block">CPU Usage</span>
            <span class="font-medium text-gray-900 dark:text-gray-200">{{ server.cpuUsagePercent }}%</span>
          </div>
          <div>
            <span class="text-gray-500 block">RAM Usage</span>
            <span class="font-medium text-gray-900 dark:text-gray-200">{{ server.memoryUsagePercent }}%</span>
          </div>
          <div>
            <span class="text-gray-500 block">Containers</span>
            <span class="font-medium text-gray-900 dark:text-gray-200">{{ server.containersCount }} active</span>
          </div>
          <div>
            <span class="text-gray-500 block">VMs</span>
            <span class="font-medium text-gray-900 dark:text-gray-200">{{ server.virtualMachinesCount }} running</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
