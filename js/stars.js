(function() {
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var stars = [];
  var count = window.innerWidth < 768 ? 100 : 200;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function init() {
    stars = [];
    count = window.innerWidth < 768 ? 100 : 200;
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        opacity: Math.random() * 0.6 + 0.1,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  // Brand-tinted stars: lavender (200,220,245) with occasional cyan/magenta accents
  function starColor(i) {
    var mod = i % 13;
    if (mod === 0) return '104, 224, 248'; // cyan
    if (mod === 6) return '192, 128, 248'; // magenta
    return '220, 228, 244';                 // default lavender silver
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var t = Date.now() / 3000;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var o = s.opacity + Math.sin(t + s.pulse) * 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + starColor(i) + ', ' + Math.max(0, o) + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', function() { resize(); init(); });
  resize();
  init();
  draw();
})();
