(function () {
  function getCurrentLang() {
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang === 'he' || htmlLang === 'en') return htmlLang;
    return localStorage.getItem('siteLang') || 'he';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getLessonHref(lesson, lang) {
    if (lang === 'en') return lesson.hrefEn || lesson.hrefHe || lesson.href || '#';
    return lesson.hrefHe || lesson.hrefEn || lesson.href || '#';
  }

  function getLessonText(lesson, lang, heKey, enKey) {
    return lang === 'en' ? (lesson[enKey] || lesson[heKey] || '') : (lesson[heKey] || lesson[enKey] || '');
  }

  function activateFadeIns() {
    const items = document.querySelectorAll('.fade-in');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('visible'));
      return;
    }
    if (!window.__smartLessonsObserver) {
      window.__smartLessonsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            window.__smartLessonsObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px 50px 0px' });
    }
    items.forEach(el => {
      if (!el.classList.contains('visible')) window.__smartLessonsObserver.observe(el);
    });
  }

  function lessonCardTemplate(lesson, lang) {
    const href = getLessonHref(lesson, lang);
    const badge = getLessonText(lesson, lang, 'badgeHe', 'badgeEn');
    const title = getLessonText(lesson, lang, 'titleHe', 'titleEn');
    const desc = getLessonText(lesson, lang, 'descHe', 'descEn');
    const tags = lang === 'en' ? (lesson.tagsEn || lesson.tagsHe || []) : (lesson.tagsHe || lesson.tagsEn || []);
    const cta = lang === 'en' ? 'Start Lesson →' : 'להתחיל שיעור →';
    return `
      <a class="lesson-card fade-in" href="${escapeHtml(href)}">
        <div class="lesson-badge">${escapeHtml(badge)}</div>
        <img class="lesson-thumb" src="${escapeHtml(lesson.image)}" alt="${escapeHtml(title)}" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="lesson-thumb-placeholder" style="display:none; background: linear-gradient(135deg,#E8EEF8,#DDE7F5);">${escapeHtml(lesson.icon || '🎨')}</div>
        <div class="lesson-body">
          <span class="lesson-icon">${escapeHtml(lesson.icon || '🎨')}</span>
          <div class="lesson-title">${escapeHtml(title)}</div>
          <p class="lesson-desc">${escapeHtml(desc)}</p>
          <div class="lesson-tags">
            ${tags.map(tag => `<span class="lesson-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <span class="lesson-cta">${escapeHtml(cta)}</span>
        </div>
      </a>
    `;
  }

  function featuredLessonTemplate(lesson, lang) {
    const href = getLessonHref(lesson, lang);
    const title = getLessonText(lesson, lang, 'titleHe', 'titleEn');
    const desc = getLessonText(lesson, lang, 'descHe', 'descEn');
    const kicker = getLessonText(lesson, lang, 'kickerHe', 'kickerEn');
    const tags = lang === 'en' ? (lesson.tagsEn || lesson.tagsHe || []) : (lesson.tagsHe || lesson.tagsEn || []);
    const label = lang === 'en' ? '✨ Featured Lesson' : '✨ השיעור המומלץ';
    const button = lang === 'en' ? 'Start Lesson' : 'להתחיל שיעור';
    return `
      <div class="featured-lesson-wrap fade-in">
        <div class="featured-lesson-head">
          <span class="featured-label">${escapeHtml(label)}</span>
        </div>
        <div class="featured-card">
          <div class="featured-media">
            <img src="${escapeHtml(lesson.image)}" alt="${escapeHtml(title)}" loading="lazy">
          </div>
          <div class="featured-content">
            <div class="featured-kicker">${escapeHtml(kicker)}</div>
            <h2 class="featured-title">${escapeHtml(title)}</h2>
            <p class="featured-desc">${escapeHtml(desc)}</p>
            <div class="featured-tags">
              ${tags.map(tag => `<span class="featured-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="featured-actions">
              <a class="btn-primary" href="${escapeHtml(href)}">${escapeHtml(lesson.icon || '🎨')} ${escapeHtml(button)}</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function updateLessonsCountFallback() {
    const el = document.getElementById('lessons-count');
    if (!el || !Array.isArray(window.lessonsData)) return;
    const count = window.lessonsData.filter(lesson => {
      const badge = `${lesson.badgeHe || ''} ${lesson.badgeEn || ''}`;
      return badge.includes('זמין') || badge.includes('Available');
    }).length;
    el.textContent = String(count);
  }

  function renderLessons() {
    const data = Array.isArray(window.lessonsData) ? window.lessonsData : [];
    if (!data.length) return;

    const lang = getCurrentLang();
    const featured = data.find(item => item.featured) || data[0];
    const featuredEl = document.getElementById('featured-lesson');
    const gridEl = document.getElementById('lessons-grid');
    if (!featuredEl || !gridEl) return;

    featuredEl.innerHTML = featuredLessonTemplate(featured, lang);
    gridEl.innerHTML = data.map(item => lessonCardTemplate(item, lang)).join('');

    if (typeof window.countAvailableLessons === 'function') {
      window.countAvailableLessons();
    } else {
      updateLessonsCountFallback();
    }
    activateFadeIns();
  }

  window.renderLessons = renderLessons;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderLessons);
  } else {
    renderLessons();
  }

  let lastLang = getCurrentLang();
  const mo = new MutationObserver(() => {
    const nextLang = getCurrentLang();
    if (nextLang !== lastLang) {
      lastLang = nextLang;
      renderLessons();
    }
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
})();
