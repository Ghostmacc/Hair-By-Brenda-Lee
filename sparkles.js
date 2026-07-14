/* Beauty Quest — wand sparkles.
   Brenda is magical with hair, so the pointer is her wand: sparkles trail as
   you move and burst when you tap/click. Works with mouse, touch, and pen via
   Pointer Events. Self-contained, no dependencies, pointer-events:none so it
   never blocks a click. Honors prefers-reduced-motion. */
(function () {
  if (window.__bqSparkles) return;
  window.__bqSparkles = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var STAR = 'M12 1 C13.5 7.5 16.5 10.5 23 12 C16.5 13.5 13.5 16.5 12 23 C10.5 16.5 7.5 13.5 1 12 C7.5 10.5 10.5 7.5 12 1 Z';
  var COLORS = ['#d4578e', '#f0a8c8', '#ffd76b', '#fad165', '#f6c5be', '#ffffff'];
  var MAX = 90;            // hard cap on live sparkles (perf guard)
  var live = 0;
  var lastTrail = 0;

  var layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden';
  function mount() { (document.body || document.documentElement).appendChild(layer); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spark(x, y, opts) {
    if (live >= MAX) return;
    opts = opts || {};
    var size = opts.size || rand(8, 16);
    var color = COLORS[(Math.random() * COLORS.length) | 0];
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('width', size);
    el.setAttribute('height', size);
    el.style.cssText = 'position:absolute;left:' + (x - size / 2) + 'px;top:' + (y - size / 2) +
      'px;filter:drop-shadow(0 0 ' + (size / 3) + 'px ' + color + '88);will-change:transform,opacity';
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', STAR);
    p.setAttribute('fill', color);
    el.appendChild(p);
    layer.appendChild(el);
    live++;

    var dx = (opts.dx != null ? opts.dx : rand(-14, 14));
    var dy = (opts.dy != null ? opts.dy : rand(-10, 22)); // slight downward drift = falling glitter
    var rot = rand(-140, 140);
    var dur = opts.dur || rand(650, 1150);
    var anim = el.animate(
      [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + dx * 0.35 + 'px,' + dy * 0.3 + 'px) scale(1) rotate(' + rot * 0.4 + 'deg)', opacity: 1, offset: 0.28 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.2) rotate(' + rot + 'deg)', opacity: 0 }
      ],
      { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)' }
    );
    anim.onfinish = anim.oncancel = function () { el.remove(); live--; };
  }

  // Trail as the wand moves (throttled).
  function onMove(e) {
    var now = e.timeStamp || Date.now();
    if (now - lastTrail < 28) return;
    lastTrail = now;
    var n = 1 + (Math.random() < 0.35 ? 1 : 0);
    for (var i = 0; i < n; i++) {
      spark(e.clientX + rand(-6, 6), e.clientY + rand(-6, 6), { size: rand(7, 13) });
    }
  }

  // Burst on tap/click — a flick of the wand.
  function burst(x, y) {
    var count = 12 + (Math.random() * 6 | 0);
    for (var i = 0; i < count; i++) {
      var a = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
      var r = rand(18, 52);
      spark(x, y, { dx: Math.cos(a) * r, dy: Math.sin(a) * r - rand(0, 12), size: rand(10, 20), dur: rand(700, 1250) });
    }
  }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', function (e) { burst(e.clientX, e.clientY); }, { passive: true });
})();
