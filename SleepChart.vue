<template>
  <ContentWrap>
    <el-card>
      <template #header>
        <div class="card-header">
          <Icon icon="ep:moon" />
          <span>睡眠波形图示例</span>
        </div>
      </template>

      <!-- 控制面板 -->
      <div class="control-panel">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-button type="primary" @click="generateRandomData">生成随机数据</el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="clearData">清空数据</el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="loadSampleData">加载示例数据</el-button>
          </el-col>
          <el-col :span="6">
            <el-text>数据点数: {{ sleepData.length }}</el-text>
          </el-col>
        </el-row>
      </div>

      <!-- 睡眠波形图 -->
      <div class="chart-wrapper">
        <SleepWaveChart
          :data="sleepData"
          :width="800"
          :height="300"
          :sleep-types="['深睡', '浅睡', '眼动', '清醒']"
          :sleep-colors="['#FFB9E4', '#D3B4FF', '#9345FF', '#5701CD']"
          :border-radius="12"
          :line-width="2"
        />
      </div>

      <!-- 数据表格 -->
      <div class="data-table">
        <h3>睡眠数据</h3>
        <el-table :data="sleepData" style="width: 100%" max-height="300">
          <el-table-column prop="duration" label="持续时间(秒)" width="150" />
          <el-table-column prop="type" label="睡眠类型" width="120">
            <template #default="scope">
              <el-tag :color="sleepColors[scope.row.type]" style="color: white">
                {{ sleepTypes[scope.row.type] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button link type="danger" size="small" @click="removeDataItem(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 添加数据表单 -->
      <div class="add-data-form">
        <h3>添加睡眠数据</h3>
        <el-form :model="newDataItem" inline>
          <el-form-item label="持续时间(秒)">
            <el-input-number
              v-model="newDataItem.duration"
              :min="1"
              :max="3600"
              placeholder="请输入持续时间"
            />
          </el-form-item>
          <el-form-item label="睡眠类型">
            <el-select v-model="newDataItem.type" placeholder="请选择睡眠类型">
              <el-option
                v-for="(type, index) in sleepTypes"
                :key="index"
                :label="type"
                :value="index"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addDataItem">添加</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SleepWaveChart from '@/components/SleepWaveChart/index.vue'

/** 睡眠图表示例页面 */
defineOptions({ name: 'SleepChart' })

// 睡眠类型和颜色配置
const sleepTypes = ['深睡', '浅睡', '眼动', '清醒']
const sleepColors = ['#FFB9E4', '#D3B4FF', '#9345FF', '#5701CD']

// 睡眠数据接口
interface SleepDataItem {
  duration: number
  type: number
}

// 睡眠数据
const sleepData = ref<SleepDataItem[]>([])

// 新数据项表单
const newDataItem = ref({
  duration: 60,
  type: 0
})

/**
 * 生成随机睡眠数据
 */
const generateRandomData = () => {
  const data: SleepDataItem[] = []
  const dataCount = Math.floor(Math.random() * 10) + 5 // 5-15个数据点

  for (let i = 0; i < dataCount; i++) {
    data.push({
      duration: Math.floor(Math.random() * 300) + 30, // 30-330秒
      type: Math.floor(Math.random() * 4) // 0-3的睡眠类型
    })
  }

  sleepData.value = data
}

/**
 * 清空数据
 */
const clearData = () => {
  sleepData.value = []
}

/**
 * 加载示例数据
 */
const loadSampleData = () => {
  sleepData.value = [
    { duration: 120, type: 0 }, // 深睡 2分钟
    { duration: 80, type: 1 }, // 浅睡 1分20秒
    { duration: 30, type: 2 }, // 眼动 30秒
    { duration: 60, type: 3 }, // 清醒 1分钟
    { duration: 200, type: 0 }, // 深睡 3分20秒
    { duration: 150, type: 1 }, // 浅睡 2分30秒
    { duration: 45, type: 2 }, // 眼动 45秒
    { duration: 90, type: 1 } // 浅睡 1分30秒
  ]
}

/**
 * 添加数据项
 */
const addDataItem = () => {
  if (newDataItem.value.duration > 0) {
    sleepData.value.push({
      duration: newDataItem.value.duration,
      type: newDataItem.value.type
    })
    // 重置表单
    newDataItem.value = {
      duration: 60,
      type: 0
    }
  }
}

/**
 * 删除数据项
 */
const removeDataItem = (index: number) => {
  sleepData.value.splice(index, 1)
}

// 初始化时加载示例数据
loadSampleData()
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.control-panel {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  margin: 24px 0;
  padding: 20px;
  background-color: #ffffff;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.data-table {
  margin-top: 24px;
}

.data-table h3 {
  margin-bottom: 16px;
  color: #303133;
}

.add-data-form {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.add-data-form h3 {
  margin-bottom: 16px;
  color: #303133;
}
</style>
