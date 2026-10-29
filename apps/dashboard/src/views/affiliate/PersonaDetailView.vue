<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { 
  PersonaDto, 
  BrowserProfileDto, 
  SocialAccountDto, 
  AffiliateAccountDto 
} from '@altlab/shared';
import { generateTOTP, formatTotpCode } from '../../utils/totp';

const route = useRoute();
const router = useRouter();
const personaId = computed(() => route.params.id as string);

const persona = ref<PersonaDto | null>(null);
const allProfiles = ref<BrowserProfileDto[]>([]);
const loading = ref(true);
const actionLoading = ref(false);
const actionMessage = ref<string | null>(null);

// M:N Session Modal State
const showSessionModal = ref(false);
const activeSocial = ref<SocialAccountDto | null>(null);

interface LiveTotpState {
  code: string;
  secondsRemaining: number;
  progressPercent: number;
}
const liveTotpMap = ref<Record<string, LiveTotpState>>({});
const copiedTotpId = ref<string | null>(null);
let totpInterval: any = null;

const updateLiveTotp = async () => {
  if (!persona.value) return;
  for (const s of persona.value.socialAccounts || []) {
    if (s.has2fa && s.twoFactorSecret) {
      const res = await generateTOTP(s.twoFactorSecret);
      liveTotpMap.value[s.id] = res;
    }
  }
};

const copyTotpCode = async (socialId: string, code: string) => {
  await navigator.clipboard.writeText(code);
  copiedTotpId.value = socialId;
  setTimeout(() => {
    if (copiedTotpId.value === socialId) copiedTotpId.value = null;
  }, 2000);
};

