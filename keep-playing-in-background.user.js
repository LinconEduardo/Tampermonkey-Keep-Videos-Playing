// ==UserScript==
// @name         Keep Instagram/Facebook Videos Playing
// @namespace    local
// @version      2.0
// @description  Prevent videos from pausing when switching tabs or moving the mouse away
// @match        https://www.instagram.com/*
// @match        https://www.facebook.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    // 1. Pretend the tab is always visible and focused
    const fake = (obj, prop, value) => {
        try {
            Object.defineProperty(obj, prop, { get: () => value, configurable: true });
        } catch (e) {}
    };
    fake(Document.prototype, 'hidden', false);
    fake(Document.prototype, 'webkitHidden', false);
    fake(Document.prototype, 'visibilityState', 'visible');
    fake(Document.prototype, 'webkitVisibilityState', 'visible');
    Document.prototype.hasFocus = () => true;

    // 2. Stop the site from receiving tab-switch and focus-loss events
    const block = e => e.stopImmediatePropagation();
    document.addEventListener('visibilitychange', block, true);
    document.addEventListener('webkitvisibilitychange', block, true);
    window.addEventListener('blur', e => {
        if (e.target === window) block(e);
    }, true);

    // 3. Only allow pausing right after a user action (click, key, scroll)
    let lastUserAction = 0;
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type =>
        window.addEventListener(type, () => { lastUserAction = Date.now(); }, true)
    );

    const originalPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () {
        if (Date.now() - lastUserAction < 1000) {
            return originalPause.call(this);
        }
        // Automatic pause triggered by the site: ignored
    };
})();