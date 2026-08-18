/* ============================================
   PORTFOLIO — Butter-Smooth Performance JS
   Optimized for 60fps scroll & transitions
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ── 0. Cinematic Intro Preloader ("Breeze Boy") & Staged Entrance ── */
  const preloader = document.getElementById("preloader");
  const heroSpline = document.getElementById("heroSpline");
  let preloaderDismissed = false;
  const startTime = Date.now();
  const MIN_DISPLAY_TIME = 1800; // Guaranteed minimum 1.8s for the Breeze Boy cinematic intro

  const dismissPreloader = () => {
    if (preloaderDismissed) return;
    
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

    setTimeout(() => {
      if (preloaderDismissed) return;
      preloaderDismissed = true;

      // Trigger staggered entrance for Navbar, Hero info & profile card immediately as preloader starts fading
      document.body.classList.add("loaded");

      if (preloader) {
        preloader.classList.add("fade-out");
        setTimeout(() => {
          if (preloader.parentNode) {
            preloader.remove();
          }
        }, 900);
      }
    }, remainingTime);
  };

  // Listen for Spline 3D scene load completion
  if (heroSpline) {
    heroSpline.addEventListener("load", () => {
      dismissPreloader();
    });
    heroSpline.addEventListener("load-complete", () => {
      dismissPreloader();
    });
  }

  // Fallback timer: guarantees page smoothly unlocks after max 3.5s even if offline/slow
  setTimeout(() => {
    dismissPreloader();
  }, 3500);

  /* ── 0.1 Spline 3D Global Mouse Tracking Bridge (Zero-Jank Delta Filter) ── */
  if (heroSpline) {
    let mouseThrottle = false;
    let lastX = 0;
    let lastY = 0;

    window.addEventListener("mousemove", (e) => {
      // Delta filter: ignore sub-pixel / micro jitter to save CPU cycles
      const dx = Math.abs(e.clientX - lastX);
      const dy = Math.abs(e.clientY - lastY);
      if (dx < 2 && dy < 2) return;

      lastX = e.clientX;
      lastY = e.clientY;

      if (mouseThrottle) return;
      mouseThrottle = true;

      requestAnimationFrame(() => {
        try {
          const shadowCanvas = heroSpline.shadowRoot ? heroSpline.shadowRoot.querySelector("canvas") : null;
          if (shadowCanvas && e.target !== shadowCanvas) {
            const ev = new MouseEvent("mousemove", {
              clientX: e.clientX,
              clientY: e.clientY,
              screenX: e.screenX,
              screenY: e.screenY,
              bubbles: true,
              cancelable: true
            });
            shadowCanvas.dispatchEvent(ev);
          }
        } catch (_) {}
        mouseThrottle = false;
      });
    }, { passive: true });
  }

  /* ── 1. Navbar & Mobile Menu ── */
  const navbar = document.getElementById("navbar");
  const navToggle = document.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("mobileNav");

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

  /* ── 2. Scroll Sentinel for Navbar Glass State ── */
  if (navbar) {
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:40px;width:1px;height:1px;pointer-events:none;";
    document.body.prepend(sentinel);

    const navObserver = new IntersectionObserver(
      ([entry]) => {
        navbar.classList.toggle("scrolled", !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    navObserver.observe(sentinel);
  }

  /* ── 3. Active Nav Link Scroll Spy ── */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-center a");

  if (sections.length > 0 && navLinks.length > 0) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((link) => {
              link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
            });
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((sec) => spyObserver.observe(sec));
  }

  /* ── 4. Dynamic Role Rotation ── */
  const roleTextEl = document.getElementById("roleText");
  if (roleTextEl) {
    const roles = ["DEVELOPER", "DESIGNER", "ENGINEER", "CREATOR"];
    let roleIndex = 0;

    setInterval(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      roleTextEl.style.opacity = "0";
      roleTextEl.style.transform = "translateY(6px)";

      setTimeout(() => {
        roleTextEl.textContent = roles[roleIndex];
        roleTextEl.style.opacity = "1";
        roleTextEl.style.transform = "translateY(0)";
      }, 300);
    }, 3000);

    roleTextEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  }

  /* ── 5. GPU Offscreen Culling for Hero 3D Robot Stage ── */
  const globalSplineStage = document.getElementById("splineStage");
  const homeSection = document.getElementById("home");
  if (homeSection && globalSplineStage) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        globalSplineStage.classList.toggle("faded", !entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    heroObserver.observe(homeSection);
  }

  /* ── 6. Spotlight Card Engine (GPU-Optimized with will-change management) ── */
  const spotlightCards = document.querySelectorAll(".spotlight-card");
  spotlightCards.forEach((card) => {
    let ticking = false;

    // Promote to composite layer on hover start, release on leave
    card.addEventListener("mouseenter", () => {
      card.style.willChange = "transform, box-shadow";
    }, { passive: true });

    card.addEventListener("mouseleave", () => {
      // Delay removal so exit transition completes
      setTimeout(() => {
        card.style.willChange = "auto";
      }, 500);
    }, { passive: true });

    card.addEventListener("mousemove", (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  });

  /* ── 7. Live Vietnam Time Clock ── */
  const localClockEl = document.getElementById("localClock");
  if (localClockEl) {
    const updateClock = () => {
      const now = new Date();
      const options = {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      localClockEl.textContent = now.toLocaleTimeString("en-US", options);
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  /* ── 8. One-Click Copy Email Micro-Action ── */
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async () => {
      const email = copyEmailBtn.getAttribute("data-email") || "777thanhphong@gmail.com";
      try {
        await navigator.clipboard.writeText(email);
        const originalHtml = copyEmailBtn.innerHTML;
        copyEmailBtn.innerHTML = `<i class="fas fa-check" style="color: var(--emerald);"></i> <span style="color: var(--emerald);">Đã sao chép!</span>`;
        setTimeout(() => {
          copyEmailBtn.innerHTML = originalHtml;
        }, 2200);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    });
  }

  /* ── 9. FAQ Accordion ── */
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isActive = item.classList.contains("active");

      document.querySelectorAll(".faq-item").forEach((el) => {
        el.classList.remove("active");
        el.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });

      if (!isActive) {
        item.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ── 10. Scroll Reveal (IntersectionObserver with Progressive Transitions) ── */
  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Use rAF for paint-aligned class toggle
            requestAnimationFrame(() => {
              entry.target.classList.add("visible");
            });
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );
    revealElements.forEach((el) => revealObserver.observe(el));
  }

  /* ── 11. Butter-Smooth Native Scroll for Anchor Links (Zero-Jitter) ── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navbarHeight = navbar ? navbar.offsetHeight + 18 : 80;
        const targetY = href === "#top" ? 0 : target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: targetY,
          behavior: "smooth"
        });

        if (href !== "#top") {
          history.pushState(null, null, href);
        }
      }
    });
  });

  /* ── 12. Smart Video Decoder Culling (Max GPU Performance) ── */
  const videos = document.querySelectorAll("video");
  if (videos.length > 0 && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            // Play only when card is in viewport
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          } else {
            // Freeze video decode immediately when scrolled offscreen
            video.pause();
          }
        });
      },
      { threshold: 0.15, rootMargin: "60px" }
    );
    videos.forEach((video) => {
      video.pause();
      videoObserver.observe(video);
    });
  }
});
