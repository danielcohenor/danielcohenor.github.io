const listNode = document.querySelector('#publication-list');
const statusNode = document.querySelector('#publication-status');
const searchNode = document.querySelector('#publication-search');
const filtersNode = document.querySelector('#year-filters');
const preprintToggleNode = document.querySelector('#show-preprints');

let publications = [];
let selectedYear = 'all';
let showPreprints = false;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function normalizeTitle(title = '') {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function publicationLink(publication) {
  if (publication.arxiv) return `https://arxiv.org/abs/${publication.arxiv}`;
  if (publication.paper) return publication.paper;
  return `https://arxiv.org/search/?query=${encodeURIComponent(publication.title)}&searchtype=title`;
}

function usesAuthorThumbnail(publication) {
  if (/author-daniel-dynamic-typography\.gif$/i.test(publication.image || '')) return false;
  return /\/(?:archive\/|author-|priority-|project-|or-)/.test(publication.image || '');
}

function publicationMedia(publication) {
  const source = publication.image || 'assets/images/publications/placeholder.png';
  if (/\.(?:mp4|webm|mov|m4v)(?:\?.*)?$/i.test(source)) {
    return `<video src="${escapeHtml(source)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`;
  }
  return `<img src="${escapeHtml(source)}" alt="" loading="lazy">`;
}

function venueSortMonth(publication) {
  const venue = publication.venue || '';
  if (/SIGGRAPH Asia/i.test(venue)) return 12;
  if (/ICCV/i.test(venue)) return 10;
  if (/ECCV/i.test(venue)) return 9;
  if (/SIGGRAPH/i.test(venue)) return 8;
  if (/CVPR/i.test(venue)) return 6;
  if (/ICLR|Computer Graphics Forum/i.test(venue)) return 5;
  if (/CHI/i.test(venue)) return 4;
  if (/Computational Visual Media/i.test(venue)) return 12;
  if (/IEEE TVCG/i.test(venue)) return 6;
  if (/Transactions on Graphics/i.test(venue)) return 7;

  const arxiv = publication.arxiv || '';
  const arxivMonth = Number(arxiv.slice(2, 4));
  return arxivMonth >= 1 && arxivMonth <= 12 ? arxivMonth : 0;
}

function comparePublications(a, b) {
  const aIsPreprint = a.venue === 'Preprint';
  const bIsPreprint = b.venue === 'Preprint';

  return b.year - a.year
    || Number(bIsPreprint) - Number(aIsPreprint)
    || (aIsPreprint && bIsPreprint ? (b.arxiv || '').localeCompare(a.arxiv || '') : 0)
    || venueSortMonth(b) - venueSortMonth(a)
    || (b.arxiv || '').localeCompare(a.arxiv || '')
    || a.title.localeCompare(b.title);
}

function publicationCardPositions() {
  return new Map([...listNode.querySelectorAll('[data-publication-key]')].map((card) => [
    card.dataset.publicationKey,
    card.getBoundingClientRect()
  ]));
}

function animatePublicationCards(previousPositions) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  [...listNode.querySelectorAll('[data-publication-key]')].forEach((card, index) => {
    const previous = previousPositions.get(card.dataset.publicationKey);
    if (previous) {
      const current = card.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (deltaX || deltaY) {
        card.animate(
          [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 480, easing: 'cubic-bezier(.2,.75,.25,1)' }
        );
      }
      return;
    }

    card.animate(
      [
        { opacity: 0, transform: 'translateY(-18px) scale(.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ],
      {
        duration: 420,
        delay: Math.min(index * 24, 180),
        easing: 'cubic-bezier(.2,.75,.25,1)',
        fill: 'backwards'
      }
    );
  });
}

function renderFilters() {
  const years = [...new Set(publications.map((item) => item.year))].sort((a, b) => b - a);
  filtersNode.innerHTML = ['all', ...years].map((year) => {
    const label = year === 'all' ? 'All years' : year;
    return `<button type="button" data-year="${year}" class="${year === selectedYear ? 'active' : ''}">${label}</button>`;
  }).join('');
}

function renderPublications() {
  const query = searchNode.value.trim().toLowerCase();
  const filtered = publications.filter((item) => {
    const matchesYear = selectedYear === 'all' || item.year === Number(selectedYear);
    const matchesPublicationType = showPreprints || item.venue !== 'Preprint';
    const haystack = [item.title, item.venue, item.authorsText || '', ...(item.authors || [])].join(' ').toLowerCase();
    return matchesYear && matchesPublicationType && (!query || haystack.includes(query));
  });

  statusNode.textContent = `${filtered.length} paper${filtered.length === 1 ? '' : 's'}`;
  if (!filtered.length) {
    listNode.innerHTML = '<div class="empty-state"><p>No publications match these filters.</p></div>';
    return;
  }

  const groups = Object.groupBy
    ? Object.groupBy(filtered, ({ year }) => year)
    : filtered.reduce((result, item) => ((result[item.year] ||= []).push(item), result), {});

  listNode.innerHTML = Object.keys(groups).sort((a, b) => b - a).map((year) => `
    <section class="year-group">
      <h2>${year}</h2>
      <div class="paper-grid">${groups[year].map((item) => `
        <article class="paper-card" data-publication-key="${escapeHtml(normalizeTitle(item.title))}">
          <a class="paper-image${usesAuthorThumbnail(item) ? ' paper-image--uncropped' : ''}" href="${escapeHtml(publicationLink(item))}" aria-label="Open ${escapeHtml(item.title)}">
            ${publicationMedia(item)}
          </a>
          <div class="paper-body">
            <p class="paper-venue">${escapeHtml(item.venue || 'Research paper')}</p>
            <h3><a href="${escapeHtml(publicationLink(item))}">${escapeHtml(item.title)}</a></h3>
            ${item.authors?.length ? `<p class="paper-authors">${item.authors.map((author) => author === 'Daniel Cohen-Or' ? `<strong>${author}</strong>` : escapeHtml(author)).join(', ')}</p>` : item.authorsText ? `<p class="paper-authors">${escapeHtml(item.authorsText)}</p>` : ''}
            <div class="paper-links"><a href="${escapeHtml(publicationLink(item))}">Paper ↗</a>${item.project ? `<a href="${escapeHtml(item.project)}">Project ↗</a>` : ''}${item.code ? `<a href="${escapeHtml(item.code)}">Code ↗</a>` : ''}</div>
          </div>
        </article>`).join('')}</div>
    </section>`).join('');
}

filtersNode.addEventListener('click', (event) => {
  const button = event.target.closest('[data-year]');
  if (!button) return;
  selectedYear = button.dataset.year;
  renderFilters();
  renderPublications();
});
searchNode.addEventListener('input', renderPublications);
preprintToggleNode.addEventListener('change', () => {
  const previousPositions = publicationCardPositions();
  showPreprints = preprintToggleNode.checked;
  renderPublications();
  animatePublicationCards(previousPositions);
});

if (Array.isArray(window.PUBLICATIONS)) {
  const metadata = new Map((window.PUBLICATION_METADATA || []).map((item) => [normalizeTitle(item.title), item]));
  const images = new Map((window.PUBLICATION_IMAGES || []).map((item) => [normalizeTitle(item.title), item.image]));
  publications = window.PUBLICATIONS
    .filter((item) => item.type === 'paper')
    .map((item) => {
      const match = metadata.get(normalizeTitle(item.title));
      const enriched = match ? { ...item, authors: match.authors, arxiv: match.arxiv || item.arxiv } : item;
      return { ...enriched, image: images.get(normalizeTitle(item.title)) || item.image };
    })
    .sort(comparePublications);
  renderFilters();
  renderPublications();
} else {
  statusNode.textContent = 'The publication list could not be loaded.';
  listNode.innerHTML = '<div class="empty-state"><p>Publication data is unavailable.</p></div>';
}
