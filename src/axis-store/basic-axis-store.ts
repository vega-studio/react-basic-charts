import { Color, Vec2, InstanceProvider, EdgeInstance, LabelInstance, Vec3, AnchorType } from "deltav";
import { Bucket } from "./bucket";
import { HorizonRangeLayout, VerticalRangeLayout, AxisDataType } from "src/types";
import moment from "moment";

export interface IBasicAxisStoreOptions<T extends number | string | Date> {
  /** Sets whether the axis displays range labels */
  displayRangeLabels?: boolean;
  /** Sets the color of labels */
  labelColor?: Color;
  /** Sets the fontsize of labels */
  labelFontSize?: number;
  /** Sets the padding value of labels */
  labelPadding?: number;
  /** Sets the provides for ticks and labels */
  providers?: {
    ticks?: InstanceProvider<EdgeInstance>,
    labels?: InstanceProvider<LabelInstance>
  };
  /** Indicates whether the axis resize with window size changing  */
  resizeWithWindow?: boolean;
  /** Sets the color of ticks */
  tickColor?: Color;
  /** Sets the length of ticks */
  tickLength?: number;
  /** Sets the thickness of the ticks */
  tickWidth?: number;
  /** Indicates the side of range labels in horizon mode. Can be ABOVE or BELOW*/
  horizonRangeLayout?: HorizonRangeLayout;
  /** Indicates the side of range labels in vertical mode. Can be LEFT or RIGHT*/
  verticalRangeLayout?: VerticalRangeLayout;
  /** Indicates whether the axis layouts in vertical direction */
  verticalLayout?: boolean;
  /** Sets the origin and size([width, height]) of the axis*/
  view: {
    origin: Vec2;
    size: Vec2;
  };
  /** Callback to set range labels */
  onDisplayRange?: (displayRange: [T, T]) => [string, string];
  /** Callback when the tickInstances are ready */
  onTickInstance?: (instance: EdgeInstance) => void;
  /** Callback when the main labelInstances are ready */
  onMainLabelInstance?: (instance: LabelInstance) => void;
  /** Callback when the sub labelInstances are ready */
  onSubLabelInstance?: (instance: LabelInstance) => void;
}


export abstract class BasicAxisStore<T extends number | string | Date> {
  // Layout options
  protected verticalLayout: boolean = true;
  private resizeWithWindow: boolean = true;
  private displayRangeLabels: boolean = true;
  private horizonRangeLayout: HorizonRangeLayout = HorizonRangeLayout.ABOVE;
  private verticalRangeLayout: VerticalRangeLayout = VerticalRangeLayout.LEFT;

  // Axis Metrics
  protected view: {
    origin: Vec2;
    size: Vec2;
  }
  private windowWidth: number;
  private windowHeight: number;

  // Tick Metrics
  protected tickWidth: number = 1;
  protected tickLength: number = 10;
  protected tickColor: Color = [1, 1, 1, 1];

  // Label Metrics
  protected labelFontSize: number = 12;
  protected labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  protected labelPadding: number = 10;
  protected maxLabelWidth: number = 0;
  protected maxLabelHeight: number = 0;
  protected preSetMaxWidth: number = 0;
  protected preSetMaxHeight: number = 0;

  // Levels and intervals
  protected tickScaleLevel: number;
  protected labelScaleLevel: number;
  protected preTickScaleLevel: number;
  protected preLabelScaleLevel: number;
  protected intervalLengths: number[];

  // View Range
  protected maxRange: Vec2;
  protected viewRange: Vec2;
  protected indexRange: Vec2 = [-1, -1];
  protected unitNumber: number = 0;
  protected unitWidth: number;
  protected unitHeight: number;
  private offset: number = 0;
  private scale: number = 1;

  // Private
  protected bucketMap: Map<number, Bucket> = new Map<number, Bucket>();
  private auxLines: EdgeInstance[] = [];
  private headLabel: LabelInstance;
  private tailLabel: LabelInstance;

  // Interval info
  protected interval: number = 1;
  protected lowerInterval: number = 0;

  providers = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  mainLabelHandler = (_label: LabelInstance) => { };
  subLabelHandler = (_label: LabelInstance) => { };
  tickHandler = (_tick: EdgeInstance) => { };

