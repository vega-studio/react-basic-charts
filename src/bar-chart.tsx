import React, { Component } from "react";
import { BarChartView } from "./view/bar-chart-view";
import { BarChartStore } from "./store";
import { BarChartAction } from "./action";
import { Color } from "deltav";
import { BarType } from "./types";
import { Bar } from "./view/bar";
import * as dat from "dat.gui";
import { observable, reaction } from "mobx";


function parsePadding(val: number | string) {
  if (typeof val === 'number') {
    return val;
  } else if (typeof val === 'string') {
    const perTester = /^\d+(\.\d+)?%$/;
    if (perTester.test(val)) {
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

  shrink: number;

  labelFont: string;
  labelColor: Color;
  labelHighlightColor: Color;

  lineColor: Color;
  lineWidth: number;
}

export class BarChart extends Component<IBarChartProps>{
  store: BarChartStore;
  action: BarChartAction;

  width: number;
  height: number;

  barData: BarType[];

  idsToAdd: number[] = [];
  @observable addNumber: number = 0;

  idsToRemove: number[] = [];
  @observable removeNumber: number = 0;

  private _id: number = 0;

  parameters = {
    changeRandom: () => {
      this.action.changeRandom();
    },
    stopRandom: () => {
      this.action.stopRandom();
    },
    toggleLayout: () => {
      if (this.action.inAnimation()) {
        this.action.stopRandom();
        this.store.toggleChartLayout();
        setTimeout(() => {
          this.action.changeRandom();
        }, 300);
      } else {
        this.store.toggleChartLayout();
      }

    },
    barNumber: 0
  }

  constructor(props: IBarChartProps) {
    super(props);

    this.action = new BarChartAction();

    reaction(
      () => this.addNumber > 0,
      () => this.transmitIdsToAdd()
    )

    reaction(
      () => this.removeNumber > 0,
      () => this.transmitIdsToRemove()
    )

    this.init(props);
  }

  get newId() {
    return this._id++;
  }

  addDatas(num: number) {
    for (let i = 0; i < num; i++) {
      const id = this.newId;

      this.barData.push({
        id,
        value: 100 + 500 * Math.random(),
        color: [Math.random(), Math.random(), Math.random(), 1],
        label: `test${Math.random()}`
      })

      const bar = new Bar({
        value: 100 + 500 * Math.random(),
        color: [Math.random(), Math.random(), Math.random(), 1],
        labelText: `test_${id}`
      })

      this.store.appendSingleBar(id, bar);
      this.idsToAdd.push(id);
    }

    this.addNumber = num;
  }

  removeDatas(num: number) {
    for (let i = 0; i < num; i++) {
      const index = Math.floor(Math.random() * this.barData.length);
      const curLastIndex = this.barData.length - 1;

      const data = this.barData[index];
      this.barData[index] = this.barData[curLastIndex];
      this.barData[curLastIndex] = data;
      this.barData.pop();

      this.idsToRemove.push(data.id);
    }

    this.removeNumber = num;
  }

  transmitIdsToAdd() {
    this.store.receiveIdsToAdd(this.idsToAdd);
    this.idsToAdd = [];
    this.addNumber = 0;
  }

  transmitIdsToRemove() {
    this.store.receiveIdsToRemove(this.idsToRemove);
    this.idsToRemove = [];
    this.removeNumber = 0;
  }

  componentDidMount() {
    this.buildConsole();
  }

  buildConsole() {
    const ui = new dat.GUI();
    ui.add(this.parameters, "changeRandom");
    ui.add(this.parameters, "stopRandom");
    ui.add(this.parameters, 'toggleLayout');
    ui.add(this.parameters, "barNumber", 0, 20000, 1).onFinishChange((value: number) => {
      const curNumber = this.barData.length
      if (value > curNumber) {
        if (this.action.inAnimation()) {
          this.action.stopRandom();
          this.addDatas(value - curNumber);
          setTimeout(() => {
            this.action.changeRandom();
          }, 300);
        } else {
          this.addDatas(value - curNumber);
        }

      } else if (value < curNumber) {
        if (this.action.inAnimation()) {
          this.action.stopRandom();
          this.removeDatas(curNumber - value);
          setTimeout(() => {
            this.action.changeRandom();
          }, 800);
        } else {
          this.removeDatas(curNumber - value);
        }

      }
    });
  }

  init(props: IBarChartProps) {
    this.barData = props.data;
    const barNumber = this.barData.length;

    // Width
    const leftPadding = parsePadding(props.padding.left);
    const rightPadding = parsePadding(props.padding.right);
    const topPadding = parsePadding(props.padding.top);
    const bottomPadding = parsePadding(props.padding.bottom);

    // Labels follow bars
    this.store = new BarChartStore({
      padding: {
        left: leftPadding,
        right: rightPadding,
        top: topPadding,
        bottom: bottomPadding
      },
      width: window.innerWidth,
      height: window.innerHeight,
      shrink: props.shrink
    });

    for (let i = 0; i < barNumber; i++) {
      const id = this.newId;
      const d = this.barData[i];
      d.id = id;
      const bar = new Bar({
        labelText: d.label,
        value: d.value,
        color: d.color
      });

      this.store.appendSingleBar(id, bar);
      this.idsToAdd.push(id);
    }

    this.addNumber = barNumber;
    this.parameters.barNumber = barNumber;

    this.action.store = this.store;
  }

  render() {
    return <BarChartView store={this.store} action={this.action} />;
  }

}