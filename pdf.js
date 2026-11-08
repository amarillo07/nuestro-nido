/* Exportación a PDF con jsPDF (incluido en la app, funciona sin internet). */
const NidoPDF = (() => {
  const C = { ink: "#22213A", muted: "#6B6880", line: "#EADFCB", bg: "#FFF8EC",
    coral: "#FF5C4D", mango: "#FFB321", mint: "#16C79A", sky: "#2E9BFF", pink: "#FF4FA3", grape: "#7B5CFF" };
  const SOFT = { coral: "#FFE3DF", mango: "#FFF0CC", mint: "#D6F7EC", sky: "#DCEEFF", pink: "#FFE0EF", grape: "#E9E3FF" };
  // Helvetica de jsPDF no tiene emojis: se quitan, y se cambian símbolos que no existen en la fuente.
  const clean = (s) => String(s ?? "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/≈/g, "~").replace(/[＋]/g, "+").replace(/\s{2,}/g, " ").trim();

  function build(S, h) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const M = 16, CW = W - 2 * M;
    let y = 0;

    const color = (hex, kind = "text") => {
      const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      if (kind === "fill") doc.setFillColor(r, g, b); else if (kind === "draw") doc.setDrawColor(r, g, b); else doc.setTextColor(r, g, b);
    };
    const font = (size, style = "normal", col = C.ink) => { doc.setFont("helvetica", style); doc.setFontSize(size); color(col); };
    const ensure = (need) => { if (y + need > H - 18) { doc.addPage(); y = 18; } };
    const text = (s, x, size = 10, style = "normal", col = C.ink, maxW = CW) => {
      font(size, style, col);
      const lines = doc.splitTextToSize(clean(s), maxW);
      const lh = size * 0.42;
      lines.forEach((ln) => { ensure(lh + 1); doc.text(ln, x, y); y += lh; });
      return lines.length;
    };
    const bar = (x, w, p, col) => {
      color(C.line, "fill"); doc.roundedRect(x, y, w, 3.2, 1.6, 1.6, "F");
      if (p > 0) { color(col, "fill"); doc.roundedRect(x, y, Math.max(3.2, w * Math.min(1, p)), 3.2, 1.6, 1.6, "F"); }
    };
    const section = (title, col) => {
      ensure(22); y += 4;
      color(SOFT[col] || C.bg, "fill"); color(C.ink, "draw"); doc.setLineWidth(0.5);
      doc.roundedRect(M, y, CW, 11, 3, 3, "FD");
      color(C[col], "fill"); doc.roundedRect(M + 3, y + 2.5, 6, 6, 1.5, 1.5, "F");
      font(13, "bold"); doc.text(clean(title), M + 13, y + 7.6);
      y += 17;
    };
    const money = h.mx;

    /* Portada / encabezado */
    color(C.mango, "fill"); doc.rect(0, 0, W, 46, "F");
    color(C.coral, "fill"); doc.circle(W - 26, 14, 9, "F");
    color(C.sky, "fill"); doc.roundedRect(W - 58, 22, 22, 18, 2, 2, "F");
    color(C.coral, "fill"); doc.triangle(W - 61, 23, W - 47, 12, W - 33, 23, "F");
    color(C.pink, "fill"); doc.circle(W - 47, 31, 2.6, "F");
    font(26, "bold"); doc.text("Nuestro Nido", M, 22);
    font(12, "normal"); doc.text(clean(`Plan de ${S.names.a} y ${S.names.b}`), M, 31);
    font(9, "normal", C.ink);
    doc.text(`Exportado el ${new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`, M, 38);
    y = 56;

    /* Bote común */
    section("El bote común (una sola cuenta)", "mint");
    const colW = (CW - 8) / 3;
    [[S.names.a, S.incomes.a, "grape"], [S.names.b, S.incomes.b, "pink"], ["Bote total al mes", h.total(), "mango"]].forEach((c, i) => {
      const x = M + i * (colW + 4);
      color(SOFT[c[2]], "fill"); doc.roundedRect(x, y, colW, 18, 3, 3, "F");
      font(8.5, "bold", C.muted); doc.text(clean(c[0]), x + 4, y + 6);
      font(15, "bold"); doc.text(money(c[1]), x + 4, y + 14);
    });
    y += 26;
    font(9, "bold", C.muted);
    doc.text("SOBRE", M, y); doc.text("TIPO", M + 78, y); doc.text("%", M + 108, y, { align: "right" }); doc.text("AL MES", W - M, y, { align: "right" });
    y += 3; color(C.line, "draw"); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 5;
    S.buckets.forEach((b) => {
      ensure(9);
      color(C[b.c] || C.mint, "fill"); doc.roundedRect(M, y - 3.4, 3.6, 3.6, 0.8, 0.8, "F");
      font(10, "normal"); doc.text(clean(h.bname(b)), M + 6, y);
      font(9, "normal", C.muted); doc.text(b.kind === "ahorro" ? "Ahorro" : b.kind === "basico" ? "Básico" : "Gasto", M + 78, y);
      font(10, "bold"); doc.text(b.pct + "%", M + 108, y, { align: "right" });
      doc.text(money(h.assigned(b)), W - M, y, { align: "right" });
      const by = y; y = by - 2.8; bar(M + 114, 34, b.pct / 40, C[b.c] || C.mint); y = by + 7;
    });
    const sum = S.buckets.reduce((a, b) => a + b.pct, 0);
    y += 1; text(sum === 100 ? "Repartido al 100%." : `Atención: los sobres suman ${sum}%.`, M, 9, "italic", sum === 100 ? C.mint : C.coral);

    /* Gastos del mes */
    const k = (S.ui && S.ui.month) || h.monthKey(new Date());
    const sp = h.spentBy(k);
    const txs = S.tx.filter((t) => t.date.slice(0, 7) === k).sort((a, b) => a.date.localeCompare(b.date));
    section(`Gastos y apartados de ${h.monthLabel(k)}`, "sky");
    S.buckets.forEach((b) => {
      ensure(10);
      const used = sp[b.id] || 0, cap = h.assigned(b);
      font(9.5, "bold"); doc.text(clean(h.bname(b)), M, y);
      font(9.5, "normal", used > cap && b.kind !== "ahorro" ? C.coral : C.muted);
      doc.text(`${money(used)} de ${money(cap)}`, W - M, y, { align: "right" });
      y += 2; bar(M, CW, cap ? used / cap : 0, used > cap && b.kind !== "ahorro" ? C.coral : (C[b.c] || C.sky)); y += 7;
    });
    if (txs.length) {
      y += 2; font(9, "bold", C.muted);
      doc.text("FECHA", M, y); doc.text("CONCEPTO", M + 20, y); doc.text("QUIÉN", M + 120, y); doc.text("MONTO", W - M, y, { align: "right" });
      y += 3; color(C.line, "draw"); doc.line(M, y, W - M, y); y += 5;
      txs.forEach((t) => {
        ensure(7);
        const b = S.buckets.find((x) => x.id === t.bucket);
        const who = t.who === "a" ? S.names.a : t.who === "b" ? S.names.b : "Los dos";
        font(9.5, "normal");
        doc.text(t.date.slice(8) + "/" + t.date.slice(5, 7), M, y);
        doc.text(doc.splitTextToSize(clean((t.desc || "") + (b ? " · " + h.bname(b) : "")), 96)[0], M + 20, y);
        doc.text(doc.splitTextToSize(clean(who), 30)[0], M + 120, y);
        font(9.5, "bold"); doc.text(money(t.amount), W - M, y, { align: "right" });
        y += 6;
      });
      font(10, "bold"); doc.text("Total: " + money(txs.reduce((a, t) => a + t.amount, 0)), W - M, y + 1, { align: "right" }); y += 7;
    } else {
      text("Sin movimientos anotados en este mes.", M, 9.5, "italic", C.muted);
    }

    /* Metas */
    section("Metas", "pink");
    const basic = h.basicMonthly();
    text(`Fondo de emergencia ideal: ${money(basic * 3)} a ${money(basic * 6)} (3 a 6 meses de gastos básicos, recomendación Condusef).`, M, 9.5, "normal", C.muted);
    y += 3;
    if (!S.goals.length) text("Sin metas registradas.", M, 9.5, "italic", C.muted);
    S.goals.forEach((g) => {
      ensure(16);
      const p = g.target ? g.saved / g.target : 0, left = Math.max(0, g.target - g.saved), m = h.monthsUntil(g.date);
      font(11, "bold"); doc.text(clean(g.name), M, y);
      font(11, "bold", C[g.c] || C.pink); doc.text(Math.round(Math.min(1, p) * 100) + "%", W - M, y, { align: "right" });
      y += 2; bar(M, CW, p, C[g.c] || C.pink); y += 7;
      const det = `${money(g.saved)} de ${money(g.target)}` + (left === 0 ? " · ¡Lograda!" : m ? ` · ${money(left / m)} al mes para ${new Date(g.date + "T12:00").toLocaleDateString("es-MX", { month: "long", year: "numeric" })}` : " · Sin fecha");
      text(det, M, 9.5, "normal", C.muted); y += 3;
    });

    /* Cuestionario */
    section("Cuestionario de pareja", "grape");
    h.CATS.forEach((cat) => {
      ensure(14);
      const d = cat.qs.filter((q, i) => (S.answers[cat.id + "-" + i] || {}).d).length;
      font(11.5, "bold", C[cat.c] || C.ink); doc.text(clean(cat.name), M, y);
      font(9, "normal", C.muted); doc.text(`${d} de ${cat.qs.length} platicadas`, W - M, y, { align: "right" });
      y += 6;
      cat.qs.forEach((q, i) => {
        const st = S.answers[cat.id + "-" + i] || {};
        ensure(8);
        color(C.ink, "draw"); doc.setLineWidth(0.4);
        if (st.d) { color(C[cat.c] || C.mint, "fill"); doc.roundedRect(M, y - 3.2, 3.8, 3.8, 0.8, 0.8, "FD"); font(8, "bold", "#FFFFFF"); doc.text("x", M + 1.1, y - 0.3); }
        else doc.roundedRect(M, y - 3.2, 3.8, 3.8, 0.8, 0.8, "S");
        text(q[0], M + 7, 9.5, st.d ? "bold" : "normal", C.ink, CW - 7);
        if (st.n && st.n.trim()) { y += 0.5; text("Notas: " + st.n.trim(), M + 7, 9, "italic", C.muted, CW - 7); }
        y += 2.5;
      });
      y += 2;
    });

    /* Fuentes */
    section("Fuentes", "mango");
    h.SOURCES.forEach((s) => { text("• " + s, M, 8.5, "normal", C.muted); y += 1; });
    text("La parte legal es orientación general y cambia según el estado; para decisiones concretas consulten a un abogado o notario.", M, 8.5, "italic", C.muted);

    /* Pie de página */
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); font(8, "normal", C.muted);
      doc.text(`Nuestro Nido · página ${i} de ${n}`, W / 2, H - 8, { align: "center" });
    }
    return doc.output("blob");
  }
  return { build };
})();
