import {createRouter, createWebHashHistory} from 'vue-router'

const routes = [
  // {path: '/', redirect: '/file'},
  {
    path: '/', 
    name: 'Index',
    component: () =>import('@/views/Main.vue')
  },
  {
    path: '/score/:id', 
    name: 'Score',
    component: () =>import('@/views/Score.vue')
  },
  {
    path: '/lyrics/:id',
    name: 'Lyrics',
    component: () =>import('@/views/Lyrics.vue')
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;