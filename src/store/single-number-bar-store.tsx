import { BasicBarStore, IBasicBarStoreOptions } from "./basic-bar-store";
import { Vec2, Color, EdgeInstance } from "deltav";

export interface ISingleNumberBarStoreOptions extends IBasicBarStoreOptions {
  /** Sets the number range to show in the axis */
  numberRange: Vec2;
  /** Sets the difference between every number in the axis */
  numberGap?: number;
}

export class SingleNumberBarStore extends BasicBarStore {
  private numberRange: Vec2;
  private numberGap: number;

  constructor(options: ISingleNumberBarStoreOptions) {
    super(options);
    this.numberRange = options.numberRange;
    this.numberGap = options.numberGap || 1;
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
    this.init();
  }

  getData(_index: number) {
    return 20 + 20 * Math.random();
  }

  layout() {
    const curScale = this.transformScale();
    const origin = this.view.origin;

    const recWidth = this.unitWidth * this.barShrinkFactor;

    for (let i = this.indexRange[0]; i <= this.indexRange[1]; i++) {
      const bar = this.barMap.get(i);
      const barHeight = this.getData(i);

      if (bar) {
        bar.start = this.verticalLayout ?
          [origin[0], origin[1] - (i) * recWidth - this.offset] :
          [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, origin[1]];

        bar.end = this.verticalLayout ?
          [origin[0] + barHeight, origin[1] - (i) * recWidth - this.offset] :
          [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, bar.end[1]];

        bar.setEdgeThickness(recWidth * curScale);

        this.providers.bars.add(bar);
      } else {
        const color: Color = [Math.random(), Math.random(), Math.random(), 1];

        const bar = new EdgeInstance({
          start: this.verticalLayout ?
            [origin[0], origin[1] - (i) * recWidth - this.offset] :
            [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, origin[1]],
          end: this.verticalLayout ?
            [origin[0] + barHeight, origin[1] - (i) * recWidth - this.offset] :
            [origin[0] + (i + 0.5) * this.unitWidth * curScale + this.offset, origin[1] - barHeight],
          thickness: [recWidth * curScale, recWidth * curScale],
          startColor: color,
          endColor: color,
        })

        this.providers.bars.add(bar);
        this.barMap.set(i, bar);
      }
    }
  }

  clearRange() {
    // Do nothing
  }

  removeBars(start: number, end: number, _lowerLevel: number, _higherLevel: number) {
    for (let i = start; i <= end; i++) {
      if (this.barMap.has(i)) {
        const bar = this.barMap.get(i);
        this.providers.bars.remove(bar);
      }
    }
  }
}