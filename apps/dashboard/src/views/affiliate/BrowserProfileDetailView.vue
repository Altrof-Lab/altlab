<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BrowserProfileDto, CookieFarmSiteVisitDto } from '@altlab/shared';
import { STEALTH_DIAGNOSTIC_RULES } from '../../config/stealth-rules';
import { STEALTH_DIAGNOSTIC_RULES_RU } from '../../config/stealth-rules.ru';
import StealthTelemetryWidget from '../../components/stealth/StealthTelemetryWidget.vue';

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
  actionMessage.value = 'Running Stealth Audit...';
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

const defaultSiteVisits: CookieFarmSiteVisitDto[] = [
  {
    siteUrl: 'swedbank.ee',
    siteName: 'Swedbank Eesti',
    category: 'finance',
    cookieBannerText: 'Nõustun kõigi küpsistega',
    dismissalLevel: 'Level 1 (Text)',
    cookiesCaptured: 16,
    durationSeconds: 5.4,
    interactionSummary: 'Scroll (1200px) • 2 Pageviews',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:29:45Z',
  },
  {
    siteUrl: 'kaup24.ee',
    siteName: 'Kaup24 E-Kaubandus',
    category: 'ecommerce',
    cookieBannerText: 'Luba kõik',
    dismissalLevel: 'Level 1 (Text)',
    cookiesCaptured: 24,
    durationSeconds: 8.2,
    interactionSummary: 'Product Catalog Browsing • 3 Items',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:29:12Z',
  },
  {
    siteUrl: 'telia.ee',
    siteName: 'Telia Eesti',
    category: 'telecom',
    cookieBannerText: 'Nõustun kõigi küpsistega',
    dismissalLevel: 'Level 1 (Text)',
    cookiesCaptured: 18,
    durationSeconds: 6.1,
    interactionSummary: 'Homepage Viewport Warm • 4s dwell',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:28:40Z',
  },
  {
    siteUrl: 'if.ee',
    siteName: 'If Kindlustus',
    category: 'insurance',
    cookieBannerText: 'I accept all',
    dismissalLevel: 'Level 1 (Text)',
    cookiesCaptured: 11,
    durationSeconds: 4.8,
    interactionSummary: 'Policy Calculator Dwell • Scroll 600px',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:28:10Z',
  },
  {
    siteUrl: 'booking.com',
    siteName: 'Booking.com Travel',
    category: 'travel',
    cookieBannerText: 'Accept',
    dismissalLevel: 'Level 2 (Selector)',
    cookiesCaptured: 32,
    durationSeconds: 9.5,
    interactionSummary: 'Tallinn Hotel Search Warm • Scroll & Click',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:27:30Z',
  },
  {
    siteUrl: 'euronics.ee',
    siteName: 'Euronics Elektroonika',
    category: 'ecommerce',
    cookieBannerText: 'Nõustun',
    dismissalLevel: 'Level 1 (Text)',
    cookiesCaptured: 19,
    durationSeconds: 5.7,
    interactionSummary: 'Category Filter Warm • 2 Clicks',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:26:50Z',
  },
  {
    siteUrl: 'lhv.ee',
    siteName: 'LHV Pank',
    category: 'finance',
    cookieBannerText: 'Luban kõik küpsised',
    dismissalLevel: 'Level 1 (Text)',
    cookiesCaptured: 14,
    durationSeconds: 4.2,
    interactionSummary: 'Banking Portal Warm • 1 Pageview',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:26:15Z',
  },
  {
    siteUrl: 'tripadvisor.com',
    siteName: 'Tripadvisor Reviews',
    category: 'travel',
    cookieBannerText: 'I Accept',
    dismissalLevel: 'Level 2 (Selector)',
    cookiesCaptured: 28,
    durationSeconds: 7.6,
    interactionSummary: 'Local Attractions View • Scroll 1800px',
    status: 'COMPLETED',
    visitedAt: '2026-09-18T18:25:35Z',
  },
];

const activeWarmingSite = ref<string | null>(null);
const farmCategoryFilter = ref<string>('all');

const siteVisits = computed<CookieFarmSiteVisitDto[]>(() => {
  return profile.value?.cookieFarm?.recentVisits?.length 
    ? profile.value.cookieFarm.recentVisits 
    : defaultSiteVisits;
});

const filteredSiteVisits = computed(() => {
  if (farmCategoryFilter.value === 'all') return siteVisits.value;
  return siteVisits.value.filter(s => s.category === farmCategoryFilter.value);
});

