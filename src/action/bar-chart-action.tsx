import { BarChartStore } from "../store";
import { IPickInfo, RectangleInstance, LabelInstance } from "deltav";

export class BarChartAction {
  store: BarChartStore;

  mouseOverRecHandler = (info: IPickInfo<RectangleInstance>) => {
    info.instances.forEach(instance => {
      instance.color = [1, 1, 1, 1]; // set a highlight color
      instance.position = [instance.position[0], instance.position[1] - 20];
      instance.size = [instance.size[0], instance.size[1] + 20];
      const bar = this.store.rectangleToBar.get(instance);
      if (bar) {
        bar.label.color = [1, 1, 1, 1];
      }
    });
  }

  mouseOutRecHandler = (info: IPickInfo<RectangleInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.rectangleToBar.get(instance);
      if (bar) {
        instance.color = bar.color;
        bar.label.color = [0.8, 0.8, 0.8, 1];
      }
    });
  }

  mouseOverLabelHandler = (info: IPickInfo<LabelInstance>) => {
    console.warn("mouse over label");
    info.instances.forEach(instance => {
      instance.color = [1, 1, 1, 1]; // set a highlight color
      const bar = this.store.labelToBar.get(instance);
      if (bar) {
        bar.rectangle.color = [1, 1, 1, 1];
      }
    });
  }

  mouseOutLabelHandler = (info: IPickInfo<LabelInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.labelToBar.get(instance);
      if (bar) {
        instance.color = [0.8, 0.8, 0.8, 1];
        bar.rectangle.color = bar.color;
      }
    });
  }
}