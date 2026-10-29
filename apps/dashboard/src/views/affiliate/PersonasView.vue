<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { 
  PersonaDto, 
  BrowserProfileDto, 
  SocialAccountDto, 
  CreatePersonaDto,
  SocialPlatform,
} from '@altlab/shared';
import { INTEREST_CATEGORIES } from '@altlab/shared';
import { generateTOTP, formatTotpCode } from '../../utils/totp';

const personas = ref<PersonaDto[]>([]);
const profiles = ref<BrowserProfileDto[]>([]);
const loading = ref(true);
const actionLoading = ref(false);
const actionMessage = ref<string | null>(null);

// Table Filtering & Search
const searchQuery = ref('');
const selectedGender = ref<'ALL' | 'MALE' | 'FEMALE'>('ALL');

// Slide-over Overview Drawer
const selectedPersona = ref<PersonaDto | null>(null);
const showDrawer = ref(false);

// Session Manager Modal State (M:N binding)
const showSessionModal = ref(false);
const activePersonaForSession = ref<PersonaDto | null>(null);
const activeSocial = ref<SocialAccountDto | null>(null);

// Create Persona Bottom Panel State
const showCreatePanel = ref(false);
const createPanelRef = ref<HTMLElement | null>(null);

const defaultPersonaForm = () => ({
  firstName: '',
  lastName: '',
  gender: 'MALE' as 'MALE' | 'FEMALE',
  age: 28,
  birthDate: '1998-05-14',
  avatarUrl: '',
  countryCode: 'EE',
  country: 'Estonia',
  city: 'Tallinn',
  address: 'Liivalaia 45, 10145 Tallinn',
  timezone: 'Europe/Tallinn',
  locale: 'et-EE, et;q=0.9, en;q=0.8',
  email: '',
  phone: '',
  primaryInterest: 'FINANCE',
  secondaryInterest: 'TECH',
  primaryWeight: 70,
  secondaryWeight: 30,
  // Social Account & 2FA
  attachSocial: true,
  socialPlatform: 'facebook' as SocialPlatform,
  socialUsername: '',
  has2fa: true,
  twoFactorType: 'totp' as const,
  twoFactorSecret: '',
});

const newPersonaForm = ref(defaultPersonaForm());

const loadData = async () => {
  loading.value = true;
  try {
    const [personasRes, profilesRes] = await Promise.all([
      fetch('/api/personas'),
      fetch('/api/affiliate/browser-profiles'),
    ]);

    if (personasRes.ok) {
      personas.value = await personasRes.json();
    }
    if (profilesRes.ok) {
      profiles.value = await profilesRes.json();
    }
  } catch (err) {
    console.error('Failed to load personas or profiles:', err);
  } finally {
    loading.value = false;
  }
};

// Handle Escape key to close modals or drawer
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (showSessionModal.value) {
      showSessionModal.value = false;
    } else if (showCreatePanel.value) {
      showCreatePanel.value = false;
    } else if (showDrawer.value) {
      showDrawer.value = false;
    }
  }
};

onMounted(() => {
  loadData();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (totpInterval) clearInterval(totpInterval);
});

// Stats calculation
const totalPersonas = computed(() => personas.value.length);
const totalSocialAccounts = computed(() => 
  personas.value.reduce((acc, p) => acc + (p.socialAccounts ? p.socialAccounts.length : 0), 0)
);
const totalActiveSessions = computed(() => {
  let count = 0;
  personas.value.forEach((p) => {
    p.socialAccounts?.forEach((s) => {
      count += s.loggedInProfileIds ? s.loggedInProfileIds.length : 0;
    });
  });
  return count;
});
const totalAdAccounts = computed(() => {
  let count = 0;
  personas.value.forEach((p) => {
    p.socialAccounts?.forEach((s) => {
      count += s.adAccounts ? s.adAccounts.length : 0;
    });
  });
  return count;
});

