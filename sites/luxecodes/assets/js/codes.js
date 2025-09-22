import { formatDate } from './formatDate.js';

const API_BASE = "";

function getBrand() {
  const p = new URLSearchParams(location.search);
  const b = (p.get("brand") || "demo").toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,64);
  return b || "demo";
}

function updateQABlock(brand, codes) {
  const questionEl = document.getElementById('qa-question');
  const answerEl = document.getElementById('qa-answer');
  
  if (questionEl) {
    questionEl.textContent = `What are the best verified ${brand} codes today?`;
  }
  
  if (answerEl) {
    if (codes && codes.length > 0) {
      const codeList = codes.slice(0, 3).map(c => {
        const verified = c.last_verified ? ` (verified ${formatDate(c.last_verified)})` : '';
        return `${c.code}${c.discount_text ? ` - ${c.discount_text}` : ''}${verified}`;
      }).join(', ');
      answerEl.textContent = `The current verified codes for ${brand} are: ${codeList}. Each includes an exact verification timestamp.`;
    } else {
      answerEl.textContent = `Currently no verified codes available for ${brand}.`;
    }
  }
}

function updateFAQSchema(brand, codes) {
  const schemaEl = document.getElementById('faq-schema');
  if (!schemaEl) return;
  
  let answerText;
  if (codes && codes.length > 0) {
    const codeList = codes.slice(0, 3).map(c => {
      const verified = c.last_verified ? ` (verified ${formatDate(c.last_verified)})` : '';
      return `${c.code}${c.discount_text ? ` - ${c.discount_text}` : ''}${verified}`;
    }).join(', ');
    answerText = `The current verified codes for ${brand} are: ${codeList}. Each includes an exact verification timestamp.`;
  } else {
    answerText = `Currently no verified codes available for ${brand}.`;
  }
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": `What are the best verified ${brand} codes today?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answerText
      }
    }]
  };
  
  schemaEl.textContent = JSON.stringify(schema, null, 2);
}

const fmtDate = (iso) => {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(new Date(iso));
  } catch {
    return null;
  }
};

const fmtVerifiedDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: '2-digit'
    }).format(d);
  } catch { return null; }
};

const VerifiedIcon = () => `
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" stroke="currentColor" opacity="0.3"></circle>
    <path d="M7 12.5l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
`;

function renderCodeCard(item, brandLabel) {
  const verifiedText = fmtVerifiedDate(item.last_verified);
  const verifiedHtml = verifiedText
    ? `<div class="verified">Verified ${verifiedText}</div>`
    : `<div class="verified is-missing">Not verified yet</div>`;

  return `
    <div class="card">
      <h3 class="brand">${brandLabel || ''}</h3>
      <div class="row">
        <strong class="code">${item.code}</strong>
        ${item.discount_text ? `<span>— ${item.discount_text}</span>` : ``}
      </div>
      ${item.terms ? `<div class="meta">${item.terms}</div>` : ``}
      ${verifiedHtml}
      <div class="actions">
        <button class="btn" data-copy="${item.code}">Copy Code</button>
      </div>
    </div>
  `;
}

const err = document.getElementById('err');
const retry = err ? err.querySelector('.btn-retry') : null;

async function fetchCodesSafe(...args) {
  try {
    const res = await fetch(...args);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    err?.setAttribute('hidden', '');
    return res;
  } catch (e) {
    err?.removeAttribute('hidden');
    throw e;
  }
}

if (retry) {
  retry.addEventListener('click', () => {
    err.setAttribute('hidden', '');
    loadBrand(getBrand());
  });
}

async function loadBrand(brand = "demo") {
  const el = document.querySelector("#codes");
  if (!el) return;
  
  // Show loading state
  el.innerHTML = "<div>Loading…</div>";
  
  try {
    const res = await fetchCodesSafe(`${API_BASE}/.netlify/functions/getBrandCodes?brand=${encodeURIComponent(brand)}`);
    const data = await res.json();
    
    // Update Q&A block and FAQ schema
    updateQABlock(brand, data.codes);
    updateFAQSchema(brand, data.codes);
    
    if (data.codes && data.codes.length > 0) {
      el.innerHTML = data.codes.map(c => renderCodeCard(c, brand)).join("");
    } else {
      el.innerHTML = "<div>No codes available</div>";
    }
    
    // Attach copy button handler
    if (el && !el._copyBound) {
      el.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-copy]");
        if (!btn) return;
        const code = btn.getAttribute("data-copy");
        try {
          await navigator.clipboard.writeText(code);
          const old = btn.textContent;
          btn.textContent = "Copied";
          btn.disabled = true;
          setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 1200);
        } catch (err) {
          console.error(err);
        }
      });
      el._copyBound = true;
    }
  } catch (e) {
    console.error(e);
    const container = document.querySelector('#codes-list') || document.body;
    const banner = document.createElement('div');
    banner.className = 'p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 mb-3';
    banner.innerHTML = `
      Unable to load codes right now.
      <button id="retry-load" class="ml-2 px-2 py-1 rounded-lg border border-red-300 bg-white text-red-700">Retry</button>
    `;
    container.prepend(banner);
    const btn = banner.querySelector('#retry-load');
    if (btn) btn.addEventListener('click', () => loadBrand(brand));
  }
}
async function fetchAndRenderLiveCodes() {
  console.log('LIVE render start');
  const grid = document.querySelector('.cards-grid');
  if (!grid) return;
  
  const template = grid.querySelector('.coupon-card');
  if (!template) return;
  
  try {
    const response = await fetch('/.netlify/functions/getBrandCodes');
    const { codes = [] } = await response.json();
    
    grid.innerHTML = ''; // clear demo/mocks
    
    codes.forEach(item => {
      const card = template.cloneNode(true);
      
      // Fill brand name
      const brandName = card.querySelector('.brand-name');
      if (brandName) brandName.textContent = item.brand || 'Unknown';
      
      // Verified badge
      const v = card.querySelector('.verified');
      if (v) {
        if (item.last_verified) {
          v.textContent = 'Verified ' + new Date(item.last_verified).toLocaleString();
          v.style.display = '';
        } else {
          v.style.display = 'none';
        }
      }
      
      // Code text
      const codeEl = card.querySelector('.code');
      if (codeEl) codeEl.textContent = item.code || '';
      
      // Discount
      const d = card.querySelector('.discount');
      if (d) d.textContent = item.discount_text || '';
      
      // Remove any DEMO badge if present
      card.querySelector('.badge-demo')?.remove();
      
      // Logo handling
      const brandEl = card.querySelector('.brand') || card;
      const img = card.querySelector('.brand-logo');
      const initials = card.querySelector('.initials-badge') || document.createElement('div');
      initials.className = 'initials-badge';
      initials.textContent = (item.brand || 'NA').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
      
      if (item.logo_url) {
        if (!img) {
          const ni = document.createElement('img');
          ni.className = 'brand-logo';
          brandEl.prepend(ni);
        }
        const logoImg = card.querySelector('.brand-logo');
        if (logoImg) {
          logoImg.src = item.logo_url;
          logoImg.alt = (item.brand || 'Brand') + ' logo';
          logoImg.onerror = () => {
            logoImg.remove();
            brandEl.prepend(initials);
          };
        }
      } else {
        img?.remove();
        brandEl.prepend(initials);
      }
      
      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Error fetching live codes:', error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBrand(getBrand());
  fetchAndRenderLiveCodes();
});
