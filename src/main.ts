import './style.css';
import { auditForDestination, PROFILES } from './audit';
import { destinationExport, dryRunReport, neutralArchive } from './exporters';
import { parseBookmarkExport } from './parser';
import { clearAudit, loadAudit, saveAudit } from './storage';
import type { AuditResult, DestinationId } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
let sourceContent = '';
let sourceName = '';
let currentAudit: AuditResult | undefined;
let restorableAudit: AuditResult | undefined;
let activeTab: 'summary' | 'records' | 'loss' = 'summary';
let installPrompt: Event & { prompt?: () => Promise<void> } | undefined;
let acceptedUpdate = false;
const demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
const storageNamespace = demoMode ? 'demo' : 'real';
const BUILD_LABEL = 'v1.0.1 · repair-1';

const sample = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Bookmarks</TITLE><H1>Bookmarks</H1><DL><p>
<DT><H3>Research</H3><DL><p>
<DT><A HREF="https://example.com/field-notes#saved" ADD_DATE="1723852800" TAGS="reference,offline">Field notes</A>
<DD>Keep this context during the move.
<DT><A HREF="https://example.com/field-notes">Field notes duplicate</A>
<DT><A HREF="not a url">Broken record</A>
</DL><p><DT><H3>Recipes</H3><DL><p>
<DT><A HREF="https://example.org/soup" ADD_DATE="1704067200">Winter soup</A>
</DL><p></DL><p>`;

function esc(value: unknown): string {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function profileOptions(selected: DestinationId): string {
  return Object.values(PROFILES).map((profile) => `<option value="${profile.id}"${profile.id === selected ? ' selected' : ''}>${profile.label} — ${profile.format}</option>`).join('');
}

function render(): void {
  document.title = demoMode ? 'Demo — Bookmark Escape Hatch' : 'Bookmark Escape Hatch — inspect bookmark exports';
  const socialTitle = demoMode ? 'Demo — Bookmark Escape Hatch' : 'Inspect bookmarks before you move';
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', socialTitle);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', socialTitle);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', demoMode
    ? 'https://bookmark-escape-hatch.sociobot.in/demo'
    : 'https://bookmark-escape-hatch.sociobot.in/');
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', demoMode
    ? 'https://bookmark-escape-hatch.sociobot.in/demo'
    : 'https://bookmark-escape-hatch.sociobot.in/');
  const destination = (document.querySelector<HTMLSelectElement>('#destination')?.value as DestinationId | undefined) ?? currentAudit?.destination ?? 'neutral';
  app.innerHTML = `
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="Bookmark Escape Hatch home">
        <span class="mark" aria-hidden="true"><i></i></span>
        <span>Bookmark<br><b>Escape Hatch</b></span>
      </a>
      <nav class="site-nav" aria-label="Main navigation"><a href="/#workbench">Workbench</a><a href="/demo">Demo</a><a href="/privacy/">Privacy</a></nav>
      <div class="header-status">
        <span class="network-lamp ${navigator.onLine ? 'is-online' : 'is-offline'}" aria-hidden="true"></span>
        <span id="network-label">${navigator.onLine ? 'Local bench ready' : 'Offline mode'}</span>
      </div>
      <button class="text-button install-button" type="button" hidden>Install app</button>
    </header>
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved to your bookmarks</strong><div><button class="text-button reset-demo" type="button">Reset demo</button><button class="secondary-button start-real" type="button">Start for real</button></div></aside>` : ''}
    <main id="main" tabindex="-1">
      <section class="hero" aria-labelledby="page-title">
        <div class="hero-copy">
          <p class="kicker"><span>Portable by proof</span> / Station 01</p>
          <h1 id="page-title">Inspect bookmarks<br><em>before you move.</em></h1>
          <p class="lede">For people with years of bookmarks, this workbench finds migration damage before they change tools.</p>
          <div class="hero-action"><a class="primary-cta" href="/demo#readout">Try it with sample data</a><p>One click opens a completed, isolated inspection.</p></div>
          <ul class="trust-strip" aria-label="Product guarantees">
            <li><span aria-hidden="true">01</span> Stays on device</li>
            <li><span aria-hidden="true">02</span> Works offline</li>
            <li><span aria-hidden="true">03</span> Free to use</li>
          </ul>
        </div>
        <figure class="hero-art">
          <picture>
            <source type="image/avif" srcset="/assets/test-bench-720.avif 720w, /assets/test-bench-1200.avif 1200w" sizes="(max-width: 900px) 90vw, 44vw">
            <img src="/assets/test-bench-720.webp" srcset="/assets/test-bench-720.webp 720w, /assets/test-bench-1200.webp 1200w" sizes="(max-width: 900px) 90vw, 44vw" width="720" height="480" alt="An illustrated 1960s testing console taking in bookmark cards, checking three channels, and producing a verified report" decoding="async" fetchpriority="high">
          </picture>
          <figcaption><span>Fig. 1</span> Intake → normalize → verify → release</figcaption>
        </figure>
      </section>

      <section class="workbench" id="workbench" aria-labelledby="workbench-title">
        <div class="section-heading">
          <div><p class="kicker">Migration test bench / No upload</p><h2 id="workbench-title">Inspect an archive</h2></div>
          <p>HTML · JSON · CSV<br><strong>Maximum 50 MB</strong></p>
        </div>
        <div class="console">
          <div class="controls-panel">
            <div class="stage-label"><span>1</span><div><b>Load source export</b><small>Your original is never changed</small></div></div>
            <label class="drop-zone" for="file-input" id="drop-zone">
              <input id="file-input" type="file" accept=".html,.htm,.json,.csv,text/html,application/json,text/csv" />
              <span class="intake-icon" aria-hidden="true"><i></i><i></i><i></i></span>
              <strong>${sourceName ? esc(sourceName) : 'Choose or drop an export'}</strong>
              <small>${sourceName ? 'Ready to inspect — choose again to replace' : 'Browser HTML, service JSON, or CSV up to 50 MB'}</small>
            </label>
            <details class="paste-panel">
              <summary>Or paste export text</summary>
              <label for="paste-input">Export contents</label>
              <textarea id="paste-input" rows="6" spellcheck="false" placeholder="Paste HTML, JSON, or CSV here">${sourceName === 'pasted-export.txt' ? esc(sourceContent) : ''}</textarea>
              <button class="secondary-button paste-button" type="button" aria-label="Use pasted export text">Use pasted text</button>
            </details>
            <button class="sample-button" type="button">${demoMode ? 'Reset the sample inspection' : 'Try the sample in demo mode'}</button>

            <div class="panel-rule" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="stage-label"><span>2</span><div><b>Set destination</b><small>Changes what the dry run checks</small></div></div>
            <label class="select-label" for="destination">Destination profile</label>
            <div class="select-wrap"><select id="destination">${profileOptions(destination)}</select></div>
            <p class="profile-description" id="profile-description">${esc(PROFILES[destination].description)}</p>

            <button class="primary-button inspect-button" type="button" ${sourceContent ? '' : 'disabled'}>
              <span>Run inspection</span><span aria-hidden="true">→</span>
            </button>
            <p class="privacy-note"><span aria-hidden="true">●</span> Parsing happens on this device. Bookmark URLs are never requested.</p>
          </div>
          <div class="readout-panel" id="readout">${renderReadout()}</div>
        </div>
      </section>

      <section class="method" aria-labelledby="method-title">
        <div><p class="kicker">Calibration sequence</p><h2 id="method-title">A receipt for your migration.</h2></div>
        <ol>
          <li><span>01</span><h3>Normalize, gently</h3><p>Standardize URLs, dates, tags, folders, and notes without deleting source-specific fields.</p></li>
          <li><span>02</span><h3>Expose the damage</h3><p>Separate malformed records and exact duplicates. Nothing quietly disappears.</p></li>
          <li><span>03</span><h3>Test the fit</h3><p>Compare every populated field with your destination’s documented format.</p></li>
          <li><span>04</span><h3>Leave with evidence</h3><p>Download a neutral archive, destination file, and machine-readable dry-run report.</p></li>
        </ol>
      </section>
    </main>
    <footer class="site-footer">
      <div><b>Bookmark Escape Hatch</b><p>Inspect bookmark exports before changing tools.</p><p>Built by Param Factory · ${BUILD_LABEL}</p></div>
      <nav aria-label="Footer navigation"><a href="/demo">Demo</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-bookmark-escape-hatch" rel="external">Source</a></nav>
      <p class="asset-credit">Instrument illustration generated for this product with the factory image model.</p>
    </footer>
    <div class="toast" role="status" aria-live="polite" aria-atomic="true" id="toast"></div>
    <div class="update-toast" role="status" hidden><span>An app update is ready.</span><button type="button">Apply update</button></div>
  `;
  bindEvents();
}

