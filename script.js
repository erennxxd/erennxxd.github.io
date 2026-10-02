// İletişim e-postanızı buraya yazın; boş bırakılırsa e-posta butonu gizlenir.
const CONTACT_EMAIL = '';

const motionOK = document.documentElement.classList.contains('motion-ok');
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);

/* ---------- Portal hero (bound to scroll position, so it reverses) ---------- */
const portal = document.getElementById('top');
const stage = document.getElementById('stage');
const title = document.getElementById('portal-title');
const t1 = title.querySelector('.t1');
const t2 = title.querySelector('.t2');
const orb = document.getElementById('orb');
const statement = document.getElementById('hakkimda');

let spanWidths = { a: 0, b: 0 };

function measureTitle() {
    title.style.setProperty('--track', '0.04em');
    spanWidths = { a: t1.offsetWidth, b: t2.offsetWidth };
}

function updatePortal() {
    const range = portal.offsetHeight - innerHeight;
    const p = clamp((scrollY - portal.offsetTop) / range);
    const open = easeInOut(clamp(p / 0.62));
    const grow = easeOut(p);

    stage.style.setProperty('--panel-l', `${-112 * open}%`);
    stage.style.setProperty('--panel-r', `${112 * open}%`);
    stage.style.setProperty('--img-scale', (1.16 - 0.16 * open).toFixed(4));
    stage.style.setProperty('--duo', (0.38 * open).toFixed(3));
    stage.style.setProperty('--dot-x', `${innerWidth * 0.42 * open}px`);
    stage.style.setProperty('--dot-y', `${innerHeight * 0.36 * open}px`);

    title.style.setProperty('--title-scale', (1 + 0.24 * grow).toFixed(4));
    title.style.setProperty('--track', `${(0.04 - 0.075 * grow).toFixed(4)}em`);
    title.style.setProperty('--t1', `${-spanWidths.a * 0.5 * grow}px`);
    title.style.setProperty('--t2', `${spanWidths.b * 0.5 * grow}px`);
}

function updateOrb() {
    const r = statement.getBoundingClientRect();
    const q = clamp((innerHeight - r.top) / (innerHeight + r.height));
    orb.style.setProperty('--orb-y', `${(q - 0.5) * -180}px`);
    orb.style.setProperty('--orb-r', `${q * 60}deg`);
}

if (motionOK) {
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updatePortal();
            updateOrb();
            ticking = false;
        });
    };

    const init = () => {
        measureTitle();
        updatePortal();
        updateOrb();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', init);
    document.fonts.ready.then(init);
    init();
}

/* ---------- Navigation ---------- */
const navLinks = document.getElementById('nav-links');
const menuBtn = document.getElementById('menu-btn');

function setMenu(open) {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.innerHTML = open ? '<i class="ph ph-x"></i>' : '<i class="ph ph-list"></i>';
}

menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setMenu(false);
});

const sectionLinks = [...navLinks.querySelectorAll('a')];
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
}, { rootMargin: '-45% 0px -50% 0px' });

sectionLinks.forEach(a => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) sectionObserver.observe(target);
});

/* ---------- Entry reveals (fire once, never un-reveal) ---------- */
if (motionOK) {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* ---------- Throwable deck ---------- */
const deck = document.getElementById('deck');
const cards = [...deck.querySelectorAll('.card')];
const dotsEl = document.getElementById('deck-dots');
const statusEl = document.getElementById('deck-status');
let order = [...cards];
let busy = false;
let drag = null;

dotsEl.innerHTML = cards.map(() => '<span></span>').join('');
const dots = [...dotsEl.children];

function layout() {
    order.forEach((card, i) => {
        const v = Math.min(i, 3);
        card.style.zIndex = String(order.length - i);
        card.style.transform = `translate(${v * 14}px, ${-v * 12}px) scale(${1 - v * 0.045}) rotate(${v * 2.2}deg)`;
        card.style.opacity = i > 3 ? '0' : '1';
        card.setAttribute('aria-hidden', String(i !== 0));
        card.querySelectorAll('a').forEach(a => { a.tabIndex = i === 0 ? 0 : -1; });
    });
    const current = cards.indexOf(order[0]);
    dots.forEach((d, i) => d.classList.toggle('on', i === current));
    statusEl.textContent = `${order[0].querySelector('h3').textContent}, ${current + 1} / ${cards.length}`;
}

function throwTop(dir, dy = 0) {
    if (busy) return;
    busy = true;
    const top = order[0];
    const w = deck.clientWidth;
    top.style.transform = `translate(${dir * w * 1.15}px, ${dy - 48}px) rotate(${dir * 26}deg) scale(1.02)`;
    top.style.opacity = '0';
    setTimeout(() => {
        order.push(order.shift());
        top.style.transition = 'none';
        layout();
        void top.offsetWidth;
        top.style.transition = '';
        busy = false;
    }, 380);
}

function bringBack() {
    if (busy) return;
    busy = true;
    const card = order.pop();
    card.style.transition = 'none';
    card.style.transform = `translate(${-deck.clientWidth * 1.15}px, -48px) rotate(-26deg)`;
    card.style.opacity = '0';
    order.unshift(card);
    card.style.zIndex = String(order.length + 1);
    void card.offsetWidth;
    card.style.transition = '';
    layout();
    setTimeout(() => { busy = false; }, 380);
}

deck.addEventListener('pointerdown', e => {
    if (busy || e.button !== 0 || e.target.closest('a')) return;
    const top = order[0];
    drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, card: top };
    deck.setPointerCapture(e.pointerId);
    top.classList.add('dragging');
});

