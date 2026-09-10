document.querySelectorAll('[data-current-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const siteNavigation = document.querySelector('#site-nav');
if (siteNavigation) {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navigationItems = [
    ['index.html', 'About'],
    ['publications.html', 'Publications'],
    ['team.html', 'Lab']
  ];
  siteNavigation.setAttribute('aria-label', 'Primary navigation');
  siteNavigation.innerHTML = navigationItems.map(([href, label]) =>
    `<a${currentPage === href ? ' class="active"' : ''} href="${href}">${label}</a>`
  ).join('');
}

document.querySelectorAll('.site-footer').forEach((footer) => {
  const copyright = footer.querySelector('p');
  if (!copyright || copyright.querySelector('.site-credit')) return;
  const credit = document.createElement('small');
  credit.className = 'site-credit';
  credit.textContent = 'This website was created and is being maintained by Codex.';
  copyright.append(credit);
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('open', !isOpen);
  });
}
