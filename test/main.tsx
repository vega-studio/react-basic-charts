import { Vec2, BasicSurface, InstanceProvider, EdgeInstance, LabelInstance, Camera2D, createFont, FontMapGlyphType, BasicCamera2DController, SimpleEventHandler, IMouseInteraction, createView, ClearFlags, View2D, createLayer, EdgeLayer, AutoEasingMethod, EdgeType, LabelLayer } from "deltav";
import { BarAxisChart } from "src/bar-axis-chart";

let barAxis: BarAxisChart;

async function makeSurface(container: HTMLElement) {
  let mouse: Vec2 = [0, 0];

  const surface = new BasicSurface({
    container,
    providers: {
      ticks: new InstanceProvider<EdgeInstance>(),
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
          ticks1: createLayer(EdgeLayer, {
            animate: {
              thickness: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.ticks,
            type: EdgeType.LINE,
          }),
          labels1: createLayer(LabelLayer, {
            data: providers.labels,
            resourceKey: resources.font.key
          }),
        }
      }
    })
  });

  await surface.ready;
  return surface;
}


async function start() {
  const container = document.getElementById('main');
  if (!container) return;

  const names: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const surface = await makeSurface(container);

  barAxis = new BarAxisChart({
    labels: names,
    data: [],
    barShrink: 0.9,
    view: {
      origin: [20, 600],
      size: [600, 300]
    },
    labelFont: "rest",
    barProvider: surface.providers.bars,
    axisProvider: {
      ticks: surface.providers.ticks,
      labels: surface.providers.labels
    }
  })
}

start();