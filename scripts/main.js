/* ============================================
   PORTFOLIO — Main JS
   ============================================ */

/* ── AOS Init ── */
if (window.AOS) {
  AOS.init({
    duration: 700,
    once: true,
    offset: 80
  });
}

/* ── DOM Elements ── */
const navbar = document.getElementById("navbar");
const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.getElementById("mobileNav");
const starCanvas = document.getElementById("starfield");

/* ── Mobile Nav Toggle ── */
if (navToggle && mobileNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ── Navbar scroll effect ── */
if (navbar) {
  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    navbar.classList.toggle("scrolled", scrollY > 60);
    lastScroll = scrollY;
  }, { passive: true });
}

/* ── Role text rotation ── */
const roleTextEl = document.getElementById("roleText");
if (roleTextEl) {
  const roles = ["DEVELOPER", "DESIGNER", "CODER", "CREATOR"];
  let roleIndex = 0;

  setInterval(() => {
    roleIndex = (roleIndex + 1) % roles.length;
    roleTextEl.style.opacity = "0";
    roleTextEl.style.transform = "translateY(10px)";

    setTimeout(() => {
      roleTextEl.textContent = roles[roleIndex];
      roleTextEl.style.opacity = "1";
      roleTextEl.style.transform = "translateY(0)";
    }, 300);
  }, 2800);

  roleTextEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
}

/* ── FAQ Accordion ── */
document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const isActive = item.classList.contains("active");

    // Close all
    document.querySelectorAll(".faq-item").forEach((el) => {
      el.classList.remove("active");
      el.querySelector(".faq-question").setAttribute("aria-expanded", "false");
    });

    // Toggle current
    if (!isActive) {
      item.classList.add("active");
      btn.setAttribute("aria-expanded", "true");
    }
  });
});

/* ── Starfield Background ── */
if (starCanvas) {
  const ctx = starCanvas.getContext("2d");
  let stars = [];
  let animFrame;

  function resizeCanvas() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    const count = Math.min(Math.floor((starCanvas.width * starCanvas.height) / 8000), 200);

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * starCanvas.width,
        y: Math.random() * starCanvas.height,
        radius: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.0008 + 0.0002,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawStars(timestamp) {
    ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

    // Glow spots
    const glows = [
      { x: starCanvas.width * 0.15, y: starCanvas.height * 0.3, r: 280, color: "0, 217, 255" },
      { x: starCanvas.width * 0.85, y: starCanvas.height * 0.6, r: 240, color: "168, 85, 247" },
      { x: starCanvas.width * 0.5, y: starCanvas.height * 0.8, r: 300, color: "0, 217, 255" }
    ];

    glows.forEach((g) => {
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grad.addColorStop(0, `rgba(${g.color}, 0.04)`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, starCanvas.width, starCanvas.height);
    });

    // Stars
    stars.forEach((star) => {
      const twinkle = Math.sin((timestamp || 0) * star.speed + star.phase);
      const alpha = star.alpha + twinkle * 0.2;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 230, 255, ${Math.max(0.05, alpha)})`;
      ctx.fill();
    });

    animFrame = requestAnimationFrame(drawStars);
  }

  resizeCanvas();
  createStars();
  drawStars();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      createStars();
    }, 200);
  });
}

/* ── Smooth scroll for nav links ── */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
