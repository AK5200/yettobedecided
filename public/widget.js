(function () {
  const script = document.currentScript;
  const org = script.getAttribute('data-org');
  if (!org) {
    console.error('FeedbackHub: data-org required');
    return;
  }
  const baseUrl = script.src.replace('/widget.js', '');

  // Create trigger button
  const button = document.createElement('button');
  button.innerHTML = '💬 Feedback';
  button.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9998;padding:12px 20px;background:#000;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:sans-serif;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
  button.id = 'feedbackhub-trigger';
  document.body.appendChild(button);

  // Create iframe (hidden by default)
  const iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/widget?org=' + org;
  iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;display:none;';
  iframe.id = 'feedbackhub-widget';
  document.body.appendChild(iframe);

  // Toggle functions
  function openWidget() {
    iframe.style.display = 'block';
    button.style.display = 'none';
    iframe.contentWindow.postMessage('open', '*');
  }

  function closeWidget() {
    iframe.style.display = 'none';
    button.style.display = 'block';
    iframe.contentWindow.postMessage('close', '*');
  }

  // Button click
  button.addEventListener('click', openWidget);

  // Listen for close from iframe
  window.addEventListener('message', function(e) {
    if (e.data === 'feedbackhub:close') {
      closeWidget();
    }
  });

  // Public API
  window.FeedbackHub = {
    open: openWidget,
    close: closeWidget
  };
})();
