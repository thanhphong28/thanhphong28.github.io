/* ============================================
   PORTFOLIO — Butter-Smooth Performance JS
   Optimized for 60fps scroll & transitions
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ── 0. Adaptive Hardware Benchmark & Performance Tier Detection ── */
  const isLowSpecDevice = () => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = connection && (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return cores < 4 || memory < 4 || (isMobile && cores < 6) || saveData || prefersReducedMotion;
  };

  const isLowSpec = isLowSpecDevice();
  document.body.classList.add(isLowSpec ? "low-spec" : "high-spec");

  /* ── 0.1 Cinematic Intro Preloader ("Breeze Boy") & Staged Entrance ── */
  const preloader = document.getElementById("preloader");
  const heroSpline = document.getElementById("heroSpline");
  let preloaderDismissed = false;
  const startTime = Date.now();
  const MIN_DISPLAY_TIME = isLowSpec ? 600 : 1100; // Ultra-snappy loading for world-class speed

  const dismissPreloader = () => {
    if (preloaderDismissed) return;
    
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

    setTimeout(() => {
      if (preloaderDismissed) return;
      preloaderDismissed = true;

      // Trigger staggered entrance for Navbar, Hero info & profile card
      document.body.classList.add("loaded");

      if (preloader) {
        preloader.classList.add("fade-out");
        setTimeout(() => {
          if (preloader.parentNode) {
            preloader.remove();
          }
        }, 700);
      }
    }, remainingTime);
  };

  // Listen for Spline 3D scene load completion (if enabled)
  if (heroSpline && !isLowSpec) {
    heroSpline.addEventListener("load", dismissPreloader);
    heroSpline.addEventListener("load-complete", dismissPreloader);
  }

  // Fallback timer: guarantees page smoothly unlocks after max 1.8s
  setTimeout(dismissPreloader, isLowSpec ? 1000 : 1800);

  /* ── 0.2 Universal Spline 3D Robot Cursor-Tracking Engine ── */
  /* Ensures robot looks at the cursor everywhere: across text, profile cards, buttons, etc. */
  if (heroSpline && !isLowSpec) {
    let ticking = false;
    let cachedCanvas = null;

    const getTargetCanvas = () => {
      if (cachedCanvas && cachedCanvas.isConnected) return cachedCanvas;
      if (heroSpline.shadowRoot) {
        cachedCanvas = heroSpline.shadowRoot.querySelector("canvas");
      }
      return cachedCanvas;
    };

    const forwardCursor = (e) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        try {
          const canvas = getTargetCanvas();
          if (canvas && e.target !== canvas) {
            // PointerEvent for Spline runtime (@splinetool/runtime / @splinetool/viewer v1.12+)
            const pointerProps = {
              clientX: e.clientX,
              clientY: e.clientY,
              screenX: e.screenX,
              screenY: e.screenY,
              pageX: e.pageX,
              pageY: e.pageY,
              pointerId: e.pointerId || 1,
              pointerType: e.pointerType || "mouse",
              isPrimary: true,
              pressure: e.pressure || 0,
              width: 1,
              height: 1,
              bubbles: true,
              cancelable: true,
              composed: true
            };

            const pEvent = new PointerEvent("pointermove", pointerProps);
            canvas.dispatchEvent(pEvent);
            heroSpline.dispatchEvent(new PointerEvent("pointermove", pointerProps));

            // MouseEvent for standard Three.js canvas mouse listeners
            const mEvent = new MouseEvent("mousemove", {
              clientX: e.clientX,
              clientY: e.clientY,
              screenX: e.screenX,
              screenY: e.screenY,
              pageX: e.pageX,
              pageY: e.pageY,
              bubbles: true,
              cancelable: true,
              composed: true
            });
            canvas.dispatchEvent(mEvent);
          }
        } catch (_) {}
        ticking = false;
      });
    };

    window.addEventListener("pointermove", forwardCursor, { passive: true });
    window.addEventListener("mousemove", forwardCursor, { passive: true });
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

  /* ── 5. GPU Offscreen Culling & Complete Freeze for Hero 3D Robot Stage ── */
  const globalSplineStage = document.getElementById("splineStage");
  const homeSection = document.getElementById("home");
  if (homeSection && globalSplineStage && !isLowSpec) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        globalSplineStage.classList.toggle("faded", !isVisible);
        globalSplineStage.style.display = isVisible ? "block" : "none";
      },
      { threshold: 0.05 }
    );
    heroObserver.observe(homeSection);
  }

  /* ── 6. Spotlight Card Engine (GPU-Optimized with Hover Detection) ── */
  const spotlightCards = document.querySelectorAll(".spotlight-card");
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  spotlightCards.forEach((card) => {
    let ticking = false;

    // Promote to composite layer on hover start, release on leave
    card.addEventListener("mouseenter", () => {
      card.style.willChange = "transform, box-shadow";
    }, { passive: true });

    card.addEventListener("mouseleave", () => {
      setTimeout(() => {
        card.style.willChange = "auto";
      }, 400);
    }, { passive: true });

    if (!hasTouch && !isLowSpec) {
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
    }
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

  /* ── 8.1 Contact Form Submission via FormSubmit AJAX ── */
  const contactForm = document.getElementById("contactForm");
  const contactSubmitBtn = document.getElementById("contactSubmitBtn");
  const contactFormStatus = document.getElementById("contactFormStatus");

  if (contactForm && contactSubmitBtn) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("contactName");
      const emailInput = document.getElementById("contactEmail");
      const messageInput = document.getElementById("contactMessage");

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const message = messageInput ? messageInput.value.trim() : "";

      if (!name || !email || !message) {
        if (contactFormStatus) {
          contactFormStatus.className = "form-status-msg error";
          contactFormStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> <div>Vui lòng điền đầy đủ tất cả các trường thông tin.</div>`;
          contactFormStatus.style.display = "flex";
        }
        return;
      }

      // Set Loading State
      const originalBtnHtml = contactSubmitBtn.innerHTML;
      contactSubmitBtn.disabled = true;
      contactSubmitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> <span>Đang gửi tin nhắn...</span>`;
      
      if (contactFormStatus) {
        contactFormStatus.style.display = "none";
      }

      try {
        const response = await fetch("https://formsubmit.co/ajax/777thanhphong@gmail.com", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message,
            _subject: `[Portfolio Contact] Tin nhắn mới từ ${name}`,
            _template: "table",
            _captcha: "false"
          })
        });

        const data = await response.json();

        if (response.ok && (data.success === "true" || data.success === true)) {
          // Success State
          contactSubmitBtn.innerHTML = `<i class="fas fa-check"></i> <span>Đã gửi thành công!</span>`;
          contactSubmitBtn.style.background = "var(--emerald)";
          contactSubmitBtn.style.borderColor = "var(--emerald)";

          if (contactFormStatus) {
            contactFormStatus.className = "form-status-msg success";
            contactFormStatus.innerHTML = `<i class="fas fa-check-circle"></i> <div><strong>Đã gửi tin về email gửi Phong, hãy chờ phản hồi!</strong> Trang sẽ tự động quay về trang chủ sau giây lát...</div>`;
            contactFormStatus.style.display = "flex";
          }

          contactForm.reset();

          // Auto-scroll back to Home / Top after 2.2 seconds
          setTimeout(() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
            if (history.pushState) {
              history.pushState(null, null, "#home");
            }

            setTimeout(() => {
              contactSubmitBtn.disabled = false;
              contactSubmitBtn.innerHTML = originalBtnHtml;
              contactSubmitBtn.style.background = "";
              contactSubmitBtn.style.borderColor = "";
              if (contactFormStatus) {
                contactFormStatus.style.display = "none";
              }
            }, 1200);
          }, 2200);
        } else {
          throw new Error(data.message || "Gửi không thành công");
        }
      } catch (err) {
        console.error("Form submission error:", err);
        contactSubmitBtn.disabled = false;
        contactSubmitBtn.innerHTML = originalBtnHtml;

        if (contactFormStatus) {
          contactFormStatus.className = "form-status-msg error";
          const mailtoFallback = `mailto:777thanhphong@gmail.com?subject=${encodeURIComponent(`[Portfolio] Liên hệ từ ${name}`)}&body=${encodeURIComponent(`Họ tên: ${name}\nEmail: ${email}\n\nNội dung:\n${message}`)}`;
          contactFormStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <div><strong>Không thể gửi tự động!</strong> Vui lòng kiểm tra lại kết nối mạng hoặc <a href="${mailtoFallback}" target="_blank">bấm vào đây để gửi trực tiếp qua Email</a> đến <strong>777thanhphong@gmail.com</strong>.</div>`;
          contactFormStatus.style.display = "flex";
        }
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

  /* ── 12. Smart Video Decoder Culling & Lazy Stream Loading ── */
  const videos = document.querySelectorAll("video");
  if (videos.length > 0 && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (video.getAttribute("data-src") && !video.src) {
              video.src = video.getAttribute("data-src");
              video.load();
            }
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.1, rootMargin: "80px" }
    );
    videos.forEach((video) => {
      video.pause();
      videoObserver.observe(video);
    });
  }
});
