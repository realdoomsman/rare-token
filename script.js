document.addEventListener('DOMContentLoaded', () => {
    const CA = 'EE7SWKvFa9zPETA6UNytNgzbN2AKMMusZZdGPD3gpump';

    // ---- cursor glow ----
    const glow = document.getElementById('cursor-glow');
    let mx = 0, my = 0, gx = 0, gy = 0;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
    });

    function animGlow() {
        gx += (mx - gx) * 0.08;
        gy += (my - gy) * 0.08;
        glow.style.left = gx + 'px';
        glow.style.top = gy + 'px';
        requestAnimationFrame(animGlow);
    }
    animGlow();

    // ---- coin 3D tilt ----
    const coin = document.getElementById('hero-coin');
    const coinWrap = document.getElementById('coin-container');

    if (coin && coinWrap) {
        let rx = 0, ry = 0, trx = 0, try_ = 0;

        document.addEventListener('mousemove', e => {
            const rect = coinWrap.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            trx = -((e.clientY - cy) / (rect.height / 2)) * 18;
            try_ = ((e.clientX - cx) / (rect.width / 2)) * 18;
        });

        function tickCoin() {
            rx += (trx - rx) * 0.06;
            ry += (try_ - ry) * 0.06;
            coin.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
            requestAnimationFrame(tickCoin);
        }
        tickCoin();
    }

    // ---- nav scroll ----
    const nav = document.getElementById('navbar');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');

    function onScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 50);

        // active section
        let current = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 200;
            if (window.scrollY >= top) current = sec.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---- hamburger ----
    const burger = document.getElementById('burger');
    const navLinksEl = document.getElementById('nav-links');
    burger.addEventListener('click', () => navLinksEl.classList.toggle('open'));
    navLinksEl.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinksEl.classList.remove('open'));
    });

    // ---- copy ----
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
    document.getElementById('copy-btn').addEventListener('click', copyCA);
    document.getElementById('copy-btn-2')?.addEventListener('click', copyCA);
    document.getElementById('ca-text')?.addEventListener('click', copyCA);
    document.getElementById('full-ca')?.addEventListener('click', copyCA);

    // ---- scroll reveal ----
    const revealEls = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // stagger sibling reveals
                const parent = entry.target.parentElement;
                const siblings = [...parent.querySelectorAll('.reveal')];
                siblings.forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 100);
                });
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    const seen = new Set();
    revealEls.forEach(el => {
        const p = el.parentElement;
        if (!seen.has(p)) { seen.add(p); revealObs.observe(el); }
    });

    // ---- animated counters ----
    const counterEls = document.querySelectorAll('[data-count]');
    const counterObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const end = parseFloat(el.dataset.count);
                const suffix = el.dataset.suffix || '';
                const isDecimal = end % 1 !== 0;
                const startTime = performance.now();
                const dur = 1800;

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

    // ---- burn bar ----
    const burnBar = document.getElementById('burn-progress');
    if (burnBar) {
        const burnObs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setTimeout(() => { burnBar.style.width = '71.7%'; }, 300);
                burnObs.unobserve(entries[0].target);
            }
        }, { threshold: 0.2 });
        burnObs.observe(burnBar.parentElement);
    }

    // ---- live data ----
    const API = `https://api.dexscreener.com/latest/dex/tokens/${CA}`;

    async function fetchData() {
        try {
            const res = await fetch(API);
            const json = await res.json();
            if (!json.pairs?.length) return;

            const pair = json.pairs.sort((a, b) =>
                (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];

            const price = parseFloat(pair.priceUsd);
            setVal('price-value', price < 0.01 ? `$${price.toFixed(8)}` : `$${price.toFixed(4)}`);
            setVal('mc-value', fmtUsd(pair.marketCap || pair.fdv || 0));
            setVal('volume-value', fmtUsd(pair.volume?.h24 || 0));
            setVal('liq-value', fmtUsd(pair.liquidity?.usd || 0));

            const change = pair.priceChange?.h24 || 0;
            const chEl = document.getElementById('change-value');
            if (chEl) {
                chEl.textContent = `${change >= 0 ? '+' : ''}${parseFloat(change).toFixed(2)}%`;
                chEl.className = 'data-value ' + (change >= 0 ? 'change-up' : 'change-down');
            }

            const b = pair.txns?.m5?.buys || 0;
            const s = pair.txns?.m5?.sells || 0;
            const txEl = document.getElementById('txns-value');
            if (txEl) txEl.innerHTML = `<span class="change-up">${b}</span> / <span class="change-down">${s}</span>`;

            document.getElementById('last-update').textContent =
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (err) {
            console.error('Data fetch error:', err);
        }
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = val;
        el.style.transition = 'none';
        el.style.opacity = '0.5';
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '1';
        });
    }

    function fmtUsd(n) {
        if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
        if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
        return `$${parseFloat(n).toFixed(2)}`;
    }

    fetchData();
    setInterval(fetchData, 30000);

    // ---- smooth scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
