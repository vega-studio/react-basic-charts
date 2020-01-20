const webpack = require('webpack');
const DevServer = require('webpack-dev-server');

process.env.NODE_ENV = 'development';

const config = require('../webpack.config.js');
const compiler = webpack(config);

const server = new DevServer(compiler, {
  compress: true,
  port: process.env.PORT || 8080
});

server.listen(process.env.PORT || 8080, process.env.HOST || '0.0.0.0', () => {
  console.log(`Starting server on ${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 8080}`);
});