<template>
  <div>
    <Upload v-if="isLogin()" class="upload"
      btnName="更换" btnClass="global-float-button"
      :id="id" :name="name" :path="src"
      :onSuccess="onSuccess"/>
    <el-image :src="src" :z-index="999" :preview-src-list="srcList"/>
    <router-link :to="{ name: 'Index' }" >
      <el-button class="global-float-button" type="warning">返回</el-button>
    </router-link>
  </div>
</template>
  
<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { isLogin } from '@/tools/api'
  import Upload from '@/views/comp/UploadScore.vue'

  interface Song {
    id: string,
    name: string,
    score: string
  }

  const id = ref("");
  const src = ref("");
  const name = ref("");
  const srcList= ref<string[]>([])
  let song:Song
  
  onMounted(() => {
    song = history.state.song
    id.value = song.id
    name.value = song.name
    src.value = toSrc(song.score)
    srcList.value = [src.value]
  })

  const onSuccess = (path: string) => {
    src.value = toSrc(path)
    srcList.value = [src.value]
  }

  const toSrc = (path: string) => {
    return `${path}?t=${Date.now()}`
  }
</script>
  
<style scoped>
.el-image {
  width: 100%;
}
.upload {
  height: 0px;
  &:deep .global-float-button {
    top: 50px;
  }
}
</style>