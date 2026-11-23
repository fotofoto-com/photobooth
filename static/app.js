const $ = s => document.querySelector(s);
const COLORS = ['#ffffff', '#111111', '#1e6fff', '#ff4d6d', '#ffd23f', '#ffb3c7', '#7a4a26', '#2ecc71', '#8e5cf7'];
const THEMES = { polos: 'Polos', komik: 'Komik', hero: 'Hero Comic', koboy: 'Koboy', film: 'Film Retro' };
const FILTERS = {
    none: ['Normal', 'none'],
    bw: ['Hitam Putih', 'grayscale(1) contrast(1.1)'],
    noir: ['Noir', 'grayscale(1) contrast(1.6) brightness(.9)'],
    sepia: ['Sephia', 'sepia(1)'],
    contrast: ['Kontras', 'contrast(1.4) saturate(1.2)'],
    vintage: ['Vintage', 'sepia(.5) contrast(.9) brightness(1.1) saturate(1.3)'],
    bright: ['Cerah', 'brightness(1.2) saturate(1.2)'],
    warm: ['Hangat', 'sepia(.35) saturate(1.4)'],
    fade: ['Pudar', 'contrast(.8) brightness(1.15) saturate(.8)']
};
const S = { n: 4, theme: 'komik', color: '#ffffff', filter: 'none', photos: [], facing: 'user', stream: null, busy: false };
const video = $('#video'),
    strip = $('#strip');

function chips(el, items, key, onPick) {
    el.innerHTML = '';
    items.forEach(([val, label]) => {
        const b = document.createElement('button');
        b.className = 'chip' + (S[key] === val ? ' on' : '');
        b.textContent = label;
        b.onclick = () => { S[key] = val;
            onPick(); };
        el.appendChild(b);
    });
}

function renderOptions() {
    chips($('#frames'), [3, 4, 6].map(n => [n, n + ' Frame']), 'n', () => { renderOptions();
        renderSlots();
        draw(); });
    chips($('#filters'), Object.entries(FILTERS).map(([k, v]) => [k, v[0]]), 'filter', () => { renderOptions();
        applyFilter();
        renderSlots();
        draw(); });
    chips($('#themes'), Object.entries(THEMES), 'theme', () => { renderOptions();
        draw(); });
    const c = $('#colors');
    c.innerHTML = '';
    COLORS.forEach(col => {
        const d = document.createElement('div');
        d.className = 'sw' + (S.color === col ? ' on' : '');
        d.style.background = col;
        d.onclick = () => { S.color = col;
            renderOptions();
            draw(); };
        c.appendChild(d);
    });
}

function applyFilter() { video.style.filter = FILTERS[S.filter][1]; }

function renderSlots() {
    const box = $('#slots');
    box.innerHTML = '';
    for (let i = 0; i < S.n; i++) {
        const d = document.createElement('div');
        d.className = 'slot';
        d.textContent = i + 1;
        if (S.photos[i]) { d.classList.add('filled');
            d.textContent = '';
            d.style.backgroundImage = `url(${S.photos[i].src})`;
            d.style.filter = FILTERS[S.filter][1]; }
        d.title = 'Ketuk untuk ulang foto ini';
        d.onclick = () => { if (!S.busy) run([i]); };
        box.appendChild(d);
    }
}
async function startCam() {
    try {
        if (S.stream) S.stream.getTracks().forEach(t => t.stop());
        S.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: S.facing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
        video.srcObject = S.stream;
        video.classList.toggle('mirror', S.facing === 'user');
        $('#msg').style.display = 'none';
        return true;
    } catch (e) {
        const m = $('#msg');
        m.style.display = 'block';
        m.textContent = 'Kamera tidak bisa diakses. Izinkan kamera & pastikan memakai HTTPS.';
        return false;
    }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function run(indexes) {
    if (S.busy) return;
    if (!S.stream && !(await startCam())) return;
    S.busy = true;
    setBtns(true);
    const secs = +$('#timer').value;
    for (const i of indexes) {
        for (let t = secs; t > 0; t--) { $('#count').textContent = t;
            await wait(1000); }
        $('#count').textContent = '📸';
        await wait(250);
        snap(i);
        $('#count').textContent = '';
        renderSlots();
        draw();
        await wait(500);
    }
    S.busy = false;
    setBtns(false);
}

function snap(i) {
    const c = document.createElement('canvas');
    c.width = 520;
    c.height = 390;
    const x = c.getContext('2d'),
        vw = video.videoWidth,
        vh = video.videoHeight;
    const r = Math.max(520 / vw, 390 / vh),
        w = vw * r,
        h = vh * r;
    if (S.facing === 'user') { x.translate(520, 0);
        x.scale(-1, 1); }
    x.drawImage(video, (520 - w) / 2, (390 - h) / 2, w, h);
    const img = new Image();
    img.src = c.toDataURL('image/jpeg', .92);
    img.onload = () => draw();
    S.photos[i] = img;
}

function setBtns(b) {
    ['start', 'retakeAll', 'flip'].forEach(id => $('#' + id).disabled = b); }
const lum = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1000; };