const loadPersona = async () => {
  loading.value = true;
  try {
    const [personaRes, profilesRes] = await Promise.all([
      fetch(`/api/personas/${personaId.value}`),
      fetch('/api/affiliate/browser-profiles'),
    ]);

    if (personaRes.ok) {
      persona.value = await personaRes.json();
      await updateLiveTotp();
    } else {
      console.error('Persona not found');
    }

    if (profilesRes.ok) {
      allProfiles.value = await profilesRes.json();
    }
  } catch (err) {
    console.error('Failed to load persona details:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPersona();
  totpInterval = setInterval(updateLiveTotp, 1000);
});

onUnmounted(() => {
  if (totpInterval) clearInterval(totpInterval);
});

// Computed properties
const has2fa = computed(() => {
  return Boolean(persona.value?.socialAccounts?.some((s) => s.has2fa));
});

const accountsWith2fa = computed(() => {
  return (persona.value?.socialAccounts || []).filter((s) => s.has2fa);
});

const assignedProfiles = computed(() => {
  if (!persona.value || !persona.value.linkedProfileIds) return [];
  return allProfiles.value.filter((p) => persona.value!.linkedProfileIds.includes(p.profileId));
});

const allAdAccounts = computed<AffiliateAccountDto[]>(() => {
  if (!persona.value || !persona.value.socialAccounts) return [];
  const list: AffiliateAccountDto[] = [];
  persona.value.socialAccounts.forEach((s) => {
    if (s.adAccounts) list.push(...s.adAccounts);
  });
  return list;
});

const totalAdBalance = computed(() => {
  return allAdAccounts.value.reduce((acc, a) => acc + (a.balance || 0), 0);
});

const totalDailySpend = computed(() => {
  return allAdAccounts.value.reduce((acc, a) => acc + (a.dailySpend || 0), 0);
});

const totalActiveSessions = computed(() => {
  if (!persona.value || !persona.value.socialAccounts) return 0;
  return persona.value.socialAccounts.reduce(
    (acc, s) => acc + (s.loggedInProfileIds ? s.loggedInProfileIds.length : 0),
    0
  );
});

// M:N Session Management
const openSessionModal = (social: SocialAccountDto) => {
  activeSocial.value = social;
  showSessionModal.value = true;
};

const closeSessionModal = () => {
  showSessionModal.value = false;
  activeSocial.value = null;
};

const toggleProfileSession = async (profileId: string) => {
  if (!persona.value || !activeSocial.value) return;

  try {
    const res = await fetch(`/api/personas/${persona.value.id}/sessions/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personaId: persona.value.id,
        socialAccountId: activeSocial.value.id,
        profileId,
        action: 'toggle',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const targetSocial = activeSocial.value;
      if (!targetSocial.loggedInProfileIds) targetSocial.loggedInProfileIds = [];

      if (data.loggedIn) {
        if (!targetSocial.loggedInProfileIds.includes(profileId)) {
          targetSocial.loggedInProfileIds.push(profileId);
        }
        if (!persona.value.linkedProfileIds.includes(profileId)) {
          persona.value.linkedProfileIds.push(profileId);
        }
      } else {
        targetSocial.loggedInProfileIds = targetSocial.loggedInProfileIds.filter((id) => id !== profileId);
      }
    }
  } catch (err) {
    console.error('Failed to toggle session:', err);
  }
};

const getProfile = (profileId: string): BrowserProfileDto | undefined => {
  return allProfiles.value.find((p) => p.profileId === profileId);
};

const getProfileName = (profileId: string): string => {
  const found = getProfile(profileId);
  return found ? found.name : `Profile-${profileId.substring(0, 6)}`;
};

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  actionMessage.value = `${label} copied to clipboard!`;
  setTimeout(() => (actionMessage.value = null), 2000);
};

const getInterestColor = (code: string) => {
  switch (code) {
    case 'FINANCE': return 'bg-blue-500';
    case 'TECH': return 'bg-indigo-500';
    case 'E_COMMERCE': return 'bg-emerald-500';
    case 'TRAVEL': return 'bg-amber-500';
    case 'FASHION': return 'bg-pink-500';
    case 'NEWS': return 'bg-purple-500';
    case 'BUSINESS': return 'bg-cyan-500';
    default: return 'bg-gray-500';
  }
};

const triggerCookieFarm = () => {
  actionMessage.value = 'Queuing Cookie Farm tasks across all assigned hardware profiles...';
  setTimeout(() => {
    actionMessage.value = 'Cookie Farm scheduled for all profiles under Persona interests!';
    setTimeout(() => (actionMessage.value = null), 3000);
  }, 1000);
};

const handleDeletePersona = async () => {
  if (!persona.value) return;
  const name = `${persona.value.firstName} ${persona.value.lastName}`;
  if (!confirm(`Are you sure you want to delete persona "${name}" (${persona.value.id})?`)) return;

  actionLoading.value = true;
  try {
    const res = await fetch(`/api/personas/${persona.value.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/affiliate/personas');
    }
  } catch (err) {
    console.error('Failed to delete persona:', err);
  } finally {
    actionLoading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Back Button & Breadcrumbs -->
    <div class="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
      <router-link to="/affiliate/personas" class="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        <span>Back to Personas Directory</span>
      </router-link>
      <span>/</span>
      <span class="text-gray-800 dark:text-gray-200">{{ persona?.firstName }} {{ persona?.lastName }}</span>
    </div>

    <!-- Notification Alert -->
    <div v-if="actionMessage" class="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
      <svg class="w-4 h-4 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>{{ actionMessage }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-20 text-gray-400 text-sm">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
      <div>Loading detailed persona profile...</div>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!persona" class="text-center py-20 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-3">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white">Persona Not Found</h3>
      <p class="text-xs text-gray-400">The requested persona ID does not exist or was deleted.</p>
      <router-link to="/affiliate/personas" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
        Return to Directory
      </router-link>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Top Hero Header -->
      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
          <img 
            :src="persona.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'" 
            :alt="persona.firstName" 
            class="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 dark:border-gray-800 shadow-md shrink-0"
          />
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2.5">
              <h2 class="text-2xl font-black text-gray-900 dark:text-white">
                {{ persona.firstName }} {{ persona.lastName }}
              </h2>
              <span 
                class="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider"
                :class="persona.gender === 'MALE' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300'"
              >
                {{ persona.gender === 'MALE' ? '👨 Male' : '👩 Female' }}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {{ persona.age }} years old
              </span>
              <span 
                v-if="has2fa" 
                class="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5"
                :title="`2FA protected across ${accountsWith2fa.length} accounts`"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>2FA Protected</span>
              </span>
              <span 
                v-else 
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5 text-amber-500/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>No 2FA Active</span>
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
                <span>🇪🇪</span>
                <span>{{ persona.city }}, Estonia</span>
              </span>
              <span>•</span>
              <span class="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded text-[11px]">
                {{ persona.timezone }}
              </span>
              <span>•</span>
              <span class="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded text-[11px]">
                {{ persona.locale }}
              </span>
            </div>
          </div>
        </div>

        <!-- Hero Actions -->
        <div class="flex items-center gap-3 shrink-0">
          <button
            @click="triggerCookieFarm"
            type="button"
            class="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Run Cookie Farm</span>
          </button>

          <button
            @click="handleDeletePersona"
            type="button"
            :disabled="actionLoading"
            class="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Delete this persona"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span>Delete Persona</span>
          </button>
        </div>
      </div>

      <!-- 4 Stat Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Social Accounts</span>
          <div class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ persona.socialAccounts?.length || 0 }}</div>
          <p class="text-[11px] text-blue-600 font-medium">Google, YouTube & Facebook</p>
        </div>

        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Browser Sessions</span>
          <div class="text-2xl font-extrabold text-emerald-600">{{ totalActiveSessions }}</div>
          <p class="text-[11px] text-emerald-600 font-medium">M:N Logged-in hardware windows</p>
        </div>

        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Commercial Ad Balance</span>
          <div class="text-2xl font-extrabold text-gray-900 dark:text-white">${{ totalAdBalance.toLocaleString() }}</div>
          <p class="text-[11px] text-indigo-600 font-medium">${{ totalDailySpend.toLocaleString() }}/day budget</p>
        </div>

        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Affinity</span>
          <div class="text-2xl font-extrabold text-purple-600">
            {{ persona.interests?.[0]?.categoryName.split(' ')[0] || 'General' }}
          </div>
          <p class="text-[11px] text-purple-600 font-medium">{{ persona.interests?.[0]?.weight || 0 }}% weight for warming</p>
        </div>
      </div>

      <!-- Main 2-Column Detail Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Column (5/12): Digital Passport & Behavioral Affinity -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Digital Passport Card -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800/80 pb-3">
              Digital Passport («Фоторобот»)
            </h3>

            <div class="space-y-3 text-xs">
              <div>
                <span class="text-gray-400 uppercase text-[10px] font-bold block">Persona UUID</span>
                <span class="font-mono text-[11px] text-gray-700 dark:text-gray-300 select-all">{{ persona.id }}</span>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <div>
                  <span class="text-gray-400 uppercase text-[10px] font-bold block">Date of Birth</span>
                  <span class="font-bold text-gray-900 dark:text-white">{{ persona.birthDate }}</span>
                </div>
                <div>
                  <span class="text-gray-400 uppercase text-[10px] font-bold block">Age</span>
                  <span class="font-bold text-gray-900 dark:text-white">{{ persona.age }} years</span>
                </div>
              </div>

              <div class="pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <span class="text-gray-400 uppercase text-[10px] font-bold block">Registered Address</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ persona.address }}</span>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <div>
                  <span class="text-gray-400 uppercase text-[10px] font-bold block">Timezone</span>
                  <span class="font-mono text-purple-600 dark:text-purple-400 font-bold">{{ persona.timezone }}</span>
                </div>
                <div>
                  <span class="text-gray-400 uppercase text-[10px] font-bold block">Browser Locale</span>
                  <span class="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{{ persona.locale }}</span>
                </div>
              </div>

              <!-- Contacts -->
              <div class="pt-2 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                <span class="text-gray-400 uppercase text-[10px] font-bold block">Credentials & Contacts</span>

                <div 
                  @click="copyToClipboard(persona.email, 'Email')"
                  class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                >
                  <div class="flex items-center gap-2 overflow-hidden">
                    <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span class="font-mono text-xs text-gray-900 dark:text-white truncate">{{ persona.email }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400">COPY</span>
                </div>

                <div 
                  @click="copyToClipboard(persona.phone, 'Phone')"
                  class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                >
                  <div class="flex items-center gap-2 overflow-hidden">
                    <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <span class="font-mono text-xs text-gray-900 dark:text-white truncate">{{ persona.phone }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400">COPY</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Behavioral Affinity Vector Card -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <h3 class="text-base font-bold text-gray-900 dark:text-white">
                Behavioral Affinity Vector
              </h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                100% Normalized
              </span>
            </div>

            <p class="text-xs text-gray-400">
              This interest affinity vector feeds directly into the Cookie Farm Plan Generator to browse target websites matching the persona's natural digital habits.
            </p>

            <div class="space-y-3">
              <div v-for="interest in persona.interests" :key="interest.categoryCode" class="space-y-1">
                <div class="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" :class="getInterestColor(interest.categoryCode)"></span>
                    <span>{{ interest.categoryName }}</span>
                  </div>
                  <span class="font-mono text-sm">{{ interest.weight }}%</span>
                </div>
                <div class="w-full h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getInterestColor(interest.categoryCode)"
                    :style="{ width: `${interest.weight}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column (7/12): Social Accounts Deep Dive, Hardware Devices & Ad Accounts -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Social Accounts & Hierarchy Tree -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <h3 class="text-base font-bold text-gray-900 dark:text-white">
                Social Accounts & Assets Tree
              </h3>
              <span class="text-xs text-gray-400">
                {{ persona.socialAccounts?.length || 0 }} Accounts Attached
              </span>
            </div>

            <div class="space-y-4">
              <div 
                v-for="social in persona.socialAccounts" 
                :key="social.id"
                class="border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-4 bg-gray-50/40 dark:bg-gray-900/30 space-y-3"
              >
                <!-- Social Header -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span 
                      class="px-2.5 py-0.5 rounded-md text-xs font-black uppercase text-white shadow-xs"
                      :class="social.platform === 'facebook' ? 'bg-blue-600' : 'bg-red-600'"
                    >
                      {{ social.platform === 'facebook' ? 'Facebook' : 'Google' }}
                    </span>
                    <span class="font-extrabold text-sm text-gray-900 dark:text-white">
                      {{ social.displayName }}
                    </span>
                    <span class="text-xs text-gray-400 font-mono">
                      {{ social.username }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <span 
                      v-if="social.has2fa" 
                      class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>2FA: {{ (social.twoFactorType || 'totp').toUpperCase() }}</span>
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                      {{ social.status }}
                    </span>
                  </div>
                </div>

                <!-- Live 2FA TOTP Card -->
                <div v-if="social.has2fa" class="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>2FA Authenticator (RFC 6238 TOTP)</span>
                    </div>
                    <span class="text-[10px] font-mono text-gray-400">Refreshes in {{ liveTotpMap[social.id]?.secondsRemaining ?? 30 }}s</span>
                  </div>

                  <div class="flex items-center justify-between bg-white dark:bg-gray-900/80 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-900/60 shadow-2xs">
                    <div>
                      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current One-Time Password</span>
                      <span class="text-2xl font-mono font-black tracking-widest text-gray-900 dark:text-white">
                        {{ formatTotpCode(liveTotpMap[social.id]?.code || '------') }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <!-- Progress timer bar -->
                      <div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-emerald-500 transition-all duration-300"
                          :style="{ width: `${liveTotpMap[social.id]?.progressPercent ?? 100}%` }"
                        ></div>
                      </div>

                      <button 
                        @click="copyTotpCode(social.id, liveTotpMap[social.id]?.code || '')"
                        type="button"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        :class="copiedTotpId === social.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      >
                        <span v-if="copiedTotpId === social.id">✓ Copied</span>
                        <span v-else>Copy Code</span>
                      </button>
                    </div>
                  </div>

                  <div v-if="social.twoFactorSecret" class="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <span class="font-mono">Secret Key: ••••••••••••{{ social.twoFactorSecret.slice(-4) }}</span>
                    <button 
                      @click="copyToClipboard(social.twoFactorSecret, '2FA Secret Key')"
                      class="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Copy Secret Key
                    </button>
                  </div>
                </div>

                <!-- 1:N YouTube Channels (if Google) -->
                <div v-if="social.youtubeChannels && social.youtubeChannels.length > 0" class="p-3 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-1.5">
                  <div class="text-[11px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>▶️ YouTube Channels (1:N):</span>
                  </div>
                  <div 
                    v-for="ch in social.youtubeChannels" 
                    :key="ch.id" 
                    class="flex items-center justify-between text-xs text-gray-800 dark:text-gray-200"
                  >
                    <a :href="ch.channelUrl || '#'" target="_blank" class="font-bold hover:underline flex items-center gap-1">
                      {{ ch.name }}
                    </a>
                    <span class="font-mono text-gray-500 font-semibold">{{ ch.subscribersCount }} subscribers</span>
                  </div>
                </div>

                <!-- 1:N Ad Accounts under this Social Account -->
                <div v-if="social.adAccounts && social.adAccounts.length > 0" class="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2">
                  <div class="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    Commercial Ad Accounts (1:N):
                  </div>
                  <div 
                    v-for="acc in social.adAccounts" 
                    :key="acc.id" 
                    class="flex items-center justify-between text-xs"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-gray-900 dark:text-white">{{ acc.accountName }}</span>
                      <span class="text-[11px] font-mono text-gray-400">({{ acc.accountId }})</span>
                    </div>
                    <div class="flex items-center gap-2 font-bold text-emerald-600">
                      <span>${{ acc.balance.toLocaleString() }}</span>
                      <span class="text-[10px] text-gray-400 font-normal">(${{ acc.dailySpend }}/d)</span>
                    </div>
                  </div>
                </div>

                <!-- M:N Active Hardware Browser Sessions -->
                <div class="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-bold text-gray-400 uppercase text-[10px]">Logged-in Hardware:</span>
                    <template v-if="social.loggedInProfileIds && social.loggedInProfileIds.length > 0">
                      <router-link
                        v-for="profId in social.loggedInProfileIds" 
                        :key="profId"
                        :to="`/affiliate/browser-profiles/${profId}`"
                        class="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:underline border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1.5"
                        :title="`Open browser profile: ${getProfileName(profId)}`"
                      >
                        <img v-if="getProfile(profId)?.browserType === 'camoufox'" src="/camoufox.png" class="w-3.5 h-3.5 object-contain inline shrink-0" alt="Camoufox" />
                        <span v-else class="text-xs">🖥️</span>
                        <span>{{ getProfileName(profId) }}</span>
                      </router-link>
                    </template>
                    <span v-else class="text-gray-400 italic">No active browser login</span>
                  </div>

                  <!-- Manage Sessions Button -->
                  <button 
                    @click="openSessionModal(social)"
                    type="button" 
                    class="px-3 py-1 text-xs font-bold rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 text-gray-800 dark:text-gray-200 transition-colors shrink-0"
                  >
                    Manage Sessions (M:N)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Assigned Hardware Devices (Browser Profiles) Table -->
          <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">
                  Assigned Hardware Devices (Browser Profiles)
                </h3>
                <p class="text-xs text-gray-400">SpyHub Camoufox / Cloak instances bound to this Persona</p>
              </div>

              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {{ assignedProfiles.length }} Devices
              </span>
            </div>

            <div v-if="assignedProfiles.length === 0" class="text-center py-8 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/40 rounded-xl space-y-2">
              <div>No hardware profiles assigned directly to this persona yet.</div>
              <router-link to="/affiliate/browser-profiles" class="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Go to Browser Profiles Directory →
              </router-link>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th class="py-2.5 px-3">Profile Name</th>
                    <th class="py-2.5 px-3">Browser / OS</th>
                    <th class="py-2.5 px-3">Proxy</th>
                    <th class="py-2.5 px-3">Stealth Score</th>
                    <th class="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                  <tr v-for="prof in assignedProfiles" :key="prof.profileId" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                    <td class="py-3 px-3">
                      <div class="font-bold text-gray-900 dark:text-white">{{ prof.name }}</div>
                      <div class="font-mono text-[10px] text-gray-400">{{ prof.profileId.substring(0, 8) }}...</div>
                    </td>
                    <td class="py-3 px-3 uppercase text-gray-600 dark:text-gray-400">
                      {{ prof.browserType }} • {{ prof.os }}
                    </td>
                    <td class="py-3 px-3 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                      {{ prof.proxyIp || 'Direct' }}
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                        {{ prof.stealthAudit?.overallTrustScore || 98 }}% Trust
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right">
                      <router-link 
                        :to="`/affiliate/browser-profiles/${prof.profileId}`"
                        class="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        Inspect ➔
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- M:N Session Manager Modal -->
    <div 
      v-if="showSessionModal && persona && activeSocial" 
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-gray-900 dark:text-white">
              Manage Active Sessions (M:N)
            </h3>
            <p class="text-xs text-gray-400">
              Account: <strong class="text-gray-800 dark:text-gray-200">{{ activeSocial.displayName }} ({{ activeSocial.platform }})</strong>
            </p>
          </div>
          <button @click="closeSessionModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400">
          Toggle which browser profile devices currently hold an active authenticated session for this social account:
        </p>

        <!-- Profiles List -->
        <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
          <div 
            v-for="prof in allProfiles" 
            :key="prof.profileId"
            @click="toggleProfileSession(prof.profileId)"
            class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors"
            :class="(activeSocial.loggedInProfileIds || []).includes(prof.profileId) 
              ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900' 
              : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'"
          >
            <div class="flex items-center gap-3">
              <img v-if="prof.browserType === 'camoufox'" src="/camoufox.png" class="w-5 h-5 object-contain" alt="Camoufox" />
              <span v-else class="text-lg">🖥️</span>
              <div>
                <div class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  {{ prof.name }}
                  <span class="text-[10px] font-normal text-gray-400">({{ prof.browserType }} • {{ prof.os }})</span>
                </div>
                <div class="text-[11px] font-mono text-gray-400">
                  Proxy: {{ prof.proxyIp || 'Direct connection' }}
                </div>
              </div>
            </div>

            <!-- Toggle Status Indicator -->
            <div class="flex items-center gap-2">
              <span 
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                :class="(activeSocial.loggedInProfileIds || []).includes(prof.profileId)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'"
              >
                {{ (activeSocial.loggedInProfileIds || []).includes(prof.profileId) ? 'LOGGED IN' : 'NO SESSION' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            @click="closeSessionModal"
            type="button"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
