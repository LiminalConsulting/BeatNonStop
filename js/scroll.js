// Scroll reveal
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(function(el) {
    observer.observe(el);
  });
})();

// Nav scroll behavior
(function() {
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  });
})();

// Countdown
(function() {
  function tick() {
    var diff = new Date('2026-05-16T18:00:00') - new Date();
    if (diff <= 0) return;
    var el;
    el = document.getElementById('cd-days');
    if (el) el.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
    el = document.getElementById('cd-hours');
    if (el) el.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    el = document.getElementById('cd-min');
    if (el) el.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    el = document.getElementById('cd-sec');
    if (el) el.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
})();

// Language switcher
(function() {
  var LANG_KEY = 'bns_lang';
  window.setLang = function(lang) {
    document.body.classList.remove('pt', 'fr');
    if (lang === 'pt') document.body.classList.add('pt');
    if (lang === 'fr') document.body.classList.add('fr');
    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.classList.toggle('active', b.textContent.trim() === lang.toUpperCase());
    });
    localStorage.setItem(LANG_KEY, lang);
  };
  setLang(localStorage.getItem(LANG_KEY) || 'pt');
})();
