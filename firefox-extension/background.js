'use strict';

const APP_URL = browser.runtime.getURL('app.html');

// Open the app page when the toolbar button is clicked.
// If the app is already open, focus it instead of opening a duplicate.
browser.browserAction.onClicked.addListener(async () => {
  const [existing] = await browser.tabs.query({ url: APP_URL });
  if (existing) {
    await browser.tabs.update(existing.id, { active: true });
  } else {
    await browser.tabs.create({ url: APP_URL });
  }
});
