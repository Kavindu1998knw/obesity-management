import html2pdf from 'html2pdf.js';

// --- Mathematical Color Converter (oklab / oklch / color-mix to sRGB) ---

function oklabToSrgb(L, a, b) {
  const l_ = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m_ = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s_ = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);

  const r_lin = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g_lin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const b_lin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  const toSrgb = (x) => {
    const clamped = Math.max(0, Math.min(1, x));
    const gamma = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(255, gamma * 255)));
  };

  return {
    r: toSrgb(r_lin),
    g: toSrgb(g_lin),
    b: toSrgb(b_lin)
  };
}

function parseNumberOrPercent(val, maxVal = 1) {
  if (!val) return 0;
  val = val.trim();
  if (val.endsWith('%')) {
    return (parseFloat(val) / 100) * maxVal;
  }
  return parseFloat(val);
}

function parseHue(val) {
  if (!val) return 0;
  val = val.trim().toLowerCase();
  if (val.endsWith('deg')) return parseFloat(val);
  if (val.endsWith('rad')) return (parseFloat(val) * 180) / Math.PI;
  if (val.endsWith('turn')) return parseFloat(val) * 360;
  return parseFloat(val) || 0;
}

function convertOklchStrToRgb(str) {
  const match = str.match(/oklch\s*\(\s*([^/)]+)(?:\s*\/\s*([^)]+))?\)/i);
  if (!match) return null;

  const parts = match[1].trim().split(/[\s,]+/);
  if (parts.length < 3) return null;

  const L = parseNumberOrPercent(parts[0], 1);
  const C = parseNumberOrPercent(parts[1], 1);
  const H = parseHue(parts[2]);
  const alpha = match[2] ? parseNumberOrPercent(match[2], 1) : 1;

  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const { r, g, b: b_ } = oklabToSrgb(L, a, b);
  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b_}, ${alpha.toFixed(2)})`;
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b_.toString(16).padStart(2, '0')}`;
}

function convertOklabStrToRgb(str) {
  const match = str.match(/oklab\s*\(\s*([^/)]+)(?:\s*\/\s*([^)]+))?\)/i);
  if (!match) return null;

  const parts = match[1].trim().split(/[\s,]+/);
  if (parts.length < 3) return null;

  const L = parseNumberOrPercent(parts[0], 1);
  const a = parseNumberOrPercent(parts[1], 1);
  const b = parseNumberOrPercent(parts[2], 1);
  const alpha = match[2] ? parseNumberOrPercent(match[2], 1) : 1;

  const { r, g, b: b_ } = oklabToSrgb(L, a, b);
  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b_}, ${alpha.toFixed(2)})`;
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b_.toString(16).padStart(2, '0')}`;
}

let tempCtx = null;
export const convertColorToRgb = (colorStr) => {
  if (!colorStr) return '#475569';
  const trimmed = colorStr.trim().toLowerCase();

  // 1. Try mathematical conversion for oklch
  if (trimmed.startsWith('oklch')) {
    const res = convertOklchStrToRgb(colorStr);
    if (res) return res;
  }

  // 2. Try mathematical conversion for oklab
  if (trimmed.startsWith('oklab')) {
    const res = convertOklabStrToRgb(colorStr);
    if (res) return res;
  }

  // 3. If color-mix contains transparent or slate, handle safely for light backgrounds
  if (trimmed.startsWith('color-mix')) {
    if (trimmed.includes('slate-50') || trimmed.includes('0.98') || trimmed.includes('0.97')) {
      const matchPercent = trimmed.match(/(\d+(?:\.\d+)?)\s*%/);
      const pct = matchPercent ? parseFloat(matchPercent[1]) / 100 : 0.8;
      return `rgba(248, 250, 252, ${pct.toFixed(2)})`;
    }
    if (trimmed.includes('teal')) {
      const matchPercent = trimmed.match(/(\d+(?:\.\d+)?)\s*%/);
      const pct = matchPercent ? parseFloat(matchPercent[1]) / 100 : 0.1;
      return `rgba(13, 148, 136, ${pct.toFixed(2)})`;
    }
    if (trimmed.includes('transparent')) {
      const matchPercent = trimmed.match(/(\d+(?:\.\d+)?)\s*%/);
      const pct = matchPercent ? parseFloat(matchPercent[1]) / 100 : 0.5;
      return `rgba(241, 245, 249, ${pct.toFixed(2)})`;
    }
    return '#f8fafc';
  }

  // 4. Try browser canvas context if available
  if (typeof document !== 'undefined') {
    try {
      if (!tempCtx) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        tempCtx = canvas.getContext('2d', { willReadFrequently: true });
      }
      if (tempCtx) {
        tempCtx.fillStyle = '#000000';
        tempCtx.fillStyle = colorStr;
        const computed = tempCtx.fillStyle;
        if (
          computed &&
          !computed.includes('oklab') &&
          !computed.includes('oklch') &&
          !computed.includes('color-mix') &&
          !computed.includes('light-dark')
        ) {
          return computed;
        }
      }
    } catch (e) {}
  }

  // 5. Smart fallback based on lightness if present
  const numMatch = colorStr.match(/(?:oklch|oklab)\s*\(\s*([0-9.]+%?)/i);
  if (numMatch) {
    const lVal = parseNumberOrPercent(numMatch[1], 1);
    if (lVal > 0.7) return '#f8fafc'; // light background
    if (lVal < 0.4) return '#0f172a'; // dark text
  }

  return '#f8fafc';
};

