const {composePlugins, withNx} = require('@nrwl/webpack')
const {withReact} = require('@nrwl/react')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const version = require('../../package.json').version
const fs = require('fs')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const path = require('path')

const versionData = {
  version: version,
  timestamp: Date.now(),
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

const loadLocalSolJson = async () => {
  //execute apps/remix-ide/ci/downloadsoljson.sh
  console.log('loading local soljson')
  const child = require('child_process').execSync('bash ' + __dirname + '/ci/downloadsoljson.sh', { encoding: 'utf8', cwd: process.cwd(), shell: true })
  // show output
  console.log(child)
}

fs.writeFileSync(__dirname + '/src/assets/version.json', JSON.stringify(versionData))


loadLocalSolJson()

const project = fs.readFileSync(__dirname + '/project.json', 'utf8')

const implicitDependencies = JSON.parse(project).implicitDependencies

const copyPatterns = implicitDependencies.map((dep) => {
  try {
    fs.statSync(__dirname + `/../../dist/apps/${dep}`).isDirectory()
    return { from: __dirname + `/../../dist/apps/${dep}`, to: `plugins/${dep}` }
  }
  catch (e) {
    console.log('error', e)
    return false
  }
})

console.log('Copying plugins... ', copyPatterns)

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`

  // add fallback for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    constants: require.resolve('constants-browserify'),
    os: false, //require.resolve("os-browserify/browser"),
    timers: false, // require.resolve("timers-browserify"),
    zlib: require.resolve('browserify-zlib'),
    'assert/strict': require.resolve('assert/'),
    fs: false,
    module: false,
    tls: false,
    net: false,
    readline: false,
    child_process: false,
    buffer: require.resolve('buffer/'),
    vm: require.resolve('vm-browserify')
  }

  // add externals
  config.externals = {
    ...config.externals,
    solc: 'solc',
  }

  // uncomment this to enable react profiling
  /*
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-dom$': 'react-dom/profiling',
  }
  */

  // use the web build instead of the node.js build
  // we do like that because using "config.resolve.alias" doesn't work
  let  pkgVerkle = fs.readFileSync(path.resolve(__dirname, '../../node_modules/rust-verkle-wasm/package.json'), 'utf8')
  pkgVerkle = pkgVerkle.replace('"main": "./nodejs/rust_verkle_wasm.js",', '"main": "./web/rust_verkle_wasm.js",')
  fs.writeFileSync(path.resolve(__dirname, '../../node_modules/rust-verkle-wasm/package.json'), pkgVerkle)

  config.resolve.alias = {
    ...config.resolve.alias,
    // 'rust-verkle-wasm$': path.resolve(__dirname, '../../node_modules/rust-verkle-wasm/web/run_verkle_wasm.js')
  }


  // add public path
  if(process.env.NX_DESKTOP_FROM_DIST){
    config.output.publicPath = './'
  }else{
    config.output.publicPath = '/'
  }

  // set filename
  config.output.filename = `[name].${versionData.version}.${versionData.timestamp}.js`
  config.output.chunkFilename = `[name].${versionData.version}.${versionData.timestamp}.js`

  // add copy & provide plugin
  config.plugins.push(
    new CopyPlugin({
      patterns: [
        {
          from: '../../node_modules/monaco-editor/min/vs',
          to: 'assets/js/monaco-editor/min/vs'
        },
        ...copyPatterns
      ].filter(Boolean)
    }),
    new CopyFileAfterBuild(),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      url: ['url', 'URL'],
      process: 'process/browser'
    })
  )

  // source-map loader
  config.module.rules.push({
    test: /\.js$/,
    use: ['source-map-loader'],
    enforce: 'pre'
  })

  config.ignoreWarnings = [/Failed to parse source map/, /require function/] // ignore source-map-loader warnings & AST warnings

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

  // minify code
  if(process.env.NX_DESKTOP_FROM_DIST)
    config.optimization.minimize = true

  config.watchOptions = {
    ignored: /node_modules/
  }

  console.log('config', process.env.NX_DESKTOP_FROM_DIST)
  return config;
});

class CopyFileAfterBuild {
  apply(compiler) {
    const onEnd = async () => {
      try {
        console.log('running CopyFileAfterBuild')
        // This copy the raw-loader files used by the etherscan plugin to the remix-ide root folder.
        // This is needed because by default the etherscan resources are served from the /plugins/etherscan/ folder,
        // but the raw-loader try to access the resources from the root folder.
        const files = fs.readdirSync('./dist/apps/etherscan')
        files.forEach((file) => {
          if (file.includes('plugin-etherscan')) {
            fs.copyFileSync('./dist/apps/etherscan/' + file, './dist/apps/remix-ide/' + file)
          }
        })
      } catch (e) {
        console.error('running CopyFileAfterBuild failed with error: ' + e.message)
      }
    }
    compiler.hooks.afterEmit.tapPromise('FileManagerPlugin', onEnd)
  }
}
