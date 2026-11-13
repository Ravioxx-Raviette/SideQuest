/*
 * Background scroll lock for pop-ups (modal <dialog>s).
 *
 * A page script can't switch off the browser's own scrollbar: it can always
 * be clicked or dragged. So while a pop-up is open:
 *   - <html> gets overflow: hidden (via .scroll-locked), so the page can't be
 *     scrolled by the wheel, keyboard, touch or the scrollbar at all;
 *   - the real scrollbar disappears, and a look-alike (.fake-scrollbar) is
 *     drawn in exactly the same spot, with the thumb at the same size and
 *     position. It's part of the page, so it can't be clicked or dragged, and
 *     it sits under the pop-up's backdrop, so it gets the same blur and tint;
 *   - the width the real scrollbar used is given back to the page (see the
 *     --locked-sbw rules in styles.css), so nothing shifts sideways.
 * Scrolling inside the pop-up works as normal, and the site's own scrolling
 * (e.g. a link in a pop-up that jumps to the beginner's guide) still works,
 * with the look-alike thumb following along.
 */
(() => {
  "use strict";

  const dialogs = [...document.querySelectorAll("dialog")];
  if (!dialogs.length) return;

  const root = document.documentElement;
  const MIN_THUMB = 24;
  let locked = false;

  const fake = document.createElement("div");
  fake.className = "fake-scrollbar";
  fake.setAttribute("aria-hidden", "true");
  const thumb = document.createElement("div");
  thumb.className = "fake-scrollbar-thumb";
  fake.append(thumb);
  document.body.append(fake);

  const openDialog = () => dialogs.find((dialog) => dialog.open);

  // Place the look-alike thumb where the real one would be.
  function drawThumb() {
    if (!locked) return;
    const track = window.innerHeight;
    const visible = root.clientHeight;
    const total = root.scrollHeight;
    const range = total - visible;
    if (range <= 0) {
      thumb.hidden = true;
      return;
    }
    thumb.hidden = false;
    const length = Math.max(MIN_THUMB, (track * visible) / total);
    const top = ((track - length) * window.scrollY) / range;
    fake.style.setProperty("--thumb-height", `${length}px`);
    fake.style.setProperty("--thumb-top", `${top}px`);
  }

  // Touch scrolling outside the pop-up is cancelled too (older mobile
  // browsers can ignore overflow: hidden for touch).
  function insideScrollableArea(target) {
    const dialog = openDialog();
    return !!dialog && target instanceof Element && dialog.contains(target);
  }
  function onTouchMove(event) {
    if (!insideScrollableArea(event.target)) event.preventDefault();
  }

  function lock() {
    if (locked) return;
    locked = true;
    // Measure exactly how much width the real scrollbar takes by comparing the
    // page's width with and without it (fractional at some zoom levels; 0 for
    // overlay scrollbars, e.g. on phones and macOS, where nothing is replaced).
    const withScrollbar = root.getBoundingClientRect().width;
    root.style.setProperty("--locked-sbw", "0px");
    root.classList.add("scroll-locked");
    const scrollbarWidth = Math.max(0, root.getBoundingClientRect().width - withScrollbar);
    root.style.setProperty("--locked-sbw", `${scrollbarWidth}px`);
    fake.classList.toggle("is-active", scrollbarWidth > 0.5);
    drawThumb();
    window.addEventListener("scroll", drawThumb);
    window.addEventListener("resize", drawThumb);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
  }

  function unlock() {
    if (!locked) return;
    locked = false;
    root.classList.remove("scroll-locked");
    root.style.removeProperty("--locked-sbw");
    fake.classList.remove("is-active");
    window.removeEventListener("scroll", drawThumb);
    window.removeEventListener("resize", drawThumb);
    window.removeEventListener("touchmove", onTouchMove);
  }

  const sync = () => (openDialog() ? lock() : unlock());

  // Lock/unlock right inside showModal()/close(), so code that runs straight
  // after (focusing, scrolling to another view) sees the right state.
  const nativeShowModal = HTMLDialogElement.prototype.showModal;
  const nativeClose = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.showModal = function showModal(...args) {
    const result = nativeShowModal.apply(this, args);
    sync();
    return result;
  };
  HTMLDialogElement.prototype.close = function close(...args) {
    const result = nativeClose.apply(this, args);
    sync();
    return result;
  };
  // Escape and other built-in closes are caught here.
  const observer = new MutationObserver(sync);
  dialogs.forEach((dialog) => observer.observe(dialog, { attributes: true, attributeFilter: ["open"] }));
  sync();
})();