function renderReadout(): string {
  if (!currentAudit) {
    if (restorableAudit) return `
      <div class="restore-state">
        <div class="dial" aria-hidden="true"><i></i></div>
        <p class="readout-label">Previous reading found</p>
        <h3>${esc(restorableAudit.fileName)}</h3>
        <p>${restorableAudit.records.length} portable links · inspected ${esc(dateLabel(restorableAudit.importedAt))}</p>
        <button class="secondary-button restore-button" type="button">Restore inspection</button>
        <button class="text-button clear-button" type="button">Clear saved inspection</button>
      </div>`;
    return `
      <div class="empty-state">
        <div class="scope" aria-hidden="true"><i></i><i></i><i></i></div>
        <p class="readout-label">Awaiting source</p>
        <h3>No reading yet</h3>
        <p>Load an export and run the inspection. Valid links, duplicates, damage, and field loss will register here.</p>
        <div class="empty-scale" aria-hidden="true">0<span></span><span></span><span></span><span></span>100</div>
      </div>`;
  }
  const audit = currentAudit;
  const validInput = audit.records.length + audit.duplicates.length;
  const readiness = audit.inputCount ? Math.round((audit.records.length / audit.inputCount) * 100) : 0;
  const tab = (id: typeof activeTab, label: string, count?: number) => `<button role="tab" id="tab-${id}" aria-selected="${activeTab === id}" aria-controls="panel-${id}" tabindex="${activeTab === id ? '0' : '-1'}" data-tab="${id}">${label}${count !== undefined ? ` <span>${count}</span>` : ''}</button>`;
  return `
    <div class="report-head">
      <div><p class="readout-label">Inspection complete</p><h3>${esc(audit.fileName)}</h3><p>${esc(audit.format.toUpperCase())} → ${esc(audit.destinationLabel)}</p></div>
      <div class="readiness" aria-label="${readiness}% of input records ready for export"><strong>${readiness}</strong><span>%<br>ready</span></div>
    </div>
    <dl class="meters">
      <div class="good"><dt>Portable</dt><dd>${audit.records.length}<small>unique records</small></dd></div>
      <div class="neutral"><dt>Valid input</dt><dd>${validInput}<small>before dedupe</small></dd></div>
      <div class="warning"><dt>Duplicates</dt><dd>${audit.duplicates.length}<small>excluded, listed</small></dd></div>
      <div class="danger"><dt>Malformed</dt><dd>${audit.invalid.length}<small>excluded, listed</small></dd></div>
    </dl>
    <div class="report-tabs" role="tablist" aria-label="Inspection report">
      ${tab('summary', 'Summary')}${tab('records', 'Records', audit.inputCount)}${tab('loss', 'Field loss', audit.loss.length)}
    </div>
    <div class="tab-panel" role="tabpanel" id="panel-${activeTab}" aria-labelledby="tab-${activeTab}">${renderTab(audit)}</div>
    <div class="downloads" aria-label="Archive downloads">
      <p><b>Release files</b><span>Generated from this inspected snapshot</span></p>
      <button class="download-button destination-download" type="button"><span>Destination file</span><small>${esc(PROFILES[audit.destination].format)}</small></button>
      <button class="download-button neutral-download" type="button"><span>Neutral archive</span><small>Portable JSON · all fields</small></button>
      <button class="download-button report-download" type="button"><span>Dry-run report</span><small>JSON · warnings + evidence</small></button>
      <button class="text-button clear-button" type="button">Clear saved inspection</button>
    </div>`;
}

