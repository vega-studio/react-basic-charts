import { BarChart } from "src";
import ReactDOM from "react-dom";
import React from "react";
import { BarType } from "src/types";
import { Color } from "deltav";

function start() {
  const containter = document.getElementById('main');
  if (!containter) return;

  const barData: BarType[] = [];
  const names: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const colors: Color[] = [
    [246 / 255, 229 / 255, 141 / 255, 1],
    [255 / 255, 121 / 255, 121 / 255, 1],
    [186 / 255, 220 / 255, 88 / 255, 1],
    [223 / 255, 249 / 255, 251 / 255, 1],
    [126 / 255, 214 / 255, 223 / 255, 1],
    [224 / 255, 86 / 255, 253 / 255, 1],
    [104 / 255, 109 / 255, 224 / 255, 1],
    [48 / 255, 51 / 255, 107 / 255, 1],
    [149 / 255, 175 / 255, 192 / 255, 1],
    [249 / 255, 202 / 255, 36 / 255, 1],
    [34 / 255, 166 / 255, 179 / 255, 1],
    [72 / 255, 52 / 255, 212 / 255, 1]
  ]
  for (let i = 0; i < 12; i++) {
    barData.push({
      label: names[i],
      value: 100 + 700 * Math.random(),
      color: colors[i]
    })
  }

  let eli;

  ReactDOM.render(
    <BarChart
      data={barData}
      width={window.innerWidth * 0.8}
      height={window.innerHeight * 0.8}
      padding={
        {
          left: "20%",
          right: 1,
          top: 1,
          bottom: 1
        }
      }
      origin={[window.innerWidth * 0.1, window.innerHeight * 0.9]}
      labelFont="font"
      labelColor={[1, 1, 1, 1]}
      lineColor={[1, 1, 1, 1]}
      lineWidth={1}
      ref={el => eli = el}
    />,
    containter
  );

}

start();