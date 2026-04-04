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

  async function loadSettings() {
    try {
      var res = await fetch(baseUrl + '/api/widget-settings?org=' + encodeURIComponent(org));
      if (res.ok) {
        var data = await res.json();
        return data.settings || {};
      }
    } catch (e) {
      console.warn('Kelo: Failed to load settings');
    }
    return {};
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
        w.iframe.addEventListener('load', function() { sendIdentityToWidget(w); });

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

        w.iframe = document.createElement('iframe');
        w.iframe.src = buildIframeSrc('/embed/changelog-popup');
        w.iframe.style.cssText = 'width:100%;height:80vh;border:none;border-radius:' + borderRadius + ';box-shadow:' + boxShadow + ';overflow:hidden;';
        w.container.appendChild(w.iframe);
        w.iframe.addEventListener('load', function() { sendIdentityToWidget(w); });

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

        // Auto-trigger on homepage
        if (_settings.auto_trigger_enabled && _settings.homepage_url) {
          var normalizeUrl = function(url) {
            try { var u = new URL(url); return u.origin + u.pathname.replace(/\/$/, '') + u.search; }
            catch(e) { return url.replace(/\/$/, '').toLowerCase(); }
          };
          if (normalizeUrl(window.location.href) === normalizeUrl(_settings.homepage_url.trim())) {
            var sessionKey = 'kelo_changelog_shown_' + org;
            if (!sessionStorage.getItem(sessionKey)) {
              setTimeout(function() { w.open(); sessionStorage.setItem(sessionKey, 'true'); }, 500);
            }
          }
        }

        window.KeloChangelog = { open: w.open, close: w.close };
        break;

      case 'changelog-dropdown':
        w.dropdown = document.createElement('div');
        w.dropdown.id = 'kelo-changelog-dropdown';
        w.dropdown.style.cssText = 'position:absolute;z-index:9999;display:none;width:380px;max-height:500px;';
        document.body.appendChild(w.dropdown);

        w.iframe = document.createElement('iframe');
        w.iframe.src = buildIframeSrc('/embed/changelog-dropdown');
        w.iframe.style.cssText = 'width:100%;height:500px;border:none;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.15);';
        w.dropdown.appendChild(w.iframe);

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

        w.iframe = document.createElement('iframe');
        var sv = String(_settings.all_in_one_style_variant || '1');
        w.iframe.src = buildIframeSrc('/embed/all-in-one', '&mode=popup&style=' + encodeURIComponent(sv) + '&t=' + Date.now());
        w.iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0;box-shadow:-4px 0 20px rgba(0,0,0,0.1);display:block;margin:0;padding:0;';
        w.iframe.setAttribute('frameborder', '0');
        w.iframe.setAttribute('allowtransparency', 'true');
        w.container.appendChild(w.iframe);
        w.iframe.addEventListener('load', function() { sendIdentityToWidget(w); });

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

        w.iframe = document.createElement('iframe');
        var sv2 = String(_settings.all_in_one_style_variant || '1');
        w.iframe.src = buildIframeSrc('/embed/all-in-one', '&mode=popover&style=' + encodeURIComponent(sv2) + '&t=' + Date.now());
        w.iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);';
        w.popover.appendChild(w.iframe);
        w.iframe.addEventListener('load', function() { sendIdentityToWidget(w); });

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
    }

    return w;
  }

  // ─── Public API ───

  /**
   * Open a widget by type. If no type given, opens the default (from data-type).
   * Usage: Kelo.open() or Kelo.open('changelog-popup') or Kelo.open('feedback', triggerEl)
   */
  Kelo.open = function(typeOrEl, triggerEl) {
    var type = defaultType;
    if (typeof typeOrEl === 'string') {
      type = typeOrEl;
    } else if (typeOrEl && typeOrEl.nodeType) {
      // It's a DOM element (trigger), use default type
      triggerEl = typeOrEl;
    }
    var w = ensureWidget(type);
    if (w.open) w.open(triggerEl);
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
