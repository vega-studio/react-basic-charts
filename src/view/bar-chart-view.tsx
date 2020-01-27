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
    this.store.resize(window.innerWidth, window.innerHeight);
  }

  async makeSurface(container: HTMLElement) {
    const surface = new BasicSurface({
      container,
      providers: this.store.providers,
      cameras: {
        main: new Camera2D(),
        axis: new Camera2D(),
        label: new Camera2D()
      },
      resources: {
        font: DEFAULT_RESOURCES.font
      },
      eventManagers: cameras => ({
        controller: new BasicCamera2DController({
          camera: cameras.main,
          panFilter: (offset: [number, number, number]) => {
            console.warn("Scale while offset changing", cameras.main.scale2D);
            return [offset[0], 0, 0];
          },
          scaleFilter: (scale: [number, number, number]) => {
            this.store.scale = this.store.scale + scale[0];//cameras.main.scale2D[0];
            console.warn("scale", this.store.scale);
            return [0, 0, 0];
          }
        }),
        labelControl: new BasicCamera2DController({
          camera: cameras.label,
          panFilter: (offset: [number, number, number]) => {
            return [offset[0], 0, 0];
          },
          scaleFilter: (scale: [number, number, number]) => {
            /*const scale2D = cameras.main.scale2D;
            let i = 0;
            this.store.idToBar.forEach(
              bar => {
                console.warn('scale ', i, bar);
                bar.label.origin = [i * 100 * scale2D[0], bar.label.origin[1]];
                i++;
              }
            );*/
            return [0, 0, 0]
          }
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
              }),
            ]
          },
          labels: {
            views: {
              labelView: createView(View2D, {
                camera: cameras.label,
              })
            },
            layers: [
              createLayer(LabelLayer, {
                animate: {
                  color: AutoEasingMethod.easeInOutCubic(300),
                  origin: AutoEasingMethod.easeInOutCubic(300)
                },
                data: providers.labels,
                key: `labels`,
                resourceKey: resources.font.key,
                picking: PickType.SINGLE,
                onMouseOver: (info: IPickInfo<LabelInstance>) => {
                  console.warn('label', info);
                }
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