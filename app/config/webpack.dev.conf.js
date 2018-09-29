const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const productionMode = process.env.NODE_ENV === 'production'

const envPlugin = new webpack.EnvironmentPlugin([
  'NODE_ENV',
  'API_URL'
])

module.exports = {
  mode: productionMode ? 'production' : 'development',
  entry: path.resolve(__dirname, '../src/main.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': path.resolve(__dirname, '../src')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader"
        },
        include: [path.resolve(__dirname, '../src')]
      }
      ,{
        test: /\.vue$/,
        loader: 'vue-loader'
      }
      ,{
        test: /\.s?[ac]ss$/,
        use: [{
          loader: MiniCssExtractPlugin.loader
        }, {
          loader: 'css-loader',
          options: {
            sourceMap: true
          }
        }, {
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        }]
      }
      ,{
        test: /\.(png|svg|jpg|gif)$/,
        use: [{
          loader: 'file-loader',
          options: {
            outputPath: 'images/'
          }
        }]
      }
      ,{
        test: /\.(eot|svg|otf|ttf|woff|woff2)$/,
        use: [{
          loader: 'file-loader?name=./fonts/[name].[ext]'
        }]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.html'),
      inject: true
    }),
    new MiniCssExtractPlugin({
      filename: productionMode ? '[name].[hash].css' : '[name].css',
      chunkFilename: productionMode ? '[id].[hash].css' : '[id].css'
    }),
    envPlugin
  ],
  devtool: productionMode ? 'cheap-eval-source-map' : 'source-map'
};