/**
 * Strips/converts modern color functions (oklab, oklch, color-mix, lab, lch, hwb, color, light-dark)
 * from CSS text so html2canvas color parser doesn't crash.
 */
export const sanitizeCssColors = (cssText) => {
  if (!cssText || typeof cssText !== 'string') return cssText;

  const unsupportedFuncs = ['oklab', 'oklch', 'color-mix', 'lab', 'lch', 'hwb', 'color', 'light-dark'];
  const funcPattern = new RegExp(`\\b(${unsupportedFuncs.join('|')})\\s*\\(`, 'gi');

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = funcPattern.exec(cssText)) !== null) {
    result += cssText.slice(lastIndex, match.index);
    let openCount = 1;
    let i = match.index + match[0].length;

    while (i < cssText.length && openCount > 0) {
      if (cssText[i] === '(') {
        openCount++;
      } else if (cssText[i] === ')') {
        openCount--;
      }
      i++;
    }

    const originalColorExpr = cssText.slice(match.index, i);
    const safeColor = convertColorToRgb(originalColorExpr);
    result += safeColor;

    lastIndex = i;
    funcPattern.lastIndex = i;
  }

  result += cssText.slice(lastIndex);

  // Safety net fallback for any residual modern color functions
  return result
    .replace(/oklab\([^)]*\)/gi, '#475569')
    .replace(/oklch\([^)]*\)/gi, '#475569')
    .replace(/color-mix\([^)]*\)/gi, '#475569')
    .replace(/light-dark\([^)]*\)/gi, '#475569')
    .replace(/color\(srgb[^)]*\)/gi, '#475569');
};

/**
 * Universal PDF Exporter that safely handles Tailwind v4 / modern color formats
 * by stripping unsupported CSS functions before html2canvas parses the DOM.
 */
