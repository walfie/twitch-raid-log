// This is a script (meant to be used as a bookmarklet) that sorts Twitch's
// "Followed Channels" sidebar so that channels are sorted by when they were
// last raided (channels that have never been raided show up first, followed by
// channels raided long ago).

// Expand to see all online channels
while (document.querySelector('.side-nav-card__avatar--offline') === null) {
  document.querySelector('[data-a-target="side-nav-show-more-button"]').click();
}

fetch('https://walfie.github.io/twitch-raid-log/raids-outgoing.csv')
  .then(resp => resp.text())
  .then(data => {
    const raidsByUser = new Map();
    const lines = data.split('\n').slice(1);
    lines.forEach(line => {
      if (line.length == 0) { return; }
      const [date, _from, to] = line.split(',');
      const existing = raidsByUser.get(to) || { count: 0 };
      raidsByUser.set(to, {
        count: existing.count + 1,
        lastRaided: new Date(date),
      });
    });

    const followed = document.querySelector('[aria-label="Followed Channels"]');

    const now = new Date();
    const elems = [
      ...followed.querySelectorAll('[data-test-selector="side-nav-card"]:not(:has(.side-nav-card__avatar--offline))')
    ].map(elem => {
      const username = elem.querySelector('.tw-link').href.split('/').pop();
      const existing = raidsByUser.get(username);

      if (existing && !elem.querySelector('.js-last-raided')) {
        const { lastRaided, count } = existing;
        const daysAgo = Math.round((now - lastRaided) / (1000 * 3600 * 24))
        const p = document.createElement('p');
        p.className = 'js-last-raided';
        p.innerHTML = `${daysAgo} days ago (${count}x)`;
        elem.querySelector('[data-a-target="side-nav-game-title"]').appendChild(p);
        elem.style.paddingTop = '5px';
        elem.style.paddingBottom = '10px';

        return { lastRaided, elem };
      } else {
        return { lastRaided: new Date(0), elem };
      }
    });

    elems.sort((a, b) => { return a.lastRaided < b.lastRaided ? -1 : 1; });
    elems.forEach(item => followed.appendChild(item.elem));

    // Push offline channels back to the bottom
    const offline = [...document.querySelectorAll('.side-nav-card:has(.side-nav-card__avatar--offline)')]
    offline.forEach(item => followed.appendChild(item))

    // Push the "show more" button back to the bottom.
    followed.appendChild(document.querySelector('.side-nav-show-more-toggle__button'));
  });

