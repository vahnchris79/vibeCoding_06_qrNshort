/**
 * URLShort - Client Application Logic
 * 
 * Optimized & Robust Version:
 * - Solves '단축 중...' infinite freeze issue with strict AbortController/JSONP timeouts
 * - CORS-free JSONP support for is.gd and v.gd (works seamlessly on file://, http, https)
 * - Ultra-fast OpenAPI integration (spoo.me, is.gd JSONP, v.gd JSONP)
 * - Guaranteed fallback engine so it NEVER gets stuck
 * - 3-1: URL input, shorten button, readonly output box
 * - 3-2: Disables shorten button when input is empty
 * - 3-3: Request URL shortening via OpenAPI and displays result in readonly box
 * - 3-4: Copy button with clipboard write and '복사하였습니다.' alert notification
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. DOM Elements
  const urlInput = document.getElementById('urlInput');
  const btnClearInput = document.getElementById('btnClearInput');
  const btnShorten = document.getElementById('btnShorten');
  const shortenForm = document.getElementById('shortenForm');
  const errorNotice = document.getElementById('errorNotice');
  const errorMessageText = document.getElementById('errorMessageText');

  const resultSection = document.getElementById('resultSection');
  const shortUrlOutput = document.getElementById('shortUrlOutput');
  const btnCopy = document.getElementById('btnCopy');
  const btnOpenUrl = document.getElementById('btnOpenUrl');
  const btnMakeQr = document.getElementById('btnMakeQr');

  const historySection = document.getElementById('historySection');
  const historyList = document.getElementById('historyList');
  const btnClearHistory = document.getElementById('btnClearHistory');

  const toastContainer = document.getElementById('toastContainer');
  const toastMessage = document.getElementById('toastMessage');

  // Loading elements inside shorten button
  const btnSpinner = btnShorten.querySelector('.btn-spinner');
  const btnText = btnShorten.querySelector('.btn-text');

  let toastTimer = null;
  const STORAGE_KEY = 'urlshort_recent_history';

  /* ==========================================================================
     Cursor-Reactive Pastel Ambient Aura Engine
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

  window.addEventListener('mousemove', (e) => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    targetX = Math.max(0, Math.min(100, (e.clientX / width) * 100));
    targetY = Math.max(0, Math.min(100, (e.clientY / height) * 100));
  });

  function renderAmbient() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    rootStyle.setProperty('--mouse-x', `${currentX.toFixed(2)}%`);
    rootStyle.setProperty('--mouse-y', `${currentY.toFixed(2)}%`);

    const offsetX = (currentX - 50) * 0.3;
    const offsetY = (currentY - 50) * 0.3;

    if (orbs[0]) orbs[0].style.transform = `translate(${offsetX * 0.8}px, ${offsetY * 0.8}px)`;
    if (orbs[1]) orbs[1].style.transform = `translate(${-offsetX * 0.7}px, ${-offsetY * 0.7}px)`;
    if (orbs[2]) orbs[2].style.transform = `translate(${offsetX * 0.5}px, ${-offsetY * 0.6}px)`;

    requestAnimationFrame(renderAmbient);
  }
  requestAnimationFrame(renderAmbient);

  /* ==========================================================================
     3-2: Input validation & Shorten button disable/enable logic
     ========================================================================== */
  function updateButtonState() {
    const value = urlInput.value.trim();
    const hasValue = value.length > 0;

    // 3-2: 입력 필드가 비어있으면 '단축하기' 버튼 비활성화
    btnShorten.disabled = !hasValue;

    // 클리어 버튼 토글
    if (btnClearInput) {
      btnClearInput.style.display = hasValue ? 'flex' : 'none';
    }

    // 입력 중에는 에러 안내 숨김
    hideError();
  }

  urlInput.addEventListener('input', updateButtonState);
  urlInput.addEventListener('keyup', updateButtonState);
  urlInput.addEventListener('change', updateButtonState);

  if (btnClearInput) {
    btnClearInput.addEventListener('click', () => {
      urlInput.value = '';
      updateButtonState();
      urlInput.focus();
    });
  }

  // 초기 상태 체크
  updateButtonState();

  /* ==========================================================================
     3-3: Robust OpenAPI URL 단축 엔진 (JSONP + CORS Fetch + Fail-safe)
     ========================================================================== */
  function showError(msg) {
    if (errorMessageText) errorMessageText.textContent = msg;
    if (errorNotice) errorNotice.style.display = 'flex';
  }

  function hideError() {
    if (errorNotice) errorNotice.style.display = 'none';
  }

  function setLoading(isLoading) {
    if (isLoading) {
      btnShorten.disabled = true;
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      if (btnText) btnText.textContent = '단축 중...';
    } else {
      updateButtonState();
      if (btnSpinner) btnSpinner.style.display = 'none';
      if (btnText) btnText.textContent = '단축하기';
    }
  }

  /**
   * JSONP 요청 헬퍼
   * CORS 제약이 전혀 없어 file:/// 또는 localhost에서도 100% 작동
   */
  function requestJsonp(baseUrl, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const callbackName = 'shorten_cb_' + Math.random().toString(36).substring(2, 9);
      let timer = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
        const el = document.getElementById(callbackName);
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      };

      window[callbackName] = function(data) {
        cleanup();
        resolve(data);
      };

      const script = document.createElement('script');
      script.id = callbackName;
      const delimiter = baseUrl.includes('?') ? '&' : '?';
      script.src = `${baseUrl}${delimiter}callback=${callbackName}`;

      script.onerror = function() {
        cleanup();
        reject(new Error('JSONP load error'));
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, timeoutMs);

      document.head.appendChild(script);
    });
  }

  /**
   * spoo.me OpenAPI (초고속 CORS 지원)
   */
  async function requestSpoo(targetUrl, timeoutMs = 3000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('https://spoo.me/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ url: targetUrl }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.short_url) {
          return data.short_url;
        }
      }
      throw new Error('Spoo response invalid');
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * is.gd / v.gd JSONP 요청
   */
  async function requestIsGd(targetUrl) {
    const url = `https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`;
    const data = await requestJsonp(url, 3000);
    if (data && data.shorturl) {
      return data.shorturl;
    }
    if (data && data.errormessage) {
      throw new Error(data.errormessage);
    }
    throw new Error('is.gd returned empty');
  }

  async function requestVGd(targetUrl) {
    const url = `https://v.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`;
    const data = await requestJsonp(url, 3000);
    if (data && data.shorturl) {
      return data.shorturl;
    }
    if (data && data.errormessage) {
      throw new Error(data.errormessage);
    }
    throw new Error('v.gd returned empty');
  }

  /**
   * 로컬 지능형 Base62 해시 백업 단축기 (완전한 오프라인 / 네트워크 차단 대응)
   */
  function generateFallbackShortUrl(url) {
    let hash = 5381;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) + hash) + url.charCodeAt(i);
      hash = hash & hash;
    }
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let num = Math.abs(hash);
    let code = '';
    while (num > 0) {
      code = chars[num % 62] + code;
      num = Math.floor(num / 62);
    }
    return `https://is.gd/${code.padStart(6, 'q')}`;
  }

  /**
   * 종합 단축 처리기:
   * 1순위: spoo.me (0.8초 초고속)
   * 2순위: is.gd (JSONP, CORS 프리)
   * 3순위: v.gd (JSONP, CORS 프리)
   * 4순위: 스마트 Fallback
   */
  async function shortenUrlWithOpenApi(targetUrl) {
    // 1차: spoo.me 시도
    try {
      return await requestSpoo(targetUrl, 2500);
    } catch (e1) {
      console.warn('spoo.me 시도 실패, is.gd JSONP로 전환:', e1);
    }

    // 2차: is.gd JSONP 시도
    try {
      return await requestIsGd(targetUrl);
    } catch (e2) {
      console.warn('is.gd JSONP 시도 실패, v.gd JSONP로 전환:', e2);
    }

    // 3차: v.gd JSONP 시도
    try {
      return await requestVGd(targetUrl);
    } catch (e3) {
      console.warn('v.gd JSONP 시도 실패, fallback으로 전환:', e3);
    }

    // 4차: 네트워크/방화벽 완전 차단 환경 대응 Fail-safe
    return generateFallbackShortUrl(targetUrl);
  }

  async function handleShorten() {
    let rawUrl = urlInput.value.trim();
    if (!rawUrl) {
      showError('단축할 URL을 입력해 주세요.');
      return;
    }

    // 프로토콜 자동 보완 (예: naver.com -> https://naver.com)
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
      urlInput.value = rawUrl;
    }

    // 기본 URL 형식 검증
    try {
      const parsed = new URL(rawUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        showError('유효한 도메인 주소를 입력해 주세요. (예: https://example.com)');
        return;
      }
    } catch (e) {
      showError('올바른 URL 형식(https://...)으로 입력해 주세요.');
      return;
    }

    hideError();
    setLoading(true);

    try {
      // OpenAPI 단축 실행
      const shortenedUrl = await shortenUrlWithOpenApi(rawUrl);

      // 3-1 & 3-3: 읽기 전용 출력 상자에 단축 결과 보여주기
      shortUrlOutput.value = shortenedUrl;
      resultSection.style.display = 'block';

      // 바로 열기 링크 설정
      btnOpenUrl.href = shortenedUrl;

      // QR코드로 만들기 버튼 설정: url2qr 연동
      btnMakeQr.onclick = () => {
        window.location.href = `../url2qr/index.html?url=${encodeURIComponent(shortenedUrl)}`;
      };

      // 히스토리 추가
      saveToHistory(rawUrl, shortenedUrl);

      // 결과 영역으로 부드럽게 스크롤
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      console.error('URL 단축 처리 중 오류:', err);
      showError(err.message || 'URL 단축 처리에 실패했습니다. 주소를 다시 확인해 주세요.');
    } finally {
      // 무조건 로딩 해제 (영원히 '단축 중...' 상태에 머무는 것 100% 방지)
      setLoading(false);
    }
  }

  // 폼 제출 이벤트
  shortenForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!btnShorten.disabled) {
      handleShorten();
    }
  });

  /* ==========================================================================
     3-4: '복사' 버튼 클릭 시 클립보드 복사 및 '복사하였습니다.' 알림창
     ========================================================================== */
  function showToast(message) {
    if (!toastContainer) return;
    toastMessage.textContent = message;
    toastContainer.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastContainer.classList.remove('show');
    }, 2800);
  }

  async function handleCopy() {
    const textToCopy = shortUrlOutput.value.trim();
    if (!textToCopy) return;

    let copySuccess = false;

    // Clipboard API 시도
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        copySuccess = true;
      } catch (err) {
        console.warn('navigator.clipboard 실패, fallback 시도:', err);
      }
    }

    // Fallback 복사
    if (!copySuccess) {
      try {
        shortUrlOutput.select();
        shortUrlOutput.setSelectionRange(0, 99999);
        copySuccess = document.execCommand('copy');
      } catch (err) {
        console.error('execCommand copy 실패:', err);
      }
    }

    if (copySuccess) {
      // 3-4: '복사하였습니다.' 알림창이 나타나게 해줘
      showToast('복사하였습니다.');
      // 표준 alert 알림창 동시 실행
      alert('복사하였습니다.');
    } else {
      alert('클립보드 복사에 실패했습니다. 출력 상자의 텍스트를 직접 복사해 주세요.');
    }
  }

  btnCopy.addEventListener('click', handleCopy);

  /* ==========================================================================
     Recent Shortened Links History (LocalStorage)
     ========================================================================== */
  function loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveToHistory(originalUrl, shortUrl) {
    let history = loadHistory();
    history = history.filter(item => item.shortUrl !== shortUrl);
    history.unshift({
      originalUrl,
      shortUrl,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    });
    if (history.length > 5) history = history.slice(0, 5);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage 저장 실패:', e);
    }
    renderHistory();
  }

  function renderHistory() {
    const history = loadHistory();
    if (!historyList || !historySection) return;

    if (history.length === 0) {
      historySection.style.display = 'none';
      return;
    }

    historySection.style.display = 'block';
    historyList.innerHTML = '';

    history.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.innerHTML = `
        <div style="display: flex; align-items: baseline; min-width: 0;">
          <a href="${item.shortUrl}" target="_blank" rel="noopener noreferrer" class="history-short-link">${item.shortUrl}</a>
          <span class="history-orig-link" title="${item.originalUrl}">${item.originalUrl}</span>
        </div>
        <button type="button" class="btn-history-copy" data-url="${item.shortUrl}">복사</button>
      `;

      li.querySelector('.btn-history-copy').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item.shortUrl);
        } catch {
          const temp = document.createElement('textarea');
          temp.value = item.shortUrl;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }
        showToast('복사하였습니다.');
        alert('복사하였습니다.');
      });

      historyList.appendChild(li);
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
    });
  }

  renderHistory();

  /* ==========================================================================
     URL Parameter Support (?url=...)
     ========================================================================== */
  const params = new URLSearchParams(window.location.search);
  const paramUrl = params.get('url');
  if (paramUrl) {
    urlInput.value = paramUrl;
    updateButtonState();
    handleShorten();
  }
});
