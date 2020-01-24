import { InstanceProvider, CircleInstance, RectangleInstance, LabelInstance, EdgeInstance, AnchorType, EasingUtil, EdgeLayer, LabelLayer } from "deltav";
import { Bar } from "../view/bar";
import { observable, reaction, remove } from "mobx";

export interface IBarChartStoreOptions {
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  },
  width: number;
  height: number;
}

export class BarChartStore {
  @observable idsToRemove: number[] = [];
  @observable idsToAdd: number[] = [];

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

  idToBar: Map<number, Bar> = new Map<number, Bar>();

  width: number;
  height: number;
  maxValue: number = 0;
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  constructor(options: IBarChartStoreOptions) {
    this.width = options.width;
    this.height = options.height;
    this.padding = options.padding;

    this.init(options);

    reaction(
      () => this.idsToAdd.length > 0,
      () => this.addBars()
    )

    reaction(
      () => this.idsToRemove.length > 0,
      () => this.removeBars()
    )
  }

  appendSingleBar(id: number, bar: Bar) {
    this.idToBar.set(id, bar);

    if (!bar.recLine) {
      bar.recLine = new EdgeInstance({
        startColor: [bar.color[0], bar.color[1], bar.color[2], 0],
        endColor: [bar.color[0], bar.color[1], bar.color[2], 0],
        start: [0, 0],
        end: [0, 0],
        thickness: [0, 0]
      })


      this.providers.recLines.add(bar.recLine);
      this.recLineToBar.set(bar.recLine, bar);
    }

    if (!bar.label) {
      bar.label = new LabelInstance({
        depth: 2,
        origin: [0, 0],
        text: bar.labelText,
        color: [0.8, 0.8, 0.8, 0],
        fontSize: 16,
        anchor: {
          type: AnchorType.TopMiddle,
          padding: 0
        }
      });


      this.providers.labels.add(bar.label);
      this.labelToBar.set(bar.label, bar);
    }
  }

  receiveIdsToRemove(ids: number[]) {
    this.idsToRemove = ids;
  }

  receiveIdsToAdd(ids: number[]) {
    this.idsToAdd = ids;
  }

  layoutLines() {
    const {
      width,
      height,
      padding
    } = this;

    const lp = padding.left > 1 ? padding.left : padding.left * width;
    const rp = padding.right > 1 ? padding.right : padding.right * width;
    const tp = padding.top > 1 ? padding.top : padding.top * height;
    const bp = padding.bottom > 1 ? padding.bottom : padding.bottom * height;

    const w = width - lp - rp;
    const h = height - tp - bp;

    const origin: [number, number] = [lp, height - bp];

    this.horizonLine.start = origin;
    this.horizonLine.end = [origin[0] + w, origin[1]];

    this.verticalLine.start = origin;
    this.verticalLine.end = [origin[0], origin[1] - h];
  }

  layoutBars() {
    const length = this.idToBar.size;

    const {
      width,
      height,
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

    const barWidth = w / length;
    const barRecWidth = 0.8 * barWidth;

    // new locations
    const allReclines: EdgeInstance[] = [];
    const allLabels: LabelInstance[] = [];
    this.idToBar.forEach(bar => {
      const recLine = bar.recLine;
      allReclines.push(recLine);
      const label = bar.label;
      allLabels.push(label);
    });

    allReclines.forEach((recLine, i) => {
      const bar = this.recLineToBar.get(recLine);

      if (bar) {
        recLine.start = [origin[0] + (i + 0.5) * barWidth, origin[1]];
        recLine.end = [origin[0] + (i + 0.5) * barWidth, origin[1] - bar.value * h / maxValue];
        recLine.thickness = [barRecWidth, barRecWidth];
      }
    })

    allLabels.forEach((label, i) => {
      label.origin = [origin[0] + (i + 0.5) * barWidth, origin[1] + 10];
    })

    EasingUtil.all(
      true,
      allReclines,
      [
        EdgeLayer.attributeNames.start,
        EdgeLayer.attributeNames.end,
        EdgeLayer.attributeNames.thickness
      ],
      easing => {
        easing.setTiming(0, 500);
      }
    );

  }

  addBars() {
    const addedRecs: EdgeInstance[] = [];
    const addedLabels: LabelInstance[] = [];

    this.idsToAdd.forEach(id => {
      const bar = this.idToBar.get(id);
      addedRecs.push(bar.recLine);
      addedLabels.push(bar.label);
    })

    this.idsToAdd = [];
    this.updateMaxValue();
    this.layoutBars();

    // Fade in
    setTimeout(() => {
      addedRecs.forEach(rec => {
        rec.startColor = [rec.startColor[0], rec.startColor[1], rec.startColor[2], 1];
        rec.endColor = [rec.endColor[0], rec.endColor[1], rec.endColor[2], 1];
      });

      addedLabels.forEach(label => {
        label.color = [label.color[0], label.color[1], label.color[2], 1];
      })
    }, 400);
  }

  removeBars() {
    const removedRecs: EdgeInstance[] = [];
    const removedLabels: LabelInstance[] = [];

    this.idsToRemove.forEach(id => {
      const bar = this.idToBar.get(id);

      // Fade out
      if (bar) {
        const rec = bar.recLine;
        rec.startColor = [rec.startColor[0], rec.startColor[1], rec.startColor[2], 0];
        rec.endColor = [rec.endColor[0], rec.endColor[1], rec.endColor[2], 0];
        removedRecs.push(rec);

        const label = bar.label;
        label.color = [label.color[0], label.color[1], label.color[2], 0];
        removedLabels.push(bar.label);

        this.idToBar.delete(id);
      }

    });

    setTimeout(() => {
      removedRecs.forEach(rec => this.providers.recLines.remove(rec));
      removedLabels.forEach(label => this.providers.labels.remove(label));
      this.idsToRemove = [];
      this.updateMaxValue();
      this.layoutBars();
    }, 300)

  }

  updateMaxValue() {
    let maxValue = 0;
    this.idToBar.forEach(bar => maxValue = Math.max(maxValue, bar.value));
    this.maxValue = maxValue;
  }

  setMaxValue(val: number) {
    if (val > this.maxValue) {
      this.idToBar.forEach(bar => {
        const recLine = bar.recLine;
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
    this.layoutLines();
    this.layoutBars();
  }

  init(options: IBarChartStoreOptions) {
    const {
      padding,
      width,
      height
    } = options;

    const lp = padding.left > 1 ? padding.left : padding.left * width;
    const rp = padding.right > 1 ? padding.right : padding.right * width;
    const tp = padding.top > 1 ? padding.top : padding.top * height;
    const bp = padding.bottom > 1 ? padding.bottom : padding.bottom * height;

    const w = width - lp - rp;
    const h = height - tp - bp;
    const origin: [number, number] = [lp, height - bp];

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

  }
}