const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const body = document.body;

const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
const revealItems = document.querySelectorAll(".reveal");
const sections = [...document.querySelectorAll("main section[id]")];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const SVG_NS = "http://www.w3.org/2000/svg";

/* ---------------------------------------------------------
   Navigation
   --------------------------------------------------------- */
const closeNavigation = () => {
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
  nav.classList.remove("is-open");
  body.classList.remove("nav-open");
};

navToggle.addEventListener("click", () => {
  const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
  navToggle.setAttribute("aria-expanded", String(willOpen));
  navToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
  nav.classList.toggle("is-open", willOpen);
  body.classList.toggle("nav-open", willOpen);
});

navLinks.forEach((link) => link.addEventListener("click", closeNavigation));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

/* ---------------------------------------------------------
   Hero headline: split into words for a staggered rise
   --------------------------------------------------------- */
const splitHeadline = (el) => {
  let index = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const outer = document.createElement("span");
          outer.className = "split-word";
          const inner = document.createElement("span");
          inner.textContent = part;
          inner.style.setProperty("--i", index++);
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        walk(child);
      }
    });
  };
  walk(el);
};

document.querySelectorAll("[data-split]").forEach(splitHeadline);

/* ---------------------------------------------------------
   Intro loader
   --------------------------------------------------------- */
const finishIntro = () => {
  body.classList.add("is-loaded");
  window.setTimeout(() => body.classList.add("is-ready"), 280);
};

const runIntro = () => {
  let seen = false;
  try {
    seen = sessionStorage.getItem("hy-intro-seen") === "1";
    sessionStorage.setItem("hy-intro-seen", "1");
  } catch (e) {
    /* storage unavailable — just play the intro */
  }

  if (prefersReducedMotion || seen) {
    body.classList.add("skip-intro", "is-loaded", "is-ready");
    return;
  }

  const countEl = document.querySelector("[data-loader-count]");
  const barEl = document.querySelector("[data-loader-bar]");
  const duration = 1250;
  const start = performance.now();

  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(eased * 100);
    if (countEl) countEl.textContent = String(value).padStart(2, "0");
    if (barEl) barEl.style.transform = `scaleX(${eased})`;
    if (t < 1) requestAnimationFrame(tick);
    else window.setTimeout(finishIntro, 180);
  };
  requestAnimationFrame(tick);

  // Safety net: never leave the loader up.
  window.setTimeout(() => {
    if (!body.classList.contains("is-ready")) finishIntro();
  }, 3500);
};

runIntro();

/* ---------------------------------------------------------
   Rotating role (typewriter)
   --------------------------------------------------------- */
const roleEl = document.querySelector(".role-rotator");
if (roleEl && !prefersReducedMotion) {
  const roles = roleEl.dataset.roles.split("|");
  let r = 0;
  let text = roles[0];
  let deleting = false;

  const step = () => {
    const target = roles[r];
    if (!deleting) {
      text = target.slice(0, text.length + 1);
      roleEl.textContent = text;
      if (text === target) {
        deleting = true;
        return window.setTimeout(step, 2200);
      }
      return window.setTimeout(step, 70);
    }
    text = text.slice(0, -1);
    roleEl.textContent = text;
    if (!text) {
      deleting = false;
      r = (r + 1) % roles.length;
      return window.setTimeout(step, 260);
    }
    return window.setTimeout(step, 38);
  };
  window.setTimeout(() => {
    deleting = true;
    step();
  }, 3600);
}

/* ---------------------------------------------------------
   Hero background: breathing dot field that reacts to the cursor
   --------------------------------------------------------- */
