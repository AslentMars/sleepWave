// sleep_block.ts
/**
 * 睡眠波形图中的单个数据块组件
 * 继承自Event类，具备事件处理能力
 * 负责绘制单个睡眠状态块并处理用户交互
 */
import Event from './canvas_event';

/**
 * 二维坐标点接口
 */
interface Point {
  x: number;
  y: number;
}

/**
 * 睡眠波形块的配置选项接口
 * 包含绘制所需的所有几何和样式参数
 */
interface SleepWaveBlockOptions {
  startX: number;        // 块的起始X坐标
  startY: number;        // 块的起始Y坐标
  endX: number;          // 块的结束X坐标
  endY: number;          // 块的结束Y坐标
  hasStraight: boolean;  // 是否包含直线段（当块宽度足够时）
  nowRadius: number;     // 当前块的圆角半径
  color: string;         // 块的颜色
  title: string;         // 睡眠状态标题（如：深睡、浅睡等）
  value: number;         // 时长数值
  borderRadius: number;  // 边框圆角半径
  lineWidth: number;     // 线条宽度
}

/**
 * 提示框实例接口
 * 定义了Vue组件实例的基本结构
 */
interface TooltipInstance {
  visible: boolean;      // 提示框是否可见
  pos: Point;           // 提示框位置
  blockInfo: {          // 提示框显示的块信息
    color: string;
    title: string;
    value: number;
  };
  $el: HTMLElement;     // Vue组件的DOM元素
}

/**
 * 睡眠波形Canvas容器接口
 * 定义了Canvas相关的基本属性和方法
 */
interface SleepWaveCanvas {
  ctx: CanvasRenderingContext2D;  // Canvas 2D渲染上下文
  canvas: HTMLCanvasElement;      // Canvas DOM元素
  tooltip: TooltipInstance;       // 提示框实例
}

/**
 * 睡眠波形数据块类
 * 负责绘制单个睡眠状态块，处理鼠标交互事件，显示提示信息
 */
export class SleepWaveBlock extends Event {
  /** 当前鼠标位置相对于Canvas的坐标 */
  private point: Point = { x: 0, y: 0 };
  
  /** Canvas容器引用 */
  private canvas: SleepWaveCanvas;
  
  /** Canvas 2D渲染上下文 */
  private ctx: CanvasRenderingContext2D;
  
  /** Canvas的宽度，用于计算提示框位置 */
  private width: number;
  
  // 以下为从配置选项中继承的公共属性
  public startX: number;        // 块起始X坐标
  public startY: number;        // 块起始Y坐标
  public endX: number;          // 块结束X坐标
  public endY: number;          // 块结束Y坐标
  public hasStraight: boolean;  // 是否有直线段
  public nowRadius: number;     // 圆角半径
  public color: string;         // 块颜色
  public title: string;         // 睡眠状态标题
  public value: number;         // 时长值
  public borderRadius: number;  // 边框圆角
  public lineWidth: number;     // 线宽

  /**
   * 构造函数
   * @param canvas Canvas容器对象
   * @param opts 块的配置选项
   */
  constructor(canvas: SleepWaveCanvas, opts: SleepWaveBlockOptions) {
    super();
    this.canvas = canvas;
    this.ctx = canvas.ctx;
    this.width = this.canvas.canvas.width;
    
    // 将配置选项的属性复制到当前实例
    Object.assign(this, opts);
    
    // 注册事件监听器
    this.on('click', this.handleClick);
    this.on('mousemove', this.handleMouseMove);
  }

  /**
   * 通用的鼠标交互处理逻辑
   * 设置鼠标样式并显示提示框
   */
  private commonHandler = (): void => {
    document.body.style.cursor = 'pointer';  // 设置鼠标为手型
    this.canvas.tooltip.visible = true;      // 显示提示框
  };

