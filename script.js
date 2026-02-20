document.addEventListener('DOMContentLoaded', () => {
    const CA = 'EE7SWKvFa9zPETA6UNytNgzbN2AKMMusZZdGPD3gpump';

    // ---- Particle Canvas ----
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1,
            hue: Math.random() * 60 + 170, // cyan to purple range
        };
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
            ctx.fill();

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    const alpha = (1 - dist / 150) * 0.08;
                    ctx.strokeStyle = `rgba(125, 249, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    initParticles();
    drawParticles();
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    // ---- Navbar Scroll ----
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ---- Hamburger ----
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // ---- Copy CA ----
    const toast = document.getElementById('copy-toast');
    function copyCA() {
        navigator.clipboard.writeText(CA).then(() => {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }).catch(() => {
            const t = document.createElement('textarea');
            t.value = CA; document.body.appendChild(t);
            t.select(); document.execCommand('copy');
            document.body.removeChild(t);
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        });
    }

    document.getElementById('copy-ca-btn').addEventListener('click', copyCA);
    document.getElementById('copy-ca-btn-2').addEventListener('click', copyCA);

    // ---- Scroll Reveal ----
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ---- Burn Bar Animation ----
    const burnObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    document.getElementById('burn-fill').style.width = '71.7%';
                    document.getElementById('burn-glow').style.width = '71.7%';
                }, 400);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const burnSection = document.getElementById('tokenomics');
    if (burnSection) burnObserver.observe(burnSection);

    // ---- Live Data from DexScreener ----
    const TOKEN_ADDRESS = CA;
    const API_URL = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`;

    async function fetchLiveData() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (data.pairs && data.pairs.length > 0) {
                // Use the most liquid pair
                const pair = data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

                // Price
                const price = parseFloat(pair.priceUsd);
                document.getElementById('price-value').textContent = price < 0.01
                    ? `$${price.toFixed(8)}`
                    : `$${price.toFixed(6)}`;

                // Market Cap
                const mc = pair.marketCap || pair.fdv || 0;
                document.getElementById('mc-value').innerHTML = formatMoney(mc);

                // 24h Volume
                const vol = pair.volume?.h24 || 0;
                document.getElementById('volume-value').textContent = formatMoney(vol);

                // 24h Change
                const change = pair.priceChange?.h24 || 0;
                const changeEl = document.getElementById('change-value');
                changeEl.textContent = `${change >= 0 ? '+' : ''}${parseFloat(change).toFixed(2)}%`;
                changeEl.className = 'live-card-value ' + (change >= 0 ? 'change-positive' : 'change-negative');

                // Liquidity
                const liq = pair.liquidity?.usd || 0;
                document.getElementById('liq-value').textContent = formatMoney(liq);

                // 5m Transactions
                const buys5m = pair.txns?.m5?.buys || 0;
                const sells5m = pair.txns?.m5?.sells || 0;
                document.getElementById('txns-value').innerHTML =
                    `<span class="change-positive">${buys5m} buys</span> / <span class="change-negative">${sells5m} sells</span>`;

                // Last update
                document.getElementById('last-update').textContent =
                    `Last updated: ${new Date().toLocaleTimeString()}`;
            }
        } catch (err) {
            console.error('Failed to fetch live data:', err);
            document.getElementById('mc-value').textContent = '—';
            document.getElementById('price-value').textContent = '—';
            document.getElementById('volume-value').textContent = '—';
            document.getElementById('change-value').textContent = '—';
            document.getElementById('liq-value').textContent = '—';
            document.getElementById('txns-value').textContent = '—';
        }
    }

    function formatMoney(num) {
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(2)}`;
    }

    // Initial fetch + interval
    fetchLiveData();
    setInterval(fetchLiveData, 30000);

    // ---- Smooth anchor scroll ----
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
