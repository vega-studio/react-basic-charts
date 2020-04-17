import { LabelAxisStore, NumberAxisStore, DateAxisStore, BasicAxisStore } from "../../axis-component/src/store"
import { Color } from "deltav"

export interface IBarAxisChartProps {
  // data

  barShrink: number;
  // With paddings, origin and size can be calculated
  leftPadding: number;
  rightPadding: number;
  topPadding: number;
  bottomPadding: number;

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
}

export class BarAxisChart {

}