// Filtered personas list for high-density table
const filteredPersonas = computed(() => {
  let result = personas.value;

  if (selectedGender.value !== 'ALL') {
    result = result.filter((p) => p.gender === selectedGender.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter((p) => 
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  }

  return result;
});

// One-Click Generator
const triggerGeneratePersona = async () => {
  actionLoading.value = true;
  actionMessage.value = 'Synthesizing realistic Estonian Persona ("Фоторобот")...';
  try {
    const res = await fetch('/api/personas/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: 'EE' }),
    });
    if (res.ok) {
      const created = await res.json();
      personas.value.unshift(created);
      actionMessage.value = `Persona "${created.firstName} ${created.lastName}" generated!`;
      setTimeout(() => (actionMessage.value = null), 3500);
    }
  } catch (err) {
    console.error('Failed to generate persona:', err);
  } finally {
    actionLoading.value = false;
  }
};

// Open Quick Overview Drawer
const openDrawer = (persona: PersonaDto) => {
  selectedPersona.value = persona;
  is2faCollapsed.value = true;
  showDrawer.value = true;
};

// Open Session Manager Modal
const openSessionModal = (persona: PersonaDto, social: SocialAccountDto) => {
  activePersonaForSession.value = persona;
  activeSocial.value = social;
  showSessionModal.value = true;
};

const closeSessionModal = () => {
  showSessionModal.value = false;
  activePersonaForSession.value = null;
  activeSocial.value = null;
};

// Toggle M:N login session between Social Account and Browser Profile
const toggleProfileSession = async (profileId: string) => {
  if (!activePersonaForSession.value || !activeSocial.value) return;

  const pId = activePersonaForSession.value.id;
  const sId = activeSocial.value.id;

  try {
    const res = await fetch(`/api/personas/${pId}/sessions/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personaId: pId,
        socialAccountId: sId,
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
        if (!activePersonaForSession.value.linkedProfileIds.includes(profileId)) {
          activePersonaForSession.value.linkedProfileIds.push(profileId);
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
  return profiles.value.find((p) => p.profileId === profileId);
};

const getProfileName = (profileId: string): string => {
  const found = getProfile(profileId);
  return found ? found.name : `Profile-${profileId.substring(0, 6)}`;
};

const getPersonaProfileIds = (persona: PersonaDto): string[] => {
  const set = new Set<string>(persona.linkedProfileIds || []);
  if (persona.socialAccounts) {
    for (const s of persona.socialAccounts) {
      if (s.loggedInProfileIds) {
        for (const id of s.loggedInProfileIds) {
          set.add(id);
        }
      }
    }
  }
  return Array.from(set);
};

const toggleCreatePanel = async () => {
  showCreatePanel.value = !showCreatePanel.value;
  if (showCreatePanel.value) {
    await nextTick();
    createPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const closeCreatePanel = () => {
  showCreatePanel.value = false;
};

const resetCreateForm = () => {
  newPersonaForm.value = defaultPersonaForm();
};

const onAgeChange = () => {
  const age = Number(newPersonaForm.value.age);
  if (!isNaN(age) && age >= 18 && age <= 100) {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const parts = (newPersonaForm.value.birthDate || '').split('-');
    const month = parts[1] || '05';
    const day = parts[2] || '14';
    newPersonaForm.value.birthDate = `${birthYear}-${month}-${day}`;
  }
};

const onBirthDateChange = () => {
  if (newPersonaForm.value.birthDate) {
    const birthYear = parseInt(newPersonaForm.value.birthDate.split('-')[0], 10);
    if (!isNaN(birthYear)) {
      const currentYear = new Date().getFullYear();
      newPersonaForm.value.age = Math.max(18, currentYear - birthYear);
    }
  }
};

const generateRandom2faSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  newPersonaForm.value.twoFactorSecret = secret;
};

const realisticMaleAvatars = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

const realisticFemaleAvatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

const switchRandomAvatar = () => {
  const pool = newPersonaForm.value.gender === 'MALE' ? realisticMaleAvatars : realisticFemaleAvatars;
  newPersonaForm.value.avatarUrl = pool[Math.floor(Math.random() * pool.length)];
};

const estonianTemplates = [
  {
    firstName: 'Rasmus',
    lastName: 'Mägi',
    gender: 'MALE' as const,
    age: 31,
    birthDate: '1995-04-18',
    city: 'Tallinn',
    address: 'Tartu mnt 24, 10115 Tallinn',
    primaryInterest: 'FINANCE',
    secondaryInterest: 'TECH',
    socialPlatform: 'facebook' as SocialPlatform,
    socialUsername: 'rasmus.magi.ee',
  },
  {
    firstName: 'Kadri',
    lastName: 'Tamm',
    gender: 'FEMALE' as const,
    age: 28,
    birthDate: '1998-09-12',
    city: 'Tartu',
    address: 'Riia mnt 18, 51010 Tartu',
    primaryInterest: 'E_COMMERCE',
    secondaryInterest: 'FASHION',
    socialPlatform: 'facebook' as SocialPlatform,
    socialUsername: 'kadri.tamm.ee',
  },
  {
    firstName: 'Sander',
    lastName: 'Kallas',
    gender: 'MALE' as const,
    age: 34,
    birthDate: '1992-11-05',
    city: 'Pärnu',
    address: 'Rüütli tn 14, 80010 Pärnu',
    primaryInterest: 'TRAVEL',
    secondaryInterest: 'BUSINESS',
    socialPlatform: 'google' as SocialPlatform,
    socialUsername: 'sander.kallas.pro',
  },
  {
    firstName: 'Liis',
    lastName: 'Sepp',
    gender: 'FEMALE' as const,
    age: 26,
    birthDate: '2000-03-21',
    city: 'Tallinn',
    address: 'Estonia pst 9, 10143 Tallinn',
    primaryInterest: 'TECH',
    secondaryInterest: 'FINANCE',
    socialPlatform: 'facebook' as SocialPlatform,
    socialUsername: 'liis.sepp.crypto',
  },
];

const prefillRealisticEstonianTemplate = () => {
  const tpl = estonianTemplates[Math.floor(Math.random() * estonianTemplates.length)];
  const avatars = tpl.gender === 'MALE' ? realisticMaleAvatars : realisticFemaleAvatars;
  const avatar = avatars[Math.floor(Math.random() * avatars.length)];
  const phone = `+372 5${Math.floor(Math.random() * 899999 + 100000)}`;
  const email = `${tpl.firstName.toLowerCase()}.${tpl.lastName.toLowerCase()}@mail.ee`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  newPersonaForm.value = {
    firstName: tpl.firstName,
    lastName: tpl.lastName,
    gender: tpl.gender,
    age: tpl.age,
    birthDate: tpl.birthDate,
    avatarUrl: avatar,
    countryCode: 'EE',
    country: 'Estonia',
    city: tpl.city,
    address: tpl.address,
    timezone: 'Europe/Tallinn',
    locale: 'et-EE, et;q=0.9, en;q=0.8',
    email,
    phone,
    primaryInterest: tpl.primaryInterest,
    secondaryInterest: tpl.secondaryInterest,
    primaryWeight: 70,
    secondaryWeight: 30,
    attachSocial: true,
    socialPlatform: tpl.socialPlatform,
    socialUsername: tpl.socialUsername,
    has2fa: true,
    twoFactorType: 'totp',
    twoFactorSecret: secret,
  };
};

const handleCreatePersona = async () => {
  const form = newPersonaForm.value;
  if (!form.firstName.trim() || !form.lastName.trim()) {
    alert('Please enter at least First Name and Last Name');
    return;
  }

  actionLoading.value = true;
  try {
    const primaryCat = INTEREST_CATEGORIES.find((c) => c.code === form.primaryInterest);
    const secondaryCat = INTEREST_CATEGORIES.find((c) => c.code === form.secondaryInterest);

    const interests = [
      {
        categoryCode: form.primaryInterest as any,
        categoryName: primaryCat?.name || form.primaryInterest,
        weight: Number(form.primaryWeight) || 70,
      },
      {
        categoryCode: form.secondaryInterest as any,
        categoryName: secondaryCat?.name || form.secondaryInterest,
        weight: Number(form.secondaryWeight) || 30,
      },
    ];

    const socialAccounts = form.attachSocial && form.socialUsername.trim() ? [
      {
        platform: form.socialPlatform,
        username: form.socialUsername.trim(),
        displayName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim() || undefined,
        status: 'farmed' as const,
        has2fa: form.has2fa,
        twoFactorType: form.has2fa ? ('totp' as const) : ('none' as const),
        twoFactorSecret: form.has2fa ? (form.twoFactorSecret.trim() || undefined) : undefined,
      }
    ] : undefined;

    const payload: CreatePersonaDto = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      gender: form.gender,
      age: Number(form.age) || undefined,
      birthDate: form.birthDate || undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
      countryCode: form.countryCode,
      country: form.country,
      city: form.city,
      address: form.address,
      timezone: form.timezone,
      locale: form.locale,
      email: form.email.trim() || `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}@mail.ee`,
      phone: form.phone.trim() || undefined,
      interests,
      socialAccounts,
    };

    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const created = await res.json();
      personas.value.unshift(created);
      showCreatePanel.value = false;
      resetCreateForm();
      actionMessage.value = `Persona "${created.firstName} ${created.lastName}" registered successfully!`;
      setTimeout(() => (actionMessage.value = null), 4000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Failed to create persona: ${err.message || 'Server error'}`);
    }
  } catch (err) {
    console.error('Failed to create persona:', err);
    alert('An unexpected error occurred while saving persona');
  } finally {
    actionLoading.value = false;
  }
};

