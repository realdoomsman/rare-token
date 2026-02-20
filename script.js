document.addEventListener('DOMContentLoaded', () => {
    const CA = 'EE7SWKvFa9zPETA6UNytNgzbN2AKMMusZZdGPD3gpump';

    // ===== LOADING SCREEN =====
    document.body.classList.add('loading');
    const loader = document.getElementById('loader');
    const loaderFill = document.getElementById('loader-fill');
    let progress = 0;

    function tickLoader() {
        // Simulate loading progress with easing
        const remaining = 100 - progress;
        progress += remaining * 0.06;
        if (progress > 99) progress = 100;
        loaderFill.style.width = progress + '%';

        if (progress < 100) {
            requestAnimationFrame(tickLoader);
        }
    }
    tickLoader();

    // After minimum display time + assets, dismiss loader
    const minTime = new Promise(resolve => setTimeout(resolve, 2200));
    const loaded = new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve);
    });

    Promise.all([minTime, loaded]).then(() => {
        loaderFill.style.width = '100%';
        setTimeout(() => {
            loader.classList.add('done');
            document.body.classList.remove('loading');
            // Trigger hero entrance animations
            document.querySelectorAll('.hero-content, .hero-coin-area, .scroll-hint').forEach((el, i) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = `all 0.8s ${0.15 * i}s var(--ease, cubic-bezier(0.16, 1, 0.3, 1))`;
                requestAnimationFrame(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            });
        }, 400);
    });

    // ===== PARTICLE CANVAS =====
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    let mouseX = 0, mouseY = 0;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.hue = Math.random() > 0.5 ? 260 : 300;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse repulsion
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                this.x += (dx / dist) * force * 2;
                this.y += (dy / dist) * force * 2;
            }

            if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 80%, 75%, ${this.opacity})`;
            ctx.fill();
        }
    }

    const count = Math.min(80, Math.floor((w * h) / 15000));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    function animateParticles() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(167, 139, 250, ${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ===== COIN 3D TILT =====
    const coin = document.getElementById('hero-coin');
    const coinWrap = document.getElementById('coin-wrapper');
    let rx = 0, ry = 0, trx = 0, try_ = 0;

    if (coin && coinWrap) {
        document.addEventListener('mousemove', e => {
            const rect = coinWrap.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            trx = -((e.clientY - cy) / (rect.height / 2)) * 20;
            try_ = ((e.clientX - cx) / (rect.width / 2)) * 20;
        });

        function tickCoin() {
            rx += (trx - rx) * 0.05;
            ry += (try_ - ry) * 0.05;
            coin.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
            requestAnimationFrame(tickCoin);
        }
        tickCoin();
    }

    // ===== TILT CARDS (3D hover) =====
    document.querySelectorAll('.tilt-card').forEach(card => {
        // Add glow spot element
        const spot = document.createElement('div');
        spot.classList.add('glow-spot');
        card.appendChild(spot);

        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = -((y - centerY) / centerY) * 8;
            const rotateY = ((x - centerX) / centerX) * 8;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            spot.style.left = x + 'px';
            spot.style.top = y + 'px';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });

    // ===== MAGNETIC BUTTONS =====
    document.querySelectorAll('.btn, .nav-cta, .social-btn').forEach(btn => {
        btn.classList.add('magnetic');
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.05)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0) scale(1)';
        });
    });

    // ===== PARALLAX SECTIONS =====
    const parallaxEls = document.querySelectorAll('.section h2, .hero-coin-area, .burn-visual');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        parallaxEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            const offset = rect.top / window.innerHeight;
            el.style.transform = `translateY(${offset * -20}px)`;
        });
    }, { passive: true });

    // ===== NAV =====
    const nav = document.getElementById('navbar');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');

    function onScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        let current = '';
        sections.forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 200) current = sec.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // hamburger
    const burger = document.getElementById('burger');
    const navEl = document.getElementById('nav-links');
    burger.addEventListener('click', () => navEl.classList.toggle('open'));
    navEl.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navEl.classList.remove('open'));
    });

    // ===== COPY CA =====
    const toast = document.getElementById('toast');
    function copyCA() {
        navigator.clipboard.writeText(CA).catch(() => {
            const t = document.createElement('textarea');
            t.value = CA; document.body.appendChild(t); t.select();
            document.execCommand('copy'); document.body.removeChild(t);
        });
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
    document.getElementById('copy-btn')?.addEventListener('click', copyCA);
    document.getElementById('copy-btn-2')?.addEventListener('click', copyCA);
    document.getElementById('ca-text')?.addEventListener('click', copyCA);
    document.getElementById('full-ca')?.addEventListener('click', copyCA);

    // ===== SCROLL REVEAL =====
    const revealEls = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const parent = entry.target.parentElement;
                const siblings = [...parent.querySelectorAll('.reveal')];
                siblings.forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 120);
                });
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    const seen = new Set();
    revealEls.forEach(el => {
        const p = el.parentElement;
        if (!seen.has(p)) { seen.add(p); revealObs.observe(el); }
    });

    // ===== ANIMATED COUNTERS =====
    const counterEls = document.querySelectorAll('[data-count]');
    const counterObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const end = parseFloat(el.dataset.count);
                const suffix = el.dataset.suffix || '';
                const isDecimal = end % 1 !== 0;
                const startTime = performance.now();
                const dur = 2000;

                function count(now) {
                    const t = Math.min((now - startTime) / dur, 1);
                    const ease = 1 - Math.pow(1 - t, 4);
                    const val = end * ease;
                    el.textContent = (isDecimal ? val.toFixed(1) : Math.round(val)) + suffix;
                    if (t < 1) requestAnimationFrame(count);
                }
                requestAnimationFrame(count);
                counterObs.unobserve(el);
            }
        });
    }, { threshold: 0.3 });
    counterEls.forEach(el => counterObs.observe(el));

    // ===== BURN BAR =====
    const burnBar = document.getElementById('burn-filled');
    if (burnBar) {
        const burnObs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setTimeout(() => { burnBar.style.width = '71.7%'; }, 400);
                burnObs.unobserve(entries[0].target);
            }
        }, { threshold: 0.15 });
        burnObs.observe(burnBar.parentElement);
    }

    // ===== STAT BAR FILLS =====
    const statBars = document.querySelectorAll('.stat-bar-fill');
    const barObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
                entry.target.style.width = entry.target.style.getPropertyValue('--fill');
                barObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    statBars.forEach(bar => {
        bar.style.width = '0%';
        barObs.observe(bar);
    });

    // ===== LIVE DATA =====
    const API = `https://api.dexscreener.com/latest/dex/tokens/${CA}`;

    async function fetchData() {
        try {
            const res = await fetch(API);
            const json = await res.json();
            if (!json.pairs?.length) return;
            const pair = json.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

            const price = parseFloat(pair.priceUsd);
            setVal('price-value', price < 0.01 ? `$${price.toFixed(8)}` : `$${price.toFixed(4)}`);
            setVal('mc-value', fmtUsd(pair.marketCap || pair.fdv || 0));
            setVal('volume-value', fmtUsd(pair.volume?.h24 || 0));
            setVal('liq-value', fmtUsd(pair.liquidity?.usd || 0));

            const change = pair.priceChange?.h24 || 0;
            const chEl = document.getElementById('change-value');
            if (chEl) {
                chEl.textContent = `${change >= 0 ? '+' : ''}${parseFloat(change).toFixed(2)}%`;
                chEl.className = 'data-val ' + (change >= 0 ? 'change-up' : 'change-down');
            }

            const b = pair.txns?.m5?.buys || 0;
            const s = pair.txns?.m5?.sells || 0;
            const txEl = document.getElementById('txns-value');
            if (txEl) txEl.innerHTML = `<span class="change-up">${b}</span> / <span class="change-down">${s}</span>`;

            document.getElementById('last-update').textContent =
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (err) {
            console.error('Fetch error:', err);
        }
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (!el) return;
        const prev = el.textContent;
        el.textContent = val;
        if (prev !== val && prev !== '—') {
            el.style.transition = 'none';
            el.style.textShadow = '0 0 20px rgba(167, 139, 250, 0.5)';
            requestAnimationFrame(() => {
                el.style.transition = 'text-shadow 1s';
                el.style.textShadow = 'none';
            });
        }
    }

    function fmtUsd(n) {
        if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
        if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
        return `$${parseFloat(n).toFixed(2)}`;
    }

    fetchData();
    setInterval(fetchData, 30000);

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        });
    });
});