const farmCategoryTabs = computed(() => {
  const all = siteVisits.value;
  return [
    { key: 'all', label: 'All Sites', icon: '🌐', count: all.length },
    { key: 'finance', label: 'Finance', icon: '🏦', count: all.filter(s => s.category === 'finance').length },
    { key: 'ecommerce', label: 'E-Commerce', icon: '🛒', count: all.filter(s => s.category === 'ecommerce').length },
    { key: 'telecom', label: 'Telecom', icon: '📡', count: all.filter(s => s.category === 'telecom').length },
    { key: 'insurance', label: 'Insurance', icon: '🛡️', count: all.filter(s => s.category === 'insurance').length },
    { key: 'travel', label: 'Travel', icon: '✈️', count: all.filter(s => s.category === 'travel').length },
  ];
});

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'finance':
      return { label: 'Finance', icon: '🏦', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60' };
    case 'ecommerce':
      return { label: 'E-Commerce', icon: '🛒', class: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60' };
    case 'telecom':
      return { label: 'Telecom', icon: '📡', class: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900/60' };
    case 'insurance':
      return { label: 'Insurance', icon: '🛡️', class: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60' };
    case 'travel':
      return { label: 'Travel', icon: '✈️', class: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60' };
    default:
      return { label: category, icon: '🌐', class: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-800' };
  }
};

const planGenerating = ref(false);

const generateFarmPlan = async () => {
  planGenerating.value = true;
  actionMessage.value = 'Generating warming plan: sampling domains across Persona categories...';

  setTimeout(() => {
    const plannedSites: CookieFarmSiteVisitDto[] = defaultSiteVisits.map((site) => ({
      ...site,
      status: 'PENDING' as const,
      cookiesCaptured: 0,
      visitedAt: new Date().toISOString(),
    }));

    if (profile.value) {
      if (!profile.value.cookieFarm) {
        profile.value.cookieFarm = {
          status: 'PLANNED',
          cookiesCount: 0,
          sitesVisitedCount: plannedSites.length,
          lastFarmedAt: new Date().toISOString(),
          recentVisits: plannedSites,
          consentSuccessRate: 100,
          totalDurationSeconds: 84,
        };
      } else {
        profile.value.cookieFarm.status = 'PLANNED';
        profile.value.cookieFarm.recentVisits = plannedSites;
        profile.value.cookieFarm.sitesVisitedCount = plannedSites.length;
      }
    }

    planGenerating.value = false;
    actionMessage.value = `Warming plan generated: ${plannedSites.length} target sites scheduled (Status: PENDING). Click Start Cookie Farm to run.`;
    setTimeout(() => {
      actionMessage.value = null;
    }, 4000);
  }, 750);
};

const triggerCookieFarm = async () => {
  actionLoading.value = true;
  actionMessage.value = 'Running warming & cookie farm workflow...';
  if (profile.value) {
    if (!profile.value.cookieFarm) {
      profile.value.cookieFarm = {
        status: 'RUNNING',
        cookiesCount: 15,
        sitesVisitedCount: 5,
        lastFarmedAt: new Date().toISOString(),
        recentVisits: [...defaultSiteVisits],
      };
    } else {
      profile.value.cookieFarm.status = 'RUNNING';
      if (!profile.value.cookieFarm.recentVisits?.length) {
        profile.value.cookieFarm.recentVisits = [...defaultSiteVisits];
      }
    }
  }

  activeWarmingSite.value = 'kaup24.ee';
  actionMessage.value = 'Visiting kaup24.ee (Dismissing cookie banner)...';

  setTimeout(() => {
    activeWarmingSite.value = 'swedbank.ee';
    actionMessage.value = 'Visiting swedbank.ee (Injecting session cookies)...';
  }, 1000);

  setTimeout(() => {
    if (profile.value) {
      if (profile.value.cookieFarm) {
        profile.value.cookieFarm.status = 'COMPLETED';
        profile.value.cookieFarm.cookiesCount = (profile.value.cookieFarm.cookiesCount || 0) + 24;
        profile.value.cookieFarm.sitesVisitedCount = (profile.value.cookieFarm.sitesVisitedCount || 0) + 8;
        profile.value.cookieFarm.lastFarmedAt = new Date().toISOString();
        profile.value.cookieFarm.consentSuccessRate = 100;
        profile.value.cookieFarm.totalDurationSeconds = 84;
        if (profile.value.cookieFarm.recentVisits?.length) {
          profile.value.cookieFarm.recentVisits = profile.value.cookieFarm.recentVisits.map((v, idx) => ({
            ...v,
            status: 'COMPLETED' as const,
            cookiesCaptured: defaultSiteVisits[idx]?.cookiesCaptured || 16,
          }));
        }
      }
    }
    activeWarmingSite.value = null;
    actionLoading.value = false;
    actionMessage.value = 'Cookie farm completed! Collected new cookies across target warming domains.';
    setTimeout(() => {
      actionMessage.value = null;
    }, 3500);
  }, 2200);
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
type ServicesMap = Record<string, Record<string, boolean>>;

const expandedAudits = ref<Record<string, boolean>>({});
const expandedServicesMap = ref<ServicesMap>({});
const showPreviousAudits = ref(false);

const auditList = computed(() => {
  if (!profile.value) return [];
  if (profile.value.stealthAuditHistory && profile.value.stealthAuditHistory.length > 0) {
    return profile.value.stealthAuditHistory;
  }
  if (profile.value.stealthAudit && profile.value.stealthAudit.results && profile.value.stealthAudit.results.length > 0) {
    return [profile.value.stealthAudit];
  }
  return [];
});

const activeAudit = computed(() => {
  const list = auditList.value;
  if (list.length === 0) return profile.value?.stealthAudit || null;
  return list.find((h) => h.valid) || list[0];
});

const previousAudits = computed(() => {
  const list = auditList.value;
  const active = activeAudit.value;
  if (!active) return [];
  return list.filter((h) => (h.auditId ? h.auditId !== active.auditId : h !== active) && !h.valid);
});

const isAuditExpanded = (auditId: string, isValid: boolean) => {
  if (expandedAudits.value[auditId] !== undefined) {
    return expandedAudits.value[auditId];
  }
  return isValid && !showPreviousAudits.value;
};

const toggleAuditExpand = (auditId: string) => {
  const activeId = activeAudit.value?.auditId || 'active';
  const isValid = auditId === activeId;
  const currentExpanded = isAuditExpanded(auditId, isValid);
  expandedAudits.value[auditId] = !currentExpanded;
};

const isServiceExpanded = (auditId: string, serviceName: string) => {
  if (expandedServicesMap.value[auditId] && expandedServicesMap.value[auditId][serviceName] !== undefined) {
    return expandedServicesMap.value[auditId][serviceName];
  }
  return false;
};

const toggleServiceExpand = (auditId: string, serviceName: string) => {
  if (!expandedServicesMap.value[auditId]) {
    expandedServicesMap.value[auditId] = {};
  }
  const currentExpanded = isServiceExpanded(auditId, serviceName);
  expandedServicesMap.value[auditId][serviceName] = !currentExpanded;
};

const togglePreviousAudits = () => {
  showPreviousAudits.value = !showPreviousAudits.value;
  if (showPreviousAudits.value && activeAudit.value?.auditId) {
    expandedAudits.value[activeAudit.value.auditId] = false;
  }
};

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

// --- Single Service Rerun ---
const triggeringService = ref<string | null>(null);

const triggerSingleServiceRerun = async (serviceName: string) => {
  actionLoading.value = true;
  triggeringService.value = serviceName;
  actionMessage.value = `Rerunning ${serviceName} stealth check...`;
  try {
    const res = await fetch(`/api/affiliate/browser-profiles/${profileId.value}/audit/quick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: [serviceName] }),
    });
    if (res.ok) {
      await loadProfile();
      actionMessage.value = `${serviceName} audit updated successfully!`;
      setTimeout(() => (actionMessage.value = null), 3000);
    }
  } catch (err) {
    console.error(`Failed to rerun ${serviceName}:`, err);
  } finally {
    actionLoading.value = false;
    triggeringService.value = null;
  }
};

// --- Raw JSON Modal ---
const selectedRawReport = ref<{ title: string; json: any } | null>(null);

const openRawJsonModal = (serviceName: string, report: any) => {
  selectedRawReport.value = {
    title: `${serviceName} Raw Stealth Report Payload`,
    json: report || { message: 'No detailed raw telemetry captured for this check.' },
  };
};

const closeRawJsonModal = () => {
  selectedRawReport.value = null;
};

// --- Threat Level Classification ---
const categorizeFlaggedParameters = (params: string[]) => {
  if (!params || params.length === 0) return { critical: [], fingerprint: [], network: [] };

  const critical: string[] = [];
  const fingerprint: string[] = [];
  const network: string[] = [];

  params.forEach((param) => {
    const upper = param.toUpperCase();
    if (
      upper.includes('WEBDRIVER') ||
      upper.includes('RECAPTCHA') ||
      upper.includes('LEAKED') ||
      upper.includes('FAILED') ||
      upper.includes('MISMATCH:EXPECTED')
    ) {
      critical.push(param);
    } else if (
      upper.includes('MISMATCH') ||
      upper.includes('CODECS') ||
      upper.includes('FONTS') ||
      upper.includes('CANVAS') ||
      upper.includes('WEBGL') ||
      upper.includes('KERNEL') ||
      upper.includes('PLATFORM')
    ) {
      fingerprint.push(param);
    } else {
      network.push(param);
    }
  });

  return { critical, fingerprint, network };
};

// --- Auto-Delta Diffing ---
const getDeltaInfo = (param: string) => {
  const active = activeAudit.value;
  const previous = previousAudits.value[0];
  if (!active || !previous) return null;

  const prevParams: string[] = previous.results ? previous.results.flatMap((r) => r.failedParameters || []) : [];
  const wasInPrevious = prevParams.includes(param);

  if (!wasInPrevious) {
    return { type: 'new', label: 'NEW ISSUE', class: 'bg-red-500 text-white dark:bg-red-600' };
  }
  return null;
};

const resolvedParametersInPreviousAudit = computed(() => {
  const active = activeAudit.value;
  const previous = previousAudits.value[0];
  if (!active || !previous) return [];

  const activeParams: string[] = active.results ? active.results.flatMap((r) => r.failedParameters || []) : [];
  const previousParams: string[] = previous.results ? previous.results.flatMap((r) => r.failedParameters || []) : [];

  return previousParams.filter((p) => !activeParams.includes(p));
});

// --- Compare Audits Modal ---
const showCompareModal = ref(false);
const compareAuditAId = ref<string>('');
const compareAuditBId = ref<string>('');

const openCompareModal = () => {
  const list = auditList.value;
  if (list.length >= 2) {
    compareAuditAId.value = list[0].auditId || list[0].lastAuditedAt;
    compareAuditBId.value = list[1].auditId || list[1].lastAuditedAt;
  }
  showCompareModal.value = true;
};

const auditA = computed(() => auditList.value.find((a) => (a.auditId || a.lastAuditedAt) === compareAuditAId.value) || null);
const auditB = computed(() => auditList.value.find((a) => (a.auditId || a.lastAuditedAt) === compareAuditBId.value) || null);

// --- Diagnostic Recommendations ---
interface DiagnosticRecommendation {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  actionHint: string;
  triggeringParams: string[];
}

const currentRuleLang = ref<'ru' | 'en'>('ru');

const activeRulesList = computed(() =>
  currentRuleLang.value === 'ru' ? STEALTH_DIAGNOSTIC_RULES_RU : STEALTH_DIAGNOSTIC_RULES
);

const diagnosticRecommendations = computed<DiagnosticRecommendation[]>(() => {
  const audit = activeAudit.value;
  if (!audit || !audit.results) return [];

  const allParams = audit.results.flatMap((r) => r.failedParameters || []);
  if (allParams.length === 0) return [];

  const recommendations: DiagnosticRecommendation[] = [];

  for (const rule of activeRulesList.value) {
    const matchedParams = allParams.filter((p) => rule.pattern.test(p));
    if (matchedParams.length > 0) {
      recommendations.push({
        id: rule.id,
        severity: rule.severity,
        category: rule.category,
        title: rule.title,
        description: rule.description,
        actionHint: rule.actionHint,
        triggeringParams: matchedParams,
      });
    }
  }

  return recommendations;
});

const showRecommendations = ref(false);

const criticalRecommendationsCount = computed(() =>
  diagnosticRecommendations.value.filter((r) => r.severity === 'critical').length
);
const warningRecommendationsCount = computed(() =>
  diagnosticRecommendations.value.filter((r) => r.severity === 'warning').length
);
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
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trust Score</span>
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
          <!-- Stealth Check Verdicts -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-4">
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">Stealth Check Verdicts</h3>
                <p class="text-xs text-gray-400">Individual Anti-Detect Diagnostics Breakdown</p>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  v-if="auditList.length >= 2"
                  @click="openCompareModal()"
                  type="button"
                  class="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border border-purple-200 dark:border-purple-900/60"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                  <span>Diff Audits</span>
                </button>

                <span class="px-3 py-1 rounded-full text-xs font-bold" :class="getAuditBadge(activeAudit || undefined).class">
                  {{ activeAudit?.overallStatus || 'NOT AUDITED' }}
                </span>
              </div>
            </div>

            <!-- Active / All Audits Grouped List -->
            <div v-if="auditList.length > 0" class="space-y-4">
              <!-- Active Audit Run Accordion Card -->
              <div 
                v-if="activeAudit" 
                class="border border-blue-100 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <!-- Active Audit Run Header -->
                <div 
                  @click="toggleAuditExpand(activeAudit.auditId || 'active')"
                  class="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors border-b border-blue-100/60 dark:border-blue-900/40"
                >
                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                      Active Audit Run
                    </span>
                    <span class="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                      ID: {{ activeAudit.auditId ? activeAudit.auditId.substring(0, 8) + '...' : 'CURRENT' }}
                    </span>
                    <span class="text-xs text-gray-400">
                      {{ new Date(activeAudit.lastAuditedAt).toLocaleString() }}
                    </span>
                  </div>

                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-xs" :class="getAuditBadge(activeAudit).class">
                      {{ activeAudit.overallTrustScore }}% {{ activeAudit.overallStatus }}
                    </span>

                    <button 
                      type="button" 
                      class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>{{ isAuditExpanded(activeAudit.auditId || 'active', true) ? 'Collapse Audit' : 'Expand Audit' }}</span>
                      <svg 
                        class="w-4 h-4 transition-transform duration-200" 
                        :class="{ 'rotate-180': isAuditExpanded(activeAudit.auditId || 'active', true) }"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Services inside Active Audit Run -->
                <div v-if="isAuditExpanded(activeAudit.auditId || 'active', true)" class="p-4 space-y-2.5">
                  <div 
                    v-for="res in activeAudit.results" 
                    :key="res.serviceName"
                    class="border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 rounded-xl overflow-hidden transition-all duration-200"
                  >
                    <!-- Service Header Row -->
                    <div 
                      @click="toggleServiceExpand(activeAudit.auditId || 'active', res.serviceName)"
                      class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
                    >
                      <div class="flex items-center gap-2.5">
                        <template v-if="getServiceStatusConfig(res).type === 'success'">
                          <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        </template>
                        <template v-else-if="getServiceStatusConfig(res).type === 'warning'">
                          <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        </template>
                        <template v-else>
                          <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </template>

                        <span class="font-bold text-sm text-gray-900 dark:text-gray-100">{{ res.serviceName }}</span>

                        <span class="px-2.5 py-0.5 rounded-full font-bold text-xs" :class="getServiceStatusConfig(res).badgeClass">
                          {{ getServiceStatusConfig(res).label }}
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        <button 
                          @click.stop="triggerSingleServiceRerun(res.serviceName)"
                          :disabled="actionLoading"
                          type="button" 
                          class="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-300 hover:text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                          title="Rerun stealth audit check for this service only"
                        >
                          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin text-blue-600': triggeringService === res.serviceName }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                          <span>Rerun Check</span>
                        </button>

                        <button type="button" class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                          <span>{{ isServiceExpanded(activeAudit.auditId || 'active', res.serviceName) ? 'Collapse' : 'Expand' }}</span>
                          <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isServiceExpanded(activeAudit.auditId || 'active', res.serviceName) }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Service Details -->
                    <div v-if="isServiceExpanded(activeAudit.auditId || 'active', res.serviceName)" class="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/40 dark:bg-gray-950/60 space-y-3">
                      <!-- Raw JSON Button -->
                      <div class="flex items-center justify-between pb-1">
                        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Diagnostics</span>
                        <button 
                          @click="openRawJsonModal(res.serviceName, (res as any).report)"
                          type="button"
                          class="px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-800 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <span>{ } Raw JSON</span>
                        </button>
                      </div>

                      <!-- Rich Scraped Telemetry Widget -->
                      <StealthTelemetryWidget :service-name="res.serviceName" :report="(res as any).report" />

                      <div v-if="res.failedParameters && res.failedParameters.length > 0" class="space-y-3">
                        <!-- Categorized Threat Parameter Cards -->
                        <div class="space-y-2">
                          <!-- Critical Threat Parameters -->
                          <div v-if="categorizeFlaggedParameters(res.failedParameters).critical.length > 0" class="bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-3 space-y-1.5">
                            <div class="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              <span>Critical Threat Parameters ({{ categorizeFlaggedParameters(res.failedParameters).critical.length }})</span>
                            </div>
                            <ul class="space-y-1">
                              <li v-for="param in categorizeFlaggedParameters(res.failedParameters).critical" :key="param" class="text-xs font-mono text-red-700 dark:text-red-300 flex items-center justify-between gap-2 break-all">
                                <span class="flex items-start gap-1.5">
                                  <span class="text-red-400 shrink-0">•</span>
                                  <span>{{ param }}</span>
                                </span>
                                <span v-if="getDeltaInfo(param)" class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0" :class="getDeltaInfo(param)?.class">
                                  {{ getDeltaInfo(param)?.label }}
                                </span>
                              </li>
                            </ul>
                          </div>

                          <!-- Fingerprint & OS Mismatches -->
                          <div v-if="categorizeFlaggedParameters(res.failedParameters).fingerprint.length > 0" class="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 space-y-1.5">
                            <div class="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                              <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                              <span>Fingerprint & OS Mismatches ({{ categorizeFlaggedParameters(res.failedParameters).fingerprint.length }})</span>
                            </div>
                            <ul class="space-y-1">
                              <li v-for="param in categorizeFlaggedParameters(res.failedParameters).fingerprint" :key="param" class="text-xs font-mono text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 break-all">
                                <span class="flex items-start gap-1.5">
                                  <span class="text-amber-500 shrink-0">•</span>
                                  <span>{{ param }}</span>
                                </span>
                                <span v-if="getDeltaInfo(param)" class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0" :class="getDeltaInfo(param)?.class">
                                  {{ getDeltaInfo(param)?.label }}
                                </span>
                              </li>
                            </ul>
                          </div>

                          <!-- Network / IP Reputation Flags -->
                          <div v-if="categorizeFlaggedParameters(res.failedParameters).network.length > 0" class="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 space-y-1.5">
                            <div class="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
                              <svg class="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              <span>Network & IP Reputation Flags ({{ categorizeFlaggedParameters(res.failedParameters).network.length }})</span>
                            </div>
                            <ul class="space-y-1">
                              <li v-for="param in categorizeFlaggedParameters(res.failedParameters).network" :key="param" class="text-xs font-mono text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2 break-all">
                                <span class="flex items-start gap-1.5">
                                  <span class="text-blue-500 shrink-0">•</span>
                                  <span>{{ param }}</span>
                                </span>
                                <span v-if="getDeltaInfo(param)" class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0" :class="getDeltaInfo(param)?.class">
                                  {{ getDeltaInfo(param)?.label }}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div v-else class="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>Clean fingerprint validation - all check parameters passed successfully.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Button to Toggle Previous Audits -->
              <div v-if="previousAudits.length > 0" class="pt-2 flex justify-center">
                <button 
                  @click="togglePreviousAudits()" 
                  type="button"
                  class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-gray-200 dark:border-gray-800"
                >
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>{{ showPreviousAudits ? 'Hide Previous Audits' : `Show Previous Audits (${previousAudits.length})` }}</span>
                </button>
              </div>

              <!-- Historical Audits List (Collapsible) -->
              <div v-if="showPreviousAudits && previousAudits.length > 0" class="space-y-3 pt-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Historical Audit Runs History</h4>
                
                <div 
                  v-for="audit in previousAudits" 
                  :key="audit.auditId || audit.lastAuditedAt"
                  class="border border-gray-200 dark:border-gray-800/80 bg-gray-50/60 dark:bg-gray-900/30 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <!-- Historical Audit Run Header -->
                  <div 
                    @click="toggleAuditExpand(audit.auditId || audit.lastAuditedAt)"
                    class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div class="flex items-center gap-2.5">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 uppercase">
                        Previous Audit
                      </span>
                      <span class="font-mono text-xs text-gray-500">
                        ID: {{ audit.auditId ? audit.auditId.substring(0, 8) + '...' : 'HISTORICAL' }}
                      </span>
                      <span class="text-xs text-gray-400">
                        {{ new Date(audit.lastAuditedAt).toLocaleString() }}
                      </span>
                    </div>

                    <div class="flex items-center gap-3">
                      <span class="px-2.5 py-0.5 rounded-full font-bold text-xs" :class="getAuditBadge(audit).class">
                        {{ audit.overallTrustScore }}% {{ audit.overallStatus }}
                      </span>

                      <button type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                        <span>{{ isAuditExpanded(audit.auditId || audit.lastAuditedAt, false) ? 'Collapse' : 'Expand' }}</span>
                        <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isAuditExpanded(audit.auditId || audit.lastAuditedAt, false) }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Services inside Historical Audit Run -->
                  <div v-if="isAuditExpanded(audit.auditId || audit.lastAuditedAt, false)" class="p-4 space-y-2.5 bg-white dark:bg-gray-950">
                    <div 
                      v-for="res in audit.results" 
                      :key="res.serviceName"
                      class="border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl overflow-hidden transition-all duration-200"
                    >
                      <div 
                        @click="toggleServiceExpand(audit.auditId || audit.lastAuditedAt, res.serviceName)"
                        class="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-colors select-none"
                      >
                        <div class="flex items-center gap-2.5">
                          <template v-if="getServiceStatusConfig(res).type === 'success'">
                            <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                          </template>
                          <template v-else-if="getServiceStatusConfig(res).type === 'warning'">
                            <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          </template>
                          <template v-else>
                            <svg class="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </template>

                          <span class="font-bold text-xs text-gray-900 dark:text-gray-100">{{ res.serviceName }}</span>

                          <span class="px-2 py-0.5 rounded-full font-bold text-[10px]" :class="getServiceStatusConfig(res).badgeClass">
                            {{ getServiceStatusConfig(res).label }}
                          </span>
                        </div>

                        <button type="button" class="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-blue-600">
                          <span>{{ isServiceExpanded(audit.auditId || audit.lastAuditedAt, res.serviceName) ? 'Collapse' : 'Expand' }}</span>
                          <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': isServiceExpanded(audit.auditId || audit.lastAuditedAt, res.serviceName) }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                      </div>

                      <div v-if="isServiceExpanded(audit.auditId || audit.lastAuditedAt, res.serviceName)" class="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                        <!-- Rich Scraped Telemetry Widget -->
                        <StealthTelemetryWidget :service-name="res.serviceName" :report="(res as any).report" />
                        <div v-if="res.failedParameters && res.failedParameters.length > 0" class="mt-2 space-y-1.5">
                          <span class="text-[10px] font-bold text-red-600 dark:text-red-400 block uppercase tracking-wider">
                            Flagged Parameters ({{ res.failedParameters.length }})
                          </span>
                          <div class="bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-lg p-2.5">
                            <ul class="space-y-1">
                              <li v-for="param in res.failedParameters" :key="param" class="text-[11px] font-mono text-red-700 dark:text-red-300 flex items-start gap-1.5 break-all">
                                <span class="text-red-400 shrink-0">•</span>
                                <span>{{ param }}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div v-else class="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                          <span>Clean fingerprint validation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
              No stealth audit reports run yet for this profile. Click "Run Stealth Audit" above to launch a stealth audit scan.
            </div>
          </div>

          <!-- Diagnostic Recommendations Card -->
          <div v-if="diagnosticRecommendations.length > 0" class="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm space-y-3 transition-all duration-200">
            <!-- Header Row -->
            <div 
              @click="showRecommendations = !showRecommendations" 
              class="flex items-center justify-between cursor-pointer select-none"
            >
              <div class="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                <span>Stealth Diagnostic Recommendations</span>

                <div class="flex items-center gap-1.5 ml-2">
                  <span v-if="criticalRecommendationsCount > 0" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                    {{ criticalRecommendationsCount }} Critical
                  </span>
                  <span v-if="warningRecommendationsCount > 0" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                    {{ warningRecommendationsCount }} Warning
                  </span>
                </div>
              </div>

              <button type="button" class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline">
                <span>{{ showRecommendations ? 'Collapse' : 'Expand Recommendations' }}</span>
                <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showRecommendations }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>

            <!-- Recommendations Content (Visible only when Expanded) -->
            <div v-if="showRecommendations" class="space-y-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
              <!-- Top Toolbar inside Expanded block -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-amber-900/80 dark:text-amber-200 uppercase tracking-wider">
                  Diagnostic Action Plan
                </span>

                <!-- Language Switcher inside Expanded block -->
                <div class="flex items-center gap-1 bg-amber-100/80 dark:bg-amber-950/80 p-0.5 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] font-bold">
                  <button 
                    @click="currentRuleLang = 'ru'" 
                    :class="currentRuleLang === 'ru' ? 'bg-white dark:bg-amber-900 text-amber-900 dark:text-white shadow-xs' : 'text-amber-700 dark:text-amber-400 hover:text-amber-900'"
                    class="px-2 py-0.5 rounded-md transition-all flex items-center gap-1"
                  >
                    <span>🇷🇺</span>
                    <span>RU</span>
                  </button>
                  <button 
                    @click="currentRuleLang = 'en'" 
                    :class="currentRuleLang === 'en' ? 'bg-white dark:bg-amber-900 text-amber-900 dark:text-white shadow-xs' : 'text-amber-700 dark:text-amber-400 hover:text-amber-900'"
                    class="px-2 py-0.5 rounded-md transition-all flex items-center gap-1"
                  >
                    <span>🇬🇧</span>
                    <span>EN</span>
                  </button>
                </div>
              </div>

              <!-- Recommendations Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div 
                v-for="rec in diagnosticRecommendations" 
                :key="rec.id" 
                class="p-3.5 bg-white dark:bg-gray-950 border rounded-xl space-y-2 shadow-sm flex flex-col justify-between"
                :class="rec.severity === 'critical' ? 'border-red-200 dark:border-red-900/60' : 'border-amber-200 dark:border-amber-900/60'"
              >
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full" :class="rec.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'"></span>
                      {{ rec.title }}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase" :class="rec.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'">
                      {{ rec.severity }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-300 leading-normal">{{ rec.description }}</p>
                </div>

                <div class="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800/80">
                  <div class="space-y-1">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Triggered by {{ rec.triggeringParams.length }} Parameter(s):
                    </span>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="param in rec.triggeringParams" 
                        :key="param" 
                        class="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[10px] rounded-md truncate max-w-full"
                        :title="param"
                      >
                        {{ param }}
                      </span>
                    </div>
                  </div>

                  <div class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                    <span>Recommended Action: {{ rec.actionHint }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          <!-- Cookie Farm Details Card (Rich Widget with Target Sites Execution History) -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-5">
            <!-- Header Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-4">
              <div>
                <div class="flex items-center gap-2.5">
                  <span class="text-xl">🍪</span>
                  <h3 class="text-base font-bold text-gray-900 dark:text-white">
                    Cookie Farm Status & Execution History
                  </h3>
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                    :class="actionLoading 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse' 
                      : (profile.cookieFarm?.status === 'PLANNED' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300')"
                  >
                    {{ actionLoading ? 'WARMING IN PROGRESS' : (profile.cookieFarm?.status === 'PLANNED' ? 'PLAN READY (8 SITES)' : (profile.cookieFarm?.status || 'IDLE')) }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  Automated profile warming engine & heuristic cookie consent banner dismissals
                </p>
              </div>

              <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <!-- Generate Plan Button -->
                <button
                  @click="generateFarmPlan()"
                  :disabled="actionLoading || planGenerating"
                  type="button"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Generate automated warming plan based on Persona interests"
                >
                  <svg v-if="planGenerating" class="animate-spin h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <svg v-else class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                  </svg>
                  <span>{{ planGenerating ? 'Generating Plan...' : 'Generate Plan' }}</span>
                </button>

                <!-- Start Cookie Farm Button -->
                <button
                  @click="triggerCookieFarm()"
                  :disabled="actionLoading || planGenerating"
                  type="button"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <svg v-if="actionLoading" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span v-else class="text-sm">🍪</span>
                  <span>{{ actionLoading ? 'Warming Session...' : 'Start Cookie Farm' }}</span>
                </button>
              </div>
            </div>

            <!-- Active Warming Banner during execution -->
            <div 
              v-if="actionLoading && activeWarmingSite"
              class="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-pulse"
            >
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span class="font-bold">Active Headless Session:</span>
                <span>Navigating to <code class="font-mono font-bold text-amber-700 dark:text-amber-300">{{ activeWarmingSite }}</code></span>
              </div>
              <span class="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Level 1 Heuristics • Auto-accept</span>
            </div>

            <!-- 4 KPI Metrics Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-3.5 rounded-xl space-y-1">
                <span class="text-[10px] text-gray-400 uppercase font-semibold block tracking-wider">Cookies Collected</span>
                <div class="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {{ profile.cookieFarm?.cookiesCount || 0 }}
                </div>
                <span class="text-[10px] text-gray-400 block truncate">Active in jar</span>
              </div>

              <div class="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-3.5 rounded-xl space-y-1">
                <span class="text-[10px] text-gray-400 uppercase font-semibold block tracking-wider">Target Domains</span>
                <div class="text-xl font-black text-gray-900 dark:text-white">
                  {{ profile.cookieFarm?.sitesVisitedCount || filteredSiteVisits.length }}
                </div>
                <span class="text-[10px] text-gray-400 block truncate">Warming pool</span>
              </div>

              <div class="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-3.5 rounded-xl space-y-1">
                <span class="text-[10px] text-gray-400 uppercase font-semibold block tracking-wider">Success Rate</span>
                <div class="text-xl font-black text-blue-600 dark:text-blue-400">
                  {{ profile.cookieFarm?.consentSuccessRate || 100 }}%
                </div>
                <span class="text-[10px] text-blue-600 dark:text-blue-400 font-medium block truncate">100% Visit Pass</span>
              </div>

              <div class="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-3.5 rounded-xl space-y-1">
                <span class="text-[10px] text-gray-400 uppercase font-semibold block tracking-wider">Total Runtime</span>
                <div class="text-xl font-black text-purple-600 dark:text-purple-400">
                  {{ profile.cookieFarm?.totalDurationSeconds || 84 }}s
                </div>
                <span class="text-[10px] text-gray-400 block truncate">Avg ~10.5s / site</span>
              </div>
            </div>

            <!-- Category Filter Tabs & Toolbar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/80">
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  v-for="tab in farmCategoryTabs"
                  :key="tab.key"
                  @click="farmCategoryFilter = tab.key"
                  type="button"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  :class="farmCategoryFilter === tab.key 
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'"
                >
                  <span>{{ tab.icon }}</span>
                  <span>{{ tab.label }}</span>
                  <span class="ml-0.5 text-[10px] opacity-75">({{ tab.count }})</span>
                </button>
              </div>

              <span class="text-[11px] text-gray-400 font-medium">
                Showing {{ filteredSiteVisits.length }} sites
              </span>
            </div>

            <!-- Target Sites Execution Table -->
            <div class="border border-gray-100 dark:border-gray-800/80 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-gray-50/70 dark:bg-gray-900/70 border-b border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th class="py-2.5 px-3">Target Domain</th>
                    <th class="py-2.5 px-3">Category</th>
                    <th class="py-2.5 px-3">Cookies</th>
                    <th class="py-2.5 px-3">Behavior & Dwell</th>
                    <th class="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800/40">
                  <tr 
                    v-for="site in filteredSiteVisits" 
                    :key="site.siteUrl"
                    class="hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors"
                    :class="{ 'bg-amber-50/30 dark:bg-amber-950/20': activeWarmingSite === site.siteUrl }"
                  >
                    <!-- Domain -->
                    <td class="py-3 px-3">
                      <span class="font-bold font-mono text-xs text-gray-900 dark:text-white">{{ site.siteUrl }}</span>
                    </td>

                    <!-- Category -->
                    <td class="py-3 px-3">
                      <span 
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1"
                        :class="getCategoryBadge(site.category).class"
                      >
                        <span>{{ getCategoryBadge(site.category).icon }}</span>
                        <span>{{ getCategoryBadge(site.category).label }}</span>
                      </span>
                    </td>

                    <!-- Cookies -->
                    <td class="py-3 px-3">
                      <span 
                        v-if="site.status === 'PENDING' || site.status === 'QUEUED'"
                        class="px-2 py-0.5 rounded-md font-mono text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800"
                      >
                        0 (planned)
                      </span>
                      <span 
                        v-else
                        class="px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60"
                      >
                        +{{ site.cookiesCaptured }}
                      </span>
                    </td>

                    <!-- Dwell & Interaction -->
                    <td class="py-3 px-3 text-xs text-gray-600 dark:text-gray-300">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span>{{ site.interactionSummary }}</span>
                        <span class="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded">
                          {{ site.durationSeconds }}s
                        </span>
                      </div>
                    </td>

                    <!-- Status -->
                    <td class="py-3 px-3 text-right">
                      <span 
                        v-if="activeWarmingSite === site.siteUrl"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse inline-flex items-center gap-1"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        WARMING
                      </span>
                      <span 
                        v-else-if="site.status === 'PENDING' || site.status === 'QUEUED'"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 inline-flex items-center gap-1"
                      >
                        <svg class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        PENDING
                      </span>
                      <span 
                        v-else
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1"
                      >
                        <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right 1 Column: Node Host Info & Ad Account Binding -->
        <div class="space-y-6">
          <!-- Assigned Persona Card -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Persona ("Фоторобот")</span>
              <router-link 
                to="/affiliate/personas" 
                class="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Personas Directory →
              </router-link>
            </div>

            <div v-if="profile.personaName" class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base shadow-xs">
                  👤
                </div>
                <div>
                  <h4 class="text-sm font-extrabold text-gray-900 dark:text-white">{{ profile.personaName }}</h4>
                  <span class="text-[11px] text-gray-500 dark:text-gray-400">🇪🇪 Estonia • Default Geo Match</span>
                </div>
              </div>

              <!-- Active Logged-in Social Sessions in this Browser Profile -->
              <div class="pt-2 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Active Social Sessions in this Browser (M:N):
                </span>
                <div v-if="profile.activeSocialSessions && profile.activeSocialSessions.length > 0" class="space-y-1.5">
                  <div 
                    v-for="sess in profile.activeSocialSessions" 
                    :key="sess.socialAccountId"
                    class="p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 flex items-center justify-between text-xs"
                  >
                    <div class="flex items-center gap-2">
                      <span 
                        class="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase"
                        :class="sess.platform === 'facebook' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'"
                      >
                        {{ sess.platform === 'facebook' ? 'FB' : 'Google' }}
                      </span>
                      <span class="font-bold text-gray-800 dark:text-gray-200">{{ sess.displayName }}</span>
                    </div>
                    <span class="font-mono text-[10px] text-gray-400">{{ sess.username }}</span>
                  </div>
                </div>
                <div v-else class="text-xs text-gray-400 italic">
                  No active social sessions logged in for this hardware profile yet.
                </div>
              </div>
            </div>

            <div v-else class="text-center py-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl space-y-2">
              <span class="text-xs text-gray-400 block">No digital persona bound to this profile.</span>
              <router-link 
                to="/affiliate/personas" 
                class="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                ⚡ Assign or Generate Persona
              </router-link>
            </div>
          </div>

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

    <!-- Raw JSON Modal -->
    <div v-if="selectedRawReport" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 class="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">{{ selectedRawReport.title }}</h3>
          <button @click="closeRawJsonModal()" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-4 overflow-y-auto flex-1 bg-gray-950 text-gray-100 font-mono text-xs">
          <pre class="whitespace-pre-wrap break-all">{{ JSON.stringify(selectedRawReport.json, null, 2) }}</pre>
        </div>
        <div class="p-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button @click="closeRawJsonModal()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold">
            Close Viewer
          </button>
        </div>
      </div>
    </div>

    <!-- Compare Audits Modal -->
    <div v-if="showCompareModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Side-by-Side Audit Run Comparison (Diff)</h3>
          </div>
          <button @click="showCompareModal = false" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-4 space-y-4 overflow-y-auto flex-1">
          <!-- Audit Selection Controls -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-500 uppercase">Audit Run A (Base)</label>
              <select v-model="compareAuditAId" class="w-full text-xs font-mono p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <option v-for="a in auditList" :key="a.auditId || a.lastAuditedAt" :value="a.auditId || a.lastAuditedAt">
                  {{ a.valid ? '[ACTIVE]' : '[HISTORICAL]' }} ID: {{ a.auditId ? a.auditId.substring(0, 8) : 'RUN' }} - {{ a.overallTrustScore }}% {{ a.overallStatus }} ({{ new Date(a.lastAuditedAt).toLocaleTimeString() }})
                </option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-500 uppercase">Audit Run B (Target)</label>
              <select v-model="compareAuditBId" class="w-full text-xs font-mono p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <option v-for="a in auditList" :key="a.auditId || a.lastAuditedAt" :value="a.auditId || a.lastAuditedAt">
                  {{ a.valid ? '[ACTIVE]' : '[HISTORICAL]' }} ID: {{ a.auditId ? a.auditId.substring(0, 8) : 'RUN' }} - {{ a.overallTrustScore }}% {{ a.overallStatus }} ({{ new Date(a.lastAuditedAt).toLocaleTimeString() }})
                </option>
              </select>
            </div>
          </div>

          <!-- Side-by-Side Results Grid -->
          <div class="grid grid-cols-2 gap-4 pt-2">
            <!-- Audit A Column -->
            <div v-if="auditA" class="border border-gray-200 dark:border-gray-800 rounded-xl p-3 space-y-3 bg-gray-50/40 dark:bg-gray-900/30">
              <div class="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                <span class="text-xs font-bold text-gray-900 dark:text-white">Trust Score: {{ auditA.overallTrustScore }}%</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getAuditBadge(auditA).class">{{ auditA.overallStatus }}</span>
              </div>

              <div v-for="res in auditA.results" :key="res.serviceName" class="p-2.5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg space-y-1">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span>{{ res.serviceName }}</span>
                  <span :class="getServiceStatusConfig(res).badgeClass" class="px-2 py-0.5 rounded text-[10px]">{{ getServiceStatusConfig(res).label }}</span>
                </div>
                <div v-if="res.failedParameters && res.failedParameters.length > 0" class="text-[11px] font-mono text-red-600 dark:text-red-400 space-y-0.5">
                  <div v-for="p in res.failedParameters" :key="p" class="truncate">• {{ p }}</div>
                </div>
                <div v-else class="text-[10px] text-emerald-600 font-medium">Clean</div>
              </div>
            </div>

            <!-- Audit B Column -->
            <div v-if="auditB" class="border border-gray-200 dark:border-gray-800 rounded-xl p-3 space-y-3 bg-gray-50/40 dark:bg-gray-900/30">
              <div class="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                <span class="text-xs font-bold text-gray-900 dark:text-white">Trust Score: {{ auditB.overallTrustScore }}%</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getAuditBadge(auditB).class">{{ auditB.overallStatus }}</span>
              </div>

              <div v-for="res in auditB.results" :key="res.serviceName" class="p-2.5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg space-y-1">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span>{{ res.serviceName }}</span>
                  <span :class="getServiceStatusConfig(res).badgeClass" class="px-2 py-0.5 rounded text-[10px]">{{ getServiceStatusConfig(res).label }}</span>
                </div>
                <div v-if="res.failedParameters && res.failedParameters.length > 0" class="text-[11px] font-mono text-red-600 dark:text-red-400 space-y-0.5">
                  <div v-for="p in res.failedParameters" :key="p" class="truncate">• {{ p }}</div>
                </div>
                <div v-else class="text-[10px] text-emerald-600 font-medium">Clean</div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button @click="showCompareModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold">
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
