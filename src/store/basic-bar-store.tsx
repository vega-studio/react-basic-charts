import { Vec2, InstanceProvider, EdgeInstance, Vec3, RectangleInstance } from "deltav";

export interface IBasicBarStoreOptions {
  data: number[];
  barShrinkFactor?: number;
  providers: {
    bars: InstanceProvider<EdgeInstance>,
    masks: InstanceProvider<RectangleInstance>
  },
  /** Indicates whether the axis layouts in vertical direction */
  verticalLayout?: boolean;
  view: {
    origin: Vec2,
    size: Vec2
  }
}

export class BasicBarStore {
  view: {
    origin: Vec2;
    size: Vec2;
  }

  mask1: RectangleInstance;
  mask2: RectangleInstance;

  protected maxRange: Vec2;
  protected viewRange: Vec2;
  protected indexRange: Vec2 = [-1, -1];

  private offset: number = 0;
  private scale: number = 1;
  unitNumber: number = 0;
  unitWidth: number;
  unitHeight: number;

  barShrinkFactor: number = 0.8;
  data: number[] = [];
  providers: {
    bars: InstanceProvider<EdgeInstance>,
    masks: InstanceProvider<RectangleInstance>,
  }

  recs: EdgeInstance[] = [];
  recMap: Map<number, EdgeInstance> = new Map();
  verticalLayout: boolean = true;

  constructor(options: IBasicBarStoreOptions) {
    this.view = options.view;
    this.barShrinkFactor = options.barShrinkFactor || this.barShrinkFactor;
    Object.assign(this.data, options.data);
    this.providers = options.providers;
    this.verticalLayout = options.verticalLayout !== undefined ? options.verticalLayout : this.verticalLayout;
    this.init();
  }

