const academyApp = (() => {
  const telegramConfig = {
    botToken: "PUT_TELEGRAM_BOT_TOKEN_HERE",
    chatId: "PUT_TELEGRAM_CHAT_ID_HERE"
  };

  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
  const topLinks = [...document.querySelectorAll('a[href="#top"]')];
  const contactForm = document.querySelector("#contactForm");
  const revealItems = [...document.querySelectorAll(".reveal")];
  const statNumbers = [...document.querySelectorAll(".stat-number")];
  const watchedSections = [...document.querySelectorAll(".section-watch, .hero")];

  const state = {
    menuOpen: false,
    countersPlayed: false
  };

  function updateScrolledState() {
    document.body.classList.toggle("is-scrolled", window.scrollY > 160);
  }

  function isTelegramReady() {
    return Boolean(
      telegramConfig.botToken &&
      telegramConfig.chatId &&
      !telegramConfig.botToken.includes("PUT_") &&
      !telegramConfig.chatId.includes("PUT_")
    );
  }

  function setMenu(open) {
    state.menuOpen = open;
    siteNav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  }

  function setActiveNav(sectionId) {
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isHero = sectionId === "hero" && href === "#top";
      link.classList.toggle("is-active", href === `#${sectionId}` || isHero);
    });
  }

  function animateNumber(element) {
    const target = Number(element.dataset.target || 0);
    const duration = 1200;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  function playCountersOnce() {
    if (state.countersPlayed) return;
    state.countersPlayed = true;
    statNumbers.forEach(animateNumber);
  }

  function bindNavigation() {
    navToggle.addEventListener("click", () => setMenu(!state.menuOpen));

    topLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        setMenu(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setActiveNav("hero");
      });
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenu(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (!state.menuOpen) return;
      const clickedInsideNav = siteNav.contains(event.target);
      const clickedToggle = navToggle.contains(event.target);

      if (!clickedInsideNav && !clickedToggle) {
        setMenu(false);
      }
    });
  }

  function bindContactForm() {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const name = formData.get("name").trim();
      const phone = formData.get("phone").trim();
      const interest = formData.get("interest");
      const message = formData.get("message").trim();

      const text = [
        "طلب جديد من موقع أكاديمية النون",
        "-----------------------------",
        `الطلب: ${interest}`,
        `الاسم: ${name}`,
        `رقم الجوال: ${phone}`,
        message ? `تفاصيل إضافية: ${message}` : ""
      ].filter(Boolean).join("\n");

      if (!isTelegramReady()) {
        alert("حتى تصل رسائل الفورم إلى تليجرام، ضع botToken و chatId في أعلى ملف script.js.");
        return;
      }

      const submitButton = contactForm.querySelector("button[type='submit']");
      const originalButtonHtml = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال';

      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramConfig.chatId,
            text
          })
        });

        if (!response.ok) {
          throw new Error("Telegram request failed");
        }

        contactForm.reset();
        alert("تم إرسال رسالتك بنجاح عبر تليجرام.");
      } catch (error) {
        alert("تعذر إرسال الرسالة إلى تليجرام. تأكد من botToken و chatId ثم حاول مرة أخرى.");
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHtml;
      }
    });
  }

  function initRevealAnimation() {
    revealItems.forEach((item, index) => {
      item.style.setProperty("--delay", `${Math.min(index * 55, 260)}ms`);
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);

        if (entry.target.classList.contains("hero__metrics")) {
          playCountersOnce();
        }
      });
    }, { threshold: 0.16 });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  function initScrollSpy() {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveNav(visible.target.id);
      }
    }, {
      rootMargin: "-35% 0px -50% 0px",
      threshold: [0.1, 0.25, 0.5]
    });

    watchedSections.forEach((section) => sectionObserver.observe(section));
  }

  function init() {
    updateScrolledState();
    bindNavigation();
    bindContactForm();
    initRevealAnimation();
    initScrollSpy();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", academyApp.init);
