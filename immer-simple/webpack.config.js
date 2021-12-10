const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devtool: 'source-map',
  devServer: {
    port: 3002,
    client: {
      logging: 'none'
    }
  },
  plugins: [
    new HtmlWebpackPlugin(),
  ]
}