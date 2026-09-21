<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

onMounted(() => {
  loadNodesProgressively();
});

const openDrawer = (profile: BrowserProfileDto) => {
  selectedProfile.value = profile;
  showDrawer.value = true;
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

const avgTrustScore = computed(() => {
  if (profiles.value.length === 0) return 0;
  const sum = profiles.value.reduce((acc, p) => acc + (p.stealthAudit?.overallTrustScore || 0), 0);
  return Math.round(sum / profiles.value.length);
});

const totalCookies = computed(() => {
  return profiles.value.reduce((acc, p) => acc + (p.cookieFarm?.cookiesCount || 0), 0);
});

const getAuditBadge = (audit?: BrowserProfileDto['stealthAudit']) => {
  if (!audit) return { text: 'Not Audited', class: 'bg-gray-100 text-gray-600' };
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
    <!-- Header Title -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">SpyHub Browser Profiles & Stealth Audits</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Aggregated anti-detect browser profiles across host nodes (macOS & Windows)</p>
      </div>
    </div>

    <!-- SpyHub Multi-Node Status Cards (Streamed & Reactive) -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SpyHub Host Nodes Status</span>
        <button @click="loadNodesProgressively()" class="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh Nodes
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Render node cards immediately in Pending state -->
        <div 
          v-for="node in nodeStates" 
          :key="node.nodeUrl"
          class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all"
        >
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors"
              :class="node.status === 'online' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : node.status === 'offline' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'"
            >
              <svg v-if="node.os === 'macos'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-sm text-gray-900 dark:text-white">{{ node.nodeName }}</h4>
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors"
                  :class="node.status === 'online' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : node.status === 'offline' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'"
                >
                  <span v-if="node.status === 'pending'" class="w-2 h-2 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                  <span v-else class="w-1.5 h-1.5 rounded-full" :class="node.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"></span>
                  {{ node.status === 'online' ? 'Online' : node.status === 'offline' ? 'Offline' : 'Checking...' }}
                </span>
              </div>
              <span class="font-mono text-xs text-gray-400 block">{{ node.nodeUrl }}</span>
            </div>
          </div>

          <div class="text-right text-xs">
            <template v-if="node.status === 'pending'">
              <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center justify-end gap-1 text-[11px]">
                <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                Pending...
              </span>
            </template>
            <template v-else>
              <span class="font-bold text-gray-900 dark:text-white block">{{ node.profileCount || 0 }} Profiles</span>
              <span v-if="node.status === 'online'" class="text-[11px] text-emerald-600 font-mono">{{ node.responseTimeMs }}ms</span>
              <span v-else class="text-[11px] text-red-500 font-mono">Fast-Fail</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Summary Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Browser Profiles</span>
        <div class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ profiles.length }}</div>
        <p class="text-[11px] text-blue-600 font-medium">Camoufox & Cloak instances</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Stealth Score (BotForge)</span>
        <div class="text-2xl font-extrabold text-emerald-600">{{ avgTrustScore }}%</div>
        <p class="text-[11px] text-emerald-600 font-medium">High anti-detect trust rating</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cookies Gathered</span>
        <div class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ totalCookies }}</div>
        <p class="text-[11px] text-indigo-600 font-medium">Farmed via BotForge tasks</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Linked Ad Accounts</span>
        <div class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ profiles.filter(p => p.linkedAccountId).length }}</div>
        <p class="text-[11px] text-gray-400 font-medium">Main source of truth binding</p>
      </div>
    </div>

    <!-- Profiles & Audits Data Table -->
    <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm">
      <div v-if="loading" class="text-center py-12 text-sm text-gray-400">
        Loading SpyHub browser profiles & BotForge audit statuses...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800/60 text-xs text-gray-400 font-semibold uppercase tracking-wider">
              <th class="py-3 px-4">Profile ID</th>
              <th class="py-3 px-4">Profile Name & OS</th>
              <th class="py-3 px-4">Stealth Audit (BotForge)</th>
              <th class="py-3 px-4">Cookie Farm</th>
              <th class="py-3 px-4">Linked Ad Account (AltLab)</th>
              <th class="py-3 px-4">Proxy Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800/40">
            <tr v-for="profile in profiles" :key="profile.profileId" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
              <td class="py-3.5 px-4 font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                <button @click="openDrawer(profile)" class="hover:underline flex items-center gap-1">
                  {{ profile.profileId.substring(0, 13) }}...
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </button>
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :class="profile.running ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'"></span>
                  <div>
                    <span class="font-semibold text-gray-900 dark:text-white block">{{ profile.name }}</span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-[11px] text-gray-400 uppercase font-mono">{{ profile.browserType }} • {{ profile.os }}</span>
                      <span v-if="profile.nodeName" class="text-[10px] font-medium text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded">
                        {{ profile.nodeName }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <button @click="openDrawer(profile)" class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="getAuditBadge(profile.stealthAudit).class">
                  {{ getAuditBadge(profile.stealthAudit).text }}
                </button>
              </td>
              <td class="py-3.5 px-4">
                <div class="text-xs">
                  <span class="font-semibold text-gray-900 dark:text-gray-100 block">{{ profile.cookieFarm?.cookiesCount || 0 }} Cookies</span>
                  <span class="text-[11px] text-gray-400">{{ profile.cookieFarm?.sitesVisitedCount || 0 }} sites visited</span>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <span v-if="profile.linkedAccountId" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {{ profile.linkedAccountName }}
                </span>
                <span v-else class="text-xs text-gray-400 italic">Unlinked</span>
              </td>
              <td class="py-3.5 px-4">
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="profile.proxyIp ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="profile.proxyIp ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ profile.proxyIp ? 'Proxied' : 'Direct' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="triggerAudit(profile.profileId)"
                    :disabled="auditingProfileId === profile.profileId"
                    class="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {{ auditingProfileId === profile.profileId ? 'Auditing...' : 'Run Audit' }}
                  </button>
                  <button @click="openDrawer(profile)" class="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors">
                    Details
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stealth Audit Slide-over Detail Drawer -->
    <div v-if="showDrawer && selectedProfile" class="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div class="w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800">
        <!-- Drawer Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <span class="text-xs font-mono text-blue-600 uppercase font-semibold">Browser Profile Details & Audit</span>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedProfile.name }}</h3>
          </div>
          <button @click="showDrawer = false" class="p-2 text-gray-400 hover:text-gray-600 rounded-xl">✕</button>
        </div>

        <!-- Drawer Content Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Proxy Details Box in Drawer -->
          <div class="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">Proxy Configuration</span>
              <span class="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">{{ selectedProfile.proxyIp || 'No proxy configured (Direct Connection)' }}</span>
            </div>
            <span 
              class="px-2.5 py-1 rounded-full text-xs font-bold"
              :class="selectedProfile.proxyIp ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'"
            >
              {{ selectedProfile.proxyIp ? 'ACTIVE PROXY' : 'DIRECT' }}
            </span>
          </div>

          <!-- Node Host Info in Drawer -->
          <div class="bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-4 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider block">SpyHub Host Node</span>
              <span class="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">{{ selectedProfile.nodeName }}</span>
            </div>
            <span class="font-mono text-xs text-purple-700 dark:text-purple-300 font-medium">
              {{ selectedProfile.nodeUrl }}
            </span>
          </div>

          <!-- Overall Trust Score Banner -->
          <div class="bg-gray-50 dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">BotForge Overall Trust Score</span>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold" :class="getAuditBadge(selectedProfile.stealthAudit).class">
                {{ selectedProfile.stealthAudit?.overallStatus || 'N/A' }}
              </span>
            </div>
            
            <div class="flex items-baseline gap-3">
              <span class="text-4xl font-extrabold text-gray-900 dark:text-white">{{ selectedProfile.stealthAudit?.overallTrustScore || 0 }}<span class="text-lg text-gray-400">/100</span></span>
              <div class="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :class="selectedProfile.stealthAudit?.overallTrustScore! >= 90 ? 'bg-emerald-500' : selectedProfile.stealthAudit?.overallTrustScore! >= 70 ? 'bg-amber-500' : 'bg-red-500'"
                  :style="{ width: (selectedProfile.stealthAudit?.overallTrustScore || 0) + '%' }"
                ></div>
              </div>
            </div>

            <p class="text-xs text-gray-400">
              Process Instance: <code class="font-mono">{{ selectedProfile.stealthAudit?.processInstanceId }}</code>
            </p>
          </div>

          <!-- Per-Service Stealth Audit Breakdown -->
          <div class="space-y-3">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Stealth Check Verdicts (BotForge)</h4>
            
            <div class="space-y-2">
              <div 
                v-for="res in selectedProfile.stealthAudit?.results || []" 
                :key="res.serviceName"
                class="border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950 rounded-xl p-3.5 space-y-2"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-gray-900 dark:text-gray-100">{{ res.serviceName }}</span>
                  <span 
                    class="px-2 py-0.5 rounded-full font-bold text-[10px]"
                    :class="res.statusCode === 'PASSED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'"
                  >
                    {{ res.statusCode }} ({{ res.trustScore }}%)
                  </span>
                </div>

                <div v-if="res.failedParameters && res.failedParameters.length > 0" class="text-xs text-red-600 bg-red-50 dark:bg-red-950/50 p-2 rounded-lg space-y-1">
                  <span class="font-semibold block">Failed / Flagged Parameters:</span>
                  <ul class="list-disc list-inside text-[11px]">
                    <li v-for="param in res.failedParameters" :key="param">{{ param }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Cookie Farm Status -->
          <div class="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">BotForge Cookie Farm Status</h4>
            <div class="bg-gray-50 dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between text-xs">
              <div>
                <span class="text-gray-400 block">Status: {{ selectedProfile.cookieFarm?.status }}</span>
                <span class="font-bold text-gray-900 dark:text-white text-base">{{ selectedProfile.cookieFarm?.cookiesCount }} Cookies Collected</span>
              </div>
              <span class="text-gray-400">{{ selectedProfile.cookieFarm?.sitesVisitedCount }} Sites Visited</span>
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
        <div class="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button @click="showDrawer = false" class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
