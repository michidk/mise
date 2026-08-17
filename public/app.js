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
  schedule(delay2 = 1e3 / this.settings.frameRate) {
    if (this.stopped) return;
    this.timer = window.setTimeout(() => void this.capture(), delay2);
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
    const opened = () => this.onKeyframeRequested();
    const remove = () => {
      const current = this.connections.get(connection.peerId);
      if (current?.connection === connection) {
        current.detach();
        this.connections.delete(connection.peerId);
      }
    };
    const receive = (value) => {
      if (!isKeyframeRequest(value)) return;
      entry.repairPending = false;
      this.onKeyframeRequested();
    };
    const entry = {
      connection,
      repairPending: false,
      detach: () => {
        connection.off("open", opened);
        connection.off("message", receive);
        connection.off("close", remove);
        connection.off("error", remove);
      }
    };
    this.connections.set(connection.peerId, entry);
    connection.on("open", opened);
    connection.on("message", receive);
    connection.on("close", remove);
    connection.on("error", remove);
  }
  has(peerId2) {
    return this.connections.has(peerId2);
  }
  remove(peerId2, closeConnection = true) {
    const entry = this.connections.get(peerId2);
    this.connections.delete(peerId2);
    entry?.detach();
    if (closeConnection) entry?.connection.close();
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
  close(closeConnections = true) {
    for (const entry of this.connections.values()) {
      entry.detach();
      if (closeConnections) entry.connection.close();
    }
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
    connection.on("message", this.receiveBound);
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
    this.connection.off("message", this.receiveBound);
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
  return connection.bufferedAmount > TEXT_TRANSPORT_LIMITS.bufferedBytes;
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
  connect(participantId, channel) {
    if (this.stopped || this.broadcaster.has(participantId)) return;
    this.broadcaster.add(channel);
    if (channel.open) this.encoder.requestKeyframe();
  }
  disconnect(participantId) {
    this.broadcaster.remove(participantId, false);
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
    this.broadcaster.close(false);
    for (const track of this.stream.getTracks()) {
      track.onended = null;
      track.stop();
    }
  }
};

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
      return name && acceptedHostId ? { type: "accepted", name, hostId: acceptedHostId } : void 0;
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
  startHosting(roomId, hostId = roomId) {
    this.current = {
      ...INITIAL_STATE,
      role: "host",
      connection: "connecting",
      roomId,
      hostId
    };
  }
  startJoining(roomId) {
    this.current = {
      ...INITIAL_STATE,
      role: "viewer",
      connection: "connecting",
      roomId,
      hostId: "",
      participantCount: 0
    };
  }
  setLocalPeer(_localPeerId, hostId) {
    if (this.current.role !== "viewer" || this.ended || !hostId) return false;
    this.current = { ...this.current, hostId };
    return true;
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

// node_modules/@msgpack/msgpack/dist.esm/utils/utf8.mjs
function utf8Count(str) {
  const strLength = str.length;
  let byteLength = 0;
  let pos = 0;
  while (pos < strLength) {
    let value = str.charCodeAt(pos++);
    if ((value & 4294967168) === 0) {
      byteLength++;
      continue;
    } else if ((value & 4294965248) === 0) {
      byteLength += 2;
    } else {
      if (value >= 55296 && value <= 56319) {
        if (pos < strLength) {
          const extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
      }
      if ((value & 4294901760) === 0) {
        byteLength += 3;
      } else {
        byteLength += 4;
      }
    }
  }
  return byteLength;
}
function utf8EncodeJs(str, output, outputOffset) {
  const strLength = str.length;
  let offset = outputOffset;
  let pos = 0;
  while (pos < strLength) {
    let value = str.charCodeAt(pos++);
    if ((value & 4294967168) === 0) {
      output[offset++] = value;
      continue;
    } else if ((value & 4294965248) === 0) {
      output[offset++] = value >> 6 & 31 | 192;
    } else {
      if (value >= 55296 && value <= 56319) {
        if (pos < strLength) {
          const extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
      }
      if ((value & 4294901760) === 0) {
        output[offset++] = value >> 12 & 15 | 224;
        output[offset++] = value >> 6 & 63 | 128;
      } else {
        output[offset++] = value >> 18 & 7 | 240;
        output[offset++] = value >> 12 & 63 | 128;
        output[offset++] = value >> 6 & 63 | 128;
      }
    }
    output[offset++] = value & 63 | 128;
  }
}
var sharedTextEncoder = new TextEncoder();
var TEXT_ENCODER_THRESHOLD = 50;
function utf8EncodeTE(str, output, outputOffset) {
  sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
}
function utf8Encode(str, output, outputOffset) {
  if (str.length > TEXT_ENCODER_THRESHOLD) {
    utf8EncodeTE(str, output, outputOffset);
  } else {
    utf8EncodeJs(str, output, outputOffset);
  }
}
var CHUNK_SIZE = 4096;
function utf8DecodeJs(bytes, inputOffset, byteLength) {
  let offset = inputOffset;
  const end = offset + byteLength;
  const units = [];
  let result = "";
  while (offset < end) {
    const byte1 = bytes[offset++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      const byte2 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 6 | byte2);
    } else if ((byte1 & 240) === 224) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
    } else if ((byte1 & 248) === 240) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      const byte4 = bytes[offset++] & 63;
      let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (unit > 65535) {
        unit -= 65536;
        units.push(unit >>> 10 & 1023 | 55296);
        unit = 56320 | unit & 1023;
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }
    if (units.length >= CHUNK_SIZE) {
      result += String.fromCharCode(...units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += String.fromCharCode(...units);
  }
  return result;
}
var sharedTextDecoder = new TextDecoder();
var TEXT_DECODER_THRESHOLD = 200;
function utf8DecodeTD(bytes, inputOffset, byteLength) {
  const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
  return sharedTextDecoder.decode(stringBytes);
}
function utf8Decode(bytes, inputOffset, byteLength) {
  if (byteLength > TEXT_DECODER_THRESHOLD) {
    return utf8DecodeTD(bytes, inputOffset, byteLength);
  } else {
    return utf8DecodeJs(bytes, inputOffset, byteLength);
  }
}

// node_modules/@msgpack/msgpack/dist.esm/ExtData.mjs
var ExtData = class {
  type;
  data;
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
};

// node_modules/@msgpack/msgpack/dist.esm/DecodeError.mjs
var DecodeError = class _DecodeError extends Error {
  constructor(message) {
    super(message);
    const proto = Object.create(_DecodeError.prototype);
    Object.setPrototypeOf(this, proto);
    Object.defineProperty(this, "name", {
      configurable: true,
      enumerable: false,
      value: _DecodeError.name
    });
  }
};

// node_modules/@msgpack/msgpack/dist.esm/utils/int.mjs
var UINT32_MAX = 4294967295;
function setUint64(view, offset, value) {
  const high = value / 4294967296;
  const low = value;
  view.setUint32(offset, high);
  view.setUint32(offset + 4, low);
}
function setInt64(view, offset, value) {
  const high = Math.floor(value / 4294967296);
  const low = value;
  view.setUint32(offset, high);
  view.setUint32(offset + 4, low);
}
function getInt64(view, offset) {
  const high = view.getInt32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}
function getUint64(view, offset) {
  const high = view.getUint32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}

// node_modules/@msgpack/msgpack/dist.esm/timestamp.mjs
var EXT_TIMESTAMP = -1;
var TIMESTAMP32_MAX_SEC = 4294967296 - 1;
var TIMESTAMP64_MAX_SEC = 17179869184 - 1;
function encodeTimeSpecToTimestamp({ sec, nsec }) {
  if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
    if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
      const rv = new Uint8Array(4);
      const view = new DataView(rv.buffer);
      view.setUint32(0, sec);
      return rv;
    } else {
      const secHigh = sec / 4294967296;
      const secLow = sec & 4294967295;
      const rv = new Uint8Array(8);
      const view = new DataView(rv.buffer);
      view.setUint32(0, nsec << 2 | secHigh & 3);
      view.setUint32(4, secLow);
      return rv;
    }
  } else {
    const rv = new Uint8Array(12);
    const view = new DataView(rv.buffer);
    view.setUint32(0, nsec);
    setInt64(view, 4, sec);
    return rv;
  }
}
function encodeDateToTimeSpec(date) {
  const msec = date.getTime();
  const sec = Math.floor(msec / 1e3);
  const nsec = (msec - sec * 1e3) * 1e6;
  const nsecInSec = Math.floor(nsec / 1e9);
  return {
    sec: sec + nsecInSec,
    nsec: nsec - nsecInSec * 1e9
  };
}
function encodeTimestampExtension(object) {
  if (object instanceof Date) {
    const timeSpec = encodeDateToTimeSpec(object);
    return encodeTimeSpecToTimestamp(timeSpec);
  } else {
    return null;
  }
}
function decodeTimestampToTimeSpec(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  switch (data.byteLength) {
    case 4: {
      const sec = view.getUint32(0);
      const nsec = 0;
      return { sec, nsec };
    }
    case 8: {
      const nsec30AndSecHigh2 = view.getUint32(0);
      const secLow32 = view.getUint32(4);
      const sec = (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32;
      const nsec = nsec30AndSecHigh2 >>> 2;
      return { sec, nsec };
    }
    case 12: {
      const sec = getInt64(view, 4);
      const nsec = view.getUint32(0);
      return { sec, nsec };
    }
    default:
      throw new DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
  }
}
function decodeTimestampExtension(data) {
  const timeSpec = decodeTimestampToTimeSpec(data);
  return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
}
var timestampExtension = {
  type: EXT_TIMESTAMP,
  encode: encodeTimestampExtension,
  decode: decodeTimestampExtension
};

// node_modules/@msgpack/msgpack/dist.esm/ExtensionCodec.mjs
var ExtensionCodec = class _ExtensionCodec {
  static defaultCodec = new _ExtensionCodec();
  // ensures ExtensionCodecType<X> matches ExtensionCodec<X>
  // this will make type errors a lot more clear
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __brand;
  // built-in extensions
  builtInEncoders = [];
  builtInDecoders = [];
  // custom extensions
  encoders = [];
  decoders = [];
  constructor() {
    this.register(timestampExtension);
  }
  register({ type, encode: encode2, decode: decode2 }) {
    if (type >= 0) {
      this.encoders[type] = encode2;
      this.decoders[type] = decode2;
    } else {
      const index = -1 - type;
      this.builtInEncoders[index] = encode2;
      this.builtInDecoders[index] = decode2;
    }
  }
  tryToEncode(object, context) {
    for (let i = 0; i < this.builtInEncoders.length; i++) {
      const encodeExt = this.builtInEncoders[i];
      if (encodeExt != null) {
        const data = encodeExt(object, context);
        if (data != null) {
          const type = -1 - i;
          return new ExtData(type, data);
        }
      }
    }
    for (let i = 0; i < this.encoders.length; i++) {
      const encodeExt = this.encoders[i];
      if (encodeExt != null) {
        const data = encodeExt(object, context);
        if (data != null) {
          const type = i;
          return new ExtData(type, data);
        }
      }
    }
    if (object instanceof ExtData) {
      return object;
    }
    return null;
  }
  decode(data, type, context) {
    const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
    if (decodeExt) {
      return decodeExt(data, type, context);
    } else {
      return new ExtData(type, data);
    }
  }
};

// node_modules/@msgpack/msgpack/dist.esm/utils/typedArrays.mjs
function isArrayBufferLike(buffer) {
  return buffer instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer;
}
function ensureUint8Array(buffer) {
  if (buffer instanceof Uint8Array) {
    return buffer;
  } else if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (isArrayBufferLike(buffer)) {
    return new Uint8Array(buffer);
  } else {
    return Uint8Array.from(buffer);
  }
}

// node_modules/@msgpack/msgpack/dist.esm/Encoder.mjs
var DEFAULT_MAX_DEPTH = 100;
var DEFAULT_INITIAL_BUFFER_SIZE = 2048;
var Encoder = class _Encoder {
  extensionCodec;
  context;
  useBigInt64;
  maxDepth;
  initialBufferSize;
  sortKeys;
  forceFloat32;
  ignoreUndefined;
  forceIntegerToFloat;
  pos;
  view;
  bytes;
  entered = false;
  constructor(options) {
    this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
    this.context = options?.context;
    this.useBigInt64 = options?.useBigInt64 ?? false;
    this.maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
    this.initialBufferSize = options?.initialBufferSize ?? DEFAULT_INITIAL_BUFFER_SIZE;
    this.sortKeys = options?.sortKeys ?? false;
    this.forceFloat32 = options?.forceFloat32 ?? false;
    this.ignoreUndefined = options?.ignoreUndefined ?? false;
    this.forceIntegerToFloat = options?.forceIntegerToFloat ?? false;
    this.pos = 0;
    this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
    this.bytes = new Uint8Array(this.view.buffer);
  }
  clone() {
    return new _Encoder({
      extensionCodec: this.extensionCodec,
      context: this.context,
      useBigInt64: this.useBigInt64,
      maxDepth: this.maxDepth,
      initialBufferSize: this.initialBufferSize,
      sortKeys: this.sortKeys,
      forceFloat32: this.forceFloat32,
      ignoreUndefined: this.ignoreUndefined,
      forceIntegerToFloat: this.forceIntegerToFloat
    });
  }
  reinitializeState() {
    this.pos = 0;
  }
  /**
   * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
   *
   * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
   */
  encodeSharedRef(object) {
    if (this.entered) {
      const instance = this.clone();
      return instance.encodeSharedRef(object);
    }
    try {
      this.entered = true;
      this.reinitializeState();
      this.doEncode(object, 1);
      return this.bytes.subarray(0, this.pos);
    } finally {
      this.entered = false;
    }
  }
  /**
   * @returns Encodes the object and returns a copy of the encoder's internal buffer.
   */
  encode(object) {
    if (this.entered) {
      const instance = this.clone();
      return instance.encode(object);
    }
    try {
      this.entered = true;
      this.reinitializeState();
      this.doEncode(object, 1);
      return this.bytes.slice(0, this.pos);
    } finally {
      this.entered = false;
    }
  }
  doEncode(object, depth) {
    if (depth > this.maxDepth) {
      throw new Error(`Too deep objects in depth ${depth}`);
    }
    if (object == null) {
      this.encodeNil();
    } else if (typeof object === "boolean") {
      this.encodeBoolean(object);
    } else if (typeof object === "number") {
      if (!this.forceIntegerToFloat) {
        this.encodeNumber(object);
      } else {
        this.encodeNumberAsFloat(object);
      }
    } else if (typeof object === "string") {
      this.encodeString(object);
    } else if (this.useBigInt64 && typeof object === "bigint") {
      this.encodeBigInt64(object);
    } else {
      this.encodeObject(object, depth);
    }
  }
  ensureBufferSizeToWrite(sizeToWrite) {
    const requiredSize = this.pos + sizeToWrite;
    if (this.view.byteLength < requiredSize) {
      this.resizeBuffer(requiredSize * 2);
    }
  }
  resizeBuffer(newSize) {
    const newBuffer = new ArrayBuffer(newSize);
    const newBytes = new Uint8Array(newBuffer);
    const newView = new DataView(newBuffer);
    newBytes.set(this.bytes);
    this.view = newView;
    this.bytes = newBytes;
  }
  encodeNil() {
    this.writeU8(192);
  }
  encodeBoolean(object) {
    if (object === false) {
      this.writeU8(194);
    } else {
      this.writeU8(195);
    }
  }
  encodeNumber(object) {
    if (!this.forceIntegerToFloat && Number.isSafeInteger(object)) {
      if (object >= 0) {
        if (object < 128) {
          this.writeU8(object);
        } else if (object < 256) {
          this.writeU8(204);
          this.writeU8(object);
        } else if (object < 65536) {
          this.writeU8(205);
          this.writeU16(object);
        } else if (object < 4294967296) {
          this.writeU8(206);
          this.writeU32(object);
        } else if (!this.useBigInt64) {
          this.writeU8(207);
          this.writeU64(object);
        } else {
          this.encodeNumberAsFloat(object);
        }
      } else {
        if (object >= -32) {
          this.writeU8(224 | object + 32);
        } else if (object >= -128) {
          this.writeU8(208);
          this.writeI8(object);
        } else if (object >= -32768) {
          this.writeU8(209);
          this.writeI16(object);
        } else if (object >= -2147483648) {
          this.writeU8(210);
          this.writeI32(object);
        } else if (!this.useBigInt64) {
          this.writeU8(211);
          this.writeI64(object);
        } else {
          this.encodeNumberAsFloat(object);
        }
      }
    } else {
      this.encodeNumberAsFloat(object);
    }
  }
  encodeNumberAsFloat(object) {
    if (this.forceFloat32) {
      this.writeU8(202);
      this.writeF32(object);
    } else {
      this.writeU8(203);
      this.writeF64(object);
    }
  }
  encodeBigInt64(object) {
    if (object >= BigInt(0)) {
      this.writeU8(207);
      this.writeBigUint64(object);
    } else {
      this.writeU8(211);
      this.writeBigInt64(object);
    }
  }
  writeStringHeader(byteLength) {
    if (byteLength < 32) {
      this.writeU8(160 + byteLength);
    } else if (byteLength < 256) {
      this.writeU8(217);
      this.writeU8(byteLength);
    } else if (byteLength < 65536) {
      this.writeU8(218);
      this.writeU16(byteLength);
    } else if (byteLength < 4294967296) {
      this.writeU8(219);
      this.writeU32(byteLength);
    } else {
      throw new Error(`Too long string: ${byteLength} bytes in UTF-8`);
    }
  }
  encodeString(object) {
    const maxHeaderSize = 1 + 4;
    const byteLength = utf8Count(object);
    this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
    this.writeStringHeader(byteLength);
    utf8Encode(object, this.bytes, this.pos);
    this.pos += byteLength;
  }
  encodeObject(object, depth) {
    const ext = this.extensionCodec.tryToEncode(object, this.context);
    if (ext != null) {
      this.encodeExtension(ext);
    } else if (Array.isArray(object)) {
      this.encodeArray(object, depth);
    } else if (ArrayBuffer.isView(object)) {
      this.encodeBinary(object);
    } else if (typeof object === "object") {
      this.encodeMap(object, depth);
    } else {
      throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
    }
  }
  encodeBinary(object) {
    const size = object.byteLength;
    if (size < 256) {
      this.writeU8(196);
      this.writeU8(size);
    } else if (size < 65536) {
      this.writeU8(197);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(198);
      this.writeU32(size);
    } else {
      throw new Error(`Too large binary: ${size}`);
    }
    const bytes = ensureUint8Array(object);
    this.writeU8a(bytes);
  }
  encodeArray(object, depth) {
    const size = object.length;
    if (size < 16) {
      this.writeU8(144 + size);
    } else if (size < 65536) {
      this.writeU8(220);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(221);
      this.writeU32(size);
    } else {
      throw new Error(`Too large array: ${size}`);
    }
    for (const item of object) {
      this.doEncode(item, depth + 1);
    }
  }
  countWithoutUndefined(object, keys) {
    let count = 0;
    for (const key of keys) {
      if (object[key] !== void 0) {
        count++;
      }
    }
    return count;
  }
  encodeMap(object, depth) {
    const keys = Object.keys(object);
    if (this.sortKeys) {
      keys.sort();
    }
    const size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
    if (size < 16) {
      this.writeU8(128 + size);
    } else if (size < 65536) {
      this.writeU8(222);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(223);
      this.writeU32(size);
    } else {
      throw new Error(`Too large map object: ${size}`);
    }
    for (const key of keys) {
      const value = object[key];
      if (!(this.ignoreUndefined && value === void 0)) {
        this.encodeString(key);
        this.doEncode(value, depth + 1);
      }
    }
  }
  encodeExtension(ext) {
    if (typeof ext.data === "function") {
      const data = ext.data(this.pos + 6);
      const size2 = data.length;
      if (size2 >= 4294967296) {
        throw new Error(`Too large extension object: ${size2}`);
      }
      this.writeU8(201);
      this.writeU32(size2);
      this.writeI8(ext.type);
      this.writeU8a(data);
      return;
    }
    const size = ext.data.length;
    if (size === 1) {
      this.writeU8(212);
    } else if (size === 2) {
      this.writeU8(213);
    } else if (size === 4) {
      this.writeU8(214);
    } else if (size === 8) {
      this.writeU8(215);
    } else if (size === 16) {
      this.writeU8(216);
    } else if (size < 256) {
      this.writeU8(199);
      this.writeU8(size);
    } else if (size < 65536) {
      this.writeU8(200);
      this.writeU16(size);
    } else if (size < 4294967296) {
      this.writeU8(201);
      this.writeU32(size);
    } else {
      throw new Error(`Too large extension object: ${size}`);
    }
    this.writeI8(ext.type);
    this.writeU8a(ext.data);
  }
  writeU8(value) {
    this.ensureBufferSizeToWrite(1);
    this.view.setUint8(this.pos, value);
    this.pos++;
  }
  writeU8a(values) {
    const size = values.length;
    this.ensureBufferSizeToWrite(size);
    this.bytes.set(values, this.pos);
    this.pos += size;
  }
  writeI8(value) {
    this.ensureBufferSizeToWrite(1);
    this.view.setInt8(this.pos, value);
    this.pos++;
  }
  writeU16(value) {
    this.ensureBufferSizeToWrite(2);
    this.view.setUint16(this.pos, value);
    this.pos += 2;
  }
  writeI16(value) {
    this.ensureBufferSizeToWrite(2);
    this.view.setInt16(this.pos, value);
    this.pos += 2;
  }
  writeU32(value) {
    this.ensureBufferSizeToWrite(4);
    this.view.setUint32(this.pos, value);
    this.pos += 4;
  }
  writeI32(value) {
    this.ensureBufferSizeToWrite(4);
    this.view.setInt32(this.pos, value);
    this.pos += 4;
  }
  writeF32(value) {
    this.ensureBufferSizeToWrite(4);
    this.view.setFloat32(this.pos, value);
    this.pos += 4;
  }
  writeF64(value) {
    this.ensureBufferSizeToWrite(8);
    this.view.setFloat64(this.pos, value);
    this.pos += 8;
  }
  writeU64(value) {
    this.ensureBufferSizeToWrite(8);
    setUint64(this.view, this.pos, value);
    this.pos += 8;
  }
  writeI64(value) {
    this.ensureBufferSizeToWrite(8);
    setInt64(this.view, this.pos, value);
    this.pos += 8;
  }
  writeBigUint64(value) {
    this.ensureBufferSizeToWrite(8);
    this.view.setBigUint64(this.pos, value);
    this.pos += 8;
  }
  writeBigInt64(value) {
    this.ensureBufferSizeToWrite(8);
    this.view.setBigInt64(this.pos, value);
    this.pos += 8;
  }
};

// node_modules/@msgpack/msgpack/dist.esm/encode.mjs
function encode(value, options) {
  const encoder = new Encoder(options);
  return encoder.encodeSharedRef(value);
}

// node_modules/@msgpack/msgpack/dist.esm/utils/prettyByte.mjs
function prettyByte(byte) {
  return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
}

// node_modules/@msgpack/msgpack/dist.esm/CachedKeyDecoder.mjs
var DEFAULT_MAX_KEY_LENGTH = 16;
var DEFAULT_MAX_LENGTH_PER_KEY = 16;
var CachedKeyDecoder = class {
  hit = 0;
  miss = 0;
  caches;
  maxKeyLength;
  maxLengthPerKey;
  constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
    this.maxKeyLength = maxKeyLength;
    this.maxLengthPerKey = maxLengthPerKey;
    this.caches = [];
    for (let i = 0; i < this.maxKeyLength; i++) {
      this.caches.push([]);
    }
  }
  canBeCached(byteLength) {
    return byteLength > 0 && byteLength <= this.maxKeyLength;
  }
  find(bytes, inputOffset, byteLength) {
    const records = this.caches[byteLength - 1];
    FIND_CHUNK: for (const record2 of records) {
      const recordBytes = record2.bytes;
      for (let j = 0; j < byteLength; j++) {
        if (recordBytes[j] !== bytes[inputOffset + j]) {
          continue FIND_CHUNK;
        }
      }
      return record2.str;
    }
    return null;
  }
  store(bytes, value) {
    const records = this.caches[bytes.length - 1];
    const record2 = { bytes, str: value };
    if (records.length >= this.maxLengthPerKey) {
      records[Math.random() * records.length | 0] = record2;
    } else {
      records.push(record2);
    }
  }
  decode(bytes, inputOffset, byteLength) {
    const cachedValue = this.find(bytes, inputOffset, byteLength);
    if (cachedValue != null) {
      this.hit++;
      return cachedValue;
    }
    this.miss++;
    const str = utf8DecodeJs(bytes, inputOffset, byteLength);
    const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
    this.store(slicedCopyOfBytes, str);
    return str;
  }
};

// node_modules/@msgpack/msgpack/dist.esm/Decoder.mjs
var STATE_ARRAY = "array";
var STATE_MAP_KEY = "map_key";
var STATE_MAP_VALUE = "map_value";
var mapKeyConverter = (key) => {
  if (typeof key === "string" || typeof key === "number") {
    return key;
  }
  throw new DecodeError("The type of key must be string or number but " + typeof key);
};
var StackPool = class {
  stack = [];
  stackHeadPosition = -1;
  get length() {
    return this.stackHeadPosition + 1;
  }
  top() {
    return this.stack[this.stackHeadPosition];
  }
  pushArrayState(size) {
    const state = this.getUninitializedStateFromPool();
    state.type = STATE_ARRAY;
    state.position = 0;
    state.size = size;
    state.array = new Array(size);
  }
  pushMapState(size) {
    const state = this.getUninitializedStateFromPool();
    state.type = STATE_MAP_KEY;
    state.readCount = 0;
    state.size = size;
    state.map = {};
  }
  getUninitializedStateFromPool() {
    this.stackHeadPosition++;
    if (this.stackHeadPosition === this.stack.length) {
      const partialState = {
        type: void 0,
        size: 0,
        array: void 0,
        position: 0,
        readCount: 0,
        map: void 0,
        key: null
      };
      this.stack.push(partialState);
    }
    return this.stack[this.stackHeadPosition];
  }
  release(state) {
    const topStackState = this.stack[this.stackHeadPosition];
    if (topStackState !== state) {
      throw new Error("Invalid stack state. Released state is not on top of the stack.");
    }
    if (state.type === STATE_ARRAY) {
      const partialState = state;
      partialState.size = 0;
      partialState.array = void 0;
      partialState.position = 0;
      partialState.type = void 0;
    }
    if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
      const partialState = state;
      partialState.size = 0;
      partialState.map = void 0;
      partialState.readCount = 0;
      partialState.type = void 0;
    }
    this.stackHeadPosition--;
  }
  reset() {
    this.stack.length = 0;
    this.stackHeadPosition = -1;
  }
};
var HEAD_BYTE_REQUIRED = -1;
var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
try {
  EMPTY_VIEW.getInt8(0);
} catch (e) {
  if (!(e instanceof RangeError)) {
    throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
  }
}
var MORE_DATA = new RangeError("Insufficient data");
var sharedCachedKeyDecoder = new CachedKeyDecoder();
var Decoder = class _Decoder {
  extensionCodec;
  context;
  useBigInt64;
  rawStrings;
  maxStrLength;
  maxBinLength;
  maxArrayLength;
  maxMapLength;
  maxExtLength;
  keyDecoder;
  mapKeyConverter;
  totalPos = 0;
  pos = 0;
  view = EMPTY_VIEW;
  bytes = EMPTY_BYTES;
  headByte = HEAD_BYTE_REQUIRED;
  stack = new StackPool();
  entered = false;
  constructor(options) {
    this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
    this.context = options?.context;
    this.useBigInt64 = options?.useBigInt64 ?? false;
    this.rawStrings = options?.rawStrings ?? false;
    this.maxStrLength = options?.maxStrLength ?? UINT32_MAX;
    this.maxBinLength = options?.maxBinLength ?? UINT32_MAX;
    this.maxArrayLength = options?.maxArrayLength ?? UINT32_MAX;
    this.maxMapLength = options?.maxMapLength ?? UINT32_MAX;
    this.maxExtLength = options?.maxExtLength ?? UINT32_MAX;
    this.keyDecoder = options?.keyDecoder !== void 0 ? options.keyDecoder : sharedCachedKeyDecoder;
    this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
  }
  clone() {
    return new _Decoder({
      extensionCodec: this.extensionCodec,
      context: this.context,
      useBigInt64: this.useBigInt64,
      rawStrings: this.rawStrings,
      maxStrLength: this.maxStrLength,
      maxBinLength: this.maxBinLength,
      maxArrayLength: this.maxArrayLength,
      maxMapLength: this.maxMapLength,
      maxExtLength: this.maxExtLength,
      keyDecoder: this.keyDecoder
    });
  }
  reinitializeState() {
    this.totalPos = 0;
    this.headByte = HEAD_BYTE_REQUIRED;
    this.stack.reset();
  }
  setBuffer(buffer) {
    const bytes = ensureUint8Array(buffer);
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.pos = 0;
  }
  appendBuffer(buffer) {
    if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
      this.setBuffer(buffer);
    } else {
      const remainingData = this.bytes.subarray(this.pos);
      const newData = ensureUint8Array(buffer);
      const newBuffer = new Uint8Array(remainingData.length + newData.length);
      newBuffer.set(remainingData);
      newBuffer.set(newData, remainingData.length);
      this.setBuffer(newBuffer);
    }
  }
  hasRemaining(size) {
    return this.view.byteLength - this.pos >= size;
  }
  createExtraByteError(posToShow) {
    const { view, pos } = this;
    return new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
  }
  /**
   * @throws {@link DecodeError}
   * @throws {@link RangeError}
   */
  decode(buffer) {
    if (this.entered) {
      const instance = this.clone();
      return instance.decode(buffer);
    }
    try {
      this.entered = true;
      this.reinitializeState();
      this.setBuffer(buffer);
      const object = this.doDecodeSync();
      if (this.hasRemaining(1)) {
        throw this.createExtraByteError(this.pos);
      }
      return object;
    } finally {
      this.entered = false;
    }
  }
  *decodeMulti(buffer) {
    if (this.entered) {
      const instance = this.clone();
      yield* instance.decodeMulti(buffer);
      return;
    }
    try {
      this.entered = true;
      this.reinitializeState();
      this.setBuffer(buffer);
      while (this.hasRemaining(1)) {
        yield this.doDecodeSync();
      }
    } finally {
      this.entered = false;
    }
  }
  async decodeAsync(stream) {
    if (this.entered) {
      const instance = this.clone();
      return instance.decodeAsync(stream);
    }
    try {
      this.entered = true;
      let decoded = false;
      let object;
      for await (const buffer of stream) {
        if (decoded) {
          this.entered = false;
          throw this.createExtraByteError(this.totalPos);
        }
        this.appendBuffer(buffer);
        try {
          object = this.doDecodeSync();
          decoded = true;
        } catch (e) {
          if (!(e instanceof RangeError)) {
            throw e;
          }
        }
        this.totalPos += this.pos;
      }
      if (decoded) {
        if (this.hasRemaining(1)) {
          throw this.createExtraByteError(this.totalPos);
        }
        return object;
      }
      const { headByte, pos, totalPos } = this;
      throw new RangeError(`Insufficient data in parsing ${prettyByte(headByte)} at ${totalPos} (${pos} in the current buffer)`);
    } finally {
      this.entered = false;
    }
  }
  decodeArrayStream(stream) {
    return this.decodeMultiAsync(stream, true);
  }
  decodeStream(stream) {
    return this.decodeMultiAsync(stream, false);
  }
  async *decodeMultiAsync(stream, isArray) {
    if (this.entered) {
      const instance = this.clone();
      yield* instance.decodeMultiAsync(stream, isArray);
      return;
    }
    try {
      this.entered = true;
      let isArrayHeaderRequired = isArray;
      let arrayItemsLeft = -1;
      for await (const buffer of stream) {
        if (isArray && arrayItemsLeft === 0) {
          throw this.createExtraByteError(this.totalPos);
        }
        this.appendBuffer(buffer);
        if (isArrayHeaderRequired) {
          arrayItemsLeft = this.readArraySize();
          isArrayHeaderRequired = false;
          this.complete();
        }
        try {
          while (true) {
            yield this.doDecodeSync();
            if (--arrayItemsLeft === 0) {
              break;
            }
          }
        } catch (e) {
          if (!(e instanceof RangeError)) {
            throw e;
          }
        }
        this.totalPos += this.pos;
      }
    } finally {
      this.entered = false;
    }
  }
  doDecodeSync() {
    DECODE: while (true) {
      const headByte = this.readHeadByte();
      let object;
      if (headByte >= 224) {
        object = headByte - 256;
      } else if (headByte < 192) {
        if (headByte < 128) {
          object = headByte;
        } else if (headByte < 144) {
          const size = headByte - 128;
          if (size !== 0) {
            this.pushMapState(size);
            this.complete();
            continue DECODE;
          } else {
            object = {};
          }
        } else if (headByte < 160) {
          const size = headByte - 144;
          if (size !== 0) {
            this.pushArrayState(size);
            this.complete();
            continue DECODE;
          } else {
            object = [];
          }
        } else {
          const byteLength = headByte - 160;
          object = this.decodeString(byteLength, 0);
        }
      } else if (headByte === 192) {
        object = null;
      } else if (headByte === 194) {
        object = false;
      } else if (headByte === 195) {
        object = true;
      } else if (headByte === 202) {
        object = this.readF32();
      } else if (headByte === 203) {
        object = this.readF64();
      } else if (headByte === 204) {
        object = this.readU8();
      } else if (headByte === 205) {
        object = this.readU16();
      } else if (headByte === 206) {
        object = this.readU32();
      } else if (headByte === 207) {
        if (this.useBigInt64) {
          object = this.readU64AsBigInt();
        } else {
          object = this.readU64();
        }
      } else if (headByte === 208) {
        object = this.readI8();
      } else if (headByte === 209) {
        object = this.readI16();
      } else if (headByte === 210) {
        object = this.readI32();
      } else if (headByte === 211) {
        if (this.useBigInt64) {
          object = this.readI64AsBigInt();
        } else {
          object = this.readI64();
        }
      } else if (headByte === 217) {
        const byteLength = this.lookU8();
        object = this.decodeString(byteLength, 1);
      } else if (headByte === 218) {
        const byteLength = this.lookU16();
        object = this.decodeString(byteLength, 2);
      } else if (headByte === 219) {
        const byteLength = this.lookU32();
        object = this.decodeString(byteLength, 4);
      } else if (headByte === 220) {
        const size = this.readU16();
        if (size !== 0) {
          this.pushArrayState(size);
          this.complete();
          continue DECODE;
        } else {
          object = [];
        }
      } else if (headByte === 221) {
        const size = this.readU32();
        if (size !== 0) {
          this.pushArrayState(size);
          this.complete();
          continue DECODE;
        } else {
          object = [];
        }
      } else if (headByte === 222) {
        const size = this.readU16();
        if (size !== 0) {
          this.pushMapState(size);
          this.complete();
          continue DECODE;
        } else {
          object = {};
        }
      } else if (headByte === 223) {
        const size = this.readU32();
        if (size !== 0) {
          this.pushMapState(size);
          this.complete();
          continue DECODE;
        } else {
          object = {};
        }
      } else if (headByte === 196) {
        const size = this.lookU8();
        object = this.decodeBinary(size, 1);
      } else if (headByte === 197) {
        const size = this.lookU16();
        object = this.decodeBinary(size, 2);
      } else if (headByte === 198) {
        const size = this.lookU32();
        object = this.decodeBinary(size, 4);
      } else if (headByte === 212) {
        object = this.decodeExtension(1, 0);
      } else if (headByte === 213) {
        object = this.decodeExtension(2, 0);
      } else if (headByte === 214) {
        object = this.decodeExtension(4, 0);
      } else if (headByte === 215) {
        object = this.decodeExtension(8, 0);
      } else if (headByte === 216) {
        object = this.decodeExtension(16, 0);
      } else if (headByte === 199) {
        const size = this.lookU8();
        object = this.decodeExtension(size, 1);
      } else if (headByte === 200) {
        const size = this.lookU16();
        object = this.decodeExtension(size, 2);
      } else if (headByte === 201) {
        const size = this.lookU32();
        object = this.decodeExtension(size, 4);
      } else {
        throw new DecodeError(`Unrecognized type byte: ${prettyByte(headByte)}`);
      }
      this.complete();
      const stack = this.stack;
      while (stack.length > 0) {
        const state = stack.top();
        if (state.type === STATE_ARRAY) {
          state.array[state.position] = object;
          state.position++;
          if (state.position === state.size) {
            object = state.array;
            stack.release(state);
          } else {
            continue DECODE;
          }
        } else if (state.type === STATE_MAP_KEY) {
          if (object === "__proto__") {
            throw new DecodeError("The key __proto__ is not allowed");
          }
          state.key = this.mapKeyConverter(object);
          state.type = STATE_MAP_VALUE;
          continue DECODE;
        } else {
          state.map[state.key] = object;
          state.readCount++;
          if (state.readCount === state.size) {
            object = state.map;
            stack.release(state);
          } else {
            state.key = null;
            state.type = STATE_MAP_KEY;
            continue DECODE;
          }
        }
      }
      return object;
    }
  }
  readHeadByte() {
    if (this.headByte === HEAD_BYTE_REQUIRED) {
      this.headByte = this.readU8();
    }
    return this.headByte;
  }
  complete() {
    this.headByte = HEAD_BYTE_REQUIRED;
  }
  readArraySize() {
    const headByte = this.readHeadByte();
    switch (headByte) {
      case 220:
        return this.readU16();
      case 221:
        return this.readU32();
      default: {
        if (headByte < 160) {
          return headByte - 144;
        } else {
          throw new DecodeError(`Unrecognized array type byte: ${prettyByte(headByte)}`);
        }
      }
    }
  }
  pushMapState(size) {
    if (size > this.maxMapLength) {
      throw new DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
    }
    this.stack.pushMapState(size);
  }
  pushArrayState(size) {
    if (size > this.maxArrayLength) {
      throw new DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
    }
    this.stack.pushArrayState(size);
  }
  decodeString(byteLength, headerOffset) {
    if (!this.rawStrings || this.stateIsMapKey()) {
      return this.decodeUtf8String(byteLength, headerOffset);
    }
    return this.decodeBinary(byteLength, headerOffset);
  }
  /**
   * @throws {@link RangeError}
   */
  decodeUtf8String(byteLength, headerOffset) {
    if (byteLength > this.maxStrLength) {
      throw new DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
    }
    if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
      throw MORE_DATA;
    }
    const offset = this.pos + headerOffset;
    let object;
    if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) {
      object = this.keyDecoder.decode(this.bytes, offset, byteLength);
    } else {
      object = utf8Decode(this.bytes, offset, byteLength);
    }
    this.pos += headerOffset + byteLength;
    return object;
  }
  stateIsMapKey() {
    if (this.stack.length > 0) {
      const state = this.stack.top();
      return state.type === STATE_MAP_KEY;
    }
    return false;
  }
  /**
   * @throws {@link RangeError}
   */
  decodeBinary(byteLength, headOffset) {
    if (byteLength > this.maxBinLength) {
      throw new DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
    }
    if (!this.hasRemaining(byteLength + headOffset)) {
      throw MORE_DATA;
    }
    const offset = this.pos + headOffset;
    const object = this.bytes.subarray(offset, offset + byteLength);
    this.pos += headOffset + byteLength;
    return object;
  }
  decodeExtension(size, headOffset) {
    if (size > this.maxExtLength) {
      throw new DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
    }
    const extType = this.view.getInt8(this.pos + headOffset);
    const data = this.decodeBinary(
      size,
      headOffset + 1
      /* extType */
    );
    return this.extensionCodec.decode(data, extType, this.context);
  }
  lookU8() {
    return this.view.getUint8(this.pos);
  }
  lookU16() {
    return this.view.getUint16(this.pos);
  }
  lookU32() {
    return this.view.getUint32(this.pos);
  }
  readU8() {
    const value = this.view.getUint8(this.pos);
    this.pos++;
    return value;
  }
  readI8() {
    const value = this.view.getInt8(this.pos);
    this.pos++;
    return value;
  }
  readU16() {
    const value = this.view.getUint16(this.pos);
    this.pos += 2;
    return value;
  }
  readI16() {
    const value = this.view.getInt16(this.pos);
    this.pos += 2;
    return value;
  }
  readU32() {
    const value = this.view.getUint32(this.pos);
    this.pos += 4;
    return value;
  }
  readI32() {
    const value = this.view.getInt32(this.pos);
    this.pos += 4;
    return value;
  }
  readU64() {
    const value = getUint64(this.view, this.pos);
    this.pos += 8;
    return value;
  }
  readI64() {
    const value = getInt64(this.view, this.pos);
    this.pos += 8;
    return value;
  }
  readU64AsBigInt() {
    const value = this.view.getBigUint64(this.pos);
    this.pos += 8;
    return value;
  }
  readI64AsBigInt() {
    const value = this.view.getBigInt64(this.pos);
    this.pos += 8;
    return value;
  }
  readF32() {
    const value = this.view.getFloat32(this.pos);
    this.pos += 4;
    return value;
  }
  readF64() {
    const value = this.view.getFloat64(this.pos);
    this.pos += 8;
    return value;
  }
};

