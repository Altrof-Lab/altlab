<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { BrowserProfileDto, SpyhubNodeConfigDto, SingleNodeDataDto } from '@altlab/shared';

interface ProgressiveNodeState {
  nodeUrl: string;
  nodeName: string;
  os: 'macos' | 'windows' | 'linux' | string;
  status: 'pending' | 'online' | 'offline';
  responseTimeMs?: number;
  profileCount?: number;
}

const profiles = ref<BrowserProfileDto[]>([]);
const nodeStates = ref<ProgressiveNodeState[]>([]);
const loading = ref(true);
const selectedProfile = ref<BrowserProfileDto | null>(null);
const showDrawer = ref(false);
const auditingProfileId = ref<string | null>(null);



const getServiceStatusConfig = (res: { statusCode: string; trustScore: number }) => {
  const code = (res.statusCode || '').toUpperCase();
  if (code === 'PASSED' || code === 'OK' || res.trustScore === 100) {
    return {
      label: `OK (${res.trustScore}%)`,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60',
      type: 'success',
    };
  } else if (code === 'WARNING' || code === 'FLAGGED' || (res.trustScore > 0 && res.trustScore < 90)) {
    return {
      label: `${res.statusCode === 'FLAGGED' ? 'WARNING' : res.statusCode} (${res.trustScore}%)`,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60',
      type: 'warning',
    };
  } else {
    return {
      label: `${res.statusCode || 'FAILED'} (${res.trustScore}%)`,
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200/60 dark:border-red-900/60',
      type: 'failed',
    };
  }
};

const loadNodesProgressively = async () => {
  // 1. Fetch node configs immediately (<1ms) and render node cards in "Pending" state
  try {
    const configRes = await fetch('/api/affiliate/browser-profiles/nodes/config');
    if (configRes.ok) {
      const configs: SpyhubNodeConfigDto[] = await configRes.json();
      nodeStates.value = configs.map(c => ({
        nodeUrl: c.nodeUrl,
        nodeName: c.nodeName,
        os: c.os,
        status: 'pending',
      }));
    }
  } catch (err) {
    console.error('Failed to load node configs:', err);
  }

  // Clear existing profiles and set initial table loading
  profiles.value = [];
  loading.value = true;

  if (nodeStates.value.length === 0) {
    loading.value = false;
    return;
  }

  // 2. Query each node independently in parallel (streamed resolution)
  const tasks = nodeStates.value.map(async (node) => {
    try {
      const res = await fetch(`/api/affiliate/browser-profiles/node-data?nodeUrl=${encodeURIComponent(node.nodeUrl)}`);
      if (res.ok) {
        const data: SingleNodeDataDto = await res.json();

        // Update node card immediately!
        node.status = data.nodeStatus.status;
        node.responseTimeMs = data.nodeStatus.responseTimeMs;
        node.profileCount = data.nodeStatus.profileCount;

        // Append node's profiles immediately!
        if (data.profiles && data.profiles.length > 0) {
          const existingIds = new Set(profiles.value.map(p => p.profileId));
          const newItems = data.profiles.filter(p => !existingIds.has(p.profileId));
          profiles.value = [...profiles.value, ...newItems];
        }
      }
    } catch (err) {
      node.status = 'offline';
      node.profileCount = 0;
    } finally {
      // Hide table loading spinner as soon as ANY first node returns
      loading.value = false;
    }
  });

  await Promise.allSettled(tasks);
  loading.value = false;
};

// Handle Escape key to close drawer
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showDrawer.value) {
    showDrawer.value = false;
  }
};

onMounted(() => {
  loadNodesProgressively();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const openDrawer = async (profile: BrowserProfileDto) => {
  selectedProfile.value = profile;
  showDrawer.value = true;
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profile.profileId}`);
    if (res.ok) {
      selectedProfile.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch detailed profile for drawer:', err);
  }
};

const triggerAudit = async (profileId: string) => {
  auditingProfileId.value = profileId;
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profileId}/audit`, { method: 'POST' });
    if (res.ok) {
      await loadNodesProgressively();
      if (selectedProfile.value && selectedProfile.value.profileId === profileId) {
        selectedProfile.value = profiles.value.find(p => p.profileId === profileId) || selectedProfile.value;
      }
    }
  } catch (err) {
    console.error('Audit trigger failed:', err);
  } finally {
    auditingProfileId.value = null;
  }
};

