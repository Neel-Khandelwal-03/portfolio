export const THEME_STORAGE_KEY = "portfolio-theme";

/**
 * Applies the stored theme before the browser paints.
 *
 * This runs synchronously in <head>, so the correct background is in place on
 * the very first frame and there is no flash of the wrong theme. It is
 * deliberately tiny and dependency-free; anything larger here would block
 * rendering.
 */
const SCRIPT = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var s=localStorage.getItem(k);
var d=s==="dark"||((!s||s==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);
var e=document.documentElement;
e.classList.toggle("dark",d);
e.style.colorScheme=d?"dark":"light";
}catch(_){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
