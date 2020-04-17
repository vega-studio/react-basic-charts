import { InstanceProvider, RectangleInstance, LabelInstance, EdgeInstance, AnchorType, EasingUtil, EdgeLayer, LabelLayer, GlyphLayer, Color, GlyphInstance } from "deltav";
import { Bar } from "../view/bar";
import { observable, reaction } from "mobx";

export interface IBarChartStoreOptions {
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  },
  width: number;
  height: number;
  shrink: number;
  barHighlightColor?: Color;
  // labelColor?: Color;
  // labelHighlightColor?: Color;
  lineWidth?: number;
}

export class BarChartStore {
  // To Remove or add temporarily
  @observable idsToRemove: number[] = [];
  @observable idsToAdd: number[] = [];

  // Layout mode
  verticalLayout: boolean = false;

  // Shape Instances Holders
  verticalLine: EdgeInstance;
  horizonLine: EdgeInstance;
  mask1: RectangleInstance;
  mask2: RectangleInstance;
  providers = {
    rectangles: new InstanceProvider<RectangleInstance>(),
    recLines: new InstanceProvider<EdgeInstance>(),
    // labels: new InstanceProvider<LabelInstance>(),
    lines: new InstanceProvider<EdgeInstance>()
  }

  // Maps
  recLineToBar: Map<EdgeInstance, Bar> = new Map<EdgeInstance, Bar>();
  // labelToBar: Map<LabelInstance, Bar> = new Map<LabelInstance, Bar>();
  idToBar: Map<number, Bar> = new Map<number, Bar>();

  // BarChart metrics
  width: number;
  height: number;
  chartWidth: number;
  chartHeight: number;
  origin: [number, number];
  barWidth: number;
  shrink: number = 1;
  maxValue: number = 0;
  //maxLabelWidth: number = 0;
  //lineWidth: number = 1;

  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  // Colors
  barHighlightColor: Color = [1, 1, 1, 1];
  //labelColor: Color = [0.8, 0.8, 0.8, 1.0];
  //labelHighlightColor: Color = [1, 1, 1, 1];

  // Camera Metrics
  private _offset: number = 0;
  private minOffset: number = 0;
  private maxOffset: number = 0;
  private _scale: number = 0;
  private minScale: number = 0;
  private maxScale: number = 1;

  constructor(options: IBarChartStoreOptions) {
    this.width = options.width;
    this.height = options.height;
    this.padding = options.padding;
    this.shrink = options.shrink;
    this.barHighlightColor = options.barHighlightColor || this.barHighlightColor;
    //this.labelColor = options.labelColor || this.labelColor;
    //this.labelHighlightColor = options.labelHighlightColor || this.labelHighlightColor;
    //this.lineWidth = options.lineWidth || this.lineWidth;

    this.init();

    reaction(
      () => this.idsToAdd.length > 0,
      () => this.addBars()
    )

    reaction(
      () => this.idsToRemove.length > 0,
      () => this.removeBars()
    )
  }

  toggleChartLayout() {
    this.verticalLayout = !this.verticalLayout;
    this.updateBoundry();
    // this.layoutLines();
    this.layoutBars(true, 300);
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

    /*if (!bar.label) {
      bar.label = new LabelInstance({
        depth: 2,
        origin: [0, 0],
        text: bar.labelText,
        color: [0.8, 0.8, 0.8, 0],
        fontSize: 16,
        anchor: {
          type: AnchorType.TopMiddle,
          padding: 0
        },
        onReady: (label: LabelInstance) => {
          if (label.size[0] > this.maxLabelWidth) {
            this.maxLabelWidth = Math.max(this.maxLabelWidth, label.size[0]);
            // this.layoutLines();
            this.layoutBars(true, 300);
          }
        }
      });

      this.providers.labels.add(bar.label);
      this.labelToBar.set(bar.label, bar);
    }*/
  }

  receiveIdsToRemove(ids: number[]) {
    this.idsToRemove = ids;
  }

  receiveIdsToAdd(ids: number[]) {
    this.idsToAdd = ids;
  }

  addOffset(val: [number, number, number]) {
    if (this.verticalLayout) {
      this.offset = this._offset + val[1];
    } else {
      this.offset = this._offset + val[0];
    }
  }

  set offset(val: number) {
    this._offset = Math.min(Math.max(this.minOffset, val), this.maxOffset);
    this.layoutBars(false);
  }

