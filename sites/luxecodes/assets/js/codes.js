const API_BASE = "https://couponcanon.com";
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
  } catch (e) {
    console.error(e);
    el.innerHTML = "<li>Unable to load codes</li>";
  }
}
document.addEventListener("DOMContentLoaded", () => loadBrand("demo"));
