import { RectangleInstance, LabelInstance, EdgeInstance } from "deltav";
import { observable, computed } from "mobx";

export interface IBarOptions {
  labelText: string;
  value: number;
  color: [number, number, number, number];
}

export class Bar {
  labelText: string;
  private _value: number;
  color: [number, number, number, number];
  rectangle: RectangleInstance;
  recLine: EdgeInstance;
  label: LabelInstance;
  width: number;
  selected: boolean = false;

  constructor(options: IBarOptions) {
    this.labelText = options.labelText;
    this._value = options.value;
    this.color = options.color;
  }

  get value() {
    return this._value
  }

  set value(val: number) {
    if (this.recLine) {
      const start = this.recLine.start;
      const end = this.recLine.end;
      const width = end[0] - start[0];
      const height = start[1] - end[1];

      if (height > width) {
        const newH = height * val / this._value;
        this.recLine.end = [end[0], start[1] - newH];
      } else if (width > height) {
        const newW = width * val / this._value;
        this.recLine.end = [start[0] + newW, end[1]];
      }

    }

    this._value = val;
  }
}