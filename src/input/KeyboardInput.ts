/**
 * KeyboardInput.ts
 * 玩家赛车输入系统：键盘（W/S/A/D、方向键）+ 触屏虚拟按键。
 * 每帧调用 update() 得到标准化后的 ControlInput，供赛车控制器与第三人称相机使用。
 */

/** 可映射的控制动作。 */
export type ControlName =
  | 'throttle'
  | 'brake'
  | 'steerLeft'
  | 'steerRight'
  | 'handbrake'
  | 'boost'
  | 'reset';

/** 每帧标准化后的输入状态。 */
export interface ControlInput {
  /** 油门 0..1 */
  throttle: number;
  /** 刹车 0..1 */
  brake: number;
  /** 转向 -1..1，正值表示右转 */
  steer: number;
  /** 手刹（漂移） */
  handbrake: boolean;
  /** 氮气加速 */
  boost: boolean;
  /** 重置车辆（回到赛道） */
  reset: boolean;
}

/** 键盘按键码 → 控制动作 映射。 */
const KEY_BINDINGS: Readonly<Record<string, ControlName>> = {
  KeyW: 'throttle',
  ArrowUp: 'throttle',
  KeyS: 'brake',
  ArrowDown: 'brake',
  KeyA: 'steerLeft',
  ArrowLeft: 'steerLeft',
  KeyD: 'steerRight',
  ArrowRight: 'steerRight',
  Space: 'handbrake',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
  KeyR: 'reset',
};

/** 需要阻止默认行为的按键（避免方向键/空格导致页面滚动）。 */
const PREVENT_DEFAULT_CODES: ReadonlySet<string> = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
]);

/** 虚拟按键绑定描述。 */
export interface VirtualButtonBinding {
  /** 承载触摸事件的 DOM 元素。 */
  element: HTMLElement;
  /** 该按键触发的控制动作。 */
  control: ControlName;
}

/**
 * 统一输入系统：
 * - 监听 window 上的 keydown/keyup 处理键盘输入。
 * - 通过 Pointer 事件（兼容触摸/鼠标/笔）处理虚拟按键。
 * - 支持手动绑定单个按键，或扫描容器内带 data-control 属性的元素自动绑定。
 */
export class KeyboardInput {
  private readonly pressedKeys = new Set<string>();
  private readonly pressedVirtual = new Set<ControlName>();
  private readonly virtualButtons = new Map<HTMLElement, ControlName>();

  private active = false;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const control = KEY_BINDINGS[event.code];
    if (!control) {
      return;
    }
    if (PREVENT_DEFAULT_CODES.has(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      this.pressedKeys.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    // 窗口失焦时清空所有输入，避免"卡键"。
    this.pressedKeys.clear();
    this.pressedVirtual.clear();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const control = this.virtualButtons.get(event.currentTarget as HTMLElement);
    if (!control) {
      return;
    }
    event.preventDefault();
    this.pressedVirtual.add(control);
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    const control = this.virtualButtons.get(event.currentTarget as HTMLElement);
    if (!control) {
      return;
    }
    event.preventDefault();
    this.pressedVirtual.delete(control);
  };

  private readonly onContextMenu = (event: Event): void => {
    // 长按虚拟按键时禁止弹出系统菜单。
    event.preventDefault();
  };

  private readonly onGlobalPointerEnd = (): void => {
    // 安全兜底：手指滑出按钮后仍能正确复位。
    this.pressedVirtual.clear();
  };

  /**
   * 开始监听输入事件（键盘 + 虚拟按键）。可安全重复调用。
   */
  start(): void {
    if (this.active) {
      return;
    }
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('pointerup', this.onGlobalPointerEnd);
    window.addEventListener('pointercancel', this.onGlobalPointerEnd);
    this.active = true;
  }

  /**
   * 停止监听并解绑所有虚拟按键。
   */
  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('pointerup', this.onGlobalPointerEnd);
    window.removeEventListener('pointercancel', this.onGlobalPointerEnd);

    for (const element of Array.from(this.virtualButtons.keys())) {
      this.unbindVirtualButton(element);
    }
    this.pressedKeys.clear();
    this.pressedVirtual.clear();
    this.active = false;
  }

  /**
   * 绑定单个虚拟按键（如触屏上的油门/刹车/左右转向按钮）。
   */
  bindVirtualButton(binding: VirtualButtonBinding): void {
    const { element, control } = binding;
    if (this.virtualButtons.has(element)) {
      return;
    }
    // 禁用触摸默认行为与文本选择，保证按键手感。
    element.style.touchAction = 'none';
    element.style.userSelect = 'none';
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointerup', this.onPointerEnd);
    element.addEventListener('pointercancel', this.onPointerEnd);
    element.addEventListener('contextmenu', this.onContextMenu);
    this.virtualButtons.set(element, control);
  }

  /**
   * 解绑单个虚拟按键。
   */
  unbindVirtualButton(element: HTMLElement): void {
    if (!this.virtualButtons.has(element)) {
      return;
    }
    element.removeEventListener('pointerdown', this.onPointerDown);
    element.removeEventListener('pointerup', this.onPointerEnd);
    element.removeEventListener('pointercancel', this.onPointerEnd);
    element.removeEventListener('contextmenu', this.onContextMenu);
    this.virtualButtons.delete(element);
  }

  /**
   * 扫描容器内带 data-control 属性的元素，自动绑定为虚拟按键。
   * 示例：<button data-control="throttle">油门</button>
   */
  bindVirtualButtonsFromContainer(container: HTMLElement): void {
    const nodes = container.querySelectorAll<HTMLElement>('[data-control]');
    nodes.forEach((node) => {
      const control = node.dataset.control as ControlName | undefined;
      if (control) {
        this.bindVirtualButton({ element: node, control });
      }
    });
  }

  /** 某控制动作是否被键盘或虚拟按键按下。 */
  private isActive(control: ControlName): boolean {
    if (this.pressedVirtual.has(control)) {
      return true;
    }
    for (const code of this.pressedKeys) {
      if (KEY_BINDINGS[code] === control) {
        return true;
      }
    }
    return false;
  }

  /**
   * 计算并返回当前输入状态，通常每帧调用一次。
   */
  update(): ControlInput {
    const steerLeft = this.isActive('steerLeft');
    const steerRight = this.isActive('steerRight');

    return {
      throttle: this.isActive('throttle') ? 1 : 0,
      brake: this.isActive('brake') ? 1 : 0,
      steer: (steerRight ? 1 : 0) - (steerLeft ? 1 : 0),
      handbrake: this.isActive('handbrake'),
      boost: this.isActive('boost'),
      reset: this.isActive('reset'),
    };
  }
}

export default KeyboardInput;