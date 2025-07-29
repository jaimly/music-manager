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
        <el-space>
          <el-input type="password" placeholder="登录密码" v-model="password" show-password/>
          <el-input placeholder="新密码" v-model="newPassword" v-if="isNewPassword"/>
        </el-space>
      </template>
      <template #footer>
        <div style="flex: auto">
          <el-button type="info" @click="editPasswordBefore">{{ editPasswordBtnName }}</el-button>
          <el-button type="primary" @click="confirmClick">{{ loginBtnName }}</el-button>
        </div>
      </template>
    </el-drawer>
</template>
  
<script lang="ts" setup>
import { isLogin, ApiLogin, ApiLogout, ApiEditPassword } from '@/tools/api'
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  const isVisible = ref(false)
  const password = ref('')
  const newPassword = ref('')
  const isNewPassword = ref(false)
  const editPasswordBtnName = ref('修改密码')
  const loginBtnName = ref('登录')
  const btnName = ref(isLogin() ? '退出' : '管理')

  const status = defineModel("status", {
    type: Function,
  })

  const showBtnClick = () => {
    if(!isLogin()) isVisible.value = true
    else {
      ApiLogout()
      btnName.value = '管理'
      status.value && status.value(false);
    }
  }

  const confirmClick = async () => {
    if(isNewPassword.value) {
      await ApiEditPassword(password.value,newPassword.value).catch(alert)
      successInfo("修改成功")
      editPasswordBefore()
    } else {
      await ApiLogin(password.value).catch(alert)
      successInfo("登录成功")
      isVisible.value = false
      btnName.value = '退出'
      status.value && status.value(true)
    }
  }

  const editPasswordBefore = () => {
    isNewPassword.value = !isNewPassword.value;
    editPasswordBtnName.value = isNewPassword.value ? "返回" : "修改密码"
    loginBtnName.value = isNewPassword.value ? "修改" : "登录"
  }

  interface ApiBackInfo {
    ok: number,
    msg: string,
    data?: any
  }

  const successInfo = (message: string="更新成功！") => {
    ElMessage({
      message,
      type: 'success'
    })
  }
  const alert = async(err: ApiBackInfo) => {
    ElMessage({
      message: '密码错误',
      type: 'error'
    })
    return Promise.reject(err)
  }
</script>

<style scoped>
</style>