import { RectangleInstance, Vec2, Color, InstanceProvider, EdgeInstance, LabelInstance, Vec3 } from "deltav";
import { NumberBarStore, INumberBarStoreOptions } from "./store/number-bar-store";

import { NumberAxisStore, RangeNumberAxisStore, HorizonRangeLayout, VerticalRangeLayout } from "deltav-axis-2d";

export interface INumberBarAxisChartProps {
  numberRange: [number, number];
  numberGap: number;

  /** Sets whether the axis displays range labels */
  displayRangeLabels?: boolean;
  childrenNumber?: number;

  barShrink: number;
  // With paddings, origin and size can be calculated
  view: {
    origin: Vec2;
    size: Vec2;
  }
  /** Sets the font of labels */
  labelFont: string;
  /** Sets the color of labels */
  labelColor?: Color;
  /** Sets the fontsize of labels */
  labelFontSize?: number;
  /** Sets the padding value of labels */
  labelPadding?: number;
  /** Sets the color of ticks */
  tickColor?: Color;
  /** Sets the length of ticks */
  tickLength?: number;
  /** Sets the thickness of the ticks */
  tickWidth?: number;
  /** Indicates the side of range labels in horizon mode. Can be ABOVE or BELOW*/
  horizonRangeLayout?: HorizonRangeLayout;
  barProvider: {
    bars: InstanceProvider<EdgeInstance>,
    masks: InstanceProvider<RectangleInstance>,
  },
  axisProvider: {
    ticks: InstanceProvider<EdgeInstance>;
    labels: InstanceProvider<LabelInstance>;
  };
  /** Indicates the side of range labels in vertical mode. Can be LEFT or RIGHT*/
  verticalRangeLayout?: VerticalRangeLayout;
  /** Indicates whether the axis layouts in vertical direction */
  verticalLayout?: boolean;
}

export class NumberBarAxisChart {
  barStore: NumberBarStore;
  axisStore: RangeNumberAxisStore<number>;
  childrenNumber: number = 10;

  constructor(options: INumberBarAxisChartProps) {
    this.barStore = new NumberBarStore({
      barShrinkFactor: 0.8,
      childrenNumber: this.childrenNumber,
      providers: {
        bars: options.barProvider.bars,
        masks: options.barProvider.masks
      },
      numberRange: options.numberRange,
      verticalLayout: options.verticalLayout,
      view: options.view
    })

    this.axisStore = new RangeNumberAxisStore({
      bucketWidth: options.view.size[0] / this.childrenNumber,
      numberRange: options.numberRange,
      childrenNumber: this.childrenNumber,
      view: options.view,
      verticalLayout: options.verticalLayout,
      providers: {
        ticks: options.axisProvider.ticks,
        labels: options.axisProvider.labels
      },
      labelColor: options.labelColor,
      labelFontSize: options.labelFontSize,
      labelPadding: options.labelPadding,
      tickColor: options.tickColor,
      tickLength: options.tickLength,
      tickWidth: options.tickWidth,
      horizonRangeLayout: options.horizonRangeLayout,
      displayRangeLabels: options.displayRangeLabels,
      verticalRangeLayout: options.verticalRangeLayout,
      resizeWithWindow: true
    })
  }

  shift(offset: Vec3) {
    this.axisStore.updateOffset(offset);
    this.barStore.updateOffset(offset);
  }

  zoom(focus: Vec2, deltaScale: Vec3) {
    this.axisStore.updateScale(focus, deltaScale);
    this.barStore.updateScale(focus, deltaScale);
  }

  changeAxis() {
    this.axisStore.changeAxis();
    this.barStore.changeAxis();
  }

  setView(view: { origin: Vec2, size: Vec2 }) {
    this.axisStore.setView(view);
    this.barStore.setView(view);
  }
}