export const exportToPdf = async (elementOrId, options = {}) => {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) {
    throw new Error('Export element not found in DOM');
  }

  const opt = {
    margin: options.margin !== undefined ? options.margin : [0.4, 0.4, 0.4, 0.4],
    filename: options.filename || 'report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.meal-card', '.avoid-break', '.print-avoid-break', '.meal-section', 'tr', '.summary-card', '.avoid-page-break'],
      ...(options.pagebreak || {})
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        try {
          // Remove dark mode class for crystal-clear light PDF export
          if (clonedDoc.body) {
            clonedDoc.body.classList.remove('dark');
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#1e293b';
          }

          // 1. Sanitize all <style> tags in cloned document
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((tag) => {
            if (tag.textContent) {
              tag.textContent = sanitizeCssColors(tag.textContent);
            }
          });

          // 2. Inline and sanitize any <link rel="stylesheet"> if possible
          const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          linkTags.forEach((link) => {
            try {
              const matchingSheet = Array.from(document.styleSheets).find((s) => s.href === link.href);
              if (matchingSheet) {
                let rulesText = '';
                try {
                  const rules = matchingSheet.cssRules || matchingSheet.rules;
                  if (rules) {
                    for (let r = 0; r < rules.length; r++) {
                      rulesText += rules[r].cssText + '\n';
                    }
                  }
                } catch (e) {
                  // cross-origin restriction
                }
                if (rulesText) {
                  const styleTag = clonedDoc.createElement('style');
                  styleTag.textContent = sanitizeCssColors(rulesText);
                  link.parentNode.replaceChild(styleTag, link);
                }
              }
            } catch (e) {
              console.warn('PDF exporter stylesheet link warning:', e);
            }
          });

          // 3. Sanitize inline style attributes on all cloned elements
          const styledElements = clonedDoc.querySelectorAll('[style]');
          styledElements.forEach((el) => {
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle) {
              el.setAttribute('style', sanitizeCssColors(inlineStyle));
            }
          });

          // 4. Sanitize SVG attributes
          const svgElements = clonedDoc.querySelectorAll('[fill], [stroke], [stop-color]');
          svgElements.forEach((el) => {
            ['fill', 'stroke', 'stop-color'].forEach((attr) => {
              const val = el.getAttribute(attr);
              if (
                val &&
                (val.includes('oklab') ||
                  val.includes('oklch') ||
                  val.includes('color-mix') ||
                  val.includes('light-dark') ||
                  val.includes('color('))
              ) {
                el.setAttribute(attr, sanitizeCssColors(val));
              }
            });
          });

          // 5. Inject high-contrast, clean PDF printing styles for tables, headers, and page-breaks
          const exportHelperStyle = clonedDoc.createElement('style');
          exportHelperStyle.textContent = `
            body, html {
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
              -webkit-font-smoothing: antialiased !important;
              text-rendering: geometricPrecision !important;
            }

            *, *:before, *:after {
              -webkit-font-smoothing: antialiased !important;
              text-rendering: geometricPrecision !important;
              box-sizing: border-box !important;
            }

            /* Prevent vertical/horizontal font clipping in canvas */
            h1, h2, h3, h4, h5, h6, p, span, div, b, strong, td, th {
              overflow: visible !important;
              line-height: 1.35 !important;
            }

            .truncate {
              overflow: visible !important;
              white-space: normal !important;
              text-overflow: unset !important;
            }

            /* High contrast clean card backgrounds */
            .bg-slate-50, [class*="bg-slate-50"] {
              background-color: #f8fafc !important;
              border-color: #e2e8f0 !important;
            }

            .bg-teal-50, [class*="bg-teal-50"] {
              background-color: #f0fdfa !important;
            }

            .bg-white {
              background-color: #ffffff !important;
            }

            .text-slate-900, .text-slate-800 {
              color: #0f172a !important;
            }

            .text-teal-700, .text-teal-800, .text-teal-900 {
              color: #0f766e !important;
            }

            .text-slate-500, .text-slate-600 {
              color: #475569 !important;
            }

            .text-slate-400 {
              color: #64748b !important;
            }

            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            th {
              background-color: #f1f5f9 !important;
              color: #1e293b !important;
              font-weight: 700 !important;
              border-bottom: 2px solid #cbd5e1 !important;
              padding: 10px 12px !important;
              text-align: left !important;
            }
            td {
              padding: 10px 12px !important;
              border-bottom: 1px solid #e2e8f0 !important;
              color: #334155 !important;
            }
            tr:nth-child(even) {
              background-color: #f8fafc !important;
            }
            h1, h2, h3, h4, h5, h6 {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }

            /* Indivisible cards that must never be sliced across page breaks */
            .meal-card, .avoid-break, .print-avoid-break, .avoid-page-break, .meal-section, tr, .summary-card {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              display: block !important;
              margin-bottom: 24px !important;
            }
            .page-break-before {
              break-before: page !important;
              page-break-before: always !important;
            }
            .page-break-after {
              break-after: page !important;
              page-break-after: always !important;
            }
          `;
          clonedDoc.head.appendChild(exportHelperStyle);

          // 6. Call user custom onclone if provided
          if (options.html2canvas && typeof options.html2canvas.onclone === 'function') {
            options.html2canvas.onclone(clonedDoc, clonedElement);
          }
        } catch (e) {
          console.warn('PDF exporter onclone warning:', e);
        }
      },
      ...(options.html2canvas || {})
    },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: 'portrait',
      ...(options.jsPDF || {})
    }
  };

  return html2pdf().set(opt).from(element).save();
};

export default exportToPdf;
