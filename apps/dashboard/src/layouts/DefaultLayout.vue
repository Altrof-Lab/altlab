<script setup lang="ts">
import { ref } from 'vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import AppHeader from '../components/layout/AppHeader.vue';
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue';

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <div class="min-h-screen bg-[#f4f7fc] dark:bg-gray-950 flex font-sans antialiased text-gray-900 dark:text-gray-100">
    <!-- Left Navigation Bar -->
    <AppSidebar 
      :is-collapsed="isCollapsed" 
      @toggle-collapse="toggleSidebar" 
    />

    <!-- Main Outer Wrapper -->
    <div class="flex-1 flex flex-col min-w-0 pr-4 py-3">
      <!-- Floating Inner Content Window -->
      <div class="flex-1 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <!-- Inner Header -->
        <AppHeader 
          :is-collapsed="isCollapsed" 
          @toggle-sidebar="toggleSidebar" 
        />

        <!-- Breadcrumb Navigation -->
        <AppBreadcrumb />

        <!-- Main View Content Container -->
        <main class="flex-1 overflow-y-auto px-6 pb-6">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