const heroCanvas = document.querySelector("[data-hero-canvas]");
if (heroCanvas && heroCanvas.getContext) {
  const ctx = heroCanvas.getContext("2d");
  const hero = heroCanvas.parentElement;
  const gap = 30;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let mouse = { x: -9999, y: -9999 };
  let running = true;
  let raf = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.offsetWidth;
    h = hero.offsetHeight;
    heroCanvas.width = w * dpr;
    heroCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, w, h);
    const t = time * 0.0006;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const wave = Math.sin(x * 0.012 + t * 2) + Math.cos(y * 0.016 - t * 1.6);
        let size = 0.7 + (wave + 2) * 0.35;
        let alpha = 0.1 + (wave + 2) * 0.04;
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let red = false;
        if (dist < 150) {
          const k = 1 - dist / 150;
          size += k * 2.6;
          alpha += k * 0.5;
          red = k > 0.25;
        }
        ctx.fillStyle = red ? `rgba(184,55,37,${alpha})` : `rgba(23,21,16,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (running && !prefersReducedMotion) raf = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  hero.addEventListener("pointerleave", () => {
    mouse = { x: -9999, y: -9999 };
  });

  new IntersectionObserver(([entry]) => {
    const wasRunning = running;
    running = entry.isIntersecting;
    if (running && !wasRunning && !prefersReducedMotion) raf = requestAnimationFrame(draw);
    if (!running) cancelAnimationFrame(raf);
  }).observe(hero);

  requestAnimationFrame(draw);
}

/* ---------------------------------------------------------
   Hero system map: step through BUSINESS → DATA → AI → IMPACT
   --------------------------------------------------------- */
const nodes = [...document.querySelectorAll("[data-node]")];
const stepEl = document.querySelector("[data-step]");
if (nodes.length) {
  let active = 0;
  const setActive = () => {
    nodes.forEach((n, i) => n.classList.toggle("is-active", i === active));
    if (stepEl) stepEl.textContent = String(active + 1).padStart(2, "0");
  };
  setActive();
  if (!prefersReducedMotion) {
    window.setInterval(() => {
      active = (active + 1) % nodes.length;
      setActive();
    }, 1800);
  }
}

/* ---------------------------------------------------------
   Custom cursor + magnetic buttons + tilt (fine pointers only)
   --------------------------------------------------------- */
if (finePointer && !prefersReducedMotion) {
  document.documentElement.classList.add("has-cursor");
  const dot = document.querySelector("[data-cursor-dot]");
  const ring = document.querySelector("[data-cursor-ring]");
  const label = document.querySelector("[data-cursor-label]");
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.addEventListener("pointerover", (e) => {
    const labelled = e.target.closest("[data-cursor]");
    const hoverable = e.target.closest("a, button, .marquee-track span, .mini-card, .impact-item");
    const dark = e.target.closest(".work, .contact, .site-footer, .loader");
    ring.classList.toggle("is-label", Boolean(labelled));
    ring.classList.toggle("is-hover", Boolean(hoverable) && !labelled);
    ring.classList.toggle("is-dark", Boolean(dark));
    dot.classList.toggle("is-hidden", Boolean(labelled));
    label.textContent = labelled ? labelled.dataset.cursor : "";
  });

  document.addEventListener("pointerleave", () => {
    ring.style.opacity = "0";
    dot.style.opacity = "0";
  });
  document.addEventListener("pointerenter", () => {
    ring.style.opacity = "";
    dot.style.opacity = "";
  });

  // Magnetic pull on buttons
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
  });

  // 3D tilt with a light sheen
  const tilt = (scene, target, strength) => {
    scene.addEventListener("pointermove", (e) => {
      const rect = scene.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      target.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * strength}deg) rotateY(${(px - 0.5) * strength}deg)`;
      target.style.setProperty("--mx", `${px * 100}%`);
      target.style.setProperty("--my", `${py * 100}%`);
    });
    scene.addEventListener("pointerleave", () => {
      target.style.transform = "";
    });
  };

  document.querySelectorAll("[data-tilt]").forEach((el) => tilt(el, el, 8));
  const heroScene = document.querySelector("[data-tilt-scene]");
  if (heroScene) tilt(heroScene, heroScene.querySelector("[data-tilt-target]"), 6);
}

/* ---------------------------------------------------------
   Scroll: progress bar, header hide/show, timeline rail
   --------------------------------------------------------- */