function draw() {
    const W = 600,
        P = 40,
        PW = 520,
        PH = 390,
        G = 20,
        F = 120,
        n = S.n;
    const H = P + n * PH + (n - 1) * G + F;
    strip.width = W;
    strip.height = H;
    const x = strip.getContext('2d'),
        fg = lum(S.color) > 140 ? '#111' : '#fff';
    x.fillStyle = S.color;
    x.fillRect(0, 0, W, H);
    x.save();
    x.fillStyle = fg;
    x.strokeStyle = fg;
    if (S.theme === 'komik') { x.globalAlpha = .13; for (let y = 10; y < H; y += 24)
            for (let xx = (y / 24 % 2) * 12; xx < W; xx += 24) { x.beginPath();
                x.arc(xx, y, 4, 0, 7);
                x.fill(); } }
    if (S.theme === 'hero') { x.globalAlpha = .12;
        x.lineWidth = 18; for (let i = -H; i < W + H; i += 60) { x.beginPath();
            x.moveTo(i, 0);
            x.lineTo(i - H * .6, H);
            x.stroke(); } }
    if (S.theme === 'koboy') { x.setLineDash([12, 8]);
        x.lineWidth = 4;
        x.strokeRect(12, 12, W - 24, H - 24); }
    if (S.theme === 'film') { x.globalAlpha = .55; for (let y = 14; y < H - 20; y += 38) { x.fillRect(11, y, 14, 20);
            x.fillRect(W - 25, y, 14, 20); } }
    x.restore();
    for (let i = 0; i < n; i++) {
        const y = P + i * (PH + G);
        if (S.photos[i] && S.photos[i].complete) { x.filter = FILTERS[S.filter][1];
            x.drawImage(S.photos[i], P, y, PW, PH);
            x.filter = 'none'; } else { x.fillStyle = 'rgba(128,128,128,.25)';
            x.fillRect(P, y, PW, PH);
            x.fillStyle = fg;
            x.font = 'bold 60px sans-serif';
            x.textAlign = 'center';
            x.fillText(i + 1, W / 2, y + PH / 2 + 20); }
        x.strokeStyle = fg;
        x.lineWidth = 5;
        x.setLineDash([]);
        x.strokeRect(P, y, PW, PH);
    }
    const titles = { polos: 'PHOTOBOOTH', komik: 'POW! ✦ KOMIK', hero: '★ HERO SQUAD ★', koboy: '★ WILD WEST ★', film: 'FILM ROLL' };
    const fonts = { komik: '900 46px Impact,"Arial Black",sans-serif', hero: '900 44px Impact,"Arial Black",sans-serif', koboy: 'bold 46px Georgia,serif', film: 'bold 40px "Courier New",monospace', polos: 'bold 40px sans-serif' };
    x.fillStyle = S.theme === 'hero' ? (lum(S.color) > 140 ? '#1e6fff' : '#ffd23f') : fg;
    x.textAlign = 'center';
    x.font = fonts[S.theme];
    x.fillText(titles[S.theme], W / 2, H - 62);
    x.fillStyle = fg;
    x.font = '20px sans-serif';
    x.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, H - 28);
}

function blob() { return new Promise(r => strip.toBlob(r, 'image/png')); }
async function save(share) {
    const b = await blob(),
        f = new File([b], 'photobooth.png', { type: 'image/png' });
    if (share && navigator.canShare && navigator.canShare({ files: [f] })) {
        try { await navigator.share({ files: [f], title: 'Photobooth' }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'photobooth.png';
    a.click();
}
$('#start').onclick = () => { S.photos = [];
    renderSlots();
    draw();
    run([...Array(S.n).keys()]); };
$('#retakeAll').onclick = $('#start').onclick;
$('#flip').onclick = async() => { S.facing = S.facing === 'user' ? 'environment' : 'user';
    await startCam(); };
$('#save').onclick = () => save(true);
$('#dl').onclick = () => save(false);
renderOptions();
applyFilter();
renderSlots();
draw();
startCam();
