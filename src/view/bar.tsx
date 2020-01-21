import { RectangleInstance, LabelInstance, EdgeInstance } from "deltav";

export interface IBarOptions {
  labelText: string;
  value: number;
  color: [number, number, number, number];
}

export class Bar {
  labelText: string;
  value: number;
  color: [number, number, number, number];
  rectangle: RectangleInstance;
  recLine: EdgeInstance;
  label: LabelInstance;

  constructor(options: IBarOptions) {
    this.labelText = options.labelText;
    this.value = options.value;
    this.color = options.color;
  }
}