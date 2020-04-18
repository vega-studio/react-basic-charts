import { Vec, Vec2, InstanceProvider, EdgeInstance } from "deltav";

export interface IBasicBarStoreOptions {
  data: number[];
  barShrinkFactor: number;
  provider: InstanceProvider<EdgeInstance>;
  /** Indicates whether the axis layouts in vertical direction */
  verticalLayout?: boolean;
  view: {
    origin: Vec2,
    size: Vec2
  }
}

export class BasicBarStore {
  constructor(options: IBasicBarStoreOptions) {

  }
}