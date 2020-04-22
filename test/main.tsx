import { Vec2, BasicSurface, InstanceProvider, EdgeInstance, LabelInstance, Camera2D, createFont, FontMapGlyphType, BasicCamera2DController, SimpleEventHandler, IMouseInteraction, createView, ClearFlags, View2D, createLayer, EdgeLayer, AutoEasingMethod, EdgeType, LabelLayer, RectangleLayer, RectangleInstance } from "deltav";
import { BarAxisChart } from "src/bar-axis-chart";
import * as dat from "dat.gui";

let barAxis: BarAxisChart;

const parameters = {
  toggleLayout: () => {
    if (barAxis) {
      barAxis.changeAxis();
    }
  },
  setView: () => {
    if (barAxis) {
      barAxis.setView({
        origin: [400 + 50 * Math.random(), 700 + 50 * Math.random()],
        size: [800 + 300 * Math.random(), 600 + 200 * Math.random()]
      })
    }
  }
}

async function makeSurface(container: HTMLElement) {
  let mouse: Vec2 = [0, 0];

  const surface = new BasicSurface({
    container,
    providers: {
      ticks: new InstanceProvider<EdgeInstance>(),
      masks: new InstanceProvider<RectangleInstance>(),
      bars: new InstanceProvider<EdgeInstance>(),
      labels: new InstanceProvider<LabelInstance>(),
    },
    cameras: {
      main: new Camera2D(),
      axis: new Camera2D()
    },
    resources: {
      font: createFont({
        dynamic: true,
        fontSource: {
          errorGlyph: ' ',
          family: 'Verdana',
          size: 64,
          weight: 400,
          localKerningCache: false,
          type: FontMapGlyphType.BITMAP
        }
      })
    },
    eventManagers: cameras => ({
      controller: new BasicCamera2DController({
        camera: cameras.main,
        panFilter: (offset: [number, number, number]) => {
          if (barAxis) barAxis.shift(offset);
          return [0, 0, 0];
        },
        scaleFilter: (scale: [number, number, number]) => {
          if (barAxis) barAxis.zoom(mouse, scale);
          return [0, 0, 0];
        },
      }),
      simple: new SimpleEventHandler({
        handleMouseMove: (e: IMouseInteraction) => {
          mouse = e.mouse.currentPosition;
        }
      })
    }),
    scenes: (resources, providers, cameras) => ({
      main: {
        views: {
          start: createView(View2D, {
            camera: cameras.main,
            background: [0, 0, 0, 1],
            clearFlags: [ClearFlags.COLOR, ClearFlags.DEPTH]
          })
        },
        layers: {
          recs: createLayer(EdgeLayer, {
            data: providers.bars,
            type: EdgeType.LINE,
          }),
          masks: createLayer(RectangleLayer, {
            data: providers.masks,
          }),
          ticks: createLayer(EdgeLayer, {
            animate: {
              thickness: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.ticks,
            type: EdgeType.LINE,
          }),
          labels: createLayer(LabelLayer, {
            data: providers.labels,
            resourceKey: resources.font.key
          })
        }
      }
    })
  });

  await surface.ready;
  return surface;
}

function buildConsole() {
  const ui = new dat.GUI();
  ui.add(parameters, 'toggleLayout');
  ui.add(parameters, 'setView');
}

async function start() {
  const container = document.getElementById('main');
  if (!container) return;

  const names: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const datas: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const surface = await makeSurface(container);

  barAxis = new BarAxisChart({
    labels: names,
    data: datas,
    barShrink: 0.9,
    view: {
      origin: [300, 600],
      size: [800, 300]
    },
    labelFont: "rest",
    barProvider: {
      bars: surface.providers.bars,
      masks: surface.providers.masks,
    },
    axisProvider: {
      ticks: surface.providers.ticks,
      labels: surface.providers.labels
    },
    verticalLayout: false
  })

  buildConsole();
}

start();