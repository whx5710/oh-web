<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, message, Modal, Select } from 'ant-design-vue';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

// 导入属性面板相关模块
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda';

// 导入属性面板样式
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';

import type { BpmnFlowApi } from '#/api/system/flow';
import { createFlow, getFlowList } from '#/api/system/flow';

const containerRef = ref<HTMLElement>();
const propertiesPanelRef = ref<HTMLElement>();
const modeler = ref<BpmnModeler>();

// 选择流程，进行编辑
const OPTIONS = ref<string[]>([]);
const selectedItem = ref<string>('');
const flowId = ref<string>('');

// 处理流程选择
const handleSelect = async (value: string) => {
  if (!value) return;
  
  try {
    // 调用 getFlowList 获取流程详情
    const res = await getFlowList({
      keyCode: value,
      pageNum: 1,
      pageSize: 10
    });
    
    if (res.list && res.list.length > 0) {
      const flow = res.list[0];
      console.log('获取到的流程详情:', flow);
      // 加载流程 XML 到模型器中
      flowId.value = flow.id;
      if (flow.xml) {
        importModel(flow.xml);
        message.success('流程加载成功');
      } else {
        message.error('流程 XML 为空');
      }
    } else {
      message.error('未找到对应的流程');
    }
  } catch (error) {
    console.error('获取流程详情失败:', error);
    message.error('获取流程详情失败');
  }
};


// 初始化 BPMN 模型
const initModeler = () => {
  if (!containerRef.value || !propertiesPanelRef.value) return;

  modeler.value = new BpmnModeler({
    container: containerRef.value,
    height: '100%',
    width: '100%',
    propertiesPanel: {
      parent: propertiesPanelRef.value
    },
    additionalModules: [
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule
    ],
    moddleExtensions: {
      camunda: camundaModdleDescriptor
    }
  });

  // 创建默认流程
  createDefaultProcess();

  // 查询流程列表
      getFlowList({
        pageNum: 1,
        pageSize: 999,
      }).then(res => {
        console.log('流程列表:', res.list);
        OPTIONS.value = res.list.map(item => item.keyCode);
      });
};

// 创建默认流程
const createDefaultProcess = async () => {
  if (!modeler.value) return;

  const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_1" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36" width="36" x="100" y="200" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

  try {
    await modeler.value.importXML(defaultXml);
    flowId.value = '';
    console.log('BPMN 模型加载成功');
  } catch (error) {
    console.error('BPMN 模型加载失败:', error);
  }
};

// 保存 BPMN 模型到服务器
const saveModel = async () => {
  if (!modeler.value) return;
  try {
    // 获取 XML 内容
    const { xml } = await modeler.value.saveXML({ format: true });
    
    // 获取 SVG 内容
    const { svg } = await modeler.value.saveSVG({
      fit: true,
      background: '#ffffff'
    });
    
    // 获取流程信息
    let processId = 'process';
    let processName = '流程';
    let processNote = '';
    
    // 获取流程元素
    const elementRegistry = modeler.value.get('elementRegistry');
    const processElements = elementRegistry.filter(element => element.type === 'bpmn:Process');
    
    if (processElements.length > 0) {
      const processElement = processElements[0];
      processId = processElement.id;
      
      // 从 businessObject 中获取 name 属性
      processName = processElement.businessObject.name || processElement.name || processId;
      console.log('processElement.name:', processElement.name);
      console.log('processElement.businessObject.name:', processElement.businessObject.name);
      
      // 获取 documentation 内容
      if (processElement.businessObject.documentation) {
        const documentation = processElement.businessObject.documentation;
        if (Array.isArray(documentation)) {
          processNote = documentation[0].text || documentation[0].body || '';
        } else if (documentation.text) {
          processNote = documentation.text;
        } else if (documentation.body) {
          processNote = documentation.body;
        }
      }
      console.log('processNote:', processNote);
    }
    
    // 调用 createFlow 接口保存流程
    const params: BpmnFlowApi.BpmnFlow = {
      id: flowId.value,
      keyCode: processId,
      name: processName,
      xml: xml,
      svgStr: svg,
      versionTag: '1.0.0',
      note: processNote || '流程设计器创建'
    };
    
    await createFlow(params);
    message.success('流程保存成功');
  } catch (error) {
    console.error('保存 BPMN 模型失败:', error);
    message.error('流程保存失败');
  }
};

// 导出流程图为SVG
const exportAsImage = async () => {
  if (!modeler.value) return;

  let processId = 'process';
  const elementRegistry = modeler.value.get('elementRegistry');
  const processElements = elementRegistry.filter(element => element.type === 'bpmn:Process');
  if (processElements.length > 0) {
    processId = processElements[0].id;
  }

  try {
    // 导出为 SVG，使用 fit: true 确保导出整个流程图
    const { svg } = await modeler.value.saveSVG({
      fit: true,  // 适应整个流程图
      width: 1200,  // 设置宽度
      height: 800,  // 设置高度
      background: '#ffffff'  // 设置背景色
    });
    
    // 直接下载 SVG 文件
    downloadFile(svg, `${processId}.svg`, 'image/svg+xml');
    message.success('图片导出成功');
  } catch (error) {
    console.error('导出 SVG 失败:', error);
    message.error('图片导出失败');
  }
};

