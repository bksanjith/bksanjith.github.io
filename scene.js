(function () {
  'use strict';
  var svg = document.getElementById('world');
  if (!svg) return;
  var stage = document.getElementById('stage');
  var walk = document.getElementById('walk');
  var cardsEl = document.getElementById('cards');
  var heroEl = document.getElementById('walk-hero');
  var barEl = document.getElementById('walk-bar');

  var LN = '#CDBFA8', HI = '#E6E2DA', FAR = '#8a7f6e', INK = '#23211D', SOFT = '#2C2924';
  var FY = 700, CY = 380, EYE = 560, F = 700, D = 520;

  // ---------- drawing helpers ----------
  function f(n) { return Math.round(n * 10) / 10; }
  function P(d, w, c, x) {
    return '<path class="d" pathLength="1" d="' + d + '" stroke="' + (c || LN) + '" stroke-width="' + (w || 1.4) + '" fill="none"' + (x || '') + '/>';
  }
  function PF(d, w, c, fill) {
    return '<path class="d" pathLength="1" d="' + d + '" stroke="' + (c || LN) + '" stroke-width="' + (w || 1.4) + '" fill="' + (fill || INK) + '"/>';
  }
  function T(x, y, s, txt, c, anchor, weight) {
    return '<text class="t" x="' + f(x) + '" y="' + f(y) + '" font-size="' + s + '" fill="' + (c || LN) + '" text-anchor="' + (anchor || 'start') + '"' + (weight ? ' font-weight="' + weight + '"' : '') + '>' + txt + '</text>';
  }
  function proj(vx) {
    return function (x, y, z) { var s = F / (F + z); return [vx + (x - vx) * s, EYE + (y - EYE) * s]; };
  }
  function seg(pr, a, b) { var p = pr(a[0], a[1], a[2]), q = pr(b[0], b[1], b[2]); return 'M' + f(p[0]) + ' ' + f(p[1]) + 'L' + f(q[0]) + ' ' + f(q[1]); }
  function poly(pr, pts, close) {
    return pts.map(function (p, i) { var q = pr(p[0], p[1], p[2]); return (i ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]); }).join('') + (close ? 'Z' : '');
  }
  function box(pr, vx, x0, x1, y0, y1, z0, z1, w, c, fill) {
    var c8 = {};
    [[x0, 'a'], [x1, 'b']].forEach(function (X) { [[y0, 't'], [y1, 'u']].forEach(function (Y) { [[z0, 'f'], [z1, 'k']].forEach(function (Z) { c8[X[1] + Y[1] + Z[1]] = [X[0], Y[0], Z[0]]; }); }); });
    var out = '';
    var faces = [];
    if (EYE < y0) faces.push(['atf', 'btf', 'btk', 'atk']);
    if (EYE > y1) faces.push(['auf', 'buf', 'buk', 'auk']);
    if (vx < x0) faces.push(['atf', 'auf', 'auk', 'atk']);
    if (vx > x1) faces.push(['btf', 'buf', 'buk', 'btk']);
    faces.forEach(function (fc) { out += PF(poly(pr, fc.map(function (k) { return c8[k]; }), true), (w || 1.4) * 0.6, c || LN, fill || INK); });
    out += PF(poly(pr, [c8.atf, c8.btf, c8.buf, c8.auf], true), w || 1.4, c || LN, fill || INK);
    return out;
  }
  function room(vx, x0, x1, opt) {
    opt = opt || {};
    var pr = proj(vx), s = '';
    var bl = pr(x0, CY, D), br = pr(x1, CY, D), bl2 = pr(x0, FY, D), br2 = pr(x1, FY, D);
    s += P(poly(pr, [[x0, CY, D], [x1, CY, D], [x1, FY, D], [x0, FY, D]], true), 1.1, LN);
    s += P(seg(pr, [x0, CY, 0], [x0, CY, D]) + seg(pr, [x1, CY, 0], [x1, CY, D]) + seg(pr, [x0, FY, 0], [x0, FY, D]) + seg(pr, [x1, FY, 0], [x1, FY, D]), 1.1, LN);
    var n = opt.boards || 0, i;
    for (i = 1; i < n; i++) { var xx = x0 + (x1 - x0) * i / n; s += P(seg(pr, [xx, FY, 0], [xx, FY, D]), 0.5, FAR); }
    if (opt.tiles) { for (i = 1; i < 5; i++) { var z = D * Math.pow(i / 5, 1.3); s += P(seg(pr, [x0, FY, z], [x1, FY, z]), 0.5, FAR); } }
    // section cut at the front
    s += PF('M' + (x0 - 14) + ' ' + (CY - 14) + 'H' + (x1 + 14) + 'V' + CY + 'H' + x0 + 'V' + FY + 'H' + (x0 - 14) + 'Z', 2.6, LN, SOFT);
    s += PF('M' + (x1 + 14) + ' ' + CY + 'V' + FY + 'H' + x1 + 'V' + CY + 'Z', 2.6, LN, SOFT);
    s += PF('M' + (x0 - 14) + ' ' + FY + 'H' + (x1 + 14) + 'V' + (FY + 16) + 'H' + (x0 - 14) + 'Z', 2.6, LN, SOFT);
    return s;
  }
  function circlePath(cx, cy, r) { return 'M' + f(cx - r) + ' ' + f(cy) + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0'; }
  function ellipsePath(cx, cy, rx, ry) { return 'M' + f(cx - rx) + ' ' + f(cy) + 'a' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0'; }
  function hatch(x0, y0, x1, y1, step, w, c) {
    var d = '';
    for (var x = x0; x < x1; x += step) d += 'M' + f(x) + ' ' + y0 + 'V' + y1;
    return P(d, w || 0.5, c || FAR);
  }
  // simple figure for background people
  function person(x, y, s, flip) {
    var k = flip ? -1 : 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + (s * k) + ',' + s + ')">' +
      PF(circlePath(0, -160, 11), 1.6, LN) + PF('M-11 -145h22l3 58h-28z', 1.6, LN) + P('M-6 -87v86M6 -87v86M-12 -142l-6 52M12 -142l6 52', 1.6, LN) + '</g>';
  }

  // ---------- car (AE111 side elevation, ground at 0, front to the right) ----------
  function wheel(cx) {
    var d = circlePath(cx, -29, 29) + circlePath(cx, -29, 21) + circlePath(cx, -29, 5);
    var sp = '';
    for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5; sp += 'M' + f(cx + Math.cos(a) * 6) + ' ' + f(-29 + Math.sin(a) * 6) + 'L' + f(cx + Math.cos(a + 0.12) * 20) + ' ' + f(-29 + Math.sin(a + 0.12) * 20); }
    return PF(circlePath(cx, -29, 29), 2.2, LN) + P(circlePath(cx, -29, 21) + circlePath(cx, -29, 18), 1.1, LN) + P(sp, 0.9, LN) + PF(circlePath(cx, -29, 5), 1, LN);
  }
  function carBody() {
    var s = '';
    s += PF('M420 -20L386 -20A37 37 0 0 0 309 -20L137 -20A37 37 0 0 0 63 -20L10 -20L3 -46L9 -76L106 -86L166 -131L262 -134L333 -92L333 -92L333 -88L418 -72L430 -58L430 -30Z', 2.4, LN);
    s += P('M118 -88L167 -126L257 -129L321 -93Z', 1.3, LN);
    s += P('M209 -129L213 -89M150 -112L152 -88', 1.6, LN);
    s += P('M106 -86L333 -92M14 -58C120 -60 300 -62 426 -60', 0.8, LN);
    s += P('M213 -89L216 -24M321 -92L318 -40M128 -86L138 -44', 1, LN);
    s += P('M286 -80h18M186 -80h18', 1.8, LN);
    s += P('M318 -96l12 -2l2 8l-12 1z', 1.3, LN);
    s += P('M4 -70h22v12h-22z', 1.2, LN);
    s += P('M404 -72l24 4v10l-24 -3z', 1.2, LN);
    s += P('M396 -32h34M12 -32h40', 1, LN);
    s += P('M150 -22h120', 0.6, FAR);
    s += wheel(100) + wheel(346);
    return s;
  }
  function bonnetPath() { return 'M333 -92L418 -76L418 -71L333 -87Z'; }
  function engineSide() {
    return P('M342 -84h60v-6h-60zM350 -90v-8h44v8M356 -98v-6h32v6M402 -86h12v20h-12', 1.1, LN) + P('M360 -104l4 -8M372 -104l4 -8M384 -104l4 -8', 1, LN);
  }

  // ---------- engine bay (top view, 4A-FE transverse) ----------
  function engineBay(x, y, w, h) {
    var s = '', k = w / 940;
    function X(v) { return x + (v + 30) * k; } function Y(v) { return y + (v + 44) * k; }
    function R(a, b, c, d2, wt, col) { return P('M' + f(X(a)) + ' ' + f(Y(b)) + 'H' + f(X(c)) + 'V' + f(Y(d2)) + 'H' + f(X(a)) + 'Z', wt, col); }
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + INK + '"/>';
    s += P('M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'Z', 2.6, HI);
    s += T(x + 24, y + 30, 20, 'Engine bay, Toyota 4A-FE', HI, 'start', 500);
    // body outline of bay
    s += P('M' + X(30) + ' ' + Y(30) + 'Q' + X(310) + ' ' + Y(10) + ' ' + X(590) + ' ' + Y(30) + 'L' + X(600) + ' ' + Y(380) + 'L' + X(20) + ' ' + Y(380) + 'Z', 1.4, LN);
    // radiator and fan
    s += R(90, 40, 530, 72, 1.6);
    var fins = ''; for (var i = 96; i < 528; i += 8) fins += 'M' + f(X(i)) + ' ' + f(Y(42)) + 'V' + f(Y(70));
    s += P(fins, 0.4, FAR);
    s += P(circlePath(X(410), Y(98), 34 * k) + circlePath(X(410), Y(98), 8 * k), 1.2, LN);
    var bl = ''; for (var j = 0; j < 5; j++) { var a = j * 1.2566; bl += 'M' + f(X(410)) + ' ' + f(Y(98)) + 'Q' + f(X(410 + Math.cos(a + 0.6) * 22)) + ' ' + f(Y(98 + Math.sin(a + 0.6) * 22)) + ' ' + f(X(410 + Math.cos(a) * 32)) + ' ' + f(Y(98 + Math.sin(a) * 32)); }
    s += P(bl, 0.8, LN);
    s += R(470, 120, 520, 165, 1.1);
    s += P('M' + X(472) + ' ' + Y(150) + 'H' + X(518), 0.5, FAR);
    // battery
    s += R(40, 90, 120, 150, 1.6);
    s += P(circlePath(X(58), Y(102), 6 * k) + circlePath(X(102), Y(102), 6 * k), 1, LN);
    s += T(X(54), Y(140), 10 * k + 3, '+', LN) + T(X(98), Y(140), 10 * k + 3, '–', LN);
    // airbox and intake duct
    s += R(40, 175, 150, 250, 1.5);
    s += P('M' + X(48) + ' ' + Y(183) + 'H' + X(142) + 'V' + Y(242) + 'H' + X(48) + 'Z', 0.6, FAR);
    s += P('M' + X(150) + ' ' + Y(205) + 'C' + X(190) + ' ' + Y(205) + ' ' + X(190) + ' ' + Y(285) + ' ' + X(230) + ' ' + Y(290) + 'M' + X(150) + ' ' + Y(228) + 'C' + X(175) + ' ' + Y(228) + ' ' + X(175) + ' ' + Y(305) + ' ' + X(230) + ' ' + Y(310), 1.3, LN);
    var rib = ''; for (var r2 = 0; r2 < 6; r2++) rib += 'M' + f(X(160 + r2 * 10)) + ' ' + f(Y(208 + r2 * 13)) + 'l' + f(10 * k) + ' ' + f(14 * k);
    s += P(rib, 0.6, FAR);
    // exhaust heat shield (front of engine)
    s += P('M' + X(230) + ' ' + Y(150) + 'H' + X(440) + 'L' + X(430) + ' ' + Y(178) + 'H' + X(240) + 'Z', 1.3, LN);
    var hs = ''; for (var h2 = 250; h2 < 430; h2 += 14) hs += 'M' + f(X(h2)) + ' ' + f(Y(153)) + 'V' + f(Y(175));
    s += P(hs, 0.5, FAR);
    // valve cover
    s += PF('M' + X(225) + ' ' + Y(184) + 'H' + X(450) + 'Q' + X(462) + ' ' + Y(184) + ' ' + X(462) + ' ' + Y(196) + 'V' + Y(244) + 'Q' + X(462) + ' ' + Y(256) + ' ' + X(450) + ' ' + Y(256) + 'H' + X(225) + 'Q' + X(213) + ' ' + Y(256) + ' ' + X(213) + ' ' + Y(244) + 'V' + Y(196) + 'Q' + X(213) + ' ' + Y(184) + ' ' + X(225) + ' ' + Y(184) + 'Z', 2.2, HI, INK);
    s += P('M' + X(225) + ' ' + Y(196) + 'H' + X(450) + 'M' + X(225) + ' ' + Y(244) + 'H' + X(450), 0.6, LN);
    var plugs = '', leads = '';
    for (var p = 0; p < 4; p++) {
      var px = 262 + p * 50;
      plugs += circlePath(X(px), Y(220), 9 * k) + circlePath(X(px), Y(220), 4 * k);
      leads += 'M' + f(X(px)) + ' ' + f(Y(211)) + 'C' + f(X(px)) + ' ' + f(Y(150 - p * 6)) + ' ' + f(X(200)) + ' ' + f(Y(150 - p * 4)) + ' ' + f(X(186)) + ' ' + f(Y(206 + p * 6));
    }
    s += P(plugs, 1.2, HI) + P(leads, 1, LN);
    s += T(X(402), Y(250), 11 * k + 3, '4A-FE', HI, 'middle', 500);
    // distributor at the end of the head
    s += PF(circlePath(X(184), Y(220), 22 * k), 1.8, LN) + P(circlePath(X(184), Y(220), 12 * k), 0.8, LN);
    // intake manifold runners towards firewall
    var run = ''; for (var q = 0; q < 4; q++) { var rx = 262 + q * 50; run += 'M' + f(X(rx - 10)) + ' ' + f(Y(256)) + 'V' + f(Y(300)) + 'M' + f(X(rx + 10)) + ' ' + f(Y(256)) + 'V' + f(Y(300)); }
    s += P(run, 1.1, LN);
    s += R(230, 300, 440, 330, 1.5);
    s += P(circlePath(X(230), Y(300), 16 * k), 1.2, LN);
    // strut towers + strut bar
    s += P(circlePath(X(70), Y(330), 30 * k) + circlePath(X(70), Y(330), 12 * k) + circlePath(X(550), Y(330), 30 * k) + circlePath(X(550), Y(330), 12 * k), 1.6, LN);
    s += PF('M' + X(70) + ' ' + Y(344) + 'L' + X(550) + ' ' + Y(344) + 'L' + X(550) + ' ' + Y(354) + 'L' + X(70) + ' ' + Y(354) + 'Z', 2, HI, INK);
    // brake booster, reservoir
    s += P(circlePath(X(500), Y(240), 40 * k) + circlePath(X(500), Y(240), 30 * k), 1.3, LN);
    s += P('M' + X(478) + ' ' + Y(176) + 'h' + f(44 * k) + 'v' + f(24 * k) + 'h' + f(-44 * k) + 'z', 1.1, LN);
    // firewall
    s += P('M' + X(20) + ' ' + Y(380) + 'Q' + X(310) + ' ' + Y(368) + ' ' + X(600) + ' ' + Y(380), 1.6, LN);
    // callouts
    function call(px, py, tx, ty, txt) { return P('M' + f(X(px)) + ' ' + f(Y(py)) + 'L' + f(X(tx)) + ' ' + f(Y(ty)), 0.7, HI) + P(circlePath(X(px), Y(py), 3), 1, HI) + T(X(tx) + 8, Y(ty) + 5, 15, txt, HI, 'start'); }
    s += call(530, 349, 640, 360, 'Front strut bar, my addition');
    s += call(528, 56, 640, 56, 'New radiator and fan');
    s += call(412, 220, 640, 190, 'Iridium spark plugs');
    s += call(184, 238, 640, 250, 'New distributor');
    s += call(440, 315, 640, 305, 'New head gasket and timing chain');
    return s;
  }

  // ---------- zones ----------
  var Z = {};
  // Garage: 0 to 1700
  (function () {
    var vx = 850, pr = proj(vx), s = '';
    s += room(vx, 0, 1700, { tiles: true });
    // sectional door on back wall
    var dl = pr(220, 430, D), dr = pr(820, 430, D);
    s += P(poly(pr, [[220, 430, D], [820, 430, D], [820, FY, D], [220, FY, D]], true), 1.1, LN);
    for (var i = 1; i < 5; i++) { var yy = 430 + i * 54; s += P(seg(pr, [220, yy, D], [820, yy, D]), 0.6, LN); }
    for (var w = 0; w < 6; w++) { var xx = 250 + w * 95; s += P(poly(pr, [[xx, 446, D], [xx + 70, 446, D], [xx + 70, 474, D], [xx, 474, D]], true), 0.6, LN); }
    s += P(seg(pr, [220, 422, D], [220, 422, 200]) + seg(pr, [820, 422, D], [820, 422, 200]), 0.6, FAR);
    // ceiling lights
    [400, 900, 1350].forEach(function (x) { s += P(poly(pr, [[x - 70, CY + 8, 220], [x + 70, CY + 8, 220], [x + 70, CY + 16, 220], [x - 70, CY + 16, 220]], true), 0.9, LN); s += P(seg(pr, [x - 50, CY, 220], [x - 50, CY + 8, 220]) + seg(pr, [x + 50, CY, 220], [x + 50, CY + 8, 220]), 0.6, FAR); });
    // tyre stack and tool chest on the left
    for (var t = 0; t < 4; t++) { var tp = pr(110, FY - t * 26, 380); var sc = F / (F + 380); s += P(ellipsePath(tp[0], tp[1] - 13 * sc, 46 * sc, 13 * sc), 1, LN) + P(ellipsePath(tp[0], tp[1] - 13 * sc, 26 * sc, 7 * sc), 0.6, FAR); }
    s += box(pr, vx, 900, 1040, 560, FY, 420, 500, 1.2);
    for (var dr2 = 0; dr2 < 4; dr2++) { s += P(seg(pr, [905, 580 + dr2 * 30, 420], [1035, 580 + dr2 * 30, 420]), 0.6, LN); s += P(seg(pr, [950, 594 + dr2 * 30, 420], [990, 594 + dr2 * 30, 420]), 1, LN); }
    // oil stain and drain
    var dp = pr(560, FY, 160); s += P(ellipsePath(dp[0], dp[1], 40, 6), 0.5, FAR);
    // workshop corner: pegboard, bench, printer, tools
    var pb = [[1180, 440, D], [1640, 440, D], [1640, 590, D], [1180, 590, D]];
    s += P(poly(pr, pb, true), 1.2, LN);
    var holes = ''; for (var hx = 1200; hx < 1630; hx += 22) for (var hy = 452; hy < 585; hy += 22) { var hp = pr(hx, hy, D); holes += 'M' + f(hp[0]) + ' ' + f(hp[1]) + 'h0.8'; }
    s += P(holes, 1.2, FAR);
    function onWall(d0, x0, y0) { var o = pr(x0, y0, D), sc = F / (F + D); return '<g transform="translate(' + f(o[0]) + ',' + f(o[1]) + ') scale(' + f(sc) + ')">' + d0 + '</g>'; }
    s += onWall(P('M0 0v70M-14 0h28v14h-28z', 2, LN), 1230, 470);
    s += onWall(P('M0 0l30 80M-6 -2l12 -4l4 10l-12 4z', 1.6, LN), 1290, 465);
    s += onWall(P('M0 0v80M-8 0a8 8 0 1 1 16 0M0 80l-6 6M0 80l6 6', 1.6, LN), 1360, 465);
    s += onWall(P('M0 0h70l10 30h-90zM-10 30h90M10 30v40', 1.6, LN), 1430, 470);
    s += onWall(P('M0 0v60M14 0v70M28 0v50M42 0v64M-4 -6h50', 1.6, LN), 1530, 470);
    s += onWall(P(circlePath(0, 0, 18) + 'M0 18v50', 1.6, LN), 1610, 480);
    s += box(pr, vx, 1170, 1650, 600, 616, 300, 470, 1.4);
    s += P(seg(pr, [1190, 616, 300], [1190, FY, 300]) + seg(pr, [1630, 616, 300], [1630, FY, 300]) + seg(pr, [1190, 660, 300], [1630, 660, 300]), 1.4, LN);
    // 3D printer on bench
    s += box(pr, vx, 1500, 1610, 500, 600, 340, 440, 1.2);
    s += P(poly(pr, [[1512, 512, 340], [1598, 512, 340], [1598, 590, 340], [1512, 590, 340]], true), 0.6, LN);
    // solar dryer prototype on bench
    s += box(pr, vx, 1200, 1300, 560, 600, 340, 420, 1.1);
    s += P(seg(pr, [1200, 560, 340], [1300, 540, 340]) + seg(pr, [1300, 540, 340], [1300, 560, 340]), 1, LN);
    // roller door at right wall (animated separately)
    Z.garage = s;
    Z.car = carBody();
  })();

  // Yard with pitch: 1700 to 3020
  (function () {
    var vx = 2360, pr = proj(vx), s = '';
    s += P('M1700 ' + EYE + 'H3020', 0.8, FAR);
    var tr = ''; for (var x = 1730; x < 3000; x += 90) { var hh = 40 + (x * 7 % 30); tr += 'M' + (x + 30) + ' ' + EYE + 'v-' + (hh * 0.4) + 'M' + x + ' ' + (EYE - hh * 0.4) + 'c-8 -6 -6 -' + (hh * 0.5) + ' 10 -' + (hh * 0.55) + 'c4 -' + (hh * 0.4) + ' 36 -' + (hh * 0.4) + ' 40 0c16 4 18 ' + (hh * 0.5) + ' 10 ' + (hh * 0.55) + 'z'; }
    s += P(tr, 0.7, FAR);
    s += P('M1700 520h1320', 0.4, FAR);
    s += P('M2700 470q60 -40 120 0', 0.5, FAR);
    // pitch in perspective
    var x0 = 1800, x1 = 2900, z0 = 40, z1 = 560;
    s += P(poly(pr, [[x0, FY, z0], [x1, FY, z0], [x1, FY, z1], [x0, FY, z1]], true), 1.4, LN);
    s += P(seg(pr, [2350, FY, z0], [2350, FY, z1]), 0.9, LN);
    var cc = ''; for (var a = 0; a <= 32; a++) { var ang = a / 32 * Math.PI * 2; var q = pr(2350 + Math.cos(ang) * 120, FY, 300 + Math.sin(ang) * 110); cc += (a ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]); }
    s += P(cc, 0.9, LN);
    s += P(poly(pr, [[x1, FY, 160], [x1 - 160, FY, 160], [x1 - 160, FY, 440], [x1, FY, 440]]), 0.9, LN);
    for (var st = 1; st < 8; st++) { var zz = z0 + (z1 - z0) * st / 8; s += P(seg(pr, [x0, FY, zz], [x1, FY, zz]), 0.3, FAR); }
    // goal at right end
    var gz0 = 220, gz1 = 380, gy = FY - 170, gx = 2890;
    s += P(poly(pr, [[gx, FY, gz0], [gx, gy, gz0], [gx, gy, gz1], [gx, FY, gz1]]), 3, HI);
    s += P(seg(pr, [gx, gy, gz0], [gx + 70, FY, gz0 + 10]) + seg(pr, [gx, gy, gz1], [gx + 70, FY, gz1 - 10]), 1, LN);
    var net = ''; for (var nz = gz0 + 16; nz < gz1; nz += 16) { var p1 = pr(gx, gy, nz), p2 = pr(gx + 70, FY, nz); net += 'M' + f(p1[0]) + ' ' + f(p1[1]) + 'L' + f(p2[0]) + ' ' + f(p2[1]); }
    for (var ny = gy + 17; ny < FY; ny += 17) { var t = (ny - gy) / (FY - gy); var p3 = pr(gx + 70 * t, ny, gz0), p4 = pr(gx + 70 * t, ny, gz1); net += 'M' + f(p3[0]) + ' ' + f(p3[1]) + 'L' + f(p4[0]) + ' ' + f(p4[1]); }
    s += P(net, 0.4, FAR);
    // VP desk with laptop and clipboard
    s += box(pr, vx, 2000, 2200, 610, 620, 120, 210, 1.4);
    s += P(seg(pr, [2010, 620, 120], [2010, FY, 120]) + seg(pr, [2190, 620, 120], [2190, FY, 120]), 1.4, LN);
    var lp = pr(2060, 610, 150), sc = F / (F + 150);
    s += '<g transform="translate(' + f(lp[0]) + ',' + f(lp[1]) + ') scale(' + f(sc) + ')">' + P('M0 0h70l-6 -48h-58zM6 -6h58', 1.4, LN) + P('M100 0l6 -40h40l4 40z', 1.2, LN) + P('M112 -30h26M112 -22h20M112 -14h24', 0.6, LN) + '</g>';
    // pennant
    var fl = pr(1960, FY, 160);
    s += '<g transform="translate(' + f(fl[0]) + ',' + f(fl[1]) + ') scale(' + f(F / (F + 160)) + ')">' + P('M0 0v-150M0 -150l60 18l-60 18', 1.4, LN) + T(10, -126, 13, 'FC', LN) + '</g>';
    // golf green in the distance
    for (var fx2 = 1800; fx2 <= 2900; fx2 += 40) s += P(seg(pr, [fx2, FY, 620], [fx2, FY - 60, 620]), 0.5, FAR);
    s += P(seg(pr, [1800, FY - 50, 620], [2900, FY - 50, 620]) + seg(pr, [1800, FY - 30, 620], [2900, FY - 30, 620]), 0.5, FAR);
    var g = pr(3500, FY, 1800), gs = F / (F + 1800);
    s += P(ellipsePath(g[0], g[1], 260 * gs, 40 * gs), 0.7, FAR);
    s += '<g transform="translate(' + f(g[0]) + ',' + f(g[1]) + ') scale(' + f(gs) + ')">' + P('M0 0v-160M0 -160l50 16l-50 16', 2, LN) + '</g>';
    s += T(g[0], g[1] + 20, 11, 'golf', FAR, 'middle');
    Z.yard = s;
  })();

  // Office with perfume wall: 3020 to 4120
  (function () {
    var vx = 3570, pr = proj(vx), s = '';
    s += room(vx, 3020, 4120, { boards: 12 });
    // window on left back
    s += P(poly(pr, [[3060, 440, D], [3220, 440, D], [3220, 560, D], [3060, 560, D]], true) + seg(pr, [3140, 440, D], [3140, 560, D]), 1, LN);
    // perfume wall shelves
    var shelves = [470, 530, 590];
    shelves.forEach(function (y) { s += P(seg(pr, [3260, y, D], [4080, y, D]) + seg(pr, [3260, y, D], [3260, y, D - 40]) , 1.2, LN); s += P(seg(pr, [3260, y, D - 40], [4080, y, D - 40]), 0.8, LN); });
    var bot = ''; var shapes = [
      function (x, y) { return 'M' + x + ' ' + y + 'v-22h14v22zM' + (x + 4) + ' ' + (y - 22) + 'v-6h6v6zM' + (x + 2) + ' ' + (y - 28) + 'h10v-6h-10z'; },
      function (x, y) { return 'M' + (x - 2) + ' ' + y + 'q0 -24 9 -24q9 0 9 24zM' + (x + 4) + ' ' + (y - 24) + 'v-8h6v8z'; },
      function (x, y) { return 'M' + x + ' ' + y + 'l2 -26h12l2 26zM' + (x + 4) + ' ' + (y - 26) + 'v-10h8v10z'; },
      function (x, y) { return 'M' + x + ' ' + y + 'v-16h18v16zM' + (x + 5) + ' ' + (y - 16) + 'v-12h8v12z'; }];
    var sc = F / (F + D - 20);
    shelves.forEach(function (y, r) {
      for (var i = 0; i < 26; i++) {
        var p = pr(3280 + i * 31, y, D - 20);
        bot += '<g transform="translate(' + f(p[0]) + ',' + f(p[1]) + ') scale(' + f(sc) + ')">' + P(shapes[(i + r) % 4](0, 0), 1, LN) + '</g>';
      }
    });
    s += bot;
    s += T(pr(3670, 418, D)[0], pr(3670, 418, D)[1], 12, 'Armaf, and five more brands', HI, 'middle');
    // wholesale cartons
    [[3880, 640, 4000, FY, 150, 260], [3900, 580, 3990, 640, 160, 250], [4010, 620, 4100, FY, 140, 240]].forEach(function (b) {
      s += box(pr, vx, b[0], b[2], b[1], b[3], b[4], b[5], 1.2);
      s += P(seg(pr, [(b[0] + b[2]) / 2, b[1], b[4]], [(b[0] + b[2]) / 2, b[3], b[4]]), 0.6, LN);
    });
    // desk, monitor, label printer, parcel
    s += box(pr, vx, 3260, 3560, 610, 624, 140, 250, 1.5);
    s += P(seg(pr, [3270, 624, 140], [3270, FY, 140]) + seg(pr, [3550, 624, 140], [3550, FY, 140]), 1.5, LN);
    var mp = pr(3330, 610, 210), ms = F / (F + 210);
    s += '<g transform="translate(' + f(mp[0]) + ',' + f(mp[1]) + ') scale(' + f(ms) + ')">' +
      PF('M-6 -110h150v86h-150z', 1.6, LN) + P('M66 -24v20M44 -4h44', 1.6, LN) +
      P('M6 -96h36M6 -86h28M6 -76h32', 0.8, LN) + P('M60 -40v-20M74 -40v-34M88 -40v-28M102 -40v-46M116 -40v-38', 2, LN) + P('M56 -40h68', 0.6, LN) +
      PF('M170 -4h50v-34h-50z', 1.4, LN) + P('M178 -38v-6h34v6M182 -4l4 10h18l4 -10', 1, LN) +
      PF('M236 -4h60v-30h-60z', 1.3, LN) + P('M236 -34l14 -10h60l-14 10M296 -4l14 -10v-30', 1, LN) + '</g>';
    s += T(mp[0] + 10, mp[1] - 120 * ms, 10, 'Shopee · Lazada · Shopify', FAR);
    // chair
    var cp = pr(3420, FY, 100), cs = F / (F + 100);
    s += '<g transform="translate(' + f(cp[0]) + ',' + f(cp[1]) + ') scale(' + f(cs) + ')">' + P('M-30 -60h60M0 -60v40M-24 0l24 -20l24 20M-30 -60l-4 -60h68l-4 60', 1.4, LN) + '</g>';
    Z.office = s;
  })();

  // Hallway with police photos: 4120 to 4920
  (function () {
    var vx = 4520, pr = proj(vx), s = '';
    s += room(vx, 4120, 4920, { boards: 8 });
    var frames = [[4190, 'Squad drill'], [4380, 'Fitness training'], [4570, 'ORD speech'], [4740, 'Passing out']];
    frames.forEach(function (fr, i) {
      var x = fr[0], y0 = 450, y1 = 560, w = 140;
      s += PF(poly(pr, [[x, y0, D], [x + w, y0, D], [x + w, y1, D], [x, y1, D]], true), 1.6, LN);
      s += P(poly(pr, [[x + 8, y0 + 8, D], [x + w - 8, y0 + 8, D], [x + w - 8, y1 - 8, D], [x + 8, y1 - 8, D]], true), 0.6, LN);
      var o = pr(x + 8, y1 - 10, D), sc = F / (F + D), inner = '';
      if (i === 0) { for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) inner += 'M' + (12 + c * 20 + r * 4) + ' ' + (-14 - r * 22) + 'v-14m0 0a3 3 0 1 0 0.1 0'; }
      if (i === 1) { inner = 'M20 -10l10 -20l-6 -16M30 -30l12 6M24 -46a4 4 0 1 0 0.1 0M60 -10l10 -20l-6 -16M70 -30l12 6M64 -46a4 4 0 1 0 0.1 0M0 -8h124'; }
      if (i === 2) { inner = 'M50 -8h30v-34h-30zM65 -42v-12M58 -60a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M80 -48l14 -10'; }
      if (i === 3) { for (var c2 = 0; c2 < 7; c2++) inner += 'M' + (10 + c2 * 16) + ' -10v-24m0 0a4 4 0 1 0 0.1 0'; inner += 'M0 -60h124'; }
      s += '<g transform="translate(' + f(o[0]) + ',' + f(o[1]) + ') scale(' + f(sc) + ')">' + P(inner, 1.2, LN) + '</g>';
      var lp = pr(x + w / 2, y1 + 18, D); s += T(lp[0], lp[1], 10, fr[1], FAR, 'middle');
    });
    [4300, 4700].forEach(function (x) { var p = pr(x, CY + 6, 260); s += P(ellipsePath(p[0], p[1], 22, 6), 1, LN); });
    // front door at the right wall
    s += P('M4890 ' + (FY - 230) + 'h26v230', 1.2, LN);
    Z.hall = s;
  })();

  // Ekosys site: 4920 to 6320
  (function () {
    var vx = 5620, pr = proj(vx), s = '';
    s += P('M4920 ' + EYE + 'H6320', 0.8, FAR);
    // building frame under construction, far
    var bz = 600, bx0 = 5250, bx1 = 6050;
    for (var lv = 0; lv <= 5; lv++) { var yy = FY - lv * 70; s += P(seg(pr, [bx0, yy, bz], [bx1, yy, bz]), lv ? 1.3 : 1, LN); }
    for (var cx = bx0; cx <= bx1; cx += 120) s += P(seg(pr, [cx, FY, bz], [cx, FY - 350, bz]), 1.3, LN);
    var reb = ''; for (var rx = bx0; rx <= bx1; rx += 30) { var a = pr(rx, FY - 350, bz), b = pr(rx, FY - 380, bz); reb += 'M' + f(a[0]) + ' ' + f(a[1]) + 'L' + f(b[0]) + ' ' + f(b[1]); }
    s += P(reb, 0.5, LN);
    // scaffolding
    var sc0 = 560;
    for (var sx = bx0 - 20; sx <= bx1 + 20; sx += 60) s += P(seg(pr, [sx, FY, sc0], [sx, FY - 330, sc0]), 0.6, FAR);
    for (var sy = 0; sy <= 330; sy += 55) s += P(seg(pr, [bx0 - 20, FY - sy, sc0], [bx1 + 20, FY - sy, sc0]), 0.6, FAR);
    for (var dx = bx0 - 20; dx < bx1; dx += 120) s += P(seg(pr, [dx, FY, sc0], [dx + 120, FY - 165, sc0]), 0.4, FAR);
    // tower crane
    var cz = 760, cxx = 6150;
    var m0 = pr(cxx, FY, cz), m1 = pr(cxx, FY - 640, cz), j0 = pr(cxx - 700, FY - 640, cz), j1 = pr(cxx + 220, FY - 640, cz), ap = pr(cxx, FY - 720, cz);
    s += P('M' + f(m0[0] - 8) + ' ' + f(m0[1]) + 'L' + f(m1[0] - 8) + ' ' + f(m1[1]) + 'M' + f(m0[0] + 8) + ' ' + f(m0[1]) + 'L' + f(m1[0] + 8) + ' ' + f(m1[1]), 1.2, LN);
    var lat = ''; for (var k = 0; k < 20; k++) { var ya = m0[1] + (m1[1] - m0[1]) * k / 20, yb = m0[1] + (m1[1] - m0[1]) * (k + 1) / 20; lat += 'M' + f(m0[0] - 8) + ' ' + f(ya) + 'L' + f(m0[0] + 8) + ' ' + f(yb); }
    s += P(lat, 0.5, LN);
    s += P('M' + f(j0[0]) + ' ' + f(j0[1]) + 'L' + f(j1[0]) + ' ' + f(j1[1]) + 'M' + f(j0[0]) + ' ' + f(j0[1] + 10) + 'L' + f(j1[0]) + ' ' + f(j1[1] + 10) + 'M' + f(j0[0]) + ' ' + f(j0[1]) + 'L' + f(ap[0]) + ' ' + f(ap[1]) + 'L' + f(j1[0]) + ' ' + f(j1[1]), 1, LN);
    s += PF('M' + f(j1[0] - 30) + ' ' + f(j1[1] + 10) + 'h30v30h-30z', 1, LN);
    Z.craneHook = [m1[0] - 300, m1[1] + 10];
    // hoarding
    for (var hx = 4960; hx < 6320; hx += 100) s += P(poly(pr, [[hx, FY, 400], [hx + 96, FY, 400], [hx + 96, FY - 120, 400], [hx, FY - 120, 400]], true), 0.9, LN);
    var hp = pr(5200, FY - 70, 400); s += T(hp[0], hp[1], 13, 'Safety first. PPE required.', LN);
    // site office containers
    s += box(pr, vx, 4980, 5200, 600, FY, 200, 300, 1.4) + box(pr, vx, 4990, 5190, 510, 600, 210, 290, 1.2);
    s += P(poly(pr, [[5010, 530, 210], [5070, 530, 210], [5070, 570, 210], [5010, 570, 210]], true), 0.8, LN);
    var so = pr(5080, 640, 200); s += T(so[0], so[1], 12, 'Site office', LN, 'middle');
    // mixer truck
    var mt = pr(5900, FY, 220), ms = F / (F + 220);
    s += '<g transform="translate(' + f(mt[0]) + ',' + f(mt[1]) + ') scale(' + f(ms) + ')">' +
      PF('M0 -24h220v-20h-220zM180 -44v-50h40l20 30v40h-20', 1.6, LN) + P('M190 -88h24l12 20h-36z', 1, LN) +
      PF('M20 -50l140 -10l-10 -70l-120 10z', 1.6, LN) + P('M40 -54l-10 -64M70 -56l-10 -66M100 -58l-10 -68M130 -60l-10 -68', 0.7, LN) +
      PF(circlePath(40, -12, 16), 1.6, LN) + PF(circlePath(90, -12, 16), 1.6, LN) + PF(circlePath(200, -12, 16), 1.6, LN) + '</g>';
    // ground
    s += P('M4920 ' + FY + 'H6320', 2, LN);
    var gr = ''; for (var gx = 4940; gx < 6320; gx += 40) gr += 'M' + gx + ' ' + (FY + 8) + 'l14 0';
    s += P(gr, 0.6, FAR);
    Z.site = s;
  })();

  // Travel: 6320 to 6720
  (function () {
    var s = '';
    s += P('M6320 ' + EYE + 'H6720', 0.6, FAR);
    s += '<path d="M6340 640C6440 420 6600 380 6700 300" stroke="' + LN + '" stroke-width="1" fill="none" stroke-dasharray="6 8"/>';
    s += P('M6330 ' + FY + 'H6720', 2, LN);
    Z.travel = s;
    Z.plane = P('M-40 0h70l18 -6l4 6l-4 6l-18 -6M0 0l-20 -30h12l28 30M0 0l-20 30h12l28 -30M-40 0l-10 -14h8l10 14', 1.6, HI);
  })();

  // dsm-firmenich room: 6720 to 7840
  (function () {
    var vx = 7280, pr = proj(vx), s = '';
    s += room(vx, 6720, 7840, { tiles: true });
    // big window with Shanghai skyline
    var w0 = 6880, w1 = 7700, wy0 = 420, wy1 = 600;
    s += P(poly(pr, [[w0, wy0, D], [w1, wy0, D], [w1, wy1, D], [w0, wy1, D]], true), 1.4, LN);
    s += P(seg(pr, [(w0 + w1) / 2, wy0, D], [(w0 + w1) / 2, wy1, D]), 0.8, LN);
    var o = pr(w0, wy1, D), sc = F / (F + D);
    var sk = 'M0 0V-40h40v-30h30v40h30v-60h24v80h30v-50h40v50';
    sk += 'M200 0V-90M196 -90a8 8 0 1 0 8 0M190 -60a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M200 -20a20 20 0 1 0 0.1 0M190 0l6 -40M210 0l-6 -40M200 -98v-30';
    sk += 'M300 0V-120l10 -10l10 10V0M300 -100h20M300 -80h20M300 -60h20M300 -40h20M310 -130v-20';
    sk += 'M380 0C380 -80 392 -140 400 -170C408 -140 420 -80 420 0M386 -100h28M392 -140h16';
    sk += 'M460 0V-150h36V0M466 -144h24v10h-24zM496 -110h30V0M560 0v-60h40v60M620 0v-90h28v90M680 0v-40h60v40';
    s += '<g transform="translate(' + f(o[0]) + ',' + f(o[1]) + ') scale(' + f(sc) + ')">' + P(sk, 1.1, LN) + P('M0 6h800', 0.6, FAR) + '</g>';
    var lb = pr(w0 + 10, wy0 - 14, D); s += T(lb[0], lb[1], 11, 'Shanghai', FAR);
    // evaluation bench with blotters and candles (left)
    s += box(pr, vx, 6780, 7050, 600, 614, 140, 240, 1.4);
    s += P(seg(pr, [6790, 614, 140], [6790, FY, 140]) + seg(pr, [7040, 614, 140], [7040, FY, 140]), 1.4, LN);
    var bp = pr(6820, 600, 180), bs = F / (F + 180);
    var bl = 'M0 0h40v-14h-40z'; for (var i = 0; i < 6; i++) bl += 'M' + (4 + i * 6) + ' -14l' + (i - 2.5) * 3 + ' -60';
    bl += 'M80 0h24v-30h-24zM120 0h24v-30h-24zM160 0h24v-30h-24zM92 -30v-10M132 -30v-10M172 -30v-10';
    s += '<g transform="translate(' + f(bp[0]) + ',' + f(bp[1]) + ') scale(' + f(bs) + ')">' + P(bl, 1.3, LN) + P('M92 -40q-6 -8 0 -16q6 8 0 16M132 -40q-6 -8 0 -16q6 8 0 16M172 -40q-6 -8 0 -16q6 8 0 16', 1, HI) + '</g>';
    // meeting table with two clients (middle)
    s += box(pr, vx, 7150, 7450, 610, 622, 200, 330, 1.4);
    s += P(seg(pr, [7300, 622, 260], [7300, FY, 260]), 1.4, LN);
    var c1 = pr(7200, FY, 380), c2 = pr(7400, FY, 380);
    s += person(c1[0], c1[1], F / (F + 380) * 0.95, false) + person(c2[0], c2[1], F / (F + 380), true);
    var tp = pr(7260, 610, 260); s += P('M' + f(tp[0]) + ' ' + f(tp[1]) + 'h30l-4 -6h-22z', 1, LN);
    // blending station (right)
    s += box(pr, vx, 7520, 7800, 600, 614, 140, 240, 1.4);
    s += P(seg(pr, [7530, 614, 140], [7530, FY, 140]) + seg(pr, [7790, 614, 140], [7790, FY, 140]), 1.4, LN);
    var ep = pr(7550, 600, 180), es = F / (F + 180);
    var eq = 'M0 0l6 -30v-20h14v20l6 30zM50 0v-44h20v44zM50 -20h20M90 0h60v-10h-60zM96 -10v-6h48v6M170 0v-70M166 -70h8M170 -40h30M200 -40v-8';
    s += '<g transform="translate(' + f(ep[0]) + ',' + f(ep[1]) + ') scale(' + f(es) + ')">' + P(eq, 1.3, LN) + T(120, -20, 10, '0.00 g', LN, 'middle') + '</g>';
    Z.dsm = s;
  })();

  // Ceiling map, above the dsm room
  (function () {
    var M = window.MAP, x0 = 6640, y0 = -330, w = 1280, k = w / M.w, h = M.h * k, s = '';
    s += PF('M' + (x0 - 20) + ' ' + (y0 - 60) + 'h' + (w + 40) + 'v' + (h + 100) + 'h' + (-(w + 40)) + 'Z', 2.4, LN, SOFT);
    s += T(x0, y0 - 24, 18, 'Where I have worked', HI, 'start', 500);
    s += '<g transform="translate(' + x0 + ',' + y0 + ') scale(' + f(k) + ')">' + P(M.d, 1.2 / k, LN) + '</g>';
    var gr = ''; for (var i = 1; i < 8; i++) gr += 'M' + f(x0 + w * i / 8) + ' ' + y0 + 'V' + f(y0 + h); for (var j = 1; j < 5; j++) gr += 'M' + x0 + ' ' + f(y0 + h * j / 5) + 'H' + (x0 + w);
    s += P(gr, 0.4, FAR);
    Z.map = s;
    Z.mapGeo = { x0: x0, y0: y0, k: k, c: M.c };
    // beams down to the room
    Z.mapBeams = P('M' + (x0 - 20) + ' ' + f(y0 + h + 40) + 'L6720 ' + CY + 'M' + (x0 + w + 20) + ' ' + f(y0 + h + 40) + 'L7840 ' + CY, 1, FAR);
  })();

  // End: 7840 to 8600
  (function () {
    var s = '';
    s += P('M7860 ' + EYE + 'H8600', 0.6, FAR);
    s += PF('M8300 ' + FY + 'V440h150V' + FY, 2.4, LN, SOFT);
    s += P('M8316 ' + FY + 'V456h118V' + FY, 0.8, LN);
    var rays = ''; for (var i = 0; i < 7; i++) rays += 'M' + (8320 + i * 18) + ' ' + FY + 'L' + (8240 + i * 40) + ' ' + (FY + 60);
    s += P(rays, 0.4, FAR);
    s += P('M7840 ' + FY + 'H8600', 2, LN);
    Z.end = s;
  })();

  // ---------- assemble ----------
  var zones = [
    ['garage', 0, 1700, Z.garage], ['yard', 1700, 3020, Z.yard], ['office', 3020, 4120, Z.office], ['hall', 4120, 4920, Z.hall],
    ['site', 4920, 6320, Z.site], ['travel', 6320, 6720, Z.travel], ['dsm', 6720, 7840, Z.dsm], ['end', 7840, 8600, Z.end]];
  var html = '';
  zones.forEach(function (z) { html += '<g class="zone" data-x0="' + z[1] + '" data-x1="' + z[2] + '">' + z[3] + '</g>'; });
  var ac = proj(850)(520, FY, 230), acs = F / (F + 230);
  html += '<g class="zone" data-x0="0" data-x1="1700"><g transform="translate(' + f(ac[0] - 215 * acs) + ',' + f(ac[1]) + ') scale(' + f(acs) + ')">' +
    '<g id="eng-side" opacity="0">' + engineSide() + '</g>' + Z.car + '<g id="bonnet">' + PF(bonnetPath(), 2.2, LN) + '</g></g></g>';
  var bpt = [ac[0] + (380 - 215) * acs, ac[1] - 80 * acs];
  html += '<g id="engline" opacity="0"><path d="M' + f(bpt[0]) + ' ' + f(bpt[1]) + 'L520 410M' + f(bpt[0]) + ' ' + f(bpt[1]) + 'L800 410" stroke="' + HI + '" stroke-width="1" stroke-dasharray="6 6" fill="none"/></g>';
  html += '<g id="roller"></g>';
  html += '<g id="mapz" class="zone fixed">' + Z.map + Z.mapBeams + '<g id="pins"></g></g>';
  html += '<g id="hook"></g><g id="plane"></g><g id="fx"></g><g id="me"></g>';
  html += '<g id="engbay" class="zone fixed" opacity="0">' + engineBay(150, -60, 960, 470) + '</g>';
  html += '<g id="holo" class="zone fixed" opacity="0"></g>';
  svg.innerHTML = html;

  var zoneEls = [].slice.call(svg.querySelectorAll('.zone:not(.fixed)'));
  var reveal = zoneEls.map(function () { return 0; });
  var mapEl = document.getElementById('mapz'), engEl = document.getElementById('engbay'), holoEl = document.getElementById('holo');
  var meEl = document.getElementById('me'), fxEl = document.getElementById('fx'), rollerEl = document.getElementById('roller');
  var bonnetEl = document.getElementById('bonnet'), engSide = document.getElementById('eng-side'), pinsEl = document.getElementById('pins');
  var engLine = document.getElementById('engline'), hookEl = document.getElementById('hook'), planeEl = document.getElementById('plane');

  // ---------- character rig ----------
  function capsule(ax, ay, bx, by, w) {
    var dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2, r = w / 2;
    return 'M' + f(ax + nx) + ' ' + f(ay + ny) + 'L' + f(bx + nx) + ' ' + f(by + ny) + 'A' + r + ' ' + r + ' 0 0 0 ' + f(bx - nx) + ' ' + f(by - ny) + 'L' + f(ax - nx) + ' ' + f(ay - ny) + 'A' + r + ' ' + r + ' 0 0 0 ' + f(ax + nx) + ' ' + f(ay + ny) + 'Z';
  }
  function rad(a) { return a * Math.PI / 180; }
  function limb(sx, sy, a1, l1, a2, l2) {
    var ex = sx + Math.sin(rad(a1)) * l1, ey = sy + Math.cos(rad(a1)) * l1;
    var hx = ex + Math.sin(rad(a1 + a2)) * l2, hy = ey + Math.cos(rad(a1 + a2)) * l2;
    return [ex, ey, hx, hy];
  }
  function drawMe(o) {
    // o: x,y,dir,scale,pose{sN,eN,sF,eF,hN,kN,hF,kF,head,lean},ppe
    var p = o.pose, s = '', st = 'stroke="' + HI + '" fill="' + INK + '" stroke-linejoin="round"';
    function pa(d, w) { return '<path d="' + d + '" ' + st + ' stroke-width="' + (w || 1.8) + '"/>'; }
    var hipY = -88, shY = -142;
    // far leg
    var fl = limb(-2, hipY, p.hF, 44, p.kF, 44);
    s += pa(capsule(-2, hipY, fl[0], fl[1], 15) + capsule(fl[0], fl[1], fl[2], fl[3], 13), 1.4);
    s += pa('M' + f(fl[2] - 6) + ' ' + f(fl[3] - 2) + 'h24q4 0 4 6h-28z', 1.4);
    // far arm
    var fa = limb(0, shY + 4, p.sF, 30, p.eF, 28);
    s += pa(capsule(0, shY + 4, fa[0], fa[1], 10) + capsule(fa[0], fa[1], fa[2], fa[3], 8), 1.4);
    // torso (polo)
    var lean = p.lean || 0;
    s += '<g transform="rotate(' + lean + ' 0 ' + hipY + ')">';
    s += pa('M-13 ' + (shY + 2) + 'Q-15 -118 -12 ' + (hipY + 2) + 'H13Q16 -118 13 ' + (shY + 2) + 'Q0 ' + (shY - 6) + ' -13 ' + (shY + 2) + 'Z', 2);
    s += '<path d="M-4 ' + (shY - 2) + 'l6 10l6 -10M2 ' + (shY + 8) + 'v14M-12 ' + (hipY + 4) + 'H13" stroke="' + HI + '" stroke-width="1.2" fill="none"/>';
    s += '<path d="M1 ' + (shY + 13) + 'h2M1 ' + (shY + 19) + 'h2" stroke="' + HI + '" stroke-width="2" fill="none"/>';
    if (o.ppe) {
      s += '<path d="M-13 ' + (shY + 4) + 'L4 ' + (hipY - 6) + 'M13 ' + (shY + 4) + 'L4 ' + (hipY - 6) + 'M-12 -112H13M-12 -104H13" stroke="' + LN + '" stroke-width="3" fill="none"/>';
    }
    // head
    var hx = 2, hy = shY - 20;
    s += '<g transform="rotate(' + (p.head || 0) + ' 0 ' + (shY - 6) + ')">';
    s += pa('M-3 ' + (shY - 8) + 'v8h8v-8', 1.6);
    s += pa('M' + (hx - 11) + ' ' + hy + 'a11 12 0 1 1 22 0q0 6 -3 9l3 4l-4 1q-2 5 -9 4q-9 -1 -9 -18z', 1.8);
    s += '<path d="M' + (hx - 12) + ' ' + (hy - 2) + 'q2 -14 14 -13q10 1 10 9q-8 -4 -14 0q-6 3 -10 4z" fill="' + HI + '" stroke="' + HI + '" stroke-width="1"/>';
    s += '<path d="M' + (hx + 7) + ' ' + (hy + 1) + 'h0.5" stroke="' + HI + '" stroke-width="2.4" stroke-linecap="round"/>';
    if (o.ppe) s += '<path d="M' + (hx - 14) + ' ' + (hy - 4) + 'q0 -18 15 -18q15 0 15 18zM' + (hx - 16) + ' ' + (hy - 4) + 'h34" stroke="' + LN + '" stroke-width="2" fill="' + INK + '"/>';
    s += '</g></g>';
    // near leg
    var nl = limb(2, hipY, p.hN, 44, p.kN, 44);
    s += pa(capsule(2, hipY, nl[0], nl[1], 16) + capsule(nl[0], nl[1], nl[2], nl[3], 14), 1.8);
    s += '<path d="M' + f(2 + (nl[0] - 2) * 0.1) + ' ' + f(hipY + 6) + 'L' + f(nl[0]) + ' ' + f(nl[1]) + '" stroke="' + HI + '" stroke-width="0.6"/>';
    s += pa('M' + f(nl[2] - 6) + ' ' + f(nl[3] - 2) + 'h24q5 0 5 7h-29z', 1.8);
    // near arm with sleeve
    var na = limb(0, shY + 4, p.sN, 30, p.eN, 28);
    s += pa(capsule(0, shY + 4, na[0], na[1], 10) + capsule(na[0], na[1], na[2], na[3], 8), 1.8);
    var sl = limb(0, shY + 4, p.sN, 18, 0, 0);
    s += pa(capsule(0, shY + 4, sl[0], sl[1], 15), 1.8);
    s += pa(circlePath(na[2], na[3], 4.5), 1.4);
    meEl.setAttribute('transform', 'translate(' + f(o.x) + ',' + f(o.y) + ') scale(' + f(o.dir * o.scale) + ',' + f(o.scale) + ')');
    meEl.innerHTML = s;
    return { hand: [o.x + o.dir * o.scale * na[2], o.y + o.scale * na[3]], foot: [o.x + o.dir * o.scale * nl[2], o.y + o.scale * nl[3]], head: [o.x + o.dir * o.scale * 2, o.y + o.scale * (shY - 20)] };
  }
  var STAND = { sN: 4, eN: -8, sF: -4, eF: -8, hN: 2, kN: 0, hF: -2, kF: 0, head: 0, lean: 0 };
  function walkPose(ph) {
    var s = Math.sin(ph), c = Math.cos(ph);
    return { sN: -22 * s, eN: -14 - 8 * Math.max(0, -s), sF: 22 * s, eF: -14 - 8 * Math.max(0, s), hN: 26 * s, kN: -Math.max(0, 40 * c) - 4, hF: -26 * s, kF: -Math.max(0, -40 * c) - 4, head: 0, lean: 3 };
  }
  function mix(a, b, t) { var o = {}; for (var k in a) o[k] = a[k] + ((b[k] === undefined ? a[k] : b[k]) - a[k]) * t; return o; }
  function sm(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function rng(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }

  // ---------- timeline ----------
  // each stop: char x, z (depth on floor), camera x,y,w, dwell, action
  var depth = function (vx, z) { return proj(vx); };
  function floorAt(vx, x, z) { var p = proj(vx)(x, FY, z); return { x: p[0], y: p[1], s: F / (F + z) }; }
  var stops = [
    { id: 'start', x: 760, vx: 850, z: 60, cam: [850, 380, 1700], dwell: 0.8 },
    { id: 'garage', x: 820, vx: 850, z: 60, cam: [660, 'auto', 1000], dwell: 1 },
    { id: 'bonnet', x: 905, vx: 850, z: 60, cam: [640, 300, 760], dwell: 2.2 },
    { id: 'workshop', x: 1300, vx: 850, z: 60, cam: [1380, 'auto', 900], dwell: 1.6 },
    { id: 'door', x: 1640, vx: 850, z: 60, cam: [1720, 'auto', 1000], dwell: 0.7 },
    { id: 'pitch', x: 2100, vx: 2360, z: 60, cam: [2240, 'auto', 1100], dwell: 1.2 },
    { id: 'kick', x: 2540, vx: 2360, z: 60, cam: [2620, 'auto', 1000], dwell: 1.2 },
    { id: 'office', x: 3460, vx: 3570, z: 60, cam: [3520, 'auto', 1000], dwell: 1.8 },
    { id: 'hall', x: 4520, vx: 4520, z: 60, cam: [4520, 'auto', 900], dwell: 1.4 },
    { id: 'site', x: 5060, vx: 5620, z: 60, cam: [5480, 400, 1400], dwell: 1.6 },
    { id: 'travel', x: 6420, vx: 6520, z: 40, cam: [6520, 520, 900], dwell: 0.5 },
    { id: 'dsm', x: 6900, vx: 7280, z: 60, cam: [7280, 'auto', 1200], dwell: 2.4 },
    { id: 'ceiling', x: 7300, vx: 7280, z: 60, cam: [7280, 10, 1500], dwell: 1.8 },
    { id: 'bye', x: 8200, vx: 8200, z: 40, cam: [8240, 'auto', 900], dwell: 1.6 }];
  var segs = [], total = 0;
  stops.forEach(function (st, i) {
    if (i > 0) { var prev = stops[i - 1], len = Math.max(0.5, Math.abs(st.x - prev.x) / 650); if (st.id === 'ceiling') len = 0.9; if (st.id === 'travel' || st.id === 'dsm') len = Math.max(len, 0.8); segs.push({ type: 'walk', a: prev, b: st, start: total, len: len }); total += len; }
    segs.push({ type: 'dwell', st: st, start: total, len: st.dwell }); total += st.dwell;
  });
  walk.style.height = (total * 85 + 100) + 'vh';

  // ---------- cards ----------
  var CARDS = {
    garage: ['My Toyota Corolla AE111', 'A 4A-FE, manual, past 314,000 km. I maintain and modify it myself.', 'ae111.html'],
    bonnet: ['Under the bonnet', 'Timing chain, water pump, head gasket and radiator done. Strut bar and sport springs added.', 'ae111.html'],
    workshop: ['Workshop', 'Where my SUTD builds happen. This is the holographic email notifier, using a Pepper’s Ghost display.', 'holographic.html'],
    pitch: ['Vice president, SUTD Football Club', 'Fixtures, venue bookings, risk assessments, and new goalposts beyond our seed funding.', '#experience'],
    office: ['Fragrance Castle', 'Developed with my family since 2019. E-commerce and sales on Shopee, Lazada and Shopify, retail and wholesale of Armaf and five more brands.', 'fragrance-castle.html'],
    hall: ['Singapore Police Force', 'Two years as a field instructor. Trained 160+ officers, 79 of them on my own through a nine-month course.', '#experience'],
    site: ['Ekosys', 'Project management and design engineering intern. Wrote ISO 9001 manuals and cut defect logging from 1 min to 20 s.', '#experience'],
    dsm: ['dsm-firmenich, Shanghai and Guangzhou', 'Fragrance evaluations, candle testing, client visits and market research with the marketing team.', '#experience'],
    ceiling: ['Where I have worked', 'Singapore, Shanghai, Guangzhou and Dubai, and building a network across Asia, the Middle East and Europe.', 'contact.html'],
    bye: ['Thanks for walking through', 'Next up: business development intern at Shopee SPX Express, from January 2027.', '#about']
  };
  var cardEls = {};
  Object.keys(CARDS).forEach(function (k) {
    var c = CARDS[k], el = document.createElement('div');
    el.className = 'wcard';
    var more = k === 'bye' ? 'Keep scrolling' : 'Read more';
    el.innerHTML = '<p class="wc-t">' + c[0] + '</p><p class="wc-b">' + c[1] + '</p><a href="' + c[2] + '">' + more + '</a>';
    cardsEl.appendChild(el); cardEls[k] = el;
  });

  // ---------- frame ----------
  var W = 0, H = 0, mobile = false;
  function resize() { var r = stage.getBoundingClientRect(); W = r.width; H = r.height; mobile = W < 760; svg.setAttribute('width', W); svg.setAttribute('height', H); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var view = { x: 0, y: 0, w: 1, h: 1 };
  function setCam(cx, cy, w) {
    if (mobile) w = Math.max(w * 0.42, 360);
    var h = w * H / W;
    if (cy === 'auto') cy = FY + 16 - 0.3 * h;
    view = { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    svg.setAttribute('viewBox', f(view.x) + ' ' + f(view.y) + ' ' + f(w) + ' ' + f(h));
  }
  function camY(c) { if (c[1] !== 'auto') return c[1]; var w = mobile ? Math.max(c[2] * 0.42, 360) : c[2]; return FY + 16 - (mobile ? 0.36 : 0.3) * w * H / W; }
  function toScreen(x, y) { return [(x - view.x) / view.w * W, (y - view.y) / view.h * H]; }

  function frame(u) {
    var seg = segs[segs.length - 1], i;
    for (i = 0; i < segs.length; i++) if (u < segs[i].start + segs[i].len) { seg = segs[i]; break; }
    var t = Math.max(0, Math.min(1, (u - seg.start) / seg.len));
    var st, x, cam, pose = STAND, dir = 1, vx, z;
    if (seg.type === 'walk') {
      var a = seg.a, b = seg.b, e = sm(t);
      x = lerp(a.x, b.x, t); z = lerp(a.z, b.z, t); vx = t < 0.5 ? a.vx : b.vx;
      var cw = lerp(a.cam[2], b.cam[2], e), ay = camY(a.cam), by = camY(b.cam);
      cam = [lerp(a.cam[0], b.cam[0], e), lerp(ay, by, e), cw];
      dir = b.x >= a.x ? 1 : -1;
      var moving = Math.abs(b.x - a.x) > 5;
      pose = moving ? walkPose(x / 30) : STAND;
      if (moving) pose = mix(STAND, pose, Math.min(1, t * 6, (1 - t) * 6));
      if (b.id === 'ceiling') pose = mix(STAND, { head: -28 }, sm(t));
      if (a.id === 'ceiling') pose = mix(mix(STAND, { head: -28 }, 1 - sm(t * 3)), pose, sm(t * 3));
      st = { id: '_walk', from: a.id, to: b.id };
    } else {
      st = seg.st; x = st.x; z = st.z; vx = st.vx; cam = [st.cam[0], camY(st.cam), st.cam[2]];
    }
    var fp = floorAt(vx, x, z);
    var o = { x: fp.x, y: fp.y, dir: dir, scale: fp.s, pose: pose, ppe: x > 4940 && x < 6330 };
    var id = st.id, fx = '';

    // reset dynamic bits
    var bonnetA = 0, engO = 0, holoO = 0, rollerOpen = rng(x, 1500, 1640), mapR = 0;
    var active = null;

    if (id === 'start') { active = null; }
    if (id === 'garage') { active = 'garage'; o.pose = mix(STAND, { sN: 10, eN: -30 }, sm(t * 2)); }
    if (id === 'bonnet') {
      active = t > 0.25 ? 'bonnet' : 'garage';
      bonnetA = sm(rng(t, 0.02, 0.22)) * 52;
      engO = sm(rng(t, 0.2, 0.36));
      o.pose = mix(STAND, { sN: 165, eN: -10, sF: 150, eF: -10, lean: 4, head: -10 }, sm(rng(t, 0, 0.18)));
      var c0 = st.cam;
      var ce = sm(rng(t, 0.15, 0.4));
      cam = [lerp(660, 630, ce), lerp(null === null ? 540 : 0, 200, ce), lerp(1000, 1060, ce)];
      if (t > 0.9) { var bk = sm(rng(t, 0.9, 1)); cam = [lerp(630, 900, bk), lerp(200, 540, bk), lerp(1060, 1000, bk)]; engO *= 1 - bk; bonnetA *= 1 - bk; }
    }
    if (id === 'workshop') {
      active = t > 0.2 ? 'workshop' : null;
      o.pose = mix(STAND, { sN: 70, eN: -40, head: -6 }, sm(rng(t, 0, 0.2)));
      holoO = sm(rng(t, 0.15, 0.35));
    }
    if (id === 'door') { rollerOpen = sm(t); }
    if (id === 'pitch') { active = 'pitch'; o.pose = mix(STAND, { sN: 40, eN: -60 }, sm(rng(t, 0.1, 0.3))); }
    if (id === 'kick') {
      active = 'pitch';
      var kt = rng(t, 0.1, 0.45);
      o.pose = mix(STAND, { hN: kt < 0.5 ? -30 * sm(kt * 2) : lerp(-30, 70, sm((kt - 0.5) * 2)), kN: kt < 0.5 ? -60 * sm(kt * 2) : -60 + 60 * sm((kt - 0.5) * 2), sF: 30, sN: -30, lean: -4 }, sm(rng(t, 0, 0.1)) * (1 - sm(rng(t, 0.75, 0.95))));
    }
    if (id === 'office') {
      active = t > 0.15 ? 'office' : null;
      var sp = rng(t, 0.1, 0.5), sn = rng(t, 0.5, 0.8);
      var spray = { sN: 110, eN: -40, head: -4 }, sniff = { sN: 140, eN: -120, head: 8, lean: 4 };
      o.pose = mix(mix(STAND, spray, sm(sp * 2)), sniff, sm(sn));
      o.dir = -1;
    }
    if (id === 'hall') { active = 'hall'; o.pose = mix(STAND, { head: -12, sN: 10 }, sm(rng(t, 0, 0.3))); o.dir = 1; }
    if (id === 'site') { active = t > 0.15 ? 'site' : null; o.pose = mix(STAND, { head: -14, sN: 20, eN: -100, sF: -10 }, sm(rng(t, 0.1, 0.3))); }
    if (id === 'dsm') {
      active = 'dsm';
      var ph = Math.min(2, Math.floor(t * 3)), lt = t * 3 - ph;
      var spots = [6880, 7300, 7640];
      var fp2 = floorAt(vx, spots[ph], 60);
      o.x = fp2.x; o.y = fp2.y; o.scale = fp2.s;
      var poses = [{ sN: 150, eN: -130, head: 6 }, { sN: 40, eN: -70, sF: 30, eF: -60 }, { sN: 80, eN: -60, head: -8, sF: 70, eF: -30 }];
      o.pose = mix(STAND, poses[ph], sm(rng(lt, 0, 0.25)) * (1 - sm(rng(lt, 0.85, 1))));
      o.dir = ph === 1 ? -1 : 1;
      var trail = '';
      if (lt < 0.2) { for (var tr = 1; tr < 4; tr++) trail += 'M' + f(o.x - tr * 22 - 10) + ' ' + f(o.y - 120 + tr * 18) + 'h-' + (40 - tr * 8); }
      fx += '<path d="' + trail + '" stroke="' + HI + '" stroke-width="1.4" fill="none"/>';
      var lbls = ['Smelling', 'Client meeting', 'Blending'];
      fx += T(o.x, o.y - 210 * o.scale, 14, lbls[ph], HI, 'middle', 500);
    }
    if (id === 'ceiling') {
      active = t > 0.35 ? 'ceiling' : null;
      o.pose = mix(STAND, { head: -28 }, 1);
      mapR = sm(rng(t, 0, 0.5));
    }
    if (st.id === '_walk' && st.to === 'ceiling') { mapR = sm(t); }
    if (st.id === '_walk' && st.from === 'ceiling') { mapR = 1 - sm(t * 2); }
    if (id === 'bye') {
      active = t > 0.15 ? 'bye' : null;
      var wv = sm(rng(t, 0, 0.15));
      o.pose = mix(STAND, { sN: 160 + Math.sin(t * 40) * 14, eN: -20 + Math.sin(t * 40) * 20 }, wv);
      fx += P(circlePath(o.x + 40, o.y - 210, 4) + circlePath(o.x + 56, o.y - 236, 7), 1.2, HI);
      if (t > 0.1) {
        var bx = mobile ? o.x - 125 : o.x + 70, by = mobile ? o.y - 420 : o.y - 330;
        fx += PF('M' + bx + ' ' + by + 'h250v80h-250z', 1.6, HI, INK) + T(bx + 14, by + 32, 18, 'Next: Shopee SPX Express', HI, 'start', 500) + T(bx + 14, by + 58, 14, 'Business development, Jan 2027', LN);
      }
    }
    if (st.id === '_walk' && st.from === 'office') o.dir = 1;

    // effects
    if (id === 'office') {
      var spt = rng(t, 0.25, 0.55);
      if (spt > 0 && spt < 1) { var h0 = o.x + o.dir * 40, mist = ''; for (var m = 0; m < 14; m++) { var rr = spt * 60 * ((m % 5) / 5 + 0.4); mist += circlePath(h0 + o.dir * rr * Math.cos(m), o.y - 150 + rr * Math.sin(m * 2.3) * 0.5, 1.4); } fx += '<path d="' + mist + '" fill="' + HI + '" stroke="none" opacity="' + f(1 - spt) + '"/>'; }
    }
    if (id === 'kick' || (st.id === '_walk' && st.from === 'kick')) {
      var bt = id === 'kick' ? sm(rng(t, 0.4, 0.8)) : 1;
      var start = floorAt(2360, 2580, 60), goal = floorAt(2360, 2880, 300);
      var bxp = lerp(start.x, goal.x, bt), byp = lerp(start.y - 12, goal.y - 60, bt) - Math.sin(bt * Math.PI) * 120;
      fx += PF(circlePath(bxp, byp, 12 * lerp(1, goal.s / start.s, bt)), 1.6, HI);
      if (bt > 0.98 && id === 'kick') fx += T(goal.x, goal.y - 200, 20, 'Goal', HI, 'middle', 500);
    } else if (x < 2580 && x > 1700) {
      var bs = floorAt(2360, 2580, 60); fx += PF(circlePath(bs.x, bs.y - 12, 12), 1.6, HI);
    }

    if (mobile && id !== 'bonnet' && id !== 'ceiling' && !(st.id === '_walk' && (st.to === 'ceiling' || st.from === 'ceiling'))) cam[0] = cam[0] * 0.3 + o.x * 0.7;
    if (mobile && id === 'bonnet' && engO > 0.5) { cam[0] = 470; cam[2] = Math.max(cam[2], 1500); }
    drawMe(o);
    fxEl.innerHTML = fx;
    fxEl.style.setProperty('--r', 1);
    setCam(cam[0], cam[1], cam[2]);

    // bonnet and engine bay
    bonnetEl.setAttribute('transform', 'rotate(' + f(-bonnetA) + ' 333 -92)');
    engSide.setAttribute('opacity', f(Math.min(1, bonnetA / 30)));
    engEl.setAttribute('opacity', f(engO));
    engLine.setAttribute('opacity', f(engO));
    engEl.style.setProperty('--r', f(engO));
    // holo
    if (holoO > 0) {
      var hp = proj(850)(1340, 600, 330), hs = F / (F + 330) * 1.7;
      holoEl.innerHTML = '<g transform="translate(' + f(hp[0]) + ',' + f(hp[1]) + ') scale(' + f(hs) + ')">' +
        P('M-40 0h80l-20 -50h-40zM-20 -50l20 -14l20 14M-40 0l40 -14l40 14M0 -14v-50', 1.4, HI) +
        PF('M-50 -64h100v6h-100z', 1.4, LN) + '<g opacity="' + f(0.5 + 0.5 * Math.sin(u * 30)) + '">' + P('M-12 -34h24v14h-24zM-12 -34l12 8l12 -8', 1.2, HI) + '</g>' +
        '<path d="M0 -70v-60" stroke="' + HI + '" stroke-width="0.8" stroke-dasharray="4 4"/>' + '</g>';
    }
    holoEl.setAttribute('opacity', f(holoO));
    holoEl.style.setProperty('--r', f(holoO));
    // roller door on garage right wall (section view)
    var rTop = CY, rBot = FY, openH = (rBot - rTop - 30) * rollerOpen, rd = '';
    for (var yy = rTop + 30 + openH; yy < rBot; yy += 22) rd += 'M1700 ' + f(yy) + 'h14';
    rollerEl.innerHTML = P('M1700 ' + f(rTop + 30 + openH) + 'V' + rBot + 'M1714 ' + f(rTop + 30 + openH) + 'V' + rBot, 2, LN) + P(rd, 1, LN) + PF(circlePath(1707, rTop + 18, 14), 2, LN);
    rollerEl.style.setProperty('--r', 1);
    // crane hook sway
    var hk = Z.craneHook, sw = Math.sin(u * 3) * 40;
    hookEl.innerHTML = P('M' + f(hk[0] + sw) + ' ' + f(hk[1]) + 'v' + f(140 + Math.sin(u * 2) * 40) + 'm-6 0h12l-6 12z', 1, LN);
    hookEl.style.setProperty('--r', 1);
    // plane during travel
    if ((st.id === '_walk' && st.to === 'travel') || id === 'travel' || (st.id === '_walk' && st.to === 'dsm')) {
      var pt = id === 'travel' ? 0.5 : (st.to === 'travel' ? t * 0.5 : 0.5 + t * 0.5);
      var px = lerp(6340, 6700, pt), py = 640 - Math.sin(pt * Math.PI / 2) * 340;
      planeEl.innerHTML = '<g transform="translate(' + f(px) + ',' + f(py) + ') rotate(-24) scale(1.4)">' + Z.plane + '</g>';
      planeEl.style.setProperty('--r', 1);
    } else planeEl.innerHTML = '';
    // map
    mapEl.style.setProperty('--r', f(mapR));
    mapEl.setAttribute('opacity', f(Math.min(1, mapR * 4)));
    if (mapR > 0.4) {
      var g = Z.mapGeo, pins = '', sg = g.c.Singapore, home = [g.x0 + sg[0] * g.k, g.y0 + sg[1] * g.k];
      var labels = { Singapore: 'Singapore, home base', Shanghai: 'Shanghai', Guangzhou: 'Guangzhou', Dubai: 'Dubai, Beautyworld' };
      var pr2 = sm(rng(mapR, 0.4, 1));
      Object.keys(g.c).forEach(function (k, idx) {
        var c = [g.x0 + g.c[k][0] * g.k, g.y0 + g.c[k][1] * g.k];
        if (k !== 'Singapore') { var mx = (home[0] + c[0]) / 2, my = Math.min(home[1], c[1]) - 120; pins += '<path d="M' + f(home[0]) + ' ' + f(home[1]) + 'Q' + f(mx) + ' ' + f(my) + ' ' + f(c[0]) + ' ' + f(c[1]) + '" stroke="' + HI + '" stroke-width="1.4" fill="none" stroke-dasharray="6 6" opacity="' + f(pr2) + '"/>'; }
        pins += '<circle cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" r="' + f(8 * pr2) + '" fill="' + HI + '"/>';
        var dxl = k === 'Guangzhou' ? -14 : 14, anc = k === 'Guangzhou' ? 'end' : 'start';
        pins += '<text class="t" x="' + f(c[0] + dxl) + '" y="' + f(c[1] + 5) + '" font-size="17" fill="' + HI + '" text-anchor="' + anc + '" opacity="' + f(pr2) + '">' + labels[k] + '</text>';
      });
      pinsEl.innerHTML = pins;
    } else pinsEl.innerHTML = '';

    // reveal drawings near the camera
    var cxm = view.x + view.w / 2;
    zoneEls.forEach(function (el, i2) {
      var x0 = +el.dataset.x0, x1 = +el.dataset.x1;
      var dist = cxm < x0 ? x0 - cxm : cxm > x1 ? cxm - x1 : 0;
      var r = 1 - Math.max(0, Math.min(1, (dist - view.w * 0.2) / (view.w * 0.5)));
      if (r > reveal[i2]) reveal[i2] = r;
      el.style.setProperty('--r', f(sm(reveal[i2])));
    });

    // cards
    Object.keys(cardEls).forEach(function (k) {
      var el = cardEls[k], on = active === k;
      el.classList.toggle('on', on);
      if (on) {
        var anchor;
        if (mobile) { el.style.left = '50%'; el.style.top = 'auto'; el.style.bottom = '20px'; return; }
        anchor = toScreen(o.x, o.y - 260 * o.scale);
        if (k === 'bonnet') anchor = [W * 0.86, H + 40];
        if (k === 'ceiling') anchor = [W * 0.5, H * 0.82];
        if (k === 'bye') anchor = toScreen(o.x - 240, o.y - 120);
        if (k === 'workshop') anchor = toScreen(proj(850)(1340, 600, 330)[0], 470);
        var lx = Math.max(20, Math.min(W - 360, anchor[0] - 170)), ly = Math.max(80, Math.min(H - 200, anchor[1] - 150));
        el.style.left = lx + 'px'; el.style.top = ly + 'px'; el.style.bottom = 'auto';
      }
    });
    if (heroEl) heroEl.style.opacity = f(1 - sm(u / 0.5));
    if (barEl) barEl.style.transform = 'scaleX(' + f(u / total) + ')';
  }

  var ticking = false, lastU = -1;
  function progress() {
    var r = walk.getBoundingClientRect(), span = r.height - window.innerHeight;
    return Math.max(0, Math.min(1, -r.top / span)) * total;
  }
  function tick() { ticking = false; var u = progress(); if (Math.abs(u - lastU) > 0.0005) { lastU = u; frame(u); } }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  window.addEventListener('resize', function () { resize(); lastU = -1; tick(); });
  resize();
  frame(progress());
  window.__walk = { total: total, segs: segs, frame: frame };
})();
