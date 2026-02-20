document.addEventListener('DOMContentLoaded', () => {
    const CA = 'EE7SWKvFa9zPETA6UNytNgzbN2AKMMusZZdGPD3gpump';

    // ---- Cursor glow follow ----
    const glow = document.getElementById('cursor-glow');
    let glowX = 0, glowY = 0, targetX = 0, targetY = 0;

    document.addEventListener('mousemove', e => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    function updateGlow() {
        glowX += (targetX - glowX) * 0.08;
        glowY += (targetY - glowY) * 0.08;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(updateGlow);
    }
    updateGlow();

    // ---- Coin 3D tilt ----
    const coin = document.getElementById('hero-coin');
    const coinContainer = document.getElementById('coin-container');
    let coinRotX = 0, coinRotY = 0, coinTargetX = 0, coinTargetY = 0;
    let coinFloatOffset = 0;

    document.addEventListener('mousemove', e => {
        if (!coinContainer) return;
        const rect = coinContainer.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        coinTargetY = dx * 18;
        coinTargetX = -dy * 18;
    });

    function updateCoin() {
        coinRotX += (coinTargetX - coinRotX) * 0.06;
        coinRotY += (coinTargetY - coinRotY) * 0.06;
        coinFloatOffset += 0.02;
        const floatY = Math.sin(coinFloatOffset) * 8;

        if (coin) {
            coin.style.transform = `
                rotateX(${coinRotX}deg) 
                rotateY(${coinRotY}deg) 
                translateY(${floatY}px)
            `;
        }
        requestAnimationFrame(updateCoin);
    }
    updateCoin();

    // ---- Navbar scroll ----
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('.section');
    const navLinksAll = document.querySelectorAll('[data-nav]');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);

        // Active nav highlighting
        let current = '';
        sections.forEach(s => {
            const top = s.offsetTop - 200;
            if (window.scrollY >= top) current = s.id;
        });

        navLinksAll.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // ---- Hamburger ----
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // ---- Copy CA ----
    const toast = document.getElementById('toast');

    function copyCA() {
        navigator.clipboard.writeText(CA).then(() => {
            showToast();
        }).catch(() => {
            const t = document.createElement('textarea');
            t.value = CA;
            document.body.appendChild(t);
            t.select();
            document.execCommand('copy');
            document.body.removeChild(t);
            showToast();
        });
    }

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    document.getElementById('copy-ca-btn').addEventListener('click', copyCA);
    document.getElementById('copy-ca-btn-2').addEventListener('click', copyCA);

    // Also copy when clicking the CA code text
    document.getElementById('ca-text').addEventListener('click', copyCA);
    document.getElementById('full-ca').addEventListener('click', copyCA);

    // ---- Scroll reveal ----
    const revealGroups = document.querySelectorAll('.reveal-group');
    const revealItems = document.querySelectorAll('.reveal-item');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    revealGroups.forEach(el => observer.observe(el));

    // Stagger reveal items
    const itemObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Find all sibling items and stagger them
                const parent = entry.target.parentElement;
                const siblings = parent.querySelectorAll('.reveal-item');
                siblings.forEach((sib, i) => {
                    setTimeout(() => sib.classList.add('visible'), i * 100);
                });
                itemObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    // Only observe first item in each group
    const seen = new Set();
    revealItems.forEach(el => {
        const parent = el.parentElement;
        if (!seen.has(parent)) {
            seen.add(parent);
            itemObserver.observe(el);
        }
    });

    // ---- Count-up animation for stat blocks ----
    const statBlocks = document.querySelectorAll('.stat-block');
    const countObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const block = entry.target;
                const target = parseFloat(block.dataset.count);
                const suffix = block.dataset.suffix || '';
                const numEl = block.querySelector('.stat-num');

                if (target && numEl) {
                    animateCount(numEl, 0, target, 1800, suffix);
                }
                countObserver.unobserve(block);
            }
        });
    }, { threshold: 0.3 });

    statBlocks.forEach(b => countObserver.observe(b));

    function animateCount(el, start, end, duration, suffix) {
        const startTime = performance.now();
        const isDecimal = end % 1 !== 0;

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out expo
            const eased = 1 - Math.pow(1 - progress, 4);
            let value = start + (end - start) * eased;

            if (isDecimal) {
                el.textContent = value.toFixed(1) + suffix;
            } else {
                el.textContent = Math.round(value) + suffix;
            }

            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ---- Supply bar animation ----
    const supplyBar = document.getElementById('supply-burned');
    const supplyObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    if (supplyBar) supplyBar.style.width = '71.7%';
                }, 300);
                supplyObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    if (supplyBar) supplyObserver.observe(supplyBar.parentElement);

    // ---- Live data ----
    const API_URL = `https://api.dexscreener.com/latest/dex/tokens/${CA}`;

    async function fetchData() {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();

            if (data.pairs && data.pairs.length > 0) {
                const pair = data.pairs.sort((a, b) =>
                    (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
                )[0];

                const price = parseFloat(pair.priceUsd);
                setVal('price-value', price < 0.01 ? `$${price.toFixed(8)}` : `$${price.toFixed(6)}`);

                const mc = pair.marketCap || pair.fdv || 0;
                setVal('mc-value', fmt(mc));

                const vol = pair.volume?.h24 || 0;
                setVal('volume-value', fmt(vol));

                const change = pair.priceChange?.h24 || 0;
                const changeEl = document.getElementById('change-value');
                changeEl.textContent = `${change >= 0 ? '+' : ''}${parseFloat(change).toFixed(2)}%`;
                changeEl.className = 'data-value ' + (change >= 0 ? 'change-pos' : 'change-neg');

                const liq = pair.liquidity?.usd || 0;
                setVal('liq-value', fmt(liq));

                const buys = pair.txns?.m5?.buys || 0;
                const sells = pair.txns?.m5?.sells || 0;
                document.getElementById('txns-value').innerHTML =
                    `<span class="change-pos">${buys}</span> / <span class="change-neg">${sells}</span>`;

                document.getElementById('last-update').textContent =
                    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } catch (err) {
            console.error('Fetch error:', err);
        }
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = val;
            // Quick flash on update
            el.style.transition = 'none';
            el.style.opacity = '0.5';
            requestAnimationFrame(() => {
                el.style.transition = 'opacity 0.5s';
                el.style.opacity = '1';
            });
        }
    }

    function fmt(n) {
        if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
        if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
        return `$${n.toFixed(2)}`;
    }

    fetchData();
    setInterval(fetchData, 30000);

    // ---- Smooth scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
