<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Page } from '@vben/common-ui';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

// 导入属性面板相关模块
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda';

// 导入属性面板样式
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';

const containerRef = ref<HTMLElement>();
const propertiesPanelRef = ref<HTMLElement>();
const modeler = ref<BpmnModeler>();

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
    console.log('BPMN 模型加载成功');
  } catch (error) {
    console.error('BPMN 模型加载失败:', error);
  }
};

// 导出 BPMN 模型
const exportModel = async () => {
  if (!modeler.value) return;

  try {
    const { xml } = await modeler.value.saveXML({ format: true });
    console.log('导出的 BPMN XML:', xml);
    // 可以在这里添加下载逻辑
    downloadFile(xml, 'process.bpmn', 'application/xml');
  } catch (error) {
    console.error('导出 BPMN 模型失败:', error);
  }
};

// 导出流程图为SVG
const exportAsImage = async () => {
  if (!modeler.value) return;

  try {
    // 导出为 SVG，使用 fit: true 确保导出整个流程图
    const { svg } = await modeler.value.saveSVG({
      fit: true,  // 适应整个流程图
      width: 1200,  // 设置宽度
      height: 800,  // 设置高度
      background: '#ffffff'  // 设置背景色
    });
    
    // 直接下载 SVG 文件
    downloadFile(svg, 'process.svg', 'image/svg+xml');
  } catch (error) {
    console.error('导出 SVG 失败:', error);
  }
};

// 导入 BPMN 模型
const importModel = (xml: string) => {
  if (!modeler.value) return;

  modeler.value.importXML(xml)
    .then(() => {
      console.log('BPMN 模型导入成功');
    })
    .catch((error) => {
      console.error('BPMN 模型导入失败:', error);
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

// 创建新流程
const createNewProcess = () => {
  if (confirm('确定要创建新流程吗？当前未保存的更改将会丢失。')) {
    createDefaultProcess();
  }
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
        <button class="ant-btn" @click="createNewProcess">
          新建流程
        </button>
        <input
          type="file"
          accept=".bpmn"
          @change="handleFileUpload"
          style="display: none"
          id="bpmn-upload"
        />
        <label for="bpmn-upload" class="ant-btn">
          打开流程
        </label>
        <button class="ant-btn ant-btn-primary" @click="exportModel">
          保存流程
        </button>
        <button class="ant-btn ant-btn-success" @click="exportAsImage">
          导出图片
        </button>
      </div>
    </div>
    <div class="bpmn-content">
      <div ref="containerRef" class="bpmn-canvas"></div>
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
  min-height: 700px;
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
</style>
