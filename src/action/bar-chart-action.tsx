import { BarChartStore } from "../store";
import { IPickInfo, RectangleInstance, LabelInstance, EdgeInstance } from "deltav";
import { Bar } from "src/view/bar";

export class BarChartAction {
  store: BarChartStore;
  timer: number;

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
    console.warn('mouse over recline');
    info.instances.forEach(instance => {
      instance.setColor([1, 1, 1, 1]);
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
    this.timer = setInterval(() => {
      const index = Math.floor(Math.random() * this.store.idToBar.size);
      const bars: Bar[] = [];
      this.store.idToBar.forEach(bar => bars.push(bar));
      const bar = bars[index];
      const newValue = bar.value + 500 * Math.random();

      if (newValue > this.store.maxValue) {
        this.store.setMaxValue(newValue);
      }

      bar.value = newValue;
    })

  }

  stopeRandom() {
    clearInterval(this.timer);
  }
}