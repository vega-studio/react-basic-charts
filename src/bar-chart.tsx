import React, { Component } from "react";
import { BarChartView } from "./view/bar-chart-view";
import { BarChartStore } from "./store";
import { BarChartAction } from "./action";
import { Color } from "deltav";
import { BarType } from "./types";
import { Bar } from "./view/bar";
import * as dat from "dat.gui";
import { observable, when, reaction } from "mobx";


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

  @observable barData: BarType[];
  @observable barNumber: number;

  parameters = {
    changeRandom: () => {
      this.action.changeRandom();
    },
    addNew: () => {
      this.barData.push({
        value: 100 + 500 * Math.random(),
        color: [Math.random(), Math.random(), Math.random(), 1],
        label: "test"
      })
    }
  }

  constructor(props: IBarChartProps) {
    super(props);

    this.action = new BarChartAction();
    this.init(props);

    reaction(
      () => this.barData.length > this.barNumber, 
      () => this.addNewData()
    )
  }

  addNewData() {
    console.warn("new data added", this.barData.length, this.barNumber);

    for(let i = this.barNumber, endi = this.barData.length; i < endi; i++) {
      const data = this.barData[i];
      this.store.bars.push(new Bar({
        value: data.value,
        labelText: data.label,
        color: data.color
      }))
    }

    this.barNumber = this.barData.length;
  }

  componentDidMount() {
    this.buildConsole();
  }

  buildConsole() {
    const ui = new dat.GUI();
    ui.add(this.parameters, "changeRandom");
    ui.add(this.parameters, "addNew");
  }

  init(props: IBarChartProps) {
    this.barData = props.data;
    this.barNumber = this.barData.length;
    
    // Width
    const leftPadding = parsePadding(props.padding.left);
    const rightPadding = parsePadding(props.padding.right);
    const topPadding = parsePadding(props.padding.top);
    const bottomPadding = parsePadding(props.padding.bottom);
    
    // Height
    let maxValue = 0;
    this.barData.forEach(d => maxValue = Math.max(d.value, maxValue));

    // Bars
    const bars: Bar[] = [];

    for (let i = 0; i < this.barNumber; i++) {
      const bar = this.barData[i];
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