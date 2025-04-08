const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: './background.js',
    content: './content.js',
    popup: './popup.js',
    dashboard: './dashboard.js',
    options: './options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
   }
]}
};