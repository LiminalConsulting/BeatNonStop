// Ticket modal — opens Shotgun iframe on demand
(function() {
  var modal = document.getElementById('ticket-modal');
  var iframe = document.getElementById('ticket-iframe');
  if (!modal || !iframe) return;

  var iframeSrc = iframe.getAttribute('data-src');

  function openModal() {
    if (!iframe.src) iframe.src = iframeSrc;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-tickets]').forEach(function(el) {
    el.addEventListener('click', openModal);
  });

  document.querySelectorAll('[data-close-modal]').forEach(function(el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
