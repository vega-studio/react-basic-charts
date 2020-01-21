import React, { Component } from "react";
import { BarChartView } from "./view/bar-chart-view";
import { BarChartStore } from "./store";
import { BarChartAction } from "./action";
import { Color } from "deltav";
import { BarType } from "./types";
import { Bar } from "./view/bar";

function parsePadding(val: number | string) {
  if (typeof val === 'number') {
    return val;
  } else if (typeof val === 'string') {
    const perTester = /^\d+(\.\d+)?%$/;
    if(perTester.test(val)) {
      return Number.parseFloat(val) / 100;
    }  
  }

  return 0;
}


export interface IBarChartProps {
  data: BarType[];
  padding: {
    left: number | string;
    right: number | string;
    top: number | string;
    bottom: number | string;
  }

  labelFont: string;
  labelColor: Color;

  lineColor: Color;
  lineWidth: number;
}

export class BarChart extends Component<IBarChartProps>{
  store: BarChartStore;
  action: BarChartAction;

  width: number;
  height: number;

  constructor(props: IBarChartProps) {
    super(props);

    this.action = new BarChartAction();
    this.init(props);
  }

  componentDidMount() {

  }

  init(props: IBarChartProps) {
    const barData = props.data;
    const barNumber = barData.length;
    
    // Width
    const leftPadding = parsePadding(props.padding.left);
    const rightPadding = parsePadding(props.padding.right);
    const topPadding = parsePadding(props.padding.top);
    const bottomPadding = parsePadding(props.padding.bottom);
    
    // Height
    let maxValue = 0;
    barData.forEach(d => maxValue = Math.max(d.value, maxValue));

    // Bars
    const bars: Bar[] = [];

    for (let i = 0; i < barNumber; i++) {
      const bar = barData[i];
      bars.push(new Bar({
        labelText: bar.label,
        value: bar.value,
        color: bar.color
      }))
    }

    // Labels follow bars
    this.store = new BarChartStore({
      maxValue,
      barData: bars,
      padding: {
        left: leftPadding,
        right: rightPadding,
        top: topPadding,
        bottom: bottomPadding
      },
      width: window.innerWidth,
      height: window.innerHeight
    });

    this.action.store = this.store;
  }

  render() {
    return <BarChartView store={this.store} action={this.action} />;
  }

}