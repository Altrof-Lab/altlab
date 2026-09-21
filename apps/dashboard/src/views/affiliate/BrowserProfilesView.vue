<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { BrowserProfileDto } from '@altlab/shared';

const profiles = ref<BrowserProfileDto[]>([]);
const loading = ref(true);
const selectedProfile = ref<BrowserProfileDto | null>(null);
const showDrawer = ref(false);
const auditingProfileId = ref<string | null>(null);

const loadProfiles = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/affiliate/browser-profiles');
    if (res.ok) {
      profiles.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to load browser profiles:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadProfiles);

const openDrawer = (profile: BrowserProfileDto) => {
  selectedProfile.value = profile;
  showDrawer.value = true;
};

const triggerAudit = async (profileId: string) => {
  auditingProfileId.value = profileId;
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profileId}/audit`, { method: 'POST' });
    if (res.ok) {
      await loadProfiles();
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
        <p class="text-sm text-gray-500 dark:text-gray-400">Aggregated anti-detect browser profiles, BotForge stealth verdicts, and ad account bindings</p>
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
                <!-- Green Proxied status badge in table -->
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
