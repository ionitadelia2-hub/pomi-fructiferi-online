(function () {
  'use strict';
  if (window.location.pathname.startsWith('/admin-comenzi') ||
      document.getElementById('pfo-mobile-chat-tree')) return;

  var api = window.Tawk_API = window.Tawk_API || {};
  var ready = false;
  var brokenImage = false;
  var media = window.matchMedia('(max-width: 767px)');
  var style = document.createElement('style');
  style.textContent = '#pfo-mobile-chat-tree{display:none;position:fixed;right:22px;bottom:calc(82px + env(safe-area-inset-bottom, 0px));width:100px;height:100px;padding:0;border:0;background:transparent;cursor:pointer;z-index:2147483000;line-height:0}#pfo-mobile-chat-tree[hidden]{display:none!important}#pfo-mobile-chat-tree img{display:block;width:100px;height:100px;max-width:none}#pfo-mobile-chat-tree:focus-visible{outline:3px solid #176b35;outline-offset:3px;border-radius:8px}@media(max-width:767px){#pfo-mobile-chat-tree:not([hidden]){display:block}}';
  document.head.appendChild(style);

  var button = document.createElement('button');
  button.id = 'pfo-mobile-chat-tree';
  button.type = 'button';
  button.hidden = true;
  button.setAttribute('aria-label', 'Deschide chatul. Te ajutăm!');
  var image = document.createElement('img');
  image.alt = '';
  image.width = image.height = 100;
  image.onerror = function () { brokenImage = true; sync(); };
  image.src = '/images/chat-te-ajutam-100px.png';
  button.appendChild(image);
  document.body.appendChild(button);

  function sync() {
    button.hidden = !ready || brokenImage || !media.matches ||
      typeof api.isChatMinimized !== 'function' || !api.isChatMinimized() ||
      (typeof api.isChatHidden === 'function' && api.isChatHidden());
  }

  function chain(name, callback) {
    var previous = api[name];
    api[name] = function () {
      try {
        if (typeof previous === 'function') previous.apply(this, arguments);
      } finally {
        callback.apply(this, arguments);
      }
    };
  }

  chain('onLoad', function () { ready = true; sync(); });
  chain('onChatMaximized', function () { button.hidden = true; });
  chain('onChatHidden', function () { button.hidden = true; });
  chain('onChatMinimized', sync);
  chain('onStatusChange', sync);
  button.addEventListener('click', function () {
    if (ready && typeof api.maximize === 'function') {
      button.hidden = true;
      api.maximize();
    }
  });
  if (media.addEventListener) media.addEventListener('change', sync);
  else media.addListener(sync);
})();
