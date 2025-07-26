<template>
  <ConfirmDialog v-model:isVisible="isShowDialog" v-model:content="dialogContent" v-model:confirm="remove" />
  <div class="main">
    <el-input v-model="filterText" placeholder="查找歌曲或目录" class="filter"/>
    <el-tree
      :data="treeData"
      :props="treeProps"
      :allow-drop="allowDrop"
      :allow-drag="allowDrag"
      :filter-node-method="filterNode"
      :expand-on-click-node="true"
      :default-expanded-keys="[treeData[0]?.id]"
      draggable
      accordion
      ref="treeRef"
      node-key="id"
      @node-drop="handleDrop">
        <template #default="{ node, data }">
          <el-space :size="10">
            <el-space :size="10">
              <el-space :size="0">
                <el-text v-if="titleEditId!=data.id" truncated>{{ node.label }}</el-text>
                <el-button :icon="EditPen" type="text"
                    v-if="titleEditId!=data.id" 
                    @click.stop="titleEditBefore(data)" />
                <el-input v-model="titleInput"
                    v-if="titleEditId==data.id" 
                    @input="titleInput" @click.stop
                    class="title">
                  <template #append>
                    <el-button :icon="Check" 
                      @click.stop="titleEdit(node,data)"/>
                  </template>
                </el-input>
              </el-space>
              <el-space style="display:flex; " :size="5">
                <Upload v-if="node.level!=1 && !data.score && isLogin()" class="upload"
                  btnName="谱" btnType="info" :isBtnLink="true" @click.stop
                  :name="data.name" :id="data.id"
                  :onSuccess="(score:string) => data.score = score"/>
                <router-link :to="{ name: 'Score', state: {song: {id: data.id, name: data.name, score: data.score}}}" 
                      v-if="node.level!=1 && data.score" @click.stop>
                  <el-text type="primary">谱</el-text>
                </router-link>
                <router-link :to="{ name: 'Lyrics', params: { id: data.id }}" 
                      v-if="node.level!=1 " @click.stop>
                  <el-text type="primary">词</el-text>
                </router-link>
              </el-space>
            </el-space>

            <el-space v-if="isLogin()">
              <el-button size="small" type="primary" :icon="FolderAdd" 
                  @click="categoryAdd(node, data)" @click.stop
                  v-if="node.level==1"
              />
              <el-button size="small" type="success" :icon="Plus" circle
                  @click="songAdd(node, data)" @click.stop
                  v-if="(node.level==1 && !node.childNodes.length) || (node.level ==2)"
              />
              <el-button size="small" type="danger" :icon="Delete" circle 
                  @click="removeConfirm(node)" @click.stop
                  v-if="(node.level!=1) || (node.parent?.childNodes.length > 1)" />
            </el-space>
          </el-space>
        </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch, onMounted } from 'vue'
  import { ElTree, ElMessage } from 'element-plus'
  import { Plus, Delete, FolderAdd, Check, EditPen } from '@element-plus/icons-vue'
  import type Node from 'element-plus/es/components/tree/src/model/node'
  import type { DragEvents } from 'element-plus/es/components/tree/src/model/useDragNode'
  import type {
    AllowDropType,
    NodeDropType,
  } from 'element-plus/es/components/tree/src/tree.type'
  import { ApiCategorySongList, ApiCategoryCreate, ApiCategoryDelete, ApiSongCreate, ApiSongDelete, ApiCategoryEdit, ApiSongEdit, isLogin } from '@/tools/api'
  import ConfirmDialog from '@/views/comp/ConfirmDialog.vue'
  import Upload from '@/views/comp/UploadScore.vue'

  interface Tree {
    id: string,
    name: string,
    order_num: number,
    category?: string,
    score?: string,
    songs?: Tree[]
  }

  const treeProps = {
    children: 'songs',
    label: 'name',
    // order_num: 'order_num',
    class: (data: Tree, node: Node) => {
      if (node.level == 1) return 'category'
      else return 'song'
    }
  }

  //初始化数据
  const treeData = ref<Tree[]>([])
  onMounted(async() => {
    await ApiCategorySongList().then((list: []) => {
      treeData.value = list as Tree[]
    }).catch(alert)
  });
  

  //搜索
  const filterText = ref('')
  const treeRef = ref<InstanceType<typeof ElTree>>()

  watch(filterText, (val) => {
    treeRef.value!.filter(val)
  })

  const filterNode = (value: string, data: Tree) => {
    if (!value) return true
    return data.name.includes(value)
  }
  
  //自定义节点
  const titleInput = ref('')
  const titleEditId = ref('')
  const titleEditBefore = (data:Tree) => {
    titleEditId.value = data.id
    titleInput.value = data.name
  }
  const titleEdit = async (node:Node, data:Tree) => {
    const api = node.level == 1 ? ApiCategoryEdit : ApiSongEdit
    await api(node.data.id, {name:titleInput.value}).catch(alert)
    successInfo()
    data.name = titleInput.value
    titleEditId.value = ""
  }
  
  const categoryAdd = async (node: Node, data: Tree) => {
    const newChild = await ApiCategoryCreate('新目录',data.order_num+1).catch(alert);
    newChild.songs = [];
    const index = treeData.value.findIndex(x => x.id === data.id);
    treeData.value.map(x=> {
      if(x.order_num > data.order_num) x.order_num += 1 
    })
    treeData.value.splice(index+1, 0, newChild);
    treeData.value = [...treeData.value];
    treeRef.value?.setCurrentKey(newChild.id);
  }

  const songAdd = async (node: Node, data: Tree) => {
    const newOrderNum = node.level === 1 ? 1 : data.order_num + 1;
    const category = data.category || data.name;
    const newChild = await ApiSongCreate('新歌曲',category,newOrderNum).catch(alert);
    const children = node.level == 1 ? data.songs : node.parent?.data.songs
    const index = children.findIndex((x:Tree) => x.id === data.id)
    children.map((x:Tree)=> {
      if(x.order_num > data.order_num) x.order_num += 1 
    })
    children.splice(index+1, 0 , newChild)
    treeData.value = [...treeData.value]
    treeRef.value?.setCurrentKey(newChild.id)
  }

  const isComfirm = true;
  const isShowDialog = ref(false)
  const dialogContent = ref('确认删除该目录或歌曲？')
  let dialogNode:Node | null = null
  const removeConfirm = (node: Node) => {
    if(!isComfirm) return remove(node)
    dialogNode = node
    dialogContent.value = `确认删除【${node.label}】${node.level == 1 ?'及其下所有' : ''}？`
    isShowDialog.value = true
  }

  const remove = async (node: Node = dialogNode!!) => {
    const children = node.level == 1 ? treeData.value : node.parent?.data.songs
    const api = node.level == 1 ? ApiCategoryDelete : ApiSongDelete
    await api(node.data.id).catch(alert)
    const index = children.findIndex((d:Tree) => d.id === node.data.id)
    children.splice(index, 1)
    treeData.value = [...treeData.value]
    if(children.length) treeRef.value?.setCurrentKey(children[0].id)
    else treeRef.value?.setCurrentKey(node.parent?.id)
  }

  //拖拽:结束并成功
  const handleDrop = (
    draggingNode: Node,
    dropNode: Node,
    dropType: NodeDropType,
    ev: DragEvents
  ) => {
    // console.log('draggingNode:', draggingNode)
    // console.log('dropNode:', dropNode)
    // console.log('type:', type)
    // TODO api : update Song or Category Level
  }

  //拖拽: 是否拖拽样式
  const allowDrag = (node: Node) => {
    return (node.parent?.childNodes.length || 0) > 1 || node.level != 1
  }
  //拖拽: 是否允许放置
  const allowDrop = (draggingNode: Node, dropNode: Node, type: AllowDropType) => {
    // 允许拖拽到同级节点
    if(draggingNode.level === dropNode.level) {
      return type !== 'inner';
    } else {
      return type === 'inner';
    }
  }

  interface ApiBackInfo {
    ok: number,
    msg: string,
    data?: any
  }

  async function alert(err: ApiBackInfo) {
    ElMessage({
      message: err.msg,
      type: 'warning'
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

<style lang="less" scoped>
.main {
  padding: 10px;
  display: grid;
  gap: 10px;

  .el-tree {
    --el-tree-node-content-height:50px;
    .el-button {
      padding-left: 5px;
      padding-right: 5px;
      gap: 0px;
    }
    .upload {
      height: 25px;
    }
    .title {
      &::v-deep .el-input__wrapper{
        padding: 0 2px;
      }
      &::v-deep .el-input__inner{
        width: 200px
      }

      &::v-deep .el-input-group__append {
        padding: 0 15px;
      }
    }
  }

  .filter {
    border:  2px solid var(--el-color-primary);
    border-radius: 5px;
    width: 80%;
  }
}
</style>
<style lang="less">
.el-tree {
  border-left: 1px solid var(--el-border-color-darker);
  border-right: 1px solid var(--el-border-color-darker);
  .category > .el-tree-node__content {
      background-color: var(--el-color-primary-light-9); //rgba(248, 248, 248);
      color: var(--el-text-color-primary);
      gap: 10px;
      height: 60px;
      padding-left: 10px !important;
      border-top: 1px solid var(--el-border-color-darker);
      border-bottom: 1px solid var(--el-border-color-darker);
    }
  .song {
    .el-tree-node__content {
      margin-left: 20px;
      margin-right: 10px;
      padding: 0 !important;
      border-top: 1px solid var(--el-border-color);
      .el-tree-node__expand-icon {
        width: 0px;
        padding: 0px;
      }
    }
  }
}
</style>