function renderTab(audit: AuditResult): string {
  if (activeTab === 'summary') {
    const verdict = audit.invalid.length ? 'Ready with repairs' : audit.loss.length ? 'Ready with field loss' : 'Ready to move';
    return `<div class="verdict"><span class="verdict-lamp ${audit.invalid.length ? 'amber' : 'green'}" aria-hidden="true"></span><div><b>${verdict}</b><p>${audit.records.length} unique link${audit.records.length === 1 ? '' : 's'} can be exported. ${audit.invalid.length ? `${audit.invalid.length} malformed ${audit.invalid.length === 1 ? 'record was' : 'records were'} held back.` : 'No malformed records were found.'}</p></div></div>
      <dl class="summary-list">
        <div><dt>Source format</dt><dd>${esc(audit.format.toUpperCase())}</dd></div>
        <div><dt>Destination</dt><dd>${esc(audit.destinationLabel)}</dd></div>
        <div><dt>Unsupported populated fields</dt><dd>${audit.loss.length}</dd></div>
        <div><dt>Inspected locally</dt><dd>${esc(dateLabel(audit.importedAt))}</dd></div>
      </dl>
      <p class="report-note">Keep your original export. Test a small import before removing anything from the source service.</p>`;
  }
  if (activeTab === 'loss') {
    if (!audit.loss.length) return `<div class="all-clear"><b>All populated fields fit this profile.</b><p>The neutral archive still preserves provenance and vendor-specific details.</p></div>`;
    return `<ul class="loss-list">${audit.loss.map((item) => `<li><div><b>${esc(item.label)}</b><span>${item.count} record${item.count === 1 ? '' : 's'}</span></div><p>${esc(item.handling)}</p>${item.examples.length ? `<small>Examples: ${item.examples.map(esc).join(', ')}</small>` : ''}</li>`).join('')}</ul>`;
  }
  const good = audit.records.slice(0, 100).map((record) => `<tr><td><span class="row-status good-dot" aria-label="Portable">✓</span></td><td><b>${esc(record.title)}</b><small>${esc(record.url)}</small></td><td>${esc(record.folder || '—')}</td></tr>`).join('');
  const duplicate = audit.duplicates.slice(0, 100).map(({ record }) => `<tr><td><span class="row-status duplicate-dot" aria-label="Duplicate">=</span></td><td><b>${esc(record.title)}</b><small>${esc(record.url)}</small></td><td>Duplicate</td></tr>`).join('');
  const invalid = audit.invalid.slice(0, 100).map((record) => `<tr><td><span class="row-status invalid-dot" aria-label="Malformed">!</span></td><td><b>${esc(record.title)}</b><small>${esc(record.rawUrl || 'No URL')}</small></td><td>${esc(record.reason)}</td></tr>`).join('');
  return `<div class="table-wrap"><table><caption>First 100 records per status</caption><thead><tr><th>Status</th><th>Bookmark</th><th>Folder / finding</th></tr></thead><tbody>${good}${duplicate}${invalid}</tbody></table></div>`;
}

