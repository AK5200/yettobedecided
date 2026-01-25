(function () {
  const script = document.currentScript;
  const org = script.getAttribute('data-org');
  if (!org) {
    console.error('FeedbackHub: data-org required');
    return;
  }
  const baseUrl = script.src.replace('/widget.js', '');
  const iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/widget?org=' + org;
  iframe.style.cssText =
    'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;pointer-events:none;';
  iframe.id = 'feedbackhub-widget';
  document.body.appendChild(iframe);
  window.FeedbackHub = {
    open: function () {
      iframe.contentWindow.postMessage('open', '*');
    },
    close: function () {
      iframe.contentWindow.postMessage('close', '*');
    },
  };
})();