  get offset() {
    return this._offset;
  }

  addScale(val: number) {
    if (val < -0.005) {
      this._scale = Math.min(Math.max(this.minScale, this._scale - 0.005), this.maxScale);
      this.updateBoundry();
      this.layoutBars(true, 25);
    } else if (val > 0.005) {
      this._scale = Math.min(Math.max(this.minScale, this._scale + 0.005), this.maxScale);
      this.updateBoundry();
      this.layoutBars(true, 25);
    } else {
      this._scale = Math.min(Math.max(this.minScale, this._scale + val), this.maxScale);
      this.updateBoundry();
      this.layoutBars(false);
    }
  }

  set scale(val: number) {
    this._scale = Math.min(Math.max(this.minScale, val), this.maxScale);
    this.updateBoundry();
    this.layoutBars(false);
  }

  get scale() {
    return this._scale;
  }

  /*async getMaxLabelWidth() {
    function valueBiggerThanZero(label: LabelInstance) {
      return new Promise(resolve => {
        const timerId = setInterval(() => {
          if (label.size[0] > 0) {
            clearInterval(timerId);
            resolve(label);
          }
        }, 1)
      })
    }

    let maxWidth = 0;
    let i = 0;

    await new Promise(resolve => {
      this.idToBar.forEach(async bar => {
        if (bar.label) {
          await valueBiggerThanZero(bar.label);
          maxWidth = Math.max(maxWidth, bar.label.size[0]);
        }
        i++;
        if (i === this.idToBar.size) resolve();
      });
    })

    this.maxLabelWidth = maxWidth;
  }*/

  /*layoutLines() {
    const origin = this.origin;
    const w = this.chartWidth;
    const h = this.chartHeight;
    const lineWidth = this.lineWidth;

    if (this.verticalLayout) {
      const newOrigin: [number, number] = [origin[0] + this.maxLabelWidth, origin[1]]
      const newWidth = w - this.maxLabelWidth;

      this.horizonLine.start = newOrigin;
      this.horizonLine.end = [newOrigin[0] + newWidth, newOrigin[1]];
      this.verticalLine.start = newOrigin;
      this.verticalLine.end = [newOrigin[0], newOrigin[1] - h];

      this.mask1.position = [0, 0];
      this.mask1.size = [this.width, this.origin[1] - h];

      this.mask2.position = [0, origin[1] + 1];
      this.mask2.size = [this.width, this.height - this.origin[1]];
    } else {
      this.horizonLine.start = origin;
      this.horizonLine.end = [origin[0] + w, origin[1]];

      this.verticalLine.start = origin;
      this.verticalLine.end = [origin[0], origin[1] - h];

      this.mask1.position = [0, 0];
      this.mask1.size = [origin[0] - lineWidth / 2, this.height - 1];

      this.mask2.position = [origin[0] + w, 0];
      this.mask2.size = [this.width - origin[0] - w, this.height - 1];
    }

  }*/

  layoutBars(ainmation?: boolean, duration?: number) {
    const origin = this.origin;
    const w = this.chartWidth;
    const h = this.chartHeight;

    if (this.verticalLayout) {
      this.layoutVertical(w, h, origin, ainmation, duration);
    } else {
      this.layoutHorizon(w, h, origin, ainmation, duration);
    }
  }

  updateMinScale() {
    const size = this.idToBar.size;
    this.minScale = 1 / size;
    this._scale = Math.min(Math.max(this.minScale, this._scale), this.maxScale);
    this.updateBoundry();
  }

  updateBoundry() {
    const size = this.idToBar.size;

    if (this.verticalLayout) {
      this.minOffset = 0;
      this.maxOffset = this.chartHeight * this._scale * size - this.chartHeight;
    } else {
      this.maxOffset = 0;
      this.minOffset = this.chartWidth - this.chartWidth * this._scale * size;
    }

    this._offset = Math.min(Math.max(this.minOffset, this._offset), this.maxOffset);

  }

