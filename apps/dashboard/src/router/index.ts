import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/affiliate/accounts',
      name: 'affiliate-accounts',
      component: () => import('../views/affiliate/AccountsView.vue'),
    },
    {
      path: '/affiliate/browser-profiles',
      name: 'browser-profiles',
      component: () => import('../views/affiliate/BrowserProfilesView.vue'),
    },
  ],
});

export default router;
