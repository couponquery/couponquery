const API_BASE = "https://couponquery.com"; // switch to https://couponcanon.com after domain attach
async function loadBrand(brand = "demo") {
  try {
    const res = await fetch(`${API_BASE}/api/brand?brand=${encodeURIComponent(brand)}`);
    const data = await res.json();
    const el = document.querySelector("[data-codes]");
    if (!el) return;
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
  } catch (e) {
    console.error(e);
  }
}
document.addEventListener("DOMContentLoaded", () => loadBrand("demo"));
