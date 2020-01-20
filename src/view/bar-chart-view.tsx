import React, { Component } from "react";
import {
  BasicSurface,
  InstanceProvider,
  Camera2D,
  BasicCamera2DController,
  createView,
  View2D,
  ClearFlags,
  createLayer,
  RectangleLayer,
  EdgeLayer,
  EdgeType,
  LabelLayer,
  IPickInfo,
  RectangleInstance,
  PickType,
  LabelInstance,
  EdgeInstance,
  AutoEasingMethod,
  AutoEasingLoopStyle
} from "deltav";
import { BarChartAction } from "src/action";
import { BarChartStore } from "src/store";
import { observer } from "mobx-react";
import { DEFAULT_RESOURCES } from "src/types";

const { random } = Math;

export interface IBarCharViewProps {
  action: BarChartAction;
  store: BarChartStore;
}

@observer export class BarChartView extends Component<IBarCharViewProps> {
  action: BarChartAction;
  store: BarChartStore;

  testProvider = {
    rectangles: new InstanceProvider<RectangleInstance>(),
    labels: new InstanceProvider<LabelInstance>(),
    lines: new InstanceProvider<EdgeInstance>()
  }

  constructor(props: IBarCharViewProps) {
    super(props);
    this.action = props.action;
    this.store = props.store;
  }

  componentDidMount() {
    const container: React.ReactInstance = this.refs.container;
    this.makeSurface(container as HTMLElement);
  }

  componentWillUnmount() {

  }

  testHandler() {
    console.warn("test");
  }

  async makeSurface(container: HTMLElement) {
    const surface = new BasicSurface({
      container,
      providers: this.store.providers,
      cameras: {
        main: new Camera2D()
      },
      resources: {
        font: DEFAULT_RESOURCES.font
      },
      eventManagers: cameras => ({
        controller: new BasicCamera2DController({
          camera: cameras.main,
          startView: "main.main"
        })
      }),
      scenes: (resources, providers, cameras) => ({
        scenes: {
          main: {
            views: {
              main: createView(View2D, {
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
                },
              }),
              createLayer(RectangleLayer, {
                animate: {
                  color: AutoEasingMethod.easeInOutCubic(300),
                  location: AutoEasingMethod.easeInOutCubic(500)
                },
                data: providers.rectangles,
                key: `recs`,
                picking: PickType.SINGLE,
                onMouseOver: this.action.mouseOverRecHandler,
                onMouseOut: this.action.mouseOutRecHandler,
              }),
              createLayer(EdgeLayer, {
                data: providers.lines,
                key: `lines`,
                type: EdgeType.LINE,
                picking: PickType.SINGLE
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
    const styles = {
      width: '100%',
      height: '100%'
    }

    return <div ref='container' style={styles}></div>;
  }
}