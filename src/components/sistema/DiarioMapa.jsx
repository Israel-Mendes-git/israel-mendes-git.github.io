import { useEffect, useMemo, useRef, useState } from "react";
import projetos from "../../data/projetos";
import { useDiario } from "../diario";
import useFocoPreso from "../useFocoPreso";

// Diário de bordo como mapa de pistas, na tela do computador da nave.
// Colunas por ano, faixas por categoria. Cartões descobertos viram "fotos";
// os que faltam são pistas que apontam o planeta de onde vem o sinal. Fios
// ligam projetos por engine, por estúdio e por tema (cartas, multiplayer...).
// Arrastar e dar zoom como no mapa; clicar num cartão abre o detalhe.

const FAIXAS = [
  { id: "jogos", nome: { pt: "Jogos", en: "Games" }, cor: "#e8a83e" },
  {
    id: "ferramenta",
    nome: { pt: "Ferramentas", en: "Tools" },
    cor: "#22c55e",
  },
  { id: "web", nome: { pt: "Web e apps", en: "Web & apps" }, cor: "#a78bfa" },
  { id: "estudo", nome: { pt: "Estudos", en: "Studies" }, cor: "#a3a3a3" },
];
const ESTUDIO = new Set([17, 4, 7, 10]); // feitos na Rapadura Atômica
// Temas tirados do próprio texto dos projetos (nome, tipo, resumo).
const TEMAS = [
  { id: "cartas", rotulo: { pt: "cartas", en: "cards" }, teste: /cart|card/i },
  {
    id: "rede",
    rotulo: { pt: "multiplayer", en: "multiplayer" },
    teste: /multiplayer|rede\b/i,
  },
  {
    id: "roguelike",
    rotulo: { pt: "roguelike", en: "roguelike" },
    teste: /roguelike/i,
  },
  {
    id: "nuclear",
    rotulo: { pt: "Nuclear", en: "Nuclear" },
    teste: /nuclear/i,
  },
];
const COR_FIO = { engine: "#5eead4", estudio: "#f59e0b", tema: "#f472b6" };

const CW = 158;
const CH = 86;
const COL = 210;
const LIN = 104;
const ESQ = 130;

const anoDe = (p) => Number(String(p.ano).match(/\d{4}/)?.[0] ?? 2024);
const ordem = (a, b) => anoDe(a) - anoDe(b) || a.id - b.id;
const texto = (p) => `${p.nome} ${p.tipo.pt} ${p.resumo.pt}`;

function montar() {
  const anos = [...new Set(projetos.map(anoDe))].sort();
  const pos = {};
  let y = 50;
  const faixas = FAIXAS.map((f) => {
    const pilhas = {};
    for (const p of projetos.filter((q) => q.categoria === f.id).sort(ordem)) {
      const col = anos.indexOf(anoDe(p));
      const n = (pilhas[col] = (pilhas[col] ?? 0) + 1) - 1;
      pos[p.id] = {
        x: ESQ + col * COL,
        y: y + n * LIN,
        giro: ((p.id * 37) % 7) - 3,
      };
    }
    const altura = Math.max(1, ...Object.values(pilhas)) * LIN;
    const faixa = { ...f, y, altura };
    y += altura + 30;
    return faixa;
  });

  // Fios: cadeias em ordem de ano. Par repetido junta os rótulos.
  const pares = new Map();
  const ligar = (lista, tipo, rotulo) => {
    const ord = [...lista].sort(ordem);
    for (let i = 1; i < ord.length; i++) {
      const [a, b] = [ord[i - 1].id, ord[i].id];
      const k = a < b ? `${a}-${b}` : `${b}-${a}`;
      const f = pares.get(k) ?? {
        de: ord[i - 1].id,
        para: ord[i].id,
        tipos: [],
        rotulos: [],
      };
      f.tipos.push(tipo);
      f.rotulos.push(rotulo);
      pares.set(k, f);
    }
  };
  const porEngine = {};
  for (const p of projetos) (porEngine[p.engine] ??= []).push(p);
  for (const [engine, lista] of Object.entries(porEngine))
    ligar(lista, "engine", { pt: engine, en: engine });
  ligar(
    projetos.filter((p) => ESTUDIO.has(p.id)),
    "estudio",
    { pt: "Rapadura Atômica", en: "Rapadura Atômica" },
  );
  for (const t of TEMAS)
    ligar(
      projetos.filter((p) => t.teste.test(texto(p))),
      "tema",
      t.rotulo,
    );

  return {
    anos,
    pos,
    faixas,
    fios: [...pares.values()],
    largura: ESQ + anos.length * COL + 40,
    altura: y + 20,
  };
}

