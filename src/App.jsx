import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useInView,
} from "framer-motion";

/* ══════════════════════════════════════════════════════════════════
   GLOBAL CSS
══════════════════════════════════════════════════════════════════ */
const INJECTED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    cursor: none !important;
    margin: 0; padding: 0;
  }

  html { scroll-behavior: smooth; }

  body {
    background: #080808;
    color: #b0b0b0;
    font-family: 'Share Tech Mono', 'Courier New', monospace;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: #080808; }
  ::-webkit-scrollbar-thumb { background: #7a0000; }
  ::-webkit-scrollbar-thumb:hover { background: #c8102e; }

  @keyframes glitch {
    0%,88%,100% { transform: translate(0,0); color: inherit; text-shadow: none; }
    89% { transform: translate(-4px, 1px); color: #ff1030; text-shadow: 4px 0 #00f0ff; }
    90% { transform: translate(4px,-1px); color: #00e0ff; text-shadow: -4px 0 #ff0030; }
    91% { transform: translate(0,0); color: inherit; text-shadow: none; }
  }

  @keyframes blink {
    0%,100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .g { animation: glitch 6s infinite; }
  .blink { animation: blink 1.2s step-end infinite; }

  .redacted {
    background: #5a0000;
    color: transparent;
    border-radius: 1px;
    padding: 1px 4px;
    transition: background .35s, color .35s;
  }
  .redacted:hover { background: transparent !important; color: #c8102e !important; }

  ::selection { background: #5a0000; color: #c8102e; }
`;

/* ══════════════════════════════════════════════════════════════════
   NOISE CANVAS
══════════════════════════════════════════════════════════════════ */
const NoiseCanvas = () => {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let id, frame = 0;

    const resize = () => {
      c.width  = Math.ceil(window.innerWidth  / 2);
      c.height = Math.ceil(window.innerHeight / 2);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      if (++frame % 3 === 0) {
        const w = c.width, h = c.height;
        const img = ctx.createImageData(w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 220) | 0;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = (Math.random() * 18) | 0;
        }
        ctx.putImageData(img, 0, 0);
      }
      id = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 9999,
        imageRendering: "pixelated",
        mixBlendMode: "overlay", opacity: 0.4,
      }}
    />
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCANLINE
══════════════════════════════════════════════════════════════════ */
const Scanline = () => (
  <motion.div
    animate={{ top: ["-8%", "108%"] }}
    transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
    style={{
      position: "fixed", left: 0, right: 0, height: 90,
      background: "linear-gradient(transparent, rgba(200,16,46,0.022), transparent)",
      pointerEvents: "none", zIndex: 9998,
    }}
  />
);

/* ══════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════════════════════════════ */
const CustomCursor = () => {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 520, damping: 36 });
  const sy = useSpring(my, { stiffness: 520, damping: 36 });
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const mv = e => { mx.set(e.clientX); my.set(e.clientY); };
    const dn = () => setPressed(true);
    const up = () => setPressed(false);
    window.addEventListener("mousemove", mv);
    window.addEventListener("mousedown", dn);
    window.addEventListener("mouseup",   up);
    return () => {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mousedown", dn);
      window.removeEventListener("mouseup",   up);
    };
  }, []);

  return (
    <motion.div
      style={{
        position: "fixed",
        x: sx, y: sy, translateX: "-50%", translateY: "-50%",
        pointerEvents: "none", zIndex: 99999,
        scale: pressed ? 0.72 : 1,
        transition: "scale .1s",
      }}
    >
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <line x1="15" y1="0"  x2="15" y2="9"  stroke="#c8102e" strokeWidth="1.2"/>
        <line x1="15" y1="21" x2="15" y2="30" stroke="#c8102e" strokeWidth="1.2"/>
        <line x1="0"  y1="15" x2="9"  y2="15" stroke="#c8102e" strokeWidth="1.2"/>
        <line x1="21" y1="15" x2="30" y2="15" stroke="#c8102e" strokeWidth="1.2"/>
        <circle cx="15" cy="15" r="4.5" stroke="#c8102e" strokeWidth="1.2"/>
        <circle cx="15" cy="15" r="1.5" fill="#c8102e"/>
      </svg>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ALL-SEEING EYE
══════════════════════════════════════════════════════════════════ */
const AllSeeingEye = () => {
  const ref = useRef(null);
  const [p, setP] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fn = e => {
      if (!ref.current) return;
      const r   = ref.current.getBoundingClientRect();
      const cx  = r.left + r.width  / 2;
      const cy  = r.top  + r.height / 2;
      const dx  = e.clientX - cx;
      const dy  = e.clientY - cy;
      const ang = Math.atan2(dy, dx);
      const d   = Math.min(Math.hypot(dx, dy) * 0.07, 17);
      setP({ x: Math.cos(ang) * d, y: Math.sin(ang) * d });
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  return (
    <div ref={ref} style={{ width: 320, height: 320 }}>
      <svg viewBox="0 0 320 320" width="320" height="320">
        {/* Outer triangle */}
        <polygon points="160,22 295,258 25,258" fill="none" stroke="#5a0000" strokeWidth="1.5" opacity=".75"/>
        <polygon points="160,58 265,248 55,248" fill="none" stroke="#380000" strokeWidth="1"   opacity=".5"/>
        {/* Rays */}
        {[...Array(20)].map((_, i) => {
          const a = (i * 18) * Math.PI / 180;
          return (
            <line key={i}
              x1={160 + Math.cos(a) * 58} y1={160 + Math.sin(a) * 58}
              x2={160 + Math.cos(a) * 78} y2={160 + Math.sin(a) * 78}
              stroke="#3d0000" strokeWidth="1" opacity=".55"
            />
          );
        })}
        {/* Eye outline */}
        <path d="M 78,160 Q 160,102 242,160 Q 160,218 78,160 Z"
          fill="#060000" stroke="#c8102e" strokeWidth="1.6"/>
        {/* Iris */}
        <circle cx={160 + p.x} cy={160 + p.y} r="28" fill="#200000"/>
        <circle cx={160 + p.x} cy={160 + p.y} r="28" fill="none" stroke="#5a0000" strokeWidth="1.2" opacity=".9"/>
        {[...Array(8)].map((_, i) => {
          const a = (i * 45) * Math.PI / 180;
          return (
            <line key={i}
              x1={160 + p.x + Math.cos(a) * 13} y1={160 + p.y + Math.sin(a) * 13}
              x2={160 + p.x + Math.cos(a) * 26} y2={160 + p.y + Math.sin(a) * 26}
              stroke="#7a0000" strokeWidth="0.8" opacity=".7"
            />
          );
        })}
        {/* Pupil */}
        <circle cx={160 + p.x} cy={160 + p.y} r="12" fill="#000"/>
        {/* Glint */}
        <circle cx={165 + p.x} cy={155 + p.y} r="3.5" fill="#c8102e" opacity=".65"/>
        {/* Pulsing ring */}
        <motion.circle cx="160" cy="160" r="54" fill="none" stroke="#c8102e" strokeWidth=".8"
          animate={{ scale: [1, 1.28, 1], opacity: [.45, 0, .45] }}
          transition={{ duration: 4.5, repeat: Infinity }}
          style={{ transformOrigin: "160px 160px" }}
        />
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════════════ */
const LINKS = [
  ["hero",    "ГЛАВНЫЙ ЗАЛ"],
  ["history", "ЗАЛ ИСТОРИИ"],
  ["plot",    "ЗАЛ СЮЖЕТА"],
  ["meanings","ЗАЛ СМЫСЛОВ"],
  ["library", "БИБЛИОТЕКА"],
];

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [active,   setActive]   = useState("hero");

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 60);
      const cur = LINKS.findIndex(([id]) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= 130 && r.bottom > 0;
      });
      if (cur >= 0) setActive(LINKS[cur][0]);
    };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ delay: 0.6 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: "10px 32px",
        background: scrolled ? "rgba(5,5,5,0.97)" : "transparent",
        borderBottom: scrolled ? "1px solid #161616" : "none",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all .4s",
      }}
    >
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#8b0000", letterSpacing:5 }}>
        АРХИВ / 1984
      </div>

      <div style={{ display:"flex", gap:28 }}>
        {LINKS.map(([id, label]) => (
          <button key={id}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" })}
            style={{
              background: "none", border: "none",
              borderBottom: active === id ? "1px solid #c8102e" : "1px solid transparent",
              fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
              color: active === id ? "#c8102e" : "#3a3a3a",
              letterSpacing: ".14em", padding: "3px 0",
              transition: "all .2s",
            }}
          >{label}</button>
        ))}
      </div>

      <div style={{ fontFamily:"monospace", fontSize:10, color:"#2a2a2a", letterSpacing:".1em" }}>
        <span className="blink">●</span>{" "}СЛЕЖКА АКТИВНА
      </div>
    </motion.nav>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SECTION LABEL HELPER
══════════════════════════════════════════════════════════════════ */
const SectionLabel = ({ num, text }) => (
  <div style={{ fontFamily:"monospace", fontSize:10, color:"#8b0000", letterSpacing:".32em", marginBottom:8 }}>
    РАЗДЕЛ {num} / {text}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: "clamp(52px,8vw,98px)",
    color: "#d0d0d0",
    letterSpacing: 4,
    lineHeight: 1,
  }}>{children}</h2>
);

/* ══════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════ */
const Hero = () => (
  <section id="hero" style={{
    minHeight: "100vh",
    display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
    position: "relative", overflow: "hidden",
    background: "radial-gradient(ellipse at center, #110000 0%, #080808 68%)",
    paddingTop: 80,
  }}>
    {/* Grid background */}
    <div style={{
      position: "absolute", inset: 0, opacity: .11,
      backgroundImage: "linear-gradient(#1a1a1a 1px,transparent 1px),linear-gradient(90deg,#1a1a1a 1px,transparent 1px)",
      backgroundSize: "64px 64px",
    }}/>

    {/* Eye (background) */}
    <motion.div
      initial={{ opacity:0, scale:.65 }}
      animate={{ opacity:1, scale:1  }}
      transition={{ duration:2.8, ease:"easeOut" }}
      style={{ position:"absolute", opacity:.16 }}
    >
      <AllSeeingEye />
    </motion.div>

    {/* Main content */}
    <div style={{ textAlign:"center", position:"relative", zIndex:2 }}>

      <motion.div
        initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:.9 }}
        style={{ fontFamily:"monospace", fontSize:10, color:"#5a0000", letterSpacing:".42em", marginBottom:18 }}
      >
        СЕКРЕТНЫЙ АРХИВ — УРОВЕНЬ ДОПУСКА: OMEGA
      </motion.div>

      <motion.h1
        className="g"
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.3 }}
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(110px,18vw,260px)",
          lineHeight: .87,
          color: "#e8e8e8",
          textShadow: "0 0 110px rgba(200,16,46,.22)",
          letterSpacing: "-.01em",
          userSelect: "none",
        }}
      >1984</motion.h1>

      <motion.div
        initial={{ scaleX:0 }} animate={{ scaleX:1 }}
        transition={{ delay:1.9, duration:1.1 }}
        style={{ height:1, background:"linear-gradient(90deg,transparent,#c8102e,transparent)", width:380, margin:"20px auto" }}
      />

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2.4 }}
        style={{ fontFamily:"monospace", fontSize:12, color:"#555", letterSpacing:".3em" }}>
        ДЖОРДЖ ОРУЭЛЛ / GEORGE ORWELL
      </motion.div>

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2.9 }}
        style={{ fontFamily:"monospace", fontSize:10, color:"#2e2e2e", letterSpacing:".2em", marginTop:6 }}>
        ОПУБЛИКОВАНО: 1949 · КЛАССИФИЦИРОВАНО: НАВСЕГДА
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:3.5 }}
        style={{
          marginTop:58, display:"inline-block",
          padding:"11px 28px",
          border:"1px solid #7a0000",
          fontFamily:"monospace", fontSize:12, color:"#c8102e",
          letterSpacing:".22em",
        }}
      >
        <span className="blink" style={{ marginRight:9 }}>▶</span>
        БОЛЬШОЙ БРАТ СМОТРИТ НА ТЕБЯ
      </motion.div>
    </div>

    {/* Corner log */}
    <div style={{
      position:"absolute", top:88, left:20,
      fontFamily:"monospace", fontSize:9, color:"#1e1e1e",
      lineHeight:1.9, whiteSpace:"pre",
    }}>
      {`[СИСТ.НАБЛЮД. v4.0]\n[CONN: МИН.ЛЮБВИ]\n[ЗАПИСЬ АКТИВНА]\n[ID: 6079_W.S.]`}
    </div>

    {/* Scroll hint */}
    <motion.div
      animate={{ y:[0,9,0] }} transition={{ duration:2.6, repeat:Infinity }}
      style={{
        position:"absolute", bottom:34, left:"50%", transform:"translateX(-50%)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
      }}
    >
      <div style={{ fontFamily:"monospace", fontSize:9, letterSpacing:".25em", color:"#2a2a2a" }}>ПРОКРУТИТЬ</div>
      <div style={{ width:1, height:38, background:"linear-gradient(to bottom,#7a0000,transparent)" }}/>
    </motion.div>
  </section>
);

/* ══════════════════════════════════════════════════════════════════
   HISTORY
══════════════════════════════════════════════════════════════════ */
const Redacted = ({ t }) => {
  const [on, setOn] = useState(false);
  return (
    <span
      className={on ? "" : "redacted"}
      style={on ? { color:"#c8102e" } : {}}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
    >{t}</span>
  );
};

const HISTORY = [
  {
    yr: "1943",
    title: "НАЧАЛО РАБОТЫ",
    parts: [
      { t:"Оруэлл приступает к роману после возвращения с ", r:false },
      { t:"Гражданской войны в Испании", r:true },
      { t:". Он видел, как ", r:false },
      { t:"сталинизм уничтожает левые идеалы", r:true },
      { t:" — и понял, что предупреждение необходимо.", r:false },
    ]
  },
  {
    yr: "1944–48",
    title: "НАПИСАНИЕ В ССЫЛКЕ",
    parts: [
      { t:"Роман создавался на ", r:false },
      { t:"острове Джура в Шотландии", r:true },
      { t:". Оруэлл страдал от ", r:false },
      { t:"туберкулёза", r:true },
      { t:" — болезни, унёсшей его ", r:false },
      { t:"через год после публикации", r:true },
      { t:".", r:false },
    ]
  },
  {
    yr: "1949",
    title: "ПУБЛИКАЦИЯ",
    parts: [
      { t:"Роман вышел ", r:false },
      { t:"8 июня 1949 года", r:true },
      { t:". Первоначальное название — «", r:false },
      { t:"Последний человек в Европе", r:true },
      { t:"» — было отвергнуто издателями.", r:false },
    ]
  },
];

const History = () => {
  const ref = useRef(null);
  const inV = useInView(ref, { once:true, margin:"-80px" });

  return (
    <section id="history" ref={ref} style={{
      minHeight:"80vh", padding:"100px 10%",
      background:"#080808", borderTop:"1px solid #111",
    }}>
      <motion.div
        initial={{ opacity:0, x:-28 }} animate={inV ? {opacity:1,x:0} : {}}
        transition={{ duration:.75 }} style={{ marginBottom:60 }}
      >
        <SectionLabel num="02" text="CLASSIFIED"/>
        <SectionTitle>ЗАЛ ИСТОРИИ</SectionTitle>
        <p style={{ fontFamily:"monospace", fontSize:11, color:"#3a3a3a", marginTop:10, letterSpacing:".1em" }}>
          [РЕЖИМ: СЕКРЕТНЫЙ АРХИВ] — НАВЕДИ ДЛЯ РАССЕКРЕЧИВАНИЯ
        </p>
      </motion.div>

      <div style={{ display:"flex", flexDirection:"column", gap:52, maxWidth:820 }}>
        {HISTORY.map((item, i) => (
          <motion.div key={i}
            initial={{ opacity:0, y:24 }}
            animate={inV ? {opacity:1, y:0} : {}}
            transition={{ duration:.6, delay:.2 + i * .2 }}
            style={{ display:"flex", gap:32, paddingLeft:24, borderLeft:"2px solid #1a1a1a", position:"relative" }}
          >
            <div style={{ position:"absolute", left:-5, top:9, width:8, height:8, borderRadius:"50%", background:"#7a0000" }}/>
            <div style={{ minWidth:86, fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:"#7a0000", letterSpacing:2, lineHeight:1.1 }}>
              {item.yr}
            </div>
            <div>
              <div style={{ fontFamily:"monospace", fontSize:9, color:"#3a3a3a", letterSpacing:".28em", marginBottom:9 }}>
                {item.title}
              </div>
              <p style={{ fontFamily:"monospace", fontSize:13, color:"#6a6a6a", lineHeight:2.1 }}>
                {item.parts.map((p, j) =>
                  p.r
                    ? <Redacted key={j} t={p.t}/>
                    : <span key={j}>{p.t}</span>
                )}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity:0 }} animate={inV ? {opacity:1} : {}} transition={{ delay:1.4 }}
        style={{ marginTop:82, padding:"14px 18px", border:"1px solid #111", fontFamily:"monospace", fontSize:10, color:"#222", letterSpacing:".12em", maxWidth:520, lineHeight:1.8 }}
      >
        ⚠ ДОКУМЕНТ ЯВЛЯЕТСЯ СОБСТВЕННОСТЬЮ МИНИСТЕРСТВА ПРАВДЫ. НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП КАРАЕТСЯ ПО ЗАКОНУ 87-Б.
      </motion.div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PLOT
══════════════════════════════════════════════════════════════════ */
const PLOT = [
  {
    id:"01", title:"ДВУХМИНУТНАЯ НЕНАВИСТЬ", sub:"Two Minutes Hate",
    desc:"Ежедневный ритуал принудительных эмоций. Партия управляет не только действиями — она управляет чувствами. Параноидальный экстаз ненависти к Голдштейну сплавляет толпу в единое существо.",
    quote:"«Смотри. На. Экран.»", col:"#7a0000"
  },
  {
    id:"02", title:"МИНИСТЕРСТВО ПРАВДЫ", sub:"Minitrue",
    desc:"Уинстон переписывает прошлое в Отделе архивов. Каждое имя, каждая цифра — подлежат корректировке, если противоречат текущей позиции Партии. Настоящее всегда было таким.",
    quote:"«Кто контролирует прошлое — контролирует будущее.»", col:"#5a0000"
  },
  {
    id:"03", title:"ДНЕВНИК", sub:"The Diary",
    desc:"Первый акт самоопределения: взять ручку и написать. Это уже мыслепреступление. Каждая строка — приговор, который Уинстон сам себе выносит, зная, что за ним наблюдают.",
    quote:"«4 апреля 1984 г. ДОЛОЙ БОЛЬШОГО БРАТА.»", col:"#3d0000"
  },
  {
    id:"04", title:"Я ТЕБЯ ЛЮБЛЮ", sub:"Julia's Note",
    desc:"Три слова на клочке бумаги. В мире, где любовь — государственное преступление, эта записка опаснее бомбы. Начало запретной связи, обречённой с первого мгновения.",
    quote:"«Я тебя люблю.»", col:"#6a0a1a"
  },
  {
    id:"05", title:"КОМНАТА 101", sub:"Room 101",
    desc:"В подвале Министерства Любви. У каждого человека есть самый страшный страх. Партия знает, что находится в твоей комнате. И ждёт нужного момента.",
    quote:"«Самое страшное в мире — в комнате 101.»", col:"#280000"
  },
  {
    id:"06", title:"2 + 2 = 5", sub:"Doublethink",
    desc:"Финальная победа над разумом. Партия добилась невозможного: человек искренне верит тому, что противоречит реальности. Последняя свобода — математика — пала.",
    quote:"«Он любил Большого Брата.»", col:"#1c0000"
  },
];

const PlotCard = ({ item, i }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end","end start"] });
  const y       = useTransform(scrollYProgress, [0,1], [44,-44]);
  const opacity = useTransform(scrollYProgress, [0,.14,.86,1], [0,1,1,0]);
  const left    = i % 2 === 0;

  return (
    <motion.article
      ref={ref}
      style={{ opacity }}
      initial={{ x: left ? -55 : 55 }}
      whileInView={{ x: 0 }}
      viewport={{ once:true, margin:"-60px" }}
      transition={{ duration:.65 }}
    >
      <div style={{ display:"flex", flexDirection: left ? "row" : "row-reverse" }}>
        {/* Parallax number */}
        <motion.div style={{
          y,
          minWidth:88, display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Bebas Neue',sans-serif", fontSize:68,
          color: item.col, opacity:.55, flexShrink:0, lineHeight:1,
        }}>
          {item.id}
        </motion.div>

        {/* Card */}
        <div style={{
          flex:1, padding:"26px 28px",
          border:"1px solid #161616",
          background:"linear-gradient(135deg,#0c0c0c,#090909)",
          borderLeft:  left ? `3px solid ${item.col}` : "1px solid #161616",
          borderRight: left ? "1px solid #161616"     : `3px solid ${item.col}`,
        }}>
          <div style={{ fontFamily:"monospace", fontSize:9, color:"#3a3a3a", letterSpacing:".32em", marginBottom:7 }}>{item.sub}</div>
          <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:"#d0d0d0", letterSpacing:3, marginBottom:10 }}>
            {item.title}
          </h3>
          <p style={{ fontFamily:"monospace", fontSize:12, color:"#545454", lineHeight:1.95, marginBottom:14 }}>
            {item.desc}
          </p>
          <div style={{ fontFamily:"monospace", fontSize:12, color: item.col, borderLeft:`2px solid ${item.col}`, paddingLeft:10, fontStyle:"italic" }}>
            {item.quote}
          </div>
        </div>
      </div>
    </motion.article>
  );
};

const Plot = () => {
  const ref = useRef(null);
  const inV = useInView(ref, { once:true });

  return (
    <section id="plot" ref={ref} style={{ padding:"100px 8%", background:"#060606", borderTop:"1px solid #0f0f0f" }}>
      <motion.div initial={{ opacity:0 }} animate={inV ? {opacity:1} : {}} style={{ marginBottom:64 }}>
        <SectionLabel num="03" text="АРХИВ СОБЫТИЙ"/>
        <SectionTitle>ЗАЛ СЮЖЕТА</SectionTitle>
      </motion.div>
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {PLOT.map((item, i) => <PlotCard key={item.id} item={item} i={i}/>)}
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MEANINGS
══════════════════════════════════════════════════════════════════ */
const SLOGANS = [
  { ru:"ВОЙНА — ЭТО МИР",       en:"WAR IS PEACE"        },
  { ru:"СВОБОДА — ЭТО РАБСТВО", en:"FREEDOM IS SLAVERY"  },
  { ru:"НЕЗНАНИЕ — СИЛА",        en:"IGNORANCE IS STRENGTH"},
];

const NEWSPEAK = [
  { w:"МЫСЛЕПРЕСТУПЛЕНИЕ", d:"Любая мысль, противоречащая Партии. Обнаружение — немедленная смерть." },
  { w:"ДВОЕМЫСЛИЕ",        d:"Держать два взаимоисключающих убеждения и искренне верить обоим." },
  { w:"НЕЧЕЛОВЕК",         d:"Испаренная личность. Стёрта из документов и из памяти всех людей." },
  { w:"МИН.ЛЮБ",           d:"Министерство Любви. Поддерживает закон и порядок через страх и пытку." },
  { w:"НОВОЯЗ",            d:"Официальный язык Океании, созданный для уничтожения мыслепреступлений." },
  { w:"ИСПАРЕНИЕ",         d:"Полное уничтожение: физическое тело и все следы существования человека." },
];

const Meanings = () => {
  const ref = useRef(null);
  const inV = useInView(ref, { once:true, margin:"-80px" });

  return (
    <section id="meanings" ref={ref} style={{ padding:"100px 8%", background:"#080808", borderTop:"1px solid #111" }}>
      <motion.div initial={{ opacity:0 }} animate={inV ? {opacity:1} : {}} style={{ marginBottom:64 }}>
        <SectionLabel num="04" text="ИДЕОЛОГИЯ"/>
        <SectionTitle>ЗАЛ СМЫСЛОВ</SectionTitle>
      </motion.div>

      {/* Ingsoc slogans */}
      <div style={{ marginBottom:80 }}>
        {SLOGANS.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity:0, x:-36 }}
            animate={inV ? {opacity:1, x:0} : {}}
            transition={{ delay:.14 + i * .16, duration:.65 }}
            style={{ display:"flex", alignItems:"center", gap:24, padding:"18px 0", borderBottom:"1px solid #111" }}
          >
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(26px,4vw,56px)", color:"#8b0000", letterSpacing:3, flex:1 }}>
              {s.ru}
            </div>
            <div style={{ width:1, height:34, background:"#1c1c1c", flexShrink:0 }}/>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(14px,2vw,28px)", color:"#252525", letterSpacing:2, flex:1 }}>
              {s.en}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Newspeak glossary */}
      <motion.div initial={{ opacity:0 }} animate={inV ? {opacity:1} : {}} transition={{ delay:.7 }}>
        <div style={{ fontFamily:"monospace", fontSize:10, color:"#8b0000", letterSpacing:".3em", marginBottom:20 }}>
          СЛОВАРЬ НОВОЯЗА / NEWSPEAK GLOSSARY
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:2 }}>
          {NEWSPEAK.map((n, i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:18 }}
              animate={inV ? {opacity:1, y:0} : {}}
              transition={{ delay:.9 + i * .08 }}
              whileHover={{ backgroundColor:"#0d0000", borderColor:"#7a0000" }}
              style={{ padding:"18px 20px", border:"1px solid #161616", background:"#0a0a0a", transition:"all .25s" }}
            >
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#c8102e", letterSpacing:2, marginBottom:8 }}>
                {n.w}
              </div>
              <div style={{ fontFamily:"monospace", fontSize:11, color:"#444", lineHeight:1.7 }}>{n.d}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Doublethink diagram */}
      <motion.div
        initial={{ opacity:0 }} animate={inV ? {opacity:1} : {}} transition={{ delay:1.4 }}
        style={{ marginTop:72, padding:"36px", border:"1px solid #161616", display:"flex", gap:44, flexWrap:"wrap", alignItems:"center" }}
      >
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontFamily:"monospace", fontSize:10, color:"#8b0000", letterSpacing:".3em", marginBottom:16 }}>
            ДВОЕМЫСЛИЕ / DOUBLETHINK
          </div>
          {["ЗНАТЬ И НЕ ЗНАТЬ","ВЕРИТЬ И НЕ ВЕРИТЬ","ПОМНИТЬ И ЗАБЫТЬ","ЛГАТЬ И ВЕРИТЬ ПРАВДЕ"].map((l, i) => (
            <motion.div key={i}
              animate={{ opacity:[.2,.7,.2] }}
              transition={{ duration:3.8, delay: i * .55, repeat:Infinity }}
              style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:"#3a3a3a", letterSpacing:2, lineHeight:2.3 }}
            >{l}</motion.div>
          ))}
        </div>

        {/* Venn circles */}
        <div style={{ position:"relative", width:190, height:190, flexShrink:0 }}>
          {[
            { style:{ top:0, left:0 },   color:"#7a0000", label:"ПРАВДА" },
            { style:{ bottom:0, right:0 }, color:"#2a2a2a", label:"ЛОЖЬ"  },
          ].map((c, i) => (
            <motion.div key={i}
              animate={{ scale:[1,1.07,1], opacity:[.55+i*.15,.85-.15*i,.55+i*.15] }}
              transition={{ duration:3.2, delay:i*1.6, repeat:Infinity }}
              style={{
                position:"absolute", ...c.style,
                width:125, height:125, borderRadius:"50%",
                border:`1px solid ${c.color}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"monospace", fontSize:10, color:c.color,
              }}
            >{c.label}</motion.div>
          ))}
          <div style={{
            position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
            fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:"#1e1e1e"
          }}>≡</div>
        </div>
      </motion.div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════
   LIBRARY
══════════════════════════════════════════════════════════════════ */
const EXCERPTS = [
  {
    ch: "ЧАСТЬ I · ГЛАВА 1",
    text: `Был ясный, холодный апрельский день, и часы пробили тринадцать. Уинстон Смит, прижав подбородок к груди, чтобы спастись от злого ветра, торопливо скользнул за стеклянную дверь жилого дома «Победа», хотя не так быстро, чтобы ветер не успел вместе с ним швырнуть внутрь вихрь песчаной пыли.`,
  },
  {
    ch: "ДНЕВНИК · 4 АПРЕЛЯ",
    text: `4 апреля 1984 года.
Вчера в кино. Военные фильмы. Очень хороший — как лодку с беженцами бомбили вертолётами в Средиземном море. Публика очень развлекалась, кричала «ещё!», когда вертолёт топил лодку, полную детей.

ДОЛОЙ БОЛЬШОГО БРАТА.
ДОЛОЙ БОЛЬШОГО БРАТА.
ДОЛОЙ БОЛЬШОГО БРАТА.`,
  },
  {
    ch: "ЗАПИСКА ДЖУЛИИ",
    text: `Незнакомка протянула ему сложенный клочок бумаги.
Он развернул и прочитал. Написано было отчётливо, крупными буквами:

«Я тебя люблю.»

С минуту он сидел в оцепенении, не замечая смысла написанного. Потом понял — и почувствовал холодную тревогу.`,
  },
  {
    ch: "ЧАСТЬ III · ФИНАЛ",
    text: `Всё было в порядке, теперь всё в порядке, борьба окончена. Он одержал победу над собой. Он любил Большого Брата.`,
  },
];

const Library = () => {
  const [cur, setCur] = useState(0);
  const ref = useRef(null);
  const inV = useInView(ref, { once:true });

  return (
    <section id="library" ref={ref} style={{ padding:"100px 8% 140px", background:"#060606", borderTop:"1px solid #0f0f0f" }}>
      <motion.div initial={{ opacity:0 }} animate={inV ? {opacity:1} : {}} style={{ marginBottom:56 }}>
        <SectionLabel num="05" text="АРХИВНЫЕ ДАННЫЕ"/>
        <SectionTitle>БИБЛИОТЕКА</SectionTitle>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:22 }} animate={inV ? {opacity:1, y:0} : {}} transition={{ delay:.3 }}
        style={{ display:"grid", gridTemplateColumns:"210px 1fr", border:"1px solid #111", minHeight:390 }}
      >
        {/* TOC */}
        <div style={{ borderRight:"1px solid #111" }}>
          <div style={{ padding:"9px 14px", borderBottom:"1px solid #111", fontFamily:"monospace", fontSize:9, color:"#2a2a2a", letterSpacing:".2em" }}>
            СОДЕРЖАНИЕ
          </div>
          {EXCERPTS.map((e, i) => (
            <button key={i} onClick={() => setCur(i)} style={{
              display:"block", width:"100%", textAlign:"left",
              padding:"12px 14px", background: cur === i ? "#0c0000" : "transparent",
              border:"none", borderBottom:"1px solid #0e0e0e",
              borderLeft: cur === i ? "2px solid #8b0000" : "2px solid transparent",
              fontFamily:"monospace", fontSize:9,
              color: cur === i ? "#c8102e" : "#333",
              letterSpacing:".1em", lineHeight:1.6, transition:"all .2s",
            }}>{e.ch}</button>
          ))}
        </div>

        {/* Reader */}
        <AnimatePresence mode="wait">
          <motion.div key={cur}
            initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-14 }}
            transition={{ duration:.26 }}
            style={{ padding:"28px 36px", background:"#090909" }}
          >
            <div style={{ fontFamily:"monospace", fontSize:9, color:"#8b0000", letterSpacing:".3em", marginBottom:20, paddingBottom:10, borderBottom:"1px solid #0f0f0f" }}>
              {EXCERPTS[cur].ch}
            </div>
            <p style={{ fontFamily:"monospace", fontSize:13, color:"#606060", lineHeight:2.15, whiteSpace:"pre-line" }}>
              {EXCERPTS[cur].text}
            </p>
            <div style={{ marginTop:32, fontFamily:"monospace", fontSize:9, color:"#202020", display:"flex", alignItems:"center", gap:10 }}>
              <span className="blink">█</span>
              ДАЛЬНЕЙШЕЕ ЧТЕНИЕ — ЗАПРОС ОТКЛОНЁН ПАРТИЕЙ
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <div style={{ marginTop:100, textAlign:"center", fontFamily:"monospace", fontSize:9, color:"#1a1a1a", letterSpacing:".2em", lineHeight:2.6 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#141414", letterSpacing:7, marginBottom:12 }}>
          МИНИСТЕРСТВО ПРАВДЫ / MINITRUE
        </div>
        <div>© 1984 — ОКЕАНИЯ. ВСЕ МЫСЛИ ПРИНАДЛЕЖАТ ПАРТИИ.</div>
        <div>БОЛЬШОЙ БРАТ СМОТРИТ НА ТЕБЯ — ВСЕГДА И ВЕЗДЕ</div>
        <div style={{ marginTop:10, color:"#0d0d0d" }}>
          [ДОКУМЕНТ САМОУНИЧТОЖИТСЯ]<span className="blink"> █</span>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════════ */
export default function App() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = INJECTED_CSS;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch (_) {} };
  }, []);

  return (
    <div style={{ background:"#080808", minHeight:"100vh" }}>
      <NoiseCanvas />
      <Scanline />
      <CustomCursor />
      <Nav />
      <main>
        <Hero />
        <History />
        <Plot />
        <Meanings />
        <Library />
      </main>
    </div>
  );
}
