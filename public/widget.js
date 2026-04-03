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
      _iframe.src = baseUrl + '/embed/widget?org=' + encodeURIComponent(org);
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

  function initChangelogPopup(settings) {
    var overlay, container;

    function ensureIframe() {
      if (_iframe) return;

      overlay = document.createElement('div');
      overlay.id = 'kelo-changelog-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:2147483646;display:none;';
      document.body.appendChild(overlay);

      container = document.createElement('div');
      container.id = 'kelo-changelog-container';
      container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;display:none;width:90%;max-width:680px;max-height:90vh;';
      document.body.appendChild(container);

      _iframe = document.createElement('iframe');
      _iframe.src = baseUrl + '/embed/changelog-popup?org=' + encodeURIComponent(org);
      _iframe.style.cssText = 'width:100%;height:80vh;border:none;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);';
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
      _iframe.src = baseUrl + '/embed/changelog-dropdown?org=' + encodeURIComponent(org);
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
      _iframe.src = baseUrl + '/embed/all-in-one?org=' + encodeURIComponent(org) + '&mode=popup&style=' + encodeURIComponent(styleVariant) + '&t=' + Date.now();
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
      _iframe.src = baseUrl + '/embed/all-in-one?org=' + encodeURIComponent(org) + '&mode=popover&style=' + encodeURIComponent(styleVariant) + '&t=' + Date.now();
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
