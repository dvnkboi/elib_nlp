import { EventEmitter } from 'events';
import { WasmLoader, functionExport } from './wasmLoader';

const fallBackFunctions = {
  lerp: (a: number, b: number, t: number): number => a + (b - a) * t,
  getDistance: (a: { x: number, y: number; }, b: { x: number, y: number; }): number => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
  getAngle: (a: { x: number, y: number; }, b: { x: number, y: number; }): number => Math.atan2(b.y - a.y, b.x - a.x),
  getAngleDeg: (a: { x: number, y: number; }, b: { x: number, y: number; }): number => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI,
  clamp: (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max),
  map: (value: number, min: number, max: number, newMin: number, newMax: number): number => newMin + (newMax - newMin) * (value - min) / (max - min),
  round: (x: number, n: number): number => Math.round((x + Number.EPSILON) / n) * n,
};
export class PointerUtils {
  private static wasmMath: functionExport;
  private events = new EventEmitter();
  private downTs: number;
  private upTs: number;
  private longPressDownTo: number;
  private ignoredEls: HTMLElement[] = [];
  private isHooked = false;
  private lastUpdate = 0;
  private lastLerpEnd = 0;

  public pageCoords: { x: number; y: number; } = { x: 0, y: 0 };
  public lerpCoords: { x: number; y: number; } = { x: 0, y: 0 };
  public isPressed = false;
  public isLongPress = false;
  public isTouch = false;

  public downPrevent = false;
  public clickPrevent = false;
  public doublePrevent = false;
  public upPrevent = false;
  public enterPrevent = false;
  public leavePrevent = false;
  public movePrevent = false;
  public CancelPrevent = false;
  public outPrevent = false;
  public overPrevent = false;
  public lockChangePrevent = false;
  public lockErrorPrevent = false;
  public contextMenuPrevent = false;
  public doubleClickTime = 250;
  public longPressTime = 500;
  public previousCoords: { x: number, y: number; } = { x: 0, y: 0 };
  public moveThreshold = 5;
  public longPressOnUp = false;
  public updateFps = 60;
  public lerpConst = 5;
  private boundFns: any;


  public set ignore(el: string | HTMLElement | HTMLElement[]) {
    if (typeof el === 'string') {
      this.ignoredEls = [document.querySelector(el) as HTMLElement];
    } else if (el instanceof HTMLElement) {
      this.ignoredEls = [el];
    } else if (Array.isArray(el)) {
      this.ignoredEls = el;
    }

    this.ignoredEls.forEach(el => {
      const children = el.querySelectorAll('*');
      for (let i = 0; i < children.length; i++) {
        this.ignoredEls.push(children[i] as HTMLElement);
      }
    });
  }

  public downCb: (e: PointerEvent) => unknown = () => null;
  public clickCb: (e: PointerEvent) => unknown = () => null;
  public doubleClickCb: (e: PointerEvent) => unknown = () => null;
  public longPressCb: (e: PointerEvent) => unknown = () => null;
  public upCb: (e: PointerEvent) => unknown = () => null;
  public enterCb: (e: PointerEvent) => unknown = () => null;
  public leaveCb: (e: PointerEvent) => unknown = () => null;
  public moveCb: (e: PointerEvent) => unknown = () => null;
  public cancelCb: (e: PointerEvent) => unknown = () => null;
  public outCb: (e: PointerEvent) => unknown = () => null;
  public overCb: (e: PointerEvent) => unknown = () => null;
  public lockChangeCb: (e: PointerEvent) => unknown = () => null;
  public lockErrorCb: (e: PointerEvent) => unknown = () => null;
  public contextMenuCb: (e: PointerEvent) => unknown = () => null;

  public downEl: HTMLElement;
  public clickEl: HTMLElement;
  public doubleClickEl: HTMLElement;
  public longPressEl: HTMLElement;
  public upEl: HTMLElement;
  public enterEl: HTMLElement;
  public leaveEl: HTMLElement;
  public moveEl: HTMLElement;
  public cancelEl: HTMLElement;
  public outEl: HTMLElement;
  public overEl: HTMLElement;
  public lockChangeEl: HTMLElement;
  public lockErrorEl: HTMLElement;
  public contextMenuEl: HTMLElement;

  public get currentElement(): HTMLElement {
    return document.elementFromPoint(this.pageCoords.x, this.pageCoords.y) as HTMLElement;
  }
  public get currentPath(): HTMLElement[] {
    const path: HTMLElement[] = [];
    let el = this.currentElement;
    while (el) {
      path.push(el);
      el = el.parentElement;
    }
    return path;
  }

