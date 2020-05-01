import { BasicBarStore, IBasicBarStoreOptions } from "./basic-bar-store";
import { EdgeInstance, Color } from "deltav";

export interface ILabelBarStoreOptions extends IBasicBarStoreOptions {
  labelNumber: number;
}

export class LabelBarStore extends BasicBarStore {
  constructor(options: ILabelBarStoreOptions) {
    super(options);
    this.unitNumber = options.labelNumber;
    this.init();
  }

  getIndices(start: number, end: number) {
    const indices = [];

    for (let i = start; i <= end; i++) {
      indices.push(i);
    }

    return indices;
  }

  getAlpha() {
    return 1;
  }

  layout() {
    const curScale = this.transformScale();
    const origin = this.view.origin;
    // const barWidth = (this.verticalLayout ? this.maxBarWidth : this.maxBarHeight) * this.barShrinkFactor;
    const barWidth = (this.verticalLayout ? this.unitHeight : this.unitWidth) * this.barShrinkFactor * curScale;

    const indices = this.getIndices(this.indexRange[0], this.indexRange[1]);
    const alpha = this.getAlpha();

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      const bar = this.barMap.get(index);
      const level = this.getIndexLevel(index);
      const barAlpha = level >= this.scaleLevel + 1 ? 1 : alpha;
      // 

      if (bar) {
        const color: Color = [bar.startColor[0], bar.startColor[1], bar.startColor[2], barAlpha];

        bar.start = this.verticalLayout ?
          [origin[0], origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1]];

        bar.end = this.verticalLayout ?
          [bar.end[0], origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
          [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, bar.end[1]];

        bar.setColor(color);
        bar.setEdgeThickness(barWidth);

        this.providers.bars.add(bar);
      } else {
        const barHeight = this.generateData(index);
        const color: Color = [Math.random(), Math.random(), Math.random(), barAlpha];

        const bar = new EdgeInstance({
          start: this.verticalLayout ?
            [origin[0], origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
            [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1]],
          end: this.verticalLayout ?
            [origin[0] + barHeight, origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
            [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1] - barHeight],
          thickness: [barWidth, barWidth],
          startColor: color,
          endColor: color,
        })

        this.providers.bars.add(bar);
        this.barMap.set(index, bar);
      }

    }

  }

  removeBars(start: number, end: number, _lowerLevel: number, _higherLevel: number) {
    const indices = this.getIndices(start, end);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.barMap.has(index)) {
        const bar = this.barMap.get(index);
        this.providers.bars.remove(bar);
      }
    }
  }

  clearRange(start: number, end: number) {
    this.removeBars(start, end, this.preScaleLevel, this.scaleLevel - 1);
  }
}