  rangeHandler = (values: [T, T]) => {
    if (typeof values[0] === 'number' && typeof values[1] === 'number') {
      return [values[0].toFixed(2), values[1].toFixed(2)] as [string, string];
    } else if (
      values[0] instanceof Date && values[1] instanceof Date
    ) {
      return [
        moment(values[0]).format("MMM DD YYYY, kk:mm:ss"),
        moment(values[1]).format("MMM DD YYYY, kk:mm:ss")
      ]
    } else if (
      typeof values[0].toString === 'function' &&
      typeof values[1].toString === 'function'
    ) {
      return [values[0].toString(), values[1].toString()] as [string, string];
    }

    return ["", ""] as [string, string];
  };

  labelReady = (text: string) => new Promise((resolve) => {
    const atlasLabel = new LabelInstance({
      text,
      fontSize: this.labelFontSize,
      origin: [-100, -100],
      color: [0, 0, 0, 0],
      onReady: () => {
        resolve(text);
      }
    })

    this.providers.labels.add(atlasLabel);
  })

  constructor(options: IBasicAxisStoreOptions<T>) {
    this.view = options.view;
    this.tickColor = options.tickColor || this.tickColor;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.tickLength = options.tickLength || this.tickLength;
    this.labelFontSize = options.labelFontSize || this.labelFontSize;
    this.labelColor = options.labelColor || this.labelColor;
    this.labelPadding = options.labelPadding || this.labelPadding;
    this.verticalLayout = options.verticalLayout !== undefined ?
      options.verticalLayout : this.verticalLayout;
    this.resizeWithWindow = options.resizeWithWindow !== undefined ?
      options.resizeWithWindow : this.resizeWithWindow;
    this.displayRangeLabels = options.displayRangeLabels !== undefined ?
      options.displayRangeLabels : this.displayRangeLabels;
    this.horizonRangeLayout = options.horizonRangeLayout || this.horizonRangeLayout;
    this.verticalRangeLayout = options.verticalRangeLayout || this.verticalRangeLayout;
    this.labelScaleLevel = 0;
    this.preLabelScaleLevel = 0;
    this.tickScaleLevel = 0;
    this.preTickScaleLevel = 0;
    this.intervalLengths = [];

    this.rangeHandler = options.onDisplayRange || this.rangeHandler;
    this.mainLabelHandler = options.onMainLabelInstance || this.mainLabelHandler;
    this.subLabelHandler = options.onSubLabelInstance || this.subLabelHandler;
    this.tickHandler = options.onTickInstance || this.tickHandler;

    Object.assign(this.providers, options.providers);

    this.initIndexRange(options);
    this.init();
  }

  abstract async setAtlasLabel(): Promise<any>;
  abstract getMainLabel(index: number): string;
  abstract getSubLabel(index: number): string;
  abstract getPreSetWidth(): number;
  abstract getPreSetHeight(): number;
  abstract getIndexLevel(index: number): number;
  abstract getIndices(start: number, end: number, lowerLevel: number, higherLevel: number): number[];
  abstract getAlphas(): { labelAlpha: number; tickAlpha: number };
  abstract getMaxLevel(): number;
  abstract generateIntervalLengths(): void;
  abstract initIndexRange(options: IBasicAxisStoreOptions<T>): void;
  abstract posToDomain(pos: number): T;

