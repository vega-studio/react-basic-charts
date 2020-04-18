import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
import { Vec2 } from "deltav";

export interface INumberAxisStoreOptions<T extends number> extends IBasicAxisStoreOptions<number> {
  /** Sets the number range to show in the axis */
  numberRange: Vec2;
  /** Sets the difference between every number in the axis */
  numberGap?: number;
  /** Sets the max length of decimal if a number is a float number */
  decimalLength?: number;
  /** Sets the number of children buckets in each bucket to fade in when zoom in */
  childrenNumber?: number;
}

export class NumberAxisStore<T extends number> extends BasicAxisStore<number> {
  private numberRange: Vec2;
  private numberGap: number;
  private childrenNumber: number;
  private decimalLength: number;

  constructor(options: INumberAxisStoreOptions<T>) {
    super(options);
  }

  initIndexRange(options: INumberAxisStoreOptions<T>) {
    this.numberRange = options.numberRange;
    this.numberGap = options.numberGap || 1;
    this.childrenNumber = options.childrenNumber || 2;
    this.decimalLength = options.decimalLength || -1;
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
    this.preSetMaxWidth = this.getPreSetWidth();
    this.preSetMaxHeight = this.getPreSetHeight();
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];

    this.generateIntervalLengths();
  }

  getPreSetWidth() {
    const startString = this.decimalLength !== -1 ?
      this.numberRange[0].toFixed(this.decimalLength) : this.numberRange[0].toString();
    const endString = this.decimalLength !== -1 ?
      this.numberRange[1].toFixed(this.decimalLength) : this.numberRange[1].toString();
    return Math.max(startString.length, endString.length) * this.labelFontSize / 2;
  }

  getPreSetHeight() {
    return this.labelFontSize;
  }

  getMainLabel(index: number): string {
    const number = this.numberRange[0] + index * this.numberGap;
    if (number % 1 !== 0 && this.decimalLength !== -1) return number.toFixed(this.decimalLength);
    return number.toString();
  }

  getSubLabel(): string {
    return "";
  }

  getAlphas() {
    const maxBucketSize = this.verticalLayout ?
      this.maxLabelHeight === 0 ? this.preSetMaxHeight : this.maxLabelHeight :
      this.maxLabelWidth === 0 ? this.preSetMaxWidth : this.maxLabelWidth;
    const unit = this.verticalLayout ? this.unitHeight : this.unitWidth;
    const curScale = this.transformScale();
    const labelLowerScale = maxBucketSize / (unit * this.interval);
    const labelHigherScale = Math.min(
      this.verticalLayout ? 10 * labelLowerScale : 1.2 * labelLowerScale,
      maxBucketSize / (this.unitWidth * this.lowerInterval)
    );
    const labelAlphaScale = Math.min(Math.max(curScale, labelLowerScale), labelHigherScale);
    const labelAlpha = (labelAlphaScale - labelLowerScale) / (labelHigherScale - labelLowerScale);
    const tickAlpha = this.labelScaleLevel === 0 ? 1 : labelAlpha;

    return {
      labelAlpha,
      tickAlpha
    }
  }

  getMaxLevel() {
    return this.intervalLengths.length - 1;
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

  getIndexLevel(index: number) {
    if (index === 0) return Math.floor(Math.log2(this.unitNumber) / Math.log2(this.childrenNumber));
    let level = 0;

    while (index % this.childrenNumber === 0) {
      index = index / this.childrenNumber;
      level++;
    }

    return level;
  }

  getIndices(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const indices: number[] = [];
    const maxLevel = Math.floor(Math.log2(this.unitNumber) / Math.log2(this.childrenNumber));
    higherLevel = higherLevel || maxLevel;

    for (let level = lowerLevel; level <= higherLevel; level++) {
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

  posToDomain(pos: number): number {
    const numberRange = this.numberRange;
    const maxRange = this.maxRange;
    const posScale = (pos - maxRange[0]) / (maxRange[1] - maxRange[0]);
    return posScale * (numberRange[1] - numberRange[0]) + numberRange[0];
  }

  setRange(start: number, end: number) {
    this.numberRange = [start, end];
    this.unitNumber = Math.floor((this.numberRange[1] - this.numberRange[0]) / this.numberGap) + 1;
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.maxLabelWidth = 0;
    this.maxLabelHeight = 0;
    this.removeAll();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  async setAtlasLabel() {
    const numberElements = "0123456789-.e"
    let numberCombination = "";
    for (let i = 0; i < numberElements.length; i++) {
      for (let j = 0; j < numberElements.length; j++) {
        numberCombination += numberElements[i] + numberElements[j];
      }
    }
    await this.labelReady(numberCombination);
  }

}