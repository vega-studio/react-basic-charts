import { BasicAxisStore, IBasicAxisStoreOptions } from "./basic-axis-store";
import moment from "moment";
import { getSimpleIntervalLengths, getSimpleIndices, getSimpleMomentLevel } from "src/util/dateUtil";
import { Vec2 } from "deltav";
import { Bucket } from "./bucket";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface IDateAxisStoreOptions<T extends Date> extends IBasicAxisStoreOptions<T> {
  /** Sets the start date to show in the axis */
  startDate?: Date | string;
  /** Sets the end date to show in the axis */
  endDate?: Date | string;
}

export class DateAxisStore<T extends Date> extends BasicAxisStore<Date> {
  private startDate: Date;
  private endDate: Date;
  private totalYears: number;

  constructor(options: IDateAxisStoreOptions<T>) {
    super(options);
  }

  getMainLabel(index: number): string {
    const startDate = this.startDate;
    const currentDate = moment(startDate).add(index, 'milliseconds').toDate();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const second = currentDate.getSeconds();
    const ms = currentDate.getMilliseconds();

    if (month === 0 && day === 1 && hour === 0 && minute === 0 && second === 0 && ms === 0) {
      return `${year}`;
    } else if (hour === 0 && minute === 0 && second === 0 && ms === 0) {
      return `${monthNames[month]} ${day}`
    } else if (ms === 0) {
      return `${hour}:${minute < 10 ? '0' : ''}${minute}:${second < 10 ? '0' : ''}${second}`;
    }

    return `${ms} ms`;
  }

  getSubLabel(index: number): string {
    const startDate = this.startDate;
    const currentDate = moment(startDate).add(index, 'milliseconds').toDate();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const second = currentDate.getSeconds();
    const ms = currentDate.getMilliseconds();

    if (hour === 0 && minute === 0 && second === 0 && ms === 0) {
      return `${year}`
    } else if (ms === 0) {
      return `${monthNames[month]} ${day}`
    }

    return `${hour}:${minute < 10 ? '0' : ''}${minute}:${second < 10 ? '0' : ''}${second}`;

  }

  getPreSetWidth(): number {
    return 4 * this.labelFontSize;
  }

  getPreSetHeight(): number {
    return this.labelFontSize;
  }

  generateIntervalLengths() {
    this.intervalLengths = getSimpleIntervalLengths(this.startDate, this.endDate);
    let level = Math.floor(Math.log2(this.totalYears));
    let daysInAYearLabel = this.intervalLengths[this.intervalLengths.length - 1];

    while (level > 0) {
      daysInAYearLabel *= 2;
      this.intervalLengths.push(daysInAYearLabel);
      level--;
    }
  }

