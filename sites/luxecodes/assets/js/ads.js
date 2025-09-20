/**
 * AdSense integration with environment gating
 * Only loads ads if LUXE_ENABLE_ADS is true and ADSENSE_PUB_ID is provided
 */

function initAdSense() {
  // Check if ads are enabled and we have required config
  if (!window.LUXE_ENABLE_ADS || !window.ADSENSE_PUB_ID || !window.ADSENSE_SLOT_ID) {
    console.log('AdSense disabled or missing configuration');
    return;
  }

  console.log('Initializing AdSense...');

  // Inject AdSense script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${window.ADSENSE_PUB_ID}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);

  // Create ad unit placeholder
  const adContainer = document.createElement('div');
  adContainer.className = 'ad-container';
  adContainer.innerHTML = `
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="${window.ADSENSE_PUB_ID}"
         data-ad-slot="${window.ADSENSE_SLOT_ID}"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  `;

  // Insert ad after Q&A block
  const qaBlock = document.querySelector('.qa-block');
  if (qaBlock && qaBlock.parentNode) {
    qaBlock.parentNode.insertBefore(adContainer, qaBlock.nextSibling);
  }

  // Initialize the ad
  script.onload = () => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log('AdSense ad unit initialized');
    } catch (error) {
      console.error('AdSense initialization error:', error);
    }
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdSense);
} else {
  initAdSense();
}
