<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import { ref } from 'vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { listProcessByKey as listProcessByKeyApi } from '#/api/system/flow';
import { Button, Tag, message } from 'ant-design-vue';
import { useVbenDrawer } from '@vben/common-ui';

interface ProcessInstance {
  id: string;
  processKey: string;
  processName: string;
  businessKey: string;
  startTime: string;
  endTime: string;
  status: string;
  assignee?: string;
}

const keyCode = ref('');
const drawerTitle = ref('流程实例列表');

// drawerApi
const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange() {
    const data = drawerApi.getData<{ keyCode: string }>();
    keyCode.value = data.keyCode;
    drawerTitle.value = `流程实例列表 - ${data.keyCode}`;
  },
});

// 定义列配置
const useColumns = () => {
  return [
    // {
    //   title: '业务键',
    //   key: 'deploymentId',
    //   field: 'deploymentId',
    //   width: 120,
    // },
    {
      title: '实例ID',
      key: 'id',
      field: 'id',
    },
    {
      title: '名称',
      key: 'name',
      field: 'name',
      width: 200,
    },
    {
      title: '发布时间',
      key: 'createTime',
      field: 'createTime',
      width: 180,
    },
  ];
};

// gridApi 流程实例列表
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async () => {
          try {
            const res = await listProcessByKeyApi(keyCode.value);
            return {
              list: res || [],
              total: (res || []).length,
            };
          } catch (error) {
            console.error('加载流程实例列表失败:', error);
            message.error('加载流程实例列表失败');
            return { list: [], total: 0 };
          }
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isCurrent: true, // 高亮选中行
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: { code: 'query' },
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<ProcessInstance>,
});

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Drawer class="w-full max-w-[1000px]" :title="drawerTitle">
    <Grid table-title="">
      <template #toolbar-tools>
        <Button type="primary" @click="onRefresh">
          刷新
        </Button>
      </template>
    </Grid>
  </Drawer>
</template>

<style scoped>
/* 自定义样式 */
</style>