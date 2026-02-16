<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserPage, unBindTenantUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useUserColumns } from '../data';
import ModalUserForm from './modalUserForm.vue';
/**
 * 数据字典-数据列表（抽屉）。
 */
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ModalUserForm,
  destroyOnClose: true,
});

const tenantId = ref();
// drawerApi
const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  async onConfirm() {
    console.warn('------------------onConfirm');
  },
  onOpenChange() {
    const data = drawerApi.getData<SystemUserApi.SystemUser>();
    tenantId.value = data.tenantId;
  },
});
// 删除数据
function onDataDelete(row: SystemUserApi.SystemUser) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.realName]),
    duration: 0,
    key: 'action_process_msg',
  });
  unBindTenantUser(row.tenantId, [row.id])
    .then(() => {
      message.success({
        content: `用户${row.realName}解绑成功`,
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

// gridApi 租户用户
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useUserColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          formValues.tenantId = tenantId.value;
          return await getUserPage({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
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
      refresh: { code: 'query' },
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SystemUserApi.SystemUser>,
});

function onRefresh() {
  gridApi.query();
}

function onActionClick(e: OnActionClickParams<SystemUserApi.SystemUser>) {
  switch (e.code) {
    case 'delete': {
      onDataDelete(e.row);
      break;
    }
  }
}

function onCreate() {
  formModalApi.setData({ tenantId: tenantId.value }).open();
}
</script>
<template>
  <Drawer class="w-full max-w-[1000px]" title="维护租户用户">
    <FormModal @success="onRefresh" />
    <Grid table-title="租户用户列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增
        </Button>
      </template>
    </Grid>
  </Drawer>
</template>
<style lang="css" scoped>
:deep(.ant-tree-title) {
  .tree-actions {
    display: none;
    margin-left: 20px;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    display: flex;
    flex: auto;
    justify-content: flex-end;
    margin-left: 20px;
  }
}
</style>
