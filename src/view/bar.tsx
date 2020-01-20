import { RectangleInstance, LabelInstance } from "deltav";

export interface IBarOptions {
  height: number;
  labelText: string;
  value: number;
  color: [number, number, number, number];
}

export class Bar {
  height: number;
  labelText: string;
  value: number;
  color: [number, number, number, number];
  rectangle: RectangleInstance;
  label: LabelInstance;

  constructor(options: IBarOptions) {
    this.height = options.height;
    this.labelText = options.labelText;
    this.value = options.value;
    this.color = options.color;
  }
}