document.addEventListener('DOMContentLoaded', () => {
    const CA = 'EE7SWKvFa9zPETA6UNytNgzbN2AKMMusZZdGPD3gpump';

    // ---- coin tilt on mouse ----
    const coin = document.getElementById('big-coin');
    const wrap = document.getElementById('coin-wrap');

    if (coin && wrap) {
        let rx = 0, ry = 0, tx = 0, ty = 0;

        document.addEventListener('mousemove', e => {
            const rect = wrap.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            tx = ((e.clientX - cx) / (rect.width / 2)) * 15;
            ty = (-(e.clientY - cy) / (rect.height / 2)) * 15;
        });

        function tick() {
            rx += (ty - rx) * 0.07;
            ry += (tx - ry) * 0.07;
            coin.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
            requestAnimationFrame(tick);
        }
        tick();
    }

    // ---- nav scroll ----
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 30);
    });

    // ---- hamburger ----
    const burger = document.getElementById('hamburger');
    const links = document.getElementById('nav-links');
    burger.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => links.classList.remove('open'));
    });

    // ---- copy ca ----
    const toast = document.getElementById('toast');

    function copyCA() {
        navigator.clipboard.writeText(CA).catch(() => {
            const t = document.createElement('textarea');
            t.value = CA;
            document.body.appendChild(t);
            t.select();
            document.execCommand('copy');
            document.body.removeChild(t);
        });
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1800);
    }

    document.getElementById('copy-btn').addEventListener('click', copyCA);
    document.getElementById('copy-btn-2').addEventListener('click', copyCA);
    document.getElementById('ca-text').addEventListener('click', copyCA);
    document.getElementById('full-ca').addEventListener('click', copyCA);

    // ---- scroll reveal ----
    const fadeEls = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // stagger siblings
                const parent = entry.target.parentElement;
                const siblings = parent.querySelectorAll('.fade-up');
                siblings.forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 80);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const seen = new Set();
    fadeEls.forEach(el => {
        const p = el.parentElement;
        if (!seen.has(p)) {
            seen.add(p);
            observer.observe(el);
        }
    });

    // ---- count up ----
    const statEls = document.querySelectorAll('[data-count]');
    const countObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const end = parseFloat(el.dataset.count);
                const suffix = el.dataset.suffix || '';
                const isDecimal = end % 1 !== 0;
                const start = performance.now();
                const dur = 1600;

                function anim(now) {
                    const t = Math.min((now - start) / dur, 1);
                    const ease = 1 - Math.pow(1 - t, 4);
                    const v = end * ease;
                    el.textContent = (isDecimal ? v.toFixed(1) : Math.round(v)) + suffix;
                    if (t < 1) requestAnimationFrame(anim);
                }
                requestAnimationFrame(anim);
                countObs.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    statEls.forEach(el => countObs.observe(el));

    // ---- burn bar ----
    const burnFill = document.getElementById('burn-fill');
    if (burnFill) {
        const burnObs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setTimeout(() => burnFill.style.width = '71.7%', 200);
                burnObs.unobserve(entries[0].target);
            }
        }, { threshold: 0.2 });
        burnObs.observe(burnFill.parentElement);
    }

    // ---- live data ----
    const API = `https://api.dexscreener.com/latest/dex/tokens/${CA}`;

    async function fetchData() {
        try {
            const res = await fetch(API);
            const data = await res.json();
            if (!data.pairs?.length) return;

            const pair = data.pairs.sort((a, b) =>
                (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];

            const price = parseFloat(pair.priceUsd);
            set('price-value', price < 0.01 ? `$${price.toFixed(8)}` : `$${price.toFixed(6)}`);

            const mc = pair.marketCap || pair.fdv || 0;
            set('mc-value', fmt(mc));

            set('volume-value', fmt(pair.volume?.h24 || 0));

            const ch = pair.priceChange?.h24 || 0;
            const chEl = document.getElementById('change-value');
            chEl.textContent = `${ch >= 0 ? '+' : ''}${parseFloat(ch).toFixed(2)}%`;
            chEl.className = 'num-val ' + (ch >= 0 ? 'change-pos' : 'change-neg');

            set('liq-value', fmt(pair.liquidity?.usd || 0));

            const b = pair.txns?.m5?.buys || 0;
            const s = pair.txns?.m5?.sells || 0;
            document.getElementById('txns-value').innerHTML =
                `<span class="change-pos">${b}</span> / <span class="change-neg">${s}</span>`;

            document.getElementById('last-update').textContent =
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            console.error(e);
        }
    }

    function set(id, val) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = val;
        el.style.transition = 'none';
        el.style.opacity = '0.4';
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.4s';
            el.style.opacity = '1';
        });
    }

    function fmt(n) {
        if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
        if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
        return `$${n.toFixed(2)}`;
    }

    fetchData();
    setInterval(fetchData, 30000);

    // ---- smooth scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const t = document.querySelector(a.getAttribute('href'));
            if (t) {
                e.preventDefault();
                t.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