  initIndexRange(options: IDateAxisStoreOptions<Date>) {
    const startDate = options.startDate;
    const endDate = options.endDate;
    this.startDate = typeof startDate === "string" ? new Date(startDate) : startDate;
    this.endDate = typeof endDate === "string" ? new Date(endDate) : endDate;
    this.unitNumber = moment(this.endDate).diff(moment(this.startDate), 'milliseconds') + 1;
    this.totalYears = this.endDate.getFullYear() - this.startDate.getFullYear();
    this.labelScaleLevel = 0;
    this.preLabelScaleLevel = 0;
    this.tickScaleLevel = 0;
    this.preTickScaleLevel = 0;

    if (this.startDate.getMonth() == 0 && this.startDate.getDate() === 1) {
      this.totalYears += 1;
    }

    this.generateIntervalLengths();
    this.preSetMaxWidth = this.getPreSetWidth();
    this.preSetMaxHeight = this.getPreSetHeight();
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];
  }

  getMaxLevel() {
    return (this.totalYears >= 1 ? Math.floor(Math.log2(this.totalYears)) : 0) + 12;
  }

  getAlphas() {
    let maxBucketSize = this.verticalLayout ?
      this.maxLabelHeight === 0 ? this.preSetMaxHeight : this.maxLabelHeight :
      (this.maxLabelWidth === 0 ? this.preSetMaxWidth : this.maxLabelWidth) * 0.8;

    const unit = this.verticalLayout ? this.unitHeight : this.unitWidth;

    const curScale = this.transformScale();
    const labelLowerScale = maxBucketSize / (unit * this.interval);
    const labelHigherScale = Math.min(
      this.verticalLayout ? 1.2 * labelLowerScale : 10 * labelLowerScale,
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

  getIndexLevel(index: number) {
    const day = moment(this.startDate).add(index, 'milliseconds').toDate();
    return getSimpleMomentLevel(this.startDate, day, this.totalYears);
  }

  getIndices(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const sd = moment(this.startDate).add(start, 'milliseconds').toDate();
    const ed = moment(this.startDate).add(end, 'milliseconds').toDate();
    return getSimpleIndices(this.startDate, this.totalYears, sd, ed, lowerLevel, higherLevel);
  }

  posToDomain(pos: number): Date {
    const maxRange = this.maxRange;
    pos = Math.min(Math.max(pos, maxRange[0]), maxRange[1]);
    const curScale = this.transformScale();
    const unit = curScale * (this.verticalLayout ? this.unitHeight : this.unitWidth);
    let index = Math.floor((pos - maxRange[0]) / unit);
    const time = moment(this.startDate).add(index, 'milliseconds').toDate();

    return time;
  }

  setLabel(index: number, position: Vec2, alpha: number) {
    const {
      labelPadding,
      labelFontSize
    } = this;

    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];

    const day = moment(this.startDate).add(index, 'milliseconds').toDate();
    const startMoment = new Date(day);
    startMoment.setMonth(0, 1);
    startMoment.setHours(0, 0, 0, 0);
    const atStartMoment = moment(day).isSame(startMoment);

    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.mainLabel) {
          bucket.updateMainLabel(position, alpha, labelPadding, this.verticalLayout);
        } else {
          const text = this.getMainLabel(index);
          bucket.createMainLabel(text, position, alpha, labelPadding, this.verticalLayout, this.onLabelReady);
        }

        if (bucket.subLabel) {
          bucket.updateSubLabel(position, alpha, labelPadding + labelFontSize, this.verticalLayout);
        } else if (!atStartMoment) {
          const text = this.getSubLabel(index);
          bucket.createSubLabel(text, position, alpha, labelPadding + labelFontSize, this.verticalLayout)
        }

        if (!bucket.showLabels) {
          bucket.showLabels = true;
          this.providers.labels.add(bucket.mainLabel);
          if (bucket.subLabel && !this.verticalLayout) this.providers.labels.add(bucket.subLabel);
        }
      } else {
        const bucket: Bucket = new Bucket({
          labelColor: this.labelColor,
          labelFontSize: this.labelFontSize,
          tickColor: this.tickColor,
          tickLength: this.tickLength,
          tickWidth: this.tickWidth,
          onMainLabelInstance: this.mainLabelHandler,
          onSubLabelInstance: this.subLabelHandler,
          onTickInstance: this.tickHandler
        })

        const text = this.getMainLabel(index);
        bucket.createMainLabel(text, position, alpha, labelPadding, this.verticalLayout, this.onLabelReady);

        if (
          !this.verticalLayout &&
          !atStartMoment
        ) {
          bucket.createSubLabel(text, position, alpha, labelPadding + labelFontSize, this.verticalLayout);
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.mainLabel);
          this.providers.labels.add(bucket.subLabel);
        } else {
          this.bucketMap.set(index, bucket);
          this.providers.labels.add(bucket.mainLabel);
        }
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          this.providers.labels.remove(bucket.mainLabel);
          if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
        }
      }
    }
  }

  setRange(startDate: string | Date, endDate: string | Date) {
    // Update start and end date
    this.startDate = typeof startDate === "string" ? new Date(startDate) : startDate;
    this.endDate = typeof endDate === "string" ? new Date(endDate) : endDate;
    this.totalYears = this.endDate.getFullYear() - this.startDate.getFullYear();

    if (
      this.startDate.getMonth() == 0 &&
      this.startDate.getDate() === 1 &&
      this.startDate.getHours() === 0 &&
      this.startDate.getMinutes() === 0 &&
      this.startDate.getSeconds() === 0 &&
      this.startDate.getMilliseconds() === 0
    ) {
      this.totalYears += 1;
    }

    // Update unit number and related
    this.unitNumber = moment(this.endDate).diff(moment(this.startDate), 'milliseconds') + 1;
    this.indexRange = [0, this.unitNumber - 1];
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.maxLabelWidth = 0;
    this.maxLabelHeight = 0;
    this.labelScaleLevel = 0;
    this.preLabelScaleLevel = 0;
    this.tickScaleLevel = 0;
    this.preTickScaleLevel = 0;
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  async setAtlasLabel() {
    let dateElement = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC";
    const numberElement = "0123456789";

    for (let i = 0; i < numberElement.length; i++) {
      for (let j = 0; j < numberElement.length; j++) {
        dateElement += numberElement[i] + numberElement[j];
      }

      dateElement += `${numberElement[i]}ms`;
    }

    return this.labelReady(dateElement);
  }

  updateInterval() {
    this.preTickScaleLevel = this.tickScaleLevel;
    this.preLabelScaleLevel = this.labelScaleLevel;

    this.interval = this.intervalLengths[this.labelScaleLevel];
    this.lowerInterval = this.labelScaleLevel === 0 ?
      0 : this.intervalLengths[this.labelScaleLevel - 1];
    const curScale = this.transformScale();
    const unit = (this.verticalLayout ? this.unitHeight : this.unitWidth) * curScale;

    let maxValue = this.verticalLayout ?
      this.maxLabelHeight > 0 ? this.maxLabelHeight : this.preSetMaxHeight :
      (this.maxLabelWidth > 0 ? this.maxLabelWidth : this.preSetMaxWidth) * 0.8;

    if (this.interval * unit < maxValue) {
      while (this.interval * unit < maxValue) {
        this.labelScaleLevel++;
        this.interval = this.intervalLengths[this.labelScaleLevel];
        this.lowerInterval = this.intervalLengths[this.labelScaleLevel - 1];
      }
    } else {
      while (this.lowerInterval * unit > maxValue && this.interval * unit >= maxValue) {
        this.labelScaleLevel--;
        this.interval = this.intervalLengths[this.labelScaleLevel];
        this.lowerInterval = this.labelScaleLevel === 0 ?
          0 : this.intervalLengths[this.labelScaleLevel - 1];
      }
    }

    this.labelScaleLevel = Math.min(this.labelScaleLevel, this.intervalLengths.length - 1);
    this.tickScaleLevel = Math.max(this.labelScaleLevel - 1, 0);
  }

}