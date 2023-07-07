module.exports = {
  baseURL: 'https://selenium-release.storage.googleapis.com',
  drivers: {
    chrome: {
      version: '112.0.5615.28',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    chromiumedge: {
      version: '112.0.1722.39',
      arch: process.arch,
      baseURL: 'https://msedgedriver.azureedge.net/'
    }
  }
}
