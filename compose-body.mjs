import { readFileSync, writeFileSync } from 'node:fs';

const brief = JSON.parse(process.env.INTERPRETATION_JSON);
const sections = brief.site.sections_structured || [];

// Strip <cite index="..."> wrappers — they're brief annotations, not user-facing
const cleanCite = (s) => String(s ?? '').replace(/<cite[^>]*>/g, '').replace(/<\/cite>/g, '');
const paras = (arr) => arr.map(p => `<p>${cleanCite(p)}</p>`).join('\n          ');

// roman numeral helpers (already in eyebrow strings)
const sectionRender = {
  'narrative-quote': (s, i) => `
      <section class="composed composed-narrative-quote">
        <div class="narrow">
          <span class="eyebrow">${cleanCite(s.eyebrow || '')}</span>
          <h2>${cleanCite(s.heading || '')}</h2>
          ${paras(s.body || [])}
        </div>
      </section>`,

  'three-pillars': (s, i) => `
      <section class="composed composed-three-pillars">
        <div class="wrap">
          <span class="eyebrow">${cleanCite(s.eyebrow || '')}</span>
          <h2>${cleanCite(s.heading || '')}</h2>
          <div class="pillar-grid">
            ${(s.items||[]).map(it => `
            <article class="pillar">
              <div class="pillar-meta">
                <span class="pillar-label">${cleanCite(it.label || '')}</span>
                <span class="pillar-value">${cleanCite(it.value || '')}</span>
              </div>
              <p>${cleanCite(it.body || '')}</p>
            </article>`).join('')}
          </div>
        </div>
      </section>`,

  'spec-table': (s, i) => {
    const keys = Object.keys(s.items?.[0] || {}).filter(k => k !== 'key');
    const headerCols = keys.map(k => `<th>${k}</th>`).join('');
    const rows = (s.items||[]).map(row => `
              <tr>
                <th scope="row">${cleanCite(row.key)}</th>
                ${keys.map(k => `<td>${cleanCite(row[k] || '')}</td>`).join('')}
              </tr>`).join('');
    return `
      <section class="composed composed-spec-table">
        <div class="wrap">
          <span class="eyebrow">${cleanCite(s.eyebrow || '')}</span>
          <h2>${cleanCite(s.heading || '')}</h2>
          <div class="table-scroll">
            <table>
              <thead><tr><th></th>${headerCols}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </section>`;
  },

  'pull-quote': (s, i) => `
      <section class="composed composed-pull-quote">
        <div class="narrow">
          <span class="eyebrow">${cleanCite(s.eyebrow || '')}</span>
          <h2>${cleanCite(s.heading || '')}</h2>
          <blockquote>${cleanCite(s.body || '')}</blockquote>
        </div>
      </section>`,

  'manifesto': (s, i) => `
      <section class="composed composed-manifesto">
        <div class="narrow">
          <span class="eyebrow">${cleanCite(s.eyebrow || '')}</span>
          <h2>${cleanCite(s.heading || '')}</h2>
          ${paras(s.body || [])}
        </div>
      </section>`,

  'cta-band': (s, i) => `
      <section class="composed composed-cta-band">
        <div class="narrow" style="text-align:center">
          <h2>${cleanCite(s.heading || '')}</h2>
          <p>${cleanCite(s.body || '')}</p>
          <div class="cta-row">
            ${(s.items||[]).map(it => `<a class="btn-ghost" href="${it.href || '#'}">${cleanCite(it.label)}</a>`).join('')}
          </div>
        </div>
      </section>`,
};

// Section assets — interleave images
const imgFor = (i) => {
  // After origins (idx 2), insert origins image; after spec-table (idx 3), gallery-grid; after manifesto (idx 6), fredagsmys
  return null;
};

let out = '';
sections.forEach((s, i) => {
  const r = sectionRender[s.type];
  if (r) out += r(s, i);

  // Insert an interstitial image after certain sections
  if (s.eyebrow && /III\b/.test(s.eyebrow)) {
    // After Origins
    out += `
      <figure class="composed composed-figure">
        <img src="assets/origins.jpg" alt="A quiet northern interior at dusk" loading="lazy">
        <figcaption>A Hygge moment — the small interior gestures that the Danes named first.</figcaption>
      </figure>`;
  }
  if (s.eyebrow && /IV\b/.test(s.eyebrow)) {
    // After comparison table — gallery
    out += `
      <section class="composed composed-gallery">
        <div class="wrap">
          <div class="gallery-grid">
            <figure><img src="assets/g1.jpg" alt="A cardamom bun on a plate" loading="lazy"><figcaption>bun</figcaption></figure>
            <figure><img src="assets/g2.jpg" alt="Fika — coffee and a kanelbulle" loading="lazy"><figcaption>fika</figcaption></figure>
            <figure><img src="assets/g3.jpg" alt="Fredagsmys spread with red wine" loading="lazy"><figcaption>fredagsmys</figcaption></figure>
            <figure><img src="assets/g4.jpg" alt="A library lit by candlelight" loading="lazy"><figcaption>hygge</figcaption></figure>
          </div>
        </div>
      </section>`;
  }
  if (s.eyebrow && /VI\b/.test(s.eyebrow) && !/VII/.test(s.eyebrow)) {
    // After fredagsmys manifesto
    out += `
      <figure class="composed composed-figure">
        <img src="assets/fredagsmys.jpg" alt="A Friday-night fredagsmys spread" loading="lazy">
        <figcaption>Fredagsmys, in its native habitat — finger food, the couch, a long collective exhale.</figcaption>
      </figure>`;
  }
});

writeFileSync(process.env.WORKDIR + '/body.html', out);
console.log('Wrote', out.length, 'bytes to body.html');
