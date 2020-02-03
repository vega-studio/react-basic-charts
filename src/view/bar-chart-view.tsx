import React, { Component } from "react";
import {
  BasicSurface,
  Camera2D,
  BasicCamera2DController,
  createView,
  View2D,
  ClearFlags,
  createLayer,
  EdgeLayer,
  EdgeType,
  LabelLayer,
  IPickInfo,
  PickType,
  LabelInstance,
  AutoEasingMethod,
  RectangleLayer,
} from "deltav";
import { BarChartAction } from "src/action";
import { BarChartStore } from "src/store";
import { observer } from "mobx-react";
import { DEFAULT_RESOURCES } from "src/types";

export interface IBarCharViewProps {
  action: BarChartAction;
  store: BarChartStore;
}

@observer export class BarChartView extends Component<IBarCharViewProps> {
  action: BarChartAction;
  store: BarChartStore;
  mainCamera: Camera2D = new Camera2D();

  constructor(props: IBarCharViewProps) {
    super(props);
    this.action = props.action;
    this.store = props.store;
    window.onresize = this.resize.bind(this);
  }

  componentDidMount() {
    const container: React.ReactInstance = this.refs.container;
    this.makeSurface(container as HTMLElement);
  }

  componentWillUnmount() {

  }

  resize() {
    this.store.resize(window.innerWidth, window.innerHeight);
  }

  async makeSurface(container: HTMLElement) {
    const surface = new BasicSurface({
      container,
      providers: this.store.providers,
      cameras: {
        main: new Camera2D(),
        axis: new Camera2D()
      },
      resources: {
        font: DEFAULT_RESOURCES.font
      },
      eventManagers: cameras => ({
        controller: new BasicCamera2DController({
          camera: cameras.main,
          panFilter: (offset: [number, number, number]) => {
            this.store.addOffset(offset);
            return [0, 0, 0];
          },
          scaleFilter: (scale: [number, number, number]) => {
            if (this.action.inAnimation()) {
              this.action.stopRandom();
              this.store.scale = this.store.scale + scale[0];
              setTimeout(() => { this.action.changeRandom() }, 500);
            } else {
              this.store.scale = this.store.scale + scale[0];
            }

            return [0, 0, 0];
          }
        }),
      }),
      scenes: (resources, providers, cameras) => ({
        resources: [],
        scenes: {
          main: {
            views: {
              start: createView(View2D, {
                camera: cameras.main,
                background: [0, 0, 0, 1],
                clearFlags: [ClearFlags.COLOR, ClearFlags.DEPTH]
              })
            },
            layers: [
              createLayer(EdgeLayer, {
                animate: {
                  startColor: AutoEasingMethod.easeInOutCubic(300),
                  endColor: AutoEasingMethod.easeInOutCubic(300),
                  start: AutoEasingMethod.easeInOutCubic(300),
                  end: AutoEasingMethod.easeInOutCubic(300),
                  thickness: AutoEasingMethod.easeInOutCubic(300)
                },
                data: providers.recLines,
                key: `recLines`,
                picking: PickType.SINGLE,
                type: EdgeType.LINE,
                onMouseOver: this.action.mouseOverRecLineHandler,
                onMouseOut: this.action.mouseOutRecLineHandler,
                onMouseClick: this.action.mouseClickRecLineHandler
              }),
              createLayer(LabelLayer, {
                animate: {
                  color: AutoEasingMethod.easeInOutCubic(300),
                  origin: AutoEasingMethod.easeInOutCubic(1)
                },
                data: providers.labels,
                key: `labels`,
                resourceKey: resources.font.key,
                picking: PickType.SINGLE,
                onMouseOver: this.action.mouseOverLabelHandler,
                onMouseOut: this.action.mouseOutLabelHandler,
                onMouseClick: this.action.mouseClickLabelHandler
              }),
            ]
          },
          axis: {
            views: {
              fixView: createView(View2D, {
                camera: cameras.axis
              })
            },
            layers: [
              createLayer(EdgeLayer, {
                animate: {
                  start: AutoEasingMethod.easeInOutCubic(300),
                  end: AutoEasingMethod.easeInOutCubic(300)
                },
                data: providers.lines,
                key: `lines`,
                type: EdgeType.LINE,
              }),
              createLayer(RectangleLayer, {
                data: providers.rectangles,
                key: 'mask'
              })
            ]
          }
        }
      })
    });

    await surface.ready;
    return surface;
  }

  render() {
    return <div
      ref='container'
      style={{ width: '100%', height: '100%' }}
    ></div>;
  }
}