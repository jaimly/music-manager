<template>
    <el-button type="warning" class="global-float-button" @click="showBtnClick">
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

  const status = defineModel("status", {
    type: Function,
  })

  function showBtnClick() {
    if(!isLogin()) isVisible.value = true
    else {
      ApiLogout()
      btnName.value = '管理'
      status.value && status.value(false);
    }
  }

  async function confirmClick() {
    await ApiLogin(password.value)
      .then(() => {
        isVisible.value = false
        isInfo.value = false
        btnName.value = '退出'
        status.value && status.value(true)
        ElMessage({
          message: "登录成功",
          type: 'success'
        })
      })
      .catch(() => isInfo.value = true)
  }

  interface ApiBackInfo {
    ok: number,
    msg: string,
    data?: any
  }
</script>

<style scoped>
</style>