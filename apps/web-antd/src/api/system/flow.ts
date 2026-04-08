import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';
import { sysApi } from '#/config/env';

export namespace BpmnFlowApi {
  export interface BpmnFlow {
    id?: string;
    keyCode: string;
    name: string;
    xml: string;
    svgStr: string;
    versionTag: string;
    note?: string; // bpmn 流程备注
  }
  // 分页查询流程列表数据
  export interface BpmnFlowPage {
    list: BpmnFlow[];
    total: number;
  }
}

/**
 * 获取流程列表数据
 */
async function getFlowList(params: Recordable<any>) {
  return requestClient.get<BpmnFlowApi.BpmnFlowPage>(
    `/${sysApi}/flow/page`,
    {
      params,
    },
  );
}

/**
 * 新建流程
 * @param params 参数
 */
async function createFlow(params: BpmnFlowApi.BpmnFlow) {
  return requestClient.post(`/${sysApi}/flow/saveOrUpdate`, params);
}

async function updateFlow(params: BpmnFlowApi.BpmnFlow) {
  return requestClient.post(`/${sysApi}/flow/update`, params);
}

export { getFlowList, createFlow, updateFlow };
