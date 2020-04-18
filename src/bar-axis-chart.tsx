import { HorizonRangeLayout, VerticalRangeLayout, Vec2 } from "../../deltav-axis-2d/src/types";
import { Color, InstanceProvider, EdgeInstance, LabelInstance, Vec3 } from "deltav"
import { BasicBarStore } from "./store/basic-bar-store";
import { LabelAxisStore } from "./axis-store";
export interface IBarAxisChartProps {
  // data
  labels: string[];
  data: number[];
  /** Sets whether the axis displays range labels */
  displayRangeLabels?: boolean;

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
  barProvider: InstanceProvider<EdgeInstance>;
  axisProvider: {
    ticks: InstanceProvider<EdgeInstance>;
    labels: InstanceProvider<LabelInstance>;
  };
  /** Indicates the side of range labels in vertical mode. Can be LEFT or RIGHT*/
  verticalRangeLayout?: VerticalRangeLayout;
  /** Indicates whether the axis layouts in vertical direction */
  verticalLayout?: boolean;
}

export class BarAxisChart {
  barStore: BasicBarStore;
  axisStore: LabelAxisStore<string>;
  axisProvider = {
    ticks: new InstanceProvider<EdgeInstance>(),
    labels: new InstanceProvider<LabelInstance>()
  }

  constructor(options: IBarAxisChartProps) {
    this.barStore = new BasicBarStore({
      data: options.data,
      barShrinkFactor: 0.8,
      provider: options.barProvider,
      verticalLayout: options.verticalLayout,
      view: options.view
    })

    Object.assign(this.axisProvider, options.axisProvider);

    this.axisStore = new LabelAxisStore({
      labels: options.labels,
      childrenNumber: 6,
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

    // update barStore
  }

  zoom(focus: Vec2, deltaScale: Vec3) {
    this.axisStore.updateScale(focus, deltaScale);

    // update bar Sotre
  }
}