const domains = {
  'remix-alpha.ethereum.org': 27,
  'remix-beta.ethereum.org': 25,
  'remix.ethereum.org': 23
}
if (domains[window.location.hostname]) {
  var _paq = window._paq = window._paq || []
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['disableCookies']);
  _paq.push(['enableJSErrorTracking']);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
      var u="https://matomo.ethereum.org/";
      _paq.push(['setTrackerUrl', u+'matomo.php'])
      _paq.push(['setSiteId', domains[window.location.hostname]])
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]
      g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s)
  })()
}

createScriptTag = function(url, type) {
  var script = document.createElement('script');
  script.src = url;
  script.type = type;
  document.getElementsByTagName('head')[0].appendChild(script);
};
fetch('assets/version.json').then(response => {
  response.text().then(function(data) {
    const version = JSON.parse(data);
    console.log(`Loading Remix ${version.version}`);
    createScriptTag(`polyfills.${version.version}.${version.timestamp}.js`, 'module');
    if (version.mode === 'development') {
      createScriptTag(`vendor.${version.version}.${version.timestamp}.js`, 'module');
      createScriptTag(`runtime.${version.version}.${version.timestamp}.js`, 'module');
    }
    createScriptTag(`main.${version.version}.${version.timestamp}.js`, 'text/javascript');
  });
});
