<template>
    <el-upload
      :action="path?ApiFileUpdateUrl():ApiFileUploadUrl()"
      accept = '.jpg,.jpeg,.png'
      :limit="1"
      :show-file-list = "false"
      :auto-upload = "true"
      :headers="{'password': password}"
      :data="{id, name, category:'score', path}"
      :on-success = "onSuccessBefore"
      :on-error = "onError"
      :before-upload = "() => {
        ElMessage({
          message: '开始上传，请等候...',
          type: 'info'
        })
        btnDisabled = true;
        return true;
      }"
    >
        <el-button :type="btnType" :class="btnClass" :link="isBtnLink" :disabled="btnDisabled">{{btnName}}</el-button>
    </el-upload>
</template>
<script lang="ts" setup>
  import { ref, defineModel } from 'vue'
  import { ElMessage } from 'element-plus'
  import type {UploadFile, UploadFiles} from 'element-plus'
  import { ApiFileUploadUrl, ApiFileUpdateUrl, ApiSongEdit, ApiFileDelete } from '@/tools/api'

  const password = ref(window.localStorage.getItem('password'))
  const btnDisabled = ref(false)
  
  const id = defineModel("id", {
    type: String,
    required: true
  })
  const name = defineModel("name", {
    type: String,
    required: true
  })
  const path = defineModel("path", {
    type: String
  })
  const btnName = defineModel("btnName", {
    type: String,
    default: '更换'
  })
  const btnClass = defineModel("btnClass", {
    type: String
  })
  const btnType = defineModel("btnType", {
    type: String,
    default: "primary"
  })
  const isBtnLink = defineModel("isBtnLink", {
    type: Boolean,
    default: false
  })
  const onSuccess = defineModel("onSuccess", {
    type: Function
  })

  const onSuccessBefore = async (res: any, uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    uploadFiles.splice(0,1)
    btnDisabled.value = false;
    if(res.ok) return alert(res)
    console.log(res.data)
    const score = res.data?.path
    if(!path.value) {
      await ApiSongEdit(id.value, {score}).catch(async (err: ApiBackInfo) => {
        await ApiFileDelete(res.data?.id)
        return alert(err)
      })
      path.value = score
    }
    ElMessage({
      message: `更新成功！`,
      type: 'success'
    })
    onSuccess.value && onSuccess.value(score)
  }

  const onError = (error: Error, uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    uploadFiles.splice(0,1)
    btnDisabled.value = false;
    console.trace(error);
    alert({
      msg: `上传失败：${name}`
    })
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