const deletePersona = async (id: string, name: string) => {
  if (!confirm(`Are you sure you want to delete persona "${name}"?`)) return;

  try {
    const res = await fetch(`/api/personas/${id}`, { method: 'DELETE' });
    if (res.ok) {
      personas.value = personas.value.filter((p) => p.id !== id);
      if (selectedPersona.value && selectedPersona.value.id === id) {
        showDrawer.value = false;
      }
    }
  } catch (err) {
    console.error('Failed to delete persona:', err);
  }
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

const getSocialAccount = (persona: PersonaDto, platform: string) => {
  return persona.socialAccounts?.find((s) => s.platform === platform);
};

const hasYouTube = (persona: PersonaDto) => {
  const google = getSocialAccount(persona, 'google');
  return Boolean(google?.youtubeChannels && google.youtubeChannels.length > 0);
};

// 2FA Security & Authenticator
const getPersona2FAInfo = (persona: PersonaDto) => {
  const accountsWith2fa = (persona.socialAccounts || []).filter((s) => s.has2fa);
  const has2fa = accountsWith2fa.length > 0;
  const platforms = accountsWith2fa.map((s) => {
    const name = s.platform === 'facebook' ? 'Facebook' : s.platform === 'google' ? 'Google' : s.platform;
    return `${name} (${(s.twoFactorType || 'totp').toUpperCase()})`;
  });
  const tooltip = has2fa 
    ? `2FA Enabled on: ${platforms.join(', ')}`
    : 'No 2FA configured';
  return { has2fa, accountsWith2fa, platforms, tooltip };
};

interface LiveTotpState {
  code: string;
  secondsRemaining: number;
  progressPercent: number;
}
const liveTotpMap = ref<Record<string, LiveTotpState>>({});
const copiedTotpId = ref<string | null>(null);
const is2faCollapsed = ref(true);
let totpInterval: any = null;

const updateLiveTotp = async () => {
  if (!selectedPersona.value) return;
  for (const s of selectedPersona.value.socialAccounts || []) {
    if (s.has2fa && s.twoFactorSecret) {
      const res = await generateTOTP(s.twoFactorSecret);
      liveTotpMap.value[s.id] = res;
    }
  }
};

watch(is2faCollapsed, (collapsed) => {
  if (!collapsed) {
    updateLiveTotp();
  }
});

watch(showDrawer, (open) => {
  if (open) {
    updateLiveTotp();
    if (!totpInterval) {
      totpInterval = setInterval(updateLiveTotp, 1000);
    }
  } else {
    if (totpInterval) {
      clearInterval(totpInterval);
      totpInterval = null;
    }
  }
});

watch(selectedPersona, () => {
  if (showDrawer.value) {
    updateLiveTotp();
  }
});

const copyTotpCode = async (socialId: string, code: string) => {
  await navigator.clipboard.writeText(code);
  copiedTotpId.value = socialId;
  setTimeout(() => {
    if (copiedTotpId.value === socialId) copiedTotpId.value = null;
  }, 2000);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/80 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Personas & Identities
          </h2>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            «Фоторобот»
          </span>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Default GEO: 🇪🇪 Estonia
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          High-Density Directory: Passports, Non-Rigid Browser Sessions (M:N), Social Assets & Behavioral Affinities
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2.5">
        <button
          @click="triggerGeneratePersona"
          :disabled="actionLoading"
          type="button"
          class="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg v-if="actionLoading" class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>⚡ Generate Estonian Persona</span>
        </button>

        <button
          @click="toggleCreatePanel"
          type="button"
          :class="[
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
            showCreatePanel 
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-sm'
              : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80'
          ]"
        >
          <svg v-if="!showCreatePanel" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          <span>{{ showCreatePanel ? 'Close Form' : 'Create Persona' }}</span>
        </button>
      </div>
    </div>

    <!-- Notification Alert -->
    <div v-if="actionMessage" class="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-fadeIn">
      <svg class="w-4 h-4 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>{{ actionMessage }}</span>
    </div>

    <!-- KPI Summary Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1.5">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Personas</span>
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ totalPersonas }}</span>
          <span class="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">🇪🇪 All EE Geo</span>
        </div>
        <p class="text-[11px] text-gray-400">Scalable to 100+ identities</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1.5">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Social Accounts</span>
          <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ totalSocialAccounts }}</span>
          <span class="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">FB & Google</span>
        </div>
        <p class="text-[11px] text-gray-400">With attached YouTube & Ads</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1.5">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Active Browser Logins</span>
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ totalActiveSessions }}</span>
          <span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">M:N Sessions</span>
        </div>
        <p class="text-[11px] text-gray-400">Logged-in hardware profiles</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1.5">
        <div class="flex items-center justify-between text-gray-400">
          <span class="text-xs font-semibold uppercase tracking-wider">Ad Accounts (1:N)</span>
          <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ totalAdAccounts }}</span>
          <span class="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">Commercial</span>
        </div>
        <p class="text-[11px] text-gray-400">Under Social Asset Ownership</p>
      </div>
    </div>

    <!-- Quick Access to Manual Registration (Collapsed State: Click anywhere to open) -->
    <div 
      v-if="!showCreatePanel" 
      @click="showCreatePanel = true"
      class="border border-dashed border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer group shadow-xs select-none"
      title="Click to expand manual registration panel"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 shadow-xs border border-blue-100 dark:border-blue-900/50 group-hover:scale-105 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
        </div>
        <div>
          <h4 class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Need a custom manual persona?
            <span class="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-100/60 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Manual Registration
            </span>
          </h4>
          <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Configure custom identity, realistic Estonian GEO credentials, 2FA keys, and behavioral affinities.
          </p>
        </div>
      </div>

      <!-- Collapse / Expand Chevron Icon (Галочка) -->
      <div class="p-2 rounded-xl text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-100/60 dark:group-hover:bg-blue-950/60 transition-all shrink-0">
        <svg class="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>

    <!-- Manual Persona Registration Panel (Spacious & Extensible: Closed only via cross button) -->
    <div
      v-else
      ref="createPanelRef"
      class="bg-white dark:bg-gray-950 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-6 shadow-xl space-y-6 relative animate-fadeIn"
    >
      <!-- Panel Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Manual Registration
            </span>
            <h3 class="text-base font-extrabold text-gray-900 dark:text-white">
              Register Persona & Anti-Detect Assets
            </h3>
            <span class="text-xs text-gray-400 font-mono">🇪🇪 Estonia</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Spacious configuration panel for custom identities, realistic Estonian GEO credentials, warming affinities & 2FA keys.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="prefillRealisticEstonianTemplate"
            type="button"
            class="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Randomly populate with authentic Estonian identity, address, phone and 2FA secret"
          >
            <span>🪄 Pre-fill Realistic 🇪🇪 Template</span>
          </button>

          <!-- Cross button on the right to close -->
          <button
            @click="closeCreatePanel"
            type="button"
            class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Close Form (Esc)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Registration Form -->
      <form @submit.prevent="handleCreatePersona" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <!-- Column 1: Core Identity & Biometrics -->
          <div class="space-y-4 bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80">
            <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span class="font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                1. Identity & Biometrics
              </span>
              <button 
                type="button" 
                @click="switchRandomAvatar" 
                class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                🎲 Random Avatar
              </button>
            </div>

            <!-- Avatar Preview & Input -->
            <div class="flex items-center gap-3">
              <img 
                :src="newPersonaForm.avatarUrl || (newPersonaForm.gender === 'MALE' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80')" 
                class="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm shrink-0"
                alt="Avatar Preview"
              />
              <div class="flex-1">
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Avatar Image URL</label>
                <input 
                  v-model="newPersonaForm.avatarUrl" 
                  type="url" 
                  placeholder="https://... (or leave empty for default)" 
                  class="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>
            </div>

            <!-- Names -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="newPersonaForm.firstName" 
                  type="text" 
                  placeholder="e.g. Rasmus" 
                  required
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="newPersonaForm.lastName" 
                  type="text" 
                  placeholder="e.g. Mägi" 
                  required
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Gender Buttons -->
            <div>
              <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="newPersonaForm.gender = 'MALE'"
                  :class="[
                    'py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all',
                    newPersonaForm.gender === 'MALE'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700 shadow-xs'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  ]"
                >
                  <span>👨 Male</span>
                </button>
                <button
                  type="button"
                  @click="newPersonaForm.gender = 'FEMALE'"
                  :class="[
                    'py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all',
                    newPersonaForm.gender === 'FEMALE'
                      ? 'bg-pink-50 border-pink-500 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300 dark:border-pink-700 shadow-xs'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  ]"
                >
                  <span>👩 Female</span>
                </button>
              </div>
            </div>

            <!-- Age & Synced Birth Date -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Age (Years)</label>
                <input 
                  v-model.number="newPersonaForm.age" 
                  @input="onAgeChange"
                  type="number" 
                  min="18" 
                  max="99" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Birth Date</label>
                <input 
                  v-model="newPersonaForm.birthDate" 
                  @input="onBirthDateChange"
                  type="date" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Column 2: Estonian GEO & Contacts -->
          <div class="space-y-4 bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80">
            <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span class="font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                2. Estonian GEO & Contacts
              </span>
              <span class="text-[11px] font-mono text-gray-400">🇪🇪 ISO: EE</span>
            </div>

            <!-- City & Country -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">City</label>
                <select 
                  v-model="newPersonaForm.city"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Tallinn">Tallinn</option>
                  <option value="Tartu">Tartu</option>
                  <option value="Pärnu">Pärnu</option>
                  <option value="Narva">Narva</option>
                  <option value="Kohtla-Järve">Kohtla-Järve</option>
                  <option value="Viljandi">Viljandi</option>
                  <option value="Rakvere">Rakvere</option>
                  <option value="Kuressaare">Kuressaare</option>
                  <option value="Võru">Võru</option>
                  <option value="Haapsalu">Haapsalu</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <input 
                  type="text" 
                  value="Estonia (EE)" 
                  disabled
                  class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <!-- Street Address -->
            <div>
              <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
              <input 
                v-model="newPersonaForm.address" 
                type="text" 
                placeholder="e.g. Liivalaia 45, 10145 Tallinn" 
                class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <!-- Email & Phone -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input 
                  v-model="newPersonaForm.email" 
                  type="email" 
                  :placeholder="newPersonaForm.firstName ? `${newPersonaForm.firstName.toLowerCase()}.${newPersonaForm.lastName.toLowerCase() || 'doe'}@mail.ee` : 'name@mail.ee'" 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input 
                  v-model="newPersonaForm.phone" 
                  type="tel" 
                  placeholder="+372 5..." 
                  class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>
            </div>

            <!-- Timezone & Locale presets -->
            <div class="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Timezone</label>
                <input 
                  v-model="newPersonaForm.timezone" 
                  type="text" 
                  readonly
                  class="w-full px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 font-mono text-[10px]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Browser Locale</label>
                <input 
                  v-model="newPersonaForm.locale" 
                  type="text" 
                  readonly
                  class="w-full px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400 font-mono text-[10px]"
                />
              </div>
            </div>
          </div>

          <!-- Column 3: Warming Affinities & Initial 2FA Social Account -->
          <div class="space-y-4 bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80">
            <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span class="font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                3. Warming Affinities & 2FA
              </span>
              <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                Warming Engine
              </span>
            </div>

            <!-- Behavioral Interests -->
            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Primary Interest</label>
                  <select 
                    v-model="newPersonaForm.primaryInterest"
                    class="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option v-for="cat in INTEREST_CATEGORIES" :key="cat.code" :value="cat.code">
                      {{ cat.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Secondary Interest</label>
                  <select 
                    v-model="newPersonaForm.secondaryInterest"
                    class="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option v-for="cat in INTEREST_CATEGORIES" :key="cat.code" :value="cat.code">
                      {{ cat.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Initial Social Account Card with 2FA -->
            <div class="p-3 bg-white dark:bg-gray-900/90 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="newPersonaForm.attachSocial"
                    class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span class="font-bold text-gray-900 dark:text-white text-xs">Attach Initial Social Asset</span>
                </label>
                <span class="text-[10px] text-gray-400">e.g. Facebook</span>
              </div>

              <template v-if="newPersonaForm.attachSocial">
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label class="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Platform</label>
                    <select 
                      v-model="newPersonaForm.socialPlatform"
                      class="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none capitalize text-xs"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="google">Google</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="reddit">Reddit</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Username / ID</label>
                    <input 
                      v-model="newPersonaForm.socialUsername" 
                      type="text" 
                      placeholder="e.g. rasmus.magi.ee" 
                      class="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <!-- 2FA Checkbox & Secret -->
                <div class="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        v-model="newPersonaForm.has2fa"
                        class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span class="font-bold text-blue-900 dark:text-blue-300 text-[11px] flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clip-rule="evenodd" />
                        </svg>
                        Enable 2FA (RFC 6238 TOTP)
                      </span>
                    </label>

                    <button 
                      v-if="newPersonaForm.has2fa"
                      type="button" 
                      @click="generateRandom2faSecret" 
                      class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      🎲 Generate Key
                    </button>
                  </div>

                  <div v-if="newPersonaForm.has2fa">
                    <input 
                      v-model="newPersonaForm.twoFactorSecret" 
                      type="text" 
                      placeholder="Base32 Secret (e.g. JBSWY3DPEHPK3PXP...)" 
                      class="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded-md text-gray-900 dark:text-white font-mono text-[10px] uppercase focus:outline-none"
                    />
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">
                      Live 6-digit codes will automatically be minted in overview & details.
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer Actions Bar -->
        <div class="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            @click="resetCreateForm"
            type="button"
            class="px-3.5 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors self-start sm:self-auto"
          >
            Reset Form
          </button>

          <div class="flex items-center gap-2.5 justify-end">
            <button
              @click="closeCreatePanel"
              type="button"
              class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              :disabled="actionLoading"
              class="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="actionLoading" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Save Persona & Assets</span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <!-- Gender Filter Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
        <button 
          v-for="genderOpt in [
            { label: 'All Personas', value: 'ALL' },
            { label: '👨 Males', value: 'MALE' },
            { label: '👩 Females', value: 'FEMALE' },
          ]"
          :key="genderOpt.value"
          @click="selectedGender = genderOpt.value as any"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0"
          :class="selectedGender === genderOpt.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
        >
          {{ genderOpt.label }}
        </button>
      </div>

      <!-- Search Box -->
      <div class="relative w-full md:w-72">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search by name, email, city, phone..."
          class="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800/80 border border-transparent focus:border-blue-500 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none"
        />
      </div>
    </div>

    <!-- High-Density Data Table -->
    <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm overflow-hidden">
      <div v-if="loading" class="text-center py-16 text-gray-400 text-sm">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <div>Loading digital identities...</div>
      </div>

      <div v-else-if="filteredPersonas.length === 0" class="text-center py-16 text-gray-400 text-sm space-y-2">
        <div>No personas found matching your search.</div>
        <button @click="searchQuery = ''; selectedGender = 'ALL'" class="text-xs text-blue-600 font-bold hover:underline">
          Reset filters
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800/60 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th class="py-3 px-3">ID</th>
              <th class="py-3 px-3">Persona</th>
              <th class="py-3 px-3">Email</th>
              <th class="py-3 px-3">Phone</th>
              <th class="py-3 px-3">Social Assets</th>
              <th class="py-3 px-3">Hardware Logins (M:N)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800/40">
            <tr 
              v-for="persona in filteredPersonas" 
              :key="persona.id"
              class="hover:bg-gray-50/60 dark:hover:bg-gray-900/60 transition-colors group cursor-pointer"
              @click="openDrawer(persona)"
            >
              <!-- Full ID (No 'ID: ' prefix) -->
              <td class="py-3 px-3 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100 select-all whitespace-nowrap">
                <span class="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 text-[11px] font-mono">
                  {{ persona.id }}
                </span>
              </td>

              <!-- Persona (Flag, Name, Gender & 2FA Status) -->
              <td class="py-3 px-3">
                <div class="flex items-center gap-2 whitespace-nowrap">
                  <div class="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>{{ persona.countryCode === 'EE' ? '🇪🇪' : '🌐' }}</span>
                    <span>{{ persona.firstName }} {{ persona.lastName }}</span>
                    <span 
                      class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase"
                      :class="persona.gender === 'MALE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'"
                    >
                      {{ persona.gender === 'MALE' ? 'M' : 'F' }}
                    </span>
                  </div>

                  <!-- 2FA Indicator Badge -->
                  <div 
                    v-if="getPersona2FAInfo(persona).has2fa" 
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                    :title="getPersona2FAInfo(persona).tooltip"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <svg class="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>2FA</span>
                  </div>
                  <div 
                    v-else 
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100/70 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-800/60"
                    title="No 2FA configured for this persona"
                  >
                    <svg class="w-3 h-3 text-amber-500/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>No 2FA</span>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="py-3 px-3 font-mono text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">
                {{ persona.email }}
              </td>

              <!-- Phone -->
              <td class="py-3 px-3 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {{ persona.phone }}
              </td>

              <!-- Social Assets (Brand Icons) -->
              <td class="py-3 px-3" @click.stop>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <!-- Facebook Icon (if exists) -->
                  <div 
                    v-if="getSocialAccount(persona, 'facebook')" 
                    @click="openSessionModal(persona, getSocialAccount(persona, 'facebook')!)"
                    class="w-7 h-7 rounded-lg bg-[#1877F2]/10 dark:bg-[#1877F2]/20 border border-[#1877F2]/30 flex items-center justify-center text-[#1877F2] hover:scale-110 transition-transform cursor-pointer relative"
                    :title="`Facebook: ${getSocialAccount(persona, 'facebook')?.username} (${getSocialAccount(persona, 'facebook')?.adAccounts?.length || 0} Ad Accounts, ${getSocialAccount(persona, 'facebook')?.status})`"
                  >
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span 
                      v-if="getSocialAccount(persona, 'facebook')?.adAccounts?.length" 
                      class="absolute -top-1 -right-1 px-1 min-w-3.5 h-3.5 bg-blue-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow-xs"
                    >
                      {{ getSocialAccount(persona, 'facebook')?.adAccounts?.length }}
                    </span>
                  </div>

                  <!-- Google / Gmail Icon (if exists) -->
                  <div 
                    v-if="getSocialAccount(persona, 'google') || persona.email.includes('gmail')" 
                    @click="getSocialAccount(persona, 'google') && openSessionModal(persona, getSocialAccount(persona, 'google')!)"
                    class="w-7 h-7 rounded-lg bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 hover:scale-110 transition-transform cursor-pointer relative"
                    :title="`Google/Gmail: ${getSocialAccount(persona, 'google')?.email || persona.email} (${getSocialAccount(persona, 'google')?.adAccounts?.length || 0} Ad Accounts)`"
                  >
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                    <span 
                      v-if="getSocialAccount(persona, 'google')?.adAccounts?.length" 
                      class="absolute -top-1 -right-1 px-1 min-w-3.5 h-3.5 bg-red-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow-xs"
                    >
                      {{ getSocialAccount(persona, 'google')?.adAccounts?.length }}
                    </span>
                  </div>

                  <!-- YouTube Icon (if exists) -->
                  <div 
                    v-if="hasYouTube(persona)" 
                    class="w-7 h-7 rounded-lg bg-red-600/10 dark:bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-600 hover:scale-110 transition-transform cursor-pointer relative"
                    :title="`YouTube: ${getSocialAccount(persona, 'google')?.youtubeChannels?.[0]?.name} (${getSocialAccount(persona, 'google')?.youtubeChannels?.[0]?.subscribersCount} subs)`"
                  >
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </div>

                  <!-- TikTok Icon (if exists) -->
                  <div 
                    v-if="getSocialAccount(persona, 'tiktok')"
                    @click="openSessionModal(persona, getSocialAccount(persona, 'tiktok')!)"
                    class="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:scale-110 transition-transform cursor-pointer relative"
                    :title="`TikTok: ${getSocialAccount(persona, 'tiktok')?.username}`"
                  >
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.74 1.34-.06 2.5-1.05 2.76-2.37.1-.48.14-.98.13-1.47V.02h-.01z"/></svg>
                  </div>

                  <!-- Fallback when no social accounts exist -->
                  <span 
                    v-if="!getSocialAccount(persona, 'facebook') && !getSocialAccount(persona, 'google') && !persona.email.includes('gmail') && !hasYouTube(persona) && !getSocialAccount(persona, 'tiktok')"
                    class="text-xs text-gray-400 italic"
                  >
                    —
                  </span>
                </div>
              </td>

              <!-- Hardware Logins (M:N) -->
              <td class="py-3 px-3" @click.stop>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <template v-if="getPersonaProfileIds(persona).length > 0">
                    <router-link
                      v-for="profId in getPersonaProfileIds(persona)" 
                      :key="profId"
                      :to="`/affiliate/browser-profiles/${profId}`"
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1.5 transition-colors shadow-xs"
                      :title="`Open browser profile: ${getProfileName(profId)}`"
                    >
                      <img v-if="getProfile(profId)?.browserType === 'camoufox'" src="/camoufox.png" class="w-3.5 h-3.5 object-contain inline shrink-0" alt="Camoufox" />
                      <span v-else class="text-xs">🖥️</span>
                      <span class="font-mono">{{ getProfileName(profId) }}</span>
                    </router-link>
                  </template>
                  <span v-else class="text-[11px] text-gray-400 italic">No device login</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Quick Overview Slide-over Drawer -->
    <div 
      v-if="showDrawer && selectedPersona" 
      class="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn"
      @click.self="showDrawer = false"
    >
      <div class="w-full max-w-xl bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800 h-full flex flex-col shadow-2xl overflow-hidden">
        <!-- Drawer Header -->
        <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img 
              :src="selectedPersona.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'" 
              class="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm shrink-0"
            />
            <div>
              <h3 class="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                {{ selectedPersona.firstName }} {{ selectedPersona.lastName }}
                <span class="text-xs font-bold text-gray-400">({{ selectedPersona.age }} y.o.)</span>
              </h3>
              <div class="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                <span class="font-mono text-[11px] font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded select-all">{{ selectedPersona.id }}</span>
                <span>•</span>
                <span>🇪🇪 {{ selectedPersona.city }}, Estonia</span>
                <span>•</span>
                <span class="font-mono text-[11px]">{{ selectedPersona.timezone }}</span>
              </div>
            </div>
          </div>

          <button @click="showDrawer = false" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Drawer Content -->
        <div class="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          <!-- Contacts Box -->
          <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 space-y-2">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contact & Address</span>
            <div class="flex items-center justify-between">
              <span class="font-mono text-gray-800 dark:text-gray-200">{{ selectedPersona.email }}</span>
              <button @click="copyToClipboard(selectedPersona.email, 'Email')" class="text-blue-600 dark:text-blue-400 font-bold">Copy</button>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-mono text-gray-800 dark:text-gray-200">{{ selectedPersona.phone }}</span>
              <button @click="copyToClipboard(selectedPersona.phone, 'Phone')" class="text-blue-600 dark:text-blue-400 font-bold">Copy</button>
            </div>
            <div class="text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
              {{ selectedPersona.address }}
            </div>
          </div>

          <!-- Security & 2FA Authenticator Section (Collapsible & Flatter) -->
          <div class="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 overflow-hidden transition-all">
            <!-- Header / Toggle Bar -->
            <button
              @click="is2faCollapsed = !is2faCollapsed"
              type="button"
              class="w-full p-3 flex items-center justify-between text-left hover:bg-gray-100/60 dark:hover:bg-gray-800/40 transition-colors select-none"
            >
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span class="text-xs font-bold text-gray-900 dark:text-white">2FA Authenticator</span>
                <span 
                  v-if="getPersona2FAInfo(selectedPersona).has2fa"
                  class="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {{ getPersona2FAInfo(selectedPersona).accountsWith2fa.length }} Protected
                </span>
                <span 
                  v-else
                  class="px-2 py-0.2 rounded-full text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800"
                >
                  0 Active
                </span>
              </div>

              <div class="flex items-center gap-1.5 text-gray-400 text-xs">
                <span class="text-[11px] font-medium">{{ is2faCollapsed ? 'Show' : 'Hide' }}</span>
                <svg 
                  class="w-4 h-4 transition-transform duration-200"
                  :class="{ 'rotate-180': !is2faCollapsed }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <!-- Expanded Content (Flatter, Compact Rows) -->
            <div v-show="!is2faCollapsed" class="p-3 pt-0 border-t border-gray-100 dark:border-gray-800/80 space-y-2 mt-2">
              <template v-if="getPersona2FAInfo(selectedPersona).has2fa">
                <div 
                  v-for="social in getPersona2FAInfo(selectedPersona).accountsWith2fa" 
                  :key="social.id"
                  class="p-2.5 rounded-lg border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-950/80 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <!-- Left: Platform Badge, Name, Username & Key -->
                  <div class="flex items-center gap-2 min-w-0">
                    <span 
                      class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white shrink-0"
                      :class="social.platform === 'facebook' ? 'bg-blue-600' : 'bg-red-600'"
                    >
                      {{ social.platform === 'facebook' ? 'FB' : 'G' }}
                    </span>
                    <div class="truncate">
                      <div class="flex items-center gap-1.5 leading-tight truncate">
                        <span class="font-bold text-gray-900 dark:text-white truncate text-xs">{{ social.displayName }}</span>
                        <span class="text-[10px] text-gray-400 font-mono">({{ social.username }})</span>
                      </div>
                      <div v-if="social.twoFactorSecret" class="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 font-mono">
                        <span>Key: ••••{{ social.twoFactorSecret.slice(-4) }}</span>
                        <button 
                          @click.stop="copyToClipboard(social.twoFactorSecret, '2FA Secret Key')"
                          type="button"
                          class="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-sans cursor-pointer hover:underline"
                        >
                          Copy Key
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Live Code, Timer & Copy OTP Button -->
                  <div class="flex items-center gap-2.5 shrink-0">
                    <div class="text-right">
                      <div class="font-mono font-black text-sm tracking-wider text-gray-900 dark:text-white leading-none">
                        {{ formatTotpCode(liveTotpMap[social.id]?.code || '------') }}
                      </div>
                      <div class="flex items-center justify-end gap-1 text-[9px] font-mono text-gray-400 mt-1">
                        <span>{{ liveTotpMap[social.id]?.secondsRemaining ?? 30 }}s</span>
                        <div class="w-8 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            class="h-full bg-emerald-500 transition-all duration-300"
                            :style="{ width: `${liveTotpMap[social.id]?.progressPercent ?? 100}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button 
                      @click.stop="copyTotpCode(social.id, liveTotpMap[social.id]?.code || '')"
                      type="button"
                      class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                      :class="copiedTotpId === social.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'"
                    >
                      <span v-if="copiedTotpId === social.id">✓ Copied</span>
                      <span v-else>Copy</span>
                    </button>
                  </div>
                </div>
              </template>

              <!-- Inactive Alert when expanded -->
              <div v-else class="py-2 text-center text-xs text-gray-400">
                No 2FA protection configured for this persona.
              </div>
            </div>
          </div>

          <!-- Behavioral Affinity (Cookie Farm) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between font-bold">
              <span class="text-[10px] text-gray-400 uppercase tracking-wider">Behavioral Affinity Vector</span>
              <span class="text-blue-600 text-[11px]">100% Normalized</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="interest in selectedPersona.interests" :key="interest.categoryCode" class="space-y-0.5">
                <div class="flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  <span>{{ interest.categoryName }}</span>
                  <span class="font-mono">{{ interest.weight }}%</span>
                </div>
                <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-300"
                    :class="getInterestColor(interest.categoryCode)"
                    :style="{ width: `${interest.weight}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Social Assets with Quick Session M:N Toggle -->
          <div class="space-y-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Social Assets & Active Logins (M:N)
            </span>

            <div v-for="social in selectedPersona.socialAccounts" :key="social.id" class="p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span 
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                    :class="social.platform === 'facebook' ? 'bg-blue-600' : 'bg-red-600'"
                  >
                    {{ social.platform === 'facebook' ? 'FB' : 'Google' }}
                  </span>
                  <span class="font-bold text-gray-900 dark:text-white">{{ social.displayName }}</span>
                  <span class="text-gray-400 text-[11px]">({{ social.username }})</span>
                </div>
                <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {{ social.status }}
                </span>
              </div>

              <!-- Logged-in Hardware -->
              <div class="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="text-[10px] font-bold text-gray-400 uppercase">Logged In:</span>
                  <template v-if="social.loggedInProfileIds && social.loggedInProfileIds.length > 0">
                    <router-link 
                      v-for="profId in social.loggedInProfileIds" 
                      :key="profId"
                      :to="`/affiliate/browser-profiles/${profId}`"
                      class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 inline-flex items-center gap-1 border border-blue-200 dark:border-blue-900 transition-colors"
                      :title="`Open browser profile: ${getProfileName(profId)}`"
                    >
                      <img v-if="getProfile(profId)?.browserType === 'camoufox'" src="/camoufox.png" class="w-3 h-3 object-contain inline shrink-0" alt="Camoufox" />
                      <span v-else class="text-xs">🖥️</span>
                      <span>{{ getProfileName(profId) }}</span>
                    </router-link>
                  </template>
                  <span v-else class="text-[10px] text-gray-400 italic">No session</span>
                </div>

                <button 
                  @click="openSessionModal(selectedPersona, social)"
                  class="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Toggle Logins
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
          <div class="flex items-center gap-2">
            <router-link 
              :to="`/affiliate/personas/${selectedPersona.id}`"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
            >
              <span>Full Details Page</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </router-link>

            <button 
              @click="deletePersona(selectedPersona.id, `${selectedPersona.firstName} ${selectedPersona.lastName}`)"
              type="button"
              class="px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Delete persona"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Delete</span>
            </button>
          </div>

          <button 
            @click="showDrawer = false" 
            class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- M:N Session Manager Modal -->
    <div 
      v-if="showSessionModal && activePersonaForSession && activeSocial" 
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      @click.self="closeSessionModal"
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
          Select which browser profile hardware instances currently have active login sessions for this social account:
        </p>

        <!-- Profiles List -->
        <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
          <div 
            v-for="prof in profiles" 
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

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
