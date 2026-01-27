(function () {
  const script = document.currentScript;
  const org = script.getAttribute('data-org');
  if (!org) {
    console.error('FeedbackHub: data-org required');
    return;
  }
  const baseUrl = script.src.replace('/changelog-popup.js', '');

  const iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/changelog-popup?org=' + org;
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:transparent;';
  iframe.id = 'feedbackhub-changelog-popup';
  iframe.allow = 'clipboard-write';
  document.body.appendChild(iframe);

  window.addEventListener('message', function(e) {
    if (e.data === 'feedbackhub:close') {
      iframe.style.display = 'none';
    }
  });

  window.FeedbackHubChangelog = {
    show: function() { iframe.style.display = 'block'; },
    hide: function() { iframe.style.display = 'none'; }
  };
})();