  layoutHorizon(
    width: number,
    height: number,
    origin: [number, number],
    noAinmation: boolean = false,
    duration: number = 1
  ) {
    const barWidth = width; // / size;
    const barRecWidth = this.shrink * barWidth;

    // new locations
    const allReclines: EdgeInstance[] = [];
    // const allLabels: LabelInstance[] = [];

    this.idToBar.forEach(bar => {
      const recLine = bar.recLine;
      allReclines.push(recLine);
      // const label = bar.label;
      // allLabels.push(label);

      // const size = label.size;
      // if (!bar.width) bar.width = size[0];
    });

    allReclines.forEach((recLine, i) => {
      const bar = this.recLineToBar.get(recLine);

      if (bar) {
        recLine.start = [
          origin[0] + (i + 0.5) * barWidth * this._scale + this._offset,
          origin[1]
        ];
        recLine.end = [
          origin[0] + (i + 0.5) * barWidth * this._scale + this._offset,
          origin[1] - bar.value * height / this.maxValue
        ];
        recLine.thickness = [barRecWidth * this._scale, barRecWidth * this._scale];
      }
    })

    // let allglyphs: GlyphInstance[] = [];

    /*allLabels.forEach((label, i) => {
      label.anchor = {
        type: AnchorType.TopMiddle,
        padding: 0
      }

      label.origin = [
        origin[0] + (i + 0.5) * barWidth * this._scale + this._offset,
        origin[1] + 10
      ];

      allglyphs = allglyphs.concat(label.glyphs);
      const bar = this.labelToBar.get(label);

      if (bar) {
        if (bar.width > barWidth * this.scale) {
          label.text = bar.labelText.substring(0, 3);
        } else {
          label.text = bar.labelText;
        }
      }
    })*/

    // this.easeInstances(allReclines, allglyphs, noAinmation, duration);
  }

  layoutVertical(
    width: number,
    height: number,
    origin: [number, number],
    animation: boolean = true,
    duration: number = 1
  ) {
    const barWidth = height;
    const barRecWidth = this.shrink * barWidth;

    // new locations
    const allReclines: EdgeInstance[] = [];
    // const allLabels: LabelInstance[] = [];

    this.idToBar.forEach(bar => {
      const recLine = bar.recLine;
      allReclines.push(recLine);
      // const label = bar.label;
      // allLabels.push(label);
    });

    //const maxWidth = this.maxLabelWidth;
    //const newOrigin: [number, number] = [origin[0] + maxWidth, origin[1]]
    //const newWidth = width - maxWidth;

    allReclines.forEach((recLine, i) => {
      const bar = this.recLineToBar.get(recLine);

      if (bar) {
        recLine.start = [
          origin[0],
          origin[1] - (i + 0.5) * barWidth * this._scale + this._offset
        ];
        recLine.end = [
          origin[0] + bar.value * width / this.maxValue,
          origin[1] - (i + 0.5) * barWidth * this._scale + this._offset
        ];
        recLine.thickness = [barRecWidth * this._scale, barRecWidth * this._scale];
      }
    })

    /* let allglyphs: GlyphInstance[] = [];
     allLabels.forEach((label, i) => {
       label.anchor = {
         type: AnchorType.MiddleRight,
         padding: 10
       }
 
       label.origin = [
         newOrigin[0],
         newOrigin[1] - (i + 0.5) * barWidth * this._scale + this._offset
       ];
 
       allglyphs = allglyphs.concat(label.glyphs);
       const bar = this.labelToBar.get(label);
       label.text = bar.labelText;
     })
 
     this.easeInstances(allReclines, allglyphs, animation, duration);*/
  }

  easeInstances(reclines: EdgeInstance[], glyphs: GlyphInstance[], ainmation: boolean, duration: number) {
    if (ainmation) {
      EasingUtil.all(
        true,
        reclines,
        [
          EdgeLayer.attributeNames.start,
          EdgeLayer.attributeNames.end,
          EdgeLayer.attributeNames.thickness
        ],
        easing => easing.setTiming(0, duration)
      )

      EasingUtil.all(
        true,
        glyphs,
        [
          GlyphLayer.attributeNames.origin
        ],
        easing => easing.setTiming(0, duration)
      )
    } else {
      EasingUtil.all(
        true,
        reclines,
        [
          EdgeLayer.attributeNames.start,
          EdgeLayer.attributeNames.end,
          EdgeLayer.attributeNames.thickness
        ],
        easing => easing.setTiming(0, 1)
      )

      EasingUtil.all(
        true,
        glyphs,
        [
          GlyphLayer.attributeNames.origin
        ],
        easing => easing.setTiming(0, 1)
      )
    }
  }

