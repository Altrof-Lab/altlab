<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BrowserProfileDto } from '@altlab/shared';

const route = useRoute();
const router = useRouter();
const profileId = computed(() => route.params.id as string);

const profile = ref<BrowserProfileDto | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const actionMessage = ref<string | null>(null);

const loadProfile = async () => {
  loading.value = true;
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profileId.value}`);
    if (res.ok) {
      profile.value = await res.json();
    } else {
      console.error('Profile not found');
    }
  } catch (err) {
    console.error('Failed to load profile details:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProfile();
});

const triggerStart = async () => {
  actionLoading.value = true;
  actionMessage.value = 'Starting browser session...';
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profileId.value}/start`, { method: 'POST' });
    if (res.ok) {
      await loadProfile();
      actionMessage.value = 'Browser session started successfully!';
      setTimeout(() => actionMessage.value = null, 3000);
    }
  } catch (err) {
    console.error('Failed to start profile:', err);
  } finally {
    actionLoading.value = false;
  }
};

const triggerStop = async () => {
  actionLoading.value = true;
  actionMessage.value = 'Stopping browser session...';
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profileId.value}/stop`, { method: 'POST' });
    if (res.ok) {
      await loadProfile();
      actionMessage.value = 'Browser session stopped.';
      setTimeout(() => actionMessage.value = null, 3000);
    }
  } catch (err) {
    console.error('Failed to stop profile:', err);
  } finally {
    actionLoading.value = false;
  }
};

const triggerAudit = async () => {
  actionLoading.value = true;
  actionMessage.value = 'Running BPMN Stealth Audit (BotForge)...';
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profileId.value}/audit`, { method: 'POST' });
    if (res.ok) {
      await loadProfile();
      actionMessage.value = 'Stealth audit completed successfully!';
      setTimeout(() => actionMessage.value = null, 3000);
    }
  } catch (err) {
    console.error('Failed to run audit:', err);
  } finally {
    actionLoading.value = false;
  }
};