// node_modules/@msgpack/msgpack/dist.esm/decode.mjs
function decode(buffer, options) {
  const decoder = new Decoder(options);
  return decoder.decode(buffer);
}

// src/rtc/internal/channel.ts
var NativeRtcChannel = class {
  constructor(peerId2, channel) {
    this.peerId = peerId2;
    this.channel = channel;
    channel.binaryType = "arraybuffer";
    channel.addEventListener("open", () => this.emit("open"));
    channel.addEventListener("close", () => this.emit("close"));
    channel.addEventListener("error", () => this.emit("error"));
    channel.addEventListener("message", (event) => {
      try {
        const bytes = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data instanceof Blob ? void 0 : new Uint8Array(event.data);
        if (bytes) this.emit("message", decode(bytes));
        else void event.data.arrayBuffer().then((buffer) => this.emit("message", decode(new Uint8Array(buffer)))).catch(() => this.emit("error"));
      } catch {
        this.emit("error");
      }
    });
  }
  listeners = /* @__PURE__ */ new Map();
  get open() {
    return this.channel.readyState === "open";
  }
  get bufferedAmount() {
    return this.channel.bufferedAmount;
  }
  send(value) {
    if (!this.open) throw new Error("The peer data channel is not open.");
    this.channel.send(encode(value));
  }
  close() {
    this.channel.close();
  }
  on(event, listener) {
    const listeners = this.listeners.get(event) ?? /* @__PURE__ */ new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }
  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }
  emit(event, value) {
    for (const listener of this.listeners.get(event) ?? []) listener(value);
  }
};

