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
  
    /**
     * Clamp.
     */
    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }
  
    /**
     * Get client y.
     */
    function getClientY(e) {
      if (e.touches && e.touches.length) return e.touches[0].clientY;
      return e.clientY;
    }
  
    /**
     * Get thumb top.
     */
    function getThumbTop() {
      const tr = thumb.style.transform || "";
      const m = tr.match(/translateY\(([-0-9.]+)px\)/);
      return m ? parseFloat(m[1]) : 0;
    }
  
    /**
     * Set thumb top.
     */
    function setThumbTop(top) {
      thumb.style.transform = "translateY(" + top + "px)";
    }
  
    /**
     * Update thumb from scroll.
     */
    function updateThumbFromScroll() {
      if (maxScrollTop <= 0) {
        setThumbTop(0);
        return;
      }
      const progress = scrollEl.scrollTop / maxScrollTop;
      const top = Math.round(progress * maxThumbTop);
      setThumbTop(top);
    }
  
    /**
     * Update scroll from thumb top.
     */
    function updateScrollFromThumbTop(top) {
      if (maxThumbTop <= 0) return;
      const progress = top / maxThumbTop;
      scrollEl.scrollTop = progress * maxScrollTop;
    }
  
    /**
     * Recalc.
     */
    function recalc() {
      const metrics = getScrollMetrics();
      maxScrollTop = calcMaxScrollTop(metrics);
      if (shouldHideThumb(metrics)) return hideThumb();
      showThumb();
      updateThumbSize(metrics);
      maxThumbTop = calcMaxThumbTop(metrics);
      updateThumbFromScroll();
    }

    /**
     * Get scroll metrics.
     */
    function getScrollMetrics() {
      return {
        trackHeight: track.clientHeight,
        viewHeight: scrollEl.clientHeight,
        contentHeight: scrollEl.scrollHeight,
      };
    }

    /**
     * Calc max scroll top.
     */
    function calcMaxScrollTop(metrics) {
      return Math.max(0, metrics.contentHeight - metrics.viewHeight);
    }

    /**
     * Should hide thumb.
     */
    function shouldHideThumb(metrics) {
      return metrics.trackHeight <= 0 || metrics.contentHeight <= metrics.viewHeight;
    }

    /**
     * Hide thumb.
     */
    function hideThumb() {
      thumb.style.display = "none";
    }

    /**
     * Show thumb.
     */
    function showThumb() {
      thumb.style.display = "block";
    }

    /**
     * Update thumb size.
     */
    function updateThumbSize(metrics) {
      const ratio = metrics.viewHeight / metrics.contentHeight;
      thumbHeight = Math.max(32, Math.round(metrics.trackHeight * ratio));
      thumb.style.height = thumbHeight + "px";
    }

    /**
     * Calc max thumb top.
     */
    function calcMaxThumbTop(metrics) {
      return Math.max(0, metrics.trackHeight - thumbHeight);
    }
  
    /**
     * On down.
     */
    function onDown(e) {
      dragging = true;
      startY = getClientY(e);
      startThumbTop = getThumbTop();
  
      document.documentElement.style.userSelect = "none";
      document.documentElement.style.webkitUserSelect = "none";
      document.body.style.cursor = "grabbing";
  
      e.preventDefault();
    }
  
    /**
     * On move.
     */
    function onMove(e) {
      if (!dragging) return;
  
      const y = getClientY(e);
      const delta = y - startY;
  
      const nextTop = clamp(startThumbTop + delta, 0, maxThumbTop);
      setThumbTop(nextTop);
      updateScrollFromThumbTop(nextTop);
  
      e.preventDefault();
    }
  
    /**
     * On up.
     */
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
