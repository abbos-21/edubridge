(function () {
  var bot = new URLSearchParams(location.search).get('bot') || '';
  if (!/^[A-Za-z0-9_]{3,64}$/.test(bot)) return;
  window.onTelegramAuth = function (user) {
    // only our own page may receive it
    window.parent.postMessage({ type: 'edubridge:telegram-auth', user: user }, location.origin);
  };
  var s = document.createElement('script');
  s.src = 'https://telegram.org/js/telegram-widget.js?22';
  s.async = true;
  s.setAttribute('data-telegram-login', bot);
  s.setAttribute('data-size', 'large');
  s.setAttribute('data-onauth', 'onTelegramAuth(user)');
  document.getElementById('w').appendChild(s);
})();