  changeAxis() {
    this.verticalLayout = !this.verticalLayout;
    this.indexRange = [0, this.unitNumber - 1];
    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  drawAuxilaryLines() {
    const origin = this.view.origin;
    const size = this.view.size;

    if (this.auxLines.length === 0) {
      const line1 = new EdgeInstance({
        start: origin,
        end: this.verticalLayout ?
          [origin[0] - 40, origin[1]] : [origin[0], origin[1] - 40],
        startColor: [1, 0, 0, 1],
        endColor: [1, 0, 0, 1]
      })

      const line2 = new EdgeInstance({
        start: this.verticalLayout ?
          [origin[0], origin[1] - size[1]] : [origin[0] + size[0], origin[1]],
        end: this.verticalLayout ?
          [origin[0] - 40, origin[1] - size[1]] : [origin[0] + size[0], origin[1] - 40],
        startColor: [1, 0, 0, 1],
        endColor: [1, 0, 0, 1]
      })

      this.auxLines.push(line1);
      this.auxLines.push(line2);
      this.providers.ticks.add(line1);
      this.providers.ticks.add(line2);
    } else {
      this.auxLines[0].start = origin;
      this.auxLines[0].end = this.verticalLayout ?
        [origin[0] - 40, origin[1]] : [origin[0], origin[1] - 40];
      this.auxLines[1].start = this.verticalLayout ?
        [origin[0], origin[1] - size[1]] : [origin[0] + size[0], origin[1]];
      this.auxLines[1].end = this.verticalLayout ?
        [origin[0] - 40, origin[1] - size[1]] : [origin[0] + size[0], origin[1] - 40];

      this.providers.ticks.add(this.auxLines[0]);
      this.providers.ticks.add(this.auxLines[1]);
    }
  }

  async getRangeLabels() {
    if (this.displayRangeLabels) {
      const rangeValues: [T, T] =
        [this.posToDomain(this.viewRange[0]), this.posToDomain(this.viewRange[1])];
      const values = this.rangeHandler(rangeValues);
      const headText = `${values[0]}`;
      const tailText = `${values[1]}`;

      const padding =
        this.verticalLayout ?
          this.verticalRangeLayout === VerticalRangeLayout.LEFT ?
            this.labelPadding : this.labelPadding :
          this.horizonRangeLayout === HorizonRangeLayout.BELOW ?
            this.labelPadding + 2 * this.labelFontSize : this.labelPadding;

      const headOrigin: [number, number] =
        this.verticalLayout ?
          this.verticalRangeLayout === VerticalRangeLayout.LEFT ?
            [this.view.origin[0] - padding, this.view.origin[1]] :
            [this.view.origin[0] + padding, this.view.origin[1]] :
          this.horizonRangeLayout === HorizonRangeLayout.BELOW ?
            [this.view.origin[0], this.view.origin[1] + padding] :
            [this.view.origin[0], this.view.origin[1] - padding];

      const tailOrigin: [number, number] =
        this.verticalLayout ?
          this.verticalRangeLayout === VerticalRangeLayout.LEFT ?
            [this.view.origin[0] - padding, this.view.origin[1] - this.view.size[1]] :
            [this.view.origin[0] + padding, this.view.origin[1] - this.view.size[1]] :
          this.horizonRangeLayout === HorizonRangeLayout.BELOW ?
            [this.view.origin[0] + this.view.size[0], this.view.origin[1] + padding] :
            [this.view.origin[0] + this.view.size[0], this.view.origin[1] - padding];

      const headAnchorType =
        this.verticalLayout ?
          this.verticalRangeLayout === VerticalRangeLayout.LEFT ?
            AnchorType.BottomRight : AnchorType.BottomLeft :
          this.horizonRangeLayout === HorizonRangeLayout.BELOW ?
            AnchorType.TopLeft : AnchorType.BottomLeft;

      const tailAnchorType =
        this.verticalLayout ?
          this.verticalRangeLayout === VerticalRangeLayout.LEFT ?
            AnchorType.TopRight : AnchorType.TopLeft :
          this.horizonRangeLayout === HorizonRangeLayout.BELOW ?
            AnchorType.TopRight : AnchorType.BottomRight;

      if (this.headLabel) {
        this.headLabel.anchor = {
          padding: 0,
          type: headAnchorType
        };
        this.headLabel.origin = headOrigin;
        this.headLabel.text = headText;
      } else {
        this.headLabel = new LabelInstance({
          anchor: {
            padding: 0,
            type: headAnchorType
          },
          color: [1, 1, 1, 0.5],
          fontSize: this.labelFontSize,
          text: headText,
          origin: headOrigin
        });
      }

      if (this.tailLabel) {
        this.tailLabel.text = tailText;
        this.tailLabel.anchor = {
          padding: 0,
          type: tailAnchorType
        };
        this.tailLabel.origin = tailOrigin;
      } else {
        this.tailLabel = new LabelInstance({
          anchor: {
            padding: 0,
            type: tailAnchorType
          },
          color: [1, 1, 1, 0.5],
          fontSize: this.labelFontSize,
          text: tailText,
          origin: tailOrigin
        });
      }

      this.providers.labels.add(this.headLabel);
      this.providers.labels.add(this.tailLabel);
    }

  };

  async init() {
    this.initChartMetrics();
    this.drawAuxilaryLines();
    this.updateInterval();
    await this.setAtlasLabel();
    this.layoutLabels();
  }

  initChartMetrics() {
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
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
  }

  layoutBuckets() {
    const curScale = this.transformScale();
    const alphas = this.getAlphas();
    const labelAlpha = alphas.labelAlpha;
    const tickAlpha = alphas.tickAlpha;
    const origin = this.view.origin;
    const maxLevel = this.getMaxLevel();

    const tickIndices = this.getIndices(this.indexRange[0], this.indexRange[1], this.tickScaleLevel, maxLevel);

    for (let i = 0; i < tickIndices.length; i++) {
      const index = tickIndices[i];
      const level = this.getIndexLevel(index);
      const alpha = level >= this.tickScaleLevel + 1 ? 1 : tickAlpha;
      const pos: Vec2 = this.verticalLayout ?
        [origin[0], origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
        [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1]];
      this.setTick(index, pos, alpha);
    }

    const labelIndices = this.getIndices(this.indexRange[0], this.indexRange[1], this.labelScaleLevel, maxLevel);

    for (let i = 0; i < labelIndices.length; i++) {
      const index = labelIndices[i];
      const level = this.getIndexLevel(index);
      const alpha = level >= this.labelScaleLevel + 1 ? 1 : labelAlpha;
      const pos: Vec2 = this.verticalLayout ?
        [origin[0], origin[1] - (index + 0.5) * this.unitHeight * curScale - this.offset] :
        [origin[0] + (index + 0.5) * this.unitWidth * curScale + this.offset, origin[1]];
      this.setLabel(index, pos, alpha);
    }
  }

  layoutLabels() {
    this.layoutBuckets();
    this.getRangeLabels();
  }

  onLabelReady = (label: LabelInstance) => {
    if (label.size[1] > this.maxLabelHeight) {
      this.maxLabelHeight = label.size[1];
      if (this.verticalLayout) {
        this.updateInterval();
        this.updateIndexRange();
        this.layoutBuckets();
      }
    }

    if (label.size[0] > this.maxLabelWidth) {
      this.maxLabelWidth = label.size[0];
      if (!this.verticalLayout) {
        this.updateInterval();
        this.updateIndexRange();
        this.layoutBuckets();
      }
    }
  }

  removeAll() {
    this.bucketMap.forEach(bucket => {
      if (bucket.showLabels) {
        bucket.showLabels = false;
        if (bucket.mainLabel) this.providers.labels.remove(bucket.mainLabel);
        if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
      }

      if (bucket.showTick) {
        bucket.showTick = false;
        if (bucket.tick) this.providers.ticks.remove(bucket.tick);
      }
    })

    this.bucketMap.clear();
    this.providers.labels.clear();
    this.providers.ticks.clear();
  }

  resize() {
    if (this.resizeWithWindow) {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const newOrigin: Vec2 = [
        this.view.origin[0] * newWidth / this.windowWidth,
        this.view.origin[1] * newHeight / this.windowHeight
      ];
      const newSize: Vec2 = [
        this.view.size[0] * newWidth / this.windowWidth,
        this.view.size[1] * newHeight / this.windowHeight
      ];
      this.windowWidth = newWidth;
      this.windowHeight = newHeight;

      this.setView({
        origin: newOrigin,
        size: newSize
      })
    }
  }

  removeBuckets(start: number, end: number) {
    const maxLevel = this.getMaxLevel();
    this.removeLabels(start, end, this.preLabelScaleLevel, maxLevel);
    this.removeTicks(start, end, this.preTickScaleLevel, maxLevel);
  }

  removeBucketsAtLowerLevels(start: number, end: number) {
    if (this.preLabelScaleLevel < this.labelScaleLevel) {
      this.removeLabels(start, end, this.preLabelScaleLevel, this.labelScaleLevel - 1);
    }

    if (this.preTickScaleLevel < this.tickScaleLevel) {
      this.removeTicks(start, end, this.preTickScaleLevel, this.tickScaleLevel - 1);
    }
  }

  removeLabels(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const indices = this.getIndices(start, end, lowerLevel, higherLevel);

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          if (bucket.mainLabel) this.providers.labels.remove(bucket.mainLabel);
          if (bucket.subLabel) this.providers.labels.remove(bucket.subLabel);
        }
      }
    }
  }

  removeTicks(start: number, end: number, lowerLevel: number, higherLevel?: number) {
    const indices = this.getIndices(start, end, lowerLevel, higherLevel);
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showTick) {
          bucket.showTick = false;
          if (bucket.tick) this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  setView(view: { origin: Vec2, size: Vec2 }) {
    this.view = view;
    this.unitWidth = this.view.size[0] / this.unitNumber;
    this.unitHeight = this.view.size[1] / this.unitNumber;
    this.indexRange = [0, this.unitNumber - 1];
    this.lowerInterval = 0;
    this.interval = 1;

    this.removeAll();
    this.initChartMetrics();
    this.updateInterval();
    this.drawAuxilaryLines();
    this.layoutLabels();
  }

  setTick(index: number, position: Vec2, alpha: number) {
    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];


    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.tick) {
          bucket.updateTick(position, alpha, this.verticalLayout);
        } else {
          bucket.createTick(position, alpha, this.verticalLayout);
        }

        if (!bucket.showTick) {
          bucket.showTick = true;
          this.providers.ticks.add(bucket.tick);
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

        bucket.showLabels = false;
        bucket.createTick(position, alpha, this.verticalLayout);
        this.bucketMap.set(index, bucket);
        this.providers.ticks.add(bucket.tick);
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showTick) {
          bucket.showTick = false;
          this.providers.ticks.remove(bucket.tick);
        }
      }
    }
  }

  setLabel(index: number, position: Vec2, alpha: number) {
    const inViewRange = this.verticalLayout ?
      window.innerHeight - position[1] >= this.viewRange[0] && window.innerHeight - position[1] <= this.viewRange[1] :
      position[0] >= this.viewRange[0] && position[0] <= this.viewRange[1];

    if (inViewRange) {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.mainLabel) {
          bucket.updateMainLabel(position, alpha, this.labelPadding, this.verticalLayout);
        } else {
          const text = this.getMainLabel(index);
          bucket.createMainLabel(text, position, alpha, this.labelPadding, this.verticalLayout, this.onLabelReady);
        }

        if (!bucket.showLabels) {
          bucket.showLabels = true;
          this.providers.labels.add(bucket.mainLabel);
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

        bucket.showTick = false;
        const text = this.getMainLabel(index);
        bucket.createMainLabel(
          text,
          position,
          alpha,
          this.labelPadding,
          this.verticalLayout,
          this.onLabelReady
        );

        this.bucketMap.set(index, bucket);
        this.providers.labels.add(bucket.mainLabel);
      }
    } else {
      if (this.bucketMap.has(index)) {
        const bucket = this.bucketMap.get(index);

        if (bucket.showLabels) {
          bucket.showLabels = false;
          this.providers.labels.remove(bucket.mainLabel);
        }
      }
    }
  }

  transformScale() {
    return 0.5 * Math.pow(2, this.scale);
  }

  updateIndexRange() {
    const curScale = this.transformScale();
    const unit = this.verticalLayout ? this.unitHeight * curScale : this.unitWidth * curScale;
    const start = Math.floor((this.viewRange[0] - this.maxRange[0]) / unit);
    const end = Math.ceil((this.viewRange[1] - this.maxRange[0]) / unit);
    const oldStart = this.indexRange[0];
    const oldEnd = this.indexRange[1];

    if (oldEnd < start || oldStart > end) {
      this.removeBuckets(oldStart, oldEnd);
    } else {
      if (oldEnd >= start && oldStart < start) {
        this.removeBuckets(oldStart, start);
      }

      if (oldStart <= end && oldEnd > end) {
        this.removeBuckets(end, oldEnd);
      }
    }

    this.removeBucketsAtLowerLevels(start, end);
    this.indexRange = [start, end];
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
    this.layoutLabels();
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
      this.maxLabelWidth > 0 ? this.maxLabelWidth : this.preSetMaxWidth;

    if (this.interval * unit < maxValue) {
      while (
        this.interval * unit < maxValue
      ) {
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