const progressEl = document.querySelector("[data-progress]");
const timeline = document.querySelector("[data-timeline]");
const timelineFill = document.querySelector("[data-timeline-fill]");
const timelineItems = timeline ? [...timeline.querySelectorAll(".timeline-item")] : [];
let lastY = window.scrollY;
let ticking = false;

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressEl) progressEl.style.setProperty("--p", max > 0 ? y / max : 0);

  header.classList.toggle("is-scrolled", y > 16);
  const goingDown = y > lastY + 4;
  const goingUp = y < lastY - 4;
  if (goingDown && y > 400 && !body.classList.contains("nav-open")) header.classList.add("is-hidden");
  if (goingUp || y < 400) header.classList.remove("is-hidden");
  lastY = y;

  if (timeline) {
    const rect = timeline.getBoundingClientRect();
    const anchor = window.innerHeight * 0.6;
    const t = clamp((anchor - rect.top) / rect.height, 0, 1);
    timelineFill.style.setProperty("--t", t);
    timelineItems.forEach((item) => {
      const top = item.getBoundingClientRect().top + 56;
      item.classList.toggle("is-passed", top < anchor);
    });
  }
  ticking = false;
};

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  },
  { passive: true }
);
window.addEventListener("resize", onScroll);
onScroll();

/* ---------------------------------------------------------
   Reveal on scroll
   --------------------------------------------------------- */
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.13, rootMargin: "0px 0px -6% 0px" }
);

revealItems.forEach((item) => revealObserver.observe(item));

/* ---------------------------------------------------------
   Count-up numbers
   --------------------------------------------------------- */
