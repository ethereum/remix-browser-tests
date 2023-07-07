module.exports = {
  src_folders: ['dist/remixd-app/test/tests/browser'],
  output_folder: './reports/tests',
  custom_commands_path: ['dist/remix-ide-e2e/src/commands'],
  custom_assertions_path: '',
  page_objects_path: '',
  globals_path: '',
  test_settings: {
    default: {
      selenium_port: 4444,
      selenium_host: 'localhost',
      globals: {
        waitForConditionTimeout: 10000,
        asyncHookTimeout: 100000
      },
      screenshots: {
        enabled: true,
        path: './reports/screenshots',
        on_failure: true,
        on_error: true
      },
    },
    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
        'goog:chromeOptions': {
          args: ['window-size=2560,1440', 'start-fullscreen', '--no-sandbox']
        }
      }
    },
    edge: {
      desiredCapabilities: {
        browserName: 'MicrosoftEdge',
        marionette: true,
        javascriptEnabled: true,
        acceptSslCerts: true,
        acceptInsecureCerts: true,
        'ms:edgeOptions': {
          args: ['window-size=2560,1440', 'start-fullscreen', '--no-sandbox']
        }
      }
    }
  }
}
