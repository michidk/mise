// node_modules/fflate/esm/browser.js
var ch2 = {};
var wk = (function(c, id, msg, transfer, cb) {
  var w = new Worker(ch2[id] || (ch2[id] = URL.createObjectURL(new Blob([
    c + ';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'
  ], { type: "text/javascript" }))));
  w.onmessage = function(e) {
    var d = e.data, ed = d.$e$;
    if (ed) {
      var err2 = new Error(ed[0]);
      err2["code"] = ed[1];
      err2.stack = ed[2];
      cb(err2, null);
    } else
      cb(null, d);
  };
  w.postMessage(msg, transfer);
  return w;
});
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var adler = function() {
  var a = 1, b = 0;
  return {
    p: function(d) {
      var n = a, m = b;
      var l = d.length | 0;
      for (var i = 0; i != l; ) {
        var e = Math.min(i + 2655, l);
        for (; i < e; ++i)
          m += n += d[i];
        n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
      }
      a = n, b = m;
    },
    d: function() {
      a %= 65521, b %= 65521;
      return (a & 255) << 24 | (a & 65280) << 8 | (b & 255) << 8 | b >> 8;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var wcln = function(fn, fnStr, td2) {
  var dt = fn();
  var st = fn.toString();
  var ks = st.slice(st.indexOf("[") + 1, st.lastIndexOf("]")).replace(/\s+/g, "").split(",");
  for (var i = 0; i < dt.length; ++i) {
    var v = dt[i], k = ks[i];
    if (typeof v == "function") {
      fnStr += ";" + k + "=";
      var st_1 = v.toString();
      if (v.prototype) {
        if (st_1.indexOf("[native code]") != -1) {
          var spInd = st_1.indexOf(" ", 8) + 1;
          fnStr += st_1.slice(spInd, st_1.indexOf("(", spInd));
        } else {
          fnStr += st_1;
          for (var t in v.prototype)
            fnStr += ";" + k + ".prototype." + t + "=" + v.prototype[t].toString();
        }
      } else
        fnStr += st_1;
    } else
      td2[k] = v;
  }
  return fnStr;
};
var ch = [];
var cbfs = function(v) {
  var tl = [];
  for (var k in v) {
    if (v[k].buffer) {
      tl.push((v[k] = new v[k].constructor(v[k])).buffer);
    }
  }
  return tl;
};
var wrkr = function(fns, init, id, cb) {
  if (!ch[id]) {
    var fnStr = "", td_1 = {}, m = fns.length - 1;
    for (var i = 0; i < m; ++i)
      fnStr = wcln(fns[i], fnStr, td_1);
    ch[id] = { c: wcln(fns[m], fnStr, td_1), e: td_1 };
  }
  var td2 = mrg({}, ch[id].e);
  return wk(ch[id].c + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + init.toString() + "}", id, td2, cbfs(td2), cb);
};
var bInflt = function() {
  return [u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gopt];
};
var bDflt = function() {
  return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf];
};
var zle = function() {
  return [zlh, wbytes, adler];
};
var zule = function() {
  return [zls];
};
var pbf = function(msg) {
  return postMessage(msg, [msg.buffer]);
};
var gopt = function(o) {
  return o && {
    out: o.size && new u8(o.size),
    dictionary: o.dictionary
  };
};
var cbify = function(dat, opts, fns, init, id, cb) {
  var w = wrkr(fns, init, id, function(err2, dat2) {
    w.terminate();
    cb(err2, dat2);
  });
  w.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
  return function() {
    w.terminate();
  };
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
var zlh = function(c, o) {
  var lv = o.level, fl2 = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
  c[0] = 120, c[1] = fl2 << 6 | (o.dictionary && 32);
  c[1] |= 31 - (c[0] << 8 | c[1]) % 31;
  if (o.dictionary) {
    var h = adler();
    h.p(o.dictionary);
    wbytes(c, 2, h.d());
  }
};
var zls = function(d, dict) {
  if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31)
    err(6, "invalid zlib data");
  if ((d[1] >> 5 & 1) == +!dict)
    err(6, "invalid zlib data: " + (d[1] & 32 ? "need" : "unexpected") + " dictionary");
  return (d[1] >> 3 & 4) + 2;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
function zlib(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bDflt,
    zle,
    function() {
      return [zlibSync];
    }
  ], function(ev) {
    return pbf(zlibSync(ev.data[0], ev.data[1]));
  }, 4, cb);
}
function zlibSync(data, opts) {
  if (!opts)
    opts = {};
  var a = adler();
  a.p(data);
  var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
  return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}
function unzlib(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bInflt,
    zule,
    function() {
      return [unzlibSync];
    }
  ], function(ev) {
    return pbf(unzlibSync(ev.data[0], gopt(ev.data[1])));
  }, 5, cb);
}
function unzlibSync(data, opts) {
  return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}

// src/media/text-lossless.ts
var TEXT_CODEC_ID = "text-lossless-v1";
var compress = (data, level) => new Promise((resolve, reject) => {
  zlib(data, { level }, (error, output) => {
    if (error) reject(error);
    else resolve(output);
  });
});
var decompress = (data, expectedBytes) => new Promise((resolve, reject) => {
  unzlib(data, { size: expectedBytes }, (error, output) => {
    if (error) reject(error);
    else if (output.byteLength !== expectedBytes) reject(new Error("Decoded frame size does not match its metadata."));
    else resolve(output);
  });
});
var LosslessTextEncoder = class {
  constructor(stream, settings, onFrame) {
    this.stream = stream;
    this.settings = settings;
    this.onFrame = onFrame;
    const context = this.canvas.getContext("2d", { alpha: false, willReadFrequently: true });
    if (!context) throw new Error("Canvas frame processing is unavailable.");
    this.context = context;
    this.video.autoplay = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = stream;
  }
  video = document.createElement("video");
  canvas = document.createElement("canvas");
  context;
  previousFrame;
  timer;
  frameId = 0;
  busy = false;
  stopped = false;
  lastKeyframeAt = 0;
  async start() {
    await this.video.play();
    this.schedule(0);
  }
  updateSettings(settings) {
    this.settings = settings;
    this.previousFrame = void 0;
  }
  requestKeyframe() {
    this.previousFrame = void 0;
  }
  stop() {
    this.stopped = true;
    if (this.timer !== void 0) window.clearTimeout(this.timer);
    this.video.pause();
    this.video.srcObject = null;
  }
  schedule(delay = 1e3 / this.settings.frameRate) {
    if (this.stopped) return;
    this.timer = window.setTimeout(() => void this.capture(), delay);
  }
  async capture() {
    if (this.stopped || this.busy) return this.schedule();
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (!width || !height) return this.schedule(80);
    this.busy = true;
    try {
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.previousFrame = void 0;
      }
      this.context.drawImage(this.video, 0, 0, width, height);
      const pixels = this.context.getImageData(0, 0, width, height).data;
      const now = performance.now();
      const keyframe = !this.previousFrame || now - this.lastKeyframeAt > 15e3;
      const raw = this.encodeChangedTiles(pixels, width, height, keyframe);
      this.previousFrame = pixels.slice();
      if (!raw.tileCount) return;
      if (keyframe) this.lastKeyframeAt = now;
      const data = await compress(raw.data, this.settings.compressionLevel);
      this.onFrame({
        frameId: ++this.frameId,
        width,
        height,
        keyframe,
        tileCount: raw.tileCount,
        rawBytes: raw.data.byteLength,
        data
      });
    } catch {
      this.previousFrame = void 0;
    } finally {
      this.busy = false;
      this.schedule();
    }
  }
  encodeChangedTiles(pixels, frameWidth, frameHeight, keyframe) {
    const tileSize = this.settings.tileSize;
    const tiles = [];
    for (let y = 0; y < frameHeight; y += tileSize) {
      for (let x = 0; x < frameWidth; x += tileSize) {
        const width = Math.min(tileSize, frameWidth - x);
        const height = Math.min(tileSize, frameHeight - y);
        if (!keyframe && this.previousFrame && !tileChanged(pixels, this.previousFrame, frameWidth, x, y, width, height)) continue;
        tiles.push({ x, y, width, height, pixels: copyTile(pixels, frameWidth, x, y, width, height) });
      }
    }
    const byteLength = 2 + tiles.reduce((total, tile) => total + 8 + tile.pixels.byteLength, 0);
    const data = new Uint8Array(byteLength);
    const view = new DataView(data.buffer);
    view.setUint16(0, tiles.length, true);
    let offset = 2;
    for (const tile of tiles) {
      view.setUint16(offset, tile.x, true);
      view.setUint16(offset + 2, tile.y, true);
      view.setUint16(offset + 4, tile.width, true);
      view.setUint16(offset + 6, tile.height, true);
      offset += 8;
      data.set(tile.pixels, offset);
      offset += tile.pixels.byteLength;
    }
    return { data, tileCount: tiles.length };
  }
};
var LosslessTextRenderer = class {
  constructor(canvas) {
    this.canvas = canvas;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas rendering is unavailable.");
    this.context = context;
  }
  context;
  latestFrameId = 0;
  async render(frame) {
    if (frame.frameId <= this.latestFrameId) return;
    const decoded = await decompress(frame.data, frame.rawBytes);
    if (frame.frameId <= this.latestFrameId) return;
    if (frame.keyframe || this.canvas.width !== frame.width || this.canvas.height !== frame.height) {
      this.canvas.width = frame.width;
      this.canvas.height = frame.height;
      this.context.fillStyle = "#17191e";
      this.context.fillRect(0, 0, frame.width, frame.height);
    }
    applyTiles(this.context, decoded);
    this.latestFrameId = frame.frameId;
  }
};
function tileChanged(current, previous, frameWidth, x, y, width, height) {
  const rowBytes = width * 4;
  for (let row = 0; row < height; row += 1) {
    const start = ((y + row) * frameWidth + x) * 4;
    for (let offset = 0; offset < rowBytes; offset += 1) {
      if (current[start + offset] !== previous[start + offset]) return true;
    }
  }
  return false;
}
function copyTile(pixels, frameWidth, x, y, width, height) {
  const result = new Uint8Array(width * height * 4);
  const rowBytes = width * 4;
  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((y + row) * frameWidth + x) * 4;
    result.set(pixels.subarray(sourceStart, sourceStart + rowBytes), row * rowBytes);
  }
  return result;
}
function applyTiles(context, payload) {
  if (payload.byteLength < 2) throw new Error("Text frame is missing its tile count.");
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const tileCount = view.getUint16(0, true);
  let offset = 2;
  for (let index = 0; index < tileCount; index += 1) {
    if (offset + 8 > payload.byteLength) throw new Error("Text frame has a truncated tile header.");
    const x = view.getUint16(offset, true);
    const y = view.getUint16(offset + 2, true);
    const width = view.getUint16(offset + 4, true);
    const height = view.getUint16(offset + 6, true);
    offset += 8;
    const byteLength = width * height * 4;
    if (!width || !height || x + width > context.canvas.width || y + height > context.canvas.height || offset + byteLength > payload.byteLength) throw new Error("Text frame contains an invalid tile.");
    const pixels = new Uint8ClampedArray(byteLength);
    pixels.set(payload.subarray(offset, offset + byteLength));
    context.putImageData(new ImageData(pixels, width, height), x, y);
    offset += byteLength;
  }
  if (offset !== payload.byteLength) throw new Error("Text frame contains trailing bytes.");
}