const formatNumber = (n) => n.toLocaleString("en-US");
const countObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (prefersReducedMotion) return;
      const duration = 1600;
      const start = performance.now();
      const tick = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = formatNumber(Math.round(target * eased)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = "0" + suffix;
      requestAnimationFrame(tick);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

/* ---------------------------------------------------------
   Marquees: duplicate tracks for a seamless loop
   --------------------------------------------------------- */
document.querySelectorAll(".marquee-row").forEach((row) => {
  const track = row.querySelector(".marquee-track");
  const clone = track.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  row.appendChild(clone);
});
document.querySelectorAll(".contact-marquee-track").forEach((track) => {
  [...track.children].forEach((child) => track.appendChild(child.cloneNode(true)));
});

/* ---------------------------------------------------------
   Project visual: typing query
   --------------------------------------------------------- */
document.querySelectorAll("[data-type]").forEach((el) => {
  const full = el.dataset.type;
  if (prefersReducedMotion) {
    el.textContent = full;
    return;
  }
  let i = 0;
  let started = false;
  const typeLoop = () => {
    if (i <= full.length) {
      el.textContent = full.slice(0, i++);
      window.setTimeout(typeLoop, 42);
    } else {
      window.setTimeout(() => {
        i = 0;
        typeLoop();
      }, 3200);
    }
  };
  new IntersectionObserver(([entry], obs) => {
    if (entry.isIntersecting && !started) {
      started = true;
      obs.disconnect();
      typeLoop();
    }
  }).observe(el);
});

/* ---------------------------------------------------------
   Project visual: PageRank-style graph
   --------------------------------------------------------- */
const seeded = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const graphSvg = document.querySelector("[data-graph]");
if (graphSvg) {
  const rand = seeded(7);
  const points = Array.from({ length: 26 }, () => ({
    x: 20 + rand() * 360,
    y: 20 + rand() * 260,
  }));
  const edges = [];
  points.forEach((p, i) => {
    const nearest = points
      .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    nearest.forEach(({ j }) => {
      if (!edges.some(([a, b]) => (a === j && b === i) || (a === i && b === j))) edges.push([i, j]);
    });
  });

  const lineEls = edges.map(([a, b]) => {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", points[a].x);
    line.setAttribute("y1", points[a].y);
    line.setAttribute("x2", points[b].x);
    line.setAttribute("y2", points[b].y);
    graphSvg.appendChild(line);
    return line;
  });

  const degree = points.map((_, i) => edges.filter(([a, b]) => a === i || b === i).length);
  const circleEls = points.map((p, i) => {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
    c.setAttribute("r", 2 + degree[i] * 0.9);
    graphSvg.appendChild(c);
    return c;
  });

  if (!prefersReducedMotion) {
    let current = 0;
    window.setInterval(() => {
      // "propagate rank": light up a node and its edges, then hop to a neighbour
      lineEls.forEach((l) => l.classList.remove("is-hot"));
      circleEls.forEach((c, i) => {
        c.classList.remove("is-hot");
        c.setAttribute("r", 2 + degree[i] * 0.9);
      });
      const touching = edges.map((e, k) => ({ e, k })).filter(({ e }) => e.includes(current));
      touching.forEach(({ k }) => lineEls[k].classList.add("is-hot"));
      circleEls[current].classList.add("is-hot");
      circleEls[current].setAttribute("r", 4 + degree[current] * 1.6);
      const next = touching.length ? touching[Math.floor(Math.random() * touching.length)].e : [0, 0];
      current = next[0] === current ? next[1] : next[0];
    }, 650);
  }
}

/* ---------------------------------------------------------
   Project visual: points that settle into clusters
   --------------------------------------------------------- */
const clusterSvg = document.querySelector("[data-cluster]");
if (clusterSvg) {
  const rand = seeded(42);
  const palette = ["#b83725", "#171510", "#c99a3c", "#6e6657"];
  const layouts = [
    [
      { x: 90, y: 90 },
      { x: 300, y: 80 },
      { x: 110, y: 220 },
      { x: 290, y: 210 },
    ],
    [
      { x: 200, y: 70 },
      { x: 80, y: 170 },
      { x: 320, y: 170 },
      { x: 200, y: 240 },
    ],
    [
      { x: 70, y: 70 },
      { x: 330, y: 230 },
      { x: 200, y: 150 },
      { x: 300, y: 70 },
    ],
  ];
  const legend = [...document.querySelectorAll(".cluster-legend span")];
  const N = 52;
  const assignments = Array.from({ length: N }, (_, i) => i % 4);
  const offsets = Array.from({ length: N }, () => ({
    a: rand() * Math.PI * 2,
    r: Math.sqrt(rand()) * 42,
  }));

  const ellipses = layouts[0].map(() => {
    const el = document.createElementNS(SVG_NS, "ellipse");
    el.setAttribute("rx", 56);
    el.setAttribute("ry", 50);
    clusterSvg.appendChild(el);
    return el;
  });

  const dots = assignments.map((k) => {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("r", 4);
    c.setAttribute("cx", 20 + rand() * 360);
    c.setAttribute("cy", 20 + rand() * 260);
    c.setAttribute("fill", "#6e6657");
    c.setAttribute("fill-opacity", "0.85");
    clusterSvg.appendChild(c);
    return c;
  });

  let layout = 0;
  let clustered = false;

  const scatter = () => {
    clusterSvg.classList.remove("is-clustered");
    dots.forEach((c) => {
      c.setAttribute("cx", 20 + rand() * 360);
      c.setAttribute("cy", 20 + rand() * 260);
      c.setAttribute("fill", "#6e6657");
    });
  };

  const settle = () => {
    const centers = layouts[layout];
    clusterSvg.classList.add("is-clustered");
    dots.forEach((c, i) => {
      const center = centers[assignments[i]];
      c.setAttribute("cx", center.x + Math.cos(offsets[i].a) * offsets[i].r);
      c.setAttribute("cy", center.y + Math.sin(offsets[i].a) * offsets[i].r * 0.85);
      c.setAttribute("fill", palette[assignments[i]]);
    });
    ellipses.forEach((el, k) => {
      el.setAttribute("cx", centers[k].x);
      el.setAttribute("cy", centers[k].y);
      el.setAttribute("stroke", palette[k]);
    });
    legend.forEach((l, i) => l.classList.toggle("is-active", i === layout));
  };

  if (prefersReducedMotion) {
    settle();
  } else {
    new IntersectionObserver(([entry], obs) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      settle();
      clustered = true;
      window.setInterval(() => {
        if (clustered) {
          scatter();
        } else {
          layout = (layout + 1) % layouts.length;
          settle();
        }
        clustered = !clustered;
      }, 2600);
    }, { threshold: 0.4 }).observe(clusterSvg);
  }
}

/* ---------------------------------------------------------
   Active nav link
   --------------------------------------------------------- */
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-38% 0px -55%", threshold: 0 }
);

sections.forEach((section) => sectionObserver.observe(section));

document.querySelector("[data-year]").textContent = new Date().getFullYear();
