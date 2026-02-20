(function () {
  const script = document.currentScript;
  const org = script.getAttribute('data-org');
  const link = script.getAttribute('data-link') || '';
  if (!org) {
    console.error('Kelo: data-org required');
    return;
  }
  const baseUrl = script.src.replace('/announcement-bar.js', '');

  const iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/announcement-bar?org=' + org + '&link=' + encodeURIComponent(link);
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:40px;border:none;z-index:99999;';
  iframe.id = 'kelo-announcement-bar';
  document.body.appendChild(iframe);

  // Push body down
  document.body.style.marginTop = '40px';

  window.addEventListener('message', function(e) {
    if (e.data === 'kelo:bar-dismiss') {
      iframe.style.display = 'none';
      document.body.style.marginTop = '0';
    }
  });
})();
