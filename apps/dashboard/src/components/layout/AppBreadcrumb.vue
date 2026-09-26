<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

interface BreadcrumbItem {
  name: string;
  path: string | null;
  isUuid?: boolean;
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  if (route.name === 'browser-profile-detail') {
    return [
      { name: 'Browser-Profiles', path: '/affiliate/browser-profiles' },
      { name: (route.params.id as string) || 'Detail', path: null, isUuid: true },
    ];
  } else if (route.name === 'browser-profiles') {
    return [
      { name: 'Browser-Profiles', path: '/affiliate/browser-profiles' },
    ];
  } else if (route.name === 'affiliate-accounts') {
    return [
      { name: 'Accounts', path: '/affiliate/accounts' },
    ];
  }
  return [
    { name: (route.name as string) || 'Overview', path: null },
  ];
});
</script>

<template>
  <nav class="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium px-6 py-3">
    <router-link to="/" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
      Homelab
    </router-link>
    <template v-for="(item, index) in breadcrumbs" :key="index">
      <span>/</span>
      <router-link 
        v-if="item.path" 
        :to="item.path" 
        class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-semibold"
      >
        {{ item.name }}
      </router-link>
      <span v-else class="text-gray-700 dark:text-gray-200" :class="item.isUuid ? 'font-mono text-[11px]' : 'capitalize'">
        {{ item.name }}
      </span>
    </template>
  </nav>
</template>