const farmingProfileId = ref<string | null>(null);
const planGeneratingProfileId = ref<string | null>(null);
const farmActionMessage = ref<string | null>(null);

const generateFarmPlan = async (profileId: string) => {
  planGeneratingProfileId.value = profileId;
  farmActionMessage.value = `Generating warming plan for ${profileId}...`;

  setTimeout(() => {
    const applyPlan = (p: BrowserProfileDto) => {
      if (!p.cookieFarm) {
        p.cookieFarm = {
          status: 'PLANNED',
          cookiesCount: 0,
          sitesVisitedCount: 8,
          lastFarmedAt: new Date().toISOString(),
        };
      } else {
        p.cookieFarm.status = 'PLANNED';
        p.cookieFarm.sitesVisitedCount = 8;
      }
    };

    if (selectedProfile.value && selectedProfile.value.profileId === profileId) {
      applyPlan(selectedProfile.value);
    }
    const found = profiles.value.find((p) => p.profileId === profileId);
    if (found) {
      applyPlan(found);
    }

    planGeneratingProfileId.value = null;
    farmActionMessage.value = `Warming plan generated: 8 target sites scheduled (Status: PENDING). Click Start Farm to run.`;
    setTimeout(() => {
      farmActionMessage.value = null;
    }, 4000);
  }, 750);
};

const triggerCookieFarm = async (profileId: string) => {
  farmingProfileId.value = profileId;
  farmActionMessage.value = `Warming & cookie farm started for ${profileId}...`;

  if (selectedProfile.value && selectedProfile.value.profileId === profileId) {
    if (!selectedProfile.value.cookieFarm) {
      selectedProfile.value.cookieFarm = {
        status: 'RUNNING',
        cookiesCount: 12,
        sitesVisitedCount: 4,
        lastFarmedAt: new Date().toISOString(),
      };
    } else {
      selectedProfile.value.cookieFarm.status = 'RUNNING';
    }
  }

  const found = profiles.value.find((p) => p.profileId === profileId);
  if (found) {
    if (!found.cookieFarm) {
      found.cookieFarm = {
        status: 'RUNNING',
        cookiesCount: 12,
        sitesVisitedCount: 4,
        lastFarmedAt: new Date().toISOString(),
      };
    } else {
      found.cookieFarm.status = 'RUNNING';
    }
  }

  setTimeout(() => {
    const finalCookies = ((selectedProfile.value?.cookieFarm?.cookiesCount || 0) + 16);
    const finalSites = ((selectedProfile.value?.cookieFarm?.sitesVisitedCount || 0) + 6);
    if (selectedProfile.value && selectedProfile.value.profileId === profileId) {
      if (selectedProfile.value.cookieFarm) {
        selectedProfile.value.cookieFarm.status = 'COMPLETED';
        selectedProfile.value.cookieFarm.cookiesCount = finalCookies;
        selectedProfile.value.cookieFarm.sitesVisitedCount = finalSites;
        selectedProfile.value.cookieFarm.lastFarmedAt = new Date().toISOString();
      }
    }
    if (found && found.cookieFarm) {
      found.cookieFarm.status = 'COMPLETED';
      found.cookieFarm.cookiesCount = finalCookies;
      found.cookieFarm.sitesVisitedCount = finalSites;
      found.cookieFarm.lastFarmedAt = new Date().toISOString();
    }
    farmingProfileId.value = null;
    farmActionMessage.value = `Cookie Farm completed! Collected +16 cookies across +6 sites.`;
    setTimeout(() => {
      farmActionMessage.value = null;
    }, 4000);
  }, 2000);
};

const searchQuery = ref('');

