const homePublicationList = document.querySelector('#home-publications');

function homeEscape(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function homeNormalizeTitle(title = '') {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function homePaperLink(publication) {
  if (publication.arxiv) return `https://arxiv.org/abs/${publication.arxiv}`;
  if (publication.paper) return publication.paper;
  return 'publications.html';
}

function homeMedia(publication) {
  const source = publication.image || 'assets/images/publications/placeholder.png';
  if (/\.(?:mp4|webm|mov|m4v)(?:\?.*)?$/i.test(source)) {
    return `<video src="${homeEscape(source)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`;
  }
  return `<img src="${homeEscape(source)}" alt="" loading="lazy">`;
}

if (homePublicationList && Array.isArray(window.PUBLICATIONS)) {
  const metadata = new Map((window.PUBLICATION_METADATA || []).map((item) => [homeNormalizeTitle(item.title), item]));
  const images = new Map((window.PUBLICATION_IMAGES || []).map((item) => [homeNormalizeTitle(item.title), item.image]));
  const available = window.PUBLICATIONS
    .filter((item) => item.type === 'paper' && item.venue !== 'Preprint' && !item.title.startsWith('Analysis-by-Proxy:'))
    .map((item) => {
      const match = metadata.get(homeNormalizeTitle(item.title));
      return {
        ...item,
        arxiv: match?.arxiv || item.arxiv,
        image: images.get(homeNormalizeTitle(item.title)) || item.image
      };
    })
    .sort((a, b) => b.year - a.year || (b.arxiv || '').localeCompare(a.arxiv || '') || a.title.localeCompare(b.title));
  const selected = available.slice(0, 5);
  const multiActIndex = selected.findIndex((item) => item.title.startsWith('MultiAct:'));
  const abstractionInStyle = available.find((item) => item.title.startsWith('Abstraction in Style'));
  if (multiActIndex >= 0 && abstractionInStyle) selected[multiActIndex] = abstractionInStyle;

  homePublicationList.innerHTML = selected.map((item) => `
    <article class="work-preview-card">
      <a class="work-preview-image" href="${homeEscape(homePaperLink(item))}" aria-label="Open ${homeEscape(item.title)}">
        ${homeMedia(item)}
      </a>
      <p>${homeEscape(item.venue || item.year)}</p>
      <h3><a href="${homeEscape(homePaperLink(item))}">${homeEscape(item.title)}</a></h3>
    </article>
  `).join('');
}
