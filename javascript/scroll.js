(function () {
    const scrollEl = document.getElementById("contactsScroll");
    const thumb = document.getElementById("contactsThumb");
    const track = thumb ? thumb.parentElement : null;
  
    if (!scrollEl || !thumb || !track) return;
  
    let dragging = false;
    let startY = 0;
    let startThumbTop = 0;
    let maxThumbTop = 0;
    let maxScrollTop = 0;
    let thumbHeight = 0;
  
    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }
  
    function getClientY(e) {
      if (e.touches && e.touches.length) return e.touches[0].clientY;
      return e.clientY;
    }
  
    function getThumbTop() {
      const tr = thumb.style.transform || "";
      const m = tr.match(/translateY\(([-0-9.]+)px\)/);
      return m ? parseFloat(m[1]) : 0;
    }
  
    function setThumbTop(top) {
      thumb.style.transform = "translateY(" + top + "px)";
    }
  
    function updateThumbFromScroll() {
      if (maxScrollTop <= 0) {
        setThumbTop(0);
        return;
      }
      const progress = scrollEl.scrollTop / maxScrollTop;
      const top = Math.round(progress * maxThumbTop);
      setThumbTop(top);
    }
  
    function updateScrollFromThumbTop(top) {
      if (maxThumbTop <= 0) return;
      const progress = top / maxThumbTop;
      scrollEl.scrollTop = progress * maxScrollTop;
    }
  
    function recalc() {
      const trackHeight = track.clientHeight;
      const viewHeight = scrollEl.clientHeight;
      const contentHeight = scrollEl.scrollHeight;
  
      maxScrollTop = Math.max(0, contentHeight - viewHeight);
  
      if (trackHeight <= 0 || contentHeight <= viewHeight) {
        thumb.style.display = "none";
        return;
      }
  
      thumb.style.display = "block";
  
      const ratio = viewHeight / contentHeight;
      thumbHeight = Math.max(32, Math.round(trackHeight * ratio));
      thumb.style.height = thumbHeight + "px";
  
      maxThumbTop = Math.max(0, trackHeight - thumbHeight);
  
      updateThumbFromScroll();
    }
  
    function onDown(e) {
      dragging = true;
      startY = getClientY(e);
      startThumbTop = getThumbTop();
  
      document.documentElement.style.userSelect = "none";
      document.documentElement.style.webkitUserSelect = "none";
      document.body.style.cursor = "grabbing";
  
      e.preventDefault();
    }
  
    function onMove(e) {
      if (!dragging) return;
  
      const y = getClientY(e);
      const delta = y - startY;
  
      const nextTop = clamp(startThumbTop + delta, 0, maxThumbTop);
      setThumbTop(nextTop);
      updateScrollFromThumbTop(nextTop);
  
      e.preventDefault();
    }
  
    function onUp() {
      dragging = false;
      document.documentElement.style.userSelect = "";
      document.documentElement.style.webkitUserSelect = "";
      document.body.style.cursor = "";
    }
  
    thumb.addEventListener("mousedown", onDown);
    thumb.addEventListener("touchstart", onDown, { passive: false });
  
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
  
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);
  
    scrollEl.addEventListener("scroll", updateThumbFromScroll);
    window.addEventListener("resize", () => requestAnimationFrame(recalc));
  
    const ro = new ResizeObserver(() => requestAnimationFrame(recalc));
    ro.observe(scrollEl);
    ro.observe(track);
  
    const mo = new MutationObserver(() => requestAnimationFrame(recalc));
    mo.observe(scrollEl, { childList: true, subtree: true });
  
    window.recalcContactsScrollbar = function () {
      requestAnimationFrame(recalc);
    };
  
    requestAnimationFrame(recalc);
    setTimeout(recalc, 150);
  })();