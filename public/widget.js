(function () {
  var script = document.currentScript;
  var org = script.getAttribute('data-org');
  var defaultType = script.getAttribute('data-type') || 'feedback';

  if (!org) {
    console.error('Kelo: data-org required');
    return;
  }

  var baseUrl = new URL(script.src).origin;

  // Initialize Kelo global object
  window.Kelo = window.Kelo || {};

  // Start API fetch IMMEDIATELY — don't wait for DOMContentLoaded
  // This runs in parallel with the rest of page loading
  var _dataPromise = null;
  (function startEarlyFetch() {
    var cacheKey = 'kelo_data_' + org;
    var cacheTimeKey = 'kelo_data_t_' + org;
    try {
      var cached = sessionStorage.getItem(cacheKey);
      var cachedTime = parseInt(sessionStorage.getItem(cacheTimeKey) || '0');
      if (cached && Date.now() - cachedTime < 30000) {
        _dataPromise = Promise.resolve(JSON.parse(cached));
        return;
      }
    } catch(e) {}
    _dataPromise = fetch(baseUrl + '/api/widget?org=' + encodeURIComponent(org))
      .then(function(res) { return res.ok ? res.json() : {}; })
      .catch(function() { return {}; });
  })();

  // Preload iframe HTML pages immediately
  try {
    var preloadEmbed = function(path) {
      var l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = baseUrl + path + '?org=' + encodeURIComponent(org);
      document.head.appendChild(l);
    };
    if (defaultType === 'all-in-one-popup' || defaultType === 'all-in-one-popover') preloadEmbed('/embed/all-in-one');
    else if (defaultType === 'changelog-popup') preloadEmbed('/embed/changelog-popup');
    else if (defaultType === 'changelog-dropdown') preloadEmbed('/embed/changelog-dropdown');
    else preloadEmbed('/embed/widget');
  } catch(e) {}

  var _user = null;
  var _initialized = false;
  var _settings = null;
  // Each widget type gets its own entry: { iframe, open, close, overlay, container, ... }
  var _widgets = {};

  // Load saved session (scoped per org)
  var saved = localStorage.getItem('kelo_user_' + org);
  if (saved) {
    try { _user = JSON.parse(saved); } catch(e) {}
  }

  Kelo.identify = function(data) {
    if (!data) return null;
    if (data.token) {
      _user = { token: data.token };
    } else if (data.id && data.email) {
      _user = { id: data.id, email: data.email, name: data.name, avatar: data.avatar, company: data.company };
    }
    if (_user) {
      localStorage.setItem('kelo_user_' + org, JSON.stringify(_user));
      sendIdentityToAll();
    }
    return _user;
  };

  Kelo.clearIdentity = function() {
    _user = null;
    localStorage.removeItem('kelo_user_' + org);
  };

  Kelo.isIdentified = function() { return _user !== null; };
  Kelo.getUser = function() { return _user; };
  Kelo._getIdentifyPayload = function() { return _user; };

  function sendIdentityToAll() {
    if (!_user) return;
    Object.keys(_widgets).forEach(function(type) {
      var w = _widgets[type];
      if (w.iframe && w.iframe.contentWindow) {
        w.iframe.contentWindow.postMessage({ type: 'kelo:identity', user: _user }, '*');
      }
    });
  }

  function sendThemeToAll() {
    if (!_settings || !_settings.auto_detect_theme) return;
    var theme = detectTheme();
    Object.keys(_widgets).forEach(function(type) {
      var w = _widgets[type];
      if (w.iframe && w.iframe.contentWindow) {
        w.iframe.contentWindow.postMessage({ type: 'kelo:theme', theme: theme }, '*');
      }
    });
  }

  // Add preconnect hint for faster API/iframe loads
  try {
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = baseUrl;
    document.head.appendChild(link);
  } catch(e) {}

  var _widgetData = null;

  async function loadSettings() {
    // Use the early-fetched promise (started before DOMContentLoaded)
    var data = await _dataPromise;
    _widgetData = data;
    // Cache for next page load
    try {
      sessionStorage.setItem('kelo_data_' + org, JSON.stringify(data));
      sessionStorage.setItem('kelo_data_t_' + org, String(Date.now()));
    } catch(e) {}
    return data.settings || {};
  }

  // ─── Auto-detect theme and color ───

  function detectTheme() {
    var html = document.documentElement;
    if (html.classList.contains('dark') || html.getAttribute('data-theme') === 'dark' || html.getAttribute('data-mode') === 'dark') return 'dark';
    if (html.classList.contains('light') || html.getAttribute('data-theme') === 'light') return 'light';
    var bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)') {
      var lum = getLuminance(bodyBg);
      if (lum !== null) return lum < 0.5 ? 'dark' : 'light';
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function getLuminance(colorStr) {
    var m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return 0.2126 * (parseInt(m[1]) / 255) + 0.7152 * (parseInt(m[2]) / 255) + 0.0722 * (parseInt(m[3]) / 255);
  }

  function detectAccentColor() {
    var root = getComputedStyle(document.documentElement);
    var cssVars = ['--primary', '--accent', '--brand', '--brand-color', '--theme-color', '--color-primary', '--accent-color'];
    for (var i = 0; i < cssVars.length; i++) {
      var val = root.getPropertyValue(cssVars[i]).trim();
      if (val) { var hex = cssColorToHex(val); if (hex) return hex; }
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { var hex = cssColorToHex(meta.getAttribute('content')); if (hex) return hex; }
    var btn = document.querySelector('button[class*="primary"], a[class*="primary"], .btn-primary');
    if (btn) { var hex = cssColorToHex(getComputedStyle(btn).backgroundColor); if (hex && hex !== '#000000' && hex !== '#ffffff') return hex; }
    var link = document.querySelector('a[href]');
    if (link) { var hex = cssColorToHex(getComputedStyle(link).color); if (hex && hex !== '#000000' && hex !== '#ffffff' && hex !== '#0000ee') return hex; }
    return null;
  }

  function cssColorToHex(str) {
    if (!str || str === 'transparent' || str === 'inherit') return null;
    if (str.charAt(0) === '#') return str.length === 4 ? '#' + str[1]+str[1]+str[2]+str[2]+str[3]+str[3] : str.substring(0, 7);
    var hslMatch = str.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?$/);
    if (hslMatch) return hslToHex(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]));
    var hslFn = str.match(/hsl\((\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?)%,?\s*(\d+(?:\.\d+)?)%/);
    if (hslFn) return hslToHex(parseFloat(hslFn[1]), parseFloat(hslFn[2]), parseFloat(hslFn[3]));
    var m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return '#' + ((1 << 24) + (parseInt(m[1]) << 16) + (parseInt(m[2]) << 8) + parseInt(m[3])).toString(16).slice(1);
    return null;
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1-l);
    function f(n) { var k = (n + h/30) % 12; return Math.round(255 * (l - a * Math.max(Math.min(k-3, 9-k, 1), -1))).toString(16).padStart(2, '0'); }
    return '#' + f(0) + f(8) + f(4);
  }

  function buildIframeSrc(path, extraParams) {
    var src = baseUrl + path + '?org=' + encodeURIComponent(org);
    if (_settings && _settings.auto_detect_theme) src += '&theme=' + detectTheme();
    if (_settings && _settings.auto_detect_color) { var c = detectAccentColor(); if (c) src += '&accent=' + encodeURIComponent(c); }
    if (extraParams) src += extraParams;
    // Embed widget data in URL hash so iframe has it on first render
    // Only if data is small enough (<50KB) to avoid URL length issues
    if (_widgetData) {
      try {
        var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(_widgetData))));
        if (encoded.length < 50000) {
          src += '#kelo=' + encodeURIComponent(encoded);
        }
      } catch(e) {}
    }
    return src;
  }

  // ─── Helpers ───

  function getResponsiveSize(size) {
    return { xsmall: '25vw', small: '35vw', medium: '45vw', large: '55vw', xlarge: '70vw' }[size] || '55vw';
  }
  function getDialogSize(size) {
    return { small: '480px', medium: '560px', large: '680px', xlarge: '780px' }[size] || '680px';
  }
  function getBorderRadius(br) {
    return { none: '0', small: '8px', medium: '12px', large: '16px', xlarge: '24px' }[br] || '12px';
  }
  function getBoxShadow(shadow) {
    return { none: 'none', small: '0 4px 12px rgba(0,0,0,0.1)', medium: '0 12px 32px rgba(0,0,0,0.15)', large: '0 25px 50px -12px rgba(0,0,0,0.25)' }[shadow] || '0 25px 50px -12px rgba(0,0,0,0.25)';
  }

  function sendIdentityToWidget(w) {
    if (w.iframe && w.iframe.contentWindow && _user) {
      w.iframe.contentWindow.postMessage({ type: 'kelo:identity', user: _user }, '*');
    }
  }

  function sendDataToWidget(w) {
    if (w.iframe && w.iframe.contentWindow && _widgetData) {
      w.iframe.contentWindow.postMessage({ type: 'kelo:data', data: _widgetData }, '*');
    }
  }

  // ─── Instant preview (plain HTML, no React) ───

  function createInstantPreview(container, type) {
    if (!_widgetData) return null;
    var isDark = _settings && _settings.auto_detect_theme ? detectTheme() === 'dark' : false;
    var accent = _settings && _settings.auto_detect_color ? (detectAccentColor() || _settings.accent_color || '#F59E0B') : (_settings.accent_color || '#F59E0B');
    var bg = isDark ? '#1a1a1a' : '#ffffff';
    var text = isDark ? '#e5e5e5' : '#1a1a1a';
    var muted = isDark ? '#888' : '#6b7280';
    var border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    var font = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

    var preview = document.createElement('div');
    preview.id = 'kelo-instant-preview';
    preview.style.cssText = 'width:100%;height:100%;overflow-y:auto;background:' + bg + ';color:' + text + ';font-family:' + font + ';';

    var isChangelog = type === 'changelog-popup' || type === 'changelog-dropdown';
    var heading = isChangelog ? (_settings.heading || "What's New") : (_settings.heading || 'Have something to say?');
    var subheading = isChangelog ? (_settings.subheading || '') : (_settings.subheading || '');

    var html = '<div style="padding:24px;">';
    html += '<h2 style="font-size:20px;font-weight:700;margin:0 0 4px 0;">' + escapeHtml(heading) + '</h2>';
    if (subheading) html += '<p style="font-size:13px;color:' + muted + ';margin:0 0 20px 0;">' + escapeHtml(subheading) + '</p>';

    if (type === 'changelog-popup' || type === 'changelog-dropdown') {
      var entries = (_widgetData.changelog || []).slice(0, 5);
      entries.forEach(function(e) {
        html += '<div style="padding:12px 0;border-bottom:1px solid ' + border + ';">';
        if (e.category) html += '<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:9999px;background:' + accent + ';color:white;margin-right:8px;">' + escapeHtml(e.category) + '</span>';
        html += '<span style="font-size:11px;color:' + muted + ';">' + formatPreviewDate(e.published_at || e.created_at) + '</span>';
        html += '<h3 style="font-size:14px;font-weight:600;margin:6px 0 4px 0;">' + escapeHtml(e.title) + '</h3>';
        html += '</div>';
      });
    } else {
      // Posts preview (all-in-one, feedback)
      var posts = (_widgetData.posts || []).slice(0, 5);
      posts.forEach(function(p) {
        html += '<div style="padding:12px 0;border-bottom:1px solid ' + border + ';display:flex;gap:12px;align-items:flex-start;">';
        html += '<div style="min-width:40px;height:40px;border-radius:8px;border:1px solid ' + border + ';display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:12px;color:' + muted + ';">';
        html += '<span style="font-size:10px;">▲</span>' + (p.vote_count || 0);
        html += '</div>';
        html += '<div><h3 style="font-size:14px;font-weight:600;margin:0 0 4px 0;">' + escapeHtml(p.title) + '</h3>';
        var desc = (p.content || '').replace(/<[^>]*>/g, '').substring(0, 80);
        if (desc) html += '<p style="font-size:12px;color:' + muted + ';margin:0;">' + escapeHtml(desc) + (p.content && p.content.length > 80 ? '...' : '') + '</p>';
        html += '</div></div>';
      });
    }

    html += '</div>';
    preview.innerHTML = html;
    container.appendChild(preview);
    return preview;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatPreviewDate(d) {
    try { var dt = new Date(d); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch(e) { return ''; }
  }

  // ─── Widget initializers ───

  function ensureWidget(type) {
    if (_widgets[type]) return _widgets[type];
    var w = {};
    _widgets[type] = w;

    switch (type) {
      case 'feedback':
        w.iframe = document.createElement('iframe');
        w.iframe.src = buildIframeSrc('/embed/widget');
        w.iframe.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:none;z-index:2147483647;display:none;pointer-events:auto;';
        w.iframe.id = 'kelo-widget';
        document.body.appendChild(w.iframe);
        w.iframe.addEventListener('load', function() { sendDataToWidget(w); sendIdentityToWidget(w); });

        w.open = function() {
          w.iframe.style.display = 'block';
          w.iframe.contentWindow.postMessage('open', '*');
          sendIdentityToWidget(w);
        };
        w.close = function() {
          w.iframe.style.display = 'none';
          w.iframe.contentWindow.postMessage('close', '*');
        };

        window.addEventListener('message', function(e) { if (e.data === 'kelo:close') w.close(); });
        break;

      case 'changelog-popup':
        var dialogSize = getDialogSize(_settings.size);
        var borderRadius = getBorderRadius(_settings.border_radius);
        var boxShadow = getBoxShadow(_settings.shadow);

        w.overlay = document.createElement('div');
        w.overlay.id = 'kelo-changelog-overlay';
        w.overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2147483646;display:none;';
        document.body.appendChild(w.overlay);

        w.container = document.createElement('div');
        w.container.id = 'kelo-changelog-container';
        w.container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;display:none;width:90%;max-width:' + dialogSize + ';max-height:90vh;';
        document.body.appendChild(w.container);

        // Show instant preview while iframe loads
        w._preview = createInstantPreview(w.container, 'changelog-popup');
        if (w._preview) { w._preview.style.borderRadius = borderRadius; w._preview.style.maxHeight = '80vh'; w._preview.style.overflow = 'hidden'; }

        w.iframe = document.createElement('iframe');
        w.iframe.src = buildIframeSrc('/embed/changelog-popup');
        w.iframe.style.cssText = 'width:100%;height:80vh;border:none;border-radius:' + borderRadius + ';box-shadow:' + boxShadow + ';overflow:hidden;display:none;';
        w.container.appendChild(w.iframe);
        w.iframe.addEventListener('load', function() {
          if (w._preview) { w._preview.style.display = 'none'; }
          w.iframe.style.display = 'block';
          sendDataToWidget(w); sendIdentityToWidget(w);
        });

        w._justOpened = false;
        w.open = function() {
          w.overlay.style.display = 'block';
          w.container.style.display = 'block';
          w._justOpened = true;
          setTimeout(function() { w._justOpened = false; }, 100);
          sendIdentityToWidget(w);
        };
        w.close = function() {
          w.overlay.style.display = 'none';
          w.container.style.display = 'none';
        };

        w.overlay.addEventListener('click', function() { if (!w._justOpened) w.close(); });
        window.addEventListener('message', function(e) { if (e.data === 'kelo:close-changelog') w.close(); });

        window.KeloChangelog = { open: w.open, close: w.close };
        break;

      case 'changelog-dropdown':
        w.dropdown = document.createElement('div');
        w.dropdown.id = 'kelo-changelog-dropdown';
        w.dropdown.style.cssText = 'position:absolute;z-index:9999;display:none;width:380px;';
        document.body.appendChild(w.dropdown);

        // Show instant preview while iframe loads
        w._preview = createInstantPreview(w.dropdown, 'changelog-dropdown');
        if (w._preview) { w._preview.style.borderRadius = '8px'; w._preview.style.maxHeight = '500px'; w._preview.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)'; }

        w.iframe = document.createElement('iframe');
        w.iframe.src = buildIframeSrc('/embed/changelog-dropdown');
        w.iframe.style.cssText = 'width:100%;height:300px;max-height:500px;border:none;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.15);display:none;';
        w.dropdown.appendChild(w.iframe);

        // Auto-resize iframe to fit content, swap out preview
        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'kelo:resize' && e.data.height) {
            var h = Math.min(e.data.height, 500);
            w.iframe.style.height = h + 'px';
            // Show iframe, hide preview
            if (w._preview) { w._preview.style.display = 'none'; }
            w.iframe.style.display = 'block';
          }
        });

        w.isOpen = false;
        w._activeTrigger = null;
        w.open = function(triggerEl) {
          if (w.isOpen) { w.close(); return; }
          if (triggerEl && triggerEl.getBoundingClientRect) {
            w._activeTrigger = triggerEl;
            var rect = triggerEl.getBoundingClientRect();
            w.dropdown.style.top = (rect.bottom + window.scrollY + 8) + 'px';
            w.dropdown.style.left = Math.max(8, rect.left + window.scrollX - 150) + 'px';
          }
          w.dropdown.style.display = 'block';
          // Delay isOpen so the current click event doesn't trigger outside-click handler
          setTimeout(function() { w.isOpen = true; }, 0);
        };
        w.close = function() {
          w.dropdown.style.display = 'none';
          w.isOpen = false;
          w._activeTrigger = null;
        };

        document.addEventListener('click', function(e) {
          if (w.isOpen && !w.dropdown.contains(e.target) && e.target !== w._activeTrigger && !e.target.closest('[data-kelo-trigger]')) w.close();
        });

        window.KeloChangelog = { open: w.open, close: w.close };
        break;

      case 'all-in-one-popup':
        var popupPlacement = _settings.all_in_one_popup_placement || 'right';
        var responsiveWidth = getResponsiveSize(_settings.size || 'large');
        var isLeft = popupPlacement === 'left';

        var styleTag = document.createElement('style');
        styleTag.textContent =
          '#kelo-allinone-overlay, #kelo-allinone-container { position: fixed !important; will-change: auto !important; contain: none !important; filter: none !important; }' +
          '#kelo-allinone-overlay { opacity: 0; transition: opacity 0.3s ease; }' +
          '#kelo-allinone-overlay.kelo-visible { opacity: 1; }' +
          '#kelo-allinone-container { transform: translateX(' + (isLeft ? '-100%' : '100%') + ') !important; transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }' +
          '#kelo-allinone-container.kelo-visible { transform: translateX(0) !important; }';
        document.head.appendChild(styleTag);

        w.overlay = document.createElement('div');
        w.overlay.id = 'kelo-allinone-overlay';
        w.overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:2147483646;display:none;pointer-events:none;';
        document.body.appendChild(w.overlay);

        w.container = document.createElement('div');
        w.container.id = 'kelo-allinone-container';
        w.container.style.cssText = 'position:fixed;top:0;' + (isLeft ? 'left' : 'right') + ':0;bottom:0;z-index:2147483647;display:none;width:' + responsiveWidth + ';min-width:300px;max-width:90vw;';
        document.body.appendChild(w.container);

        // Show instant preview while iframe loads
        w._preview = createInstantPreview(w.container, 'all-in-one-popup');

        w.iframe = document.createElement('iframe');
        var sv = String(_settings.all_in_one_style_variant || '1');
        w.iframe.src = buildIframeSrc('/embed/all-in-one', '&mode=popup&style=' + encodeURIComponent(sv) + '&t=' + Date.now());
        w.iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0;box-shadow:-4px 0 20px rgba(0,0,0,0.1);display:none;margin:0;padding:0;';
        w.iframe.setAttribute('frameborder', '0');
        w.iframe.setAttribute('allowtransparency', 'true');
        w.container.appendChild(w.iframe);
        w.iframe.addEventListener('load', function() {
          // Swap preview with iframe
          if (w._preview) { w._preview.style.display = 'none'; }
          w.iframe.style.display = 'block';
          sendDataToWidget(w); sendIdentityToWidget(w);
        });

        w.open = function() {
          w.overlay.style.display = 'block';
          w.overlay.style.pointerEvents = 'auto';
          w.container.style.display = 'block';
          w.container.offsetHeight;
          w.overlay.classList.add('kelo-visible');
          w.container.classList.add('kelo-visible');
          sendIdentityToWidget(w);
        };
        w.close = function() {
          w.overlay.classList.remove('kelo-visible');
          w.container.classList.remove('kelo-visible');
          w.overlay.style.pointerEvents = 'none';
          setTimeout(function() { w.overlay.style.display = 'none'; w.container.style.display = 'none'; }, 350);
        };

        w.overlay.addEventListener('click', function() { w.close(); });
        window.addEventListener('message', function(e) { if (e.data === 'kelo:close') w.close(); });
        break;

      case 'all-in-one-popover':
        var placement = _settings.all_in_one_popover_placement || 'bottom-right';
        var rw = getResponsiveSize(_settings.size || 'large');
        var isB = placement.includes('bottom');
        var isL = placement.includes('left');
        var isR = placement.includes('right');

        if (!document.getElementById('kelo-widget-styles')) {
          var sx = isR ? '20px' : '-20px';
          var sy = isB ? '20px' : '-20px';
          var st = document.createElement('style');
          st.id = 'kelo-widget-styles';
          st.textContent = '#kelo-allinone-popover { position: fixed !important; will-change: auto !important; contain: none !important; filter: none !important; opacity: 0; transform: translate(' + sx + ', ' + sy + ') scale(0.95) !important; transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; pointer-events: none; }' +
            '#kelo-allinone-popover.kelo-visible { opacity: 1; transform: translate(0, 0) scale(1) !important; pointer-events: auto; }';
          document.head.appendChild(st);
        }

        var posStyle = 'position:fixed;z-index:2147483647;display:none;';
        posStyle += (isB ? 'bottom' : 'top') + ':' + Math.max(20, Math.min(80, window.innerHeight * 0.05)) + 'px;';
        posStyle += (isL ? 'left' : 'right') + ':' + Math.max(16, Math.min(24, window.innerWidth * 0.02)) + 'px;';
        posStyle += 'width:' + rw + ';min-width:300px;max-width:90vw;height:600px;max-height:calc(100vh - 120px);';

        w.popover = document.createElement('div');
        w.popover.id = 'kelo-allinone-popover';
        w.popover.style.cssText = posStyle;
        document.body.appendChild(w.popover);

        // Show instant preview while iframe loads
        w._preview = createInstantPreview(w.popover, 'all-in-one-popover');
        if (w._preview) w._preview.style.borderRadius = '12px';

        w.iframe = document.createElement('iframe');
        var sv2 = String(_settings.all_in_one_style_variant || '1');
        w.iframe.src = buildIframeSrc('/embed/all-in-one', '&mode=popover&style=' + encodeURIComponent(sv2) + '&t=' + Date.now());
        w.iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);display:none;';
        w.popover.appendChild(w.iframe);
        w.iframe.addEventListener('load', function() {
          if (w._preview) { w._preview.style.display = 'none'; }
          w.iframe.style.display = 'block';
          sendDataToWidget(w); sendIdentityToWidget(w);
        });

        w.isOpen = false;
        w.open = function() {
          w.popover.style.display = 'block';
          w.popover.offsetHeight;
          w.popover.classList.add('kelo-visible');
          w.isOpen = true;
          sendIdentityToWidget(w);
        };
        w.close = function() {
          w.popover.classList.remove('kelo-visible');
          w.isOpen = false;
          setTimeout(function() { w.popover.style.display = 'none'; }, 300);
        };

        document.addEventListener('click', function(e) {
          if (w.isOpen && w.popover && !w.popover.contains(e.target)) w.close();
        });
        window.addEventListener('message', function(e) { if (e.data === 'kelo:close') w.close(); });
        break;

      case 'announcement':
        var tag = _settings.announcement_tag || 'New';
        var text = _settings.announcement_text || '';
        var linkType = _settings.announcement_link_type || 'changelog';
        var customUrl = _settings.announcement_custom_url || '#';
        var annAccent = _settings.auto_detect_color ? (detectAccentColor() || _settings.accent_color || '#F59E0B') : (_settings.accent_color || '#F59E0B');
        var annIsDark = _settings.auto_detect_theme ? detectTheme() === 'dark' : false;
        var annBg = annIsDark ? '#1a1a1a' : (_settings.background_color || '#ffffff');
        var annTextColor = annIsDark ? '#e5e5e5' : '#374151';
        var annBorderColor = annIsDark ? annAccent + '40' : annAccent + '30';
        var annArrowColor = annIsDark ? '#6b7280' : '#9ca3af';
        var annRadius = getBorderRadius(_settings.border_radius);

        if (!text) break; // Don't show empty announcement

        // Create the banner element
        w.banner = document.createElement('div');
        w.banner.id = 'kelo-announcement';
        w.banner.style.cssText = 'display:none;width:100%;padding:8px 0;text-align:center;position:relative;z-index:10;';

        var inner = document.createElement(linkType !== 'none' ? 'a' : 'div');
        if (linkType === 'changelog') {
          inner.href = baseUrl + '/' + org + '/changelog';
          inner.target = '_blank';
          inner.rel = 'noopener noreferrer';
        } else if (linkType === 'custom' && customUrl) {
          inner.href = customUrl;
          inner.target = '_blank';
          inner.rel = 'noopener noreferrer';
        } else if (linkType === 'popup') {
          inner.href = '#';
          inner.addEventListener('click', function(e) {
            e.preventDefault();
            Kelo.open('changelog-popup');
          });
        }
        inner.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:' + annRadius + ';background-color:' + annBg + ';border:1px solid ' + annBorderColor + ';text-decoration:none;cursor:' + (linkType !== 'none' ? 'pointer' : 'default') + ';transition:box-shadow 0.2s,transform 0.2s;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';

        var tagSpan = document.createElement('span');
        tagSpan.textContent = tag;
        tagSpan.style.cssText = 'font-size:12px;font-weight:600;padding:2px 10px;border-radius:' + annRadius + ';background-color:' + annAccent + ';color:white;';

        var textSpan = document.createElement('span');
        textSpan.textContent = text;
        textSpan.style.cssText = 'font-size:14px;color:' + annTextColor + ';';

        inner.appendChild(tagSpan);
        inner.appendChild(textSpan);

        if (linkType !== 'none') {
          var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          arrow.setAttribute('width', '16');
          arrow.setAttribute('height', '16');
          arrow.setAttribute('viewBox', '0 0 24 24');
          arrow.setAttribute('fill', 'none');
          arrow.setAttribute('stroke', annArrowColor);
          arrow.setAttribute('stroke-width', '2');
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M5 12h14M12 5l7 7-7 7');
          arrow.appendChild(path);
          inner.appendChild(arrow);
        }

        w.banner.appendChild(inner);

        w.open = function() {
          // Insert at the top of body, pushing content down (not overlapping)
          if (!w.banner.parentNode) {
            document.body.insertBefore(w.banner, document.body.firstChild);
          }
          w.banner.style.display = 'block';
        };
        w.close = function() {
          w.banner.style.display = 'none';
        };

        // Auto-show the banner
        w.open();

        // Allow dismissal
        var dismissed = sessionStorage.getItem('kelo_announcement_dismissed_' + org);
        if (dismissed) {
          w.banner.style.display = 'none';
        }
        break;
    }

    return w;
  }

  // ─── Public API ───

  var _ready = false;
  var _queue = [];

  function _doOpen(typeOrEl, triggerEl) {
    var type = defaultType;
    if (typeof typeOrEl === 'string') {
      type = typeOrEl;
    } else if (typeOrEl && typeOrEl.nodeType) {
      triggerEl = typeOrEl;
    }
    var w = ensureWidget(type);
    if (w && w.open) w.open(triggerEl);
  }

  /**
   * Open a widget by type. Queues if settings haven't loaded yet.
   * Usage: Kelo.open() or Kelo.open('changelog-popup') or Kelo.open('feedback', triggerEl)
   */
  Kelo.open = function(typeOrEl, triggerEl) {
    if (_ready) {
      _doOpen(typeOrEl, triggerEl);
    } else {
      _queue.push([typeOrEl, triggerEl]);
    }
  };

  Kelo.close = function(type) {
    type = type || defaultType;
    var w = _widgets[type];
    if (w && w.close) w.close();
  };

  // ─── Initialization ───

  async function init() {
    if (_initialized) return;
    _initialized = true;

    _settings = await loadSettings();

    // Settings loaded — mark ready and flush queued open() calls
    _ready = true;
    _queue.forEach(function(args) { _doOpen(args[0], args[1]); });
    _queue = [];

    // Auto-show announcement banner if this is the announcement widget type
    if (defaultType === 'announcement') {
      _doOpen('announcement');
    }

    // Auto-open changelog popup on homepage (if enabled in settings)
    if (_settings.auto_trigger_enabled && _settings.homepage_url) {
      var normalizeUrl = function(url) {
        try { var u = new URL(url); return u.origin + u.pathname.replace(/\/$/, '') + u.search; }
        catch(e) { return url.replace(/\/$/, '').toLowerCase(); }
      };
      if (normalizeUrl(window.location.href) === normalizeUrl(_settings.homepage_url.trim())) {
        var sessionKey = 'kelo_changelog_shown_' + org;
        if (!sessionStorage.getItem(sessionKey)) {
          setTimeout(function() {
            _doOpen('changelog-popup');
            sessionStorage.setItem(sessionKey, 'true');
          }, 500);
        }
      }
    }

    // Bind data-kelo-trigger elements
    // data-kelo-trigger="" or data-kelo-trigger → opens default type
    // data-kelo-trigger="changelog-popup" → opens that specific type
    document.querySelectorAll('[data-kelo-trigger]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var triggerType = el.getAttribute('data-kelo-trigger');
        if (triggerType && triggerType !== '') {
          Kelo.open(triggerType, el);
        } else {
          Kelo.open(el);
        }
      });
    });

    // Legacy type-specific data attributes
    var typeAttrMap = {
      'data-kelo-feedback': 'feedback',
      'data-kelo-changelog-popup': 'changelog-popup',
      'data-kelo-changelog-dropdown': 'changelog-dropdown',
      'data-kelo-all-in-one-popup': 'all-in-one-popup',
      'data-kelo-all-in-one-popover': 'all-in-one-popover'
    };
    Object.keys(typeAttrMap).forEach(function(attr) {
      document.querySelectorAll('[' + attr + ']').forEach(function(el) {
        if (el.hasAttribute('data-kelo-trigger')) return;
        el.addEventListener('click', function(e) {
          e.preventDefault();
          Kelo.open(typeAttrMap[attr], el);
        });
      });
    });

    // Auto-open from URL param
    try {
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('kelo') === 'open') {
        setTimeout(function() {
          Kelo.open();
          urlParams.delete('kelo');
          window.history.replaceState({}, '', window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash);
        }, 800);
      }
    } catch (e) {}

    // Preload widgets that have triggers on the page (so they're ready on click)
    var typesToPreload = new Set();
    document.querySelectorAll('[data-kelo-trigger]').forEach(function(el) {
      var t = el.getAttribute('data-kelo-trigger');
      typesToPreload.add(t && t !== '' ? t : defaultType);
    });
    Object.keys(typeAttrMap).forEach(function(attr) {
      if (document.querySelector('[' + attr + ']')) {
        typesToPreload.add(typeAttrMap[attr]);
      }
    });
    // Also preload the default type
    if (defaultType !== 'announcement') {
      typesToPreload.add(defaultType);
    }
    // Preload after a short delay to not block page render
    setTimeout(function() {
      typesToPreload.forEach(function(type) {
        if (type !== 'announcement') ensureWidget(type);
      });
    }, 100);

    // Watch for theme changes
    if (_settings && _settings.auto_detect_theme) {
      try {
        new MutationObserver(sendThemeToAll).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-mode'] });
      } catch (e) {}
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sendThemeToAll);
      } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
