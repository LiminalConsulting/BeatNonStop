// Custom cursor — dot + trailing ring
(function() {
  // Skip on touch devices
  if ('ontouchstart' in window) return;

  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);

  var ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(ring);

  var mx = -100, my = -100;
  var rx = -100, ry = -100;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = 'translate(' + mx + 'px, ' + my + 'px)';
  });

  function followRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = 'translate(' + rx + 'px, ' + ry + 'px)';
    requestAnimationFrame(followRing);
  }
  followRing();

  // Expand ring on interactive elements
  var interactives = 'a, button, .btn-primary, .ticket-card, .vip-card, .lineup-row, .lang-btn';

  document.addEventListener('mouseover', function(e) {
    if (e.target.closest(interactives)) {
      ring.classList.add('cursor-hover');
      dot.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (e.target.closest(interactives)) {
      ring.classList.remove('cursor-hover');
      dot.classList.remove('cursor-hover');
    }
  });

  // Hide when cursor leaves window
  document.addEventListener('mouseleave', function() {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function() {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
})();
