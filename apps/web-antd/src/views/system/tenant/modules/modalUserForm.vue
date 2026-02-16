<script lang="ts" setup>
import type {
  VxeGridListeners,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/api/system/tenant';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserPage, bindTenantUser } from '#/api/system/user';

import { useCheckUserColumns } from '../data';

const emit = defineEmits(['success']);
const userMap = new Map();
const tenantId = ref('');

const [Modal, modalApi] = useVbenModal({
  // 保存租户用户
  async onConfirm() {
    modalApi.lock();
    try {
      const userIds: string[] = [];
      userMap.forEach((value, key) => {
        console.warn(value);
        userIds.push(key);
      });
      if (tenantId.value) {
        bindTenantUser(tenantId.value, userIds)
          .then(() => {
            message.success('操作成功');
            emit('success');
            modalApi.close();
          })
          .catch(() => {
            // hideLoading();
          });
      }
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<SystemTenantApi.SystemTenant>();
      if (data) {
        tenantId.value = data.tenantId;
      }
    }
  },
});
// 表格事件
const gridEvents: VxeGridListeners<SystemUserApi.SystemUser> = {
  // 勾选
  checkboxChange: ({ checked, row }) => {
    // console.warn(checked, '选择数据', row);
    if (checked && row) {
      userMap.set(row.id, row);
    } else {
      userMap.delete(row.id);
    }
  },
  // 全选
  checkboxAll: ({ checked }) => {
    const records = gridApi.grid.getCheckboxRecords();
    // console.warn(checked, '全-选择数据', records);
    if (checked) {
      if (records) {
        records.forEach((element) => {
          userMap.set(element.id, element);
        });
      }
    } else {
      userMap.clear();
    }
  },
};

// gridApi 租户用户
const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents,
  gridOptions: {
    columns: useCheckUserColumns(),
    // height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          // formValues.tenantId = tenantId.value;
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
</script>

<template>
  <Modal title="用户列表" class="w-[1000px]">
    <Grid table-title="选择租户用户" ref="userGridRef" />
  </Modal>
</template>