// src/media/text-transport.ts
var TEXT_TRANSPORT_LIMITS = {
  chunkBytes: 48 * 1024,
  bufferedBytes: 2 * 1024 * 1024,
  queuedMessages: 64,
  compressedFrameBytes: 64 * 1024 * 1024,
  rawFrameBytes: 256 * 1024 * 1024,
  pendingFrameBytes: 64 * 1024 * 1024,
  protocolViolations: 3
};
var TextStreamBroadcaster = class {
  constructor(onKeyframeRequested = () => {
  }) {
    this.onKeyframeRequested = onKeyframeRequested;
  }
  connections = /* @__PURE__ */ new Map();
  add(connection) {
    const entry = { connection, repairPending: false };
    this.connections.set(connection.peer, entry);
    const remove = () => {
      if (this.connections.get(connection.peer)?.connection === connection) this.connections.delete(connection.peer);
    };
    connection.on("data", (value) => {
      if (!isKeyframeRequest(value)) return;
      entry.repairPending = false;
      this.onKeyframeRequested();
    });
    connection.on("close", remove);
    connection.on("error", remove);
  }
  has(peerId2) {
    return this.connections.has(peerId2);
  }
  remove(peerId2) {
    const entry = this.connections.get(peerId2);
    this.connections.delete(peerId2);
    entry?.connection.close();
  }
  send(frame) {
    if (!validEncodedFrame(frame)) return;
    const chunks = splitFrame(frame.data);
    const start = {
      type: "text-frame-start",
      frameId: frame.frameId,
      width: frame.width,
      height: frame.height,
      keyframe: frame.keyframe,
      tileCount: frame.tileCount,
      rawBytes: frame.rawBytes,
      compressedBytes: frame.data.byteLength,
      chunkCount: chunks.length
    };
    for (const entry of this.connections.values()) {
      const { connection } = entry;
      if (!connection.open || isBackpressured(connection)) {
        this.requestRepair(entry);
        continue;
      }
      if (entry.repairPending && !frame.keyframe) {
        this.onKeyframeRequested();
        continue;
      }
      try {
        connection.send(start);
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          connection.send({
            type: "text-frame-chunk",
            frameId: frame.frameId,
            chunkIndex,
            data: chunks[chunkIndex]
          });
        }
        entry.repairPending = false;
      } catch {
        this.requestRepair(entry);
      }
    }
  }
  close() {
    for (const { connection } of this.connections.values()) connection.close();
    this.connections.clear();
  }
  requestRepair(entry) {
    if (entry.repairPending) return;
    entry.repairPending = true;
    this.onKeyframeRequested();
  }
};
var TextStreamReceiver = class {
  constructor(target, connection, onFirstFrame) {
    this.connection = connection;
    this.onFirstFrame = onFirstFrame;
    this.renderer = isFrameRenderer(target) ? target : new LosslessTextRenderer(target);
    connection.on("data", this.receiveBound);
    connection.on("close", this.closeBound);
    connection.on("error", this.closeBound);
  }
  renderer;
  pending = /* @__PURE__ */ new Map();
  receiveBound = (value) => this.receive(value);
  closeBound = () => this.close();
  renderQueue = Promise.resolve();
  lastStartedFrameId = 0;
  generation = 0;
  violations = 0;
  awaitingKeyframe = true;
  repairRequested = false;
  firstFrameRendered = false;
  closed = false;
  close() {
    if (this.closed) return;
    this.closed = true;
    this.generation += 1;
    this.pending.clear();
    this.connection.off("data", this.receiveBound);
    this.connection.off("close", this.closeBound);
    this.connection.off("error", this.closeBound);
  }
  receive(value) {
    if (this.closed) return;
    const packet = parseTextFramePacket(value);
    if (!packet) {
      if (isKnownPacketType(value)) this.protocolViolation();
      return;
    }
    if (packet.type === "text-keyframe-request") return;
    if (packet.type === "text-frame-start") this.startFrame(packet);
    else this.addChunk(packet);
  }
  startFrame(packet) {
    if (packet.frameId <= this.lastStartedFrameId) return this.protocolViolation();
    const hasGap = this.lastStartedFrameId > 0 && packet.frameId !== this.lastStartedFrameId + 1;
    this.lastStartedFrameId = packet.frameId;
    if (hasGap || this.pending.size > 0) this.beginRepair();
    if (this.awaitingKeyframe && !packet.keyframe) {
      this.requestKeyframe();
      return;
    }
    if (packet.keyframe) {
      this.pending.clear();
      this.awaitingKeyframe = false;
      this.repairRequested = false;
    }
    this.pending.set(packet.frameId, { ...packet, chunks: Array(packet.chunkCount), receivedBytes: 0 });
  }
  addChunk(packet) {
    const frame = this.pending.get(packet.frameId);
    if (!frame || packet.chunkIndex >= frame.chunkCount || frame.chunks[packet.chunkIndex]) {
      this.protocolViolation();
      return;
    }
    const chunk = toUint8Array(packet.data);
    const expectedBytes = packet.chunkIndex === frame.chunkCount - 1 ? frame.compressedBytes - TEXT_TRANSPORT_LIMITS.chunkBytes * (frame.chunkCount - 1) : TEXT_TRANSPORT_LIMITS.chunkBytes;
    if (chunk.byteLength !== expectedBytes || frame.receivedBytes + chunk.byteLength > TEXT_TRANSPORT_LIMITS.pendingFrameBytes) {
      this.protocolViolation();
      this.beginRepair();
      return;
    }
    frame.chunks[packet.chunkIndex] = chunk;
    frame.receivedBytes += chunk.byteLength;
    if (frame.chunks.some((candidate) => !candidate)) return;
    this.pending.delete(packet.frameId);
    if (frame.receivedBytes !== frame.compressedBytes) {
      this.protocolViolation();
      this.beginRepair();
      return;
    }
    const generation = this.generation;
    const data = concatenate(frame.chunks, frame.compressedBytes);
    this.renderQueue = this.renderQueue.then(async () => {
      if (this.closed || generation !== this.generation) return;
      await this.renderer.render({ ...frame, data });
      if (!this.firstFrameRendered) {
        this.firstFrameRendered = true;
        this.onFirstFrame();
      }
    }).catch(() => this.beginRepair());
  }
  beginRepair() {
    this.generation += 1;
    this.pending.clear();
    this.awaitingKeyframe = true;
    this.requestKeyframe();
  }
  requestKeyframe() {
    if (this.repairRequested || !this.connection.open) return;
    this.repairRequested = true;
    this.connection.send({
      type: "text-keyframe-request",
      afterFrameId: this.lastStartedFrameId
    });
  }
  protocolViolation() {
    this.violations += 1;
    if (this.violations < TEXT_TRANSPORT_LIMITS.protocolViolations) return;
    this.close();
    this.connection.close();
  }
};
function parseTextFramePacket(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const packet = value;
  if (packet.type === "text-frame-start") {
    if (!validInteger(packet.frameId, 1, Number.MAX_SAFE_INTEGER) || !validInteger(packet.width, 1, 7680) || !validInteger(packet.height, 1, 4320) || typeof packet.keyframe !== "boolean" || !validInteger(packet.tileCount, 1, 16384) || !validInteger(packet.rawBytes, 1, TEXT_TRANSPORT_LIMITS.rawFrameBytes) || !validInteger(packet.compressedBytes, 1, TEXT_TRANSPORT_LIMITS.compressedFrameBytes) || !validInteger(packet.chunkCount, 1, 2048)) return void 0;
    const maximumRawBytes = 2 + packet.tileCount * 8 + packet.width * packet.height * 4;
    const expectedChunks = Math.ceil(packet.compressedBytes / TEXT_TRANSPORT_LIMITS.chunkBytes);
    return packet.rawBytes <= maximumRawBytes && packet.chunkCount === expectedChunks ? packet : void 0;
  }
  if (packet.type === "text-frame-chunk") {
    if (!validInteger(packet.frameId, 1, Number.MAX_SAFE_INTEGER) || !validInteger(packet.chunkIndex, 0, 2047) || !(packet.data instanceof Uint8Array || packet.data instanceof ArrayBuffer) || packet.data.byteLength < 1 || packet.data.byteLength > TEXT_TRANSPORT_LIMITS.chunkBytes) return void 0;
    return packet;
  }
  if (packet.type === "text-keyframe-request") {
    return validInteger(packet.afterFrameId, 0, Number.MAX_SAFE_INTEGER) ? packet : void 0;
  }
  return void 0;
}
function isKnownPacketType(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("type" in value)) return false;
  return ["text-frame-start", "text-frame-chunk", "text-keyframe-request"].includes(String(value.type));
}
function isKeyframeRequest(value) {
  return parseTextFramePacket(value)?.type === "text-keyframe-request";
}
function validEncodedFrame(frame) {
  return validInteger(frame.frameId, 1, Number.MAX_SAFE_INTEGER) && validInteger(frame.width, 1, 7680) && validInteger(frame.height, 1, 4320) && validInteger(frame.tileCount, 1, 16384) && validInteger(frame.rawBytes, 1, TEXT_TRANSPORT_LIMITS.rawFrameBytes) && frame.data.byteLength > 0 && frame.data.byteLength <= TEXT_TRANSPORT_LIMITS.compressedFrameBytes;
}
function isBackpressured(connection) {
  const queuedMessages = connection.bufferSize ?? 0;
  return queuedMessages > TEXT_TRANSPORT_LIMITS.queuedMessages || connection.dataChannel.bufferedAmount > TEXT_TRANSPORT_LIMITS.bufferedBytes;
}
function isFrameRenderer(target) {
  return "render" in target && typeof target.render === "function";
}
function validInteger(value, minimum, maximum) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function splitFrame(data) {
  const chunks = [];
  for (let offset = 0; offset < data.byteLength; offset += TEXT_TRANSPORT_LIMITS.chunkBytes) {
    chunks.push(data.slice(offset, offset + TEXT_TRANSPORT_LIMITS.chunkBytes));
  }
  return chunks;
}
function toUint8Array(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}
function concatenate(chunks, byteLength) {
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

// src/media/presentation.ts
function createTextPresentation(stream, settings) {
  return new BrowserTextPresentation(stream, settings);
}
var BrowserTextPresentation = class {
  constructor(stream, settings) {
    this.stream = stream;
    this.broadcaster = new TextStreamBroadcaster(() => this.encoder.requestKeyframe());
    this.encoder = new LosslessTextEncoder(stream, settings, (frame) => this.broadcaster.send(frame));
  }
  broadcaster;
  encoder;
  outgoingAudioCalls = /* @__PURE__ */ new Map();
  stopped = false;
  get videoTrack() {
    return this.stream.getVideoTracks()[0];
  }
  async start() {
    if (this.stopped) throw new Error("Cannot start a stopped presentation.");
    await this.encoder.start();
  }
  updateSettings(settings) {
    if (!this.stopped) this.encoder.updateSettings(settings);
  }
  connect(peer2, participantId, presenter, mediaToken) {
    if (this.stopped || !mediaToken || participantId === peer2.id || this.broadcaster.has(participantId)) return;
    const textConnection = peer2.connect(participantId, {
      label: `text-${peer2.id}`,
      metadata: { role: "text-stream", presenter, mediaToken },
      serialization: "binary",
      reliable: true
    });
    this.broadcaster.add(textConnection);
    textConnection.on("open", () => this.encoder.requestKeyframe());
    const audioTracks = this.audioTracks();
    if (!audioTracks.length) return;
    const call = peer2.call(participantId, new MediaStream(audioTracks), {
      metadata: { role: "presenter-audio", presenter, mediaToken }
    });
    this.outgoingAudioCalls.get(participantId)?.close();
    this.outgoingAudioCalls.set(participantId, call);
    const remove = () => {
      if (this.outgoingAudioCalls.get(participantId) === call) this.outgoingAudioCalls.delete(participantId);
    };
    call.on("close", remove);
    call.on("error", remove);
  }
  disconnect(participantId) {
    this.broadcaster.remove(participantId);
    const call = this.outgoingAudioCalls.get(participantId);
    this.outgoingAudioCalls.delete(participantId);
    call?.close();
  }
  hasConnection(participantId) {
    return this.broadcaster.has(participantId);
  }
  audioTracks() {
    return this.stream.getAudioTracks().filter((track) => track.readyState === "live");
  }
  setAudioEnabled(enabled) {
    for (const track of this.audioTracks()) track.enabled = enabled;
  }
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.encoder.stop();
    this.broadcaster.close();
    for (const call of this.outgoingAudioCalls.values()) call.close();
    this.outgoingAudioCalls.clear();
    for (const track of this.stream.getTracks()) {
      track.onended = null;
      track.stop();
    }
  }
};

