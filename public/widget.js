(function () {
  const script = document.currentScript;
  const org = script.getAttribute('data-org');
  const widgetType = script.getAttribute('data-type') || 'feedback';
  const customTrigger = script.getAttribute('data-trigger');

  if (!org) {
    console.error('FeedbackHub: data-org required');
    return;
  }

  const baseUrl = script.src.replace('/widget.js', '');

  // Initialize FeedbackHub global object
  window.FeedbackHub = window.FeedbackHub || {};

  let _user = null;

  // Load saved session
  const saved = localStorage.getItem('feedbackhub_user');
  if (saved) {
    try { _user = JSON.parse(saved); } catch(e) {}
  }

  /**
   * Identify user (Trust Mode or JWT Mode)
   */
  FeedbackHub.identify = function(data) {
    if (!data) return null;
    if (data.token) {
      // JWT Mode - just store token, backend will verify
      _user = { token: data.token };
    } else if (data.id && data.email) {
      // Trust Mode
      _user = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        company: data.company
      };
    }
    
    if (_user) {
      localStorage.setItem('feedbackhub_user', JSON.stringify(_user));
    }
    
    return _user;
  };
  
  /**
   * Clear identity (logout)
   */
  FeedbackHub.clearIdentity = function() {
    _user = null;
    localStorage.removeItem('feedbackhub_user');
  };
  
  /**
   * Check if user is identified
   */
  FeedbackHub.isIdentified = function() {
    return _user !== null;
  };
  
  /**
   * Get current user
   */
  FeedbackHub.getUser = function() {
    return _user;
  };
  
  /**
   * Internal: get identified_user payload for API calls
   */
  FeedbackHub._getIdentifyPayload = function() {
    return _user;
  };

  // Fetch settings from API
  async function loadSettings() {
    try {
      const res = await fetch(`${baseUrl}/api/widget-settings?org=${encodeURIComponent(org)}`);
      if (res.ok) {
        const data = await res.json();
        return data.settings || {};
      }
    } catch (e) {
      console.warn('FeedbackHub: Failed to load settings, using defaults');
    }
    return {};
  }

  // Initialize widget based on type
  async function init() {
    const settings = await loadSettings();

    // Apply settings with fallbacks
    const accentColor = settings.accent_color || '#000000';
    const buttonText = settings.button_text || 'Feedback';
    const position = settings.position || 'bottom-right';
    const showBranding = settings.show_branding !== false;

    if (widgetType === 'changelog-popup') {
      initChangelogPopup(settings, customTrigger);
    } else if (widgetType === 'changelog-dropdown') {
      initChangelogDropdown(settings);
    } else if (widgetType === 'all-in-one-popup') {
      initAllInOnePopup(settings);
    } else if (widgetType === 'all-in-one-popover') {
      initAllInOnePopover(settings);
    } else {
      // Default feedback widget
      initFeedbackWidget(settings, accentColor, buttonText, position);
    }
  }

  function initFeedbackWidget(settings, accentColor, buttonText, position) {
    // Create trigger button
    const button = document.createElement('button');
    button.innerHTML = '💬 ' + buttonText;

    const posStyles = {
      'bottom-right': 'bottom:20px;right:20px;',
      'bottom-left': 'bottom:20px;left:20px;',
      'top-right': 'top:20px;right:20px;',
      'top-left': 'top:20px;left:20px;'
    };

    button.style.cssText = 'position:fixed;' + (posStyles[position] || posStyles['bottom-right']) + 'z-index:9998;padding:12px 20px;background:' + accentColor + ';color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:sans-serif;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
    button.id = 'feedbackhub-trigger';
    document.body.appendChild(button);

    // Create iframe (hidden by default)
    const iframe = document.createElement('iframe');
    iframe.src = baseUrl + '/embed/widget?org=' + encodeURIComponent(org);
    iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;display:none;';
    iframe.id = 'feedbackhub-widget';
    document.body.appendChild(iframe);

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

    button.addEventListener('click', openWidget);

    window.addEventListener('message', function(e) {
      if (e.data === 'feedbackhub:close') {
        closeWidget();
      }
    });

    window.FeedbackHub = {
      open: openWidget,
      close: closeWidget
    };
  }

  function initChangelogPopup(settings, customTrigger) {
    let isOpen = false;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'feedbackhub-changelog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;display:none;';
    document.body.appendChild(overlay);

    // Create iframe container
    const container = document.createElement('div');
    container.id = 'feedbackhub-changelog-container';
    container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;display:none;width:90%;max-width:680px;max-height:90vh;';
    document.body.appendChild(container);

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = baseUrl + '/embed/changelog-popup?org=' + encodeURIComponent(org);
    iframe.style.cssText = 'width:100%;height:80vh;border:none;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);';
    container.appendChild(iframe);

    function openPopup() {
      overlay.style.display = 'block';
      container.style.display = 'block';
      isOpen = true;
    }

    function closePopup() {
      overlay.style.display = 'none';
      container.style.display = 'none';
      isOpen = false;
    }

    overlay.addEventListener('click', closePopup);

    // Custom trigger support
    if (customTrigger) {
      const triggerEl = document.getElementById(customTrigger);
      if (triggerEl) {
        triggerEl.addEventListener('click', function(e) {
          e.preventDefault();
          openPopup();
        });
      }
    }

    // Auto-trigger on homepage load
    if (settings.auto_trigger_enabled && settings.homepage_url) {
      const currentUrl = window.location.href;
      const homepageUrl = settings.homepage_url.trim();
      
      // Normalize URLs for comparison (remove trailing slashes, protocol, etc.)
      const normalizeUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.origin + urlObj.pathname.replace(/\/$/, '') + urlObj.search;
        } catch {
          // If URL parsing fails, just normalize the string
          return url.replace(/\/$/, '').toLowerCase();
        }
      };
      
      const currentNormalized = normalizeUrl(currentUrl);
      const homepageNormalized = normalizeUrl(homepageUrl);
      
      // Check if current page matches homepage
      if (currentNormalized === homepageNormalized || currentUrl === homepageUrl) {
        // Check if we've already shown it in this session
        const sessionKey = 'feedbackhub_changelog_shown_' + org;
        if (!sessionStorage.getItem(sessionKey)) {
          // Small delay to ensure page is fully loaded
          setTimeout(() => {
            openPopup();
            sessionStorage.setItem(sessionKey, 'true');
          }, 500);
        }
      }
    }

    // Listen for messages from iframe
    window.addEventListener('message', function(e) {
      if (e.data === 'feedbackhub:close-changelog') {
        closePopup();
      }
    });

    window.FeedbackHubChangelog = {
      open: openPopup,
      close: closePopup
    };
  }

  function initChangelogDropdown(settings) {
    const triggerId = 'feedbackhub-changelog-trigger';
    const trigger = document.getElementById(triggerId);

    if (!trigger) {
      console.warn('FeedbackHub: Trigger element #' + triggerId + ' not found');
      return;
    }

    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.id = 'feedbackhub-changelog-dropdown';
    dropdown.style.cssText = 'position:absolute;z-index:9999;display:none;width:380px;max-height:500px;';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = baseUrl + '/embed/changelog-dropdown?org=' + encodeURIComponent(org);
    iframe.style.cssText = 'width:100%;height:500px;border:none;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.15);';
    dropdown.appendChild(iframe);
    document.body.appendChild(dropdown);

    let isOpen = false;

    function positionDropdown() {
      const rect = trigger.getBoundingClientRect();
      dropdown.style.top = (rect.bottom + window.scrollY + 8) + 'px';
      dropdown.style.left = Math.max(8, rect.left + window.scrollX - 150) + 'px';
    }

    function openDropdown() {
      positionDropdown();
      dropdown.style.display = 'block';
      isOpen = true;
    }

    function closeDropdown() {
      dropdown.style.display = 'none';
      isOpen = false;
    }

    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !dropdown.contains(e.target) && e.target !== trigger) {
        closeDropdown();
      }
    });

    window.FeedbackHubChangelog = {
      open: openDropdown,
      close: closeDropdown
    };
  }

  function initAllInOnePopup(settings) {
    let isOpen = false;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'feedbackhub-allinone-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;display:none;';
    document.body.appendChild(overlay);

    // Create iframe container
    const container = document.createElement('div');
    container.id = 'feedbackhub-allinone-container';
    container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;display:none;width:90%;max-width:680px;max-height:90vh;';
    document.body.appendChild(container);

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = baseUrl + '/embed/all-in-one?org=' + encodeURIComponent(org) + '&mode=popup';
    iframe.style.cssText = 'width:100%;height:80vh;border:none;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);';
    container.appendChild(iframe);

    // Create floating trigger button
    const button = document.createElement('button');
    button.innerHTML = '💬';
    button.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9997;width:56px;height:56px;background:' + (settings.accent_color || '#7c3aed') + ';color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;';
    button.id = 'feedbackhub-allinone-trigger';
    document.body.appendChild(button);

    function openPopup() {
      overlay.style.display = 'block';
      container.style.display = 'block';
      button.style.display = 'none';
      isOpen = true;
    }

    function closePopup() {
      overlay.style.display = 'none';
      container.style.display = 'none';
      button.style.display = 'flex';
      isOpen = false;
    }

    button.addEventListener('click', openPopup);
    overlay.addEventListener('click', closePopup);

    window.addEventListener('message', function(e) {
      if (e.data === 'feedbackhub:close') {
        closePopup();
      }
    });

    window.FeedbackHub = {
      open: openPopup,
      close: closePopup
    };
  }

  function initAllInOnePopover(settings) {
    let isOpen = false;

    // Create popover container
    const popover = document.createElement('div');
    popover.id = 'feedbackhub-allinone-popover';
    popover.style.cssText = 'position:fixed;bottom:90px;right:20px;z-index:9998;display:none;width:400px;height:600px;max-height:calc(100vh - 120px);';
    document.body.appendChild(popover);

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = baseUrl + '/embed/all-in-one?org=' + encodeURIComponent(org) + '&mode=popover';
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);';
    popover.appendChild(iframe);

    // Create floating trigger button
    const button = document.createElement('button');
    button.innerHTML = '💬';
    button.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9997;width:56px;height:56px;background:' + (settings.accent_color || '#7c3aed') + ';color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;';
    button.id = 'feedbackhub-allinone-trigger';
    document.body.appendChild(button);

    function openPopover() {
      popover.style.display = 'block';
      button.innerHTML = '✕';
      isOpen = true;
    }

    function closePopover() {
      popover.style.display = 'none';
      button.innerHTML = '💬';
      isOpen = false;
    }

    button.addEventListener('click', function() {
      if (isOpen) {
        closePopover();
      } else {
        openPopover();
      }
    });

    window.addEventListener('message', function(e) {
      if (e.data === 'feedbackhub:close') {
        closePopover();
      }
    });

    window.FeedbackHub = {
      open: openPopover,
      close: closePopover
    };
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