deck.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    drag.dy = e.clientY - drag.y;
    drag.card.style.transform = `translate(${drag.dx}px, ${drag.dy}px) rotate(${drag.dx * 0.06}deg) scale(1.02)`;
});

function endDrag() {
    if (!drag) return;
    const { card, dx, dy } = drag;
    drag = null;
    card.classList.remove('dragging');
    if (Math.abs(dx) > deck.clientWidth * 0.1) {
        throwTop(Math.sign(dx), dy);
    } else {
        layout();
    }
}

deck.addEventListener('pointerup', endDrag);
deck.addEventListener('pointercancel', endDrag);

deck.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        throwTop(1);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        bringBack();
    }
});

layout();

/* ---------- Contact ---------- */
if (CONTACT_EMAIL) {
    const emailBtn = document.getElementById('contact-email');
    emailBtn.href = 'mailto:' + CONTACT_EMAIL;
    emailBtn.hidden = false;
}

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- i18n: Turkish lives in the HTML, English overrides below ---------- */
const en = {
    skip: 'Skip to content',
    nav_about: 'About',
    nav_work: 'Work',
    nav_services: 'Services',
    nav_process: 'Process',
    nav_faq: 'FAQ',
    cta_quote: 'Get a quote',

    meta_tl: 'Freelance software developer',
    meta_tr: 'Since 2020',
    meta_bl: 'E-commerce software, websites, digital asset protection, Meta & Google Ads',
    meta_br: 'Available for new projects',

    statement: 'When the same person builds the site, protects it and grows it with ads, <em>everything works together</em>.',
    about_p1: "Hi, I'm barretta. I've been building software since 2020, on projects ranging from game server infrastructure to hosting brands and online stores.",
    about_p2: 'Today I offer businesses e-commerce, web, security and advertising as one service. Remote, in Turkish and English.',

    work_title: 'Selected work',
    work_lede: 'A few of the projects I have built and developed. Drag the cards aside to flip through them.',
    deck_hint: 'Drag, or use the arrow keys',
    tuja_cat: 'E-commerce',
    tuja_desc: 'A multilingual (TR, EN, DE) online store for Tuja, a brand selling its own planners and notebooks. Cart, wishlist, order tracking and customer accounts.',
    tuja_tags: 'Payments, multilingual',
    okten_cat: 'Corporate website',
    okten_desc: 'A bilingual (TR, EN) corporate website and digital identity for Okten Yacht, a company in the yachting industry.',
    okten_tags: 'Corporate site, multilingual',
    oc_cat: 'Website, hosting',
    oc_desc: 'Interface design and JavaScript integrations for onlycore.net, a hosting provider.',
    fivem_cat: 'Game server infrastructure',
    fivem_title: 'HawksRP and Los Vines',
    fivem_desc: 'System development, infrastructure optimisation, database design and mod integrations for FiveM servers.',
    bot_cat: 'Automation',
    bot_title: 'Discord bots',
    bot_desc: 'Custom Node.js bots for community management, automation and web integrations.',

    svc_title: 'Four areas, one contact',
    svc_lede: 'Hire me for one service, or for all of them together.',
    s1_label: 'E-commerce',
    s1_title: 'E-commerce software',
    s1_desc: 'Custom storefront and admin panel, payment and shipping integrations, stock and order management, marketplace and XML feeds.',
    s2_label: 'Security',
    s2_title: 'Digital asset protection',
    s2_desc: 'Security audits and fixes, SSL, WAF and DDoS protection, automated backups, source code and brand infringement monitoring.',
    s3_label: 'Web',
    s3_title: 'Website services',
    s3_desc: 'Business sites and landing pages, responsive interfaces, technical SEO and speed, hosting and maintenance.',
    s4_label: 'Advertising',
    s4_title: 'Meta and Google Ads',
    s4_desc: 'Instagram and Facebook campaigns, Google Search, Shopping and Performance Max, pixel and GA4 setup, monthly reports.',

    proc_title: 'How I work',
    proc_lede: 'At every stage you know what was done and what comes next.',
    th_stage: 'Stage',
    th_what: 'What happens',
    th_out: 'Outcome',
    p1_title: 'Discovery and analysis',
    p1_what: 'I listen to your business, goals and competitors.',
    p1_out: 'Clear scope',
    p2_title: 'Strategy and proposal',
    p2_what: 'I prepare a roadmap, timeline and itemised pricing.',
    p2_out: 'Written proposal',
    p3_title: 'Build and launch',
    p3_what: 'I build in milestones, test everything and take it live.',
    p3_out: 'Live site or campaign',
    p4_title: 'Support and growth',
    p4_what: 'Maintenance, security monitoring and ad optimisation.',
    p4_out: 'Monthly report',

    q1: 'How long does a project take?',
    a1: 'It depends on scope. A landing page takes a few days, a business site usually 1-3 weeks, and a custom e-commerce platform a few weeks. The exact timeline is in the written proposal.',
    q2: 'How is the price set?',
    a2: 'After a short call I send a fixed, itemised quote. No surprise costs later.',
    q3: 'Do you offer support after delivery?',
    a3: 'Yes. Every project includes a support period. After that we can continue with monthly maintenance, security monitoring and backups.',
    q4: 'Do I pay the ad budget to you?',
    a4: 'No. The budget is spent directly from your own Meta or Google account, and the accounts stay yours. I only charge a management fee.',
    q5: 'Can you secure my existing site?',
    a5: 'Yes. I first review your site for security and performance and report what I find. Then I fix the issues in order of priority.',

    contact_label: 'Contact',
    contact_title: 'Have a project in mind?',
    contact_fine: 'Reply within 24 hours. The first call is free.',
    c_discord: 'Message on Discord',
    c_email: 'Send an email',
    footer_rights: 'All rights reserved.',
    footer_top: 'Back to top',

    deck_label: 'Projects',
    alt_tuja: 'Home page of the Tuja online store',
    alt_okten: 'Okten Yacht website',
    alt_onlycore: 'onlycore.net home page'
};

