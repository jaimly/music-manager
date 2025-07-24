<template>
    <el-button type="warning" class="float-button" @click="showBtnClick">
      {{ btnName }}
    </el-button>

    <el-drawer
      v-model="isVisible"
      title="请先登录!"
      direction="btt"
    >
      <template #default>
          <el-input type="password" placeholder="请输入密码" v-model="password" show-password/>
          <el-text type="danger" v-show="isInfo">密码错误</el-text>
      </template>
      <template #footer>
        <div style="flex: auto">
          <el-button type="primary" @click="confirmClick">登录</el-button>
        </div>
      </template>
    </el-drawer>
</template>
  
<script lang="ts" setup>
import { isLogin, ApiLogin, ApiLogout } from '@/tools/api'
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  const isVisible = ref(false)
  const isInfo = ref(false)
  const password = ref('')
  const btnName = ref(isLogin() ? '退出' : '管理')

  function showBtnClick() {
    if(!isLogin()) isVisible.value = true
    else ApiLogout()
  }

  async function confirmClick() {
    await ApiLogin(password.value)
      .then(() => {
        isVisible.value = false
        isInfo.value = false
        btnName.value = '退出'
      })
      .catch((err:ApiBackInfo) => isInfo.value = true)
  }

  interface ApiBackInfo {
    ok: number,
    msg: string,
    data?: any
  }

  function alert(err: ApiBackInfo) {
    ElMessage({
      message: err.msg,
      type: 'warning'
    })
  }
</script>

<style scoped>
.float-button {
    position: absolute;
    width: 60px;
    /* left: 0; */
    right:0;
    /* margin: 0 auto; */
    top: 10px;
}
</style>