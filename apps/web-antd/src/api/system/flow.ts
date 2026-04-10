import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';
import { sysApi } from '#/config/env';

export namespace BpmnFlowApi {
  export interface BpmnFlow {
    id?: string;
    keyCode: string; // 流程key
    name: string; // 流程名称
    xml: string; // bpmn 流程xml字符串
    svgStr: string; // 流程svg图片字符串
    versionTag: string;
    note?: string; // 备注
    createTime?: string; // 创建时间
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
/**
 * 更新流程
 * @param params 参数
 * @returns 
 */
async function updateFlow(params: BpmnFlowApi.BpmnFlow) {
  return requestClient.post(`/${sysApi}/flow/update`, params);
}
/**
 * 删除流程
 * @param params 参数
 * @returns 
 */
async function deleteFlow(params: Array<string>) {
  return requestClient.post(`/${sysApi}/flow/del`, params);
}

/**
 * 发布流程
 * @param keyCode 流程key
 * @returns 
 */
async function publishFlow(keyCode: string) {
  return requestClient.get(`/${sysApi}/task/deployByKey/${keyCode}`);
}

export { getFlowList, createFlow, updateFlow, deleteFlow, publishFlow };
