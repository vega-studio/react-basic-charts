import { BarChartStore } from "../store";
import { IPickInfo, RectangleInstance, LabelInstance, EdgeInstance } from "deltav";

export class BarChartAction {
  store: BarChartStore;

  mouseOverRecHandler = (info: IPickInfo<RectangleInstance>) => {
    info.instances.forEach(instance => {
      instance.color = [1, 1, 1, 1]; // set a highlight color
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

  mouseOverRecLineHandler = (info: IPickInfo<EdgeInstance>) => {
    info.instances.forEach(instance => {
      instance.setColor([1, 1, 1, 1]); // set a highlight color
      //instance.end = [instance.end[0], instance.end[1] - 20];
      //instance.size = [instance.size[0], instance.size[1] + 20];
      const bar = this.store.recLineToBar.get(instance);
      if (bar) {
        bar.label.color = [1, 1, 1, 1];
      }
    });
  }

  mouseOutRecLineHandler = (info: IPickInfo<EdgeInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.recLineToBar.get(instance);
      if (bar) {
        instance.setColor(bar.color);
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

  changeRandom() {
    setInterval(() => {
      const index = Math.floor(Math.random() * this.store.bars.length);
      const bar = this.store.bars[index];
      const newValue = bar.value + 500 * Math.random();

      if (newValue > this.store.maxValue) {
        this.store.setMaxValue(newValue);
      }

      bar.value = newValue;
    })

  }
}