<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { reactive, ref, watch } from 'vue';

import { Page, Tree, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Card, Col, InputSearch, message, Row } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDept, getDeptPage, getDeptTreeList } from '#/api/system/dept';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const queryParam = ref();
const searchValue = ref<string>('');
/**
 * 编辑部门
 * @param row
 */
function onEdit(row: SystemDeptApi.SystemDept) {
  formModalApi.setData(row).open();
}

/**
 * 添加下级部门
 * @param row
 */
function onAppend(row: SystemDeptApi.SystemDept) {
  formModalApi.setData({ parentId: row.id }).open();
}

/**
 * 创建新部门
 */
function onCreate() {
  formModalApi.setData(queryParam.value).open();
}

/**
 * 删除部门
 * @param row
 */
function onDelete(row: SystemDeptApi.SystemDept) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteDept(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      refreshGrid();
    })
    .catch(() => {
      hideLoading();
    });
}

/**
 * 表格操作按钮的回调函数
 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemDeptApi.SystemDept>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {},
  showSearchForm: false, // 默认隐藏搜索表单
  // 搜索表单
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: true,
    showCollapseButton: false, // 是否显示展开/折叠
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    // pagerConfig: {
    //   enabled: false,
    // },
    proxyConfig: {
      ajax: {
        query: async ({ page }, _params) => {
          return await getDeptPage({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ..._params,
            ...queryParam.value,
          });
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
      search: true,
      refresh: true,
      refreshOptions: { queryMethod: refreshGrid }, // 刷新按钮调用方法
      zoom: true,
    },
    // treeConfig: {
    //   parentField: 'parentId',
    //   rowField: 'id',
    //   transform: false,
    // },
  } as VxeTableGridOptions,
});

/**
 * 刷新表格
 */
function refreshGrid() {
  queryParam.value = { parentId: null };
  gridApi.query(queryParam.value);
  getDeptTree({});
}

const treeData = ref([]);
// 加载树形单位信息
const getDeptTree = (params: Recordable<any>) => {
  getDeptTreeList(params).then((data) => {
    const tmpData = reactive([] as any);
    tmpData.push({
      id: '0',
      name: '全部',
      children: data,
    });
    treeData.value = tmpData;
    generateList(treeData.value);
    setTimeout(() => {
      // 展开-延迟执行
      // deptTreeRef.value.expandNodes(['0']);
    }, 100);
  });
};
getDeptTree({});
const deptTreeRef = ref();
// 点击左边树形列表，查询单位信息
const getDeptById = (node: any) => {
  queryParam.value = { parentId: node.value.id };
  gridApi.query(queryParam.value);
};

// 转列表
const dataList: any[] = [];
const generateList = (data: any[]) => {
  for (const node of data) {
    const id = node.id;
    const parentId = node.parentId;
    dataList.push({ id, parentId, title: node.name });
    if (node.children) {
      generateList(node.children);
    }
  }
};
// 获取上级部门ID
let expandedKeys: Array<number | string> = [];
const getParentKey = (id: number | string): number | string | undefined => {
  let parentId;
  if (id) {
    expandedKeys.push(id);
    for (const node of dataList) {
      if (node.parentId && node.id === id) {
        parentId = node.parentId;
        expandedKeys.push(parentId);
      }
    }
    if (parentId) {
      getParentKey(parentId);
    }
  }
  return parentId;
};

watch(searchValue, (value) => {
  expandedKeys = [];
  dataList.forEach((item) => {
    if (item.title.includes(value)) {
      getParentKey(item.id);
    }
  });
  searchValue.value = value;
  const params = [...new Set(expandedKeys)];
  getDeptTree({ deptIds: params });
  deptTreeRef.value.expandNodes(params);
});
</script>
<template>
  <Row>
    <Col :span="6">
      <Page auto-content-height>
        <Card>
          <InputSearch
            v-model:value="searchValue"
            style="margin-bottom: 8px"
            placeholder="请输入部门名称"
          />
          <Tree
            ref="deptTreeRef"
            :tree-data="treeData"
            bordered
            :transition="false"
            value-field="id"
            label-field="name"
            @select="getDeptById"
          >
            <template #node="item">
              <span v-if="item.value.name.includes(searchValue)">
                {{
                  item.value.name.substring(
                    0,
                    item.value.name.indexOf(searchValue),
                  )
                }}
                <span style="font-weight: bold; color: #f50">{{
                  searchValue
                }}</span>
                {{
                  item.value.name.substring(
                    item.value.name.indexOf(searchValue) + searchValue.length,
                  )
                }}
              </span>
              <span v-else>{{ item.value.name }}</span>
            </template>
          </Tree>
        </Card>
      </Page>
    </Col>
    <Col :span="18">
      <!-- content-class 对应tailwind样式，详情查看 https://tailwind.nodejs.cn/docs -->
      <Page auto-content-height content-class="pl-0">
        <FormModal @success="refreshGrid" />
        <Grid table-title="部门列表">
          <template #toolbar-tools>
            <Button type="primary" @click="onCreate">
              <Plus class="size-5" />
              新增
            </Button>
          </template>
        </Grid>
      </Page>
    </Col>
  </Row>
</template>
