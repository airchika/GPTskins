(function () {
  "use strict";

  const queueApi = globalThis.GPTskinsQueue;
  const toggle = document.querySelector("[data-gptskins-queue-enabled]");
  const queueTab = document.querySelector('[data-style-mode="queue"]');
  const status = document.getElementById("status");
  if (!queueApi || !toggle) {
    return;
  }

  chrome.storage.sync.get(queueApi.enabledStorageKey, (result) => {
    toggle.checked = result[queueApi.enabledStorageKey] === true;
  });

  queueTab.addEventListener("click", () => {
    status.textContent = toggle.checked ? "The queue is enabled." : "The queue is off by default.";
  });

  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ [queueApi.enabledStorageKey]: enabled }, () => {
      if (chrome.runtime.lastError) {
        toggle.checked = !enabled;
        status.textContent = "Couldn't save the queue setting. Try again.";
        return;
      }
      status.textContent = enabled
        ? "Queue enabled. Press Enter while ChatGPT is responding."
        : "Queue disabled. Saved messages remain on this device.";
    });
  });
})();
