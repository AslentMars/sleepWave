// sleepWave.ts
/**
 * 睡眠波形图主类
 * 负责绘制完整的睡眠状态波形图，包括坐标轴、数据块和连接线
 * 支持用户交互和数据可视化
 */
import { SleepWaveBlock } from './sleep_block';

// 简单的throttle函数实现，避免lodash依赖
function throttle(func: Function, delay: number): Function {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * 二维坐标点接口
 */
interface Point {
  x: number;
  y: number;
}

/**
 * 提示框数据结构接口
 */
interface TooltipData {
  visible: boolean;    // 提示框可见性
  pos: Point;         // 提示框位置
  blockInfo: {        // 显示的块信息
    color: string;    // 颜色
    title: string;    // 标题
    value: number;    // 数值
  };
}

/**
 * 睡眠波形图配置选项接口
 * 允许外部自定义图表的各种参数
 */
interface SleepWaveOptions {
  sleepData?: number[][];    // 睡眠数据：[时长, 睡眠类型索引]的二维数组
  Xmax?: number;            // X轴最大值（时间范围）
  Xmin?: number;            // X轴最小值
  sleepType?: string[];     // 睡眠类型标签数组
  sleepColor?: string[];    // 对应的颜色数组
  axisColor?: string;       // 坐标轴颜色
  axisYwidth?: number;      // Y轴宽度
  axisXheight?: number;     // X轴高度
  borderRadius?: number;    // 圆角半径
  lineWidth?: number;       // 线条宽度
}

/**
 * 睡眠波形图主类
 * 提供完整的睡眠数据可视化功能，包括图表绘制、用户交互、提示框等
 */
export class SleepWave {
  // Canvas相关属性
  public canvas: HTMLCanvasElement | null = null;           // Canvas DOM元素
  public ctx: CanvasRenderingContext2D | null = null;       // 2D渲染上下文
  private eventList: string[] = ['click', 'mousemove'];     // 需要监听的事件类型
  public children: SleepWaveBlock[] = [];                   // 存放所有数据块的数组
  public tooltip: any = null;                        // 简单的提示框对象

  // 数据和样式配置
  public sleepType: string[] = ['深睡', '浅睡', '眼动', '清醒'];              // 睡眠状态类型
  public sleepColor: string[] = ['#FFB9E4', '#D3B4FF', '#9345FF', '#5701CD']; // 对应的颜色
  public sleepData: number[][] = [];                        // 睡眠数据：[时长, 类型索引]

  // 坐标轴和布局配置
  public axisColor: string = '#EAEAEA';      // 坐标轴颜色
  public axisYwidth: number = 50;            // Y轴预留宽度（用于显示标签）
  public axisXheight: number = 20;           // X轴预留高度
  public Xmax: number = 800;                 // 时间轴最大值（秒）
  public Xmin: number = 0;                   // 时间轴最小值（秒）
  public Xdis: number = 1;                   // X轴单位像素代表的时间长度
  public Ydis: number = 1;                   // Y轴单位高度（每个睡眠类型的高度）

  // 绘图样式配置
  public borderRadius: number = 12;          // 数据块圆角半径
  public lineWidth: number = 2;              // 连接线宽度

  /**
   * 初始化Canvas和相关组件
   * @param dom 容器DOM元素，Canvas将被添加到此元素中
   */
  init(dom: HTMLElement): void {
    // 设置容器为相对定位，便于提示框绝对定位
    dom.style.position = 'relative';

    // 创建Canvas元素并设置尺寸
    this.canvas = document.createElement('canvas');
    this.canvas.width = dom.clientWidth;
    this.canvas.height = dom.clientHeight;
    dom.appendChild(this.canvas);

    // 创建提示框容器并初始化Vue组件
    const tooltip = document.createElement('div');
    dom.appendChild(tooltip);
    this.tooltip = this.initTooltip().$mount(tooltip);

    // 获取2D渲染上下文
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * 设置图表配置并重新绘制
   * @param option 配置选项，会与默认配置合并
   */
  setOption(option: SleepWaveOptions): void {
    if (!this.ctx || !this.canvas) return;

    // 清空整个画板，准备重新绘制
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 合并用户配置到当前实例
    Object.assign(this, option);

    // 根据新配置更新计算属性
    this.updateProperties();

    // 开始绘制图表
    this.draw();

    // 初始化交互事件
    this.initEvent();
  }

  /**
   * 根据Canvas尺寸和数据范围更新计算属性
   * 计算像素与数据的映射关系
   */
  private updateProperties(): void {
    if (!this.canvas) return;

    // 计算X轴比例：每像素代表的时间长度
    this.Xdis = (this.canvas.width - this.axisYwidth) / (this.Xmax - this.Xmin);

    // 计算Y轴比例：每个睡眠类型占用的像素高度
    this.Ydis = (this.canvas.height - this.axisXheight) / 4;

    // 限制圆角半径，最大为块高度的1/4
    this.borderRadius = Math.min(this.Ydis / 4, this.borderRadius);
  }

  /**
   * 初始化Canvas事件监听
   * 为Canvas添加鼠标交互事件，并使用节流优化性能
   */
  private initEvent(): void {
    if (!this.canvas) return;

    this.eventList.forEach(eventName => {
      // 对高频事件（如mousemove）使用节流，避免性能问题
      this.canvas!.addEventListener(eventName, throttle(this.handleEvent, 50) as EventListener);
    });
  }

  /**
   * Canvas事件处理函数
   * 将Canvas事件分发给相应的数据块处理
   * @param event 鼠标事件对象
   */
  private handleEvent = (event: MouseEvent): void => {
    this.children
      .filter(shape => shape.isEventInRegion(event.clientX, event.clientY))  // 筛选出鼠标位置下的块
      .forEach(shape => shape.emit(event.type, event));                      // 触发块的对应事件
  };

  /**
   * 初始化简单的提示框
   * 创建一个原生DOM提示框，避免Vue依赖
   * @returns 提示框对象
   */
  private initTooltip(): any {
    // 创建提示框DOM元素
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'sleep-wave-tooltip';
    tooltipElement.style.cssText = `
      position: absolute;
      padding: 8px 12px;
      border: 1px solid #EDEDED;
      border-radius: 4px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.16);
      background: #fff;
      pointer-events: none;
      z-index: 1000;
      display: none;
      font-size: 12px;
      white-space: nowrap;
    `;

    // 创建提示框数据对象
    const tooltipData = {
      visible: false,
      pos: { x: 0, y: 0 },
      blockInfo: { color: '', title: '', value: 0 },
      element: tooltipElement
    };

    // 返回包装对象，提供与Vue组件兼容的接口
    return {
      $mount(container: HTMLElement) {
        container.appendChild(tooltipElement);

        // 返回代理对象，监听数据变化并更新DOM
        return new Proxy(tooltipData, {
          set(target: any, prop: string, value: any) {
            target[prop] = value;

            // 根据数据变化更新DOM
            if (prop === 'visible') {
              tooltipElement.style.display = value ? 'block' : 'none';
            } else if (prop === 'pos') {
              tooltipElement.style.left = value.x + 'px';
              tooltipElement.style.top = value.y + 'px';
            } else if (prop === 'blockInfo') {
              tooltipElement.style.borderColor = value.color;
              tooltipElement.innerHTML = `
                <div style="margin-bottom: 4px; color: #666; font-weight: 500;">睡眠时长</div>
                <div style="display: flex; align-items: center;">
                  <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${value.color}; margin-right: 6px;"></span>
                  ${value.title}：<span style="color: ${value.color}; margin-left: 4px;">${value.value}秒</span>
                </div>
              `;
            }
            return true;
          },
          get(target: any, prop: string) {
            if (prop === '$el') {
              return tooltipElement;
            }
            return target[prop];
          }
        });
      }
    };
  }

  /**
   * 绘制完整的睡眠波形图
   * 包括坐标轴、Y轴标签、数据块和连接线
   */
  private draw(): void {
    if (!this.ctx || !this.canvas) return;

    // 清空子元素数组，准备重新创建
    this.children = [];

    // === 绘制坐标轴 ===
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.axisColor;

    // 绘制Y轴（垂直线）
    this.ctx.moveTo(this.axisYwidth - 2, 0);
    this.ctx.lineTo(this.axisYwidth - 2, this.canvas.height - this.axisXheight);

    // 绘制X轴（水平线）
    this.ctx.lineTo(this.canvas.width, this.canvas.height - this.axisXheight);
    this.ctx.stroke();

    // === 绘制Y轴刻度标签 ===
    this.ctx.font = '14px PingFang SC';
    this.ctx.fillStyle = '#4E596F66';
    this.sleepType.forEach((label, index) => {
      // 在每个睡眠类型对应的Y位置绘制标签
      this.ctx!.fillText(label, 4, this.Ydis * (index + 0.5));
    });

    // === 绘制数据块和连接线 ===
    this.sleepData.reduce((pre: number[] | null, item: number[]) => {
      // 计算当前数据块的位置和尺寸
      const startX = pre ? pre[0] : this.axisYwidth;              // 起始X：上一块的结束位置或Y轴位置
      const endX = startX + item[0] * this.Xdis;                 // 结束X：起始位置 + 时长 * X轴比例
      const startY = item[1] * this.Ydis + this.borderRadius;    // 起始Y：睡眠类型索引 * Y轴比例 + 圆角偏移
      const endY = startY + this.Ydis - 2 * this.borderRadius;   // 结束Y：起始Y + 类型高度 - 两倍圆角

      // 判断是否有足够宽度绘制直线段
      const hasStraight = (endX - startX) > 2 * this.borderRadius;

      // 计算实际圆角半径（宽度不够时会缩小）
      const nowRadius = hasStraight ? this.borderRadius : (endX - startX) / 2;

      const { sleepColor, sleepType, borderRadius, lineWidth } = this;

      // === 创建并绘制数据块 ===
      const block = new SleepWaveBlock(this as any, {
        startX,
        startY,
        endX,
        endY,
        hasStraight,
        nowRadius,
        color: sleepColor[item[1]],      // 根据睡眠类型索引获取颜色
        title: sleepType[item[1]],       // 根据睡眠类型索引获取标题
        value: item[0],                  // 时长值
        borderRadius,
        lineWidth
      });
      block.draw();                      // 绘制块
      this.children.push(block);         // 添加到子元素数组

      // === 绘制连接线（当相邻块高度不同时）===
      if (pre && pre[1] !== item[1]) {
        // 判断连接方向：从下到上(true) 还是 从上到下(false)
        // 注意：Canvas坐标系Y轴向下为正，所以pre[1] > item[1]表示从下到上
        const dir = pre[1] > item[1];

        const lineX = startX;  // 连接线的X坐标

        // 计算连接线起点Y坐标
        const lineStartY = dir ?
          (pre[1] * this.Ydis + this.borderRadius) :           // 从下到上：上一块的顶部
          ((pre[1] + 1) * this.Ydis - this.borderRadius);     // 从上到下：上一块的底部

        // 计算连接线终点Y坐标
        const lineEndY = dir ? endY : startY;

        // 创建渐变色（从上一块颜色过渡到当前块颜色）
        const linearGradient = this.ctx!.createLinearGradient(lineX, lineStartY, lineX, lineEndY);
        linearGradient.addColorStop(0, this.sleepColor[pre[1]]);    // 起始颜色
        linearGradient.addColorStop(1, this.sleepColor[item[1]]);   // 结束颜色

        // 绘制连接线路径（使用贝塞尔曲线创建平滑过渡）
        this.ctx!.beginPath();
        this.ctx!.lineWidth = this.lineWidth;
        this.ctx!.strokeStyle = linearGradient;

        // 绘制复杂的连接路径，包含圆角过渡
        this.ctx!.moveTo(lineX, lineStartY + (dir ? (-this.borderRadius) : this.borderRadius));
        this.ctx!.quadraticCurveTo(lineX, lineStartY, lineX - pre[2], lineStartY);
        this.ctx!.quadraticCurveTo(lineX, lineStartY, lineX, lineStartY + (dir ? this.borderRadius : (-this.borderRadius)));
        this.ctx!.lineTo(lineX, lineEndY + (dir ? (-this.borderRadius) : this.borderRadius));
        this.ctx!.quadraticCurveTo(lineX, lineEndY, lineX + nowRadius, lineEndY);
        this.ctx!.quadraticCurveTo(lineX, lineEndY, lineX, lineEndY + (dir ? this.borderRadius : (-this.borderRadius)));
        this.ctx!.closePath();

        // 填充和描边连接线
        this.ctx!.fillStyle = linearGradient;
        this.ctx!.fill();
        this.ctx!.stroke();
      }

      // 返回当前块信息供下一次迭代使用
      // [结束X坐标, 睡眠类型索引, 当前圆角半径]
      return [endX, item[1], nowRadius];
    }, null);
  }
}
