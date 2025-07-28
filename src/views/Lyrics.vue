<template>
    <div class="main">
        <el-input type="textarea" v-model="lyrics" resize="none" autosize clearable
            :readonly="!isLogin()"
            :class="!isLogin() ? 'view' : ''" />
        <el-button v-if="isLogin()" type="primary" @click="save">保存</el-button>
        <router-link :to="{ name: 'Index' }" >
            <el-button class="global-float-button" type="warning">返回</el-button>
        </router-link>
    </div>
</template>
  
<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { ApiSongEdit, ApiSongDetail, isLogin } from '@/tools/api'

  const route = useRoute()
  const {id} = route.params
  const lyrics = ref('')

  onMounted(async() => {
    const song = await ApiSongDetail(id, 'lyrics').catch(alert)
    lyrics.value = song.lyrics
  })

  async function save() {
    await ApiSongEdit(id, {lyrics: lyrics.value}).catch(alert)
    successInfo()
  }

  interface ApiBackInfo {
    ok: number,
    msg: string,
    data?: any
  }

  async function alert(err: ApiBackInfo) {
    ElMessage({
      message: err.msg,
      type: 'error'
    })
    return Promise.reject(err)
  }

  function successInfo(message: string="更新成功！") {
    ElMessage({
      message,
      type: 'success'
    })
  }
</script>

<style scoped>
.main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap:10px;

    .view {
        &:deep(.el-textarea__inner) {
            background-color: rgba(0, 0, 0, 0);
            box-shadow: none;
        }
    }
}

</style>