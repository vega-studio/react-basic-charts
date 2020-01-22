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
    this.testHandler = this.testHandler.bind(this);
  }

  componentDidMount() {
    const container: React.ReactInstance = this.refs.container;
    this.makeSurface(container as HTMLElement);
  }

  componentWillUnmount() {

  }

  testHandler(e: React.MouseEvent) {
    console.warn("test");
    const offset = this.mainCamera.offset;
    this.mainCamera.control2D.setOffset([offset[0] + 10, offset[1], offset[2]]);
  }

  

  resize() {
    console.warn('width', window.innerWidth, 'height', window.innerHeight);
    console.warn(this.store);
    this.store.resize(window.innerWidth, window.innerHeight);
  }

  async makeSurface(container: HTMLElement) {
    const surface = new BasicSurface({
      container,
      providers: this.store.providers,
      cameras: {
        main: this.mainCamera
      },
      resources: {
        font: DEFAULT_RESOURCES.font
      },
      eventManagers: cameras => ({
        controller: new BasicCamera2DController({
          camera: cameras.main
        })
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
              createLayer(LabelLayer, {
                animate: {
                  color: AutoEasingMethod.easeInOutCubic(300)
                },
                data: providers.labels,
                key: `labels`,
                resourceKey: resources.font.key,
                picking: PickType.SINGLE,
                onMouseOver: (info: IPickInfo<LabelInstance>) => {
                  console.warn('label', info);
                }
              }),
              /*createLayer(RectangleLayer, {
                animate: {
                  color: AutoEasingMethod.easeInOutCubic(300),
                  location: AutoEasingMethod.easeInOutCubic(500)
                },
                data: providers.rectangles,
                key: `recs`,
                picking: PickType.SINGLE,
                onMouseOver: this.action.mouseOverRecHandler,
                onMouseOut: this.action.mouseOutRecHandler,
              }),*/
              createLayer(EdgeLayer, {
                animate: {
                  startColor: AutoEasingMethod.easeInOutCubic(300),
                  endColor: AutoEasingMethod.easeInOutCubic(300),
                  end: AutoEasingMethod.easeInOutCubic(500)
                },
                data: providers.recLines,
                key: `recLines`,
                picking: PickType.SINGLE,
                type: EdgeType.LINE,
                onMouseOver: this.action.mouseOverRecLineHandler,
                onMouseOut: this.action.mouseOutRecLineHandler,
              }),
              createLayer(EdgeLayer, {
                data: providers.lines,
                key: `lines`,
                type: EdgeType.LINE,
                picking: PickType.SINGLE,
              }),
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
      onMouseDown={this.testHandler}
    ></div>;
  }
}