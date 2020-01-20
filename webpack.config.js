const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const babelOptions = {
  babelrc: false,
  presets: [
    ['env', {
      targets: {
        browsers: [
          'last 2 Chrome versions',
          'last 2 Safari versions',
          'last 2 Firefox versions',
          'last 2 Edge versions',
        ]
      },
      modules: false
    }]
  ]
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const MODE = IS_PRODUCTION ? 'production' : 'development';

let library;
let libraryTarget;

if (IS_PRODUCTION) {
  library = 'bar-chart';
  libraryTarget = 'umd';
}

let entry = 'src';
if (IS_DEVELOPMENT) entry = 'test';

let path = resolve(__dirname, 'build');
if (IS_PRODUCTION) path = resolve(__dirname, 'dist');


module.exports = {
  mode: MODE,
  entry,
  devtool: 'source-map',
  output: {
    filename: 'index.js',
    path,
    library,
    libraryTarget,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          { loader: 'babel-loader', options: babelOptions },
          {
            loader: 'ts-loader',
            options: { transpileOnly: false }
          },
        ],
      },
      { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },
      { test: /\.html$/, use: { loader: 'file-loader', options: { name: '[name].html' } } },
    ]
  },
  resolve: {
    modules: ['.', './node_modules', './src'],
    extensions: ['.tsx', '.ts', '.js', 'jsx', '.json'],
  },
  resolveLoader: {
    modules: ['node_modules']
  }
};