import { EdgeInstance, LabelInstance, Vec2, Vec4, AnchorType } from "deltav";

export interface IBucketOptions {
  /** Sets the color of labels in the bucket */
  labelColor?: Vec4;
  /** Sets the fontSize of labels in the bucket */
  labelFontSize?: number;
  /** Sets the color of the tick in the bucket */
  tickColor: Vec4;
  /** Sets the length of thie tick in the bucket */
  tickLength?: number;
  /** Sets the thickness of tick in the bucket  */
  tickWidth?: number;
  /** Callback for the main labelInstance */
  onMainLabelInstance: (instance: LabelInstance) => void;
  /** Callback for the sub labelInstance */
  onSubLabelInstance: (instance: LabelInstance) => void;
  /** Callback for the tickInstance */
  onTickInstance: (instance: EdgeInstance) => void;
}


export class Bucket {
  showLabels: boolean = true;
  showTick: boolean = true;
  tick: EdgeInstance;
  mainLabel: LabelInstance;
  subLabel: LabelInstance;

  private labelColor: Vec4 = [1, 1, 1, 1];
  private labelFontSize: number = 12;
  private tickColor: Vec4 = [1, 1, 1, 1];
  private tickLength: number = 10;
  private tickWidth: number = 1;

  onTickInstance: (instance: EdgeInstance) => void;
  onMainLabelInstance: (instance: LabelInstance) => void;
  onSubLabelInstance: (instance: LabelInstance) => void;

  constructor(options: IBucketOptions) {
    this.labelColor = options.labelColor || this.labelColor;
    this.labelFontSize = options.labelFontSize || this.labelFontSize;
    this.tickColor = options.tickColor || this.tickColor;
    this.tickLength = options.tickLength || this.tickLength;
    this.tickWidth = options.tickWidth || this.tickWidth;
    this.onTickInstance = options.onTickInstance;
    this.onMainLabelInstance = options.onMainLabelInstance;
    this.onSubLabelInstance = options.onSubLabelInstance;
  }

  createMainLabel(
    text: string,
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean,
    onLabelReady?: (instance: LabelInstance) => void
  ) {
    this.mainLabel = new LabelInstance({
      anchor: {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      },
      color: [this.labelColor[0], this.labelColor[1], this.labelColor[2], alpha],
      fontSize: this.labelFontSize,
      origin: position,
      text,
      onReady: (label: LabelInstance) => {
        if (onLabelReady) onLabelReady(label);
        this.onMainLabelInstance(label);
        console.warn("call back", this.onMainLabelInstance);
      }
    })
  }

  createSubLabel(
    text: string,
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean,
  ) {
    this.subLabel = new LabelInstance({
      anchor: {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      },
      color: [this.labelColor[0], this.labelColor[1], this.labelColor[2], alpha],
      fontSize: this.labelFontSize,
      origin: position,
      text,
      onReady: this.onSubLabelInstance
    })
  }

  createTick(
    position: Vec2,
    alpha: number,
    verticalLayout: boolean,
  ) {
    const {
      tickColor,
      tickLength,
      tickWidth
    } = this;

    this.tick = new EdgeInstance({
      start: position,
      end: verticalLayout ?
        [position[0] - tickLength, position[1]] :
        [position[0], position[1] + tickLength],
      thickness: [tickWidth, tickWidth],
      startColor: [tickColor[0], tickColor[1], tickColor[2], alpha],
      endColor: [tickColor[0], tickColor[1], tickColor[2], alpha]
    });

    this.onTickInstance(this.tick);
  }

  updateMainLabel(
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean
  ) {
    if (this.mainLabel) {
      this.mainLabel.origin = position;
      this.mainLabel.color = [
        this.mainLabel.color[0],
        this.mainLabel.color[1],
        this.mainLabel.color[2],
        alpha
      ];
      this.mainLabel.anchor = {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      }
    }
  }

  updateSubLabel(
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean
  ) {
    if (this.subLabel) {
      this.subLabel.origin = position;
      this.subLabel.color = [
        this.subLabel.color[0],
        this.subLabel.color[1],
        this.subLabel.color[2],
        alpha
      ];
      this.subLabel.anchor = {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      }
    }
  }

  updateTick(
    position: Vec2,
    alpha: number,
    verticalLayout: boolean
  ) {
    if (this.tick) {
      this.tick.start = position;
      this.tick.end = verticalLayout ?
        [position[0] - this.tickLength, position[1]] :
        [position[0], position[1] + this.tickLength];
      this.tick.startColor = [
        this.tick.startColor[0],
        this.tick.startColor[1],
        this.tick.startColor[2],
        alpha
      ];
      this.tick.endColor = [
        this.tick.endColor[0],
        this.tick.endColor[1],
        this.tick.endColor[2],
        alpha
      ];
    }
  }
}