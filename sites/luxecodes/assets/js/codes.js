const API_BASE = "https://couponcanon.com";

function getBrand() {
  const p = new URLSearchParams(location.search);
  const b = (p.get("brand") || "demo").toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,64);
  return b || "demo";
}

async function loadBrand(brand = "demo") {
  const el = document.querySelector("[data-codes]");
  if (!el) return;
  
  // Show loading state
  el.innerHTML = "<li>Loading…</li>";
  
  try {
    const res = await fetch(`${API_BASE}/api/brand?brand=${encodeURIComponent(brand)}`);
    const data = await res.json();
    
    if (data.codes && data.codes.length > 0) {
      el.innerHTML = data.codes.map(c => `
        <li class="code-item">
          <div class="row">
            <span class="coupon">${c.code}</span>
            <span class="desc">${c.discount_text || ""}</span>
            <button class="copy" aria-label="Copy code" data-code="${c.code}">Copy</button>
          </div>
          <div class="meta">
            <span>${c.last_verified ? "Verified " + new Date(c.last_verified).toLocaleDateString() : "Not yet verified"}</span>
            <span>${c.terms || ""}</span>
          </div>
        </li>
      `).join("");
    } else {
      el.innerHTML = "<li>No codes available</li>";
    }
    
    // Update brand label
    const label = document.querySelector("[data-brand-label]");
    if (label) label.textContent = `Latest codes ${brand ? "for " + brand : ""}`;
    
    // Attach copy button handler
    const list = document.querySelector("[data-codes]");
    if (list && !list._copyBound) {
      list.addEventListener("click", async (e) => {
        const btn = e.target.closest("button.copy");
        if (!btn) return;
        const code = btn.getAttribute("data-code");
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
      list._copyBound = true;
    }
  } catch (e) {
    console.error(e);
    el.innerHTML = "<li>Unable to load codes</li>";
  }
}
document.addEventListener("DOMContentLoaded", () => loadBrand(getBrand()));
