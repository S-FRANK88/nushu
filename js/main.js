// ====== MAIN.JS — Homepage Interactions ======

document.addEventListener('DOMContentLoaded', () => {
    // ---- Page Navigation ----
    const homepage = document.getElementById('homepage');
    const letterPage = document.getElementById('letter-page');
    const btnWriteLetter = document.getElementById('btn-write-letter');
    const btnWriteLetterHero = document.getElementById('btn-write-letter-hero');
    const btnBackHome = document.getElementById('btn-back-home');

    function openLetterPage() {
        homepage.classList.remove('active');
        letterPage.classList.add('active');
        window.scrollTo(0, 0);
    }

    if (btnWriteLetter) {
        btnWriteLetter.addEventListener('click', openLetterPage);
    }
    if (btnWriteLetterHero) {
        btnWriteLetterHero.addEventListener('click', openLetterPage);
    }

    btnBackHome.addEventListener('click', () => {
        letterPage.classList.remove('active');
        homepage.classList.add('active');
        window.scrollTo(0, 0);
    });

    // ---- Scroll-triggered section reveal ----
    const eraSections = document.querySelectorAll('.era-section');

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const content = entry.target.querySelector('.era-content');
            if (entry.isIntersecting) {
                content.classList.add('visible');
            }
        });
    }, observerOptions);

    eraSections.forEach(section => {
        sectionObserver.observe(section);
    });

    // ---- Hero character click ripple effect ----
    const nushuWoText = document.getElementById('nushu-wo-text');

    nushuWoText.addEventListener('click', (e) => {
        // Create a ripple element
        const ripple = document.createElement('div');
        ripple.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212,165,116,0.4), transparent);
      pointer-events: none;
      animation: rippleExpand 1.5s ease-out forwards;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    `;

        const container = document.getElementById('nushu-wo-container');
        container.style.position = 'relative';
        container.appendChild(ripple);

        setTimeout(() => ripple.remove(), 1500);

        // Change page to the letter writing section instead of scrolling
        setTimeout(() => openLetterPage(), 800);
    });

    // Add ripple keyframes dynamically
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
    @keyframes rippleExpand {
      0% { width: 20px; height: 20px; opacity: 1; }
      100% { width: 600px; height: 600px; opacity: 0; }
    }
  `;
    document.head.appendChild(rippleStyle);

    // ---- Parallax subtle movement on hero ----
    const hero = document.getElementById('hero');
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        nushuWoText.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    });

    hero.addEventListener('mouseleave', () => {
        nushuWoText.style.transform = '';
    });

    // ---- Scroll-based hero fade out ----
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = window.innerHeight;

        if (scrollY < heroHeight) {
            const progress = scrollY / heroHeight;
            const heroElements = hero.querySelectorAll('#nushu-wo-text, #hero-subtitle, #hero-desc, #scroll-hint');
            heroElements.forEach(el => {
                el.style.opacity = 1 - progress * 1.5;
                el.style.transform = `translateY(${progress * -30}px)`;
            });
        }
    });

    console.log('🌸 女书密信 — Nüshu Secret Letter loaded');
});
