<template>
    <el-upload
      :action="ApiFileUploadUrl()"
      accept = 'image/png, image/jpeg, image/jpg'
      :limit="1"
      :show-file-list = "false"
      :auto-upload = "true"
      :headers="{'password': password}"
      :data="{name, category:'score'}"
      :on-success = "onSuccessBefore"
      :on-error = "onFail"
      :before-upload = "() => {
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
  import { ApiFileUploadUrl, ApiSongEdit } from '@/tools/api'

  const password = ref(window.localStorage.getItem('password'))
  const btnDisabled = ref(false)

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
  const id = defineModel("id", {
    type: String,
    required: true
  })
  const name = defineModel("name", {
    type: String,
    required: true
  })
  const onSuccess = defineModel("onSuccess", {
    type: Function
  })
  const onSuccessBefore = async (response: any, uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    btnDisabled.value = false;
    console.log(response);
    await ApiSongEdit(id.value, {score: response.data?.path})
    .then(() => {
      onSuccess?.value(response.data?.score)
    }).catch(alert)
  }
  const onFail = (error: Error) => {
    ElMessage({
      message: `上传失败：${name}`,
      type: 'error'
    })
    console.trace(error);
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