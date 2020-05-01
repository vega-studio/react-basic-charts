import { Vec2, InstanceProvider, EdgeInstance, Vec3, RectangleInstance } from "deltav";

export interface IBasicBarStoreOptions {
  childrenNumber?: number;
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

export abstract class BasicBarStore {
  view: {
    origin: Vec2;
    size: Vec2;
  }

  mask1: RectangleInstance;
  mask2: RectangleInstance;

  protected maxRange: Vec2;
  protected viewRange: Vec2;
  protected indexRange: Vec2 = [-1, -1];

  protected scaleLevel: number = 0;
  protected preScaleLevel: number = -1;
  protected intervalLengths: number[];
  protected interval: number = 1;
  protected lowerInterval: number = 0;

  protected offset: number = 0;
  protected scale: number = 1;
  unitNumber: number = 0;
  unitWidth: number;
  unitHeight: number;

  maxBarWidth: number;
  maxBarHeight: number;

  childrenNumber: number = 10;

  barShrinkFactor: number = 0.8;
  providers: {
    bars: InstanceProvider<EdgeInstance>,
    masks: InstanceProvider<RectangleInstance>,
  }

  recs: EdgeInstance[] = [];
  barMap: Map<number, EdgeInstance> = new Map();
  verticalLayout: boolean = true;

  constructor(options: IBasicBarStoreOptions) {
    this.view = options.view;
    this.barShrinkFactor = options.barShrinkFactor || this.barShrinkFactor;
    this.providers = options.providers;
    this.childrenNumber = options.childrenNumber || this.childrenNumber;
    this.verticalLayout = options.verticalLayout !== undefined ? options.verticalLayout : this.verticalLayout;
    // this.init();
  }

  abstract layout(): void;

  init() {
    this.initMetrics();
    // this.unitNumber = 20; //
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.generateIntervalLengths()
    // this.initMask();
    this.updateInterval();
    this.layout();

    /*const barWidth = (this.verticalLayout ? this.unitHeight : this.unitWidth) * this.barShrinkFactor;
    const origin = this.view.origin;
    const curScale = this.transformScale();

    const indices = this.getIndices2(this.indexRange[0], this.indexRange[1], this.scaleLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      const barHeight = this.data[index] * 10; // data generate

      const bar = new EdgeInstance({
        start: this.verticalLayout ?
          [origin[0], origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1]],
        end: this.verticalLayout ?
          [origin[0] + barHeight, origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1] - barHeight],
        thickness: [barWidth * curScale, barWidth * curScale],
        startColor: [Math.random(), Math.random(), Math.random(), 1],
        endColor: [Math.random(), Math.random(), Math.random(), 1],
      })

      this.recMap.set(index, bar);
      this.providers.bars.add(bar);
    }*/
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
    this.maxBarWidth = this.view.size[0] / this.childrenNumber;
    this.maxBarHeight = this.view.size[1] / this.childrenNumber;
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

  abstract clearRange(start: number, end: number): void;

  getIndices(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const indices: number[] = [];
    const maxLevel = Math.floor(Math.log2(this.unitNumber) / Math.log2(this.childrenNumber));
    higherLevel = higherLevel || maxLevel;
    console.warn("maxLevel", maxLevel);

    for (let level = lowerLevel; level <= higherLevel; level++) {
      // this.getIndicesAtLevel(start, end, level, indices);
      const interval = this.intervalLengths[level];
      const higherInterval = interval * this.childrenNumber;
      start = Math.ceil(start / interval) * interval;
      end = Math.floor(end / interval) * interval;

      for (let i = start; i <= end; i += interval) {
        if (i == 0 && level === this.intervalLengths.length - 1) indices.push(i)
        else if (i % higherInterval !== 0) indices.push(i);
      }
    }

    return indices;
  }

  generateIntervalLengths() {
    this.intervalLengths = [];
    this.intervalLengths.push(1);

    let level = Math.floor(Math.log2(this.unitNumber) / Math.log2(this.childrenNumber));
    let interval = 1;

    while (level > 0) {
      interval *= this.childrenNumber;
      this.intervalLengths.push(interval);
      level--;
    }
  }

  generateData(index: number) {
    return 30;
  }

  getAlpha() {
    const maxBucketSize = this.verticalLayout ? this.maxBarHeight : this.maxBarWidth;
    const unit = this.verticalLayout ? this.unitHeight : this.unitWidth;
    const curScale = this.transformScale();
    const lowerScale = maxBucketSize / (unit * this.interval);
    const higherScale = Math.min(
      this.verticalLayout ? 10 * lowerScale : 1.2 * lowerScale,
      maxBucketSize / (this.unitWidth * this.lowerInterval)
    );
    const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
    const alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);

    return alpha;
  }

  getIndexLevel(index: number) {
    if (index === 0) return Math.floor(Math.log2(this.unitNumber) / Math.log2(this.childrenNumber));
    let level = 0;

    while (index % this.childrenNumber === 0) {
      index = index / this.childrenNumber;
      level++;
    }

    return level;
  }

  removeBars(start: number, end: number, lowerLevel: number, higherLevel: number) {
    const indices = this.getIndices(start, end, lowerLevel, higherLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.barMap.has(index)) {
        const bar = this.barMap.get(index);
        this.providers.bars.remove(bar);
      }
    }
  }

  removeAll() {
    for (let i = 0; i < this.unitNumber; i++) {
      if (this.barMap.has(i)) {
        const bar = this.barMap.get(i);
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
    this.updateInterval();
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
    const maxLevel = Math.floor(Math.log2(this.unitNumber) / Math.log2(this.childrenNumber));

    if (oldEnd < start || oldStart > end) {
      this.removeBars(oldStart, oldEnd, this.preScaleLevel, maxLevel);
    } else {
      if (oldEnd >= start && oldStart < start) {
        this.removeBars(oldStart, start, this.preScaleLevel, maxLevel);
      }

      if (oldStart <= end && oldEnd > end) {
        this.removeBars(end, oldEnd, this.preScaleLevel, maxLevel);
      }
    }

    // this.removeBars(this.indexRange[0], this.indexRange[1], this.preScaleLevel, this.scaleLevel - 1);

    this.indexRange = [start, end];

    this.clearRange(start, end);
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

  /** Update the current interval to be just bigger than the max value */
  updateInterval() {
    this.preScaleLevel = this.scaleLevel;

    this.interval = this.intervalLengths[this.scaleLevel];
    this.lowerInterval = this.scaleLevel === 0 ?
      0 : this.intervalLengths[this.scaleLevel - 1];

    const curScale = this.transformScale();
    const unit = (this.verticalLayout ? this.unitHeight : this.unitWidth) * curScale;

    // supposed to be the biggest on high level
    let maxValue = this.verticalLayout ? this.maxBarHeight : this.maxBarWidth;

    if (this.interval * unit < maxValue) {
      while (
        this.interval * unit < maxValue
      ) {
        this.scaleLevel++;
        this.interval = this.intervalLengths[this.scaleLevel];
        this.lowerInterval = this.intervalLengths[this.scaleLevel - 1];
      }
    } else {
      while (this.lowerInterval * unit > maxValue && this.interval * unit >= maxValue) {
        this.scaleLevel--;
        this.interval = this.intervalLengths[this.scaleLevel];
        this.lowerInterval = this.scaleLevel === 0 ?
          0 : this.intervalLengths[this.scaleLevel - 1];
      }
    }

    this.scaleLevel = Math.min(this.scaleLevel, this.intervalLengths.length - 1);
  }
}