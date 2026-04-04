(function () {
  var script = document.currentScript;
  var org = script.getAttribute('data-org');
  var widgetType = script.getAttribute('data-type') || 'feedback';

  if (!org) {
    console.error('Kelo: data-org required');
    return;
  }

  var baseUrl = new URL(script.src).origin;

  // Initialize Kelo global object
  window.Kelo = window.Kelo || {};

  var _user = null;
  var _iframe = null;
  var _initialized = false;
  var _settings = null;

  // Load saved session (scoped per org)
  var saved = localStorage.getItem('kelo_user_' + org);
  if (saved) {
    try { _user = JSON.parse(saved); } catch(e) {}
  }

  /**
   * Identify user (Trust Mode or JWT Mode)
   */
  Kelo.identify = function(data) {
    if (!data) return null;
    if (data.token) {
      _user = { token: data.token };
    } else if (data.id && data.email) {
      _user = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        company: data.company
      };
    }
    if (_user) {
      localStorage.setItem('kelo_user_' + org, JSON.stringify(_user));
      sendIdentityToIframe();
    }
    return _user;
  };

  Kelo.clearIdentity = function() {
    _user = null;
    localStorage.removeItem('kelo_user_' + org);
  };

  Kelo.isIdentified = function() {
    return _user !== null;
  };

  Kelo.getUser = function() {
    return _user;
  };

  Kelo._getIdentifyPayload = function() {
    return _user;
  };

  function sendIdentityToIframe() {
    if (_iframe && _iframe.contentWindow && _user) {
      _iframe.contentWindow.postMessage({ type: 'kelo:identity', user: _user }, '*');
    }
  }

  function sendThemeToIframe() {
    if (_iframe && _iframe.contentWindow && _settings && _settings.auto_detect_theme) {
      _iframe.contentWindow.postMessage({ type: 'kelo:theme', theme: detectTheme() }, '*');
    }
  }

  // Fetch settings from API
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

  // ─── Auto-detect theme and color from client site ───

  function detectTheme() {
    // 1. Check html/body class (Tailwind, Next.js, etc.)
    var html = document.documentElement;
    if (html.classList.contains('dark') || html.getAttribute('data-theme') === 'dark' || html.getAttribute('data-mode') === 'dark') {
      return 'dark';
    }
    if (html.classList.contains('light') || html.getAttribute('data-theme') === 'light') {
      return 'light';
    }
    // 2. Check body background color luminance
    var bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)') {
      var lum = getLuminance(bodyBg);
      if (lum !== null) return lum < 0.5 ? 'dark' : 'light';
    }
    // 3. Fall back to OS preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function getLuminance(colorStr) {
    var m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    var r = parseInt(m[1]) / 255;
    var g = parseInt(m[2]) / 255;
    var b = parseInt(m[3]) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function detectAccentColor() {
    // 1. Check CSS custom properties commonly used for accent/primary color
    var root = getComputedStyle(document.documentElement);
    var cssVars = ['--primary', '--accent', '--brand', '--brand-color', '--theme-color', '--color-primary', '--accent-color'];
    for (var i = 0; i < cssVars.length; i++) {
      var val = root.getPropertyValue(cssVars[i]).trim();
      if (val && val !== '') {
        var hex = cssColorToHex(val);
        if (hex) return hex;
      }
    }
    // 2. Check <meta name="theme-color">
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var hex = cssColorToHex(meta.getAttribute('content'));
      if (hex) return hex;
    }
    // 3. Sample primary buttons
    var btn = document.querySelector('button[class*="primary"], a[class*="primary"], .btn-primary, [data-primary]');
    if (btn) {
      var bg = getComputedStyle(btn).backgroundColor;
      var hex = cssColorToHex(bg);
      if (hex && hex !== '#000000' && hex !== '#ffffff') return hex;
    }
    // 4. Sample first link color
    var link = document.querySelector('a[href]');
    if (link) {
      var color = getComputedStyle(link).color;
      var hex = cssColorToHex(color);
      if (hex && hex !== '#000000' && hex !== '#ffffff' && hex !== '#0000ee') return hex;
    }
    return null;
  }

  function cssColorToHex(str) {
    if (!str || str === 'transparent' || str === 'inherit') return null;
    // Already hex
    if (str.charAt(0) === '#') return str.length === 4
      ? '#' + str[1]+str[1] + str[2]+str[2] + str[3]+str[3]
      : str.substring(0, 7);
    // HSL value (from CSS custom properties like "220 90% 56%")
    var hslMatch = str.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?$/);
    if (hslMatch) {
      return hslToHex(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]));
    }
    // hsl() function
    var hslFn = str.match(/hsl\((\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?)%,?\s*(\d+(?:\.\d+)?)%/);
    if (hslFn) {
      return hslToHex(parseFloat(hslFn[1]), parseFloat(hslFn[2]), parseFloat(hslFn[3]));
    }
    // rgb/rgba
    var m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      return '#' + ((1 << 24) + (parseInt(m[1]) << 16) + (parseInt(m[2]) << 8) + parseInt(m[3])).toString(16).slice(1);
    }
    return null;
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1-l);
    function f(n) {
      var k = (n + h/30) % 12;
      var color = l - a * Math.max(Math.min(k-3, 9-k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    }
    return '#' + f(0) + f(8) + f(4);
  }

  function buildIframeSrc(path, extraParams) {
    var src = baseUrl + path + '?org=' + encodeURIComponent(org);
    if (_settings && _settings.auto_detect_theme) {
      src += '&theme=' + detectTheme();
    }
    if (_settings && _settings.auto_detect_color) {
      var color = detectAccentColor();
      if (color) src += '&accent=' + encodeURIComponent(color);
    }
    if (extraParams) src += extraParams;
    return src;
  }

  // Responsive size function
  function getResponsiveSize(size) {
    var sizeMap = {
      'xsmall': '25vw',
      'small': '35vw',
      'medium': '45vw',
      'large': '55vw',
      'xlarge': '70vw'
    };
    return sizeMap[size] || '55vw';
  }

  // ─── Widget initializers (lazy — only create iframe on first open) ───

  function initFeedbackWidget(settings) {
    function ensureIframe() {
      if (_iframe) return;
      _iframe = document.createElement('iframe');
      _iframe.src = buildIframeSrc('/embed/widget');
      _iframe.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:none;z-index:2147483647;display:none;background:white;pointer-events:auto;';
      _iframe.id = 'kelo-widget';
      document.body.appendChild(_iframe);
      _iframe.addEventListener('load', sendIdentityToIframe);
    }

    function openWidget() {
      ensureIframe();
      _iframe.style.display = 'block';
      _iframe.contentWindow.postMessage('open', '*');
      sendIdentityToIframe();
    }

    function closeWidget() {
      if (!_iframe) return;
      _iframe.style.display = 'none';
      _iframe.contentWindow.postMessage('close', '*');
    }

    window.addEventListener('message', function(e) {
      if (e.data === 'kelo:close') closeWidget();
    });

    Kelo.open = openWidget;
    Kelo.close = closeWidget;
  }

  // Maps for changelog popup styling
  function getDialogSize(size) {
    var sizeMap = {
      'small': '480px',
      'medium': '560px',
      'large': '680px',
      'xlarge': '780px'
    };
    return sizeMap[size] || '680px';
  }

  function getBorderRadius(br) {
    var brMap = {
      'none': '0',
      'small': '8px',
      'medium': '12px',
      'large': '16px',
      'xlarge': '24px'
    };
    return brMap[br] || '12px';
  }

  function getBoxShadow(shadow) {
    var shadowMap = {
      'none': 'none',
      'small': '0 4px 12px rgba(0,0,0,0.1)',
      'medium': '0 12px 32px rgba(0,0,0,0.15)',
      'large': '0 25px 50px -12px rgba(0,0,0,0.25)'
    };
    return shadowMap[shadow] || '0 25px 50px -12px rgba(0,0,0,0.25)';
  }

  function initChangelogPopup(settings) {
    var overlay, container;
    var dialogSize = getDialogSize(settings.size);
    var borderRadius = getBorderRadius(settings.border_radius);
    var boxShadow = getBoxShadow(settings.shadow);

    function ensureIframe() {
      if (_iframe) return;

      overlay = document.createElement('div');
      overlay.id = 'kelo-changelog-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2147483646;display:none;';
      document.body.appendChild(overlay);

      container = document.createElement('div');
      container.id = 'kelo-changelog-container';
      container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;display:none;width:90%;max-width:' + dialogSize + ';max-height:90vh;';
      document.body.appendChild(container);

      _iframe = document.createElement('iframe');
      _iframe.src = buildIframeSrc('/embed/changelog-popup');
      _iframe.style.cssText = 'width:100%;height:80vh;border:none;border-radius:' + borderRadius + ';box-shadow:' + boxShadow + ';overflow:hidden;';
      container.appendChild(_iframe);

      overlay.addEventListener('click', closePopup);
      _iframe.addEventListener('load', sendIdentityToIframe);
    }

    function openPopup() {
      ensureIframe();
      overlay.style.display = 'block';
      container.style.display = 'block';
      sendIdentityToIframe();
    }

    function closePopup() {
      if (!overlay) return;
      overlay.style.display = 'none';
      container.style.display = 'none';
    }

    // Auto-trigger on homepage
    if (settings.auto_trigger_enabled && settings.homepage_url) {
      var normalizeUrl = function(url) {
        try {
          var u = new URL(url);
          return u.origin + u.pathname.replace(/\/$/, '') + u.search;
        } catch(e) { return url.replace(/\/$/, '').toLowerCase(); }
      };
      if (normalizeUrl(window.location.href) === normalizeUrl(settings.homepage_url.trim())) {
        var sessionKey = 'kelo_changelog_shown_' + org;
        if (!sessionStorage.getItem(sessionKey)) {
          setTimeout(function() {
            openPopup();
            sessionStorage.setItem(sessionKey, 'true');
          }, 500);
        }
      }
    }

    window.addEventListener('message', function(e) {
      if (e.data === 'kelo:close-changelog') closePopup();
    });

    Kelo.open = openPopup;
    Kelo.close = closePopup;
    window.KeloChangelog = { open: openPopup, close: closePopup };
  }

  function initChangelogDropdown(settings) {
    var dropdown, isOpen = false;

    function ensureIframe() {
      if (_iframe) return;

      dropdown = document.createElement('div');
      dropdown.id = 'kelo-changelog-dropdown';
      dropdown.style.cssText = 'position:absolute;z-index:9999;display:none;width:380px;max-height:500px;';
      document.body.appendChild(dropdown);

      _iframe = document.createElement('iframe');
      _iframe.src = buildIframeSrc('/embed/changelog-dropdown');
      _iframe.style.cssText = 'width:100%;height:500px;border:none;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.15);';
      dropdown.appendChild(_iframe);

      document.addEventListener('click', function(e) {
        if (isOpen && !dropdown.contains(e.target)) closeDropdown();
      });
    }

    function openDropdown(triggerEl) {
      ensureIframe();
      if (triggerEl) {
        var rect = triggerEl.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        dropdown.style.left = Math.max(8, rect.left + window.scrollX - 150) + 'px';
      }
      dropdown.style.display = 'block';
      isOpen = true;
    }

    function closeDropdown() {
      if (!dropdown) return;
      dropdown.style.display = 'none';
      isOpen = false;
    }

    Kelo.open = openDropdown;
    Kelo.close = closeDropdown;
    window.KeloChangelog = { open: openDropdown, close: closeDropdown };
  }

  function initAllInOnePopup(settings) {
    var overlay, container;
    var isOpen = false;
    var popupPlacement = settings.all_in_one_popup_placement || 'right';
    var widgetSize = settings.size || 'large';
    var responsiveWidth = getResponsiveSize(widgetSize);
    var isLeft = popupPlacement === 'left';

    // Inject transition styles
    var styleTag = document.createElement('style');
    styleTag.textContent = '#kelo-allinone-overlay, #kelo-allinone-container { position: fixed !important; will-change: auto !important; contain: none !important; filter: none !important; }' +
      '#kelo-allinone-overlay { opacity: 0; transition: opacity 0.3s ease; }' +
      '#kelo-allinone-overlay.kelo-visible { opacity: 1; }' +
      '#kelo-allinone-container { transform: translateX(' + (isLeft ? '-100%' : '100%') + ') !important; transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }' +
      '#kelo-allinone-container.kelo-visible { transform: translateX(0) !important; }';
    document.head.appendChild(styleTag);

    function ensureIframe() {
      if (_iframe) return;

      overlay = document.createElement('div');
      overlay.id = 'kelo-allinone-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:2147483646;display:none;pointer-events:none;';
      document.body.appendChild(overlay);

      container = document.createElement('div');
      container.id = 'kelo-allinone-container';
      var posStyle = isLeft
        ? 'position:fixed;top:0;left:0;bottom:0;z-index:2147483647;display:none;width:' + responsiveWidth + ';min-width:300px;max-width:90vw;'
        : 'position:fixed;top:0;right:0;bottom:0;z-index:2147483647;display:none;width:' + responsiveWidth + ';min-width:300px;max-width:90vw;';
      container.style.cssText = posStyle;
      document.body.appendChild(container);

      _iframe = document.createElement('iframe');
      var styleVariant = String(settings.all_in_one_style_variant || '1');
      _iframe.src = buildIframeSrc('/embed/all-in-one', '&mode=popup&style=' + encodeURIComponent(styleVariant) + '&t=' + Date.now());
      _iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0;box-shadow:-4px 0 20px rgba(0,0,0,0.1);display:block;margin:0;padding:0;';
      _iframe.setAttribute('frameborder', '0');
      _iframe.setAttribute('allowtransparency', 'true');
      container.appendChild(_iframe);

      overlay.addEventListener('click', closePopup);
      _iframe.addEventListener('load', sendIdentityToIframe);
    }

    function openPopup() {
      ensureIframe();
      overlay.style.display = 'block';
      overlay.style.pointerEvents = 'auto';
      container.style.display = 'block';
      container.offsetHeight; // reflow
      overlay.classList.add('kelo-visible');
      container.classList.add('kelo-visible');
      isOpen = true;
      sendIdentityToIframe();
    }

    function closePopup() {
      if (!overlay) return;
      overlay.classList.remove('kelo-visible');
      container.classList.remove('kelo-visible');
      overlay.style.pointerEvents = 'none';
      setTimeout(function() {
        overlay.style.display = 'none';
        container.style.display = 'none';
      }, 350);
      isOpen = false;
    }

    window.addEventListener('message', function(e) {
      if (e.data === 'kelo:close') closePopup();
    });

    Kelo.open = openPopup;
    Kelo.close = closePopup;
  }

  function initAllInOnePopover(settings) {
    var popover;
    var isOpen = false;
    var popoverPlacement = settings.all_in_one_popover_placement || 'bottom-right';
    var widgetSize = settings.size || 'large';
    var responsiveWidth = getResponsiveSize(widgetSize);
    var isBottom = popoverPlacement.includes('bottom');
    var isLeft = popoverPlacement.includes('left');
    var isRight = popoverPlacement.includes('right');

    // Inject transition styles
    if (!document.getElementById('kelo-widget-styles')) {
      var slideX = isRight ? '20px' : '-20px';
      var slideY = isBottom ? '20px' : '-20px';
      var styleTag = document.createElement('style');
      styleTag.id = 'kelo-widget-styles';
      styleTag.textContent = '#kelo-allinone-popover { position: fixed !important; will-change: auto !important; contain: none !important; filter: none !important; opacity: 0; transform: translate(' + slideX + ', ' + slideY + ') scale(0.95) !important; transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; pointer-events: none; }' +
        '#kelo-allinone-popover.kelo-visible { opacity: 1; transform: translate(0, 0) scale(1) !important; pointer-events: auto; }';
      document.head.appendChild(styleTag);
    }

    function ensureIframe() {
      if (_iframe) return;

      var positionStyle = 'position:fixed;z-index:2147483647;display:none;';
      if (isBottom) {
        positionStyle += 'bottom:' + Math.max(20, Math.min(80, window.innerHeight * 0.05)) + 'px;';
      } else {
        positionStyle += 'top:' + Math.max(20, Math.min(80, window.innerHeight * 0.05)) + 'px;';
      }
      if (isLeft) {
        positionStyle += 'left:' + Math.max(16, Math.min(24, window.innerWidth * 0.02)) + 'px;';
      } else {
        positionStyle += 'right:' + Math.max(16, Math.min(24, window.innerWidth * 0.02)) + 'px;';
      }
      positionStyle += 'width:' + responsiveWidth + ';min-width:300px;max-width:90vw;height:600px;max-height:calc(100vh - 120px);';

      popover = document.createElement('div');
      popover.id = 'kelo-allinone-popover';
      popover.style.cssText = positionStyle;
      document.body.appendChild(popover);

      _iframe = document.createElement('iframe');
      var styleVariant = String(settings.all_in_one_style_variant || '1');
      _iframe.src = buildIframeSrc('/embed/all-in-one', '&mode=popover&style=' + encodeURIComponent(styleVariant) + '&t=' + Date.now());
      _iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);';
      popover.appendChild(_iframe);

      _iframe.addEventListener('load', sendIdentityToIframe);
    }

    function openPopover() {
      ensureIframe();
      popover.style.display = 'block';
      popover.offsetHeight; // reflow
      popover.classList.add('kelo-visible');
      isOpen = true;
      sendIdentityToIframe();
    }

    function closePopover() {
      if (!popover) return;
      popover.classList.remove('kelo-visible');
      setTimeout(function() {
        popover.style.display = 'none';
      }, 300);
      isOpen = false;
    }

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (isOpen && popover && !popover.contains(e.target)) {
        closePopover();
      }
    });

    window.addEventListener('message', function(e) {
      if (e.data === 'kelo:close') closePopover();
    });

    Kelo.open = openPopover;
    Kelo.close = closePopover;
  }

  // ─── Initialization ───

  async function init() {
    if (_initialized) return;
    _initialized = true;

    _settings = await loadSettings();

    // Initialize the correct widget type
    if (widgetType === 'changelog-popup') {
      initChangelogPopup(_settings);
    } else if (widgetType === 'changelog-dropdown') {
      initChangelogDropdown(_settings);
    } else if (widgetType === 'all-in-one-popup') {
      initAllInOnePopup(_settings);
    } else if (widgetType === 'all-in-one-popover') {
      initAllInOnePopover(_settings);
    } else {
      initFeedbackWidget(_settings);
    }

    // Bind data-kelo-trigger elements (universal trigger)
    var triggers = document.querySelectorAll('[data-kelo-trigger]');
    triggers.forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        if (Kelo.open) Kelo.open(el);
      });
    });

    // Also support type-specific data attributes as aliases
    var typeAttrMap = {
      'data-kelo-feedback': 'feedback',
      'data-kelo-changelog-popup': 'changelog-popup',
      'data-kelo-changelog-dropdown': 'changelog-dropdown',
      'data-kelo-all-in-one-popup': 'all-in-one-popup',
      'data-kelo-all-in-one-popover': 'all-in-one-popover'
    };
    Object.keys(typeAttrMap).forEach(function(attr) {
      document.querySelectorAll('[' + attr + ']').forEach(function(el) {
        // Skip if already has data-kelo-trigger (avoid double-bind)
        if (el.hasAttribute('data-kelo-trigger')) return;
        el.addEventListener('click', function(e) {
          e.preventDefault();
          if (Kelo.open) Kelo.open(el);
        });
      });
    });

    // Auto-open if URL has kelo=open parameter
    try {
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('kelo') === 'open') {
        setTimeout(function() {
          if (Kelo.open) Kelo.open();
          urlParams.delete('kelo');
          var newUrl = window.location.pathname +
            (urlParams.toString() ? '?' + urlParams.toString() : '') +
            window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }, 800);
      }
    } catch (e) {}

    // Watch for theme changes on client site and notify iframe
    if (_settings && _settings.auto_detect_theme) {
      // Watch for class/attribute changes on <html>
      try {
        var observer = new MutationObserver(sendThemeToIframe);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-mode'] });
      } catch (e) {}
      // Watch for OS-level preference changes
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sendThemeToIframe);
      } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