  init() {
    this.initMetrics();
    this.unitNumber = this.data.length;
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.initMask();
    const barWidth = (this.verticalLayout ? this.unitHeight : this.unitWidth) * this.barShrinkFactor;
    const origin = this.view.origin;
    const curScale = this.transformScale();

    for (let i = 0; i < this.unitNumber; i++) {
      const barHeight = this.data[i] * 10;

      const rec = new EdgeInstance({
        start: this.verticalLayout ?
          [origin[0], origin[1] - (i + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, origin[1]],
        end: this.verticalLayout ?
          [origin[0] + barHeight, origin[1] - (i + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, origin[1] - barHeight],
        thickness: [barWidth * curScale, barWidth * curScale],
        startColor: [Math.random(), Math.random(), Math.random(), 1],
        endColor: [Math.random(), Math.random(), Math.random(), 1],
      })

      this.recMap.set(i, rec);
      this.providers.bars.add(rec);
    }
  }

  initMetrics() {
    const origin = this.view.origin;
    const width = this.view.size[0];
    const height = this.view.size[1];

    if (this.verticalLayout) {
      this.viewRange = [
        window.innerHeight - origin[1],
        window.innerHeight - origin[1] + height
      ];
    } else {
      this.viewRange = [origin[0], origin[0] + width];
    }

    this.maxRange = this.viewRange;
    this.scale = 1;
    this.offset = this.maxRange[0] - this.viewRange[0];
  }

  initMask() {
    const curScale = this.transformScale();

    this.mask1 = this.providers.masks.add(new RectangleInstance({
      position: this.verticalLayout ?
        [this.view.origin[0], this.view.origin[1]] :
        [this.view.origin[0] - this.unitWidth * curScale, this.view.origin[1] - this.view.size[1]],
      size: this.verticalLayout ?
        [this.view.size[0], this.unitHeight * curScale] :
        [this.unitWidth * curScale, this.view.size[1]],
      color: [0, 0, 0, 1]
    }));

    this.mask2 = this.providers.masks.add(new RectangleInstance({
      position: this.verticalLayout ?
        [this.view.origin[0], this.view.origin[1] - this.view.size[1] - this.unitHeight * curScale] :
        [this.view.origin[0] + this.view.size[0], this.view.origin[1] - this.view.size[1]],
      size: this.verticalLayout ?
        [this.view.size[0], this.unitHeight * curScale] :
        [this.unitWidth * curScale, this.view.size[1]],
      color: [0, 0, 0, 1]
    }));

    console.warn(this.mask1)
  }

  updateMask() {
    const curScale = this.transformScale();
    this.mask1.position = this.verticalLayout ?
      [this.view.origin[0], this.view.origin[1]] :
      [this.view.origin[0] - this.unitWidth * curScale, this.view.origin[1] - this.view.size[1]];
    this.mask1.size = this.verticalLayout ?
      [this.view.size[0], this.unitHeight * curScale] :
      [this.unitWidth * curScale, this.view.size[1]];

    this.mask2.position = this.verticalLayout ?
      [this.view.origin[0], this.view.origin[1] - this.view.size[1] - this.unitHeight * curScale] :
      [this.view.origin[0] + this.view.size[0], this.view.origin[1] - this.view.size[1]];
    this.mask2.size = this.verticalLayout ?
      [this.view.size[0], this.unitHeight * curScale] :
      [this.unitWidth * curScale, this.view.size[1]];

  }

  changeAxis() {
    this.verticalLayout = !this.verticalLayout;
    this.indexRange = [0, this.unitNumber - 1];
    this.initMetrics();
    this.removeAll();
    this.updateMask();
    this.layout();
  }

  layout() {
    const curScale = this.transformScale();
    const origin = this.view.origin;
    const barWidth = (this.verticalLayout ? this.unitHeight : this.unitWidth) * this.barShrinkFactor;

    for (let i = this.indexRange[0]; i <= this.indexRange[1]; i++) {
      const bar = this.recMap.get(i);
      if (bar) {
        bar.start = this.verticalLayout ?
          [origin[0], origin[1] - (i + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, origin[1]];

        bar.end = this.verticalLayout ?
          [bar.end[0], origin[1] - (i + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, bar.end[1]];

        bar.setEdgeThickness(barWidth * curScale);
        this.providers.bars.add(bar);
      }

    }

  }

  removeBars(start: number, end: number) {
    for (let i = start; i <= end; i++) {
      if (this.recMap.has(i)) {
        const bar = this.recMap.get(i);
        this.providers.bars.remove(bar);
      }
    }
  }

  removeAll() {
    for (let i = 0; i < this.unitNumber; i++) {
      if (this.recMap.has(i)) {
        const bar = this.recMap.get(i);
        this.providers.bars.remove(bar);
      }
    }
  }

  setView(view: { origin: Vec2, size: Vec2 }) {
    this.view = view;
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];

    this.removeAll();
    this.initMetrics();
    this.updateMask();
    this.layout();
  }

  transformScale() {
    return 0.5 * Math.pow(2, this.scale);
  }

  updateMaxRange(low: number, high: number, length: number) {
    if (low >= this.viewRange[0] && high <= this.viewRange[1]) {
      low = this.viewRange[0];
      high = this.viewRange[1];
    } else if (low >= this.viewRange[0]) {
      low = this.viewRange[0];
      high = low + length;
    } else if (high <= this.viewRange[1]) {
      high = this.viewRange[1];
      low = high - length;
    }

    this.maxRange = [low, high];
    this.offset = this.maxRange[0] - this.viewRange[0];
    this.updateIndexRange();
    this.updateMask();
    this.layout();
  }

  updateIndexRange() {
    const curScale = this.transformScale();
    const unit = this.verticalLayout ? this.unitHeight * curScale : this.unitWidth * curScale;
    const gap = unit * (1 - this.barShrinkFactor) / 2;
    const start = Math.floor((this.viewRange[0] + gap - this.maxRange[0]) / unit);
    const end = Math.floor((this.viewRange[1] - gap - this.maxRange[0]) / unit);
    const oldStart = this.indexRange[0];
    const oldEnd = this.indexRange[1];

    if (oldEnd < start || oldStart > end) {
      this.removeBars(oldStart, oldEnd);
    } else {
      if (oldEnd >= start && oldStart < start) {
        this.removeBars(oldStart, start);
      }

      if (oldStart <= end && oldEnd > end) {
        this.removeBars(end, oldEnd);
      }
    }

    this.indexRange = [start, end];
  }

  updateOffset(offset: Vec3) {
    const lo = this.maxRange[0] + (this.verticalLayout ? -offset[1] : offset[0]);
    const hi = this.maxRange[1] + (this.verticalLayout ? -offset[1] : offset[0]);
    const range = this.maxRange[1] - this.maxRange[0];
    this.updateMaxRange(lo, hi, range);
  }

  updateScale(mouse: Vec2, scale: Vec3) {
    const newScale = this.scale + (this.verticalLayout ? scale[1] : scale[0]);
    this.scale = Math.min(Math.max(newScale, 1), Math.log2(2 * this.unitNumber));
    const curScale = this.transformScale();
    const pointY = Math.min(Math.max(this.viewRange[0], window.innerHeight - mouse[1]), this.viewRange[1]);
    const pointX = Math.min(Math.max(this.viewRange[0], mouse[0]), this.viewRange[1]);
    const point = this.verticalLayout ? pointY : pointX;
    const newRange = (this.verticalLayout ? this.view.size[1] : this.view.size[0]) * curScale;
    const lowPart = (point - this.maxRange[0]) * newRange / (this.maxRange[1] - this.maxRange[0]);
    const low = point - lowPart;
    const high = low + newRange;

    this.updateMaxRange(low, high, newRange);
  }
}