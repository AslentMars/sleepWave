// canvas_event.ts
/**
 * Canvas事件系统
 * 提供事件监听、触发和移除功能的基础类
 * 用于Canvas元素的交互事件管理
 */

/**
 * 事件处理函数类型定义
 * @param event 事件对象，包含事件相关信息
 */
type EventHandler = (event: any) => void;

/**
 * 事件监听器集合接口
 * 以事件类型为key，事件处理函数数组为value
 */
interface EventListeners {
  [type: string]: EventHandler[];
}

/**
 * 事件管理类
 * 实现了观察者模式，用于管理Canvas元素的各种交互事件
 */
class Event {
  /** 私有属性：存储所有事件监听器的映射表 */
  private _listener: EventListeners = {};

  /**
   * 注册事件监听器
   * @param type 事件类型（如：'click', 'mousemove', 'mouseenter'等）
   * @param handler 事件处理函数，当事件触发时被调用
   */
  on(type: string, handler: EventHandler): void {
    // 如果该事件类型还没有监听器数组，则创建一个
    if (!this._listener[type]) {
      this._listener[type] = [];
    }

    // 将新的事件处理函数添加到对应事件类型的监听器数组中
    this._listener[type].push(handler);
  }

  /**
   * 触发指定类型的事件
   * 会依次调用该事件类型下注册的所有监听器
   * @param type 要触发的事件类型
   * @param event 传递给事件处理函数的事件对象
   */
  emit(type: string, event: any): void {
    // 安全检查：确保事件对象和事件类型都存在
    if (event == null || event.type == null) {
      return;
    }
    
    // 获取指定事件类型的所有监听器
    const typeListeners = this._listener[type];
    if (!typeListeners) return;
    
    // 遍历并执行所有监听器
    for (let index = 0; index < typeListeners.length; index++) {
      const handler = typeListeners[index];
      handler(event);
    }
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param handler 可选，指定要移除的处理函数。如果不提供，则移除该类型的所有监听器
   */
  remove(type: string, handler?: EventHandler): void {
    // 如果没有指定具体的处理函数，则清空该事件类型的所有监听器
    if (!handler) {
      this._listener[type] = [];
      return;
    }

    // 如果该事件类型存在监听器
    if (this._listener[type]) {
      const listeners = this._listener[type];
      
      // 遍历监听器数组，找到并移除指定的处理函数
      for (let i = 0, len = listeners.length; i < len; i++) {
        if (listeners[i] === handler) {
          listeners.splice(i, 1);
          break; // 找到后立即退出循环，避免数组索引变化导致的问题
        }
      }
    }
  }
}

export default Event;