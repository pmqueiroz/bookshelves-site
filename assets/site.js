// Bookshelves website: the few things that move. Everything works without it
// (the books just stand on the shelf, the answers stay closed).
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 404.html serves every missing path: switch to Portuguese under /pt-br/.
  function localise404() {
    var body = document.body;
    if (!body.hasAttribute('data-pt') || !/\/pt-br\//.test(location.pathname)) return;
    body.innerHTML = body.getAttribute('data-pt');
    body.removeAttribute('data-pt');
    document.documentElement.lang = 'pt-BR';
  }

  // Trailer: the video is only created on click (nothing fetched before).
  function trailer() {
    var btn = document.querySelector('.poster');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var v = document.createElement('video');
      v.src = btn.getAttribute('data-src');
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('aria-label', btn.getAttribute('aria-label'));
      btn.parentNode.replaceChild(v, btn);
      v.focus();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  // Each book row fits whole books: up books first, the leaning one last.
  function fitBooks() {
    document.querySelectorAll('.books').forEach(function (row) {
      var w = row.clientWidth;
      if (!w) return;
      var books = row.querySelectorAll('.b');
      var fit = Math.max(4, Math.floor((w - 58) / 44) + 1);
      if (row.classList.contains('in')) fit = Math.min(fit, 11);
      books.forEach(function (b, i) {
        b.hidden = !(i < fit - 1 || i === books.length - 1);
      });
    });
  }

  // Books drop onto the plank when 30% of the row is on screen, once.
  function shelve() {
    var rows = document.querySelectorAll('.row');
    if (!rows.length) return;
    var all = function (row, drop) {
      row.querySelectorAll('.books').forEach(function (b) {
        b.classList.add('shelved');
        if (drop) b.classList.add('drop');
      });
    };
    if (reduced || !('IntersectionObserver' in window)) {
      rows.forEach(function (r) { all(r, false); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        all(e.target, true);
      });
    }, { threshold: 0.3 });
    rows.forEach(function (r) { io.observe(r); });
  }

  // The Daily Curate card shows the visitor's today.
  function today() {
    var cal = document.querySelector('.cal');
    if (!cal) return;
    var d = new Date(), months = cal.getAttribute('data-months').split(',');
    cal.querySelector('.mo').textContent = months[d.getMonth()];
    cal.querySelector('.dy').textContent = d.getDate();
  }

  // Support: questions open and close (several at once), search filters.
  function faq() {
    document.querySelectorAll('.q button').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
        b.closest('.q').classList.toggle('open', open);
      });
    });
    var input = document.getElementById('faq-q');
    if (!input) return;
    var S = JSON.parse(document.getElementById('faq-strings').textContent);
    var count = document.getElementById('faq-count');
    var none = document.querySelector('.none');
    var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    var fill = function (s, k, v) { return s.replace('{' + k + '}', v); };
    var topics = document.querySelectorAll('.topic:not(.wide)');
    topics.forEach(function (t) {
      t.querySelectorAll('.q').forEach(function (q) { q._text = norm(q.textContent); });
    });
    function run() {
      var raw = input.value.trim(), q = norm(raw), total = 0, shown = 0;
      topics.forEach(function (t) {
        var n = 0;
        t.querySelectorAll('.q').forEach(function (it) {
          var hit = !q || it._text.indexOf(q) >= 0;
          it.hidden = !hit;
          if (hit) n++;
        });
        t.hidden = n === 0;
        var tab = document.querySelector('.tabs li[data-topic="' + t.id.replace('topic-', '') + '"]');
        if (tab) { tab.hidden = n === 0; tab.querySelector('.n').textContent = n; }
        total += n;
        if (n) shown++;
      });
      var line = total === 1 ? S.countOne : fill(S.countMany, 'n', total);
      line += raw ? fill(S.countFor, 'q', raw) : fill(S.countIn, 't', shown);
      count.textContent = line;
      none.hidden = !(q && total === 0);
      if (!none.hidden) none.querySelector('.nl').textContent = fill(S.none, 'q', raw);
    }
    input.addEventListener('input', run);
    // A link to #q-... or #a-... opens that answer.
    var h = location.hash.replace('#a-', '#q-');
    var target = h && document.querySelector(h + '[aria-controls]');
    if (target) target.click();
  }

  document.addEventListener('DOMContentLoaded', function () {
    localise404();
    trailer();
    fitBooks();
    shelve();
    today();
    faq();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fitBooks, 100); });
  });
})();
