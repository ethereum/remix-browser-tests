const nxWebpack = require('@nrwl/react/plugins/webpack')

module.exports = config => {
    const nxWebpackConfig = nxWebpack(config)

    return {
        ...nxWebpackConfig,
        node: {
            fs: 'empty',
            tls: 'empty',
            readline: 'empty',
            net: 'empty',
            module: 'empty',
            child_process: 'empty'
        }
    }
}