// Pista de um projeto ainda não descoberto: de onde vem o sinal e uma dica.
const PLANETA = {
  jogos: { pt: "planeta Jogos", en: "planet Games" },
  ferramenta: { pt: "planeta Ferramentas", en: "planet Tools" },
  web: { pt: "planeta Web e apps", en: "planet Web & apps" },
  estudo: { pt: "cinturão de estudos", en: "study belt" },
};

export default function DiarioMapa({ campo, aoFechar, aoIr, aoPagina }) {
  const caixaRef = useRef(null);
  useFocoPreso(caixaRef);
  const d = useDiario();
  const mapa = useMemo(montar, []);
  const visto = (id) => d.projetos.includes(id);
  const [sel, setSel] = useState(null); // projeto aberto no painel
  const [vista, setVista] = useState({ x: 0, y: 0, s: 1 });
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const janelaRef = useRef(null);
  // Tela estreita (celular em pé): o mapa vira lista vertical por categoria.
  const [estreita, setEstreita] = useState(() => window.innerWidth < 760);
  useEffect(() => {
    const medir = () => setEstreita(window.innerWidth < 760);
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  const selRef = useRef(null);
  selRef.current = sel;

  const total = projetos.length;
  const completo = d.projetos.length >= total;

  // Enquadra o mapa na largura da tela ao abrir.
  useEffect(() => {
    const j = janelaRef.current;
    if (!j) return;
    const s = Math.max(0.42, Math.min(1, (j.clientWidth - 24) / mapa.largura));
    setVista({
      x: Math.max(12, (j.clientWidth - mapa.largura * s) / 2),
      y: 12,
      s,
    });
  }, [mapa, estreita]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Escape" && selRef.current) setSel(null);
        else aoFechar();
      }
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [aoFechar]);

  // Arrastar e zoom (rodinha / pinça), com clique preservado.
  useEffect(() => {
    const j = janelaRef.current;
    if (!j) return;
    const ponteiros = new Map();
    let arrasto = null;
    let pinca = null;
    let engolir = false;
    const zoom = (sx, sy, f) => {
      const v = vistaRef.current;
      const s = Math.min(2, Math.max(0.35, v.s * f));
      const r = j.getBoundingClientRect();
      const px = sx - r.left;
      const py = sy - r.top;
      setVista({
        s,
        x: px - ((px - v.x) * s) / v.s,
        y: py - ((py - v.y) * s) / v.s,
      });
    };
    const rolar = (e) => {
      e.preventDefault();
      e.stopPropagation();
      zoom(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
    };
    const baixar = (e) => {
      if (e.button > 0 || e.target.closest("a, [data-sem-arraste-diario]"))
        return;
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ponteiros.size === 1)
        arrasto = { x: e.clientX, y: e.clientY, ativo: false };
      if (ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()];
        pinca = Math.hypot(a.x - b.x, a.y - b.y);
        arrasto = null;
      }
    };
    const mover = (e) => {
      if (!ponteiros.has(e.pointerId)) return;
      const antes = ponteiros.get(e.pointerId);
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinca && ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()];
        const dd = Math.hypot(a.x - b.x, a.y - b.y);
        if (dd >= 1 && pinca >= 1) zoom((a.x + b.x) / 2, (a.y + b.y) / 2, dd / pinca);
        pinca = dd;
        return;
      }
      if (!arrasto) return;
      if (
        !arrasto.ativo &&
        Math.hypot(e.clientX - arrasto.x, e.clientY - arrasto.y) < 4
      )
        return;
      const dx = arrasto.ativo ? e.clientX - antes.x : e.clientX - arrasto.x;
      const dy = arrasto.ativo ? e.clientY - antes.y : e.clientY - arrasto.y;
      arrasto.ativo = true;
      const v = vistaRef.current;
      setVista({ ...v, x: v.x + dx, y: v.y + dy });
    };
    const soltar = (e) => {
      if (!ponteiros.has(e.pointerId)) return;
      ponteiros.delete(e.pointerId);
      if (ponteiros.size < 2) pinca = null;
      if (arrasto?.ativo) engolir = true;
      arrasto = null;
      setTimeout(() => (engolir = false), 0);
    };
    const clicar = (e) => {
      if (!engolir) return;
      engolir = false;
      e.preventDefault();
      e.stopPropagation();
    };
    j.addEventListener("wheel", rolar, { passive: false });
    j.addEventListener("pointerdown", baixar);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    j.addEventListener("click", clicar, true);
    return () => {
      j.removeEventListener("wheel", rolar);
      j.removeEventListener("pointerdown", baixar);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      j.removeEventListener("click", clicar, true);
    };
  }, [estreita]);

  const conexoes = (id) =>
    mapa.fios
      .filter((f) => f.de === id || f.para === id)
      .map((f) => ({
        outro: projetos.find((p) => p.id === (f.de === id ? f.para : f.de)),
        rotulos: f.rotulos,
      }));

  return (
    <div
      ref={caixaRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={campo({ pt: "Diário de bordo", en: "Ship log" })}
      data-sem-arraste
      className="diario-tela outline-none absolute inset-0 z-50 flex flex-col overflow-hidden bg-[#03100d] text-tinta"
    >
      {/* Cabeçalho do terminal */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-[#5eead4]/25 bg-[#03100d]/95 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#5eead4]/70">
            {campo({
              pt: "computador de bordo // registro",
              en: "ship computer // log",
            })}
          </p>
          <h2 className="font-pixel text-2xl text-tinta">
            📓 {campo({ pt: "Diário de bordo", en: "Ship log" })}
          </h2>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 w-52 max-w-[40vw] border border-[#5eead4]/40">
              <div
                className="h-full bg-[#5eead4] transition-all"
                style={{ width: `${(d.projetos.length / total) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-bruma">
              {d.projetos.length}/{total}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FAIXAS.map((f) => {
              const lista = projetos.filter((p) => p.categoria === f.id);
              const n = lista.filter((p) => visto(p.id)).length;
              const ok = n === lista.length;
              return (
                <span
                  key={f.id}
                  className={`border px-1.5 py-0.5 font-pixel text-[10px] ${ok ? "text-breu" : "text-bruma"}`}
                  style={{
                    borderColor: f.cor,
                    background: ok ? f.cor : "transparent",
                  }}
                >
                  {ok ? "★ " : ""}
                  {campo(f.nome)} {n}/{lista.length}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="font-pixel text-sm text-bruma hover:text-[#5eead4]"
          >
            ✕ {campo({ pt: "Fechar", en: "Close" })} (J)
          </button>
          {!estreita && (
            <div className="flex flex-wrap justify-end gap-3 font-mono text-[10px] text-bruma">
              <Legenda cor={COR_FIO.engine}>
                {campo({ pt: "mesma engine", en: "same engine" })}
              </Legenda>
              <Legenda cor={COR_FIO.tema}>
                {campo({ pt: "mesmo tema", en: "same theme" })}
              </Legenda>
              <Legenda cor={COR_FIO.estudio} tracejado>
                {campo({ pt: "no estúdio", en: "at the studio" })}
              </Legenda>
            </div>
          )}
          {!estreita && (
            <p className="font-mono text-[10px] text-bruma/60">
              {campo({
                pt: "arraste · role para zoom · clique num cartão",
                en: "drag · scroll to zoom · click a card",
              })}
            </p>
          )}
        </div>
      </div>

      {completo && (
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#f59e0b]/40 bg-[#1a1203] px-4 py-2.5">
          <p className="max-w-3xl font-mono text-xs text-tinta/90">
            <span className="text-[#f59e0b]">
              📡{" "}
              {campo({
                pt: "transmissão recebida",
                en: "incoming transmission",
              })}
              :
            </span>{" "}
            {campo({
              pt: "Você viu tudo. Pouca gente pousa em todos os planetas. Se chegou até aqui, a gente provavelmente ia se dar bem trabalhando junto.",
              en: "You saw everything. Not many people land on every planet. If you made it this far, we would probably work well together.",
            })}
          </p>
          <button
            type="button"
            onClick={() => aoIr("radio")}
            className="botao-pixel text-xs"
          >
            {campo({ pt: "Abrir a rádio", en: "Open the radio" })}
          </button>
        </div>
      )}

      {estreita && (
        <div className="relative flex-1 overflow-y-auto overscroll-contain px-3 pb-24 pt-3">
          {FAIXAS.map((f) => {
            const lista = projetos
              .filter((p) => p.categoria === f.id)
              .sort(ordem);
            return (
              <section key={f.id} className="mb-5">
                <h3
                  className="mb-2 flex items-center gap-2 font-pixel text-xs uppercase tracking-widest"
                  style={{ color: f.cor }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: f.cor }}
                  />
                  {campo(f.nome)}
                  <span className="text-bruma/60">
                    {lista.filter((p) => visto(p.id)).length}/{lista.length}
                  </span>
                </h3>
                <ul className="space-y-2">
                  {lista.map((p) => {
                    const n = conexoes(p.id).length;
                    if (!visto(p.id))
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => aoIr(p.categoria)}
                            className="flex w-full items-center gap-3 border-2 border-dashed border-white/15 bg-black/30 p-2 text-left active:bg-[#5eead4]/10"
                          >
                            <span className="grid h-12 w-12 shrink-0 place-items-center font-pixel text-xl text-white/30">
                              ?
                            </span>
                            <span className="min-w-0">
                              <span className="block font-pixel text-xs text-white/50">
                                {campo({
                                  pt: "sinal fraco",
                                  en: "faint signal",
                                })}
                              </span>
                              <span className="block font-mono text-[11px] text-bruma/60">
                                {campo({ pt: "vem do", en: "from the" })}{" "}
                                <span style={{ color: f.cor }}>
                                  {campo(PLANETA[p.categoria])}
                                </span>{" "}
                                · “{campo(p.tipo)}”
                              </span>
                            </span>
                            <span className="ml-auto font-pixel text-[10px] text-[#5eead4]/70">
                              {campo({ pt: "ir ›", en: "go ›" })}
                            </span>
                          </button>
                        </li>
                      );
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSel(p)}
                          className={`flex w-full items-center gap-3 bg-[#f3efe4] p-1.5 text-left shadow-[3px_3px_0_rgba(0,0,0,0.55)] ${sel?.id === p.id ? "ring-2 ring-[#5eead4]" : ""}`}
                          style={{ borderLeft: `6px solid ${f.cor}` }}
                        >
                          {p.imagem ? (
                            <img
                              src={p.imagem}
                              alt=""
                              draggable={false}
                              className="h-14 w-20 shrink-0 object-cover [image-rendering:pixelated]"
                            />
                          ) : (
                            <span className="grid h-14 w-20 shrink-0 place-items-center bg-[#1b2421] text-2xl">
                              {p.icon}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block font-pixel text-sm leading-tight text-[#141414]">
                              {p.nome}
                            </span>
                            <span className="block truncate font-mono text-[11px] text-[#4b4b4b]">
                              {campo(p.tipo)} · {p.engine} · {p.ano}
                            </span>
                            {n > 0 && (
                              <span className="block font-mono text-[10px] text-[#6b6b6b]">
                                🔗 {n}{" "}
                                {campo(
                                  n === 1
                                    ? { pt: "ligação", en: "link" }
                                    : { pt: "ligações", en: "links" },
                                )}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          <div className="diario-varredura pointer-events-none fixed inset-0" />
        </div>
      )}

      {/* Mapa arrastável */}
      {!estreita && (
        <div
          ref={janelaRef}
          className="relative flex-1 cursor-grab touch-none overflow-hidden select-none"
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: mapa.largura,
              height: mapa.altura,
              transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.s})`,
            }}
          >
            {mapa.anos.map((a, i) => (
              <span
                key={a}
                className="absolute top-1 font-pixel text-base text-[#5eead4]/60"
                style={{
                  left: ESQ + i * COL + CW / 2,
                  transform: "translateX(-50%)",
                }}
              >
                {a}
              </span>
            ))}
            {mapa.faixas.map((f) => (
              <div
                key={f.id}
                className="absolute left-0 right-0 border-t border-dashed border-[#5eead4]/10"
                style={{ top: f.y - 14, height: f.altura }}
              >
                <span
                  className="absolute left-3 top-4 font-pixel text-xs uppercase tracking-widest"
                  style={{ color: f.cor }}
                >
                  {campo(f.nome)}
                </span>
              </div>
            ))}

            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              width={mapa.largura}
              height={mapa.altura}
            >
              {mapa.fios.map((f, i) => {
                const a = visto(f.de);
                const b = visto(f.para);
                if (!a && !b) return null;
                // Fios saem pela lateral dos cartões: mesma coluna faz uma curva
                // por fora (à direita); colunas diferentes vão da borda direita à esquerda.
                const A = mapa.pos[f.de];
                const B = mapa.pos[f.para];
                const mesmaCol = Math.abs(A.x - B.x) < COL / 2;
                let p;
                let q;
                let curva;
                let rotulo;
                if (mesmaCol) {
                  p = { x: A.x + CW, y: A.y + CH / 2 };
                  q = { x: B.x + CW, y: B.y + CH / 2 };
                  const bojo = 26 + (Math.abs(A.y - B.y) / LIN) * 8;
                  curva = `M${p.x},${p.y} C${p.x + bojo},${p.y} ${q.x + bojo},${q.y} ${q.x},${q.y}`;
                  rotulo = {
                    x: p.x + bojo * 0.8,
                    y: (p.y + q.y) / 2,
                    ancora: "start",
                  };
                } else {
                  const [E, D] = A.x < B.x ? [A, B] : [B, A];
                  p = { x: E.x + CW, y: E.y + CH / 2 };
                  q = { x: D.x, y: D.y + CH / 2 };
                  curva = `M${p.x},${p.y} C${(p.x + q.x) / 2},${p.y} ${(p.x + q.x) / 2},${q.y} ${q.x},${q.y}`;
                  rotulo = {
                    x: (p.x + q.x) / 2,
                    y: (p.y + q.y) / 2 - 7,
                    ancora: "middle",
                  };
                }
                const tipo = f.tipos.includes("tema") ? "tema" : f.tipos[0];
                const cor = COR_FIO[tipo];
                const ambos = a && b;
                const destaque = sel && (sel.id === f.de || sel.id === f.para);
                return (
                  <g
                    key={i}
                    opacity={ambos ? (sel && !destaque ? 0.25 : 0.9) : 0.28}
                  >
                    <path
                      d={curva}
                      fill="none"
                      stroke={cor}
                      strokeWidth={destaque ? 3 : 2}
                      style={{ filter: `drop-shadow(0 0 3px ${cor})` }}
                      strokeDasharray={
                        tipo === "estudio" || !ambos ? "6 5" : undefined
                      }
                      className={ambos ? "fio-pulso" : ""}
                    />
                    {ambos && (
                      <text
                        x={rotulo.x}
                        y={rotulo.y}
                        fill={cor}
                        fontSize="11"
                        fontFamily="monospace"
                        textAnchor={rotulo.ancora}
                        paintOrder="stroke"
                        stroke="#03100d"
                        strokeWidth="4"
                      >
                        {f.rotulos.map((r) => campo(r)).join(" · ")}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {projetos.map((p) => {
              const { x, y, giro } = mapa.pos[p.id];
              const faixa = FAIXAS.find((f) => f.id === p.categoria);
              if (!visto(p.id))
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => aoIr(p.categoria)}
                    title={campo({
                      pt: "Voar até a origem do sinal",
                      en: "Fly to the signal source",
                    })}
                    className="group absolute flex flex-col justify-center border-2 border-dashed border-white/15 bg-black/30 px-2.5 text-left transition hover:border-[#5eead4]/50 hover:bg-[#5eead4]/5"
                    style={{ left: x, top: y, width: CW, height: CH }}
                  >
                    <span className="font-pixel text-xs text-white/40 group-hover:text-[#5eead4]">
                      ? {campo({ pt: "sinal fraco", en: "faint signal" })}
                    </span>
                    <span className="mt-1 font-mono text-[10px] leading-snug text-bruma/60">
                      {campo({ pt: "vem do", en: "from the" })}{" "}
                      <span style={{ color: faixa.cor }}>
                        {campo(PLANETA[p.categoria])}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] leading-snug text-bruma/50">
                      “{campo(p.tipo)}” · {p.engine}
                    </span>
                  </button>
                );
              const ativo = sel?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSel(p)}
                  className={`group absolute bg-[#f3efe4] p-1 pb-0 text-left shadow-[3px_4px_0_rgba(0,0,0,0.55)] transition hover:z-10 hover:scale-105 ${ativo ? "z-10 scale-105 ring-2 ring-[#5eead4]" : ""}`}
                  style={{
                    left: x,
                    top: y,
                    width: CW,
                    height: CH,
                    transform: `rotate(${ativo ? 0 : giro}deg)`,
                  }}
                >
                  {/* alfinete */}
                  <span
                    className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-black/40"
                    style={{ background: faixa.cor }}
                  />
                  <span className="flex h-full gap-1.5">
                    {p.imagem ? (
                      <img
                        src={p.imagem}
                        alt=""
                        draggable={false}
                        className="h-[calc(100%-4px)] w-14 shrink-0 object-cover [image-rendering:pixelated]"
                      />
                    ) : (
                      <span className="grid h-[calc(100%-4px)] w-14 shrink-0 place-items-center bg-[#1b2421] text-2xl">
                        {p.icon}
                      </span>
                    )}
                    <span className="min-w-0 py-0.5">
                      <span className="block font-pixel text-[11px] leading-tight text-[#141414]">
                        {p.nome}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[9px] text-[#4b4b4b]">
                        {campo(p.tipo)}
                      </span>
                      <span className="block font-mono text-[9px] text-[#6b6b6b]">
                        {p.engine} · {p.ano}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {/* linhas de varredura do monitor */}
          <div className="diario-varredura pointer-events-none absolute inset-0" />
        </div>
      )}

      {/* Painel do cartão aberto */}
      {sel && (
        <aside
          data-sem-arraste-diario
          className="tela-abrir absolute inset-x-2 bottom-2 z-20 max-h-[60vh] overflow-y-auto border-2 border-[#5eead4]/60 bg-[#041512] p-4 shadow-pixel md:inset-x-auto md:bottom-auto md:right-3 md:top-[140px] md:w-[360px]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#5eead4]">
                {campo(sel.tipo)} · {sel.engine} · {sel.ano}
              </p>
              <h3 className="font-pixel text-xl text-tinta">{sel.nome}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSel(null)}
              className="font-pixel text-sm text-bruma hover:text-[#5eead4]"
            >
              ✕
            </button>
          </div>
          {sel.imagem && (
            <img
              src={sel.imagem}
              alt=""
              draggable={false}
              className="mt-3 aspect-video w-full border border-borda object-cover [image-rendering:pixelated]"
            />
          )}
          <p className="mt-3 text-sm leading-relaxed text-tinta/90">
            {campo(sel.resumo)}
          </p>
          <p className="mt-2 font-mono text-xs text-bruma">
            <span className="text-[#5eead4]">
              {campo({ pt: "papel", en: "role" })}:
            </span>{" "}
            {campo(sel.papel)}
          </p>
          {conexoes(sel.id).length > 0 && (
            <div className="mt-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bruma/70">
                {campo({ pt: "ligado a", en: "connected to" })}
              </p>
              <ul className="mt-1 space-y-0.5">
                {conexoes(sel.id).map(({ outro, rotulos }) => (
                  <li key={outro.id} className="font-mono text-xs">
                    {visto(outro.id) ? (
                      <button
                        type="button"
                        onClick={() => setSel(outro)}
                        className="text-tinta hover:text-[#5eead4]"
                      >
                        {outro.nome}
                      </button>
                    ) : (
                      <span className="text-bruma/50">
                        ? {campo({ pt: "não descoberto", en: "not found yet" })}
                      </span>
                    )}
                    <span className="text-bruma/60">
                      {" "}
                      — {rotulos.map((r) => campo(r)).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => aoIr(`p${sel.id}`)}
              className="botao-pixel text-xs"
            >
              🚀 {campo({ pt: "Voar até o planeta", en: "Fly to the planet" })}
            </button>
            <button
              type="button"
              onClick={() => aoPagina(sel.id)}
              className="botao-pixel-vazado text-xs"
            >
              {campo({ pt: "Página completa", en: "Full page" })}
            </button>
            {sel.repo && (
              <a
                href={sel.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-pixel-vazado text-xs"
              >
                {campo({ pt: "Código ↗", en: "Code ↗" })}
              </a>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function Legenda({ cor, tracejado, children }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block w-6 ${tracejado ? "border-t-2 border-dashed" : "h-0.5"}`}
        style={
          tracejado
            ? { borderColor: cor }
            : { background: cor, boxShadow: `0 0 4px ${cor}` }
        }
      />
      {children}
    </span>
  );
}