function bindEvents(): void {
  const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
  fileInput.addEventListener('change', async () => { if (fileInput.files?.[0]) await acceptFile(fileInput.files[0]); });
  const drop = document.querySelector<HTMLElement>('#drop-zone')!;
  ['dragenter', 'dragover'].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove('dragging'); }));
  drop.addEventListener('drop', async (event) => { const file = (event as DragEvent).dataTransfer?.files[0]; if (file) await acceptFile(file); });
  document.querySelector('.paste-button')?.addEventListener('click', () => {
    const value = document.querySelector<HTMLTextAreaElement>('#paste-input')!.value;
    if (!value.trim()) return showError('Paste some HTML, JSON, or CSV export text first.');
    sourceContent = value; sourceName = 'pasted-export.txt'; currentAudit = undefined; render();
  });
  document.querySelector('.sample-button')?.addEventListener('click', () => {
    if (!demoMode) { location.assign('/demo#readout'); return; }
    void resetDemo();
  });
  document.querySelector('.reset-demo')?.addEventListener('click', () => { void resetDemo(); });
  document.querySelector('.start-real')?.addEventListener('click', async () => {
    await clearAudit('demo');
    location.assign('/#workbench');
  });
  document.querySelector<HTMLSelectElement>('#destination')?.addEventListener('change', (event) => {
    const selected = (event.currentTarget as HTMLSelectElement).value as DestinationId;
    const description = document.querySelector('#profile-description'); if (description) description.textContent = PROFILES[selected].description;
  });
  document.querySelector('.inspect-button')?.addEventListener('click', inspect);
  document.querySelector('.restore-button')?.addEventListener('click', () => { currentAudit = restorableAudit; restorableAudit = undefined; activeTab = 'summary'; render(); announce('Previous inspection restored.'); });
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => { activeTab = button.dataset.tab as typeof activeTab; render(); document.querySelector<HTMLButtonElement>(`#tab-${activeTab}`)?.focus(); });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const tabs: typeof activeTab[] = ['summary', 'records', 'loss'];
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      activeTab = tabs[(tabs.indexOf(activeTab) + offset + tabs.length) % tabs.length]; render(); document.querySelector<HTMLButtonElement>(`#tab-${activeTab}`)?.focus();
    });
  });
  document.querySelector('.destination-download')?.addEventListener('click', () => { if (!currentAudit) return; const file = destinationExport(currentAudit); download(file.content, `escape-hatch-${currentAudit.destination}.${file.extension}`, file.mime); });
  document.querySelector('.neutral-download')?.addEventListener('click', () => { if (currentAudit) download(neutralArchive(currentAudit), 'escape-hatch-neutral-archive.json', 'application/json'); });
  document.querySelector('.report-download')?.addEventListener('click', () => { if (currentAudit) download(dryRunReport(currentAudit), `escape-hatch-${currentAudit.destination}-dry-run.json`, 'application/json'); });
  document.querySelectorAll('.clear-button').forEach((button) => button.addEventListener('click', async () => { await clearAudit(storageNamespace); currentAudit = undefined; restorableAudit = undefined; sourceContent = ''; sourceName = ''; render(); announce(demoMode ? 'Demo inspection cleared.' : 'Saved inspection cleared.'); }));
  const install = document.querySelector<HTMLButtonElement>('.install-button');
  if (install && installPrompt) { install.hidden = false; install.addEventListener('click', async () => { await installPrompt?.prompt?.(); installPrompt = undefined; install.hidden = true; }); }
}