// src/rtc/internal/mesh.ts
var RtcMesh = class {
  constructor(localPeerId, configuration, sendSignal, events = {}) {
    this.localPeerId = localPeerId;
    this.configuration = configuration;
    this.sendSignal = sendSignal;
    this.events = events;
  }
  peers = /* @__PURE__ */ new Map();
  audioTrack = null;
  closed = false;
  connect(peerId2) {
    const peer = this.ensurePeer(peerId2);
    void this.negotiate(peer);
    return peer;
  }
  peer(peerId2) {
    return this.peers.get(peerId2);
  }
  async handleSignal(signal) {
    if (this.closed || signal.recipientId !== this.localPeerId || signal.senderId === this.localPeerId) return;
    const peer = this.ensurePeer(signal.senderId);
    try {
      if (signal.kind === "description") {
        const description = signal.payload;
        if (!description || !["offer", "answer"].includes(description.type)) return;
        const readyForOffer = !peer.makingOffer && (peer.connection.signalingState === "stable" || peer.settingRemoteAnswer);
        const offerCollision = description.type === "offer" && !readyForOffer;
        const polite = this.localPeerId.localeCompare(peer.peerId) > 0;
        peer.ignoreOffer = !polite && offerCollision;
        if (peer.ignoreOffer) return;
        peer.settingRemoteAnswer = description.type === "answer";
        await peer.connection.setRemoteDescription(description);
        peer.settingRemoteAnswer = false;
        if (description.type === "offer") {
          await peer.connection.setLocalDescription();
          await this.send(peer.peerId, "description", peer.connection.localDescription?.toJSON());
        }
        for (const candidate2 of peer.pendingCandidates.splice(0)) {
          try {
            await peer.connection.addIceCandidate(candidate2);
          } catch (error) {
            if (!peer.ignoreOffer) this.events.error?.(peer.peerId, asError(error));
          }
        }
        return;
      }
      const candidate = signal.payload;
      if (!candidate || typeof candidate.candidate !== "string") return;
      if (!peer.connection.remoteDescription) {
        peer.pendingCandidates.push(candidate);
        return;
      }
      try {
        await peer.connection.addIceCandidate(candidate);
      } catch (error) {
        if (!peer.ignoreOffer) throw error;
      }
    } catch (error) {
      this.events.error?.(peer.peerId, asError(error));
    }
  }
  async setAudioTrack(track) {
    this.audioTrack = track;
    await Promise.all([...this.peers.values()].map((peer) => peer.audioSender.replaceTrack(track)));
  }
  closePeer(peerId2) {
    const peer = this.peers.get(peerId2);
    if (!peer) return;
    this.peers.delete(peerId2);
    peer.control.close();
    peer.screen.close();
    peer.connection.close();
    this.events.peerClosed?.(peerId2);
  }
  close() {
    this.closed = true;
    for (const peerId2 of [...this.peers.keys()]) this.closePeer(peerId2);
  }
  ensurePeer(peerId2) {
    const existing = this.peers.get(peerId2);
    if (existing) return existing;
    if (this.closed || !validPeerId(peerId2) || peerId2 === this.localPeerId) throw new Error("Cannot create an invalid peer connection.");
    const connection = new RTCPeerConnection(this.configuration);
    const control = new NativeRtcChannel(peerId2, connection.createDataChannel("control", { negotiated: true, id: 0, ordered: true }));
    const screen = new NativeRtcChannel(peerId2, connection.createDataChannel("screen", { negotiated: true, id: 1, ordered: true }));
    const audioSender = connection.addTransceiver("audio", { direction: "sendrecv" }).sender;
    const peer = {
      peerId: peerId2,
      connection,
      control,
      screen,
      audioSender,
      makingOffer: false,
      ignoreOffer: false,
      settingRemoteAnswer: false,
      pendingCandidates: []
    };
    this.peers.set(peerId2, peer);
    this.events.peerAvailable?.(peer);
    connection.addEventListener("icecandidate", (event) => {
      if (event.candidate) void this.send(peerId2, "candidate", event.candidate.toJSON());
    });
    connection.addEventListener("negotiationneeded", () => void this.negotiate(peer));
    connection.addEventListener("track", (event) => this.events.audioTrack?.(peerId2, event.track, event.streams));
    connection.addEventListener("connectionstatechange", () => {
      if (["failed", "closed"].includes(connection.connectionState)) this.closePeer(peerId2);
    });
    if (this.audioTrack) void audioSender.replaceTrack(this.audioTrack);
    return peer;
  }
  async negotiate(peer) {
    if (this.closed || peer.makingOffer || peer.connection.signalingState !== "stable") return;
    try {
      peer.makingOffer = true;
      await peer.connection.setLocalDescription();
      await this.send(peer.peerId, "description", peer.connection.localDescription?.toJSON());
    } catch (error) {
      this.events.error?.(peer.peerId, asError(error));
    } finally {
      peer.makingOffer = false;
    }
  }
  async send(recipientId, kind, payload) {
    if (payload !== void 0) await this.sendSignal({ recipientId, kind, payload });
  }
};
function validPeerId(value) {
  return /^[A-Za-z0-9_-]{8,40}$/.test(value);
}
function asError(value) {
  return value instanceof Error ? value : new Error(String(value));
}

