import { BarChartStore } from "../store";
import { IPickInfo, RectangleInstance, LabelInstance, EdgeInstance } from "deltav";
import { Bar } from "src/view/bar";

export class BarChartAction {
  store: BarChartStore;
  private timer: number = null;

  mouseOverRecLineHandler = (info: IPickInfo<EdgeInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.recLineToBar.get(instance);

      if (bar && !bar.selected) {
        instance.setColor(this.store.barHighlightColor);
        // bar.label.color = this.store.labelHighlightColor;
      }
    });
  }

  mouseOutRecLineHandler = (info: IPickInfo<EdgeInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.recLineToBar.get(instance);

      if (bar && !bar.selected) {
        instance.setColor(bar.color);
        // bar.label.color = this.store.labelColor;
      }
    });
  }

  mouseClickRecLineHandler = (info: IPickInfo<EdgeInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.recLineToBar.get(instance);

      if (bar) {
        if (bar.selected) {
          instance.setColor(bar.color);
          // bar.label.color = this.store.labelColor;
          bar.selected = false;
        } else {
          instance.setColor(this.store.barHighlightColor);
          // bar.label.color = this.store.labelHighlightColor;
          bar.selected = true;
        }
      }
    });
  }

  /*mouseOverLabelHandler = (info: IPickInfo<LabelInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.labelToBar.get(instance);

      if (bar && !bar.selected) {
        instance.color = this.store.labelHighlightColor;
        bar.recLine.setColor(this.store.barHighlightColor);
      }
    });
  }

  mouseOutLabelHandler = (info: IPickInfo<LabelInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.labelToBar.get(instance);

      if (bar && !bar.selected) {
        instance.color = this.store.labelColor;
        bar.recLine.setColor(bar.color);
      }
    });
  }

  mouseClickLabelHandler = (info: IPickInfo<LabelInstance>) => {
    info.instances.forEach(instance => {
      const bar = this.store.labelToBar.get(instance);

      if (bar) {
        if (bar.selected) {
          bar.recLine.setColor(bar.color);
          instance.color = this.store.labelColor;
          bar.selected = false;
        } else {
          bar.recLine.setColor(this.store.barHighlightColor);
          instance.color = this.store.labelHighlightColor;
          bar.selected = true;
        }
      }
    });
  }*/

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

  stopRandom() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  inAnimation() {
    return this.timer !== null;
  }
}