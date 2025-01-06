const {composePlugins, withNx} = require('@nrwl/webpack')
const {withReact} = require('@nrwl/react')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: false,
    os: false,
    fs: false,
    module: false
  }

  // add public path
  config.output.publicPath = '/'

  // add copy & provide plugin
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      url: ['url', 'URL'],
      process: 'process/browser'
    }),
    new webpack.DefinePlugin({
      BROWSER: true
    })
  )

  // source-map loader
  config.module.rules.push({
    test: /\.js$/,
    use: ['source-map-loader'],
    enforce: 'pre'
  })

  config.ignoreWarnings = [/Failed to parse source map/] // ignore source-map-loader warnings

  // set minimizer
  config.optimization.minimizer = [
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        ecma: 2015,
        compress: false,
        mangle: false,
        format: {
          comments: false
        }
      },
      extractComments: false
    }),
    new CssMinimizerPlugin()
  ]

  return config
})
