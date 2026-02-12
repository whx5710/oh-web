<script lang="ts" setup>
import type {
  VxeGridListeners,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemLogApi } from '#/api/system/log';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob } from '@vben/utils';

import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  message,
  Modal,
  Popconfirm,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteLoginByDate,
  deleteLoginLog,
  getLoginLogPage,
  loginLogExport,
} from '#/api/system/log';

import { useGridFormSchema, useLoginColumns } from './data';

const fileMap = new Map();

// 表格事件
const gridEvents: VxeGridListeners<SystemLogApi.SysLoginLog> = {
  // 勾选
  checkboxChange: ({ checked, row }) => {
    // console.warn(checked, '选择数据', row);
    if (checked && row) {
      fileMap.set(row.id, row);
    } else {
      fileMap.delete(row.id);
    }
  },
  // 全选
  checkboxAll: ({ checked }) => {
    const records = gridApi.grid.getCheckboxRecords();
    if (checked) {
      if (records) {
        records.forEach((element) => {
          fileMap.set(element.id, element);
        });
      }
    } else {
      fileMap.clear();
    }
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents,
  showSearchForm: false, // 隐藏搜索表单
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: true,
    showCollapseButton: false, // 是否显示展开/折叠
  },
  gridOptions: {
    columns: useLoginColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (formValues.startTime) {
            formValues.startTime = `${formValues.startTime} 00:00:00`;
          }
          if (formValues.endTime) {
            formValues.endTime = `${formValues.endTime} 23:59:59`;
          }
          return await getLoginLogPage({
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
      refresh: true,
      refreshOptions: { code: 'query' },
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SystemLogApi.SysLoginLog>,
});

// 批量导出
function batchExport() {
  gridApi.formApi.getValues().then((res) => {
    const params = res;
    if (res.startTime) {
      params.startTime = `${res.startTime} 00:00:00`;
    }
    if (res.endTime) {
      params.endTime = `${res.endTime} 23:59:59`;
    }
    loginLogExport(params).then((res) => {
      const disposition = res.headers['content-disposition'];
      const filename = disposition.replaceAll('attachment;filename=', '');
      downloadFileFromBlob({
        source: res.data,
        fileName: decodeURI(filename),
      });
    });
  });
}
// 批量删除
function batchDelete() {
  const logIds: string[] = [];
  fileMap.forEach((value, key) => {
    console.warn(value);
    logIds.push(key);
  });
  if (logIds.length === 0) {
    message.warning({
      content: '请勾选要删除的数据',
    });
    return;
  }
  const hideLoading = message.loading({
    content: '批量删除',
    duration: 0,
    key: 'action_process_msg',
  });
  deleteLoginLog(logIds)
    .then(() => {
      message.success({
        content: '批量删除成功',
        key: 'action_process_msg',
      });
      onRefresh();
      fileMap.clear();
    })
    .catch(() => {
      hideLoading();
      fileMap.clear();
    });
}
// 刷新列表
function onRefresh() {
  gridApi.query();
}
// 按时间删除日志
function deleteLogs(value: any) {
  if (value && value.key) {
    let content = '是否全部删除？';
    if (value.key !== '0') {
      content = `是否删除${value.key}天前的日志`;
    }
    Modal.confirm({
      content,
      onCancel() {
        console.warn('已取消');
      },
      onOk() {
        const date = new Date();
        date.setDate(date.getDate() - value.key);
        const formattedDate = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
        deleteLoginByDate(formattedDate).then(() => {
          message.success({
            content: '删除成功',
            key: 'action_process_msg',
          });
          onRefresh();
        });
      },
      title: '是否删除日志',
    });
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="日志列表">
      <template #toolbar-tools>
        <Popconfirm title="确定导出？" @confirm="batchExport">
          <Button class="mr-2" type="primary">
            <IconifyIcon icon="carbon:export" /> 导出
          </Button>
        </Popconfirm>
        <Popconfirm title="确定删除？" @confirm="batchDelete">
          <Button
            class="mr-2"
            type="primary"
            danger
            v-access:code="['sys:log:login:delete']"
          >
            <IconifyIcon icon="carbon:row-delete" /> 删除
          </Button>
        </Popconfirm>
        <Dropdown class="mr-2">
          <Button v-access:code="['sys:app:delete']">
            按时间删除
            <IconifyIcon icon="ant-design:down-outlined" />
          </Button>
          <template #overlay>
            <Menu @click="deleteLogs">
              <MenuItem key="0">全部删除</MenuItem>
              <MenuItem key="1">删除1天前的</MenuItem>
              <MenuItem key="3">删除3天前的</MenuItem>
              <MenuItem key="7">删除7天前的</MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </template>
    </Grid>
  </Page>
</template>