  public constructor(){
    this.boundFns = {
      pointerDownFn: this.pointerDownFn.bind(this),
      pointerUpFn: this.pointerUpFn.bind(this),
      pointerEnterFn: this.pointerEnterFn.bind(this),
      pointerLeaveFn: this.pointerLeaveFn.bind(this),
      pointerMoveFn: this.pointerMoveFn.bind(this),
      pointerCancelFn: this.pointerCancelFn.bind(this),
      pointerOutFn: this.pointerOutFn.bind(this),
      pointerOverFn: this.pointerOverFn.bind(this),
      pointerLockChangeFn: this.pointerLockChangeFn.bind(this),
      pointerLockErrorFn: this.pointerLockErrorFn.bind(this),
      pointerContextMenuFn: this.pointerContextMenuFn.bind(this)
    };
  }

  public async hook() {
    if (this.isHooked) return;
    this.isHooked = true;
    if (!WasmLoader.isLoaded('math.wasm')) {
      try {
        const wasm = new WasmLoader('math.wasm');
        await wasm.loadWasm();
        PointerUtils.wasmMath = wasm.getFunctions;
      }
      catch (e) {
        console.error(e);
        PointerUtils.wasmMath = fallBackFunctions;
        console.warn('Fallback math functions loaded');
      }
    }

    document.documentElement.addEventListener('pointerdown', this.boundFns.pointerDownFn, true);
    document.documentElement.addEventListener('pointerup', this.boundFns.pointerUpFn, true);
    document.documentElement.addEventListener('pointerenter', this.boundFns.pointerEnterFn, true);
    document.documentElement.addEventListener('pointerleave', this.boundFns.pointerLeaveFn, true);
    document.documentElement.addEventListener('pointermove', this.boundFns.pointerMoveFn, true);
    document.documentElement.addEventListener('pointercancel', this.boundFns.pointerCancelFn, true);
    document.documentElement.addEventListener('pointerout', this.boundFns.pointerOutFn, true);
    document.documentElement.addEventListener('pointerover', this.boundFns.pointerOverFn, true);
    document.documentElement.addEventListener('pointerlockchange', this.boundFns.pointerLockChangeFn, true);
    document.documentElement.addEventListener('pointerlockerror', this.boundFns.pointerLockErrorFn, true);
    document.documentElement.addEventListener('contextmenu', this.boundFns.pointerContextMenuFn, true);
  }

  public on(event: string, callback: (event: any) => void): void {
    this.events.on(event, callback);
  }

  public off(event: string, callback: (event: any) => void): void {
    this.events.off(event, callback);
  }

  public once(event: string, callback: (event: any) => void): void {
    this.events.once(event, callback);
  }

  public startLerp() {
    this.events.emit('lerpStart');
    console.log('lerpStart');
    this.updateCycle();
  }

  private updateCycle() {
    if (Date.now() - this.lastLerpEnd > 100 && (Math.abs(this.lerpCoords.x - this.pageCoords.x) < 1 && Math.abs(this.lerpCoords.y - this.pageCoords.y) < 1)) {
      this.lastLerpEnd = Date.now();
      this.events.emit('lerpEnd');
      return;
    }
    if (Date.now() - this.lastUpdate > 1000 / this.updateFps) {
      this.lastUpdate = Date.now();
      this.lerpCoords.x = PointerUtils.lerp(this.lerpCoords.x, this.pageCoords.x, this.lerpConst / this.updateFps);
      this.lerpCoords.y = PointerUtils.lerp(this.lerpCoords.y, this.pageCoords.y, this.lerpConst / this.updateFps);
      this.events.emit('lerpUpdate', this.lerpCoords);
    }
    requestAnimationFrame(this.updateCycle.bind(this));
  }