const i18nEls = [...document.querySelectorAll('[data-i18n]')];
const altEls = [...document.querySelectorAll('[data-i18n-alt]')];
const ariaEls = [...document.querySelectorAll('[data-i18n-aria]')];
const tr = Object.fromEntries(i18nEls.map(el => [el.dataset.i18n, el.innerHTML]));
altEls.forEach(el => { tr[el.dataset.i18nAlt] = el.alt; });
ariaEls.forEach(el => { tr[el.dataset.i18nAria] = el.getAttribute('aria-label'); });

const titles = {
    tr: document.title,
    en: 'barretta | E-commerce, web, security and digital ads'
};

function labelTableCells() {
    const heads = [...document.querySelectorAll('#dates th')].map(th => th.textContent.trim());
    document.querySelectorAll('#dates tbody tr').forEach(row => {
        [...row.children].forEach((td, i) => td.setAttribute('data-th', heads[i]));
    });
}

function setLang(lang) {
    const dict = lang === 'en' ? en : tr;
    i18nEls.forEach(el => {
        const value = dict[el.dataset.i18n];
        if (value !== undefined) el.innerHTML = value;
    });
    altEls.forEach(el => {
        const value = dict[el.dataset.i18nAlt];
        if (value !== undefined) el.alt = value;
    });
    ariaEls.forEach(el => {
        const value = dict[el.dataset.i18nAria];
        if (value !== undefined) el.setAttribute('aria-label', value);
    });
    document.documentElement.lang = lang;
    document.title = titles[lang];
    document.querySelectorAll('[data-lang]').forEach(s => s.classList.toggle('on', s.dataset.lang === lang));
    labelTableCells();
    layout();
    try {
        localStorage.setItem('siteLang', lang);
    } catch (e) { /* storage unavailable */ }
}

let currentLang = 'tr';
try {
    if (localStorage.getItem('siteLang') === 'en') currentLang = 'en';
} catch (e) { /* storage unavailable */ }
setLang(currentLang);

document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'tr' ? 'en' : 'tr';
    setLang(currentLang);
});