// src/signaling/internal/rest-client.ts
var HEARTBEAT_MS = 2e4;
var POLL_MS = 800;
var SignalingError = class extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
};
var RestSignalingSession = class {
  constructor(apiBase, credentials) {
    this.apiBase = apiBase;
    this.roomId = credentials.roomId;
    this.participantId = credentials.participant.id;
    this.participantToken = credentials.participantToken;
    this.hostId = credentials.hostId;
    this.participants = credentials.participants;
    this.participant = credentials.participant;
  }
  roomId;
  participantId;
  participantToken;
  hostId;
  participants;
  participant;
  abortController = new AbortController();
  listeners = /* @__PURE__ */ new Set();
  unavailableListeners = /* @__PURE__ */ new Set();
  cursor = 0;
  heartbeatTimer;
  polling = false;
  onSignal(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  onUnavailable(listener) {
    this.unavailableListeners.add(listener);
    return () => this.unavailableListeners.delete(listener);
  }
  start() {
    if (this.polling) return;
    this.polling = true;
    this.heartbeatTimer = setInterval(() => void this.heartbeat(), HEARTBEAT_MS);
    void this.pollLoop();
  }
  async send(signal) {
    await this.request(`/rooms/${this.roomId}/signals`, { method: "POST", body: JSON.stringify(signal) });
  }
  async leave() {
    try {
      await this.request(`/rooms/${this.roomId}/participants/me`, { method: "DELETE", keepalive: true });
    } finally {
      this.stop();
    }
  }
  async closeRoom() {
    try {
      await this.request(`/rooms/${this.roomId}`, { method: "DELETE", keepalive: true });
    } finally {
      this.stop();
    }
  }
  stop() {
    this.polling = false;
    this.abortController.abort();
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = void 0;
  }
  async heartbeat() {
    try {
      await this.request(`/rooms/${this.roomId}/heartbeat`, { method: "POST", body: "{}" });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        if (error instanceof SignalingError && [401, 404].includes(error.status)) {
          this.stop();
          for (const listener of this.unavailableListeners) listener();
        }
      }
    }
  }
  async pollLoop() {
    let retryMs = POLL_MS;
    while (this.polling) {
      try {
        const batch = await this.request(`/rooms/${this.roomId}/signals?after=${this.cursor}`);
        this.cursor = batch.cursor;
        for (const signal of batch.signals) {
          for (const listener of this.listeners) await listener(signal);
        }
        retryMs = batch.signals.length ? 30 : POLL_MS;
      } catch (error) {
        if (!this.polling || error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof SignalingError && [401, 404].includes(error.status)) {
          this.stop();
          for (const listener of this.unavailableListeners) listener();
          return;
        }
        retryMs = Math.min(5e3, retryMs * 2);
      }
      await delay(retryMs, this.abortController.signal).catch(() => {
      });
    }
  }
  async request(pathname, init = {}) {
    const response = await fetch(`${this.apiBase}${pathname}`, {
      ...init,
      signal: this.abortController.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.participantToken}`,
        "X-Participant-Id": this.participantId,
        ...init.headers
      }
    });
    if (!response.ok) throw await responseError(response);
    return response.status === 204 || response.status === 202 ? void 0 : response.json();
  }
};
async function createRoom(apiBase, input) {
  return new RestSignalingSession(apiBase, await publicRequest(`${apiBase}/rooms`, input));
}
async function joinRoom(apiBase, roomId, input) {
  return new RestSignalingSession(apiBase, await publicRequest(`${apiBase}/rooms/${roomId}/join`, input));
}
async function publicRequest(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw await responseError(response);
  return response.json();
}
async function responseError(response) {
  const result = await response.json().catch(() => ({}));
  return new SignalingError(
    result.error?.code ?? "request-failed",
    result.error?.message ?? `The room request failed (${response.status}).`,
    response.status
  );
}
function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener("abort", abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(finish, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

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
var mesh;
var signaling;
var session = new RoomSession();
var viewerControl;
var localPresentation;
var shareAudioEnabled = false;
var maxParticipants = 12;
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
var peerChannels = /* @__PURE__ */ new Map();
var incomingTextReceivers = /* @__PURE__ */ new Map();
var remoteAudioElements = /* @__PURE__ */ new Map();
var mutedPresenters = /* @__PURE__ */ new Set();
var chatHistory = [];
var configReady = fetch(appPath("config")).then((response) => response.json()).then((config) => {
  rtcConfig = { iceServers: config.iceServers };
  maxParticipants = config.maxParticipants;
  const input = document.querySelector("#room-limit");
  if (input) {
    input.max = String(maxParticipants);
    input.value = String(Math.min(Number(input.value) || maxParticipants, maxParticipants));
  }
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
function normalizeRoomCode(value) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  return normalized.match(/(?:room\/)?([a-z0-9-]{6,32})\/?$/)?.[1] || "";
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
async function startRoom() {
  const button = $("#share-button");
  button.disabled = true;
  button.classList.add("loading");
  try {
    await configReady;
    signaling = await createRoom(appPath("api"), {
      password: optionalInputValue("#room-password"),
      maxParticipants: selectedRoomLimit()
    });
    session.startHosting(signaling.roomId, signaling.participantId);
    history.replaceState({}, "", appPath(`room/${session.roomId}`));
    prepareRoomShell();
    setRoomConnectionState("waiting", "Opening room");
    startNativeMesh(signaling);
    session.markLive();
    setChatEnabled(true);
    setRoomConnectionState("live", "Host \xB7 room open");
    announceSystem("Host", "joined the room.", "joined");
    updateRoomUI();
  } catch (error) {
    disposeLocalPresentation();
    disposeConnections();
    session.reset();
    setScreen("landing");
    history.replaceState({}, "", appPath());
    showToast(errorMessage(error, "Could not start the room."), "error");
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
  }
}
async function joinRoom2(id, password = "") {
  session.startJoining(id);
  prepareRoomShell();
  setRoomConnectionState("waiting", "Connecting to host");
  await configReady;
  try {
    signaling = await joinRoom(appPath("api"), id, { password });
    session.setLocalPeer(signaling.participantId, signaling.hostId);
    startNativeMesh(signaling);
    for (const participant of signaling.participants) mesh?.connect(participant.id);
  } catch (error) {
    if (error instanceof SignalingError && error.code === "password-required") {
      const entered = window.prompt("Enter the password for this room:");
      if (entered !== null) return joinRoom2(id, entered);
    }
    endViewer(errorMessage(error, "Could not connect to this room."));
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
function startNativeMesh(roomSignaling) {
  mesh = new RtcMesh(roomSignaling.participantId, rtcConfig, (signal) => roomSignaling.send(signal), {
    peerAvailable: routePeer,
    peerClosed: handlePeerClosed,
    audioTrack: receiveAudioTrack,
    error: (_, error) => showToast(error.message || "A peer connection failed.", "error")
  });
  roomSignaling.onSignal((signal) => mesh?.handleSignal(signal));
  roomSignaling.onUnavailable(() => {
    if (!session.isHost) endViewer("The room is no longer available.");
    else showToast("The room service connection expired.", "error");
  });
  roomSignaling.start();
}
function routePeer(peerConnection) {
  peerChannels.set(peerConnection.peerId, peerConnection);
  if (session.isHost) {
    if (peerConnection.control.open) acceptViewer(peerConnection);
    else peerConnection.control.on("open", () => acceptViewer(peerConnection));
    return;
  }
  if (peerConnection.peerId === session.hostId) {
    viewerControl = peerConnection.control;
    viewerControl.on("message", handleRoomMessage);
    viewerControl.on("close", () => endViewer("The room is no longer available."));
    setRoomConnectionState("waiting", "Waiting for host");
  }
  if (localPresentation) connectLocalStreamTo(peerConnection.peerId);
  attachIncomingTextStream(peerConnection.peerId);
}
function acceptViewer(peerConnection) {
  const viewerId = peerConnection.peerId;
  const connection = peerConnection.control;
  if (hostConnections.has(viewerId)) {
    return;
  }
  guestNumber += 1;
  hostConnections.set(viewerId, { control: connection, name: `Guest ${guestNumber}`, lastMessageAt: 0 });
  const viewer = hostConnections.get(viewerId);
  if (!viewer) return;
  connection.send({ type: "accepted", name: viewer.name, hostId: session.hostId });
  connection.send({ type: "chat-history", messages: chatHistory });
  connection.send({ type: "room-state", presenters: [...presenters.values()] });
  announceSystem(viewer.name, "joined the room.", "joined");
  broadcastParticipantCount();
  for (const presenter of presenters.values()) {
    if (presenter.id === session.hostId) connectLocalStreamTo(viewerId);
    else hostConnections.get(presenter.id)?.control.send({ type: "participant-joined", peerId: viewerId });
  }
  for (const [participantId, participant] of hostConnections) {
    if (participantId !== viewerId && participant.control.open) {
      participant.control.send({ type: "participant-joined", peerId: viewerId });
    }
  }
  connection.on("message", (value) => handleViewerData(viewerId, value));
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
      session.markLive({ viewerName: message.name, hostId: message.hostId });
      setChatEnabled(true);
      setRoomConnectionState("live", `${session.viewerName} \xB7 connected`);
      updateRoomUI();
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
      disconnectLocalStreamFrom(message.peerId);
      if (presenters.has(message.peerId)) removePresenter(message.peerId);
      mesh?.closePeer(message.peerId);
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
    const participants = [signaling?.participantId, ...hostConnections.keys()].filter((id) => Boolean(id && id !== viewerId));
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
  if (localPresentation || session.ended || !signaling?.participantId || !session.beginPresentation()) return;
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
  if (!signaling?.participantId || !mesh) throw new Error("The room connection is not ready.");
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
  await mesh.setAudioTrack(localAudioTracks()[0] ?? null);
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
    id: signaling?.participantId || "",
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
  const channel = mesh?.peer(participantId)?.screen;
  if (!channel || !localPresentation) return;
  localPresentation.connect(participantId, channel);
  updateBandwidthEstimate();
}
function disconnectLocalStreamFrom(participantId) {
  localPresentation?.disconnect(participantId);
  updateBandwidthEstimate();
}
function attachIncomingTextStream(presenterId) {
  if (presenterId === signaling?.participantId || incomingTextReceivers.has(presenterId) || !presenters.has(presenterId)) return;
  const connection = peerChannels.get(presenterId)?.screen;
  const canvas = streamCardMedia(presenterId, "canvas");
  if (!connection || !canvas) return;
  const receiver = new TextStreamReceiver(canvas, connection, () => setCardConnected(presenterId));
  incomingTextReceivers.set(presenterId, receiver);
  connection.on("close", () => {
    if (incomingTextReceivers.get(presenterId) === receiver) incomingTextReceivers.delete(presenterId);
  });
}
function receiveAudioTrack(peerId2, track, streams) {
  if (track.kind !== "audio" || peerId2 === signaling?.participantId) return;
  const audio = remoteAudioElements.get(peerId2) || document.createElement("audio");
  audio.autoplay = true;
  audio.srcObject = streams[0] ?? new MediaStream([track]);
  audio.muted = mutedPresenters.has(peerId2);
  remoteAudioElements.set(peerId2, audio);
  const name = presenters.get(peerId2)?.name ?? "participant";
  void audio.play().catch(() => showToast(`Click ${name}\u2019s mute button to enable audio.`));
  track.addEventListener("ended", () => closeIncomingAudio(peerId2), { once: true });
}
function closeIncomingAudio(presenterId) {
  const audio = remoteAudioElements.get(presenterId);
  if (audio) audio.srcObject = null;
  remoteAudioElements.delete(presenterId);
}
function stopLocalPresentation() {
  if (!localPresentation) return;
  const presenterId = signaling?.participantId;
  disposeLocalPresentation();
  void mesh?.setAudioTrack(null);
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
  attachIncomingTextStream(presenter.id);
  updateStreamGrid();
}
function removePresenter(presenterId) {
  presenters.delete(presenterId);
  incomingTextReceivers.get(presenterId)?.close();
  incomingTextReceivers.delete(presenterId);
  closeIncomingAudio(presenterId);
  mutedPresenters.delete(presenterId);
  streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"]`)?.remove();
  updateStreamGrid();
}
function renderStreamCard(presenter) {
  let card = streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenter.id)}"]`);
  const isLocal = presenter.id === signaling?.participantId;
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
  if (presenterId === signaling?.participantId) return;
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
  const isLocal = presenterId === signaling?.participantId;
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
  peerChannels.delete(viewerId);
  viewer.control.close();
  if (mesh?.peer(viewerId)) mesh.closePeer(viewerId);
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
function handlePeerClosed(peerId2) {
  peerChannels.delete(peerId2);
  incomingTextReceivers.get(peerId2)?.close();
  incomingTextReceivers.delete(peerId2);
  closeIncomingAudio(peerId2);
  if (session.isHost) removeViewer(peerId2);
  else if (peerId2 === session.hostId) endViewer("The room is no longer available.");
  else {
    disconnectLocalStreamFrom(peerId2);
    if (presenters.has(peerId2)) removePresenter(peerId2);
  }
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
  const isOwn = session.isHost ? message.sender === "host" : message.senderId === signaling?.participantId;
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
function endViewer(message) {
  if (!session.end()) return;
  stopLocalPresentation();
  disposeConnections();
  setChatEnabled(false);
  setRoomConnectionState("ended", message);
  $("#stream-button").disabled = true;
  showToast(message, "error");
}
async function leaveRoom() {
  if (session.isHost) {
    if (!window.confirm("Close this room for everyone?")) return;
    broadcast({ type: "room-closed" });
    for (const { control } of hostConnections.values()) control.close();
    hostConnections.clear();
    await signaling?.closeRoom().catch(() => {
    });
  } else {
    await signaling?.leave().catch(() => {
    });
  }
  disposeLocalPresentation();
  disposeConnections();
  location.href = appPath();
}
function disposeConnections() {
  viewerControl = void 0;
  signaling?.stop();
  signaling = void 0;
  mesh?.close();
  mesh = void 0;
  peerChannels.clear();
  for (const receiver of incomingTextReceivers.values()) receiver.close();
  incomingTextReceivers.clear();
  for (const audio of remoteAudioElements.values()) audio.srcObject = null;
  remoteAudioElements.clear();
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
function errorName(error) {
  return error instanceof Error ? error.name : void 0;
}
function optionalInputValue(selector) {
  return document.querySelector(selector)?.value ?? "";
}
function selectedRoomLimit() {
  const selected = Number.parseInt(optionalInputValue("#room-limit"), 10);
  return Number.isSafeInteger(selected) ? Math.min(maxParticipants, Math.max(2, selected)) : maxParticipants;
}
function errorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}
$("#share-button").addEventListener("click", startRoom);
$("#stream-button").addEventListener("click", () => localPresentation ? stopLocalPresentation() : startRoomPresentation());
$("#local-audio-button").addEventListener("click", toggleLocalAudio);
$("#leave-room-button").addEventListener("click", () => void leaveRoom());
$("#copy-room-code").addEventListener("click", () => void copyText(session.roomId, "Room code copied."));
$("#copy-invite-button").addEventListener("click", () => void copyText(`${location.origin}${appPath(`room/${session.roomId}`)}`, "Invite link copied."));
document.querySelectorAll("[data-share-audio]").forEach((input) => {
  input.addEventListener("change", () => setShareAudio(input.checked));
});
document.querySelectorAll("[data-room-limit-step]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector("#room-limit");
    if (!input) return;
    const step = Number(button.dataset.roomLimitStep);
    const current = Number.parseInt(input.value, 10) || 2;
    input.value = String(Math.min(maxParticipants, Math.max(2, current + step)));
  });
});
document.querySelector("#room-limit")?.addEventListener("change", (event) => {
  event.currentTarget.value = String(selectedRoomLimit());
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
  history.replaceState({}, "", appPath(`room/${id}`));
  void joinRoom2(id, optionalInputValue("#join-password"));
});
var relativePath = location.pathname.startsWith(appBasePath) ? location.pathname.slice(appBasePath.length) || "/" : location.pathname;
var routeMatch = relativePath.match(/^\/room\/([a-z0-9-]{6,32})\/?$/i);
if (routeMatch) void joinRoom2(routeMatch[1].toLowerCase());
else setScreen("landing");