async function acceptFile(file: File): Promise<void> {
  if (file.size > 50 * 1024 * 1024) return showError('That file is over 50 MB. Split the export or choose a smaller file, then retry.');
  sourceName = file.name;
  sourceContent = await file.text();
  currentAudit = undefined;
  render();
  announce(`${file.name} loaded. Run the inspection when ready.`);
}

async function inspect(): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>('.inspect-button')!;
  button.disabled = true; button.querySelector('span')!.textContent = 'Calibrating…';
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  try {
    const parsed = parseBookmarkExport(sourceContent, sourceName);
    const destination = document.querySelector<HTMLSelectElement>('#destination')!.value as DestinationId;
    currentAudit = auditForDestination(parsed, destination);
    activeTab = 'summary';
    await saveAudit(currentAudit, storageNamespace);
    render();
    document.querySelector('#readout')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    announce(`Inspection complete. ${currentAudit.records.length} unique bookmarks are ready.`);
  } catch (error) {
    button.disabled = false; button.querySelector('span')!.textContent = 'Run inspection';
    showError(error instanceof Error ? error.message : 'The export could not be inspected.');
  }
}

function showError(message: string): void {
  const panel = document.querySelector('#readout');
  if (!panel) return;
  panel.innerHTML = `<div class="error-state" tabindex="-1"><span aria-hidden="true">!</span><p class="readout-label">Intake stopped</p><h3>We could not read that export</h3><p>${esc(message)}</p><p>Keep the original file, check its format, and try again.</p></div>`;
  panel.querySelector<HTMLElement>('.error-state')?.focus();
  announce(message);
}

function announce(message: string): void {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = message; toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 3500);
}

function download(content: string, name: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(`${name} downloaded.`);
}

window.addEventListener('online', render);
window.addEventListener('offline', render);
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event as typeof installPrompt; render(); });

async function start(): Promise<void> {
  if (demoMode) {
    sourceContent = sample;
    sourceName = 'sample-bookmarks.html';
    currentAudit = auditForDestination(parseBookmarkExport(sourceContent, sourceName), 'neutral');
    try { await saveAudit(currentAudit, 'demo'); } catch { /* Demo still works when IndexedDB is unavailable. */ }
  } else try { restorableAudit = await loadAudit('real'); } catch { /* Private browsing may deny IndexedDB. The tool still works. */ }
  render();
  if (demoMode) requestAnimationFrame(() => document.querySelector('#readout')?.scrollIntoView({ block: 'start' }));
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const showUpdate = (worker: ServiceWorker): void => {
        const toast = document.querySelector<HTMLElement>('.update-toast');
        if (!toast) return;
        toast.hidden = false;
        toast.querySelector('button')?.addEventListener('click', () => {
          acceptedUpdate = true;
          const button = toast.querySelector<HTMLButtonElement>('button');
          if (button) { button.disabled = true; button.textContent = 'Updating…'; }
          worker.postMessage('SKIP_WAITING');
        }, { once: true });
      };
      if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (acceptedUpdate) window.location.reload(); });
    } catch { /* Offline fallback remains available when registration is unsupported. */ }
  }
}

async function resetDemo(): Promise<void> {
  await clearAudit('demo');
  sourceContent = sample;
  sourceName = 'sample-bookmarks.html';
  currentAudit = auditForDestination(parseBookmarkExport(sourceContent, sourceName), 'neutral');
  activeTab = 'summary';
  await saveAudit(currentAudit, 'demo');
  render();
  document.querySelector('#readout')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  announce('Demo reset to the original sample.');
}

start();
