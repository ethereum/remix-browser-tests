module.exports = {
  src_folders: ['dist/remixd-app/test/tests/app'],
  output_folder: './reports/tests',
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
    macos: {
      desiredCapabilities: {
        browserName: 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
        'goog:chromeOptions': {
          "binary": "./out/remixconnect-darwin-x64/remixconnect.app/Contents/MacOS/remixconnect",
          "args": [
            "--folder=test/contracts",
            "--remix-ide-url=http://localhost:8080",
            "--e2e"
          ]
        }
      }
    },
    linux: {
      desiredCapabilities: {
        browserName: 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
        'goog:chromeOptions': {
          "binary": "./out/remixconnect-linux-x64/remixconnect",
          "args": [
            "--folder=test/contracts",
            "--remix-ide-url=http://localhost:8080",
            "--e2e"
          ]
        }
      }
    },
    windows: {
      desiredCapabilities: {
        browserName: 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
        'goog:chromeOptions': {
          "binary": "./out/remixconnect-win32-x64/remixconnect.exe",
          "args": [
            "--folder=test/contracts",
            "--remix-ide-url=http://localhost:8080",
            "--e2e"
          ]
        }
      }
    }
  }
}
