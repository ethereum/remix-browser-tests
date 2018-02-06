var yo = require('yo-yo')

var css = require('./styles/support-tab-styles')

var infoText = yo`
  <div>
    Have a question, found a bug or want to propose a feature? Have a look at the
    <a target="_blank" href='https://github.com/ethereum/browser-solidity/issues'> issues</a> or check out
    <a target="_blank" href='https://remix.readthedocs.io/en/latest/'> the documentation page on Remix</a> or
    <a target="_blank" href='https://solidity.readthedocs.io/en/latest/'> Solidity</a>.
  </div>
`

function supportTab (container) {
  var el = yo`
    <div class="${css.supportTabView} "id="supportView">
      <div>
        <div class="${css.infoBox}">
          ${infoText}
        </div>
      </div>
      <div class="${css.chat}">
        <div class="${css.chatTitle}" onclick=${openLink} title='Click to open chat in Gitter'>
          <div class="${css.chatTitleText}">ethereum/remix community chat</div>
        </div>
        <iframe class="${css.chatIframe}" src='https://gitter.im/ethereum/remix/~embed'>
      </div>
    </div>
  `
  container.appendChild(el)
  return el
}

function openLink () {
  window.open('https://gitter.im/ethereum/remix')
}

module.exports = supportTab
