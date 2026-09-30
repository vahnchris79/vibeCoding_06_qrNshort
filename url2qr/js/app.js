/**
 * URL2QR - Core Application Logic
 * Bright & Cute Pastel Theme
 * Features:
 * - Interactive Cursor-Reactive Gradient Color Engine
 * - Smooth layout transition from center to bottom
 * - High-Resolution JPG Export on QR Click
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const inputSection = document.getElementById('inputSection');
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnClearInput = document.getElementById('btnClearInput');
  const btnResetView = document.getElementById('btnResetView');
  const logoReloadBtn = document.getElementById('logoReloadBtn');

  const qrCardContainer = document.getElementById('qrCardContainer');
  const qrInteractiveFrame = document.getElementById('qrInteractiveFrame');
  const qrCanvasContainer = document.getElementById('qrCanvasContainer');
  const targetUrlDisplay = document.getElementById('targetUrlDisplay');
  const btnCopyUrl = document.getElementById('btnCopyUrl');
  const btnDownloadJpg = document.getElementById('btnDownloadJpg');
  const btnCopyImage = document.getElementById('btnCopyImage');

  const toastContainer = document.getElementById('toastContainer');
  const toastMessage = document.getElementById('toastMessage');

  let toastTimeout = null;
  let currentGeneratedUrl = '';
  let qrCodeInstance = null;

  /* ==========================================================================
     Cursor-Reactive Dynamic Pastel Gradient Engine
     Smoothly shifts pastel hues (honey yellow, sweet peach, pink, lemon-mint)
     based on the user's mouse position with buttery linear interpolation.
     ========================================================================== */
  const rootStyle = document.documentElement.style;
  const orbs = [
    document.querySelector('.orb-1'),
    document.querySelector('.orb-2'),
    document.querySelector('.orb-3')
  ];

  let targetX = 50;
  let targetY = 50;
  let currentX = 50;
  let currentY = 50;

  function handlePointerMove(clientX, clientY) {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    targetX = Math.max(0, Math.min(100, (clientX / width) * 100));
    targetY = Math.max(0, Math.min(100, (clientY / height) * 100));
  }

  window.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  function renderGradientFrame() {
    // Smooth Lerp (Linear Interpolation)
    const lerpFactor = 0.08;
    currentX += (targetX - currentX) * lerpFactor;
    currentY += (targetY - currentY) * lerpFactor;

    // Normalized coordinates centered at 0 (-0.5 to 0.5)
    const normX = (currentX / 100) - 0.5;
    const normY = (currentY / 100) - 0.5;

    // Dynamic cute pastel hues around honey yellow (~45deg)
    // 1: Butter Honey Yellow <-> Peach Coral
    const hue1 = (45 + normX * 40 + normY * 20 + 360) % 360;
    // 2: Warm Peach <-> Cherry Blossom Pink
    const hue2 = (20 + normX * 45 - normY * 30 + 360) % 360;
    // 3: Sweet Pink <-> Soft Lilac
    const hue3 = (335 - normX * 35 + normY * 40 + 360) % 360;
    // 4: Lemon Sorbet <-> Fresh Pastel Mint
    const hue4 = (68 + normX * 50 + normY * 45 + 360) % 360;

    // Apply updated styles to CSS variables
    rootStyle.setProperty('--mouse-x', `${currentX.toFixed(2)}%`);
    rootStyle.setProperty('--mouse-y', `${currentY.toFixed(2)}%`);
    rootStyle.setProperty('--color-dynamic-1', `hsl(${hue1.toFixed(1)}, 95%, 83%)`);
    rootStyle.setProperty('--color-dynamic-2', `hsl(${hue2.toFixed(1)}, 92%, 85%)`);
    rootStyle.setProperty('--color-dynamic-3', `hsl(${hue3.toFixed(1)}, 88%, 87%)`);
    rootStyle.setProperty('--color-dynamic-4', `hsl(${hue4.toFixed(1)}, 94%, 85%)`);

    // Subtle whimsical parallax motion for the jelly orbs
    if (orbs[0]) orbs[0].style.transform = `translate(${(-normX * 40).toFixed(1)}px, ${(-normY * 35).toFixed(1)}px)`;
    if (orbs[1]) orbs[1].style.transform = `translate(${(normX * 35).toFixed(1)}px, ${(normY * 40).toFixed(1)}px)`;
    if (orbs[2]) orbs[2].style.transform = `translate(${(-normX * 25).toFixed(1)}px, ${(normY * 30).toFixed(1)}px)`;

    requestAnimationFrame(renderGradientFrame);
  }

  // Start continuous smooth render loop
  renderGradientFrame();

  /* ==========================================================================
     Toast Alert Notification
     ========================================================================== */
  function showToast(message, duration = 3000) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toastMessage.textContent = message;
    toastContainer.classList.add('show');
    toastTimeout = setTimeout(() => {
      toastContainer.classList.remove('show');
    }, duration);
  }

  /* ==========================================================================
     URL Sanitization & Validation
     ========================================================================== */
  function sanitizeUrl(rawInput) {
    let input = (rawInput || '').trim();
    if (!input) return '';

    // If protocol is missing, auto-prepend https://
    if (!/^https?:\/\//i.test(input) && !input.startsWith('data:') && !input.startsWith('mailto:')) {
      input = 'https://' + input;
    }
    return input;
  }

  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return Boolean(string && string.length > 3);
    }
  }

  /* ==========================================================================
     Generate QR Code
     ========================================================================== */
  function generateQRCode(url) {
    qrCanvasContainer.innerHTML = '';

    // Level H provides 30% error correction and crisp aesthetics
    qrCodeInstance = new QRCode(qrCanvasContainer, {
      text: url,
      width: 240,
      height: 240,
      colorDark: '#1f1b16',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    currentGeneratedUrl = url;
    targetUrlDisplay.textContent = url;
  }

  /* ==========================================================================
     State Transitions
     - To Generated: Input slides down, QR Card pops up in center
     - To Initial: QR Card fades out, Input returns to center
     ========================================================================== */
  function transitionToGenerated(url) {
    generateQRCode(url);

    inputSection.classList.remove('state-center');
    inputSection.classList.add('state-bottom');

    setTimeout(() => {
      qrCardContainer.classList.add('visible');
    }, 150);

    showToast('✨ QR코드가 정중앙에 예쁘게 생성되었어요!');
  }

  function resetToInitialView() {
    qrCardContainer.classList.remove('visible');

    setTimeout(() => {
      inputSection.classList.remove('state-bottom');
      inputSection.classList.add('state-center');
      qrCanvasContainer.innerHTML = '';
      currentGeneratedUrl = '';
      urlInput.focus();
    }, 250);
  }

  /* ==========================================================================
     High-Resolution JPG Export & Download
     ========================================================================== */
  function downloadQRCodeAsJpg() {
    if (!currentGeneratedUrl) {
      showToast('⚠️ 먼저 URL을 입력하여 QR코드를 생성해주세요.');
      return;
    }

    const sourceCanvas = qrCanvasContainer.querySelector('canvas');
    const sourceImg = qrCanvasContainer.querySelector('img');

    if (!sourceCanvas && !sourceImg) {
      showToast('⚠️ QR 코드 이미지를 찾을 수 없습니다.');
      return;
    }

    // High resolution rendering canvas for JPG
    const exportSize = 1000;
    const quietZone = 80;
    const qrDrawSize = exportSize - (quietZone * 2);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');

    // Solid white background (vital for JPG)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    const finalizeExport = (imgSource) => {
      ctx.drawImage(imgSource, quietZone, quietZone, qrDrawSize, qrDrawSize);

      // Clean JPG conversion
      const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);

      let domainPart = 'url2qr';
      try {
        const parsed = new URL(currentGeneratedUrl);
        domainPart = parsed.hostname.replace(/[^a-zA-Z0-9]/g, '_');
      } catch (_) {
        domainPart = 'qrcode';
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `QR_${domainPart}_${dateStr}.jpg`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = jpgDataUrl;
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      showToast(`📥 ${filename} 저장 완료! 💛`);
    };

    if (sourceCanvas) {
      finalizeExport(sourceCanvas);
    } else if (sourceImg && sourceImg.complete) {
      finalizeExport(sourceImg);
    } else if (sourceImg) {
      sourceImg.onload = () => finalizeExport(sourceImg);
    }
  }

  /* ==========================================================================
     Clipboard Operations
     ========================================================================== */
  async function copyUrlToClipboard() {
    if (!currentGeneratedUrl) return;
    try {
      await navigator.clipboard.writeText(currentGeneratedUrl);
      showToast('📋 링크 주소가 복사되었어요!');
    } catch (err) {
      showToast('⚠️ 복사 권한이 거부되었습니다.');
    }
  }

  async function copyQrImageToClipboard() {
    const sourceCanvas = qrCanvasContainer.querySelector('canvas');
    if (!sourceCanvas) {
      showToast('⚠️ 복사할 QR 이미지가 없습니다.');
      return;
    }

    try {
      const copyCanvas = document.createElement('canvas');
      copyCanvas.width = 600;
      copyCanvas.height = 600;
      const ctx = copyCanvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(sourceCanvas, 40, 40, 520, 520);

      copyCanvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('⚠️ 이미지 변환에 실패했습니다.');
          return;
        }
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          showToast('📋 QR 이미지가 클립보드에 쏙 복사되었어요! ✨');
        } catch (copyErr) {
          showToast('⚠️ 클립보드 이미지 복사를 지원하지 않는 브라우저입니다.');
        }
      });
    } catch (err) {
      showToast('⚠️ 이미지 복사 중 오류가 발생했습니다.');
    }
  }

  /* ==========================================================================
     Form Submission & Input Handling
     ========================================================================== */
  function handleFormSubmit() {
    const rawVal = urlInput.value;
    const cleanUrl = sanitizeUrl(rawVal);

    if (!cleanUrl || !isValidUrl(cleanUrl)) {
      const container = document.querySelector('.input-bar-container');
      container.classList.remove('shake');
      void container.offsetWidth; // trigger reflow
      container.classList.add('shake');

      showToast('⚠️ 올바른 웹사이트 URL 주소를 입력해주세요.');
      urlInput.focus();
      return;
    }

    urlInput.value = cleanUrl;
    transitionToGenerated(cleanUrl);
  }

  function updateClearButtonState() {
    if (urlInput.value.length > 0) {
      btnClearInput.classList.add('active');
    } else {
      btnClearInput.classList.remove('active');
    }
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFormSubmit();
    }
  });

  urlInput.addEventListener('input', updateClearButtonState);

  btnClearInput.addEventListener('click', () => {
    urlInput.value = '';
    updateClearButtonState();
    urlInput.focus();
  });

  // QR Code Frame Click -> Trigger JPG Download
  qrInteractiveFrame.addEventListener('click', () => {
    downloadQRCodeAsJpg();
  });

  qrInteractiveFrame.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      downloadQRCodeAsJpg();
    }
  });

  // Action Buttons
  btnDownloadJpg.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadQRCodeAsJpg();
  });

  btnCopyUrl.addEventListener('click', (e) => {
    e.stopPropagation();
    copyUrlToClipboard();
  });

  btnCopyImage.addEventListener('click', (e) => {
    e.stopPropagation();
    copyQrImageToClipboard();
  });

  // Reset to initial screen
  btnResetView.addEventListener('click', (e) => {
    e.preventDefault();
    resetToInitialView();
  });

  logoReloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetToInitialView();
  });

  // Handle URL Query Parameter (?url=...)
  const urlParams = new URLSearchParams(window.location.search);
  const paramUrl = urlParams.get('url');
  if (paramUrl) {
    urlInput.value = paramUrl;
    updateClearButtonState();
    handleFormSubmit();
  } else {
    // Initial focus
    urlInput.focus();
  }
});