const getAuditBadge = (audit?: BrowserProfileDto['stealthAudit']) => {
  if (!audit) return { text: 'Not Audited', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  if (audit.overallStatus === 'PASSED') {
    return { text: `${audit.overallTrustScore}% PASSED`, class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' };
  } else if (audit.overallStatus === 'WARNING') {
    return { text: `${audit.overallTrustScore}% WARNING`, class: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900' };
  } else {
    return { text: `${audit.overallTrustScore}% FAILED`, class: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900' };
  }
};
const expandedServices = ref<Record<string, boolean>>({});
const toggleServiceExpand = (serviceName: string) => {
  expandedServices.value[serviceName] = !expandedServices.value[serviceName];
};
</script>

<template>
  <div class="space-y-6">
    <!-- Back Button & Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <router-link 
          to="/affiliate/browser-profiles" 
          class="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 font-semibold mb-2 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back to Browser Profiles
        </router-link>

        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ profile ? profile.name : 'Loading Profile...' }}
          </h2>

          <span 
            v-if="profile"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            :class="profile.running ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
          >
            <span class="w-2 h-2 rounded-full" :class="profile.running ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'"></span>
            {{ profile.running ? 'Session Active' : 'Stopped' }}
          </span>
        </div>

        <p class="text-xs font-mono text-gray-400 mt-1">UUID: {{ profileId }}</p>
      </div>

      <!-- Action Buttons -->
      <div v-if="profile" class="flex flex-wrap items-center gap-2">
        <button 
          v-if="!profile.running"
          @click="triggerStart()"
          :disabled="actionLoading"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Start Browser
        </button>

        <button 
          v-else
          @click="triggerStop()"
          :disabled="actionLoading"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
          Stop Browser
        </button>

        <button 
          @click="triggerAudit()"
          :disabled="actionLoading"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Run Stealth Audit
        </button>

        <button 
          @click="loadProfile()"
          class="p-2 text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          title="Refresh Data"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>
    </div>

    <!-- Notification Toast -->
    <div v-if="actionMessage" class="p-3 bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2">
      <svg class="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
      {{ actionMessage }}
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="text-center py-24 text-sm text-gray-400">
      Loading browser profile specifications...
    </div>

    <template v-else-if="profile">
      <!-- 4 Core Summary Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Stealth Score Card -->
        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">BotForge Stealth Rating</span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold" :class="getAuditBadge(profile.stealthAudit).class">
              {{ profile.stealthAudit?.overallStatus || 'N/A' }}
            </span>
          </div>
          <div class="text-3xl font-extrabold text-emerald-600">
            {{ profile.stealthAudit?.overallTrustScore || 0 }}<span class="text-lg text-gray-400 font-normal">/100</span>
          </div>
          <p class="text-[11px] text-gray-400 font-mono">Process: {{ profile.stealthAudit?.processInstanceId || 'N/A' }}</p>
        </div>

        <!-- Cookie Farm Card -->
        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cookie Farm Status</span>
          <div class="text-3xl font-extrabold text-gray-900 dark:text-white">
            {{ profile.cookieFarm?.cookiesCount || 0 }} <span class="text-sm text-gray-400 font-normal">Cookies</span>
          </div>
          <p class="text-[11px] text-indigo-600 font-medium">{{ profile.cookieFarm?.sitesVisitedCount || 0 }} Sites Visited • {{ profile.cookieFarm?.status }}</p>
        </div>

        <!-- Proxy Configuration Card -->
        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Proxy Status</span>
            <span 
              class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="profile.proxyIp ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
            >
              {{ profile.proxyIp ? 'PROXIED' : 'DIRECT' }}
            </span>
          </div>
          <div class="text-lg font-bold font-mono text-gray-900 dark:text-white truncate">
            {{ profile.proxyIp || 'No Proxy (Direct IP)' }}
          </div>
          <p class="text-[11px] text-emerald-600 font-medium">Protected network origin</p>
        </div>

        <!-- Linked Ad Account Card -->
        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">AltLab Ad Account</span>
          <div class="text-sm font-bold text-gray-900 dark:text-white truncate">
            {{ profile.linkedAccountName || 'Unlinked Profile' }}
          </div>
          <p class="text-[11px] text-blue-600 font-medium">Main source of truth binding</p>
        </div>
      </div>

      <!-- Main Detailed Breakdown Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 2 Columns: Stealth Verdicts & Service Checks -->
        <div class="lg:col-span-2 space-y-6">
          <!-- BotForge Stealth Check Verdicts -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-4">
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">BotForge Stealth Check Verdicts</h3>
                <p class="text-xs text-gray-400">Individual Anti-Detect Diagnostics Breakdown</p>
              </div>

              <span class="px-3 py-1 rounded-full text-xs font-bold" :class="getAuditBadge(profile.stealthAudit).class">
                {{ profile.stealthAudit?.overallStatus || 'NOT AUDITED' }}
              </span>
            </div>

            <div v-if="profile.stealthAudit?.results && profile.stealthAudit.results.length > 0" class="space-y-2.5">
              <div 
                v-for="res in profile.stealthAudit.results" 
                :key="res.serviceName"
                class="border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl overflow-hidden transition-all duration-200"
              >
                <!-- Compact Header Row -->
                <div 
                  @click="toggleServiceExpand(res.serviceName)"
                  class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-colors select-none"
                >
                  <div class="flex items-center gap-3">
                    <span 
                      class="w-2.5 h-2.5 rounded-full shrink-0" 
                      :class="res.statusCode === 'PASSED' ? 'bg-emerald-500' : res.statusCode === 'FLAGGED' ? 'bg-amber-500' : 'bg-red-500'"
                    ></span>
                    
                    <span class="font-bold text-sm text-gray-900 dark:text-gray-100">{{ res.serviceName }}</span>

                    <span 
                      class="px-2.5 py-0.5 rounded-full font-bold text-xs"
                      :class="res.statusCode === 'PASSED' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : res.statusCode === 'FLAGGED'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'"
                    >
                      {{ res.statusCode === 'PASSED' ? 'OK' : res.statusCode }} ({{ res.trustScore }}%)
                    </span>
                  </div>

                  <button 
                    type="button"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>{{ expandedServices[res.serviceName] ? 'Collapse' : 'Expand' }}</span>
                    <svg 
                      class="w-4 h-4 transition-transform duration-200" 
                      :class="{ 'rotate-180': expandedServices[res.serviceName] }"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>

                <!-- Collapsible Details -->
                <div 
                  v-if="expandedServices[res.serviceName]"
                  class="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950"
                >
                  <div v-if="res.failedParameters && res.failedParameters.length > 0" class="mt-2 space-y-2">
                    <span class="text-xs font-bold text-red-600 dark:text-red-400 block uppercase tracking-wider">
                      Flagged Parameters ({{ res.failedParameters.length }})
                    </span>
                    <div class="bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl p-3">
                      <ul class="space-y-1.5">
                        <li 
                          v-for="param in res.failedParameters" 
                          :key="param"
                          class="text-xs font-mono text-red-700 dark:text-red-300 flex items-start gap-2 break-all"
                        >
                          <span class="text-red-400 shrink-0">•</span>
                          <span>{{ param }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div v-else class="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    <span>Clean fingerprint validation - all check parameters passed successfully.</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
              No stealth audit reports run yet for this profile. Click "Run Stealth Audit" above to launch a BotForge BPMN scan.
            </div>
          </div>

          <!-- Cookie Farm Details Card -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800/80 pb-4">
              BotForge Cookie Farm Status & Execution History
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-1">
                <span class="text-gray-400 block font-medium">Status</span>
                <span class="text-sm font-bold text-gray-900 dark:text-white uppercase">{{ profile.cookieFarm?.status || 'IDLE' }}</span>
              </div>

              <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-1">
                <span class="text-gray-400 block font-medium">Cookies Collected</span>
                <span class="text-sm font-bold text-emerald-600">{{ profile.cookieFarm?.cookiesCount || 0 }} Entries</span>
              </div>

              <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-1">
                <span class="text-gray-400 block font-medium">Sites Visited</span>
                <span class="text-sm font-bold text-gray-900 dark:text-white">{{ profile.cookieFarm?.sitesVisitedCount || 0 }} Domains</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right 1 Column: Node Host Info & Ad Account Binding -->
        <div class="space-y-6">
          <!-- SpyHub Host Node Technical Details -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800/80 pb-4">
              SpyHub Host Node Details
            </h3>

            <div class="space-y-3 text-xs">
              <div>
                <span class="text-gray-400 block font-semibold uppercase text-[10px]">Host Node Name</span>
                <span class="font-bold text-gray-900 dark:text-white text-sm">{{ profile.nodeName || 'SpyHub Node' }}</span>
              </div>

              <div>
                <span class="text-gray-400 block font-semibold uppercase text-[10px]">Node Endpoint URL</span>
                <code class="font-mono text-purple-600 dark:text-purple-400 font-medium">{{ profile.nodeUrl || 'http://localhost:8000' }}</code>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <div>
                  <span class="text-gray-400 block font-semibold uppercase text-[10px]">Browser Engine</span>
                  <span class="font-semibold text-gray-900 dark:text-white uppercase">{{ profile.browserType }}</span>
                </div>

                <div>
                  <span class="text-gray-400 block font-semibold uppercase text-[10px]">Target OS</span>
                  <span class="font-semibold text-gray-900 dark:text-white uppercase">{{ profile.os }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AltLab Ad Account Source of Truth Binding -->
          <div class="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-6 shadow-sm space-y-3">
            <span class="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">AltLab Source of Truth</span>
            <h4 class="text-sm font-bold text-gray-900 dark:text-white">{{ profile.linkedAccountName || 'No account bound' }}</h4>
            <p class="text-xs text-gray-500 leading-relaxed">
              Ad Accounts are managed natively in AltLab. If this browser profile is deleted or re-created in SpyHub, the Ad Account data and metrics in AltLab remain 100% intact.
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