// 导入 BPMN 模型
const importModel = (xml: string) => {
  if (!modeler.value) return;

  modeler.value.importXML(xml)
    .then(() => {
      console.log('BPMN 模型导入成功');
      message.success('流程打开成功');
    })
    .catch((error) => {
      console.error('BPMN 模型导入失败:', error);
      message.error('流程打开失败');
    });
};

// 下载文件
const downloadFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result as string;
    importModel(content);
  };
  reader.readAsText(file);
};

// 打开流程文件
const handleOpenProcess = () => {
  const fileInput = document.getElementById('bpmn-upload') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
};

// 创建新流程
const createNewProcess = () => {
  Modal.confirm({
    title: '确认创建新流程',
    content: '确定要创建新流程吗？当前未保存的更改将会丢失。',
    onOk() {
      createDefaultProcess();
      message.success('新流程创建成功');
    }
  });
};

// 复制 XML 到粘贴板
const handleCopyXML = async () => {
  if (!modeler.value) return;

  try {
    const { xml } = await modeler.value.saveXML({ format: true });
    
    // 使用 Clipboard API 复制到粘贴板
    await navigator.clipboard.writeText(xml);
    message.success('XML 已复制到粘贴板');
  } catch (error) {
    console.error('复制 XML 失败:', error);
    message.error('复制 XML 失败');
  }
};

// 放大流程
const zoomIn = () => {
  if (!modeler.value) return;
  const canvas = modeler.value.get('canvas');
  const viewbox = canvas.viewbox();
  const newScale = viewbox.scale * 1.1;
  canvas.viewbox({ x: viewbox.x, y: viewbox.y, width: viewbox.width / 1.1, height: viewbox.height / 1.1, scale: newScale });
};

// 缩小流程
const zoomOut = () => {
  if (!modeler.value) return;
  const canvas = modeler.value.get('canvas');
  const viewbox = canvas.viewbox();
  const newScale = viewbox.scale * 0.9;
  canvas.viewbox({ x: viewbox.x, y: viewbox.y, width: viewbox.width / 0.9, height: viewbox.height / 0.9, scale: newScale });
};

// 重置缩放
const zoomReset = () => {
  if (!modeler.value) return;
  const canvas = modeler.value.get('canvas');
  canvas.viewbox({ x: 0, y: 0, width: 1000, height: 800, scale: 1 });
};

onMounted(() => {
  initModeler();
});

onUnmounted(() => {
  if (modeler.value) {
    modeler.value.destroy();
  }
});
</script>

<template>
  <Page auto-content-height class="bpmn-container">
    <div class="bpmn-header">
      <h2>流程设计器</h2>
      <div class="bpmn-actions">
        <Select
          v-model="selectedItem"
          placeholder="选择流程编辑"
          style="width: 200px"
          :options="OPTIONS.map(item => ({ value: item, label: item }))"
          @change="handleSelect"
          allowClear
          show-search
          :filter-option="(input, option) => {
            return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
          }"
        ></Select>
        <Button @click="createNewProcess">
          新建
        </Button>
        <input
          type="file"
          accept=".bpmn"
          @change="handleFileUpload"
          style="display: none"
          id="bpmn-upload"
        />
        <Button @click="handleOpenProcess">
          打开
        </Button>
        <Button @click="handleCopyXML">
          复制XML
        </Button>
        <Button type="primary" @click="saveModel">
          保存
        </Button>
        <Button type="primary" danger @click="exportAsImage">
          导出图片
        </Button>
      </div>
    </div>
    <div class="bpmn-content">
      <div ref="containerRef" class="bpmn-canvas">
        <!-- 缩放控制栏 -->
        <div class="zoom-controls">
          <Button size="small" @click="zoomIn" title="放大">
            +
          </Button>
          <Button size="small" @click="zoomReset" title="重置">
            100%
          </Button>
          <Button size="small" @click="zoomOut" title="缩小">
            -
          </Button>
        </div>
      </div>
      <div ref="propertiesPanelRef" class="bpmn-properties-panel"></div>
    </div>
  </Page>
</template>

<style scoped>
.bpmn-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.bpmn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  /* margin-bottom: 16px; */
  flex-shrink: 0;
}

.bpmn-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.bpmn-actions {
  display: flex;
  gap: 8px;
}

.bpmn-content {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 655px;
}

.bpmn-canvas {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.bpmn-properties-panel {
  width: 300px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: auto;
  flex-shrink: 0;
}

/* 确保 BPMN 画布占满容器 */
:deep(.bjs-container) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.djs-container) {
  width: 100% !important;
  height: 100% !important;
}

:deep(svg) {
  width: 100% !important;
  height: 100% !important;
}

/* 缩放控制栏样式 */
.zoom-controls {
  position: absolute;
  bottom: 60px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 100;
}

.zoom-controls .ant-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 4px;
  font-size: 14px;
}

.zoom-controls .ant-btn:nth-child(2) {
  font-size: 12px;
}
</style>