  /**
   * 处理鼠标点击事件
   * @param e 鼠标事件对象
   */
  private handleClick = (e: MouseEvent): void => {
    this.commonHandler();
  };

  /**
   * 处理鼠标移动事件
   * 更新提示框位置和内容
   * @param e 鼠标事件对象
   */
  private handleMouseMove = (e: MouseEvent): void => {
    this.commonHandler();
    
    // 使用setTimeout确保提示框DOM元素已经渲染完成
    setTimeout(() => {
      const boxWidth = this.canvas.tooltip.$el.clientWidth;
      
      // 计算提示框位置，避免超出Canvas边界
      this.canvas.tooltip.pos = { 
        x: this.point.x + boxWidth + 12 >= this.width ? this.width - boxWidth - 12 : this.point.x, 
        y: 8 
      };
      
      // 设置提示框显示的块信息
      this.canvas.tooltip.blockInfo = {
        color: this.color,
        title: this.title,
        value: this.value
      };
    });
  };

  /**
   * 绘制睡眠状态块
   * 使用Canvas 2D API绘制带圆角的矩形块
   */
  draw(): void {
    const { startX, startY, endX, endY, nowRadius, hasStraight } = this;
    
    // 开始绘制路径
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.color;
    
    // 绘制左边缘（垂直线）
    this.ctx.moveTo(startX, startY + this.borderRadius);
    this.ctx.lineTo(startX, endY - this.borderRadius);
    
    // 绘制左下角圆角
    this.ctx.quadraticCurveTo(startX, endY, startX + nowRadius, endY);
    
    // 如果宽度足够，绘制底边直线段
    if (hasStraight) {
      this.ctx.lineTo(endX - this.borderRadius, endY);
    }
    
    // 绘制右下角圆角
    this.ctx.quadraticCurveTo(endX, endY, endX, endY - this.borderRadius);
    
    // 绘制右边缘（垂直线）
    this.ctx.lineTo(endX, startY + this.borderRadius);
    
    // 绘制右上角圆角
    this.ctx.quadraticCurveTo(endX, startY, endX - nowRadius, startY);
    
    // 如果宽度足够，绘制顶边直线段
    if (hasStraight) {
      this.ctx.lineTo(startX + this.borderRadius, startY);
    }
    
    // 绘制左上角圆角，闭合路径
    this.ctx.quadraticCurveTo(startX, startY, startX, startY + this.borderRadius);
    
    // 描边和填充
    this.ctx.stroke();
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  /**
   * 检测鼠标事件是否发生在当前块的区域内
   * @param clientX 鼠标相对于视口的X坐标
   * @param clientY 鼠标相对于视口的Y坐标
   * @returns 如果鼠标在块区域内返回true，否则返回false
   */
  isEventInRegion(clientX: number, clientY: number): boolean {
    // 将视口坐标转换为Canvas坐标
    this.point = this.getEventPosition(clientX, clientY);
    const { x, y } = this.point;
    
    // 计算块的宽度和高度
    const width = this.endX - this.startX;
    const height = this.endY - this.startY;
    
    // 检测鼠标是否在块的矩形区域内
    if (this.startX < x && x < this.startX + width && this.startY < y && y < this.startY + height) {
      return true;
    }
    
    // 如果鼠标不在块区域内，恢复默认鼠标样式并隐藏提示框
    document.body.style.cursor = 'default';
    this.canvas.tooltip.visible = false;
    return false;
  }

  /**
   * 将鼠标的视口坐标转换为Canvas坐标系坐标
   * @param clientX 鼠标相对于视口的X坐标
   * @param clientY 鼠标相对于视口的Y坐标
   * @returns Canvas坐标系中的坐标点
   */
  private getEventPosition(clientX: number, clientY: number): Point {
    const bbox = this.canvas.canvas.getBoundingClientRect();
    return {
      x: clientX - bbox.left,   // 减去Canvas左边距
      y: clientY - bbox.top     // 减去Canvas上边距
    };
  }
}