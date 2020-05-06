import { Vec2, BasicSurface, InstanceProvider, EdgeInstance, LabelInstance, Camera2D, createFont, FontMapGlyphType, BasicCamera2DController, SimpleEventHandler, IMouseInteraction, createView, ClearFlags, View2D, createLayer, EdgeLayer, AutoEasingMethod, EdgeType, LabelLayer, RectangleLayer, RectangleInstance } from "deltav";
import { BarAxisChart } from "src/bar-axis-chart";
import * as dat from "dat.gui";
import moment from "moment";
import { NumberBarAxisChart } from "src/number-bar-axis-chart";
import { FixedLabelAxis } from "deltav-axis-2d";

let barAxis: NumberBarAxisChart;

let labelAxis: BarAxisChart;

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
      ticks2: new InstanceProvider<EdgeInstance>(),
      masks2: new InstanceProvider<RectangleInstance>(),
      bars2: new InstanceProvider<EdgeInstance>(),
      labels2: new InstanceProvider<LabelInstance>(),
      ticks3: new InstanceProvider<EdgeInstance>(),
      labels3: new InstanceProvider<LabelInstance>()
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
          if (labelAxis) labelAxis.shift(offset);
          return [0, 0, 0];
        },
        scaleFilter: (scale: [number, number, number]) => {
          if (barAxis) barAxis.zoom(mouse, scale);
          if (labelAxis) labelAxis.zoom(mouse, scale);
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
          }),
          recs2: createLayer(EdgeLayer, {
            data: providers.bars2,
            type: EdgeType.LINE,
          }),
          masks2: createLayer(RectangleLayer, {
            data: providers.masks2,
          }),
          ticks2: createLayer(EdgeLayer, {
            animate: {
              thickness: AutoEasingMethod.easeInOutCubic(300)
            },
            data: providers.ticks2,
            type: EdgeType.LINE,
          }),
          labels2: createLayer(LabelLayer, {
            data: providers.labels2,
            resourceKey: resources.font.key
          }),
          tick3: createLayer(EdgeLayer, {
            data: providers.ticks3,
            type: EdgeType.LINE,
          }),
          labels3: createLayer(LabelLayer, {
            data: providers.labels3,
            resourceKey: resources.font.key
          }),
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

// Simulate get data from database
function dataRetriever() {

}

async function start() {
  const container = document.getElementById('main');
  if (!container) return;

  const startDate = new Date(2020, 2, 21);
  const endDate = new Date();

  const candidates = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const names: string[] = [];
  const datas: number[] = [];

  for (let i = 0; i < 100; i++) {
    names.push(candidates[Math.floor(Math.random() * 12)]);
    datas.push(Math.random() * 10);
  }
  const surface = await makeSurface(container);

  barAxis = new NumberBarAxisChart({
    numberRange: [1, 994],
    numberGap: 1,
    barShrink: 0.9,
    view: {
      origin: [300, 600],
      size: [1000, 300]
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

  const fixAxis = new FixedLabelAxis({
    labels: ["0", "50", "100", "150", "200", "250", "300"],
    view: {
      origin: [300, 600],
      size: [1000, 300]
    },
    providers: {
      ticks: surface.providers.ticks3,
      labels: surface.providers.labels3
    },
    verticalLayout: true
  })

  labelAxis = new BarAxisChart({
    labels: names,
    data: datas,
    barShrink: 0.9,
    view: {
      origin: [300, 1100],
      size: [1000, 300]
    },
    labelFont: "rest",
    barProvider: {
      bars: surface.providers.bars2,
      masks: surface.providers.masks2,
    },
    axisProvider: {
      ticks: surface.providers.ticks2,
      labels: surface.providers.labels2
    },
    verticalLayout: false
  })

  buildConsole();
}

start();