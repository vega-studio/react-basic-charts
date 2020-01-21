import { InstanceProvider, CircleInstance, RectangleInstance, LabelInstance, EdgeInstance, AnchorType } from "deltav";
import { Bar } from "../view/bar";

export interface IBarChartStoreOptions {
  barData: Bar[];
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  },
  width: number;
  height: number;
  maxValue: number;
}

export class BarChartStore {
  bars: Bar[];
  recLines: EdgeInstance[];
  labels: LabelInstance[];
  verticalLine: EdgeInstance;
  horizonLine: EdgeInstance;
  providers = {
    rectangles: new InstanceProvider<RectangleInstance>(),
    recLines: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>(),
    lines: new InstanceProvider<EdgeInstance>()
  }

  rectangleToBar: Map<RectangleInstance, Bar> = new Map<RectangleInstance, Bar>();
  recLineToBar: Map<EdgeInstance, Bar> = new Map<EdgeInstance, Bar>();
  labelToBar: Map<LabelInstance, Bar> = new Map<LabelInstance, Bar>();

  width: number;
  height: number;
  maxValue: number;
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  constructor(options: IBarChartStoreOptions) {
    this.recLines = [];
    this.labels = [];
    this.bars = options.barData
    this.width = options.width;
    this.height = options.height;
    this.maxValue = options.maxValue;
    this.padding = options.padding;
    this.init(options);
  }

  setMaxValue(val: number) {
    if (val > this.maxValue) {
      this.recLines.forEach(recLine => {
        const height = recLine.end[1] - recLine.start[1];
        const newHeight = height * this.maxValue / val;
        recLine.end = [recLine.end[0], recLine.start[1] + newHeight];
      });

      this.maxValue = val;
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    const {
      padding,
      maxValue
    } = this;

    const lp = padding.left > 1 ? padding.left : padding.left * width;
    const rp = padding.right > 1 ? padding.right : padding.right * width;
    const tp = padding.top > 1 ? padding.top : padding.top * height;
    const bp = padding.bottom > 1 ? padding.bottom : padding.bottom * height;

    const w = width - lp - rp;
    const h = height - tp - bp;
    const origin: [number, number] = [lp, height - bp];

    const barWidth = w / this.bars.length;
    const barRecWidth = 0.8 * barWidth;

    this.horizonLine.start = origin;
    this.horizonLine.end = [origin[0] + w, origin[1]];

    this.verticalLine.start = origin;
    this.verticalLine.end = [origin[0], origin[1] - h];

    this.recLines.forEach((recLine, i) => {
      recLine.start = [origin[0] + (i + 0.5) * barWidth, origin[1]];
      recLine.end = [origin[0] + (i + 0.5) * barWidth, origin[1] - this.bars[i].value * h / maxValue];
      recLine.thickness = [barRecWidth, barRecWidth];
    });

    this.labels.forEach((label, i) => {
      label.origin = [origin[0] + (i + 0.5) * barWidth, origin[1] + 10];
    })
  }

  init(options: IBarChartStoreOptions) {
    const {
      barData,
      padding,
      width,
      height,
      maxValue
    } = options;

    // this.options = options;

    const lp = padding.left > 1 ? padding.left : padding.left * width;
    const rp = padding.right > 1 ? padding.right : padding.right * width;
    const tp = padding.top > 1 ? padding.top : padding.top * height;
    const bp = padding.bottom > 1 ? padding.bottom : padding.bottom * height;

    const w = width - lp - rp;
    const h = height - tp - bp;
    const origin: [number, number] = [lp, height - bp];
    console.warn("wh", w, h, width, height, origin);
    // Horizon Line
    this.horizonLine = this.providers.lines.add(new EdgeInstance({
      start: origin,
      end: [origin[0] + w, origin[1]]
    }));

    // Vertical Line
    this.verticalLine = this.providers.lines.add(new EdgeInstance({
      start: origin,
      end: [origin[0], origin[1] - h]
    }));


    const barWidth = w / barData.length;
    const barRecWidth = 0.8 * barWidth;

    for (let i = 0, endi = barData.length; i < endi; i++) {
      const bar = barData[i];

      // Rectangles
      /*const rectangle = new RectangleInstance({
        position: [origin[0] + (i + 0.1) * barWidth, origin[1] - bar.height],
        color: bar.color,
        size: [barRecWidth, bar.height],
      });

      this.providers.rectangles.add(rectangle);
      bar.rectangle = rectangle;
      this.rectangleToBar.set(rectangle, bar);*/

      // Use straight lines to represent rectangles
      const recLine = new EdgeInstance({
        startColor: bar.color,
        endColor: bar.color,
        start: [origin[0] + (i + 0.5) * barWidth, origin[1]],
        end: [origin[0] + (i + 0.5) * barWidth, origin[1] - bar.value * h / maxValue],
        thickness: [barRecWidth, barRecWidth]
      })

      this.providers.recLines.add(recLine);
      bar.recLine = recLine;
      this.recLineToBar.set(recLine, bar);
      this.recLines.push(recLine);

      // labels
      const label = new LabelInstance({
        depth: 2,
        origin: [origin[0] + (i + 0.5) * barWidth, origin[1] + 10],
        text: bar.labelText,
        color: [0.8, 0.8, 0.8, 1],
        fontSize: 16,
        anchor: {
          type: AnchorType.TopMiddle,
          padding: 0
        }
      });

      this.providers.labels.add(label);
      bar.label = label;
      this.labelToBar.set(label, bar);
      this.labels.push(label);
    }
  }
}