const selectors = [
  `a[href^="magnet:"]`,
  `a[href$=".torrent"]`,
  `a[href$=".nzb"]`,
];

/**
 * Adds all links matching `selectors` to TorBox
 * @param  {...string} selectors
 */
function add(...selectors) {
  const links = document.querySelectorAll(selectors.join(","));
  links.forEach((link) => {
    const url = new URL(link);
    console.log(url)
    // TODO: Add to TorBox
  });
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: add,
    args : [
      ...selectors,
    ],
  });
});
