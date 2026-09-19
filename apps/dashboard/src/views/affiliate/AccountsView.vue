<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { AffiliateAccountDto, CreateAffiliateAccountDto, AffiliatePlatform } from '@altlab/shared';

const accounts = ref<AffiliateAccountDto[]>([]);
const loading = ref(true);
const selectedPlatform = ref<string>('All');
const searchQuery = ref<string>('');

// Modal state
const showModal = ref(false);
const newAccount = ref<CreateAffiliateAccountDto>({
  platform: 'Facebook Ads',
  accountName: '',
  accountId: '',
  proxyIp: '',
  currency: 'USD',
});

const loadAccounts = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/affiliate/accounts');
    if (res.ok) {
      accounts.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to load affiliate accounts:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadAccounts);

const filteredAccounts = computed(() => {
  return accounts.value.filter((acc) => {
    const matchesPlatform = selectedPlatform.value === 'All' || acc.platform === selectedPlatform.value;
    const matchesSearch = searchQuery.value === '' || 
      acc.accountName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      acc.accountId.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesPlatform && matchesSearch;
  });
});

const totalBalance = computed(() => {
  return accounts.value.reduce((sum, acc) => sum + acc.balance, 0);
});

const totalDailySpend = computed(() => {
  return accounts.value.reduce((sum, acc) => sum + acc.dailySpend, 0);
});

const activeCount = computed(() => {
  return accounts.value.filter(a => a.status === 'active').length;
});

const handleCreate = async () => {
  if (!newAccount.value.accountName || !newAccount.value.accountId) return;
  try {
    const res = await fetch('/api/affiliate/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount.value),
    });
    if (res.ok) {
      showModal.value = false;
      newAccount.value = {
        platform: 'Facebook Ads',
        accountName: '',
        accountId: '',
        proxyIp: '',
        currency: 'USD',
      };
      await loadAccounts();
    }
  } catch (err) {
    console.error('Failed to create account:', err);
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'in_review':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'paused':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'banned':
      return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Title & Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Affiliate Marketing Accounts</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage ad accounts, proxy IPs, balances, and daily spends</p>
      </div>

      <button 
        @click="showModal = true"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all shrink-0"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        + Add Account
      </button>
    </div>

    <!-- 4 Summary Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Ad Balance</span>
        <div class="text-2xl font-extrabold text-gray-900 dark:text-white">${{ totalBalance.toLocaleString() }}</div>
        <p class="text-[11px] text-emerald-600 font-medium">Available across networks</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Spend</span>
        <div class="text-2xl font-extrabold text-gray-900 dark:text-white">${{ totalDailySpend.toLocaleString() }}</div>
        <p class="text-[11px] text-blue-600 font-medium">Real-time daily budget</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Accounts</span>
        <div class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ activeCount }} / {{ accounts.length }}</div>
        <p class="text-[11px] text-emerald-600 font-medium">Ready for traffic</p>
      </div>

      <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm space-y-1">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">In Review / Audit</span>
        <div class="text-2xl font-extrabold text-amber-500">1</div>
        <p class="text-[11px] text-amber-600 font-medium">Pending network approval</p>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Platform Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
        <button 
          v-for="platform in ['All', 'Facebook Ads', 'Google Ads', 'TikTok Ads', 'Taboola']"
          :key="platform"
          @click="selectedPlatform = platform"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0"
          :class="selectedPlatform === platform ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'"
        >
          {{ platform }}
        </button>
      </div>

      <!-- Search Box -->
      <div class="relative w-full md:w-64">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Filter by account name or ID..."
          class="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none"
        />
      </div>
    </div>

    <!-- Accounts Data Table -->
    <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm">
      <div v-if="loading" class="text-center py-12 text-sm text-gray-400">
        Loading affiliate accounts...
      </div>

      <div v-else-if="filteredAccounts.length === 0" class="text-center py-12 text-sm text-gray-400">
        No accounts found matching your filters.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800/60 text-xs text-gray-400 font-semibold uppercase tracking-wider">
              <th class="py-3 px-4">Platform</th>
              <th class="py-3 px-4">Account Name</th>
              <th class="py-3 px-4">Account ID</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Balance</th>
              <th class="py-3 px-4">Daily Spend</th>
              <th class="py-3 px-4">Proxy IP</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800/40">
            <tr v-for="acc in filteredAccounts" :key="acc.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
              <td class="py-3.5 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="acc.platform.includes('Facebook') ? 'bg-blue-600' : acc.platform.includes('Google') ? 'bg-red-500' : 'bg-emerald-500'"></span>
                {{ acc.platform }}
              </td>
              <td class="py-3.5 px-4 font-medium text-gray-900 dark:text-gray-100">
                {{ acc.accountName }}
              </td>
              <td class="py-3.5 px-4 font-mono text-xs text-gray-500">
                {{ acc.accountId }}
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" :class="getStatusBadge(acc.status)">
                  {{ acc.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                ${{ acc.balance.toLocaleString() }}
              </td>
              <td class="py-3.5 px-4 font-medium text-blue-600 dark:text-blue-400">
                ${{ acc.dailySpend.toLocaleString() }}/day
              </td>
              <td class="py-3.5 px-4 font-mono text-xs text-gray-400">
                {{ acc.proxyIp || 'Direct' }}
              </td>
              <td class="py-3.5 px-4 text-right">
                <button class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Account Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">Add Affiliate Account</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form @submit.prevent="handleCreate" class="space-y-4 text-xs">
          <div class="space-y-1">
            <label class="font-semibold text-gray-700 dark:text-gray-300">Network Platform</label>
            <select v-model="newAccount.platform" class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="Google Ads">Google Ads</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Taboola">Taboola</option>
              <option value="Custom Network">Custom Network</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-gray-700 dark:text-gray-300">Account Name</label>
            <input v-model="newAccount.accountName" type="text" placeholder="e.g. FB_Agency_US_02" required class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-gray-700 dark:text-gray-300">Account ID</label>
            <input v-model="newAccount.accountId" type="text" placeholder="e.g. act_19482910" required class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-gray-700 dark:text-gray-300">Proxy IP (Optional)</label>
            <input v-model="newAccount.proxyIp" type="text" placeholder="e.g. 185.220.101.45:8080" class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-sm">Save Account</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
