import { BasicBarStore, IBasicBarStoreOptions } from "./basic-bar-store";

export interface IDateBarStoreOptions extends IBasicBarStoreOptions {

}

export class DateBarStore extends BasicBarStore {
  constructor(options: IDateBarStoreOptions) {
    super(options);
  }

  layout() {

  }

  clearRange() {

  }
}