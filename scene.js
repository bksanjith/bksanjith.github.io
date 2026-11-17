(function () {
  'use strict';
  var svg = document.getElementById('world');
  if (!svg) return;
  var stage = document.getElementById('stage'), walk = document.getElementById('walk');
  var cardsEl = document.getElementById('cards'), heroEl = document.getElementById('walk-hero'), barEl = document.getElementById('walk-bar');
  var TR = window.TR || {};

  var LN = '#CDBFA8', HI = '#E6E2DA', FAR = '#8a7f6e', INK = '#23211D', SOFT = '#2C2924';
  var FY = 700, CY = 380, EYE = 560, F = 700, D = 520;

  // ---------- helpers ----------
  function f(n) { return Math.round(n * 10) / 10; }
  function P(d, w, c, x) { return '<path class="d" pathLength="1" d="' + d + '" stroke="' + (c || LN) + '" stroke-width="' + (w || 1.4) + '" fill="none"' + (x || '') + '/>'; }
  function PF(d, w, c, fill) { return '<path class="d" pathLength="1" d="' + d + '" stroke="' + (c || LN) + '" stroke-width="' + (w || 1.4) + '" fill="' + (fill || INK) + '"/>'; }
  function T(x, y, s, txt, c, anchor, weight) { return '<text class="t" x="' + f(x) + '" y="' + f(y) + '" font-size="' + s + '" fill="' + (c || LN) + '" text-anchor="' + (anchor || 'start') + '"' + (weight ? ' font-weight="' + weight + '"' : '') + '>' + txt + '</text>'; }
  function proj(vx) { return function (x, y, z) { var s = F / (F + z); return [vx + (x - vx) * s, EYE + (y - EYE) * s]; }; }
  function seg(pr, a, b) { var p = pr(a[0], a[1], a[2]), q = pr(b[0], b[1], b[2]); return 'M' + f(p[0]) + ' ' + f(p[1]) + 'L' + f(q[0]) + ' ' + f(q[1]); }
  function poly(pr, pts, close) { return pts.map(function (p, i) { var q = pr(p[0], p[1], p[2]); return (i ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]); }).join('') + (close ? 'Z' : ''); }
  function box(pr, vx, x0, x1, y0, y1, z0, z1, w, c) {
    var k = {};
    [[x0, 'a'], [x1, 'b']].forEach(function (X) { [[y0, 't'], [y1, 'u']].forEach(function (Y) { [[z0, 'f'], [z1, 'k']].forEach(function (Z) { k[X[1] + Y[1] + Z[1]] = [X[0], Y[0], Z[0]]; }); }); });
    var out = '', faces = [];
    if (EYE < y0) faces.push(['atf', 'btf', 'btk', 'atk']);
    if (EYE > y1) faces.push(['auf', 'buf', 'buk', 'auk']);
    if (vx < x0) faces.push(['atf', 'auf', 'auk', 'atk']);
    if (vx > x1) faces.push(['btf', 'buf', 'buk', 'btk']);
    faces.forEach(function (fc) { out += PF(poly(pr, fc.map(function (q) { return k[q]; }), true), (w || 1.4) * 0.6, c || LN); });
    return out + PF(poly(pr, [k.atf, k.btf, k.buf, k.auf], true), w || 1.4, c || LN);
  }
  function cp(cx, cy, r) { return 'M' + f(cx - r) + ' ' + f(cy) + 'a' + r + ' ' + r + ' 0 1 0 ' + f(2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + f(-2 * r) + ' 0'; }
  function ep(cx, cy, rx, ry) { return 'M' + f(cx - rx) + ' ' + f(cy) + 'a' + rx + ' ' + ry + ' 0 1 0 ' + f(2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + f(-2 * rx) + ' 0'; }
  function room(vx, x0, x1, opt) {
    opt = opt || {};
    var dd = opt.depth || D, pr = function (x, y, z) { var s = F / (F + z); return [vx + (x - vx) * s, EYE + (y - EYE) * s]; }, s = '', i;
    s += P(poly(pr, [[x0, CY, dd], [x1, CY, dd], [x1, FY, dd], [x0, FY, dd]], true), 1.1);
    s += P(seg(pr, [x0, CY, 0], [x0, CY, dd]) + seg(pr, [x1, CY, 0], [x1, CY, dd]) + seg(pr, [x0, FY, 0], [x0, FY, dd]) + seg(pr, [x1, FY, 0], [x1, FY, dd]), 1.1);
    for (i = 1; i < (opt.boards || 0); i++) { var xx = x0 + (x1 - x0) * i / opt.boards; s += P(seg(pr, [xx, FY, 0], [xx, FY, dd]), 0.5, FAR); }
    if (opt.tiles) for (i = 1; i < 5; i++) { var z = dd * Math.pow(i / 5, 1.3); s += P(seg(pr, [x0, FY, z], [x1, FY, z]), 0.5, FAR); }
    var lb = opt.doorL ? FY - 250 : FY, rb = opt.doorR ? FY - 250 : FY;
    s += PF('M' + (x0 - 14) + ' ' + (CY - 14) + 'H' + (x1 + 14) + 'V' + CY + 'H' + (x0 - 14) + 'Z', 2.6, LN, SOFT);
    s += PF('M' + (x0 - 14) + ' ' + CY + 'H' + x0 + 'V' + lb + 'H' + (x0 - 14) + 'Z', 2.6, LN, SOFT);
    s += PF('M' + x1 + ' ' + CY + 'H' + (x1 + 14) + 'V' + rb + 'H' + x1 + 'Z', 2.6, LN, SOFT);
    s += PF('M' + (x0 - 14) + ' ' + FY + 'H' + (x1 + 14) + 'V' + (FY + 16) + 'H' + (x0 - 14) + 'Z', 2.6, LN, SOFT);
    return s;
  }
  // traced photo placed at x,y (top left), width w
  function TRC(key, x, y, w, sw, col, cls) {
    var t = TR[key]; if (!t) return '';
    var k = w / t.w;
    return '<g class="' + (cls || 'tr') + '" transform="translate(' + f(x) + ',' + f(y) + ') scale(' + (Math.round(k * 10000) / 10000) + ')"><path d="' + t.d + '" stroke="' + (col || LN) + '" stroke-width="' + f((sw || 1) / k) + '" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>';
  }
  function trH(key, w) { var t = TR[key]; return t ? t.h * w / t.w : 0; }

  // ---------- AE111 side view ----------
  function wheel(cx) {
    var sp = '';
    for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5; sp += 'M' + f(cx + Math.cos(a) * 6) + ' ' + f(-29 + Math.sin(a) * 6) + 'L' + f(cx + Math.cos(a + 0.12) * 20) + ' ' + f(-29 + Math.sin(a + 0.12) * 20); }
    return PF(cp(cx, -29, 29), 2.2) + P(cp(cx, -29, 21) + cp(cx, -29, 18), 1.1) + P(sp, 0.9) + PF(cp(cx, -29, 5), 1);
  }
  function carBody() {
    var s = PF('M420 -20L386 -20A37 37 0 0 0 309 -20L137 -20A37 37 0 0 0 63 -20L10 -20L3 -46L9 -76L106 -86L166 -131L262 -134L333 -92L418 -72L430 -58L430 -30Z', 2.4);
    s += P('M118 -88L167 -126L257 -129L321 -93Z', 1.3) + P('M209 -129L213 -89M150 -112L152 -88', 1.6);
    s += P('M106 -86L333 -92M14 -58C120 -60 300 -62 426 -60', 0.8) + P('M213 -89L216 -24M321 -92L318 -40M128 -86L138 -44', 1);
    s += P('M286 -80h18M186 -80h18', 1.8) + P('M318 -96l12 -2l2 8l-12 1z', 1.3) + P('M4 -70h22v12h-22z', 1.2) + P('M404 -72l24 4v10l-24 -3z', 1.2);
    s += P('M396 -32h34M12 -32h40', 1) + wheel(100) + wheel(346);
    return s;
  }

  // ---------- world ----------
  var Z = {};
  // Office: 0..1200
  (function () {
    var vx = 600, pr = proj(vx), s = '';
    s += room(vx, 0, 1200, { boards: 12, doorR: true });
    s += P(poly(pr, [[50, 440, D], [210, 440, D], [210, 560, D], [50, 560, D]], true) + seg(pr, [130, 440, D], [130, 560, D]), 1);
    var sg = pr(1000, 425, D); s += T(sg[0], sg[1], 22, 'Fragrance Castle Singapore', HI, 'middle', 500);
    var shelves = [480, 540, 600], sc = F / (F + D - 20);
    shelves.forEach(function (y) { s += P(seg(pr, [420, y, D], [1170, y, D]), 1.2) + P(seg(pr, [420, y, D - 40], [1170, y, D - 40]) + seg(pr, [420, y, D], [420, y, D - 40]), 0.8); });
    var shapes = [
      function () { return 'M0 0v-22h14v22zM4 -22v-6h6v6zM2 -28h10v-6h-10z'; },
      function () { return 'M-2 0q0 -24 9 -24q9 0 9 24zM4 -24v-8h6v8z'; },
      function () { return 'M0 0l2 -26h12l2 26zM4 -26v-10h8v10z'; },
      function () { return 'M0 0v-16h18v16zM5 -16v-12h8v12z'; }];
    shelves.forEach(function (y, r) { for (var i = 0; i < 24; i++) { var p = pr(440 + i * 30, y, D - 20); s += '<g transform="translate(' + f(p[0]) + ',' + f(p[1]) + ') scale(' + f(sc) + ')">' + P(shapes[(i + r) % 4](), 1) + '</g>'; } });
    // desk with marketplace screen
    s += box(pr, vx, 70, 380, 610, 624, 160, 270, 1.5) + P(seg(pr, [80, 624, 160], [80, FY, 160]) + seg(pr, [370, 624, 160], [370, FY, 160]), 1.5);
    var mp = pr(150, 610, 220), ms = F / (F + 220);
    s += '<g transform="translate(' + f(mp[0]) + ',' + f(mp[1]) + ') scale(' + f(ms) + ')">' + PF('M-6 -110h150v86h-150z', 1.6) + P('M66 -24v20M44 -4h44', 1.6) + P('M6 -96h36M6 -86h28M6 -76h32', 0.8) + P('M60 -40v-20M74 -40v-34M88 -40v-28M102 -40v-46M116 -40v-38', 2) + PF('M170 -4h50v-34h-50z', 1.4) + P('M178 -38v-6h34v6M182 -4l4 10h18l4 -10', 1) + '</g>';
    s += T(mp[0] + 4, mp[1] - 118 * ms, 13, 'Shopee, Lazada, Shopify', LN);
    // display counter
    s += box(pr, vx, 690, 1010, 600, FY, 100, 190, 1.5);
    var cb = ''; [770, 820, 870, 930, 980].forEach(function (x, i) { var p = pr(x, 600, 140); cb += '<g transform="translate(' + f(p[0]) + ',' + f(p[1]) + ') scale(' + f(F / (F + 140)) + ')">' + P(shapes[i % 4](), 1.3) + '</g>'; });
    s += cb;
    // wholesale cartons
    s += box(pr, vx, 1040, 1160, 620, FY, 170, 270, 1.2) + box(pr, vx, 1055, 1150, 560, 620, 180, 260, 1.1);
    Z.office = s;
    Z.pickBottle = pr(725, 600, 140);
  })();

  // Hall: 1200..2200 (shallow, gallery)
  (function () {
    var vx = 1700, dd = 220, pr = function (x, y, z) { var s = F / (F + z); return [vx + (x - vx) * s, EYE + (y - EYE) * s]; }, s = '';
    s += room(vx, 1200, 2200, { boards: 8, depth: dd, doorL: true, doorR: true });
    var frames = [['tour-fitness.jpg', 1338, 230, 700 / 525, 'Fitness training'], ['tour-drill.jpg', 1740, 230, 700 / 341, 'Drill'], ['tour-ord.jpg', 2040, 140, 504 / 700, 'ORD speech']];
    frames.forEach(function (fr) {
      var p = pr(fr[1], 470, dd), w = fr[2], h = w / fr[3], x = p[0] - w / 2, y = 455 + (fr[0] === 'tour-drill.jpg' ? 25 : 0);
      s += PF('M' + f(x - 9) + ' ' + f(y - 9) + 'h' + f(w + 18) + 'v' + f(h + 18) + 'h' + f(-(w + 18)) + 'Z', 2, LN);
      s += '<image class="tr" href="' + fr[0] + '" x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" preserveAspectRatio="xMidYMid slice"/>';
      s += T(x + w / 2, y - 16, 12, fr[4], LN, 'middle');
    });
    [1400, 2000].forEach(function (x) { var p = pr(x, CY + 6, 110); s += P(ep(p[0], p[1], 22, 6), 1); });
    Z.hall = s;
  })();

  // hand-drawn Ekosys site, based on the photo
  function siteDrawing() {
    var s = '', i, t;
    function L(a, b, q) { return a + (b - a) * q; }
    // background tower block
    s += P('M3080 700V330H3170V700', 0.9, FAR);
    var bw = ''; for (i = 350; i < 690; i += 22) bw += 'M3088 ' + i + 'H3162'; for (i = 3100; i < 3170; i += 18) bw += 'M' + i + ' 340V690';
    s += P(bw, 0.4, FAR);
    // trees and palm on the right
    var tr = ''; [[3340, 520, 46], [3410, 490, 58], [3490, 505, 52], [3560, 480, 60]].forEach(function (c) { tr += 'M' + (c[0] - c[2]) + ' ' + c[1] + 'c0 -' + c[2] + ' ' + c[2] * 0.6 + ' -' + c[2] * 1.1 + ' ' + c[2] + ' -' + c[2] * 0.9 + 'c' + c[2] * 0.7 + ' -' + c[2] * 0.2 + ' ' + c[2] * 1.1 + ' ' + c[2] * 0.4 + ' ' + c[2] + ' ' + c[2] * 0.9 + 'c' + c[2] * 0.3 + ' ' + c[2] * 0.5 + ' -' + c[2] * 0.3 + ' ' + c[2] * 0.9 + ' -' + c[2] * 0.9 + ' ' + c[2] * 0.8 + 'z'; });
    tr += 'M3300 600q6 -70 -4 -120M3296 480q-40 -10 -60 10M3296 480q-20 -30 -50 -30M3296 480q20 -30 54 -24M3296 480q40 -4 56 20M3296 480q4 -34 -6 -46';
    s += P(tr, 0.8, FAR);
    // tower crane
    var cx = 3215, cr = 'M' + (cx - 9) + ' 700V230M' + (cx + 9) + ' 700V230';
    for (i = 230; i < 640; i += 20) cr += 'M' + (cx - 9) + ' ' + i + 'L' + (cx + 9) + ' ' + (i + 20) + 'M' + (cx - 9) + ' ' + i + 'H' + (cx + 9);
    s += P(cr, 1, LN);
    s += P('M' + (cx - 13) + ' 230h26v-26h-26zM' + cx + ' 204v-40M' + (cx - 60) + ' 200H' + (cx + 70) + 'M' + cx + ' 164L' + (cx - 60) + ' 200M' + cx + ' 164L' + (cx + 70) + ' 200', 1.2, LN);
    s += PF('M' + (cx - 46) + ' 700v-56h92v56z', 1.6, LN) + P('M' + (cx - 46) + ' 670h92M' + (cx - 30) + ' 644v26M' + (cx + 30) + ' 644v26', 0.8, LN);
    // building frame
    var C = 2880, Lx = 2420, R = 3060;
    function yl(f) { return L(690, 450, f); } function yc(f) { return L(700, 390, f); } function yr(f) { return L(694, 430, f); }
    var slab = '', slab2 = '', rail = '';
    for (i = 1; i <= 4; i++) {
      var f = i / 4;
      slab += 'M' + Lx + ' ' + yl(f) + 'L' + C + ' ' + yc(f) + 'L' + R + ' ' + yr(f);
      slab2 += 'M' + Lx + ' ' + (yl(f) + 7) + 'L' + C + ' ' + (yc(f) + 9) + 'L' + R + ' ' + (yr(f) + 8);
      if (i < 4) { rail += 'M' + Lx + ' ' + (yl(f) - 22) + 'L' + C + ' ' + (yc(f) - 28) + 'L' + R + ' ' + (yr(f) - 25); for (t = 0.05; t < 1; t += 0.09) rail += 'M' + L(Lx, C, t) + ' ' + L(yl(f), yc(f), t) + 'v' + (-L(22, 28, t)); }
    }
    s += P(slab, 2.2, LN) + P(slab2, 1, LN) + P(rail, 0.6, LN);
    var col = '';
    [0, 0.2, 0.42, 0.68, 1].forEach(function (q) { var x = L(Lx, C, q), w = L(7, 14, q); col += 'M' + (x - w / 2) + ' ' + L(690, 700, q) + 'V' + (L(450, 390, q) + 6) + 'M' + (x + w / 2) + ' ' + L(690, 700, q) + 'V' + (L(450, 390, q) + 6); });
    [0.5, 1].forEach(function (q) { var x = L(C, R, q), w = L(14, 9, q); col += 'M' + (x - w / 2) + ' ' + L(700, 694, q) + 'V' + (L(390, 430, q) + 6) + 'M' + (x + w / 2) + ' ' + L(700, 694, q) + 'V' + (L(390, 430, q) + 6); });
    s += P(col, 1.8, LN);
    // inner columns and soffits seen through the frame
    var inn = ''; [0.3, 0.55, 0.85].forEach(function (q) { var x = L(Lx, C, q) + 40; inn += 'M' + x + ' ' + (L(690, 700, q) - 6) + 'V' + (L(450, 390, q) + 30); });
    s += P(inn, 0.6, FAR);
    // roof formwork, scaffold and rebar
    var top = 'M' + Lx + ' ' + (yl(1) - 14) + 'L' + C + ' ' + (yc(1) - 18) + 'L' + R + ' ' + (yr(1) - 16);
    var sc = '';
    for (t = 0; t <= 1.001; t += 0.05) { var x = L(Lx, C, t), y = L(yl(1), yc(1), t) - 14 - 4 * t; sc += 'M' + x + ' ' + y + 'v-46'; }
    for (t = 0; t <= 1.001; t += 0.25) { var x2 = L(C, R, t), y2 = L(yc(1), yr(1), t) - 18; sc += 'M' + x2 + ' ' + y2 + 'v-46'; }
    sc += 'M' + Lx + ' ' + (yl(1) - 40) + 'L' + C + ' ' + (yc(1) - 50) + 'L' + R + ' ' + (yr(1) - 46) + 'M' + Lx + ' ' + (yl(1) - 60) + 'L' + C + ' ' + (yc(1) - 64) + 'L' + R + ' ' + (yr(1) - 62);
    var reb = ''; for (i = 0; i < 8; i++) reb += 'M' + (C - 20 + i * 6) + ' ' + (yc(1) - 18) + 'v' + (-60 - (i % 3) * 10);
    s += P(top, 1.4, LN) + P(sc, 0.7, LN) + P(reb, 0.8, LN);
    // green netting tower on the left face
    var n0 = 0.48, n1 = 0.62, nt = '', nx0 = L(Lx, C, n0), nx1 = L(Lx, C, n1);
    var ny0 = L(450, 390, n0) - 60, ny1 = L(450, 390, n1) - 62;
    s += PF('M' + nx0 + ' ' + ny0 + 'L' + nx1 + ' ' + ny1 + 'V' + L(690, 700, n1) + 'H' + nx0 + 'Z', 1.4, LN);
    for (i = 0; i < 13; i++) { var yy = ny1 + i * 26; nt += 'M' + nx0 + ' ' + (yy + 2) + 'L' + nx1 + ' ' + (yy - 10); }
    for (t = 0.25; t < 1; t += 0.25) nt += 'M' + L(nx0, nx1, t) + ' ' + L(ny0, ny1, t) + 'V' + L(690, 700, n0 + (n1 - n0) * t);
    s += P(nt, 0.5, LN) + P('M' + (nx0 - 10) + ' 700L' + (nx0 + 30) + ' 600', 1, LN);
    // timber formwork stack
    var tb = '';
    for (i = 0; i < 6; i++) { var yy2 = 700 - i * 11; tb += 'M3010 ' + yy2 + 'H3250l-14 -9H3024Z'; }
    tb += 'M3024 634V700M3236 634V700';
    s += PF('M3010 700V634H3250V700Z', 1.4, LN) + P(tb, 0.8, LN);
    s += P('M2990 700v-46h8v46M2990 668h26', 1, LN);
    // site containers and drums
    var ct = ''; for (i = 3346; i < 3590; i += 12) ct += 'M' + i + ' 602V698';
    s += PF('M3330 700V590H3600V700Z', 1.6, LN) + P(ct, 0.4, LN) + P('M3360 610h60v30h-60z', 1, LN);
    s += P('M3280 700v-26a10 4 0 0 1 20 0v26M3302 700v-22a8 3 0 0 1 16 0v22', 1, LN);
    // ground details
    s += P('M2440 696l70 -2l8 6h-86zM2448 696l4 4M2460 696l4 4M2472 696l4 4M2484 696l4 4M2496 696l4 4', 0.8, LN);
    s += P('M2742 700l8 -26l8 26zM2745 690h10', 1, LN);
    s += P('M2236 700V320L2296 300V700', 1.6, LN) + P('M2250 330v300M2262 326v280', 0.5, FAR);
    s += T(2440, 742, 13, 'Ekosys site, drawn from my photo', FAR);
    return s;
  }

  // Ekosys site: 2200..3600
  (function () {
    var s = '';
    s += P('M2214 ' + FY + 'H3600', 2);
    s += siteDrawing();
    var gr = ''; for (var gx = 2230; gx < 3600; gx += 40) gr += 'M' + gx + ' ' + (FY + 8) + 'h14';
    s += P(gr, 0.6, FAR);
    Z.site = s;
  })();

  // flights
  function route(x0, x1, a, b) {
    var s = '<path d="M' + x0 + ' ' + (FY - 40) + 'Q' + ((x0 + x1) / 2) + ' ' + (FY - 520) + ' ' + x1 + ' ' + (FY - 40) + '" stroke="' + FAR + '" stroke-width="1.2" fill="none" stroke-dasharray="6 8"/>';
    s += PF(cp(x0, FY - 40, 6), 1.4, HI) + PF(cp(x1, FY - 40, 6), 1.4, HI);
    s += T(x0, FY - 10, 16, a, HI, 'middle', 500) + T(x1, FY - 10, 16, b, HI, 'middle', 500);
    return s + P('M' + (x0 - 40) + ' ' + FY + 'H' + (x1 + 40), 1, FAR);
  }
  Z.fly1 = route(3640, 4060, 'Singapore', 'Shanghai');
  Z.fly2 = route(5240, 5660, 'Guangzhou', 'Singapore');
  Z.plane = P('M-40 0h70l18 -6l4 6l-4 6l-18 -6M0 0l-20 -30h12l28 30M0 0l-20 30h12l28 -30M-40 0l-10 -14h8l10 14', 1.6, HI);

  // dsm-firmenich: 4100..5220
  (function () {
    var vx = 4660, pr = proj(vx), s = '';
    s += room(vx, 4100, 5220, { tiles: true, doorL: true, doorR: true });
    var o, sc = F / (F + D);
    // Shanghai window
    s += P(poly(pr, [[4180, 420, D], [4800, 420, D], [4800, 600, D], [4180, 600, D]], true), 1.4);
    o = pr(4180, 600, D);
    var sh = 'M0 0V-40h40v-30h30v40h30v-60h24v80h30v-50h40v50M200 0V-90M196 -90a8 8 0 1 0 8 0M190 -60a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M200 -20a20 20 0 1 0 0.1 0M190 0l6 -40M210 0l-6 -40M200 -98v-30M300 0V-120l10 -10l10 10V0M300 -100h20M300 -80h20M300 -60h20M310 -130v-20M380 0C380 -80 392 -140 400 -170C408 -140 420 -80 420 0M386 -100h28M392 -140h16M460 0V-150h36V0M466 -144h24v10h-24zM496 -110h30V0M560 0v-60h40v60';
    s += '<g transform="translate(' + f(o[0]) + ',' + f(o[1]) + ') scale(' + f(sc) + ')">' + P(sh, 1.1) + '</g>';
    var l1 = pr(4190, 408, D); s += T(l1[0], l1[1], 12, 'Shanghai', HI);
    // Guangzhou window with Canton Tower
    s += P(poly(pr, [[4860, 420, D], [5140, 420, D], [5140, 600, D], [4860, 600, D]], true), 1.4);
    o = pr(4860, 600, D);
    var ct = 'M80 0C96 -60 70 -120 88 -170M120 0C104 -60 130 -120 112 -170M88 -170h24M100 -170v-50M86 -40h28M84 -80h32M88 -120h24M84 -150h32';
    var lat = ''; for (var i = 0; i < 8; i++) lat += 'M' + (84 + i * 2) + ' ' + (-i * 20) + 'L' + (116 - i * 2) + ' ' + (-i * 20 - 20);
    ct += lat + 'M10 0V-70h30V0M150 0V-130l14 -12l14 12V0M150 -110h28M200 0V-90h40V0M250 0V-50h30V0';
    s += '<g transform="translate(' + f(o[0]) + ',' + f(o[1]) + ') scale(' + f(sc * 1.1) + ')">' + P(ct, 1.1) + '</g>';
    var l2 = pr(4870, 408, D); s += T(l2[0], l2[1], 12, 'Guangzhou', HI);
    // smelling bench
    s += box(pr, vx, 4160, 4400, 600, 614, 140, 240, 1.4) + P(seg(pr, [4170, 614, 140], [4170, FY, 140]) + seg(pr, [4390, 614, 140], [4390, FY, 140]), 1.4);
    var bp = pr(4200, 600, 180), bs = F / (F + 180), bl = 'M0 0h40v-14h-40z';
    for (i = 0; i < 6; i++) bl += 'M' + (4 + i * 6) + ' -14l' + (i - 2.5) * 3 + ' -60';
    bl += 'M80 0h24v-30h-24zM120 0h24v-30h-24zM160 0h24v-30h-24zM92 -30v-10M132 -30v-10M172 -30v-10';
    s += '<g transform="translate(' + f(bp[0]) + ',' + f(bp[1]) + ') scale(' + f(bs) + ')">' + P(bl, 1.3) + P('M92 -40q-6 -8 0 -16q6 8 0 16M132 -40q-6 -8 0 -16q6 8 0 16M172 -40q-6 -8 0 -16q6 8 0 16', 1, HI) + '</g>';
    // meeting table
    s += box(pr, vx, 4500, 4780, 610, 622, 200, 330, 1.4) + P(seg(pr, [4640, 622, 260], [4640, FY, 260]), 1.4);
    // blending station, Guangzhou
    s += box(pr, vx, 4880, 5160, 600, 614, 140, 240, 1.4) + P(seg(pr, [4890, 614, 140], [4890, FY, 140]) + seg(pr, [5150, 614, 140], [5150, FY, 140]), 1.4);
    var e2 = pr(4910, 600, 180);
    s += '<g transform="translate(' + f(e2[0]) + ',' + f(e2[1]) + ') scale(' + f(bs) + ')">' + P('M0 0l6 -30v-20h14v20l6 30zM50 0v-44h20v44zM50 -20h20M90 0h60v-10h-60zM96 -10v-6h48v6M170 0v-70M166 -70h8M170 -40h30M200 -40v-8', 1.3) + T(120, -20, 10, '0.00 g', LN, 'middle') + '</g>';
    var tg = pr(5020, 640, 140); s += T(tg[0], tg[1], 13, 'Guangzhou', HI, 'middle', 500);
    Z.dsm = s;
    Z.clients = [pr(4560, FY, 380), pr(4740, FY, 380), F / (F + 380)];
  })();

  // Pitch: 5700..7020
  (function () {
    var vx = 6360, pr = proj(vx), s = '';
    s += P('M5700 ' + EYE + 'H7020', 0.8, FAR);
    var tr = ''; for (var x = 5720; x < 7000; x += 90) { var hh = 40 + (x * 7 % 30); tr += 'M' + (x + 30) + ' ' + EYE + 'v-' + f(hh * 0.4) + 'M' + x + ' ' + f(EYE - hh * 0.4) + 'c-8 -6 -6 -' + f(hh * 0.5) + ' 10 -' + f(hh * 0.55) + 'c4 -' + f(hh * 0.4) + ' 36 -' + f(hh * 0.4) + ' 40 0c16 4 18 ' + f(hh * 0.5) + ' 10 ' + f(hh * 0.55) + 'z'; }
    s += P(tr, 0.7, FAR);
    var x0 = 5800, x1 = 6920, z0 = 40, z1 = 560;
    s += P(poly(pr, [[x0, FY, z0], [x1, FY, z0], [x1, FY, z1], [x0, FY, z1]], true), 1.4);
    s += P(seg(pr, [6360, FY, z0], [6360, FY, z1]), 0.9);
    var cc = ''; for (var a = 0; a <= 32; a++) { var ang = a / 32 * Math.PI * 2, q = pr(6360 + Math.cos(ang) * 110, FY, 300 + Math.sin(ang) * 110); cc += (a ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]); }
    s += P(cc, 0.9);
    s += P(poly(pr, [[x1, FY, 160], [x1 - 160, FY, 160], [x1 - 160, FY, 440], [x1, FY, 440]]), 0.9);
    for (var st = 1; st < 8; st++) { var zz = z0 + (z1 - z0) * st / 8; s += P(seg(pr, [x0, FY, zz], [x1, FY, zz]), 0.3, FAR); }
    for (var fx2 = x0; fx2 <= x1; fx2 += 40) s += P(seg(pr, [fx2, FY, 620], [fx2, FY - 60, 620]), 0.5, FAR);
    s += P(seg(pr, [x0, FY - 50, 620], [x1, FY - 50, 620]) + seg(pr, [x0, FY - 30, 620], [x1, FY - 30, 620]), 0.5, FAR);
    var gz0 = 220, gz1 = 380, gy = FY - 170, gx = 6910;
    s += P(poly(pr, [[gx, FY, gz0], [gx, gy, gz0], [gx, gy, gz1], [gx, FY, gz1]]), 3, HI);
    s += P(seg(pr, [gx, gy, gz0], [gx + 70, FY, gz0 + 10]) + seg(pr, [gx, gy, gz1], [gx + 70, FY, gz1 - 10]), 1);
    var net = ''; for (var nz = gz0 + 16; nz < gz1; nz += 16) { var p1 = pr(gx, gy, nz), p2 = pr(gx + 70, FY, nz); net += 'M' + f(p1[0]) + ' ' + f(p1[1]) + 'L' + f(p2[0]) + ' ' + f(p2[1]); }
    for (var ny = gy + 17; ny < FY; ny += 17) { var t = (ny - gy) / (FY - gy), p3 = pr(gx + 70 * t, ny, gz0), p4 = pr(gx + 70 * t, ny, gz1); net += 'M' + f(p3[0]) + ' ' + f(p3[1]) + 'L' + f(p4[0]) + ' ' + f(p4[1]); }
    s += P(net, 0.4, FAR);
    s += box(pr, vx, 5860, 6060, 610, 620, 120, 210, 1.4) + P(seg(pr, [5870, 620, 120], [5870, FY, 120]) + seg(pr, [6050, 620, 120], [6050, FY, 120]), 1.4);
    var lp = pr(5920, 610, 150), sc = F / (F + 150);
    s += '<g transform="translate(' + f(lp[0]) + ',' + f(lp[1]) + ') scale(' + f(sc) + ')">' + P('M0 0h70l-6 -48h-58zM6 -6h58', 1.4) + P('M100 0l6 -40h40l4 40z', 1.2) + P('M112 -30h26M112 -22h20M112 -14h24', 0.6) + '</g>';
    var fl = pr(5820, FY, 160);
    s += '<g transform="translate(' + f(fl[0]) + ',' + f(fl[1]) + ') scale(' + f(F / (F + 160)) + ')">' + P('M0 0v-150M0 -150l60 18l-60 18', 1.4) + T(10, -126, 13, 'FC', LN) + '</g>';
    Z.pitch = s;
    Z.goal = pr(6910, FY, 300);
  })();

  // Garage: 7020..8720, swing doors on the left wall
  var GVX = 7870, CARX = 8080, CARZ = 100;
  (function () {
    var vx = GVX, pr = proj(vx), s = '';
    s += room(vx, 7020, 8720, { tiles: true, doorL: true, doorR: true });
    [7350, 7900, 8400].forEach(function (x) { s += P(poly(pr, [[x - 70, CY + 8, 220], [x + 70, CY + 8, 220], [x + 70, CY + 16, 220], [x - 70, CY + 16, 220]], true), 0.9) + P(seg(pr, [x - 50, CY, 220], [x - 50, CY + 8, 220]) + seg(pr, [x + 50, CY, 220], [x + 50, CY + 8, 220]), 0.6, FAR); });
    // door frame on the left wall
    s += P(poly(pr, [[7020, FY, 140], [7020, FY - 260, 140], [7020, FY - 260, 360], [7020, FY, 360]]), 1.6);
    // pegboard and bench (workshop)
    var pb = [[7080, 440, D], [7560, 440, D], [7560, 590, D], [7080, 590, D]];
    s += P(poly(pr, pb, true), 1.2);
    var holes = ''; for (var hx = 7100; hx < 7550; hx += 22) for (var hy = 452; hy < 585; hy += 22) { var hp = pr(hx, hy, D); holes += 'M' + f(hp[0]) + ' ' + f(hp[1]) + 'h0.8'; }
    s += P(holes, 1.2, FAR);
    function onWall(d0, x0, y0) { var o = pr(x0, y0, D), sc = F / (F + D); return '<g transform="translate(' + f(o[0]) + ',' + f(o[1]) + ') scale(' + f(sc) + ')">' + d0 + '</g>'; }
    s += onWall(P('M0 0v70M-14 0h28v14h-28z', 2), 7120, 470) + onWall(P('M0 0l30 80M-6 -2l12 -4l4 10l-12 4z', 1.6), 7180, 465) + onWall(P('M0 0v80M-8 0a8 8 0 1 1 16 0M0 80l-6 6M0 80l6 6', 1.6), 7250, 465);
    s += onWall(P('M0 0h70l10 30h-90zM-10 30h90M10 30v40', 1.6), 7330, 470) + onWall(P('M0 0v60M14 0v70M28 0v50M42 0v64M-4 -6h50', 1.6), 7440, 470) + onWall(P(cp(0, 0, 18) + 'M0 18v50', 1.6), 7530, 480);
    s += box(pr, vx, 7070, 7570, 600, 616, 300, 470, 1.4) + P(seg(pr, [7090, 616, 300], [7090, FY, 300]) + seg(pr, [7550, 616, 300], [7550, FY, 300]) + seg(pr, [7090, 660, 300], [7550, 660, 300]), 1.4);
    // projects on the bench
    var bz = 330, bsc = F / (F + bz);
    var nb = 0; function onBench(x, d0, label) { var o = pr(x, 600, bz); nb++; return '<g transform="translate(' + f(o[0]) + ',' + f(o[1]) + ') scale(' + f(bsc) + ')">' + d0 + '</g>' + T(o[0], o[1] + (nb % 2 ? 20 : 40), 12, label, HI, 'middle'); }
    s += onBench(7140, P('M-40 0h80l-20 -50h-40zM-20 -50l20 -14l20 14M-40 0l40 -14l40 14M0 -14v-50M-50 -64h100', 1.4), 'Holographic email summariser');
    s += onBench(7290, P('M-40 0v-40h80v40zM-40 -40l80 -24v24M-30 -10h20M20 -20a6 6 0 1 0 0.1 0', 1.4), 'Solar dryer');
    s += onBench(7410, P('M-24 0v-34h48v34zM-30 -34l14 -30h44l-14 30zM24 -14q30 0 34 20M-10 -20h20', 1.4), 'Solar watering system');
    s += onBench(7520, P('M-30 0v-70h60v70zM-24 -64h48v40h-48zM-10 -30v-14h20v14M-30 -10h60', 1.4), '3D printer');
    // tyres and tool chest at the far end
    for (var t = 0; t < 4; t++) { var tp = pr(8620, FY - t * 26, 380), sc2 = F / (F + 380); s += P(ep(tp[0], tp[1] - 13 * sc2, 46 * sc2, 13 * sc2), 1) + P(ep(tp[0], tp[1] - 13 * sc2, 26 * sc2, 7 * sc2), 0.6, FAR); }
    s += box(pr, vx, 8380, 8520, 560, FY, 420, 500, 1.2);
    for (var dr = 0; dr < 4; dr++) s += P(seg(pr, [8385, 580 + dr * 30, 420], [8515, 580 + dr * 30, 420]), 0.6);
    var dp = pr(CARX, FY, 160); s += P(ep(dp[0], dp[1], 40, 6), 0.5, FAR);
    Z.garage = s;
    Z.holo = pr(7140, 600, bz).concat([bsc]);
  })();

  // End: 8720..9500
  Z.end = P('M8740 ' + EYE + 'H9500', 0.6, FAR) + P('M8720 ' + FY + 'H9500', 2) + (function () { var r = ''; for (var x = 8760; x < 9500; x += 40) r += 'M' + x + ' ' + (FY + 8) + 'h14'; return P(r, 0.6, FAR); })();

  // ---------- assemble ----------
  var zones = [['office', 0, 1200], ['hall', 1200, 2200], ['site', 2200, 3600], ['fly1', 3600, 4100], ['dsm', 4100, 5220], ['fly2', 5220, 5700], ['pitch', 5700, 7020], ['garage', 7020, 8720], ['end', 8720, 9500]];
  var html = '';
  zones.forEach(function (z) { html += '<g class="zone" data-x0="' + z[1] + '" data-x1="' + z[2] + '">' + Z[z[0]] + '</g>'; });
  var gp = proj(GVX), ac = gp(CARX, FY, CARZ), acs = F / (F + CARZ), carOX = ac[0] - 215 * acs, carOY = ac[1];
  html += '<g class="zone" data-x0="7020" data-x1="8720"><g transform="translate(' + f(carOX) + ',' + f(carOY) + ') scale(' + f(acs) + ')"><g id="eng-side" opacity="0">' + P('M342 -84h60v-6h-60zM350 -90v-8h44v8M356 -98v-6h32v6M402 -86h12v20h-12', 1.1) + '</g>' + carBody() + '<g id="bonnet">' + PF('M333 -92L418 -76L418 -71L333 -87Z', 2.2) + '</g></g></g>';
  html += '<g id="doors"></g>';
  // map on the garage ceiling
  var MAPX = GVX - 640, MAPY = -340, M = window.MAP, mk = 1280 / M.w, mh = M.h * mk;
  html += '<g id="mapz" opacity="0"><rect x="' + (MAPX - 20) + '" y="' + (MAPY - 60) + '" width="1320" height="' + f(mh + 100) + '" fill="' + SOFT + '" stroke="' + LN + '" stroke-width="2.4"/>' +
    '<text class="t" x="' + MAPX + '" y="' + (MAPY - 24) + '" font-size="18" fill="' + HI + '" font-weight="500">Where I have worked and travelled</text>' +
    '<g transform="translate(' + MAPX + ',' + MAPY + ') scale(' + f(mk) + ')"><path d="' + M.d + '" stroke="' + LN + '" stroke-width="' + f(1.2 / mk) + '" fill="none"/></g><g id="pins"></g></g>';
  // engine bay panel
  var EX = CARX - 520, EY = -560, EW = 1040, EH = trH('engine', EW);
  var callouts = [[1150, 335, 'Ultra Racing front strut bar', 1], [1520, 860, 'Cone filter and heat-wrapped intake', 1], [980, 790, 'Blue ignition leads', 0], [1095, 960, 'New distributor', 1], [740, 850, '4A-FE valve cover', 0], [470, 1110, 'New alternator', 0], [720, 1365, 'New radiator', 0], [1700, 1200, 'Battery with inline fuse', 1]];
  var co = '';
  callouts.forEach(function (c) {
    var px = EX + c[0] / 2016 * EW, py = EY + c[1] / 1512 * EH, right = c[3], tx = right ? EX + EW - 20 : EX + 20, ty = py;
    var tw = c[2].length * 8.6 + 16, bx = right ? tx - tw : tx;
    co += '<path d="M' + f(px) + ' ' + f(py) + 'L' + f(right ? bx : bx + tw) + ' ' + f(ty) + '" stroke="' + HI + '" stroke-width="1.2" fill="none"/>' + '<circle cx="' + f(px) + '" cy="' + f(py) + '" r="4" fill="' + HI + '"/>';
    co += '<rect x="' + f(bx) + '" y="' + f(ty - 15) + '" width="' + f(tw) + '" height="28" fill="' + INK + '" stroke="' + HI + '" stroke-width="1"/>' + '<text class="t" x="' + f(bx + 8) + '" y="' + f(ty + 5) + '" font-size="15" fill="' + HI + '">' + c[2] + '</text>';
  });
  html += '<g id="engbay" opacity="0"><rect x="' + (EX - 16) + '" y="' + (EY - 56) + '" width="' + (EW + 32) + '" height="' + f(EH + 72) + '" fill="' + INK + '" stroke="' + HI + '" stroke-width="2.6"/>' +
    '<text class="t" x="' + (EX) + '" y="' + (EY - 20) + '" font-size="20" fill="' + HI + '" font-weight="500">My engine bay, traced from a photo</text>' + TRC('engine', EX, EY, EW, 1, LN, 'eng') + co + '</g>';
  html += '<g id="plane"></g><g id="fx"></g><g id="me"></g><g id="fx2"></g>';
  svg.innerHTML = html;

  var zoneEls = [].slice.call(svg.querySelectorAll('.zone')), reveal = zoneEls.map(function () { return 0; });
  var $ = function (id) { return document.getElementById(id); };
  [ 'plane', 'fx', 'fx2', 'me', 'doors', 'engbay' ].forEach(function (k) { $(k).style.setProperty('--r', 1); });
  var mapEl = $('mapz'), engEl = $('engbay'), meEl = $('me'), fxEl = $('fx'), fx2El = $('fx2'), doorsEl = $('doors'), bonnetEl = $('bonnet'), engSide = $('eng-side'), pinsEl = $('pins'), planeEl = $('plane');

  // ---------- figures ----------
  function capsule(ax, ay, bx, by, w) {
    var dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2, r = w / 2;
    return 'M' + f(ax + nx) + ' ' + f(ay + ny) + 'L' + f(bx + nx) + ' ' + f(by + ny) + 'A' + r + ' ' + r + ' 0 0 0 ' + f(bx - nx) + ' ' + f(by - ny) + 'L' + f(ax - nx) + ' ' + f(ay - ny) + 'A' + r + ' ' + r + ' 0 0 0 ' + f(ax + nx) + ' ' + f(ay + ny) + 'Z';
  }
  function rad(a) { return a * Math.PI / 180; }
  function limb(sx, sy, a1, l1, a2, l2) { var ex = sx + Math.sin(rad(a1)) * l1, ey = sy + Math.cos(rad(a1)) * l1; return [ex, ey, ex + Math.sin(rad(a1 + a2)) * l2, ey + Math.cos(rad(a1 + a2)) * l2]; }
  function ik(sx, sy, tx, ty, l1, l2) {
    var dx = tx - sx, dy = ty - sy, d = Math.sqrt(dx * dx + dy * dy);
    d = Math.max(Math.abs(l1 - l2) + 1, Math.min(l1 + l2 - 0.5, d));
    var phi = Math.atan2(dx, dy) * 180 / Math.PI;
    var al = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) * 180 / Math.PI;
    var be = Math.acos((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)) * 180 / Math.PI;
    return [phi - al, 180 - be];
  }
  var SHY = -142, HIPY = -88;
  function figure(o) {
    var p = o.pose, s = '', st = 'stroke="' + HI + '" fill="' + INK + '" stroke-linejoin="round"';
    function pa(d, w) { return '<path d="' + d + '" ' + st + ' stroke-width="' + (w || 1.8) + '"/>'; }
    function ln(d, w, c) { return '<path d="' + d + '" stroke="' + (c || HI) + '" stroke-width="' + (w || 1.2) + '" fill="none"/>'; }
    var shY = SHY, hipY = HIPY, uni = o.outfit === 'police', ppe = o.outfit === 'ppe';
    if (o.front) {
      var wv = o.wave || 0;
      s += pa(capsule(-7, hipY, -8, -4, 15) + capsule(7, hipY, 8, -4, 15), 1.8) + pa('M-20 -4h16v6h-18zM4 -4h16l2 6h-18z', 1.6);
      s += pa('M-20 ' + (shY + 2) + 'Q-22 -116 -16 ' + (hipY + 2) + 'H16Q22 -116 20 ' + (shY + 2) + 'Q0 ' + (shY - 6) + ' -20 ' + (shY + 2) + 'Z', 2);
      s += ln('M-6 ' + (shY - 3) + 'l6 10l6 -10M0 ' + (shY + 7) + 'v16M-16 ' + (hipY + 4) + 'H16');
      s += pa(capsule(-20, shY + 4, -27, shY + 36, 10) + capsule(-27, shY + 36, -27, shY + 64, 8), 1.8);
      var a = 135 + Math.sin(wv) * 14, el = limb(20, shY + 4, a, 30, 0, 0);
      var fa = limb(el[0], el[1], 180 + Math.sin(wv * 1.7) * 26, 26, 0, 0);
      s += pa(capsule(20, shY + 4, el[0], el[1], 10) + capsule(el[0], el[1], fa[0], fa[1], 8), 1.8) + pa(cp(fa[0], fa[1], 5), 1.4);
      s += pa('M-3 ' + (shY - 8) + 'v8h6v-8', 1.6) + pa(ep(0, shY - 22, 12, 14), 1.8);
      s += '<path d="M-12 ' + (shY - 24) + 'q0 -16 12 -16q12 0 12 16q-6 -8 -12 -6q-6 -2 -12 6z" fill="' + HI + '"/>';
      s += ln('M-5 ' + (shY - 21) + 'h0.5M5 ' + (shY - 21) + 'h0.5', 2.6) + ln('M-4 ' + (shY - 14) + 'q4 4 8 0', 1.2);
      return { s: s, hand: [o.x + fa[0] * o.scale, o.y + fa[1] * o.scale], head: [o.x, o.y + (shY - 22) * o.scale] };
    }
    var fl = limb(-2, hipY, p.hF, 44, p.kF, 44);
    s += pa(capsule(-2, hipY, fl[0], fl[1], 15) + capsule(fl[0], fl[1], fl[2], fl[3], 13), 1.4) + pa('M' + f(fl[2] - 6) + ' ' + f(fl[3] - 2) + 'h24q4 0 4 6h-28z', 1.4);
    var fa2 = limb(0, shY + 4, p.sF, 30, p.eF, 28);
    s += pa(capsule(0, shY + 4, fa2[0], fa2[1], 10) + capsule(fa2[0], fa2[1], fa2[2], fa2[3], 8), 1.4);
    s += '<g transform="rotate(' + (p.lean || 0) + ' 0 ' + hipY + ')">';
    s += pa('M-13 ' + (shY + 2) + 'Q-15 -118 -12 ' + (hipY + 2) + 'H13Q16 -118 13 ' + (shY + 2) + 'Q0 ' + (shY - 6) + ' -13 ' + (shY + 2) + 'Z', 2);
    if (uni) s += ln('M-12 ' + (hipY - 2) + 'H13M-12 ' + (hipY - 6) + 'H13', 1.6) + ln('M3 ' + (shY + 12) + 'h9v9h-9zM-10 ' + (shY + 4) + 'h10', 1.1) + ln('M-6 ' + (shY - 2) + 'l6 8l6 -8', 1.2);
    else s += ln('M-4 ' + (shY - 2) + 'l6 10l6 -10M2 ' + (shY + 8) + 'v14M-12 ' + (hipY + 4) + 'H13');
    if (ppe) s += '<path d="M-13 ' + (shY + 4) + 'L4 ' + (hipY - 6) + 'M13 ' + (shY + 4) + 'L4 ' + (hipY - 6) + 'M-12 -112H13M-12 -104H13" stroke="' + LN + '" stroke-width="3" fill="none"/>';
    var hx = 2, hy = shY - 20;
    s += '<g transform="rotate(' + (p.head || 0) + ' 0 ' + (shY - 6) + ')">';
    s += pa('M-3 ' + (shY - 8) + 'v8h8v-8', 1.6) + pa('M' + (hx - 11) + ' ' + hy + 'a11 12 0 1 1 22 0q0 6 -3 9l3 4l-4 1q-2 5 -9 4q-9 -1 -9 -18z', 1.8);
    if (!uni && !ppe) s += '<path d="M' + (hx - 12) + ' ' + (hy - 2) + 'q2 -14 14 -13q10 1 10 9q-8 -4 -14 0q-6 3 -10 4z" fill="' + HI + '" stroke="' + HI + '" stroke-width="1"/>';
    s += '<path d="M' + (hx + 7) + ' ' + (hy + 1) + 'h0.5" stroke="' + HI + '" stroke-width="2.4" stroke-linecap="round"/>';
    if (ppe) s += '<path d="M' + (hx - 14) + ' ' + (hy - 4) + 'q0 -18 15 -18q15 0 15 18zM' + (hx - 16) + ' ' + (hy - 4) + 'h34" stroke="' + LN + '" stroke-width="2" fill="' + INK + '"/>';
    if (uni) s += '<path d="M' + (hx - 13) + ' ' + (hy - 6) + 'q2 -14 15 -14q12 0 13 10l-28 4zM' + (hx - 6) + ' ' + (hy - 6) + 'q10 -2 24 2l-2 4q-12 -3 -22 -2zM' + (hx - 2) + ' ' + (hy - 14) + 'h4v4h-4z" stroke="' + HI + '" stroke-width="1.6" fill="' + INK + '"/>';
    s += '</g></g>';
    var nl = limb(2, hipY, p.hN, 44, p.kN, 44);
    s += pa(capsule(2, hipY, nl[0], nl[1], 16) + capsule(nl[0], nl[1], nl[2], nl[3], 14), 1.8) + pa('M' + f(nl[2] - 6) + ' ' + f(nl[3] - 2) + 'h24q5 0 5 7h-29z', 1.8);
    var na = limb(0, shY + 4, p.sN, 30, p.eN, 28);
    s += pa(capsule(0, shY + 4, na[0], na[1], 10) + capsule(na[0], na[1], na[2], na[3], 8), 1.8);
    var sl = limb(0, shY + 4, p.sN, 18, 0, 0);
    s += pa(capsule(0, shY + 4, sl[0], sl[1], 15), 1.8) + pa(cp(na[2], na[3], 4.5), 1.4);
    if (uni) s += ln('M-6 ' + (shY + 4) + 'h12', 2.4);
    var k = o.dir * o.scale;
    return { s: s, hand: [o.x + k * na[2], o.y + o.scale * na[3]], hand2: [o.x + k * fa2[2], o.y + o.scale * fa2[3]], foot: [o.x + k * nl[2], o.y + o.scale * nl[3]], head: [o.x + k * 2, o.y + o.scale * (shY - 20)], nose: [o.x + k * 14, o.y + o.scale * (shY - 18)] };
  }
  function place(o) { return 'translate(' + f(o.x) + ',' + f(o.y) + ') scale(' + f(o.dir * o.scale) + ',' + f(o.scale) + ')'; }
  // local coords for a world point, for IK
  function toLocal(o, w) { return [(w[0] - o.x) / (o.dir * o.scale), (w[1] - o.y) / o.scale]; }
  function reachPose(o, target, both, extra) {
    var l = toLocal(o, target), a = ik(0, SHY + 4, l[0], l[1], 30, 28), r = { sN: a[0], eN: a[1] };
    if (both) { var b = ik(0, SHY + 4, l[0] - 4, l[1] + 2, 30, 28); r.sF = b[0]; r.eF = b[1]; }
    for (var q in extra) r[q] = extra[q];
    return r;
  }
  var STAND = { sN: 4, eN: -8, sF: -4, eF: -8, hN: 2, kN: 0, hF: -2, kF: 0, head: 0, lean: 0 };
  function walkPose(ph) { var s = Math.sin(ph), c = Math.cos(ph); return { sN: -22 * s, eN: -14 - 8 * Math.max(0, -s), sF: 22 * s, eF: -14 - 8 * Math.max(0, s), hN: 26 * s, kN: -Math.max(0, 40 * c) - 4, hF: -26 * s, kF: -Math.max(0, -40 * c) - 4, head: 0, lean: 3 }; }
  function mix(a, b, t) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = (a[k] === undefined ? STAND[k] || 0 : a[k]) + (b[k] - (a[k] === undefined ? STAND[k] || 0 : a[k])) * t; return o; }
  function sm(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function rng(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function floorAt(vx, x, z) { var p = proj(vx)(x, FY, z); return { x: p[0], y: p[1], s: F / (F + z) }; }
  function bottle(x, y, s, rot) { return '<g transform="translate(' + f(x) + ',' + f(y) + ') rotate(' + (rot || 0) + ') scale(' + f(s) + ')"><path d="M-7 12v-22h14v22zM-3 -10v-6h6v6zM-5 -16h10v-6h-10z" stroke="' + HI + '" stroke-width="1.6" fill="' + INK + '"/></g>'; }
  function bubble(x, y, w, lines, think) {
    var h = 24 + lines.length * 24, s = '<g class="bub">';
    s += '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + w + '" height="' + h + '" rx="' + (think ? 22 : 6) + '" fill="' + INK + '" stroke="' + HI + '" stroke-width="1.8"/>';
    lines.forEach(function (l, i) { s += '<text class="t" x="' + f(x + 18) + '" y="' + f(y + 32 + i * 24) + '" font-size="' + (i ? 15 : 18) + '" fill="' + (i ? LN : HI) + '"' + (i ? '' : ' font-weight="500"') + '>' + l + '</text>'; });
    return s + '</g>';
  }

  // bonnet geometry (car local to world)
  function carPt(lx, ly) { return [carOX + lx * acs, carOY + ly * acs]; }
  function bonnetEdge(a) { var r = rad(a), dx = 85, dy = 18; return carPt(333 + dx * Math.cos(r) + dy * Math.sin(r), -92 - dx * Math.sin(r) + dy * Math.cos(r)); }
  var noseX = carPt(430, 0)[0] + 30;
  var bonnetX = GVX + (noseX - GVX) / (F / (F + 60));

  // ---------- timeline ----------
  var stops = [
    { id: 'hello', x: 330, vx: 600, z: 60, cam: [90, 'auto', 1100], dwell: 1 },
    { id: 'perfume', x: 640, vx: 600, z: 60, cam: [700, 'auto', 760], dwell: 2 },
    { id: 'police', x: 1576, vx: 1700, z: 60, cam: [1700, 'auto', 820], dwell: 1.4 },
    { id: 'site', x: 2420, vx: 2900, z: 60, cam: [2850, 'auto', 1200], dwell: 1.3 },
    { id: 'fly1', x: 3850, vx: 3850, z: 60, cam: [3850, 440, 900], dwell: 0.2 },
    { id: 'dsm', x: 4280, vx: 4660, z: 60, cam: [4660, 'auto', 1100], dwell: 2.4 },
    { id: 'fly2', x: 5450, vx: 5450, z: 60, cam: [5450, 440, 900], dwell: 0.2 },
    { id: 'pitch', x: 5950, vx: 6360, z: 60, cam: [6150, 'auto', 1000], dwell: 1 },
    { id: 'kick', x: 6560, vx: 6360, z: 60, cam: [6600, 'auto', 950], dwell: 1.6 },
    { id: 'workshop', x: 7260, vx: GVX, z: 60, cam: [7300, 'auto', 780], dwell: 1.5 },
    { id: 'bonnet', x: bonnetX, vx: GVX, z: 60, cam: [8150, 'auto', 860], dwell: 2.8 },
    { id: 'ceiling', x: bonnetX - 120, vx: GVX, z: 60, cam: [GVX, -10, 1500], dwell: 1.4 },
    { id: 'bye', x: 9100, vx: 9100, z: 60, cam: [9150, 'auto', 860], dwell: 2 }];
  var segs = [], total = 0;
  stops.forEach(function (st, i) {
    if (i > 0) { var pv = stops[i - 1], len = Math.max(0.5, Math.abs(st.x - pv.x) / 900); if (/^fly/.test(st.id) || /^fly/.test(pv.id)) len = 0.7; if (st.id === 'ceiling' || pv.id === 'ceiling') len = 0.9; segs.push({ type: 'walk', a: pv, b: st, start: total, len: len }); total += len; }
    segs.push({ type: 'dwell', st: st, start: total, len: st.dwell }); total += st.dwell;
  });
  walk.style.height = (total * 70 + 100) + 'vh';

  // ---------- cards ----------
  var CARDS = {
    perfume: ['Fragrance Castle Singapore', 'Developed with my family since 2019. E-commerce and sales on Shopee, Lazada and Shopify, for retail and wholesale customers.', 'fragrance-castle.html'],
    police: ['Singapore Police Force', 'Two years as a field instructor. I trained 160+ officers in fitness and drill, and gave the ORD ceremony speech.', 'experience.html#spf'],
    site: ['Ekosys', 'Project management and design engineering intern. Wrote ISO 9001 manuals and cut defect logging from 1 min to 20 s.', 'experience.html#ekosys'],
    dsm: ['dsm-firmenich, Shanghai and Guangzhou', 'Marketing intern. Fragrance evaluations, candle testing, client visits and market research.', 'experience.html#dsm'],
    pitch: ['Vice president, SUTD Football Club', 'Fixtures, venue bookings, risk assessments, and new goalposts beyond our seed funding.', 'experience.html#football'],
    workshop: ['My projects', 'The holographic email summariser, a solar dryer, a solar powered watering system and more, built at SUTD and at home.', 'projects.html'],
    bonnet: ['Toyota Corolla AE111', 'A 4A-FE manual past 314,000 km. I maintain and modify it myself, from the timing chain to the strut bar.', 'ae111.html'],
    ceiling: ['Where I have worked and travelled', 'Singapore, Shanghai, Guangzhou and Dubai, and building a network across Asia, the Middle East and Europe.', 'experience.html']
  };
  var cardEls = {};
  Object.keys(CARDS).forEach(function (k) {
    var c = CARDS[k], el = document.createElement('div');
    el.className = 'wcard';
    el.innerHTML = '<p class="wc-t">' + c[0] + '</p><p class="wc-b">' + c[1] + '</p><a href="' + c[2] + '">Read more</a>';
    cardsEl.appendChild(el); cardEls[k] = el;
  });

  // ---------- frame ----------
  var W = 0, H = 0, mobile = false, view = { x: 0, y: 0, w: 1, h: 1 };
  function resize() { var r = stage.getBoundingClientRect(); W = r.width; H = r.height; mobile = W < 760; svg.setAttribute('width', W); svg.setAttribute('height', H); }
  function camW(w) { return mobile ? Math.max(w * 0.42, 360) : w; }
  function camY(c) { if (c[1] !== 'auto') return c[1]; return FY + 16 - (mobile ? 0.36 : 0.34) * camW(c[2]) * H / W; }
  function setCam(cx, cy, w) { w = camW(w); var h = w * H / W; view = { x: cx - w / 2, y: cy - h / 2, w: w, h: h }; svg.setAttribute('viewBox', f(view.x) + ' ' + f(view.y) + ' ' + f(w) + ' ' + f(h)); }
  function toScreen(x, y) { return [(x - view.x) / view.w * W, (y - view.y) / view.h * H]; }

  function frame(u) {
    var sg = segs[segs.length - 1], i;
    for (i = 0; i < segs.length; i++) if (u < segs[i].start + segs[i].len) { sg = segs[i]; break; }
    var t = Math.max(0, Math.min(1, (u - sg.start) / sg.len));
    var st, x, z, vx, cam, pose = STAND, dir = 1;
    if (sg.type === 'walk') {
      var a = sg.a, b = sg.b, e = sm(t);
      x = lerp(a.x, b.x, t); z = lerp(a.z, b.z, t); vx = t < 0.5 ? a.vx : b.vx;
      cam = [lerp(a.cam[0], b.cam[0], e), lerp(camY(a.cam), camY(b.cam), e), lerp(a.cam[2], b.cam[2], e)];
      dir = b.x >= a.x ? 1 : -1;
      if (Math.abs(b.x - a.x) > 5) pose = mix(STAND, walkPose(x / 30), Math.min(1, t * 6, (1 - t) * 6));
      if (b.id === 'ceiling') pose = mix(STAND, { head: -28 }, sm(t));
      if (a.id === 'ceiling') pose = mix(STAND, { head: -28 }, 1 - sm(t * 3));
      st = { id: '_walk', from: a.id, to: b.id };
    } else { st = sg.st; x = st.x; z = st.z; vx = st.vx; cam = [st.cam[0], camY(st.cam), st.cam[2]]; }
    // walls between zones use the zone's own vanishing point
    zones.forEach(function (zn) { if (x >= zn[1] && x < zn[2]) { var m = { office: 600, hall: 1700, site: 2900, dsm: 4660, pitch: 6360, garage: GVX }; if (m[zn[0]]) vx = m[zn[0]]; } });
    var fp = floorAt(vx, x, z);
    var outfit = x >= 1200 && x < 2214 ? 'police' : x >= 2214 && x < 3600 ? 'ppe' : 'polo';
    var o = { x: fp.x, y: fp.y, dir: dir, scale: fp.s, pose: pose, outfit: outfit };
    var id = st.id, fx = '', fx2 = '', active = null, hidden = false;
    var bonnetA = 0, engO = 0, holoO = 0, mapR = 0, doorOpen = sm(rng(x, 6900, 7060));

    if (id === 'hello') { o.front = true; o.wave = u * 12; }
    if (st.id === '_walk' && st.from === 'hello' && t < 0.15) { o.front = true; o.wave = u * 12; }
    if (id === 'perfume') {
      active = t > 0.15 ? 'perfume' : null;
      var bt = Z.pickBottle, pr1 = rng(t, 0, 0.18), lift = sm(rng(t, 0.25, 0.45)), back = sm(rng(t, 0.85, 1));
      var reachP = reachPose(o, [bt[0], bt[1] - 8], false, { lean: 8 });
      var noseW;
      o.pose = mix(STAND, reachP, sm(pr1));
      var g0 = figure(o);
      noseW = [g0.nose[0] + 6, g0.nose[1] + 4];
      var held = [lerp(bt[0], noseW[0], lift), lerp(bt[1] - 8, noseW[1] + 10, lift)];
      if (back > 0) held = [lerp(noseW[0], bt[0], back), lerp(noseW[1] + 10, bt[1] - 8, back)];
      if (t > 0.18) { o.pose = mix(STAND, reachPose(o, held, false, { lean: 8 - 8 * lift + 8 * back, head: lift * (1 - back) * 6 }), 1); fx2 += bottle(held[0], held[1], o.scale, -10 * lift * (1 - back)); }
      else fx += bottle(bt[0], bt[1] - 12, F / (F + 140), 0);
      var mist = rng(t, 0.5, 0.72);
      if (mist > 0 && mist < 1) { var mm = ''; for (var m = 0; m < 16; m++) { var rr = mist * 38 * ((m % 5) / 5 + 0.4); mm += cp(held[0] - o.dir * (10 + rr * Math.abs(Math.cos(m))), held[1] - 18 + rr * Math.sin(m * 2.3) * 0.5, 1.4); } fx2 += '<path d="' + mm + '" fill="' + HI + '" opacity="' + f(1 - mist) + '"/>'; }
    }
    if (id === 'police') { active = 'police'; o.pose = mix(STAND, { head: -12, sN: 10 }, sm(rng(t, 0, 0.3))); }
    if (id === 'site') { active = t > 0.15 ? 'site' : null; o.pose = mix(STAND, { head: -14, sN: 20, eN: -100, sF: -10 }, sm(rng(t, 0.1, 0.3))); }
    var fl1 = x > 3610 && x < 4090, fl2 = x > 5230 && x < 5670;
    if (fl1 || fl2) {
      hidden = true;
      var x0 = fl1 ? 3640 : 5240, x1 = fl1 ? 4060 : 5660, pt = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
      var px = lerp(x0, x1, pt), py = (1 - pt) * (1 - pt) * (FY - 40) + 2 * pt * (1 - pt) * (FY - 520) + pt * pt * (FY - 40);
      var ang = Math.atan2(2 * (1 - pt) * (-480) + 2 * pt * 480, x1 - x0) * 180 / Math.PI;
      planeEl.innerHTML = '<g transform="translate(' + f(px) + ',' + f(py - 14) + ') rotate(' + f(ang) + ') scale(1.5)">' + Z.plane + '</g>';
      cam[0] = px; cam[1] = Math.min(cam[1], py + 40);
    } else planeEl.innerHTML = '';
    if (id === 'dsm') {
      active = 'dsm';
      var ph = Math.min(2, Math.floor(t * 3)), lt = t * 3 - ph, spots = [4300, 4640, 5000], fp2 = floorAt(4660, spots[ph], 60);
      o.x = fp2.x; o.y = fp2.y; o.scale = fp2.s;
      var poses = [{ sN: 150, eN: -130, head: 6 }, { sN: 40, eN: -70, sF: 30, eF: -60 }, { sN: 80, eN: -60, head: -8, sF: 70, eF: -30 }];
      o.pose = mix(STAND, poses[ph], sm(rng(lt, 0, 0.25)) * (1 - sm(rng(lt, 0.85, 1))));
      o.dir = ph === 1 ? -1 : 1;
      if (lt < 0.2) { var tr = ''; for (var q = 1; q < 4; q++) tr += 'M' + f(o.x - q * 22 - 10) + ' ' + f(o.y - 120 + q * 18) + 'h-' + (40 - q * 8); fx += '<path d="' + tr + '" stroke="' + HI + '" stroke-width="1.4" fill="none"/>'; }
      fx2 += T(o.x, o.y - 215 * o.scale, 15, ['Smelling, Shanghai', 'Client meeting, Shanghai', 'Blending, Guangzhou'][ph], HI, 'middle', 500);
    }
    if (x > 4100 && x < 5220) { var cl = Z.clients; [[cl[0], 1], [cl[1], -1]].forEach(function (c2) { fx += '<g transform="' + place({ x: c2[0][0], y: c2[0][1], dir: c2[1], scale: cl[2] }) + '">' + figure({ x: 0, y: 0, dir: 1, scale: 1, pose: STAND, outfit: 'polo' }).s + '</g>'; }); }
    // football
    if (x > 5700 && x < 7020) {
      var pls = [floorAt(6360, 6300, 260), floorAt(6360, 6480, 200)], bp = null, gl = Z.goal;
      var kt = id === 'kick' ? t : (st.id === '_walk' && st.from === 'kick') ? 1 : -1;
      var passer = 1, pass2me = kt >= 0 ? sm(rng(kt, 0.05, 0.3)) : 0;
      var rot = (u * 3) % 2, pp = sm(rot < 1 ? rot : 2 - rot);
      pls.forEach(function (pl, n) {
        var run = n === passer && kt >= 0 && kt < 0.08 ? { hN: 40, kN: -40, lean: -4 } : STAND;
        fx += '<g transform="' + place({ x: pl.x, y: pl.y, dir: n ? -1 : 1, scale: pl.s }) + '">' + figure({ x: 0, y: 0, dir: 1, scale: 1, pose: mix(STAND, run, 1), outfit: 'polo' }).s + '</g>';
      });
      if (kt < 0) bp = [lerp(pls[0].x + 14, pls[1].x - 14, pp), lerp(pls[0].y - 8, pls[1].y - 8, pp) - Math.sin(pp * Math.PI) * 20];
      else {
        var myFoot = [o.x + 18, o.y - 10], shot = sm(rng(kt, 0.45, 0.78));
        if (kt < 0.4) bp = [lerp(pls[1].x - 14, myFoot[0], pass2me), lerp(pls[1].y - 8, myFoot[1], pass2me)];
        else bp = [lerp(myFoot[0], gl[0] - 20, shot), lerp(myFoot[1], gl[1] - 70, shot) - Math.sin(shot * Math.PI) * 110];
        if (kt > 0.3 && kt < 0.7) { var k2 = rng(kt, 0.32, 0.5); o.pose = mix(STAND, { hN: k2 < 0.5 ? -30 * sm(k2 * 2) : lerp(-30, 70, sm((k2 - 0.5) * 2)), kN: k2 < 0.5 ? -60 * sm(k2 * 2) : -60 + 60 * sm((k2 - 0.5) * 2), sF: 30, sN: -30, lean: -4 }, 1 - sm(rng(kt, 0.6, 0.7))); }
        if (kt > 0.8 && id === 'kick') fx2 += T(gl[0] - 40, gl[1] - 210, 26, 'Goal', HI, 'middle', 500);
      }
      fx2 += '<circle cx="' + f(bp[0]) + '" cy="' + f(bp[1]) + '" r="11" fill="' + INK + '" stroke="' + HI + '" stroke-width="1.8"/>';
    }
    if (id === 'pitch') { active = 'pitch'; o.pose = mix(STAND, { sN: 40, eN: -60 }, sm(rng(t, 0.1, 0.3))); }
    if (id === 'kick') active = t > 0.85 ? 'pitch' : null;
    if (id === 'workshop') {
      active = t > 0.25 ? 'workshop' : null;
      var hb = Z.holo;
      o.pose = mix(STAND, reachPose(o, [hb[0] + 30, hb[1] - 30], false, { head: -6, lean: 4 }), sm(rng(t, 0, 0.2)) * (1 - sm(rng(t, 0.85, 1))));
      holoO = sm(rng(t, 0.15, 0.32));
    }
    if (id === 'bonnet') {
      o.dir = -1;
      var r1 = sm(rng(t, 0, 0.12)), lf = sm(rng(t, 0.12, 0.3)), cl2 = sm(rng(t, 0.88, 1));
      bonnetA = 56 * lf * (1 - cl2);
      var edge = bonnetEdge(bonnetA);
      var lean = 14 * (1 - lf) + 14 * cl2;
      o.pose = mix(STAND, reachPose(o, [edge[0] + 2, edge[1] + 2], true, { lean: lean, head: -6 * lf }), r1);
      engO = sm(rng(t, 0.3, 0.42)) * (1 - sm(rng(t, 0.8, 0.88)));
      if (engO > 0) { var ec = [CARX, -560 + EH / 2 - 30, 1720]; cam = [lerp(cam[0], ec[0], engO), lerp(cam[1], ec[1], engO), lerp(cam[2], mobile ? 2600 : ec[2], engO)]; }
      active = (t > 0.04 && t < 0.3) || t > 0.9 ? 'bonnet' : null;
    }
    if (id === 'ceiling') { active = t > 0.35 ? 'ceiling' : null; o.pose = mix(STAND, { head: -28 }, 1); mapR = sm(rng(t, 0, 0.4)); }
    if (st.id === '_walk' && st.to === 'ceiling') mapR = sm(rng(t, 0.4, 1));
    if (st.id === '_walk' && st.from === 'ceiling') mapR = 1 - sm(t * 3);
    if (id === 'bye') {
      o.front = true; o.wave = u * 12;
      var bx = mobile ? o.x - 150 : o.x + 50;
      fx2 += bubble(bx, o.y - 330, 300, ['Thanks for walking through.', 'Scroll down for the details.'], false);
      if (t > 0.45) fx2 += '<g opacity="' + f(sm(rng(t, 0.45, 0.6))) + '">' + P(cp(o.x - 40, o.y - 210, 4) + cp(o.x - 58, o.y - 236, 7), 1.2, HI) + bubble(mobile ? o.x - 150 : o.x - 380, mobile ? o.y - 450 : o.y - 340, mobile ? 300 : 330, ['Next: Shopee SPX Express', 'Business development, Jan 2027'], true) + '</g>';
    }
    if (id === 'hello') fx2 += bubble(mobile ? o.x - 145 : o.x + 40, o.y - 320, 290, ["Hi, I'm Sanjith.", 'Scroll to walk through my work.'], false);

    if (mobile && !hidden && engO < 0.05 && id !== 'ceiling' && !(st.id === '_walk' && (st.to === 'ceiling' || st.from === 'ceiling'))) cam[0] = cam[0] * 0.25 + o.x * 0.75;
    // draw
    if (hidden) meEl.innerHTML = '';
    else { var g = figure(o); meEl.innerHTML = g.s; meEl.setAttribute('transform', o.front ? 'translate(' + f(o.x) + ',' + f(o.y) + ') scale(' + f(o.scale) + ')' : place(o)); }
    if (holoO > 0) {
      var hp = Z.holo, hs = hp[2] * 1.6, blink = 0.6 + 0.4 * Math.sin(u * 30);
      fx2 += '<g opacity="' + f(holoO) + '" transform="translate(' + f(hp[0]) + ',' + f(hp[1] - 70 * hp[2]) + ') scale(' + f(hs) + ')">' + '<path d="M-14 -10h28v18h-28zM-14 -10l14 10l14 -10" stroke="' + HI + '" stroke-width="1.4" fill="none" opacity="' + f(blink) + '"/>' + '</g>';
      fx2 += '<g opacity="' + f(holoO) + '">' + bubble(hp[0] - 120, hp[1] - 190, 240, ['Inbox summary', '3 new, 1 urgent'], false) + '<path d="M' + f(hp[0]) + ' ' + f(hp[1] - 118) + 'v26" stroke="' + HI + '" stroke-dasharray="3 4"/></g>';
    }
    fxEl.innerHTML = fx; fx2El.innerHTML = fx2;
    setCam(cam[0], cam[1], cam[2]);
    bonnetEl.setAttribute('transform', 'rotate(' + f(-bonnetA) + ' 333 -92)');
    engSide.setAttribute('opacity', f(Math.min(1, bonnetA / 30)));
    engEl.setAttribute('opacity', f(engO));
    // inward opening doors on the garage left wall
    var gpz = proj(GVX), dd = '', th = rad(80 * doorOpen);
    [[140, 1], [360, -1]].forEach(function (lf2) {
      var zh = lf2[0], sgn = lf2[1], L = 110, xf = 7020 + Math.sin(th) * L, zf = zh + sgn * Math.cos(th) * L;
      dd += P(poly(gpz, [[7020, FY, zh], [7020, FY - 260, zh], [xf, FY - 260, zf], [xf, FY, zf]], true), 1.6, LN);
      dd += P(seg(gpz, [7020 + Math.sin(th) * L * 0.5, FY - 250, zh + sgn * Math.cos(th) * L * 0.5], [7020 + Math.sin(th) * L * 0.5, FY - 10, zh + sgn * Math.cos(th) * L * 0.5]), 0.6);
    });
    doorsEl.innerHTML = dd; doorsEl.style.setProperty('--r', 1);
    // map, faded in, pins after
    mapEl.setAttribute('opacity', f(mapR));
    if (mapR > 0.6) {
      var pins = '', c = M.c, home = [MAPX + c.Singapore[0] * mk, MAPY + c.Singapore[1] * mk], pr2 = sm(rng(mapR, 0.6, 1));
      var labels = { Singapore: 'Singapore, home base', Shanghai: 'Shanghai', Guangzhou: 'Guangzhou', Dubai: 'Dubai, Beautyworld' };
      Object.keys(c).forEach(function (kk) {
        var cc = [MAPX + c[kk][0] * mk, MAPY + c[kk][1] * mk];
        if (kk !== 'Singapore') pins += '<path d="M' + f(home[0]) + ' ' + f(home[1]) + 'Q' + f((home[0] + cc[0]) / 2) + ' ' + f(Math.min(home[1], cc[1]) - 120) + ' ' + f(cc[0]) + ' ' + f(cc[1]) + '" stroke="' + HI + '" stroke-width="1.4" fill="none" stroke-dasharray="6 6" opacity="' + f(pr2) + '"/>';
        pins += '<circle cx="' + f(cc[0]) + '" cy="' + f(cc[1]) + '" r="' + f(8 * pr2) + '" fill="' + HI + '"/>';
        var left = kk === 'Guangzhou';
        pins += '<text x="' + f(cc[0] + (left ? -14 : 14)) + '" y="' + f(cc[1] + 5) + '" font-size="17" fill="' + HI + '" text-anchor="' + (left ? 'end' : 'start') + '" opacity="' + f(pr2) + '" font-family="Hanken Grotesk, sans-serif">' + labels[kk] + '</text>';
      });
      pinsEl.innerHTML = pins;
    } else pinsEl.innerHTML = '';
    // reveal drawings near the camera
    var cxm = view.x + view.w / 2;
    zoneEls.forEach(function (el, n) {
      var a0 = +el.dataset.x0, a1 = +el.dataset.x1, dist = cxm < a0 ? a0 - cxm : cxm > a1 ? cxm - a1 : 0;
      var r = 1 - Math.max(0, Math.min(1, (dist - view.w * 0.2) / (view.w * 0.5)));
      if (r > reveal[n]) reveal[n] = r;
      el.style.setProperty('--r', f(sm(reveal[n])));
    });
    // cards
    Object.keys(cardEls).forEach(function (k) {
      var el = cardEls[k], on = active === k;
      el.classList.toggle('on', on);
      if (!on) return;
      if (mobile) { el.style.top = 'auto'; el.style.bottom = '20px'; return; }
      var an = toScreen(o.x, o.y - 270 * o.scale);
      if (k === 'ceiling') an = [W * 0.2, H * 0.84];
      if (k === 'workshop') an = toScreen(Z.holo[0] + 300, Z.holo[1] - 80);
      if (k === 'site') an = toScreen(o.x + 360, o.y - 330);
      var lx = Math.max(20, Math.min(W - 360, an[0] - 170)), ly = Math.max(80, Math.min(H - 200, an[1] - 150));
      el.style.left = lx + 'px'; el.style.top = ly + 'px'; el.style.bottom = 'auto';
    });
    if (heroEl) heroEl.style.opacity = f(1 - sm(u / 0.6));
    if (barEl) barEl.style.transform = 'scaleX(' + f(u / total) + ')';
  }

  var ticking = false, lastU = -1;
  function progress() { var r = walk.getBoundingClientRect(), span = r.height - window.innerHeight; return Math.max(0, Math.min(1, -r.top / span)) * total; }
  function tick() { ticking = false; var u = progress(); if (Math.abs(u - lastU) > 0.0005) { lastU = u; frame(u); } }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  window.addEventListener('resize', function () { resize(); lastU = -1; tick(); });
  resize();
  frame(progress());
  window.__walk = { total: total, segs: segs, frame: frame };
})();
