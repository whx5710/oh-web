import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';
import { sysApi } from '#/config/env';

export namespace BpmnFlowApi {
  export interface BpmnFlow {
    id: string;
    keyCode: string;
    name: string;
    xml: string;
    svgStr: string;
    versionTag: string;
    note?: string;
  }
}

/**
 * 获取流程列表数据
 */
async function getFlowList(params: Recordable<any>) {
  return requestClient.get<Array<BpmnFlowApi.BpmnFlow>>(
    `/${sysApi}/flow/page`,
    {
      params,
    },
  );
}

export { getFlowList };