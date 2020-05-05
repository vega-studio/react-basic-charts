import { BasicBarStore, IBasicBarStoreOptions } from "./basic-bar-store";
import { Vec2, EdgeInstance, Color, RectangleInstance, add2, scale2, subtract2 } from "deltav";

function generateRandom(sum: number, count: number) {
  const a: number[] = [];
  a.push(0);
  a.push(sum);

  for (let i = 0; i < count - 1; i++) {
    a.push(sum * Math.random());
  }

  a.sort((a, b) => a - b);

  const rands: number[] = [];

  for (let i = 0; i < count; i++) {
    rands.push(a[i + 1] - a[i]);
  }

  return rands;
}

export interface IRangeNumberBarStoreOptions extends IBasicBarStoreOptions {
  /** Sets the number range to show in the axis */
  numberRange: Vec2;
  /** Sets the difference between every number in the axis */
  numberGap?: number;
}

export class RangeNumberBarStore extends BasicBarStore {
  private numberRange: Vec2;
  private numberGap: number;

  maxLevel: number = -1;

  recMap: Map<number, Map<number, EdgeInstance>>;
  dataMap: Map<number, Map<number, number>>;

  constructor(options: IRangeNumberBarStoreOptions) {
    super(options);

    this.recMap = new Map();
    this.dataMap = new Map();
    this.numberRange = options.numberRange;
    this.numberGap = options.numberGap || 1;
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap);
    // this.maxLevel = Math.floor(Math.log2(this.unitNumber) / Math.log2(this.childrenNumber));
    for (let i = 0; i <= this.maxLevel; i++) {
      this.dataMap.set(i, new Map<number, number>())
    }
    this.init();
  }

  init() {
    this.initMetrics();
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;

    this.generateIntervalLengths()
    this.updateInterval();
    this.initMask();
    this.maxLevel = this.scaleLevel;
    this.layout();
  }

  initMask() {
    const curScale = this.transformScale();
    const interval = this.intervalLengths[this.scaleLevel];
    const intWidth = this.verticalLayout ? interval * this.unitHeight : interval * this.unitWidth;

    this.mask1 = this.providers.masks.add(new RectangleInstance({
      position: this.verticalLayout ?
        [this.view.origin[0], this.view.origin[1]] :
        [this.view.origin[0] - intWidth * curScale, 0],
      size: this.verticalLayout ?
        [window.innerWidth - this.view.origin[0], intWidth * curScale] :
        [intWidth * curScale, this.view.origin[1]],
      color: [0, 0, 0, 1]
    }));

    this.mask2 = this.providers.masks.add(new RectangleInstance({
      position: this.verticalLayout ?
        [this.view.origin[0], this.view.origin[1] - this.view.size[1] - intWidth * curScale] :
        [this.view.origin[0] + this.view.size[0], 0],
      size: this.verticalLayout ?
        [window.innerWidth - this.view.origin[0], intWidth * curScale] :
        [intWidth * curScale, this.view.origin[1]],
      color: [0, 0, 0, 1]
    }));
  }

  updateMask() {
    const curScale = this.transformScale();
    const interval = this.intervalLengths[this.scaleLevel];
    const intWidth = interval * this.unitWidth;

    this.mask1.position = this.verticalLayout ?
      [this.view.origin[0], this.view.origin[1]] :
      [this.view.origin[0] - intWidth * curScale, 0];
    this.mask1.size = this.verticalLayout ?
      [window.innerWidth - this.view.origin[0], intWidth * curScale] :
      [intWidth * curScale, this.view.origin[1]];

    this.mask2.position = this.verticalLayout ?
      [this.view.origin[0], this.view.origin[1] - this.view.size[1] - intWidth * curScale] :
      [this.view.origin[0] + this.view.size[0], 0];
    this.mask2.size = this.verticalLayout ?
      [window.innerWidth - this.view.origin[0], intWidth * curScale] :
      [intWidth * curScale, this.view.origin[1]];
  }

  getIndices(start: number, end: number, level: number) {
    const indices: number[] = [];
    const interval = this.intervalLengths[level];
    start = Math.floor(start / interval) * interval;
    end = Math.floor(end / interval) * interval;

    for (let i = start; i <= end; i += interval) {
      indices.push(i / interval);
    }

    return indices;
  }

  getData(level: number, index: number) {
    if (!this.dataMap.has(level)) {
      this.dataMap.set(level, new Map<number, number>());
    }

    const levelMap = this.dataMap.get(level);

    if (levelMap.has(index)) {
      return levelMap.get(index);
    } else {
      if (level === this.maxLevel) {
        const data = 400 + 100 * Math.random();
        levelMap.set(index, data);
        return data;
      } else {
        const parentIndex = Math.floor(index / this.childrenNumber);
        const parentLevel = this.scaleLevel + 1;
        const parentMap = this.dataMap.get(parentLevel);

        if (!parentMap.has(parentIndex)) {
          this.getData(parentLevel, parentIndex);
        }

        const sum = parentMap.get(parentIndex);
        const rands = generateRandom(sum, this.childrenNumber);
        const baseIndex = parentIndex * this.childrenNumber;

        for (let i = 0; i < this.childrenNumber; i++) {
          levelMap.set(i + baseIndex, rands[i]);
        }

        return levelMap.get(index);
      }

    }
  }

  getAlpha() {
    const interval = this.intervalLengths[this.scaleLevel];
    const curScale = this.transformScale();
    // return 1;

    if (this.scaleLevel === this.maxLevel) {
      const lowerInterval = this.intervalLengths[this.scaleLevel - 1];
      const higherScale = this.maxBarWidth / (lowerInterval * this.unitWidth);
      const lowerScale = 0.9 * higherScale; // this.maxBarWidth / (interval * this.unitWidth);
      const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
      const alpha = 1 - (alphaScale - lowerScale) / (higherScale - lowerScale);
      return alpha;
    } else if (this.scaleLevel === 0) {
      const lowerScale = this.maxBarWidth / (interval * this.unitWidth);
      const higherScale = 1.1 * lowerScale;
      const alphaScale = Math.min(Math.max(curScale, lowerScale), higherScale);
      const alpha = (alphaScale - lowerScale) / (higherScale - lowerScale);
      return alpha;
    } else {
      const lowerInterval = this.intervalLengths[this.scaleLevel - 1];
      const higherScale = this.maxBarWidth / (lowerInterval * this.unitWidth);
      const lowerScale = this.maxBarWidth / (interval * this.unitWidth);
      const scaleOffset = (higherScale - lowerScale) / 5;
      // part1
      if (curScale >= lowerScale && curScale <= lowerScale + scaleOffset) {
        return (curScale - lowerScale) / scaleOffset;
      } else if (curScale >= higherScale - scaleOffset && curScale <= higherScale) {
        return (higherScale - curScale) / scaleOffset;
      }

      return 1;
    }
  }

  getLocationScale() {
    const interval = this.intervalLengths[this.scaleLevel];
    const curScale = this.transformScale();

    if (this.scaleLevel === this.maxLevel) {
      return 1;
    } else if (this.scaleLevel === 0) {
      const lowerScale = this.maxBarWidth / (interval * this.unitWidth);
      const higherScale = 1.33 * lowerScale;
      const scale = Math.min(Math.max(curScale, lowerScale), higherScale);
      return (scale - lowerScale) / (higherScale - lowerScale);
    } else {
      const lowerInterval = this.intervalLengths[this.scaleLevel - 1];
      // const higherScale = this.maxBarWidth / (lowerInterval * this.unitWidth);
      const lowerScale = this.maxBarWidth / (interval * this.unitWidth);
      const scaleOffset = lowerScale / 3; //(higherScale - lowerScale) / 10;

      return Math.min(1, (curScale - lowerScale) / scaleOffset);
    }
  }

  getLocation(ol: Vec2, nl: Vec2, s: number) {
    return add2(ol, scale2(subtract2(nl, ol), s));
  }

  getThickness(ot: number, nt: number, s: number) {
    return ot + s * (nt - ot);
  }

  getBarMetrics(pos: number, width: number) {
    const curScale = this.transformScale();
    const recWidth = width * this.barShrinkFactor;

    if (this.verticalLayout) {
      const upEdge = pos - width * curScale * 0.5;
      const downEdge = pos + width * curScale * 0.5;
      const upBound = this.view.origin[1] - this.view.size[1] * curScale - this.offset;

      const posY = upEdge < upBound ?
        (downEdge + (upBound - downEdge) / 2) : pos;
      const thickness = upEdge < upBound ?
        ((downEdge - upBound) * this.barShrinkFactor) : recWidth * curScale;

      return {
        pos: posY,
        thickness
      }
    } else {
      const rightEdge = pos + width * curScale * 0.5;
      const leftEdge = pos - width * curScale * 0.5;
      const rightBound = this.view.origin[0] + this.view.size[0] * curScale + this.offset;

      const posX = rightEdge > rightBound ?
        (leftEdge + (rightBound - leftEdge) / 2) : pos;
      const thickness = rightEdge > rightBound ?
        ((rightBound - leftEdge) * this.barShrinkFactor) : recWidth * curScale;

      return {
        pos: posX,
        thickness
      }
    }
  }

  layout() {
    const indices = this.getIndices(this.indexRange[0], this.indexRange[1], this.scaleLevel);
    const unit = (this.verticalLayout ? this.unitHeight : this.unitWidth);
    const curScale = this.transformScale();
    const interval = this.intervalLengths[this.scaleLevel];
    const intWidth = unit * interval;// * curScale;
    const recWidth = intWidth * this.barShrinkFactor;// * curScale;
    const origin = this.view.origin;

    if (!this.recMap.has(this.scaleLevel)) {
      this.recMap.set(this.scaleLevel, new Map<number, EdgeInstance>());
    }

    const levelMap = this.recMap.get(this.scaleLevel);

    const alpha = this.getAlpha();
    const positionScale = this.getLocationScale();

    if (this.scaleLevel === this.maxLevel) {
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];
        const bar = levelMap.get(index);
        const barHeight = this.getData(this.scaleLevel, index);

        let pos = this.verticalLayout ?
          origin[1] - (index + 0.5) * intWidth * curScale - this.offset :
          origin[0] + (index + 0.5) * intWidth * curScale + this.offset;
        const barMetrics = this.getBarMetrics(pos, intWidth);
        pos = barMetrics.pos;


        const thickness = barMetrics.thickness;

        if (bar) {
          const color: Color = [
            bar.startColor[0],
            bar.startColor[1],
            bar.startColor[2],
            alpha
          ];

          bar.start = this.verticalLayout ?
            [origin[0], pos] :
            [pos, bar.start[1]];

          bar.end = this.verticalLayout ?
            [origin[0] + barHeight, pos] :
            [pos, bar.end[1]];

          bar.setColor(color);
          bar.setEdgeThickness(thickness);

          this.providers.bars.add(bar);
        } else {
          const color: Color = [Math.random(), Math.random(), Math.random(), alpha];

          const bar = new EdgeInstance({
            start:
              this.verticalLayout ?
                [origin[0], pos] :
                [pos, origin[1]],
            end:
              this.verticalLayout ?
                [origin[0] + barHeight, pos] :
                [pos, origin[1] - barHeight],
            thickness: [thickness, thickness],
            startColor: color,
            endColor: color,
          })

          this.providers.bars.add(bar);
          levelMap.set(index, bar);
        }
      }
    } else {
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];

        const j = index - Math.floor(index / this.childrenNumber) * this.childrenNumber;

        const parentIndex = Math.floor(index / this.childrenNumber);
        const parentInterval = this.intervalLengths[this.scaleLevel + 1];
        const parentIntWidth = parentInterval * unit;

        let parentPos = this.verticalLayout ?
          this.view.origin[1] - (parentIndex + 0.5) * parentIntWidth * curScale - this.offset :
          this.view.origin[0] + (parentIndex + 0.5) * parentIntWidth * curScale + this.offset;

        const parentBarMetrics = this.getBarMetrics(parentPos, parentIntWidth);
        parentPos = parentBarMetrics.pos;
        const parentWidth = parentBarMetrics.thickness;
        const parentBarHeight = this.getData(this.scaleLevel + 1, parentIndex);

        const start = this.verticalLayout ?
          parentPos + parentWidth * this.barShrinkFactor * 0.5 :
          parentPos - parentWidth * this.barShrinkFactor * 0.5;
        let bar = levelMap.get(index);

        const barHeight = this.getData(this.scaleLevel, index);

        const childrenNumber =
          Math.ceil(parentWidth / (intWidth * this.barShrinkFactor * curScale));
        const startWidth = parentWidth / childrenNumber;

        const pos = this.verticalLayout ?
          this.view.origin[1] - (index + 0.5) * intWidth * curScale - this.offset :
          this.view.origin[0] + (index + 0.5) * intWidth * curScale + this.offset;

        const metrics = this.getBarMetrics(pos, intWidth);
        const endWidth = metrics.thickness;

        const sx = start + (j + 0.5) * startWidth;
        const ex = metrics.pos;
        // const ex = this.view.origin[0] + (index + 0.5) * intWidth * curScale + this.offset;

        const sy = start - (j + 0.5) * startWidth;
        const ey = metrics.pos;

        const startLoc = this.verticalLayout ?
          this.getLocation(
            [this.view.origin[0], sy],
            [this.view.origin[0], ey],
            positionScale
          ) :
          this.getLocation(
            [sx, this.view.origin[1]],
            [ex, this.view.origin[1]],
            positionScale
          );

        const endLoc = this.verticalLayout ?
          this.getLocation(
            [this.view.origin[0] + parentBarHeight, sy],
            [this.view.origin[0] + barHeight, ey],
            positionScale
          ) :
          this.getLocation(
            [sx, this.view.origin[1] - parentBarHeight],
            [ex, this.view.origin[1] - barHeight],
            positionScale
          )

        const thickness = this.verticalLayout ?
          this.getThickness(
            startWidth,
            endWidth * this.barShrinkFactor,
            positionScale
          ) :
          this.getThickness(
            startWidth,
            endWidth * this.barShrinkFactor,
            positionScale
          )

        if (bar) {
          const color: Color = [
            bar.startColor[0],
            bar.startColor[1],
            bar.startColor[2],
            1
          ];

          bar.start = startLoc;
          bar.end = endLoc;
          bar.setColor(color);
          bar.setEdgeThickness(thickness);
          this.providers.bars.add(bar);
        } else {
          const color: Color = [Math.random(), Math.random(), Math.random(), 1];

          bar = new EdgeInstance({
            start: startLoc,
            end: endLoc,
            thickness: [thickness, thickness],
            startColor: color,
            endColor: color
          })

          this.providers.bars.add(bar);
          levelMap.set(index, bar);
        }
      }
    }
  }

  removeBars(start: number, end: number, lowerLevel: number, higherLevel: number) {
    const indices = this.getIndices(start, end, this.preScaleLevel);
    const levelMap = this.recMap.get(this.preScaleLevel);

    if (levelMap) {
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];

        if (levelMap.has(index)) {
          const bar = levelMap.get(index);
          this.providers.bars.remove(bar);
        }
      }
    } else {
      this.recMap.set(this.preScaleLevel, new Map<number, EdgeInstance>());
    }

  }

  clearRange(start: number, end: number) {
    if (this.preScaleLevel !== this.scaleLevel) {
      this.removeBars(start, end, this.preScaleLevel, this.preScaleLevel)
    }
  }

  updateIndexRange() {
    const curScale = this.transformScale();
    const unit = this.verticalLayout ? this.unitHeight * curScale : this.unitWidth * curScale;
    const interval = this.intervalLengths[this.scaleLevel];
    const intWidth = interval * unit;

    // const gap = (intWidth - this.maxBarWidth * this.barShrinkFactor) * 0.5;
    const gap = intWidth * (1 - this.barShrinkFactor) * 0.5;

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

    this.indexRange = [start, end];

    this.clearRange(start, end);
  }

  removeAll() {
    const levelMap = this.recMap.get(this.scaleLevel);

    if (levelMap) {
      const indices = this.getIndices(this.indexRange[0], this.indexRange[1], this.scaleLevel);
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];
        if (levelMap.has(index)) {
          const rec = levelMap.get(i);
          this.providers.bars.remove(rec);
        }
      }

    }
  }

  changeAxis() {
    this.verticalLayout = !this.verticalLayout;
    this.indexRange = [0, this.unitNumber - 1];
    this.initMetrics();
    this.removeAll();
    this.scaleLevel = 0;
    this.updateInterval();
    this.updateMask();
    this.layout();
  }

}