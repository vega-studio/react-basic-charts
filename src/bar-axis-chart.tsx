import { Color, InstanceProvider, EdgeInstance, LabelInstance, Vec3, Vec2, RectangleInstance } from "deltav"
import { BasicBarStore } from "./store/basic-bar-store";
import { LabelAxisStore, HorizonRangeLayout, VerticalRangeLayout } from "deltav-axis-2d";
import { LabelBarStore } from "./store/label-bar-store";

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

export class BarAxisChart {
  barStore: BasicBarStore;
  axisStore: LabelAxisStore<string>;

  constructor(options: IBarAxisChartProps) {
    const childrenNumber = options.labels.length;

    this.barStore = new LabelBarStore({
      barShrinkFactor: 0.8,
      providers: {
        bars: options.barProvider.bars,
        masks: options.barProvider.masks
      },
      labelNumber: childrenNumber,
      verticalLayout: options.verticalLayout,
      view: options.view
    })

    this.axisStore = new LabelAxisStore({
      bucketWidth: options.view.size[0] / childrenNumber,
      bucketHeight: options.view.size[1] / childrenNumber,
      labels: options.labels,
      childrenNumber: 10,
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
      resizeWithWindow: true,
      onMainLabelInstance: (label: LabelInstance) => {
        label.color = [label.color[0], label.color[1], label.color[2], 1];
      }
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