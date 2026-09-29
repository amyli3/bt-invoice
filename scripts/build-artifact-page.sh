#!/usr/bin/env bash
# Assembles one screen's Vite build into a single self-contained HTML page for
# publishing as a Claude artifact.
#
#   ./scripts/build-artifact-page.sh <screen> "<Title>" <out.html>
#
# <screen> matches an artifact-<screen>.html entry. The artifact viewer serves
# the page from its own origin with no sibling files, so the CSS and JS are
# inlined rather than linked, and alert() is shimmed to an in-page toast
# because the viewer frame never shows browser dialogs.
set -euo pipefail

screen="$1"; title="$2"; out="$3"
dist="dist-artifact-${screen}"

ART_SCREEN="$screen" npx vite build --config vite.artifact-screen.config.ts --base=./ >/dev/null

{
  printf '<title>%s</title>\n<style>\n' "$title"
  cat "$dist/app.css"
  cat <<'CSS'

/* ── Artifact host adjustments ───────────────────────────────────────────────
   The prototype runs as a full-window app; here it is one page inside the
   artifact viewer. It keeps its own light palette, so the theme is pinned
   rather than mirrored, and the shell is given the full height it expects. */
:root { color-scheme: light; }
html, body { height: 100%; }
body { background: var(--g100); overflow: auto; }
#root { height: 100%; }
.cpi-shell { min-height: 100%; }
/* A toast stands in for the browser alert the viewer frame never shows. */
#cpi-toast {
  position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(8px);
  max-width: min(520px, calc(100% - 32px)); padding: 12px 16px; border-radius: 8px;
  background: var(--bt-midnight); color: white; font-size: 13px; line-height: 1.4;
  box-shadow: 0 8px 24px rgba(0,0,0,.24); opacity: 0; pointer-events: none;
  transition: opacity .18s, transform .18s; z-index: 9999;
}
#cpi-toast.is-on { opacity: 1; transform: translateX(-50%) translateY(0); }
@media (prefers-reduced-motion: reduce) { #cpi-toast { transition: none; } }
</style>
<div id="root"></div>
<div id="cpi-toast" role="status" aria-live="polite"></div>
<script>
/* The artifact viewer never shows alert(), so the Send invoice confirmation
   is routed to an in-page toast instead of silently doing nothing. */
(function () {
  var el = document.getElementById('cpi-toast');
  var timer;
  window.alert = function (msg) {
    el.textContent = String(msg);
    el.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(function () { el.classList.remove('is-on'); }, 4000);
  };
})();
</script>
<script type="module">
CSS
  cat "$dist/app.js"
  printf '\n</script>\n'
} > "$out"

echo "wrote $out ($(wc -c < "$out") bytes)"
