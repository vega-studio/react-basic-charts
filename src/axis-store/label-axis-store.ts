import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";

export interface ILabelAxisStoreOptions<T extends string> extends IBasicAxisStoreOptions<T> {
  /** Sets the labels to show for the axis */
  labels: string[];
  /** Sets the max amount of letters in a label */
  maxLabelLength?: number;
  /** Sets the number of children buckets in each bucket to fade in when zoom in */
  childrenNumber?: number;
}

export class LabelAxisStore<T extends string> extends BasicAxisStore<string> {
  private labels: string[];
  private maxLabelLength: number = 10;
  private childrenNumber: number;

  constructor(options: ILabelAxisStoreOptions<T>) {
    super(options);
  }

  initIndexRange(options: ILabelAxisStoreOptions<T>) {
    this.labels = options.labels;
    this.maxLabelLength = options.maxLabelLength || this.maxLabelLength;
    this.unitNumber = this.labels.length;

    this.preSetMaxWidth = this.getPreSetWidth();
    this.preSetMaxHeight = this.getPreSetHeight();

    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];

    this.childrenNumber = options.childrenNumber || 2;

    this.labelScaleLevel = 0;
    this.preLabelScaleLevel = 0;
    this.tickScaleLevel = 0;
    this.preTickScaleLevel = 0;

    this.generateIntervalLengths();
  }

  getPreSetWidth() {
    let maxLength = 0;
    this.labels.forEach(label => maxLength = Math.max(maxLength, label.length));
    return maxLength * this.labelFontSize / 2;
  }

  getPreSetHeight() {
    return this.labelFontSize;
  }

  getMainLabel(index: number): string {
    const text = this.labels[index];

    if (text.length > this.maxLabelLength) {
      return text.substr(0, this.maxLabelLength).concat("...")
    }

    return text;
  }

  getSubLabel(): string {
    return "";
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

  posToDomain(pos: number): string {
    const maxRange = this.maxRange;
    pos = Math.min(Math.max(pos, maxRange[0]), maxRange[1]);
    const curScale = this.transformScale();
    const unit = curScale * (this.verticalLayout ? this.unitHeight : this.unitWidth);
    let index = Math.floor((pos - maxRange[0]) / unit);
    index = Math.min(index, this.labels.length - 1);
    return this.labels[index];
  }

  async setAtlasLabel() {
    let letterCombination = "";
    const set: Set<string> = new Set<string>();

    for (let i = 0; i < this.labels.length; i++) {
      const label = this.labels[i];

      for (let j = 0; j < label.length - 1; j++) {
        const comb = label.substr(j, 2);

        if (!set.has(comb)) {
          letterCombination += comb;
          set.add(comb);
        }
      }
    }

    set.clear();

    await this.labelReady(letterCombination);
  }

}