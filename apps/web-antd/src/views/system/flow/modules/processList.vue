<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
  VxeGridProps,
  VxeGridListeners,
} from '#/adapter/vxe-table';
import { ref } from 'vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { listProcessByKey as listProcessByKeyApi, getNodeList, updateNode } from '#/api/system/flow';
import { Button, message, Row, Col, Card } from 'ant-design-vue';
import { useVbenDrawer, useVbenModal, JsonViewer } from '@vben/common-ui';
import { useProcessHistoryColumns } from '../data';
import type { BpmnFlowApi } from '#/api/system/flow';

const keyCode = ref('');
const drawerTitle = ref('流程实例列表');
const procDefId = ref('');
const nodeTitle = ref('节点列表');
const jsonParams = ref({});

// drawerApi
const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange() {
    const data = drawerApi.getData<{ keyCode: string, name: string }>();
    keyCode.value = data.keyCode;
    drawerTitle.value = `流程发布记录 - ${data.name} - ${data.keyCode}`;
  },
});

// gridApi 流程实例列表
const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useProcessHistoryColumns(onViewClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false, // 禁用分页（不分页）
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          try {
            return await listProcessByKeyApi(keyCode.value);
          } catch (error) {
            console.error('加载流程实例列表失败:', error);
            message.error('加载流程实例列表失败');
            return [];
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
      refresh: true,
      refreshOptions: { code: 'query' },
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<BpmnFlowApi.ProcessHistory>,
});

// 查看
function onViewClick(e: OnActionClickParams<BpmnFlowApi.ProcessHistory>) {
  switch (e.code) {
    case 'view': {
      // console.log('onViewClick e ------------ ', e.row);
      modalApi.setData(e.row).open();
      break;
    }
  }
}

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  showCancelButton: false,
  async onConfirm() {
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<BpmnFlowApi.ProcessHistory>();
      procDefId.value = data?.id || '';
      nodeTitle.value = `节点列表 - ${data?.id || ''}`;
    }
  },
});

// 环节列表
const gridOptions: VxeGridProps<BpmnFlowApi.Node> = {
  columns: [
    { title: '序号', type: 'seq', width: 50 },
    { field: 'actDefId', title: '环节ID', align: 'left' },
    { field: 'nodeName', title: '名称', align: 'left' },
    { field: 'elementType', title: '类型', width: 100 },
    { field: 'conditionExpression', title: '条件表达式' },
    { editRender: { name: 'input', placeholder: '请输入json格式参数' }, field: 'jsonParams', title: '自定义json参数', minWidth: 120 },
    { editRender: { name: 'input', placeholder: '请输入备注' }, field: 'note', title: '备注' },
    { slots: { default: 'action' }, title: '操作', width: 140 },
  ],
  editConfig: {
    mode: 'row',
    trigger: 'click',
  },
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await getNodeList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          procDefId: procDefId.value,
        });
      },
    },
  },
  showOverflow: true,
  rowConfig: {
    keyField: 'id',
    isCurrent: true, // 高亮选中行
  }
};

// 点击事件
const gridEvents: VxeGridListeners<BpmnFlowApi.Node> = {
  cellClick: ({ row }) => {
    jsonParams.value = JSON.parse(row.jsonParams || '{}') || {};
  },
};

// 流程实例环节详情列表
const [NodeGrid, nodeGridApi] = useVbenVxeGrid({ gridOptions, gridEvents });

// 判断是否在编辑状态
function hasEditStatus(row: BpmnFlowApi.Node) {
  return nodeGridApi.grid?.isEditByRow(row);
}
// 取消编辑
const cancelRowEvent = (_row: BpmnFlowApi.Node) => {
  nodeGridApi.grid?.clearEdit();
};
// 保存编辑
async function saveRowEvent(row: BpmnFlowApi.Node) {
  await nodeGridApi.grid?.clearEdit();
  nodeGridApi.setLoading(true);
  await updateNode(row).then(() => {
    nodeGridApi.setLoading(false);
    message.success({ content: `保存成功！nodeName=${row.nodeName}` });
  }).catch(() => {
    nodeGridApi.setLoading(false);
    message.error({ content: `保存失败！nodeName=${row.nodeName}` });
  });
}
// 编辑
function editRowEvent(row: BpmnFlowApi.Node) {
  nodeGridApi.grid?.setEditRow(row);
}
</script>

<template>
  <Drawer class="w-full max-w-[75%]" :title="drawerTitle">
    <Grid table-title="">
      <template #toolbar-tools>
      </template>
    </Grid>
  </Drawer>
  <Modal :title="nodeTitle" class="w-full">
    <Row>
      <Col :span="18">
        <Page auto-content-height>
          <NodeGrid table-title="" class="h-full max-h-[600px]">
            <!-- <template #toolbar-tools>
            </template> -->
            <template #action="{ row }">
              <template v-if="hasEditStatus(row)">
                <Button type="link" @click="saveRowEvent(row)">保存</Button>
                <Button type="link" @click="cancelRowEvent(row)">取消</Button>
              </template>
              <template v-else>
                <Button type="link" @click="editRowEvent(row)">编辑</Button>
              </template>
            </template>
          </NodeGrid>
        </Page>
      </Col>
      <Col :span="6">
        <JsonViewer
          :value="jsonParams"
          copyable
          preview-mode
          :showDoubleQuotes="true"
          :show-array-index="false" />
      </Col>
    </Row>
  </Modal>
</template>

<style scoped>
/* 自定义样式 */
</style>