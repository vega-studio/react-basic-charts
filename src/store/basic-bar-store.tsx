import { Vec, Vec2 } from "deltav";

export interface IBasicBarStoreOptions {
  barShrink: number;
  view: {
    origin: Vec2,
    size: Vec2
  }
}
export abstract class BasicBarStore {

}