  private pointerDownFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.downPrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;
    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };

    this.isLongPress = false;
    const prevTs = this.downTs;
    this.downTs = Date.now();
    this.longPressDownTo = setTimeout(() => {
      if (this.isPressed) {
        if (this.longPressEl && this.longPressEl !== e.target) return;
        this.isLongPress = true;
        this.longPressCb(e);
        this.events.emit('longPress', e);
      }
    }, this.longPressTime);


    if (this.downTs - prevTs < this.doubleClickTime) {
      if (this.doubleClickEl && this.doubleClickEl !== e.target) return;
      if (this.doublePrevent) {
        e.preventDefault();
      }
      this.events.emit('doubleClick', e);
      this.doubleClickCb(e);
    }

    if (this.downEl && this.downEl !== e.target) return;
    this.isPressed = true;
    this.events.emit('pointerdown', e);
    this.downCb(e);
    return Promise.resolve(e);
  }

  private pointerUpFn(e: PointerEvent): Promise<PointerEvent> {

    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.upPrevent) {
      e.preventDefault();
    }

    this.pageCoords = { x: e.pageX, y: e.pageY };
    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    this.longPressDownTo && clearTimeout(this.longPressDownTo);
    this.longPressDownTo = null;
    this.upTs = Date.now();
    this.isPressed = false;
    if (e.pointerType === 'touch') {
      this.isTouch = true;

      if (this.upTs - this.downTs > 500) {
        if (this.contextMenuPrevent) e.preventDefault();
      }
    }
    else {
      document.documentElement.releasePointerCapture(e.pointerId);
    }
    if (this.longPressOnUp && !this.isLongPress && this.upTs - this.downTs > this.longPressTime) {
      if (this.longPressEl && this.longPressEl !== e.target) return;
      this.longPressCb(e);
      this.events.emit('longPress', e);
    }

    if (this.upEl && this.upEl !== e.target) return;
    this.events.emit('pointerup', e);
    this.upCb(e);
    return Promise.resolve(e);
  }

  private pointerEnterFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.enterEl && this.enterEl !== e.target) return;

    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.enterPrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('pointerenter', e);
    this.enterCb(e);
    return Promise.resolve(e);
  }

  private pointerLeaveFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.leaveEl && this.leaveEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.leavePrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('pointerleave', e);
    this.leaveCb(e);
    return Promise.resolve(e);
  }

  private pointerMoveFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.moveEl && this.moveEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.movePrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;


    this.pageCoords = { x: e.pageX, y: e.pageY };
    if (!this.isLongPress && PointerUtils.getDistance(this.previousCoords, this.pageCoords) > this.moveThreshold) {
      clearTimeout(this.longPressDownTo);
      this.longPressDownTo = null;
      this.isLongPress = false;
      this.previousCoords = this.pageCoords;
    }

    this.events.emit('pointermove', e);
    document.documentElement.releasePointerCapture(e.pointerId);
    this.moveCb(e);
    return Promise.resolve(e);
  }

  private pointerCancelFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.cancelEl && this.cancelEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.CancelPrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('pointercancel', e);
    this.cancelCb(e);
    return Promise.resolve(e);
  }

  private pointerOutFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.outEl && this.outEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.outPrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('pointerout', e);
    this.outCb(e);
    return Promise.resolve(e);
  }

  private pointerOverFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.overEl && this.overEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.overPrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('pointerover', e);
    this.overCb(e);
    return Promise.resolve(e);
  }

  private pointerLockChangeFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.lockChangeEl && this.lockChangeEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.lockChangePrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('pointerlockchange', e);
    this.lockChangeCb(e);
    return Promise.resolve(e);
  }

  private pointerLockErrorFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.lockErrorEl && this.lockErrorEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.lockErrorPrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    document.documentElement.releasePointerCapture(e.pointerId);
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('pointerlockerror', e);
    this.lockErrorCb(e);
    return Promise.resolve(e);
  }

  private pointerContextMenuFn(e: PointerEvent): Promise<PointerEvent> {
    if (this.contextMenuEl && this.contextMenuEl !== e.target) return;
    if (this.ignoredEls.includes(e.target as HTMLElement)) return;
    
    if (this.contextMenuPrevent) {
      e.preventDefault();
    }


    e.pointerType === 'touch' ? this.isTouch = true : this.isTouch = false;

    if (e.pointerType != "touch") {
      document.documentElement.releasePointerCapture(e.pointerId);
    }
    this.pageCoords = { x: e.pageX, y: e.pageY };
    this.events.emit('contextmenu', e);
    this.contextMenuCb(e);
    return Promise.resolve(e);
  }

  public destroy(): void {
    this.isHooked = false;
    document.documentElement.removeEventListener('pointerdown', this.boundFns.pointerDownFn, false);
    document.documentElement.removeEventListener('pointerup', this.boundFns.pointerUpFn, false);
    document.documentElement.removeEventListener('pointerenter', this.boundFns.pointerEnterFn, false);
    document.documentElement.removeEventListener('pointerleave', this.boundFns.pointerLeaveFn, false);
    document.documentElement.removeEventListener('pointermove', this.boundFns.pointerMoveFn, false);
    document.documentElement.removeEventListener('pointercancel', this.boundFns.pointerCancelFn, false);
    document.documentElement.removeEventListener('pointerout', this.boundFns.pointerOutFn, false);
    document.documentElement.removeEventListener('pointerover', this.boundFns.pointerOverFn, false);
    document.documentElement.removeEventListener('pointerlockchange', this.boundFns.pointerLockChangeFn, false);
    document.documentElement.removeEventListener('pointerlockerror', this.boundFns.pointerLockErrorFn, false);
    document.documentElement.removeEventListener('contextmenu', this.boundFns.pointerContextMenuFn, false);
  }

  public static lerp(a: number, b: number, t: number): number {
    // return a + (b - a) * t;
    return PointerUtils.wasmMath.lerp(a, b, t);
  }

  public static getDistance(a: { x: number, y: number; }, b: { x: number, y: number; }): number {
    // return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    return PointerUtils.wasmMath.getDistance(a, b);
  }

  public static getAngle(a: { x: number, y: number; }, b: { x: number, y: number; }): number {
    // return Math.atan2(b.y - a.y, b.x - a.x);
    return PointerUtils.wasmMath.getAngle(a.x, a.y, b.x, b.y);
  }

  public static getAngleDeg(a: { x: number, y: number; }, b: { x: number, y: number; }): number {
    // return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return PointerUtils.wasmMath.getAngleDeg(a.x, a.y, b.x, b.y);
  }

  public static clamp(value: number, min: number, max: number): number {
    // return Math.min(Math.max(value, min), max);
    return PointerUtils.wasmMath.clamp(value, min, max);
  }

  public static map(value: number, min: number, max: number, newMin: number, newMax: number): number {
    // return newMin + (newMax - newMin) * (value - min) / (max - min);
    return PointerUtils.wasmMath.map(value, min, max, newMin, newMax);
  }

  public static round(x: number, n: number): number {
    // return Math.round((x + Number.EPSILON) / n) * n;
    return PointerUtils.wasmMath.round(x, n);
  }

  public static click(x: number, y: number): MouseEvent {
    const evt = new MouseEvent('click', {
      clientX: x,
      clientY: y
    });
    (document.elementFromPoint(x, y)).dispatchEvent(evt);
    return evt;
  }

  public static mousedown(x: number, y: number): MouseEvent {
    const evt = new MouseEvent('mousedown', {
      clientX: x,
      clientY: y
    });
    (document.elementFromPoint(x, y)).dispatchEvent(evt);
    return evt;
  }

  public static mouseup(x: number, y: number): MouseEvent {
    const evt = new MouseEvent('mouseup', {
      clientX: x,
      clientY: y
    });
    (document.elementFromPoint(x, y)).dispatchEvent(evt);
    return evt;
  }

  public static mousemove(x: number, y: number): MouseEvent {
    const evt = new MouseEvent('mousemove', {
      clientX: x,
      clientY: y
    });
    (document.elementFromPoint(x, y)).dispatchEvent(evt);
    return evt;
  }

  public static mousewheel(x: number, y: number, delta: number): WheelEvent {
    const evt = new WheelEvent('wheel', {
      clientX: x,
      clientY: y,
      deltaY: delta
    });
    (document.elementFromPoint(x, y)).dispatchEvent(evt);
    return evt;
  }

  public static changeEventCoords(e: PointerEvent, pos: { x: number, y: number; }): Promise<PointerEvent> {
    const evt = new PointerEvent(e.type, {
      ...e,
      clientX: pos.x,
      clientY: pos.y,
      screenX: pos.x,
      screenY: pos.y
    });
    return Promise.resolve(evt);
  }

  public static isScrollable(el: HTMLElement): boolean {
    const hasScrollableContent = el.scrollHeight > el.clientHeight;

    const overflowYStyle = window.getComputedStyle(el).overflowY;
    const isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;

    return hasScrollableContent && !isOverflowHidden;
  }

  public static getScrollableParent(el: HTMLElement): HTMLElement {
    return !el || el === document.body
      ? document.body
      : PointerUtils.isScrollable(el)
        ? el
        : PointerUtils.getScrollableParent(el.parentElement);
  }
}

export default PointerUtils;
