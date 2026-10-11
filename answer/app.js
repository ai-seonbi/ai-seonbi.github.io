(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const MAX = 24;
  const audio = $('music');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let answer = '싫어', running = false, start = 0, pausedAt = 0, frame = 0, phase = 'ready';
  let lastPose = -1, encodedLink = '', muted = false;
  function encode(text) {
    return btoa(Array.from(new TextEncoder().encode(text), b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(hash) {
    if (!/^#v1\.[\w-]{1,256}$/.test(hash)) throw new Error('invalid');
    const base = hash.slice(4).replace(/-/g, '+').replace(/_/g, '/');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(base), c => c.charCodeAt(0))).trim();
    if (!text || Array.from(text).length > MAX || /[\x00-\x1f\x7f]/.test(text)) throw new Error('invalid');
    return text;
  }
  const cats = Array.from({ length: 5 }, () => {
    const el = document.createElement('div'); el.className = 'dancer';
    const sprite = document.createElement('div'); sprite.className = 'sprite';
    const sign = document.createElement('span'); sign.className = 'placard';
    el.append(sprite, sign); $('cat-group').append(el); return { el, sprite, sign };
  });
  function paintAnswer() {
    cats.forEach(c => { c.sign.textContent = answer; c.sign.style.fontSize = Array.from(answer).length > 10 ? '8px' : ''; });
    $('big-answer').textContent = answer;
    $('big-answer').style.fontSize = Array.from(answer).length > 12 ? '28px' : '';
  }
  function setPhase(next) {
    if (phase === next) return;
    phase = next; $('stage').dataset.phase = next;
    const copy = {
      ready: ['당신에게 선물이 도착했습니다', '열어볼 용기가 있나요?', '상자를 누르면 소리와 함께 열려요'],
      opening: ['정성스럽게 포장을 뜯는 중', '잠깐만요…', '취소하기엔 이미 늦었습니다'],
      roll: ['고양이들이 입장했습니다', '두구두구두구', '답변 하나 하려고 다 모였어요'],
      announce: ['아주 신중하게 고민했습니다', '제 답변은…', '네, 아직도 뜸 들이는 중입니다'],
      suspense: ['한 번만 더 뜸 들일게요', '두구두구두구', '거의 다 왔습니다. 진짜로.'],
      reveal: ['드디어 말씀드립니다', '제 답변은!', '빰빠라밤! 전달 완료.']
    }[next];
    $('caption-kicker').textContent = copy[0]; $('caption').textContent = copy[1]; $('stage-note').textContent = copy[2];
    if (next === 'reveal' && !reducedMotion) confetti();
  }
  function confetti() {
    if ($('stage').querySelector('.confetti')) return;
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('i'); el.className = 'confetti'; el.setAttribute('aria-hidden', 'true');
      el.style.cssText = `--left:${(i * 17) % 100}%;--color:${['#ff6651','#3958da','#f2c340'][i % 3]};--duration:${3 + (i % 4) * .5}s;--delay:${-i * .23}s`;
      $('stage').append(el);
    }
  }
  function update(now) {
    if (!running || pausedAt) return;
    const elapsed = (now - start) / 1000;
    setPhase(elapsed < 1.8 ? 'opening' : elapsed < 5 ? 'roll' : elapsed < 7 ? 'announce' : elapsed < 10 ? 'suspense' : 'reveal');
    const pose = reducedMotion ? 1 : Math.floor(Math.max(0, elapsed - 1.8) / .2) % 6;
    if (pose !== lastPose) {
      lastPose = pose;
      cats.forEach((c, i) => {
        const p = reducedMotion ? 1 : (pose + i * 2) % 6;
        c.sprite.style.backgroundPosition = `${(p % 3) * 50}% ${p < 3 ? 0 : 100}%`;
        const positions = [[43,14],[41,14],[43,14],[35,14],[39,14],[35,14]];
        c.sign.style.top = positions[p][0] + '%';
        c.el.style.transform = reducedMotion ? '' : `translateY(${[0,-4,0,-7,3,-7][p]}px) rotate(${[-5,0,5,-4,0,4][p]}deg)`;
      });
    }
    frame = requestAnimationFrame(update);
  }
  function reset() {
    running = false; pausedAt = 0; cancelAnimationFrame(frame); audio.pause(); audio.loop = false;
    audio.src = 'assets/show.mp3'; lastPose = -1;
    $('stage').querySelectorAll('.confetti').forEach(el => el.remove());
    cats.forEach(c => { c.el.style.transform = ''; c.sprite.style.backgroundPosition = '0 0'; });
    setPhase('ready'); $('replay').hidden = true; $('stop').hidden = true;
    $('gift').disabled = false;
  }
  function play() {
    reset(); paintAnswer(); running = true; start = performance.now();
    $('gift').disabled = true; $('replay').hidden = false; $('stop').hidden = false;
    audio.muted = muted;
    audio.play().catch(() => { $('stage-note').textContent = '소리를 재생하지 못했지만 고양이는 계속 춤춰요'; });
    frame = requestAnimationFrame(update);
  }
  audio.addEventListener('ended', () => {
    if (!running) return;
    audio.src = 'assets/dance.mp3'; audio.loop = true;
    audio.play().catch(() => {});
  });
  $('sound').addEventListener('click', () => {
    muted = !muted; audio.muted = muted;
    $('sound').textContent = muted ? '소리 꺼짐 ♪' : '소리 켜짐 ♪'; $('sound').setAttribute('aria-pressed', String(muted));
  });
  $('gift').addEventListener('click', play); $('replay').addEventListener('click', play); $('stop').addEventListener('click', reset);
  document.addEventListener('visibilitychange', () => {
    if (!running) return;
    if (document.hidden) { pausedAt = performance.now(); audio.pause(); cancelAnimationFrame(frame); }
    else if (pausedAt) { start += performance.now() - pausedAt; pausedAt = 0; audio.play().catch(() => {}); frame = requestAnimationFrame(update); }
  });
  function countWord() {
    const chars = Array.from($('word').value);
    if (chars.length > MAX) $('word').value = chars.slice(0, MAX).join('');
    $('count').textContent = `${Math.min(chars.length, MAX)} / ${MAX}`;
    $('link-result').hidden = true; $('status').textContent = '';
    if (running) reset();
    answer = $('word').value.trim() || '싫어'; paintAnswer();
  }
  $('word').addEventListener('input', (e) => { if (!e.isComposing) countWord(); });
  $('word').addEventListener('compositionend', countWord);
  document.querySelectorAll('[data-word]').forEach(b => b.addEventListener('click', () => { $('word').value = b.dataset.word; countWord(); $('word').focus(); }));
  $('answer-form').addEventListener('submit', e => {
    e.preventDefault(); const text = $('word').value.trim();
    if (!text || /[\x00-\x1f\x7f]/.test(text)) { $('status').textContent = '고양이가 들고 나올 한마디를 입력해주세요.'; $('word').focus(); return; }
    answer = Array.from(text).slice(0, MAX).join(''); reset(); paintAnswer();
    const url = new URL(location.href); url.search = ''; url.hash = 'v1.' + encode(answer);
    encodedLink = url.href; $('share-url').value = encodedLink; $('link-result').hidden = false;
    $('share').hidden = !navigator.share; $('status').textContent = '링크를 만들었어요. 상자를 눌러 미리 볼 수 있어요.';
  });
  $('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(encodedLink); $('status').textContent = '복사했어요. 대화창에 붙여넣어 보내세요.'; $('copy').textContent = '복사 완료'; setTimeout(() => $('copy').textContent = '복사', 1800); }
    catch { $('share-url').focus(); $('share-url').select(); $('status').textContent = '링크를 선택했어요. 길게 누르거나 복사 단축키로 복사해주세요.'; }
  });
  $('share').addEventListener('click', async () => {
    try { await navigator.share({ title: '당신에게 답변이 도착했습니다', text: '선물을 열어보세요.', url: encodedLink }); }
    catch (e) { if (e.name !== 'AbortError') $('status').textContent = '공유하지 못했어요. 복사 버튼으로 링크를 보내주세요.'; }
  });
  $('preview').addEventListener('click', () => { $('theater').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'center' }); play(); });
  function route() {
    reset(); const hash = location.hash;
    if (!hash) { document.body.classList.remove('recipient'); $('maker').hidden = false; $('recipient-actions').hidden = true; return; }
    try {
      answer = decode(hash); paintAnswer(); document.body.classList.add('recipient');
      $('maker').hidden = true; $('recipient-actions').hidden = false;
      $('footer-note').textContent = '당신만을 위해 준비한, 조금 과한 답변.';
    } catch {
      document.body.classList.remove('recipient'); $('maker').hidden = false; $('recipient-actions').hidden = true;
      $('status').textContent = '이 선물 링크는 열 수 없어요. 새 답변을 만들어주세요.';
    }
  }
  window.addEventListener('hashchange', route); route();
})();
