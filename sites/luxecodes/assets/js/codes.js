const API_BASE = "https://couponcanon.com";

function getBrand() {
  const p = new URLSearchParams(location.search);
  const b = (p.get("brand") || "demo").toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,64);
  return b || "demo";
}

function renderCodeCard(item, brandLabel) {
  const verified = item.last_verified
    ? new Date(item.last_verified).toLocaleString()
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
