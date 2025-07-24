<template>
  <el-image style="width: 100px;" :src="src" />
</template>
  
<script lang="ts" setup>
  import { ref } from 'vue';
  import { useRoute } from 'vue-router';
  const route = useRoute();
  const src = ref(route.params.id);
  console.log(src.value)
</script>
  
<style scoped>
</style>