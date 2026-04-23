<script lang="ts" setup>
import { computed } from 'vue';

import { preferences, usePreferences } from '@vben/preferences';

import { ElConfigProvider } from 'element-plus';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();

const { locale } = useI18n();

const elLocale = computed(() => {
  // 根据当前语言返回 Element Plus 的 locale
  return locale.value === 'zh-CN' ? 'zh-cn' : 'en';
});

const size = computed(() => {
  // 根据偏好设置返回尺寸
  return preferences.app.compact ? 'small' : 'default';
});

const zIndex = computed(() => 3000);
</script>

<template>
  <ElConfigProvider :locale="elLocale" :size="size" :z-index="zIndex">
    <RouterView />
  </ElConfigProvider>
</template>
