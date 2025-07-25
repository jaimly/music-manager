import {createRouter, createWebHashHistory} from 'vue-router'

const routes = [
  // {path: '/', redirect: '/file'},
  {
    path: '/', 
    name: 'Index',
    component: () =>import('@/views/Main.vue')
  },
  {
    path: '/score', 
    name: 'Score',
    component: () =>import('@/views/Score.vue'),
    props: true
  },
  {
    path: '/lyrics/:id',
    name: 'Lyrics',
    component: () =>import('@/views/Lyrics.vue'),
    props: true
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;