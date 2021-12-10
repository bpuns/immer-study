const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devtool: 'source-map',
  devServer: {
    port: 3001,
    host: '127.0.0.1',
    historyApiFallback: true,
    client: {
      logging: 'none',
      overlay: false,
      progress: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        loader: 'babel-loader',
        options: {
          presets: ["@babel/preset-typescript"]
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: false
    }),
    new HtmlWebpackPlugin(),
  ]
}