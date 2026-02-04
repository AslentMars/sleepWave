<!-- canvas_tooltip.vue -->
<template>
  <div 
    class="CanvasTooltip" 
    v-if="visible" 
    :style="{ 
      left: `${pos.x}px`, 
      top: `${pos.y}px`, 
      borderColor: blockInfo.color 
    }"
  >
    <div class="CanvasTooltip-title">睡眠时长</div>
    <div class="CanvasTooltip-content">
      <span 
        class="CanvasTooltip-point" 
        :style="{ background: blockInfo.color }"
      ></span>
      {{ blockInfo.title }}： 
      <span :style="{ color: blockInfo.color }">{{ blockInfo.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Canvas提示框组件 - Vue 3 Composition API版本
 * 用于显示睡眠数据块的详细信息
 */

/**
 * 坐标点接口
 */
interface Point {
  x: number;
  y: number;
}

/**
 * 数据块信息接口
 */
interface BlockInfo {
  color: string;  // 颜色
  title: string;  // 标题（如：深睡、浅睡等）
  value: number;  // 数值（时长）
}

/**
 * 组件Props定义
 */
interface Props {
  visible: boolean;     // 提示框是否可见
  pos: Point;          // 提示框位置坐标
  blockInfo: BlockInfo; // 要显示的数据块信息
}

/**
 * 使用withDefaults为props提供默认值
 */
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  pos: () => ({ x: 0, y: 0 }),
  blockInfo: () => ({
    color: '#000',
    title: '',
    value: 0
  })
});
</script>

<style scoped>
/**
 * 提示框样式
 * 使用绝对定位，带有阴影和边框的卡片样式
 */
.CanvasTooltip {
  position: absolute;
  padding: 8px 12px;
  border: 1px solid #EDEDED;
  border-radius: 4px;
  box-shadow: 0 3px 6px #00000029;
  background: #fff;
  pointer-events: none; /* 防止提示框阻挡鼠标事件 */
  z-index: 1000; /* 确保提示框在最上层 */
  
  /* 标题样式 */
  &-title {
    margin-bottom: 4px;
    font-size: 12px;
    color: #666;
    font-weight: 500;
  }
  
  /* 内容区域样式 */
  &-content {
    display: flex;
    align-items: center;
    white-space: nowrap; /* 防止文本换行 */
    font-size: 14px;
    color: #333;
  }
  
  /* 颜色指示点样式 */
  &-point {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%; /* 使用50%创建完美圆形 */
    margin-right: 6px;
    flex-shrink: 0; /* 防止圆点被压缩 */
  }
}

/* 提示框进入和离开的过渡动画 */
.CanvasTooltip {
  transition: opacity 0.2s ease-in-out;
}
</style>