  addBars() {
    const addedRecs: EdgeInstance[] = [];
    // const addedLabels: LabelInstance[] = [];

    this.idsToAdd.forEach(id => {
      const bar = this.idToBar.get(id);
      addedRecs.push(bar.recLine);
      // addedLabels.push(bar.label);
    })

    this.idsToAdd = [];

    this.updateMaxValue(true);
    this.updateMinScale();
    this.updateBoundry();

    if (this.verticalLayout) {
      this.offset = this.maxOffset;
    } else {
      this.offset = this.minOffset;
    }

    // Fade in
    setTimeout(() => {
      addedRecs.forEach(rec => {
        rec.startColor = [rec.startColor[0], rec.startColor[1], rec.startColor[2], 1];
        rec.endColor = [rec.endColor[0], rec.endColor[1], rec.endColor[2], 1];
      });

      /*addedLabels.forEach(label => {
        label.color = [label.color[0], label.color[1], label.color[2], 1];
      })*/
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

        // const label = bar.label;
        //label.color = [label.color[0], label.color[1], label.color[2], 0];
        //removedLabels.push(bar.label);

        this.idToBar.delete(id);
      }

    });

    setTimeout(() => {
      removedRecs.forEach(rec => this.providers.recLines.remove(rec));
      // removedLabels.forEach(label => this.providers.labels.remove(label));
      this.idsToRemove = [];
      this.updateMaxValue(false);
      this.updateMinScale();
      // this.layoutLines();
      this.layoutBars(true, 300);
    }, 300)

  }

  updateMaxValue(dataAdded: boolean) {
    let maxValue = 0;
    this.idToBar.forEach(bar => maxValue = Math.max(maxValue, bar.value));
    this.maxValue = maxValue;

    /*if (!dataAdded) {
      let maxLabelWidth = 0;
      this.idToBar.forEach(
        bar => maxLabelWidth = Math.max(maxLabelWidth, bar.label.size[0])
      );
      this.maxLabelWidth = maxLabelWidth;
    }*/
  }

  setMaxValue(val: number) {
    if (val > this.maxValue) {
      this.idToBar.forEach(bar => {
        const recLine = bar.recLine;

        if (this.verticalLayout) {
          const height = recLine.end[0] - recLine.start[0];
          const newHeight = height * this.maxValue / val;
          recLine.end = [recLine.start[0] + newHeight, recLine.end[1]];
        } else {
          const height = recLine.end[1] - recLine.start[1];
          const newHeight = height * this.maxValue / val;
          recLine.end = [recLine.end[0], recLine.start[1] + newHeight];
        }

      });

      this.maxValue = val;
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.updateChartMetrics();
    // this.layoutLines();
    this.layoutBars(true, 300);
  }

  updateChartMetrics() {
    const {
      padding,
      width,
      height
    } = this;

    const lp = padding.left > 1 ? padding.left : padding.left * width;
    const rp = padding.right > 1 ? padding.right : padding.right * width;
    const tp = padding.top > 1 ? padding.top : padding.top * height;
    const bp = padding.bottom > 1 ? padding.bottom : padding.bottom * height;

    this.chartWidth = width - lp - rp;
    this.chartHeight = height - tp - bp;
    this.origin = [lp, height - bp];
  }

  init() {
    this.updateChartMetrics();
    const origin = this.origin;
    const w = this.chartWidth;
    const h = this.chartHeight;
    // const lineWidth = this.lineWidth;

    /*
    // Horizon Line
    this.horizonLine = this.providers.lines.add(new EdgeInstance({
      start: origin,
      end: [origin[0] + w, origin[1]],
      thickness: [lineWidth, lineWidth]
    }));

    // Vertical Line
    this.verticalLine = this.providers.lines.add(new EdgeInstance({
      start: origin,
      end: [origin[0], origin[1] - h],
      thickness: [lineWidth, lineWidth]
    }));

    this.mask1 = this.providers.rectangles.add(new RectangleInstance({
      position: [0, 0],
      size: [origin[0] - lineWidth / 2, this.height],
      color: [0, 0, 0, 1]
    }));

    this.mask2 = this.providers.rectangles.add(new RectangleInstance({
      position: [origin[0] + w, 0],
      size: [this.width - origin[0] - w, this.height],
      color: [0, 0, 0, 1]
    }));*/


  }
}