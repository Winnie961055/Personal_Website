const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
const revealItems = document.querySelectorAll(".reveal");
const sections = [...document.querySelectorAll("main section[id]")];

const closeNavigation = () => {
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
};

navToggle.addEventListener("click", () => {
  const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
  navToggle.setAttribute("aria-expanded", String(willOpen));
  navToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
  nav.classList.toggle("is-open", willOpen);
  document.body.classList.toggle("nav-open", willOpen);
});

navLinks.forEach((link) => link.addEventListener("click", closeNavigation));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.13 }
);

revealItems.forEach((item) => revealObserver.observe(item));

// Keep every section readable if an older browser delays or skips observer callbacks.
window.setTimeout(() => {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}, 1600);

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
