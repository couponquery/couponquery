import { formatDate } from './formatDate.js';

const API_BASE = "https://couponcanon.com";

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

function renderCodeCard(item, brandLabel) {
  const verified = item.last_verified
    ? formatDate(item.last_verified)
    : null;
  return `
    <div class="card">
      <h3>${brandLabel || ''}</h3>
      ${verified ? `<div class="meta">Verified ${verified}</div>` : ``}
      <div class="row">
        <strong>${item.code}</strong>
        ${item.discount_text ? `<span>— ${item.discount_text}</span>` : ``}
      </div>
      ${item.terms ? `<div class="meta">${item.terms}</div>` : ``}
      <button class="btn" data-copy="${item.code}">Copy Code</button>
    </div>
  `;
}

async function loadBrand(brand = "demo") {
  const el = document.querySelector("#codes");
  if (!el) return;
  
  // Show loading state
  el.innerHTML = "<div>Loading…</div>";
  
  try {
    const res = await fetch(`${API_BASE}/api/brand?brand=${encodeURIComponent(brand)}`);
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
    el.innerHTML = "<div>Unable to load codes</div>";
  }
}
document.addEventListener("DOMContentLoaded", () => loadBrand(getBrand()));
