<template>
    <Upload v-if="isLogin()" class="upload"
      btnName="更换" btnClass="global-float-button"
      :id="id" :name="name" :path="src"
      :onSuccess="onSuccess"/>
    <router-link :to="{ name: 'Index' }" >
      <el-button class="global-float-button" type="warning">返回</el-button>
    </router-link>

    <el-image v-for="path in srcList" :src="path" :z-index="999" :preview-src-list="srcList"/>
    <Upload v-if="isLogin()" class="addBtn"
      btnName="添加"
      :id="id" :name="name" :extend="srcList.length"
      :onSuccess="onAddSuccess"/>
</template>
  
<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { isLogin } from '@/tools/api'
  import Upload from '@/views/comp/UploadScore.vue'
  import { ApiSongEdit, ApiFileList } from '@/tools/api'

  interface Song {
    id: string,
    name: string,
    score: string,
    is_extend: number
  }

  const id = ref("");
  const src = ref("");
  const name = ref("");
  const is_extend = ref(0);
  const srcList= ref<string[]>([])
  let song:Song
  
  onMounted(async () => {
    song = history.state.song
    id.value = song.id
    name.value = song.name
    is_extend.value = song.is_extend
    src.value = toSrc(song.score)
    srcList.value.push(src.value);
    
    if(is_extend.value) {
      const extendList = await ApiFileList({path: src.value, is_extend: 2, sort:{extend: 1}}).catch(alert)
      extendList?.rows.forEach(({path}) => {
        srcList.value.push(toSrc(path))
      });
    }
  })

  const onSuccess = async (path: string) => {
    if(srcList.value.length > 1) await ApiSongEdit(id.value, {is_extend: 0}).catch(alert);
    src.value = toSrc(path)
    srcList.value = [src.value]
  }

  const onAddSuccess = async (path: string) => {
    srcList.value.push(toSrc(path))
  }

  const toSrc = (path: string) => {
    return `${path}?t=${Date.now()}`
  }

  interface ApiBackInfo {
    ok?: number,
    msg: string,
    data?: any
  }
  function alert(err: ApiBackInfo) {
    ElMessage({
      message: err.msg,
      type: 'error'
    })
    return Promise.reject(err)
  }
</script>
  
<style lang="less" scoped>
.el-image {
  width: 100%;
}
.addBtn {
  margin-left: calc(~"50vw - 35px");
}
.upload {
  height: 0px;
  &:deep(.global-float-button) {
    top: 50px;
  }
}
</style>