// src/room/internal/admission.ts
var MEDIA_TOKEN_PATTERN = /^[a-f0-9]{32}$/;
var PEER_ID_PATTERN = /^[a-z0-9-]{1,80}$/i;
var RoomAdmission = class {
  constructor(createToken = randomMediaToken) {
    this.createToken = createToken;
  }
  participants = /* @__PURE__ */ new Map();
  role = "none";
  localPeerId = "";
  requiredHostPeerId = "";
  get localMediaToken() {
    return this.participants.get(this.localPeerId) ?? "";
  }
  startHost(hostPeerId) {
    if (!validPeerId(hostPeerId)) throw new Error("Cannot start admission for an invalid host.");
    this.reset();
    this.role = "host";
    this.localPeerId = hostPeerId;
    this.participants.set(hostPeerId, this.issueToken());
  }
  startViewer(hostPeerId) {
    if (!validPeerId(hostPeerId)) throw new Error("Cannot join admission for an invalid host.");
    this.reset();
    this.role = "viewer";
    this.requiredHostPeerId = hostPeerId;
  }
  admit(peerId2) {
    if (this.role !== "host") throw new Error("Only the room host can admit participants.");
    if (!validPeerId(peerId2) || peerId2 === this.localPeerId) throw new Error("Cannot admit an invalid participant.");
    const credential = { peerId: peerId2, mediaToken: this.issueToken() };
    this.participants.set(peerId2, credential.mediaToken);
    return credential;
  }
  accept(localPeerId, mediaToken, participants) {
    if (this.role !== "viewer" || !validPeerId(localPeerId) || !validMediaToken(mediaToken)) return false;
    this.participants.clear();
    this.localPeerId = localPeerId;
    this.participants.set(localPeerId, mediaToken);
    for (const participant of participants) {
      if (participant.peerId === localPeerId || !this.authorize(participant)) {
        this.participants.clear();
        this.localPeerId = "";
        return false;
      }
    }
    if (!this.participants.has(this.requiredHostPeerId)) {
      this.participants.clear();
      this.localPeerId = "";
      return false;
    }
    return true;
  }
  authorize(credential) {
    if (!validPeerId(credential.peerId) || !validMediaToken(credential.mediaToken)) return false;
    if (credential.peerId === this.localPeerId && this.participants.get(this.localPeerId) !== credential.mediaToken) return false;
    this.participants.set(credential.peerId, credential.mediaToken);
    return true;
  }
  revoke(peerId2) {
    if (peerId2 === this.localPeerId) return false;
    return this.participants.delete(peerId2);
  }
  isAuthorized(peerId2, mediaToken) {
    return typeof mediaToken === "string" && this.participants.get(peerId2) === mediaToken;
  }
  credentials(excludePeerId = "") {
    return [...this.participants].filter(([peerId2]) => peerId2 !== excludePeerId).map(([peerId2, mediaToken]) => ({ peerId: peerId2, mediaToken }));
  }
  reset() {
    this.participants.clear();
    this.role = "none";
    this.localPeerId = "";
    this.requiredHostPeerId = "";
  }
  issueToken() {
    const token = this.createToken();
    if (!validMediaToken(token)) throw new Error("Media credential generation failed.");
    return token;
  }
};
function validMediaToken(value) {
  return typeof value === "string" && MEDIA_TOKEN_PATTERN.test(value);
}
function validPeerId(value) {
  return typeof value === "string" && PEER_ID_PATTERN.test(value);
}
function randomMediaToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// src/room/internal/protocol.ts
var ACTIVITY_KINDS = /* @__PURE__ */ new Set(["joined", "left", "stream-started", "stream-stopped", "audio", "settings"]);
function parseHostRoomMessage(value, hostId) {
  const message = record(value);
  if (!message || typeof message.type !== "string") return void 0;
  switch (message.type) {
    case "room-full":
    case "room-closed":
      return { type: message.type };
    case "accepted": {
      const name = boundedString(message.name, 40);
      const acceptedHostId = peerId(message.hostId);
      const participants = parseCredentials(message.participants);
      return name && acceptedHostId && validMediaToken(message.mediaToken) && participants ? { type: "accepted", name, hostId: acceptedHostId, mediaToken: message.mediaToken, participants } : void 0;
    }
    case "participant-authorized": {
      const participant = parseCredential(message.participant);
      return participant ? { type: "participant-authorized", participant } : void 0;
    }
    case "chat-history":
      return Array.isArray(message.messages) ? { type: "chat-history", messages: message.messages.slice(-100).flatMap((entry) => parseChatEntry(entry) ?? []) } : void 0;
    case "chat":
      return parseChatMessage(message);
    case "chat-activity":
      return parseChatActivity(message);
    case "participant-count":
      return validInteger2(message.participantCount, 1, 100) ? { type: "participant-count", participantCount: message.participantCount } : void 0;
    case "room-state":
      return Array.isArray(message.presenters) ? { type: "room-state", presenters: message.presenters.flatMap((entry) => parsePresenter(entry, hostId) ?? []) } : void 0;
    case "stream-started":
    case "stream-settings":
    case "stream-audio": {
      const presenter = parsePresenter(message.presenter, hostId);
      return presenter ? { type: message.type, presenter } : void 0;
    }
    case "stream-stopped": {
      const presenterId = peerId(message.presenterId);
      return presenterId ? { type: "stream-stopped", presenterId } : void 0;
    }
    case "share-approved": {
      if (!Array.isArray(message.participants)) return void 0;
      const participants = message.participants.map(peerId).filter((id) => Boolean(id));
      return participants.length === message.participants.length ? { type: "share-approved", participants } : void 0;
    }
    case "participant-joined":
    case "participant-left": {
      const participantId = peerId(message.peerId);
      return participantId ? { type: message.type, peerId: participantId } : void 0;
    }
    default:
      return void 0;
  }
}
function parseViewerRoomMessage(value) {
  const message = record(value);
  if (!message || typeof message.type !== "string") return void 0;
  switch (message.type) {
    case "stream-started":
      return {
        type: "stream-started",
        streamSettings: parseTextSettings(message.streamSettings),
        audioEnabled: message.audioEnabled === true
      };
    case "stop-presenting":
      return { type: "stop-presenting" };
    case "settings-changed":
    case "settings-selected": {
      const streamSettings = parseTextSettings(message.streamSettings);
      return streamSettings ? { type: message.type, streamSettings } : void 0;
    }
    case "audio-changed":
      return typeof message.audioEnabled === "boolean" ? { type: "audio-changed", audioEnabled: message.audioEnabled } : void 0;
    case "chat": {
      const text = boundedString(message.text, 500);
      return text ? { type: "chat", text } : void 0;
    }
    default:
      return void 0;
  }
}
function parsePresenter(value, hostId) {
  const presenter = record(value);
  if (!presenter) return void 0;
  const id = peerId(presenter.id);
  const name = boundedString(presenter.name, 40);
  const settings = parseTextSettings(presenter.settings);
  if (!id || !name || typeof presenter.audioEnabled !== "boolean" || !settings) return void 0;
  return { id, name, isHost: id === hostId, audioEnabled: presenter.audioEnabled, settings };
}
function parseTextSettings(value) {
  const settings = record(value);
  if (!settings || settings.codec !== TEXT_CODEC_ID || !validInteger2(settings.frameRate, 1, 15) || !validInteger2(settings.compressionLevel, 0, 9) || !validInteger2(settings.tileSize, 64, 512)) return void 0;
  const label = boundedString(settings.label, 80);
  const buttonLabel = boundedString(settings.buttonLabel, 40);
  return label && buttonLabel ? {
    codec: TEXT_CODEC_ID,
    frameRate: settings.frameRate,
    compressionLevel: settings.compressionLevel,
    tileSize: settings.tileSize,
    label,
    buttonLabel
  } : void 0;
}
function parseChatEntry(value) {
  return parseChatMessage(value) ?? parseChatActivity(value);
}
function parseCredentials(value) {
  if (!Array.isArray(value) || value.length > 100) return void 0;
  const credentials = value.map(parseCredential);
  if (credentials.some((credential) => !credential)) return void 0;
  const result = credentials;
  return new Set(result.map(({ peerId: id }) => id)).size === result.length ? result : void 0;
}
function parseCredential(value) {
  const credential = record(value);
  if (!credential) return void 0;
  const credentialPeerId = peerId(credential.peerId);
  return credentialPeerId && validMediaToken(credential.mediaToken) ? { peerId: credentialPeerId, mediaToken: credential.mediaToken } : void 0;
}
function parseChatMessage(value) {
  const message = record(value);
  if (!message || message.type !== "chat" || message.sender !== "host" && message.sender !== "viewer") return void 0;
  const id = boundedString(message.id, 100);
  const senderId = typeof message.senderId === "string" && message.senderId.length <= 80 ? message.senderId : void 0;
  const author = boundedString(message.author, 40);
  const text = boundedString(message.text, 500);
  if (!id || senderId === void 0 || !author || !text || !validTimestamp(message.sentAt)) return void 0;
  return { type: "chat", id, sender: message.sender, senderId, author, text, sentAt: message.sentAt };
}
function parseChatActivity(value) {
  const activity = record(value);
  if (!activity || activity.type !== "chat-activity" || typeof activity.activity !== "string" || !ACTIVITY_KINDS.has(activity.activity)) return void 0;
  const id = boundedString(activity.id, 100);
  const author = boundedString(activity.author, 40);
  const text = boundedString(activity.text, 500);
  if (!id || !author || !text || !validTimestamp(activity.occurredAt)) return void 0;
  return { type: "chat-activity", id, activity: activity.activity, author, text, occurredAt: activity.occurredAt };
}
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function boundedString(value, maximumLength) {
  return typeof value === "string" && value.length > 0 && value.length <= maximumLength ? value : void 0;
}
function peerId(value) {
  return typeof value === "string" && /^[a-z0-9-]{1,80}$/i.test(value) ? value : void 0;
}
function validTimestamp(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function validInteger2(value, minimum, maximum) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

// src/room/internal/session.ts
var INITIAL_STATE = {
  role: "none",
  connection: "idle",
  roomId: "",
  hostId: "",
  viewerName: "",
  presentationPending: false,
  participantCount: 1
};
var RoomSession = class {
  current = { ...INITIAL_STATE };
  get snapshot() {
    return this.current;
  }
  get role() {
    return this.current.role;
  }
  get connection() {
    return this.current.connection;
  }
  get roomId() {
    return this.current.roomId;
  }
  get hostId() {
    return this.current.hostId;
  }
  get viewerName() {
    return this.current.viewerName;
  }
  get presentationPending() {
    return this.current.presentationPending;
  }
  get participantCount() {
    return this.current.participantCount;
  }
  get isHost() {
    return this.current.role === "host";
  }
  get ended() {
    return this.current.connection === "ended";
  }
  startHosting(roomId) {
    this.current = {
      ...INITIAL_STATE,
      role: "host",
      connection: "connecting",
      roomId,
      hostId: roomId
    };
  }
  startJoining(roomId) {
    this.current = {
      ...INITIAL_STATE,
      role: "viewer",
      connection: "connecting",
      roomId,
      hostId: roomId,
      participantCount: 0
    };
  }
  markLive(details = {}) {
    if (this.current.role === "none" || this.ended) return false;
    this.current = {
      ...this.current,
      connection: "live",
      viewerName: details.viewerName ?? this.current.viewerName,
      hostId: details.hostId ?? this.current.hostId
    };
    return true;
  }
  beginPresentation() {
    if (this.current.connection !== "live" || this.current.presentationPending) return false;
    this.current = { ...this.current, presentationPending: true };
    return true;
  }
  finishPresentation() {
    this.current = { ...this.current, presentationPending: false };
  }
  setParticipantCount(participantCount) {
    if (!Number.isSafeInteger(participantCount) || participantCount < 0 || participantCount > 100) return false;
    this.current = { ...this.current, participantCount };
    return true;
  }
  end() {
    if (this.current.role === "none" || this.ended) return false;
    this.current = { ...this.current, connection: "ended", presentationPending: false };
    return true;
  }
  reset() {
    this.current = { ...INITIAL_STATE };
  }
};

// src/app.ts
var $ = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};
var landing = $("#landing");
var room = $("#room");
var streamGrid = $("#stream-grid");
var streamsEmpty = $("#streams-empty");
var qualityMenu = $("#quality-menu");
var toast = $("#toast");
var appBaseUrl = new URL(document.baseURI);
var appBasePath = appBaseUrl.pathname.replace(/\/$/, "");
var qualityPresets = {
  efficient: {
    codec: TEXT_CODEC_ID,
    frameRate: 4,
    compressionLevel: 8,
    tileSize: 128,
    label: "Native pixels \xB7 4 fps \xB7 DEFLATE 8",
    buttonLabel: "Text efficient"
  },
  balanced: {
    codec: TEXT_CODEC_ID,
    frameRate: 6,
    compressionLevel: 6,
    tileSize: 128,
    label: "Native pixels \xB7 6 fps \xB7 DEFLATE 6",
    buttonLabel: "Lossless text"
  },
  responsive: {
    codec: TEXT_CODEC_ID,
    frameRate: 10,
    compressionLevel: 4,
    tileSize: 128,
    label: "Native pixels \xB7 10 fps \xB7 DEFLATE 4",
    buttonLabel: "Text responsive"
  }
};
var peer;
var session = new RoomSession();
var admission = new RoomAdmission();
var viewerControl;
var localPresentation;
var shareAudioEnabled = false;
var maxViewers = 5;
var guestNumber = 0;
var currentQuality = "balanced";
var currentStreamSettings = { ...qualityPresets.balanced };
var rtcConfig = {
  iceServers: [{ urls: ["stun:main.lohr.dev:3478", "stun:stun.l.google.com:19302"] }]
};
var chatAudioContext;
var chatSoundsEnabled = readChatSoundsEnabled();
var toastTimer;
var hostConnections = /* @__PURE__ */ new Map();
var presenters = /* @__PURE__ */ new Map();
var incomingTextConnections = /* @__PURE__ */ new Map();
var incomingAudioCalls = /* @__PURE__ */ new Map();
var remoteAudioElements = /* @__PURE__ */ new Map();
var mutedPresenters = /* @__PURE__ */ new Set();
var chatHistory = [];
var configReady = fetch(appPath("config")).then((response) => response.json()).then((config) => {
  rtcConfig = { iceServers: config.iceServers };
  maxViewers = config.maxViewers;
  updateBandwidthEstimate();
}).catch(() => {
});
function appPath(pathname = "") {
  const suffix = pathname.replace(/^\/+/, "");
  return `${appBasePath}/${suffix}` || "/";
}
function setScreen(screen) {
  landing.hidden = screen !== "landing";
  room.hidden = screen !== "room";
  document.body.dataset.screen = screen;
}
function showToast(message, tone = "default") {
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
function makeRoomId() {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (byte) => alphabet[byte & 31]).join("");
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
function normalizeRoomCode(value) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  return normalized.match(/(?:room\/)?([a-z0-9-]{6,32})\/?$/)?.[1] || "";
}
function peerOptions() {
  const secure = location.protocol === "https:";
  return {
    host: location.hostname,
    port: location.port ? Number(location.port) : secure ? 443 : 80,
    path: appPath("peerjs"),
    secure,
    config: rtcConfig,
    debug: 1
  };
}
function waitForPeerOpen(instance) {
  return new Promise((resolve, reject) => {
    const onOpen = (id) => {
      instance.off("error", onError);
      resolve(id);
    };
    const onError = (error) => {
      instance.off("open", onOpen);
      reject(error);
    };
    instance.once("open", onOpen);
    instance.once("error", onError);
  });
}
async function captureDisplay() {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen sharing is not supported in this browser.");
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: currentStreamSettings.frameRate, max: Math.max(12, currentStreamSettings.frameRate) } },
    audio: shareAudioEnabled
  });
  const videoTrack = stream.getVideoTracks()[0];
  videoTrack.contentHint = "detail";
  videoTrack.onended = () => stopLocalPresentation();
  if (shareAudioEnabled && stream.getAudioTracks().length === 0) {
    showToast("Audio was not available for the selected screen.", "error");
  }
  return stream;
}
async function startSharing() {
  const button = $("#share-button");
  button.disabled = true;
  button.classList.add("loading");
  setShareAudioControlsDisabled(true);
  try {
    const captured = await captureDisplay();
    await configReady;
    session.startHosting(makeRoomId());
    admission.startHost(session.roomId);
    history.replaceState({}, "", appPath(`room/${session.roomId}`));
    prepareRoomShell();
    setRoomConnectionState("waiting", "Opening room");
    peer = new Peer(session.roomId, peerOptions());
    peer.on("connection", routeDataConnection);
    peer.on("call", receiveAudioCall);
    peer.on("error", handleHostPeerError);
    peer.on("disconnected", reconnectPeer);
    await waitForPeerOpen(peer);
    session.markLive();
    setChatEnabled(true);
    setRoomConnectionState("live", "Host \xB7 room open");
    announceSystem("Host", "joined the room.", "joined");
    await beginLocalPresentation(captured);
  } catch (error) {
    disposeLocalPresentation();
    peer?.destroy();
    peer = void 0;
    session.reset();
    admission.reset();
    setScreen("landing");
    history.replaceState({}, "", appPath());
    if (errorName(error) !== "NotAllowedError") {
      showToast(errorMessage(error, "Could not start the room."), "error");
    }
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
    setShareAudioControlsDisabled(Boolean(localPresentation));
  }
}
async function joinRoom(id) {
  session.startJoining(id);
  admission.startViewer(id);
  prepareRoomShell();
  setRoomConnectionState("waiting", "Connecting to host");
  await configReady;
  peer = new Peer(peerOptions());
  peer.on("connection", routeDataConnection);
  peer.on("call", receiveAudioCall);
  peer.on("error", handleViewerPeerError);
  peer.on("disconnected", reconnectPeer);
  try {
    await waitForPeerOpen(peer);
    viewerControl = peer.connect(session.roomId, {
      metadata: { role: "viewer", version: 4 },
      serialization: "json",
      reliable: true
    });
    viewerControl.on("open", () => setRoomConnectionState("waiting", "Waiting for host"));
    viewerControl.on("data", handleRoomMessage);
    viewerControl.on("close", () => {
      if (!peer?.destroyed) endViewer("The room is no longer available.");
    });
    viewerControl.on("error", () => endViewer("Could not reach the room host."));
  } catch (error) {
    handleViewerPeerError(error);
  }
}
function prepareRoomShell() {
  $("#room-code-display").textContent = session.roomId;
  $("#room-title").textContent = `Room ${session.roomId}`;
  $("#leave-room-button span").textContent = session.isHost ? "Close room" : "Leave room";
  setScreen("room");
  updateParticipantCount(session.isHost ? 1 : 0);
  updateRoomUI();
}
function routeDataConnection(connection) {
  if (connection.metadata?.role === "viewer" && session.isHost) {
    acceptViewer(connection);
    return;
  }
  if (connection.metadata?.role === "text-stream") {
    acceptTextStream(connection);
    return;
  }
  connection.close();
}
function acceptViewer(connection) {
  const viewerId = connection.peer;
  if (hostConnections.has(viewerId)) {
    connection.close();
    return;
  }
  if (hostConnections.size >= maxViewers) {
    connection.on("open", () => {
      connection.send({ type: "room-full" });
      setTimeout(() => connection.close(), 100);
    });
    return;
  }
  guestNumber += 1;
  const credential = admission.admit(viewerId);
  hostConnections.set(viewerId, { control: connection, name: `Guest ${guestNumber}`, lastMessageAt: 0 });
  connection.on("open", () => {
    const viewer = hostConnections.get(viewerId);
    if (!viewer || !peer) return;
    connection.send({
      type: "accepted",
      name: viewer.name,
      hostId: peer.id,
      mediaToken: credential.mediaToken,
      participants: admission.credentials(viewerId)
    });
    for (const [participantId, participant] of hostConnections) {
      if (participantId !== viewerId && participant.control.open) {
        participant.control.send({ type: "participant-authorized", participant: credential });
      }
    }
    connection.send({ type: "chat-history", messages: chatHistory });
    connection.send({ type: "room-state", presenters: [...presenters.values()] });
    announceSystem(viewer.name, "joined the room.", "joined");
    broadcastParticipantCount();
    for (const presenter of presenters.values()) {
      if (presenter.id === peer.id) connectLocalStreamTo(viewerId);
      else hostConnections.get(presenter.id)?.control.send({ type: "participant-joined", peerId: viewerId });
    }
  });
  connection.on("data", (value) => handleViewerData(viewerId, value));
  connection.on("close", () => removeViewer(viewerId, connection));
  connection.on("error", () => removeViewer(viewerId, connection));
}
function handleRoomMessage(value) {
  const message = parseHostRoomMessage(value, session.hostId);
  if (!message) return;
  switch (message.type) {
    case "room-full":
      endViewer("This room has reached its participant limit.");
      break;
    case "room-closed":
      endViewer("The room was closed by its host.");
      break;
    case "accepted":
      if (!peer?.id || !admission.accept(peer.id, message.mediaToken, message.participants)) {
        endViewer("The room admission response was invalid.");
        break;
      }
      session.markLive({ viewerName: message.name, hostId: message.hostId });
      setChatEnabled(true);
      setRoomConnectionState("live", `${session.viewerName} \xB7 connected`);
      updateRoomUI();
      break;
    case "participant-authorized":
      admission.authorize(message.participant);
      break;
    case "chat-history":
      loadChatHistory(message.messages);
      break;
    case "chat":
      appendChatEntry(message);
      break;
    case "chat-activity":
      appendChatEntry(message);
      break;
    case "participant-count":
      updateParticipantCount(message.participantCount);
      break;
    case "room-state":
      for (const presenter of message.presenters) upsertPresenter(presenter);
      break;
    case "stream-started":
      upsertPresenter(message.presenter);
      break;
    case "stream-stopped":
      if (message.presenterId) removePresenter(message.presenterId);
      break;
    case "stream-settings":
    case "stream-audio":
      upsertPresenter(message.presenter);
      break;
    case "share-approved":
      session.finishPresentation();
      connectLocalStreamToParticipants(message.participants);
      updateRoomUI();
      break;
    case "participant-joined":
      if (localPresentation) connectLocalStreamTo(message.peerId);
      break;
    case "participant-left":
      admission.revoke(message.peerId);
      disconnectLocalStreamFrom(message.peerId);
      if (presenters.has(message.peerId)) removePresenter(message.peerId);
      break;
  }
}
function handleViewerData(viewerId, value) {
  const message = parseViewerRoomMessage(value);
  if (!message) return;
  const viewer = hostConnections.get(viewerId);
  if (!viewer) return;
  if (message.type === "stream-started") {
    const settings = message.streamSettings || qualityPresets.balanced;
    const presenter = {
      id: viewerId,
      name: viewer.name,
      isHost: false,
      audioEnabled: message.audioEnabled,
      settings
    };
    upsertPresenter(presenter);
    broadcast({ type: "stream-started", presenter });
    announceSystem(viewer.name, "started sharing.", "stream-started");
    const participants = [peer?.id, ...hostConnections.keys()].filter((id) => Boolean(id && id !== viewerId));
    viewer.control.send({ type: "share-approved", participants });
    return;
  }
  if (message.type === "stop-presenting") {
    if (!presenters.has(viewerId)) return;
    removePresenter(viewerId);
    broadcast({ type: "stream-stopped", presenterId: viewerId });
    announceSystem(viewer.name, "stopped sharing.", "stream-stopped");
    return;
  }
  if (message.type === "settings-changed") {
    const settings = message.streamSettings;
    const presenter = presenters.get(viewerId);
    if (!presenter) return;
    const updated = { ...presenter, settings };
    upsertPresenter(updated);
    broadcast({ type: "stream-settings", presenter: updated });
    announceSystem(viewer.name, `changed stream settings to ${settings.buttonLabel} (${settings.label}).`, "settings");
    return;
  }
  if (message.type === "audio-changed") {
    const presenter = presenters.get(viewerId);
    if (!presenter) return;
    const updated = { ...presenter, audioEnabled: message.audioEnabled };
    upsertPresenter(updated);
    broadcast({ type: "stream-audio", presenter: updated });
    announceSystem(viewer.name, message.audioEnabled ? "resumed stream audio." : "stopped sending stream audio.", "audio");
    return;
  }
  if (message.type === "settings-selected") {
    const settings = message.streamSettings;
    announceSystem(viewer.name, `selected ${settings.buttonLabel} (${settings.label}) for their next stream.`, "settings");
    return;
  }
  if (message.type !== "chat") return;
  const text = message.text.trim();
  const now = Date.now();
  if (!text || now - viewer.lastMessageAt < 300) return;
  viewer.lastMessageAt = now;
  const chatMessage = makeChatMessage({ sender: "viewer", senderId: viewerId, author: viewer.name, text });
  rememberChatEntry(chatMessage);
  appendChatEntry(chatMessage);
  broadcast(chatMessage);
}
async function startRoomPresentation() {
  if (localPresentation || session.ended || !peer?.id || !session.beginPresentation()) return;
  updateRoomUI();
  setShareAudioControlsDisabled(true);
  try {
    const stream = await captureDisplay();
    await beginLocalPresentation(stream);
  } catch (error) {
    session.finishPresentation();
    disposeLocalPresentation();
    updateRoomUI();
    if (errorName(error) !== "NotAllowedError") showToast(errorMessage(error, "Could not share this screen."), "error");
  }
}
async function beginLocalPresentation(stream) {
  if (!peer?.id) throw new Error("The room connection is not ready.");
  try {
    localPresentation = createTextPresentation(stream, currentStreamSettings);
  } catch (error) {
    stopMediaStream(stream);
    throw error;
  }
  const presenter = localPresenterInfo();
  upsertPresenter(presenter);
  attachLocalPreview(stream, presenter.id);
  await localPresentation.start();
  if (session.isHost) {
    session.finishPresentation();
    broadcast({ type: "stream-started", presenter });
    announceSystem("Host", "started sharing.", "stream-started");
    connectLocalStreamToParticipants([...hostConnections.keys()]);
  } else if (viewerControl?.open) {
    viewerControl.send({
      type: "stream-started",
      streamSettings: currentStreamSettings,
      audioEnabled: presenter.audioEnabled
    });
  } else {
    throw new Error("The room connection is not ready.");
  }
  updateRoomUI();
}
function localPresenterInfo() {
  return {
    id: peer?.id || "",
    name: session.isHost ? "Host" : session.viewerName || "You",
    isHost: session.isHost,
    audioEnabled: localAudioTracks().some((track) => track.enabled),
    settings: { ...currentStreamSettings }
  };
}
function connectLocalStreamToParticipants(participantIds) {
  for (const participantId of participantIds) connectLocalStreamTo(participantId);
  updateBandwidthEstimate();
}
function connectLocalStreamTo(participantId) {
  if (!peer || !localPresentation) return;
  localPresentation.connect(peer, participantId, localPresenterInfo(), admission.localMediaToken);
  updateBandwidthEstimate();
}
function disconnectLocalStreamFrom(participantId) {
  localPresentation?.disconnect(participantId);
  updateBandwidthEstimate();
}
function acceptTextStream(connection) {
  const presenter = parsePresenter(connection.metadata?.presenter, session.hostId);
  if (!admission.isAuthorized(connection.peer, connection.metadata?.mediaToken) || !presenter || presenter.id !== connection.peer || presenter.id === peer?.id) return connection.close();
  upsertPresenter(presenter);
  incomingTextConnections.get(presenter.id)?.close();
  incomingTextConnections.set(presenter.id, connection);
  const canvas = streamCardMedia(presenter.id, "canvas");
  if (!canvas) return connection.close();
  new TextStreamReceiver(canvas, connection, () => setCardConnected(presenter.id));
  connection.on("close", () => {
    if (incomingTextConnections.get(presenter.id) === connection) incomingTextConnections.delete(presenter.id);
  });
}
function receiveAudioCall(call) {
  const presenter = parsePresenter(call.metadata?.presenter, session.hostId);
  if (call.metadata?.role !== "presenter-audio" || !admission.isAuthorized(call.peer, call.metadata?.mediaToken) || !presenter || presenter.id !== call.peer || presenter.id === peer?.id) {
    call.close();
    return;
  }
  upsertPresenter(presenter);
  incomingAudioCalls.get(presenter.id)?.close();
  incomingAudioCalls.set(presenter.id, call);
  call.answer();
  call.on("stream", (stream) => {
    const audio = remoteAudioElements.get(presenter.id) || document.createElement("audio");
    audio.autoplay = true;
    audio.srcObject = stream;
    audio.muted = mutedPresenters.has(presenter.id);
    remoteAudioElements.set(presenter.id, audio);
    void audio.play().catch(() => showToast(`Click ${presenter.name}\u2019s mute button to enable audio.`));
  });
  call.on("close", () => closeIncomingAudio(presenter.id, call));
  call.on("error", () => closeIncomingAudio(presenter.id, call));
}
function closeIncomingAudio(presenterId, expected) {
  const call = incomingAudioCalls.get(presenterId);
  if (!call || expected && call !== expected) return;
  incomingAudioCalls.delete(presenterId);
  call.close();
  const audio = remoteAudioElements.get(presenterId);
  if (audio) audio.srcObject = null;
  remoteAudioElements.delete(presenterId);
}
function stopLocalPresentation() {
  if (!localPresentation) return;
  const presenterId = peer?.id;
  disposeLocalPresentation();
  session.finishPresentation();
  if (presenterId) removePresenter(presenterId);
  if (presenterId) {
    if (session.isHost) {
      broadcast({ type: "stream-stopped", presenterId });
      announceSystem("Host", "stopped sharing.", "stream-stopped");
    } else {
      viewerControl?.send({ type: "stop-presenting" });
    }
  } else if (!session.isHost) {
    viewerControl?.send({ type: "stop-presenting" });
  }
  updateBandwidthEstimate();
  updateRoomUI();
}
function disposeLocalPresentation() {
  const presentation = localPresentation;
  localPresentation = void 0;
  presentation?.stop();
  setShareAudioControlsDisabled(false);
}
function stopMediaStream(stream) {
  for (const track of stream.getTracks()) {
    track.onended = null;
    track.stop();
  }
}
function localAudioTracks() {
  return localPresentation?.audioTracks() || [];
}
function toggleLocalAudio() {
  const tracks = localAudioTracks();
  if (!tracks.length) return;
  const enabled = !tracks.some((track) => track.enabled);
  localPresentation?.setAudioEnabled(enabled);
  const presenter = localPresenterInfo();
  upsertPresenter(presenter);
  if (session.isHost) {
    broadcast({ type: "stream-audio", presenter });
    announceSystem("Host", enabled ? "resumed stream audio." : "stopped sending stream audio.", "audio");
  } else {
    viewerControl?.send({ type: "audio-changed", audioEnabled: enabled });
  }
  updateRoomUI();
  updateBandwidthEstimate();
  showToast(enabled ? "Stream audio resumed." : "Stream audio stopped.");
}
function upsertPresenter(presenter) {
  presenters.set(presenter.id, presenter);
  renderStreamCard(presenter);
  updateStreamGrid();
}
function removePresenter(presenterId) {
  presenters.delete(presenterId);
  incomingTextConnections.get(presenterId)?.close();
  incomingTextConnections.delete(presenterId);
  closeIncomingAudio(presenterId);
  mutedPresenters.delete(presenterId);
  streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"]`)?.remove();
  updateStreamGrid();
}
function renderStreamCard(presenter) {
  let card = streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenter.id)}"]`);
  const isLocal = presenter.id === peer?.id;
  if (!card) {
    card = document.createElement("article");
    card.className = "stream-card connecting";
    card.dataset.presenterId = presenter.id;
    const media = document.createElement("div");
    media.className = "stream-card-media";
    const visual = document.createElement(isLocal ? "video" : "canvas");
    visual.setAttribute("playsinline", "");
    if (visual instanceof HTMLVideoElement) {
      visual.autoplay = true;
      visual.muted = true;
    }
    const loading = document.createElement("div");
    loading.className = "stream-connecting";
    loading.innerHTML = "<span></span><b>Connecting stream\u2026</b>";
    media.append(visual, loading);
    const footer = document.createElement("footer");
    footer.innerHTML = `
      <div class="stream-person"><span class="stream-avatar"></span><span><strong></strong><small></small></span></div>
      <div class="stream-card-actions"><span class="audio-state"></span><button class="stream-mute" type="button"><svg viewBox="0 0 24 24"><path d="M11 5 6.5 9H3v6h3.5L11 19V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/><path class="muted-line" d="m4 4 16 16"/></svg><span></span></button></div>`;
    footer.querySelector(".stream-mute")?.addEventListener("click", () => toggleRemoteMute(presenter.id));
    card.append(media, footer);
    streamGrid.append(card);
  }
  card.classList.toggle("local-stream", isLocal);
  card.classList.toggle("host-stream", presenter.isHost);
  const avatar = card.querySelector(".stream-avatar");
  const name = card.querySelector(".stream-person strong");
  const settings = card.querySelector(".stream-person small");
  const audioState = card.querySelector(".audio-state");
  if (avatar) avatar.textContent = initials(presenter.name);
  if (name) name.textContent = `${presenter.name}${presenter.isHost ? " \xB7 Host" : ""}${isLocal ? " \xB7 You" : ""}`;
  if (settings) settings.textContent = `${presenter.settings.buttonLabel} \xB7 ${presenter.settings.label}`;
  if (audioState) {
    audioState.textContent = presenter.audioEnabled ? "Audio on" : "No audio";
    audioState.classList.toggle("off", !presenter.audioEnabled);
  }
  updateMuteButton(presenter.id);
}
function attachLocalPreview(stream, presenterId) {
  const video = streamCardMedia(presenterId, "video");
  if (!video) return;
  video.srcObject = stream;
  void video.play().then(() => setCardConnected(presenterId)).catch(() => {
  });
}
function streamCardMedia(presenterId, tag) {
  return streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"] ${tag}`);
}
function setCardConnected(presenterId) {
  streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"]`)?.classList.remove("connecting");
}
function toggleRemoteMute(presenterId) {
  if (presenterId === peer?.id) return;
  if (mutedPresenters.has(presenterId)) mutedPresenters.delete(presenterId);
  else mutedPresenters.add(presenterId);
  const audio = remoteAudioElements.get(presenterId);
  if (audio) {
    audio.muted = mutedPresenters.has(presenterId);
    if (!audio.muted) void audio.play().catch(() => {
    });
  }
  updateMuteButton(presenterId);
}
function updateMuteButton(presenterId) {
  const button = streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"] .stream-mute`);
  if (!button) return;
  const isLocal = presenterId === peer?.id;
  const muted = isLocal || mutedPresenters.has(presenterId);
  button.classList.toggle("muted", muted);
  button.disabled = isLocal;
  button.setAttribute("aria-pressed", String(muted));
  button.setAttribute("aria-label", isLocal ? "Your preview is muted" : muted ? "Unmute this stream" : "Mute this stream");
  const label = button.querySelector("span");
  if (label) label.textContent = isLocal ? "Preview muted" : muted ? "Unmute" : "Mute";
}
function updateStreamGrid() {
  const count = presenters.size;
  streamsEmpty.hidden = count > 0;
  streamGrid.hidden = count === 0;
  streamGrid.dataset.count = String(count);
  $("#stream-count").textContent = count ? `${count} active ${count === 1 ? "stream" : "streams"}` : "No active streams";
  updateRoomUI();
}
function updateRoomUI() {
  const sharing = Boolean(localPresentation);
  const streamButton = $("#stream-button");
  streamButton.disabled = session.ended || session.presentationPending || !session.isHost && !viewerControl?.open;
  streamButton.classList.toggle("stop-stream", sharing);
  const streamButtonLabel = streamButton.querySelector("span");
  if (streamButtonLabel) streamButtonLabel.textContent = sharing ? "Stop sharing" : session.presentationPending ? "Opening picker\u2026" : "Start sharing";
  $("#your-stream-status").textContent = sharing ? `${currentStreamSettings.buttonLabel} \xB7 ${localAudioTracks().some((track) => track.enabled) ? "audio on" : "audio off"}` : session.presentationPending ? "Starting\u2026" : "Not sharing";
  $("#share-audio-option").hidden = sharing;
  const audioButton = $("#local-audio-button");
  const hasAudio = localAudioTracks().length > 0;
  const audioEnabled = localAudioTracks().some((track) => track.enabled);
  audioButton.hidden = !sharing || !hasAudio;
  audioButton.classList.toggle("muted", hasAudio && !audioEnabled);
  const label = audioButton.querySelector("span");
  if (label) label.textContent = audioEnabled ? "Stop audio" : "Resume audio";
}
function setRoomConnectionState(state, label) {
  $("#room-status-dot").className = `status-dot ${state}`;
  $("#room-kicker").textContent = label;
}
function updateParticipantCount(count) {
  if (!session.setParticipantCount(count)) return;
  const label = `${session.participantCount} ${session.participantCount === 1 ? "participant" : "participants"}`;
  document.querySelectorAll("[data-participant-count]").forEach((element) => {
    element.textContent = label;
  });
  updateBandwidthEstimate();
}
function broadcastParticipantCount() {
  updateParticipantCount(hostConnections.size + 1);
  broadcast({ type: "participant-count", participantCount: hostConnections.size + 1 });
}
function removeViewer(viewerId, expectedConnection) {
  const viewer = hostConnections.get(viewerId);
  if (!viewer || expectedConnection && viewer.control !== expectedConnection) return;
  hostConnections.delete(viewerId);
  admission.revoke(viewerId);
  viewer.control.close();
  disconnectLocalStreamFrom(viewerId);
  if (presenters.has(viewerId)) {
    removePresenter(viewerId);
    broadcast({ type: "stream-stopped", presenterId: viewerId });
    announceSystem(viewer.name, "stopped sharing.", "stream-stopped");
  }
  for (const { control } of hostConnections.values()) control.send({ type: "participant-left", peerId: viewerId });
  announceSystem(viewer.name, "left the room.", "left");
  broadcastParticipantCount();
}
async function setQuality(name) {
  const settings = qualityPresets[name];
  currentQuality = name;
  currentStreamSettings = { ...settings };
  localPresentation?.updateSettings(currentStreamSettings);
  const videoTrack = localPresentation?.videoTrack;
  if (videoTrack) {
    try {
      await videoTrack.applyConstraints({ frameRate: { ideal: settings.frameRate, max: Math.max(12, settings.frameRate) } });
    } catch {
    }
  }
  $("#quality-label").textContent = settings.buttonLabel;
  document.querySelectorAll("[data-quality]").forEach((button) => {
    button.classList.toggle("active", button.dataset.quality === name);
  });
  if (localPresentation) {
    const presenter = localPresenterInfo();
    upsertPresenter(presenter);
    if (session.isHost) {
      broadcast({ type: "stream-settings", presenter });
      announceSystem("Host", `changed stream settings to ${settings.buttonLabel} (${settings.label}).`, "settings");
    } else {
      viewerControl?.send({ type: "settings-changed", streamSettings: settings });
    }
  } else if (!room.hidden) {
    if (session.isHost) {
      announceSystem("Host", `selected ${settings.buttonLabel} (${settings.label}) for their next stream.`, "settings");
    } else {
      viewerControl?.send({ type: "settings-selected", streamSettings: settings });
    }
  }
  closeQualityMenu();
  showToast(`${settings.buttonLabel}: ${settings.label}.`);
}
function updateBandwidthEstimate() {
  const audience = localPresentation ? Math.max(0, session.participantCount - 1) : 0;
  const lastFrameEstimate = currentStreamSettings.frameRate * 0.35;
  const estimated = lastFrameEstimate * audience;
  $("#bandwidth-total").textContent = `\u2248${formatMbps(estimated)} Mbps`;
  $("#bandwidth-detail").textContent = `Content-dependent lossless deltas \xD7 ${audience} ${audience === 1 ? "peer" : "peers"}`;
  $("#bandwidth-capacity").textContent = `Text mode is lossless; motion can use substantially more bandwidth.`;
}
function formatMbps(value) {
  return value.toFixed(1).replace(/\.0$/, "");
}
function closeQualityMenu() {
  qualityMenu.hidden = true;
  document.querySelectorAll("[data-quality-trigger]").forEach((button) => button.setAttribute("aria-expanded", "false"));
}
function toggleQualityMenu(button) {
  const willOpen = qualityMenu.hidden;
  closeQualityMenu();
  qualityMenu.hidden = !willOpen;
  button.setAttribute("aria-expanded", String(willOpen));
}
function makeChatMessage({ sender, senderId = "", author, text }) {
  return { type: "chat", id: makeId(), sender, senderId, author, text, sentAt: Date.now() };
}
function makeActivity(author, text, activity) {
  return { type: "chat-activity", id: makeId(), activity, author, text, occurredAt: Date.now() };
}
function announceSystem(author, text, activity) {
  if (!session.isHost) return;
  const entry = makeActivity(author, text, activity);
  rememberChatEntry(entry);
  appendChatEntry(entry);
  broadcast(entry);
}
function makeId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}
function rememberChatEntry(entry) {
  chatHistory.push(entry);
  if (chatHistory.length > 100) chatHistory.shift();
}
function broadcast(message) {
  for (const { control } of hostConnections.values()) {
    if (control.open) control.send(message);
  }
}
function loadChatHistory(messages) {
  for (const entry of messages) appendChatEntry(entry, false);
}
function appendChatEntry(entry, playSound = true) {
  if (entry.type === "chat-activity") appendChatActivity(entry, playSound);
  else appendChatMessage(entry, playSound);
}
function appendChatActivity(activity, playSound = true) {
  const container = room.querySelector("[data-chat-messages]");
  if (!container || container.querySelector(`[data-message-id="${CSS.escape(activity.id)}"]`)) return;
  container.querySelector("[data-chat-empty]")?.remove();
  const item = document.createElement("div");
  item.className = `chat-activity activity-${activity.activity}`;
  item.dataset.messageId = activity.id;
  const icon = document.createElement("i");
  const text = document.createElement("span");
  const author = document.createElement("strong");
  const time = document.createElement("time");
  author.textContent = activity.author;
  text.append(author, ` ${activity.text}`);
  time.dateTime = new Date(activity.occurredAt).toISOString();
  time.dataset.elapsedAt = String(activity.occurredAt);
  time.textContent = formatElapsedTime(activity.occurredAt);
  item.append(icon, text, time);
  container.append(item);
  trimChatEntries(container);
  container.scrollTop = container.scrollHeight;
  if (playSound) playChatSound();
}
function appendChatMessage(message, playSound = true) {
  const container = room.querySelector("[data-chat-messages]");
  if (!container || container.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)) return;
  container.querySelector("[data-chat-empty]")?.remove();
  const isOwn = session.isHost ? message.sender === "host" : message.senderId === peer?.id;
  const article = document.createElement("article");
  article.className = `chat-message${isOwn ? " own" : ""}`;
  article.dataset.messageId = message.id;
  const header = document.createElement("header");
  const author = document.createElement("strong");
  const time = document.createElement("time");
  const body = document.createElement("p");
  author.textContent = isOwn ? "You" : message.author;
  time.dateTime = new Date(message.sentAt).toISOString();
  time.textContent = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(message.sentAt);
  body.textContent = message.text;
  header.append(author, time);
  article.append(header, body);
  container.append(article);
  trimChatEntries(container);
  container.scrollTop = container.scrollHeight;
  if (playSound) playChatSound();
}
function sendChat(form) {
  const input = form.querySelector("[data-chat-input]");
  if (!input) return;
  const text = input.value.trim().slice(0, 500);
  if (!text) return;
  if (session.isHost) {
    const message = makeChatMessage({ sender: "host", author: "Host", text });
    rememberChatEntry(message);
    appendChatEntry(message);
    broadcast(message);
  } else if (viewerControl?.open) {
    viewerControl.send({ type: "chat", text });
  }
  input.value = "";
}
function trimChatEntries(container) {
  while (container.querySelectorAll("[data-message-id]").length > 100) container.querySelector("[data-message-id]")?.remove();
}
function setChatEnabled(enabled) {
  const form = room.querySelector("[data-chat-form]");
  const input = form?.querySelector("input");
  const button = form?.querySelector("button");
  if (input) input.disabled = !enabled;
  if (button) button.disabled = !enabled;
}
function formatElapsedTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1e3));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}
function updateElapsedTimes() {
  document.querySelectorAll("[data-elapsed-at]").forEach((time) => {
    const timestamp = Number(time.dataset.elapsedAt);
    if (Number.isFinite(timestamp)) time.textContent = formatElapsedTime(timestamp);
  });
}
function initials(name) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
function readChatSoundsEnabled() {
  try {
    return localStorage.getItem("mise-chat-sounds") !== "off";
  } catch {
    return true;
  }
}
function syncChatSoundButtons() {
  const action = chatSoundsEnabled ? "Mute notification sounds" : "Enable notification sounds";
  document.querySelectorAll("[data-chat-sound-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(chatSoundsEnabled));
    button.setAttribute("aria-label", action);
    button.title = action;
  });
}
function toggleChatSounds() {
  chatSoundsEnabled = !chatSoundsEnabled;
  try {
    localStorage.setItem("mise-chat-sounds", chatSoundsEnabled ? "on" : "off");
  } catch {
  }
  syncChatSoundButtons();
  if (chatSoundsEnabled) prepareChatAudio();
}
function prepareChatAudio() {
  if (!chatSoundsEnabled) return;
  try {
    chatAudioContext ||= new AudioContext();
    if (chatAudioContext.state === "suspended") void chatAudioContext.resume();
  } catch {
  }
}
function playChatSound() {
  if (!chatSoundsEnabled || !chatAudioContext) return;
  try {
    const context = chatAudioContext;
    const play = () => {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.setValueAtTime(620, now);
      oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.09);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.16);
    };
    if (context.state === "suspended") void context.resume().then(play).catch(() => {
    });
    else play();
  } catch {
  }
}
function reconnectPeer() {
  if (peer && !peer.destroyed) {
    try {
      peer.reconnect();
    } catch {
    }
  }
}
function handleHostPeerError(error) {
  if (error.type === "network" || error.type === "server-error") showToast("The signaling connection was interrupted.", "error");
}
function handleViewerPeerError(error) {
  const type = peerErrorType(error);
  endViewer(type === "peer-unavailable" || type === "unavailable-id" ? "This room isn\u2019t available." : "Could not connect to this room.");
}
function endViewer(message) {
  if (!session.end()) return;
  stopLocalPresentation();
  for (const connection of incomingTextConnections.values()) connection.close();
  incomingTextConnections.clear();
  for (const call of incomingAudioCalls.values()) call.close();
  incomingAudioCalls.clear();
  viewerControl?.close();
  viewerControl = void 0;
  admission.reset();
  setChatEnabled(false);
  setRoomConnectionState("ended", message);
  $("#stream-button").disabled = true;
  showToast(message, "error");
}
function leaveRoom() {
  if (session.isHost) {
    if (!window.confirm("Close this room for everyone?")) return;
    broadcast({ type: "room-closed" });
    for (const { control } of hostConnections.values()) control.close();
    hostConnections.clear();
  }
  disposeLocalPresentation();
  admission.reset();
  peer?.destroy();
  location.href = appPath();
}
async function copyText(value, confirmation) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement("input");
    input.value = value;
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  showToast(confirmation);
}
function setShareAudio(enabled) {
  shareAudioEnabled = enabled;
  document.querySelectorAll("[data-share-audio]").forEach((input) => {
    input.checked = enabled;
  });
}
function setShareAudioControlsDisabled(disabled) {
  document.querySelectorAll("[data-share-audio]").forEach((input) => {
    input.disabled = disabled;
  });
}
function peerErrorType(error) {
  return error && typeof error === "object" && "type" in error && typeof error.type === "string" ? error.type : void 0;
}
function errorName(error) {
  return error instanceof Error ? error.name : void 0;
}
function errorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}
$("#share-button").addEventListener("click", startSharing);
$("#stream-button").addEventListener("click", () => localPresentation ? stopLocalPresentation() : startRoomPresentation());
$("#local-audio-button").addEventListener("click", toggleLocalAudio);
$("#leave-room-button").addEventListener("click", leaveRoom);
$("#copy-room-code").addEventListener("click", () => void copyText(session.roomId, "Room code copied."));
$("#copy-invite-button").addEventListener("click", () => void copyText(`${location.origin}${appPath(`room/${session.roomId}`)}`, "Invite link copied."));
document.querySelectorAll("[data-share-audio]").forEach((input) => {
  input.addEventListener("change", () => setShareAudio(input.checked));
});
room.querySelector("[data-chat-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendChat(event.currentTarget);
});
syncChatSoundButtons();
document.querySelectorAll("[data-chat-sound-toggle]").forEach((button) => button.addEventListener("click", toggleChatSounds));
document.addEventListener("pointerdown", prepareChatAudio, { once: true, passive: true });
document.addEventListener("keydown", prepareChatAudio, { once: true });
setInterval(updateElapsedTimes, 3e4);
document.querySelectorAll("[data-quality-trigger]").forEach((button) => {
  button.addEventListener("click", () => toggleQualityMenu(button));
});
document.querySelectorAll("[data-quality]").forEach((button) => {
  button.addEventListener("click", () => {
    const quality = button.dataset.quality;
    if (quality && quality in qualityPresets) void setQuality(quality);
  });
});
document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest("[data-quality-trigger]") && !target?.closest("#quality-menu")) closeQualityMenu();
});
$("#join-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const id = normalizeRoomCode($("#room-code").value);
  if (!id) return showToast("Enter a valid room code.", "error");
  location.href = appPath(`room/${id}`);
});
var relativePath = location.pathname.startsWith(appBasePath) ? location.pathname.slice(appBasePath.length) || "/" : location.pathname;
var routeMatch = relativePath.match(/^\/room\/([a-z0-9-]{6,32})\/?$/i);
if (routeMatch) void joinRoom(routeMatch[1].toLowerCase());
else setScreen("landing");
