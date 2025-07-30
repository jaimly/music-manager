<template>
    <el-dialog
        v-model="isVisible"
        title="提醒"
        align-center
        center
    >
        <span>{{content}}</span>
        <template #footer>
        <span class="dialog-footer">
            <el-button @click="isVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmHandler()">
            确认
            </el-button>
        </span>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
  const isVisible = defineModel("isVisible", {
    type: Boolean
  })
  const content = defineModel("content", {
    type: String,
    default: "请确认"
  })
  const confirm = defineModel("confirm", {
    type: Function
  })

  const confirmHandler = () => {
    isVisible.value = false
    confirm.value && confirm.value()
  }
  
</script>
<style scoped>
  .dialog-footer button:first-child {
    margin-right: 10px;
  }
</style>