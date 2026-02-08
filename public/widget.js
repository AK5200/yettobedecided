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

  // Find elements with data attributes for auto-trigger
  function findDataAttributeTriggers() {
    const triggers = {
      changelogPopup: document.querySelectorAll('[data-feedbackhub-changelog-popup]'),
      changelogDropdown: document.querySelectorAll('[data-feedbackhub-changelog-dropdown]'),
      feedback: document.querySelectorAll('[data-feedbackhub-feedback]'),
      allInOnePopup: document.querySelectorAll('[data-feedbackhub-all-in-one-popup]'),
      allInOnePopover: document.querySelectorAll('[data-feedbackhub-all-in-one-popover]'),
    };
    return triggers;
  }

  // Initialize widget based on type
  async function init() {
    const settings = await loadSettings();

    // Apply settings with fallbacks
    const accentColor = settings.accent_color || '#000000';
    const buttonText = settings.button_text || 'Feedback';
    const position = settings.position || 'bottom-right';
    const showBranding = settings.show_branding !== false;

    // Check for data attribute triggers first
    const dataTriggers = findDataAttributeTriggers();
    let hasDataTrigger = false;

    if (dataTriggers.changelogPopup.length > 0) {
      hasDataTrigger = true;
      initChangelogPopup(settings, null, dataTriggers.changelogPopup);
    } else if (dataTriggers.changelogDropdown.length > 0) {
      hasDataTrigger = true;
      initChangelogDropdown(settings, dataTriggers.changelogDropdown);
    } else if (dataTriggers.allInOnePopup.length > 0) {
      hasDataTrigger = true;
      initAllInOnePopup(settings, dataTriggers.allInOnePopup);
    } else if (dataTriggers.allInOnePopover.length > 0) {
      hasDataTrigger = true;
      initAllInOnePopover(settings, dataTriggers.allInOnePopover);
    } else if (dataTriggers.feedback.length > 0) {
      hasDataTrigger = true;
      initFeedbackWidget(settings, accentColor, buttonText, position, dataTriggers.feedback);
    } else if (widgetType === 'changelog-popup') {
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

  function initFeedbackWidget(settings, accentColor, buttonText, position, dataTriggerElements) {
    // Create iframe (hidden by default)
    const iframe = document.createElement('iframe');
    iframe.src = baseUrl + '/embed/widget?org=' + encodeURIComponent(org);
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;display:none;background:white;pointer-events:auto;';
    iframe.id = 'feedbackhub-widget';
    document.body.appendChild(iframe);

    function openWidget() {
      iframe.style.display = 'block';
      const button = document.getElementById('feedbackhub-trigger');
      if (button) button.style.display = 'none';
      iframe.contentWindow.postMessage('open', '*');
    }

    function closeWidget() {
      iframe.style.display = 'none';
      const button = document.getElementById('feedbackhub-trigger');
      if (button) button.style.display = 'block';
      iframe.contentWindow.postMessage('close', '*');
    }

    // Data attribute trigger support (Supahub-style) - hide default button if custom triggers exist
    if (dataTriggerElements && dataTriggerElements.length > 0) {
      dataTriggerElements.forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          openWidget();
        });
      });
      // Don't create default button if custom triggers exist
    } else {
      // Create default floating trigger button
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
      button.addEventListener('click', openWidget);
    }

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

  function initChangelogPopup(settings, customTrigger, dataTriggerElements) {
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

    // Data attribute trigger support (Supahub-style)
    if (dataTriggerElements && dataTriggerElements.length > 0) {
      dataTriggerElements.forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          openPopup();
        });
      });
    }

    // Custom trigger support (ID-based, legacy)
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

  function initChangelogDropdown(settings, dataTriggerElements) {
    let triggers = [];
    
    // Data attribute trigger support (Supahub-style)
    if (dataTriggerElements && dataTriggerElements.length > 0) {
      triggers = Array.from(dataTriggerElements);
    } else {
      // Legacy: ID-based trigger
      const triggerId = 'feedbackhub-changelog-trigger';
      const trigger = document.getElementById(triggerId);
      if (trigger) {
        triggers = [trigger];
      } else {
        console.warn('FeedbackHub: No trigger element found. Add data-feedbackhub-changelog-dropdown to an element or use id="feedbackhub-changelog-trigger"');
        return;
      }
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
    let activeTrigger = null;

    function positionDropdown(triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      dropdown.style.top = (rect.bottom + window.scrollY + 8) + 'px';
      dropdown.style.left = Math.max(8, rect.left + window.scrollX - 150) + 'px';
    }

    function openDropdown(triggerEl) {
      activeTrigger = triggerEl;
      positionDropdown(triggerEl);
      dropdown.style.display = 'block';
      isOpen = true;
    }

    function closeDropdown() {
      dropdown.style.display = 'none';
      isOpen = false;
      activeTrigger = null;
    }

    // Attach click handlers to all triggers
    triggers.forEach(function(trigger) {
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (isOpen && activeTrigger === trigger) {
          closeDropdown();
        } else {
          openDropdown(trigger);
        }
      });
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !dropdown.contains(e.target) && !triggers.includes(e.target)) {
        closeDropdown();
      }
    });

    window.FeedbackHubChangelog = {
      open: openDropdown,
      close: closeDropdown
    };
  }

  // Responsive size function - converts size to viewport width
  function getResponsiveSize(size) {
    const sizeMap = {
      'xsmall': '25vw',
      'small': '35vw',
      'medium': '45vw',
      'large': '55vw',
      'xlarge': '70vw'
    };
    return sizeMap[size] || '55vw';
  }

  function initAllInOnePopup(settings, dataTriggerElements) {
    let isOpen = false;

    // Get placement and responsive size from settings
    const popupPlacement = settings.all_in_one_popup_placement || 'right';
    const widgetSize = settings.size || 'large';
    const responsiveWidth = getResponsiveSize(widgetSize);
    const isLeft = popupPlacement === 'left';

    // Create overlay - subtle background
    const overlay = document.createElement('div');
    overlay.id = 'feedbackhub-allinone-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:9998;display:none;';
    document.body.appendChild(overlay);

    // Create iframe container - positioned based on settings with responsive width
    const container = document.createElement('div');
    container.id = 'feedbackhub-allinone-container';
    const positionStyle = isLeft 
      ? `position:fixed;top:0;left:0;z-index:9999;display:none;width:${responsiveWidth};min-width:300px;max-width:90vw;height:100vh;`
      : `position:fixed;top:0;right:0;z-index:9999;display:none;width:${responsiveWidth};min-width:300px;max-width:90vw;height:100vh;`;
    container.style.cssText = positionStyle;
    document.body.appendChild(container);

    // Create iframe - pass style variant via URL for immediate rendering
    // Note: The embed page will fetch settings from API, but we pass it via URL as a fallback
    const iframe = document.createElement('iframe');
    const styleVariant = settings.all_in_one_style_variant || '1';
    // Add cache busting and ensure settings are fresh
    iframe.src = baseUrl + '/embed/all-in-one?org=' + encodeURIComponent(org) + '&mode=popup&style=' + encodeURIComponent(styleVariant) + '&t=' + Date.now();
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0;box-shadow:-4px 0 20px rgba(0,0,0,0.1);display:block;margin:0;padding:0;';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowtransparency', 'true');
    container.appendChild(iframe);
    
    // Debug log
    console.log('FeedbackHub: Initializing All-in-One Popup with style variant:', styleVariant, 'from settings:', settings);

    function openPopup() {
      overlay.style.display = 'block';
      container.style.display = 'block';
      const button = document.getElementById('feedbackhub-allinone-trigger');
      if (button) button.style.display = 'none';
      isOpen = true;
    }

    function closePopup() {
      overlay.style.display = 'none';
      container.style.display = 'none';
      const button = document.getElementById('feedbackhub-allinone-trigger');
      if (button) button.style.display = 'flex';
      isOpen = false;
    }

    // Data attribute trigger support (Supahub-style) - hide default button if custom triggers exist
    if (dataTriggerElements && dataTriggerElements.length > 0) {
      dataTriggerElements.forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          openPopup();
        });
      });
      // Don't create default button if custom triggers exist
    } else {
      // Create floating trigger button
      const button = document.createElement('button');
      button.innerHTML = '💬';
      button.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9997;width:56px;height:56px;background:' + (settings.accent_color || '#7c3aed') + ';color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;';
      button.id = 'feedbackhub-allinone-trigger';
      document.body.appendChild(button);
      button.addEventListener('click', openPopup);
    }

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

  function initAllInOnePopover(settings, dataTriggerElements) {
    let isOpen = false;

    // Get placement and responsive size from settings
    const popoverPlacement = settings.all_in_one_popover_placement || 'bottom-right';
    const widgetSize = settings.size || 'large';
    const responsiveWidth = getResponsiveSize(widgetSize);
    const isBottom = popoverPlacement.includes('bottom');
    const isLeft = popoverPlacement.includes('left');
    const isRight = popoverPlacement.includes('right');
    
    // Build position styles - only set one of top/bottom and one of left/right
    let positionStyle = 'position:fixed;z-index:9998;display:none;';
    
    // Set vertical position (only one of top or bottom) with responsive spacing
    if (isBottom) {
      // Responsive spacing from bottom: min 20px, preferred 5vh, max 80px
      const bottomSpacing = Math.max(20, Math.min(80, window.innerHeight * 0.05));
      positionStyle += 'bottom:' + bottomSpacing + 'px;';
    } else {
      // Responsive spacing from top: min 20px, preferred 5vh, max 80px
      const topSpacing = Math.max(20, Math.min(80, window.innerHeight * 0.05));
      positionStyle += 'top:' + topSpacing + 'px;';
    }
    
    // Set horizontal position (only one of left or right) with responsive spacing
    if (isLeft) {
      // Responsive spacing from left: min 16px, preferred 2vw, max 24px
      const leftSpacing = Math.max(16, Math.min(24, window.innerWidth * 0.02));
      positionStyle += 'left:' + leftSpacing + 'px;';
    } else {
      // Responsive spacing from right: min 16px, preferred 2vw, max 24px
      const rightSpacing = Math.max(16, Math.min(24, window.innerWidth * 0.02));
      positionStyle += 'right:' + rightSpacing + 'px;';
    }
    
    // Add size and other styles
    positionStyle += `width:${responsiveWidth};min-width:300px;max-width:90vw;height:600px;max-height:calc(100vh - 120px);`;

    // Create popover container with responsive width
    const popover = document.createElement('div');
    popover.id = 'feedbackhub-allinone-popover';
    popover.style.cssText = positionStyle;
    document.body.appendChild(popover);

    // Create iframe - pass style variant via URL for immediate rendering
    // Note: The embed page will fetch settings from API, but we pass it via URL as a fallback
    const iframe = document.createElement('iframe');
    const styleVariant = settings.all_in_one_style_variant || '1';
    // Add cache busting and ensure settings are fresh
    iframe.src = baseUrl + '/embed/all-in-one?org=' + encodeURIComponent(org) + '&mode=popover&style=' + encodeURIComponent(styleVariant) + '&t=' + Date.now();
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);';
    popover.appendChild(iframe);
    
    // Debug log
    console.log('FeedbackHub: Initializing All-in-One Popover with style variant:', styleVariant, 'from settings:', settings);

    function openPopover() {
      popover.style.display = 'block';
      const button = document.getElementById('feedbackhub-allinone-trigger');
      if (button) button.innerHTML = '✕';
      isOpen = true;
    }

    function closePopover() {
      popover.style.display = 'none';
      const button = document.getElementById('feedbackhub-allinone-trigger');
      if (button) button.innerHTML = '💬';
      isOpen = false;
    }

    // Data attribute trigger support (Supahub-style) - hide default button if custom triggers exist
    if (dataTriggerElements && dataTriggerElements.length > 0) {
      dataTriggerElements.forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (isOpen) {
            closePopover();
          } else {
            openPopover();
          }
        });
      });
      // Don't create default button if custom triggers exist
    } else {
      // Create floating trigger button - position based on popover placement
      const button = document.createElement('button');
      button.innerHTML = '💬';
      const buttonTop = isBottom ? 'auto' : '20px';
      const buttonBottom = isBottom ? '20px' : 'auto';
      const buttonLeft = isLeft ? '20px' : 'auto';
      const buttonRight = isRight ? '20px' : 'auto';
      const buttonStyle = `position:fixed;${buttonTop !== 'auto' ? 'top:' + buttonTop + ';' : ''}${buttonBottom !== 'auto' ? 'bottom:' + buttonBottom + ';' : ''}${buttonLeft !== 'auto' ? 'left:' + buttonLeft + ';' : ''}${buttonRight !== 'auto' ? 'right:' + buttonRight + ';' : ''}z-index:9997;width:56px;height:56px;background:${settings.accent_color || '#7c3aed'};color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;`;
      button.style.cssText = buttonStyle;
      button.id = 'feedbackhub-allinone-trigger';
      document.body.appendChild(button);
      button.addEventListener('click', function() {
        if (isOpen) {
          closePopover();
        } else {
          openPopover();
        }
      });
    }

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