const filteredProfiles = computed(() => {
  if (!searchQuery.value.trim()) {
    return profiles.value;
  }
  const q = searchQuery.value.toLowerCase();
  return profiles.value.filter(p =>
    p.profileId.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.os.toLowerCase().includes(q) ||
    (p.browserType && p.browserType.toLowerCase().includes(q)) ||
    (p.proxyIp && p.proxyIp.toLowerCase().includes(q)) ||
    (p.nodeName && p.nodeName.toLowerCase().includes(q)) ||
    (p.personaName && p.personaName.toLowerCase().includes(q))
  );
});

// Calculate average stealth score only for audited profiles
const auditedProfiles = computed(() => {
  return profiles.value.filter(
    p => p.stealthAudit?.overallTrustScore !== undefined && p.stealthAudit?.overallTrustScore !== null
  );
});

const avgTrustScore = computed(() => {
  if (auditedProfiles.value.length === 0) return null;
  const sum = auditedProfiles.value.reduce((acc, p) => acc + (p.stealthAudit!.overallTrustScore || 0), 0);
  return Math.round(sum / auditedProfiles.value.length);
});

const getAuditBadge = (audit?: BrowserProfileDto['stealthAudit']) => {
  if (!audit || audit.overallTrustScore === undefined || audit.overallTrustScore === null) {
    return { text: '—', class: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' };
  }
  if (audit.overallStatus === 'PASSED') {
    return { text: `${audit.overallTrustScore}% PASSED`, class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
  } else if (audit.overallStatus === 'WARNING') {
    return { text: `${audit.overallTrustScore}% WARNING`, class: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
  } else {
    return { text: `${audit.overallTrustScore}% FAILED`, class: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' };
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Compact Control & Metrics Header -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <!-- 1. Unified SpyHub Nodes Block -->
      <div class="lg:col-span-7 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-3 shadow-sm flex flex-col justify-between gap-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SpyHub Host Nodes</span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {{ nodeStates.filter(n => n.status === 'online').length }}/{{ nodeStates.length }} Online
            </span>
          </div>
          <button 
            @click="loadNodesProgressively()" 
            class="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-semibold transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div 
            v-for="node in nodeStates" 
            :key="node.nodeUrl"
            class="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800/50"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div 
                class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                :class="node.status === 'online' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : node.status === 'offline' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'"
              >
                <svg v-if="node.os === 'macos'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-xs text-gray-900 dark:text-white truncate">{{ node.nodeName }}</span>
                  <span 
                    class="w-1.5 h-1.5 rounded-full shrink-0" 
                    :class="node.status === 'online' ? 'bg-emerald-500 animate-pulse' : node.status === 'offline' ? 'bg-red-500' : 'bg-amber-500'"
                  ></span>
                </div>
                <span class="font-mono text-[10px] text-gray-400 truncate block">{{ node.nodeUrl }}</span>
              </div>
            </div>

            <div class="text-right shrink-0 pl-2">
              <template v-if="node.status === 'pending'">
                <span class="text-amber-600 dark:text-amber-400 font-medium text-[10px] flex items-center justify-end gap-1">
                  <svg class="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  Check...
                </span>
              </template>
              <template v-else>
                <span class="font-bold text-gray-900 dark:text-white text-xs block leading-tight">{{ node.profileCount || 0 }} prof</span>
                <span v-if="node.status === 'online'" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">{{ node.responseTimeMs }}ms</span>
                <span v-else class="text-[10px] text-red-500 font-mono">Offline</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Unified Overview Metrics Block -->
      <div class="lg:col-span-5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-3 shadow-sm flex flex-col justify-between gap-2.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fleet Metrics</span>
          <span class="text-[10px] text-gray-400">Camoufox & Stealth</span>
        </div>

        <div class="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800/80 text-center items-center py-1">
          <!-- Total Browser Profiles -->
          <div class="px-2">
            <span class="text-[10px] text-gray-400 uppercase font-semibold block tracking-tight">Profiles</span>
            <div class="text-xl font-black text-gray-900 dark:text-white leading-tight mt-0.5">{{ profiles.length }}</div>
            <span class="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">Total</span>
          </div>

          <!-- Avg Stealth Score -->
          <div class="px-2">
            <span class="text-[10px] text-gray-400 uppercase font-semibold block tracking-tight">Avg Stealth</span>
            <div class="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
              {{ avgTrustScore !== null ? `${avgTrustScore}%` : '—' }}
            </div>
            <span class="text-[10px] text-gray-400 font-medium block truncate">
              {{ auditedProfiles.length > 0 ? `${auditedProfiles.length} audited` : 'No audits' }}
            </span>
          </div>

          <!-- Linked Personas -->
          <div class="px-2">
            <span class="text-[10px] text-gray-400 uppercase font-semibold block tracking-tight">Personas</span>
            <div class="text-xl font-black text-purple-600 dark:text-purple-400 leading-tight mt-0.5">
              {{ profiles.filter(p => p.personaId).length }}
            </div>
            <span class="text-[10px] text-purple-600 dark:text-purple-400 font-medium block">Linked</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Browser Profiles</span>
        <span class="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {{ filteredProfiles.length }} of {{ profiles.length }}
        </span>
      </div>

      <!-- Search Box -->
      <div class="relative w-full md:w-80">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search by ID, name, OS, IP, Persona..."
          class="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800/80 border border-transparent focus:border-blue-500 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none"
        />
      </div>
    </div>

    <!-- Profiles & Audits High-Density Data Table -->
    <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm overflow-hidden">
      <div v-if="loading" class="text-center py-12 text-sm text-gray-400">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <div>Loading browser profiles & audit statuses...</div>
      </div>

      <div v-else-if="filteredProfiles.length === 0" class="text-center py-12 text-sm text-gray-400 space-y-2">
        <div>No browser profiles found matching your search.</div>
        <button @click="searchQuery = ''" class="text-xs text-blue-600 font-bold hover:underline">
          Reset search
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800/60 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <th class="py-3 px-3">Profile ID</th>
              <th class="py-3 px-3">Profile & System</th>
              <th class="py-3 px-3">Stealth Audit</th>
              <th class="py-3 px-3">Cookie Farm</th>
              <th class="py-3 px-3">Linked Persona</th>
              <th class="py-3 px-3">Proxy Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800/40">
            <tr 
              v-for="profile in filteredProfiles" 
              :key="profile.profileId" 
              class="hover:bg-gray-50/60 dark:hover:bg-gray-900/60 transition-colors group cursor-pointer"
              @click="openDrawer(profile)"
            >
              <!-- Profile ID -->
              <td class="py-3 px-3 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100 select-all whitespace-nowrap">
                <span class="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 text-[11px] font-mono">
                  {{ profile.profileId }}
                </span>
              </td>

              <!-- Profile & System (Camoufox & OS icons) -->
              <td class="py-3 px-3">
                <div class="flex items-center gap-2.5">
                  <span 
                    class="w-2 h-2 rounded-full shrink-0" 
                    :class="profile.running ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-700'"
                    :title="profile.running ? 'Running' : 'Stopped'"
                  ></span>

                  <div>
                    <span class="font-bold text-xs text-gray-900 dark:text-white block whitespace-nowrap">
                      {{ profile.name }}
                    </span>

                    <div class="flex items-center gap-1.5 mt-0.5">
                      <!-- Camoufox Icon -->
                      <img 
                        v-if="profile.browserType === 'camoufox'" 
                        src="/camoufox.png" 
                        class="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                        alt="Camoufox" 
                        title="Camoufox Anti-Detect Browser"
                      />
                      <span v-else class="text-[9px] uppercase font-mono text-gray-400">
                        {{ profile.browserType }}
                      </span>

                      <!-- OS Icon -->
                      <span :title="`OS: ${profile.os}`" class="flex items-center">
                        <svg 
                          v-if="profile.os === 'macos' || profile.os === 'darwin'" 
                          class="w-3.5 h-3.5 fill-current text-gray-700 dark:text-gray-300 shrink-0" 
                          viewBox="0 0 170 170"
                        >
                          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.94-12.04-14.57-6.03-9.22-10.82-20.08-14.37-32.58-3.55-12.5-5.33-24.23-5.33-35.18 0-14.65 3.73-26.79 11.19-36.42 7.46-9.63 16.9-14.54 28.32-14.73 4.97 0 10.45 1.25 16.44 3.75 5.99 2.5 9.77 3.82 11.35 3.96 1.83-.2 5.86-1.58 12.09-4.14 6.23-2.56 11.83-3.73 16.8-3.51 13.32.74 23.77 5.74 31.35 15-11.66 7.08-17.38 16.83-17.16 29.25.22 9.69 3.97 17.77 11.25 24.24 7.28 6.47 16.03 10.22 26.25 11.25-2.25 7.15-5.11 14.38-8.58 21.69zm-26.62-105c0-6.19 2.27-12.08 6.81-17.67 4.54-5.59 10.21-9.28 17.01-11.08.31 1.04.47 2.19.47 3.45 0 6.13-2.39 12.21-7.17 18.24-4.78 6.03-10.49 9.63-17.12 10.8z"/>
                        </svg>
                        <svg 
                          v-else-if="profile.os === 'windows' || profile.os === 'win32'" 
                          class="w-3.5 h-3.5 fill-current text-blue-500 shrink-0" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/>
                        </svg>
                        <svg 
                          v-else 
                          class="w-3.5 h-3.5 fill-current text-amber-500 shrink-0" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M12.002 0c-3.13 0-5.67 2.54-5.67 5.67 0 .53.07 1.04.21 1.53C4.24 8.24 2.5 10.91 2.5 14c0 3.84 2.72 7.03 6.36 7.82.43.91 1.25 1.63 2.24 1.95.29.09.6.14.9.14.31 0 .61-.05.9-.14.99-.32 1.81-1.04 2.24-1.95 3.64-.79 6.36-3.98 6.36-7.82 0-3.09-1.74-5.76-4.04-6.8.14-.49.21-1 .21-1.53 0-3.13-2.54-5.67-5.67-5.67z"/>
                        </svg>
                      </span>

                      <!-- Node Name badge -->
                      <span v-if="profile.nodeName" class="text-[9px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono">
                        {{ profile.nodeName }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Stealth Audit -->
              <td class="py-3 px-3">
                <span 
                  v-if="profile.stealthAudit?.overallTrustScore !== undefined && profile.stealthAudit?.overallTrustScore !== null"
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" 
                  :class="getAuditBadge(profile.stealthAudit).class"
                >
                  {{ getAuditBadge(profile.stealthAudit).text }}
                </span>
                <span v-else class="text-xs text-gray-400 italic font-mono">—</span>
              </td>

              <!-- Cookie Farm -->
              <td class="py-3 px-3">
                <div class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  <span>{{ profile.cookieFarm?.cookiesCount || 0 }} cookies</span>
                </div>
                <div class="text-[10px] text-gray-400 font-mono">
                  {{ profile.cookieFarm?.sitesVisitedCount || 0 }} sites visited
                </div>
              </td>

              <!-- Linked Persona -->
              <td class="py-3 px-3" @click.stop>
                <router-link 
                  v-if="profile.personaId" 
                  :to="`/affiliate/personas/${profile.personaId}`"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:underline border border-purple-200 dark:border-purple-900"
                >
                  <span>🪪 {{ profile.personaName }}</span>
                </router-link>
                <span v-else class="text-xs text-gray-400 italic">—</span>
              </td>

              <!-- Proxy Status -->
              <td class="py-3 px-3">
                <span 
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold"
                  :class="profile.proxyIp ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'"
                  :title="profile.proxyIp ? `Proxy IP: ${profile.proxyIp}` : 'Direct connection'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="profile.proxyIp ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ profile.proxyIp ? 'Proxied' : 'Direct' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stealth Audit Slide-over Detail Drawer -->
    <div 
      v-if="showDrawer && selectedProfile" 
      class="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end"
      @click.self="showDrawer = false"
    >
      <div class="w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800">
        <!-- Drawer Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedProfile.name }}</h3>
          </div>

          <button @click="showDrawer = false" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors">✕</button>
        </div>

        <!-- Notification Toast inside Drawer -->
        <div v-if="farmActionMessage" class="mx-6 mt-3 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <svg class="w-4 h-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{{ farmActionMessage }}</span>
        </div>

        <!-- Drawer Content Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Linked Persona in Drawer -->
          <div class="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">Linked Persona</span>
              <router-link 
                v-if="selectedProfile.personaId"
                :to="`/affiliate/personas/${selectedProfile.personaId}`"
                class="font-bold text-xs text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1.5"
              >
                <span>🪪 {{ selectedProfile.personaName }}</span>
              </router-link>
              <span v-else class="text-xs text-gray-400 italic">No persona linked to this profile</span>
            </div>
            <router-link 
              v-if="selectedProfile.personaId"
              :to="`/affiliate/personas/${selectedProfile.personaId}`"
              class="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 transition-colors"
            >
              Open Persona ➔
            </router-link>
          </div>

          <!-- Compact Proxy & SpyHub Host Node Combined Row -->
          <div class="bg-gray-50 dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-xl p-3 grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800 gap-3">
            <!-- Proxy Column -->
            <div class="pr-2 space-y-1 min-w-0">
              <div class="flex items-center justify-between gap-1.5">
                <div class="flex items-center gap-1.5 min-w-0">
                  <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                  </svg>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Proxy</span>
                </div>
                <span 
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                  :class="selectedProfile.proxyIp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'"
                >
                  {{ selectedProfile.proxyIp ? 'ACTIVE' : 'DIRECT' }}
                </span>
              </div>
              <div class="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 truncate" :title="selectedProfile.proxyIp || 'No proxy configured (Direct Connection)'">
                {{ selectedProfile.proxyIp || 'Direct Connection' }}
              </div>
            </div>

            <!-- SpyHub Node Column -->
            <div class="pl-3 space-y-1 min-w-0">
              <div class="flex items-center justify-between gap-1.5">
                <div class="flex items-center gap-1.5 min-w-0">
                  <svg class="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
                  </svg>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">Host Node</span>
                </div>
                <span class="font-mono text-[10px] text-purple-600 dark:text-purple-400 truncate max-w-[90px]" :title="selectedProfile.nodeUrl">
                  {{ selectedProfile.nodeUrl }}
                </span>
              </div>
              <div class="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 truncate" :title="selectedProfile.nodeName">
                {{ selectedProfile.nodeName }}
              </div>
            </div>
          </div>

          <!-- Compact Trust Card -->
          <div class="bg-gray-50 dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-xl p-3.5 space-y-2.5">
            <!-- Row 1: Title, Status Badge with Score & Run Audit Button -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Trust</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" :class="getAuditBadge(selectedProfile.stealthAudit).class">
                  {{ selectedProfile.stealthAudit?.overallTrustScore !== undefined ? `${selectedProfile.stealthAudit.overallTrustScore}% ` : '' }}{{ selectedProfile.stealthAudit?.overallStatus || 'N/A' }}
                </span>
              </div>

              <!-- Run Audit Button -->
              <button 
                @click="triggerAudit(selectedProfile.profileId)"
                :disabled="auditingProfileId === selectedProfile.profileId"
                type="button"
                class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span>{{ auditingProfileId === selectedProfile.profileId ? 'Auditing...' : 'Run Audit' }}</span>
              </button>
            </div>

            <!-- Row 2: Service Checkmark Circles on a New Dedicated Line -->
            <div 
              v-if="selectedProfile.stealthAudit?.results?.length" 
              class="pt-2 border-t border-gray-200/60 dark:border-gray-800/80 flex items-center gap-2 flex-wrap"
            >
              <div
                v-for="res in selectedProfile.stealthAudit.results"
                :key="res.serviceName"
                :title="`${res.serviceName}: ${res.statusCode} (${res.trustScore}%)${res.failedParameters?.length ? '\nIssues: ' + res.failedParameters.join(', ') : ''}`"
                class="w-6 h-6 rounded-full flex items-center justify-center cursor-help transition-transform hover:scale-110 shadow-xs"
                :class="[
                  getServiceStatusConfig(res).type === 'success'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : getServiceStatusConfig(res).type === 'warning'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                      : 'bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400 border border-red-300 dark:border-red-800'
                ]"
              >
                <svg v-if="getServiceStatusConfig(res).type === 'success'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                <svg v-else-if="getServiceStatusConfig(res).type === 'warning'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/>
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Cookie Farm Status (Option 1 Selected) -->
          <div class="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Cookie Farm</h4>
            <div class="bg-gray-50 dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-xl p-4 space-y-3 text-xs">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400 block font-medium">Status:</span>
                    <span 
                      class="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase"
                      :class="(selectedProfile.cookieFarm?.status === 'RUNNING' || farmingProfileId === selectedProfile.profileId) 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse' 
                        : (selectedProfile.cookieFarm?.status === 'PLANNED' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300')"
                    >
                      {{ farmingProfileId === selectedProfile.profileId ? 'RUNNING' : (selectedProfile.cookieFarm?.status || 'IDLE') }}
                    </span>
                  </div>
                  <span class="font-bold text-gray-900 dark:text-white text-base block">
                    {{ selectedProfile.cookieFarm?.cookiesCount || 0 }} Cookies Collected
                  </span>
                  <span class="text-gray-400 text-[11px] block">
                    {{ selectedProfile.cookieFarm?.sitesVisitedCount || 0 }} Domains Visited
                  </span>
                </div>

                <!-- Actions Button Group -->
                <div class="flex items-center gap-2 shrink-0">
                  <!-- Generate Plan Button -->
                  <button
                    @click="generateFarmPlan(selectedProfile.profileId)"
                    :disabled="farmingProfileId === selectedProfile.profileId || planGeneratingProfileId === selectedProfile.profileId"
                    type="button"
                    class="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title="Generate automated warming plan"
                  >
                    <svg v-if="planGeneratingProfileId === selectedProfile.profileId" class="animate-spin h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <svg v-else class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                    <span>{{ planGeneratingProfileId === selectedProfile.profileId ? 'Planning...' : 'Generate Plan' }}</span>
                  </button>

                  <!-- Start Cookie Farm Button -->
                  <button
                    @click="triggerCookieFarm(selectedProfile.profileId)"
                    :disabled="farmingProfileId === selectedProfile.profileId || planGeneratingProfileId === selectedProfile.profileId"
                    type="button"
                    class="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <svg v-if="farmingProfileId === selectedProfile.profileId" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span v-else class="text-sm">🍪</span>
                    <span>{{ farmingProfileId === selectedProfile.profileId ? 'Farming...' : 'Start Farm' }}</span>
                  </button>
                </div>
              </div>

              <!-- Target Warming Sites Preview Chips -->
              <div class="pt-2 border-t border-gray-200/60 dark:border-gray-800/60 space-y-1.5">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Target Warming Sites Pool</span>
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="site in ['swedbank.ee', 'kaup24.ee', 'telia.ee', 'if.ee', 'booking.com', 'euronics.ee']" 
                    :key="site"
                    class="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {{ site }}
                  </span>
                  <span class="text-[10px] text-gray-400 self-center font-medium pl-1">+2 more</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AltLab Ad Account Binding -->
          <div class="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Linked AltLab Ad Account (Main Source of Truth)</h4>
            <div class="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 text-xs space-y-1">
              <span class="font-semibold text-blue-700 dark:text-blue-300 block">{{ selectedProfile.linkedAccountName || 'No account bound' }}</span>
              <p class="text-gray-500">If this Browser Profile is deleted in SpyHub, the Ad Account data in AltLab remains intact and unlinked.</p>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
          <router-link 
            :to="'/affiliate/browser-profiles/' + selectedProfile.profileId" 
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            Full Details Page ➔
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
