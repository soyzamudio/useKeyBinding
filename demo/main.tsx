import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useKeyBinding } from "../src/index.js";
import "./style.css";

const example = `import { useState } from "react";
import { useKeyBinding } from "use-key-binding";

export default function App() {
  const [open, setOpen] = useState(false);

  useKeyBinding("cmd", "k", () => {
    setOpen(true);
  });
  useKeyBinding("esc", () => setOpen(false));

  return (
    <>
      <button onClick={() => setOpen(value => !value)}>Toggle menu</button>
      {open && <div>Your commands go here.</div>}
    </>
  );
}`;

function App() {
  const mac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
  const primary = mac ? "⌘" : "Ctrl";
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [allowInInputs, setAllowInInputs] = useState(false);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("Waiting for your first shortcut…");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  function openMenu(fromKeyboard = false) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
    if (fromKeyboard) {
      setCount(value => value + 1);
      setStatus(`${primary} + K received. Callback fired.`);
    } else setStatus("Command menu opened with a click.");
  }

  useKeyBinding("cmd", "k", () => openMenu(true), { enabled: enabled && !open, allowInInputs });
  useKeyBinding("esc", () => setOpen(false), { enabled: open, allowInInputs: true });

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else if (dialog.current?.open) {
      dialog.current.close();
      previousFocus.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyCode() {
    try { await navigator.clipboard.writeText(example); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }

  function choose(action: "guide" | "reset" | "close") {
    setOpen(false);
    if (action === "guide") window.setTimeout(() => {
      document.getElementById("getting-started")?.scrollIntoView({ behavior: "smooth" });
      document.getElementById("guide-title")?.focus({ preventScroll: true });
    }, 0);
    if (action === "reset") { setCount(0); setStatus("Counter reset. Ready for another shortcut."); }
    if (action === "close") setStatus("Menu closed. That’s all there is to it.");
  }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header wrap">
      <a href="#" className="wordmark" aria-label="useKeyBinding home"><span className="brand-icon">⌘</span>useKeyBinding<span className="version">v0.1</span></a>
      <nav aria-label="Main navigation"><a href="https://github.com/soyzamudio/useKeyBinding">GitHub</a><a href="#playground">Playground</a><a href="#getting-started">Get started <span aria-hidden="true">↗</span></a></nav>
    </header>
    <main id="main" className="wrap">
      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow"><span className="status-dot" /> A LITTLE HOOK WITH GOOD KEYS</div>
        <div className="hero-grid">
          <div><h1 id="hero-title">One hook.<br />Every <span>keyboard.</span></h1><p className="hero-description">Keyboard shortcuts that feel at home.<br />Write it once for Mac, Windows, and Linux.</p>
            <div className="hero-actions"><a className="button primary" href="#playground">Give it a press <span aria-hidden="true">↘</span></a><a className="text-link" href="#getting-started">Get started <span aria-hidden="true">→</span></a></div>
          </div>
          <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="art-label top-label">LESS BOILERPLATE</span><div className="key-pair"><div className="big-key modifier-key"><span>command</span>⌘</div><span className="key-plus">+</span><div className="big-key letter-key">K<span>one callback away</span></div></div><span className="art-label bottom-label">MORE COMMAND</span><span className="art-spark">✳</span></div>
        </div>
        <div className="feature-strip"><span><b>01</b> TypeScript included</span><span><b>02</b> React 18+</span><span><b>03</b> No extra runtime dependencies</span><span><b>04</b> MIT licensed</span></div>
      </section>

      <section id="playground" className="playground section" aria-labelledby="playground-title">
        <div className="section-heading"><div><div className="eyebrow">01 / THE PLAYGROUND</div><h2 id="playground-title">Go on. Press the keys.</h2></div><p>A real hook. A real callback.<br />Try it right here in your browser.</p></div>
        <div className="demo-grid">
          <div className="interactive-panel">
            <div className="panel-top"><span className={`live-badge ${enabled ? "" : "paused"}`}><span className="status-dot" />{enabled ? "LISTENING" : "PAUSED"}</span><span className="platform">{mac ? "macOS detected" : /Win/i.test(navigator.platform) ? "Windows detected" : /Linux/i.test(navigator.platform) ? "Linux detected" : "Ctrl shortcut"}</span></div>
            <div className="shortcut-display"><kbd>{primary}</kbd><span>+</span><kbd>K</kbd></div>
            <p className="demo-caption">Your command menu, one shortcut away.</p>
            <button className="button demo-button" onClick={() => openMenu()}>Or open it with a click <span aria-hidden="true">↗</span></button>
            <div className="event-status" role="status"><span className="terminal-arrow">›</span><span>{status}</span><span className="event-count">{String(count).padStart(2, "0")}</span></div>
            <div className="demo-controls"><label className="switch-label"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /><span className="switch" />Enable shortcut</label><label className="switch-label"><input type="checkbox" checked={allowInInputs} onChange={event => setAllowInInputs(event.target.checked)} /><span className="switch" />Allow in inputs</label></div>
            <label className="typing-label" htmlFor="typing-test">Typing stays yours. Try the shortcut in this field.</label><input id="typing-test" className="typing-input" placeholder="Type something here…" autoComplete="off" />
          </div>
          <div className="code-panel"><div className="code-toolbar"><span><span className="file-icon">⌑</span> App.tsx</span><span>REACT</span></div><pre aria-label="Demo implementation"><code><span className="syntax-purple">import</span>{' { useKeyBinding } '}<span className="syntax-purple">from</span>{' '}<span className="syntax-green">{'"use-key-binding"'}</span>{';\n\n'}<span className="syntax-purple">function</span>{' '}<span className="syntax-yellow">App</span>{'() {\n  '}<span className="syntax-yellow">useKeyBinding</span>{'('}<span className="syntax-green">{'"cmd"'}</span>{', '}<span className="syntax-green">{'"k"'}</span>{', () => {\n    '}<span className="syntax-yellow">setOpen</span>{'('}<span className="syntax-orange">true</span>{');\n  });\n\n  '}<span className="syntax-comment">{'// Same shortcut. Every platform.'}</span>{'\n}'}</code></pre><div className="code-note"><span aria-hidden="true">↳</span><p><code>cmd</code> becomes Command on Mac<br />and Ctrl on Windows & Linux.</p></div><div className="platform-chips"><span>⌘ macOS</span><span>Ctrl Windows</span><span>Ctrl Linux</span></div></div>
        </div><p className="small-note">Keep this page focused. Some shortcuts are reserved by your browser or operating system. The button works on touch screens, too.</p>
      </section>

      <section id="getting-started" className="section guide" aria-labelledby="guide-title"><div className="section-heading"><div><div className="eyebrow">02 / GETTING STARTED</div><h2 id="guide-title" tabIndex={-1}>Small API. Short setup.</h2></div><span className="outline-badge">EARLY RELEASE</span></div>
        <div className="guide-grid"><div className="guide-step"><span className="step-number">1</span><h3>Build it locally</h3><p>This project isn’t on npm yet. From a local checkout, build a package, then install the archive in your React app.</p><pre><code>{'npm ci\nnpm pack\n\n# Run from your React app\nnpm install /path/to/use-key-binding-0.1.0.tgz'}</code></pre></div><div className="guide-step"><span className="step-number">2</span><h3>Bind something good</h3><p>Import the hook. Pass your keys, then a callback. Here’s the binding to put inside your component.</p><div className="snippet"><button className="copy-button" onClick={copyCode}>{copied ? "Copied ✓" : "Copy example"}</button><pre><code>{'useKeyBinding("cmd", "k", () => {\n  setOpen(true);\n});'}</code></pre></div><p className="copy-feedback" role="status">{copyError ? "Clipboard unavailable. Select and copy the code above." : copied ? "Copied a complete React example. Make it yours." : "Use with React 18+ and an ESM-compatible bundler."}</p></div></div>
        <div className="api-notes"><div><span aria-hidden="true">⌥</span><h3>Make it your own</h3><p>Add <code>shift</code> or <code>alt</code> to a chord. Use <code>ctrl</code> or <code>meta</code> for literal modifier keys.</p></div><div><span aria-hidden="true">↹</span><h3>Respect the input</h3><p>Inputs are ignored by default. Opt in with <code>{'{ allowInInputs: true }'}</code> when it makes sense.</p></div><div><span aria-hidden="true">↩</span><h3>Leave no listeners behind</h3><p>Automatic cleanup on unmount. Current callbacks. Server rendering support. Just a little less to think about.</p></div></div>
      </section>
    </main>
    <footer className="wrap"><a className="wordmark" href="#"><span className="brand-icon">⌘</span>useKeyBinding</a><span>Small by design. Open source by choice.</span><span>MIT LICENSE <span className="footer-spark" aria-hidden="true">✳</span></span></footer>
    <dialog ref={dialog} aria-labelledby="menu-title" onCancel={event => { event.preventDefault(); setOpen(false); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false); } }}>
      <div className="dialog-header"><div><span className="eyebrow">CALLBACK RECEIVED</span><h2 id="menu-title">At your command.</h2></div><button className="close-button" aria-label="Close command menu" onClick={() => setOpen(false)}>×</button></div><p className="dialog-description">That’s your hook in action. Where to next?</p>
      <div className="menu-actions"><button onClick={() => choose("guide")}><span>Read the getting-started guide</span><span aria-hidden="true">↗</span></button><button onClick={() => choose("reset")}><span>Reset the shortcut counter</span><span aria-hidden="true">↺</span></button><button onClick={() => choose("close")}><span>Back to the playground</span><span aria-hidden="true">↩</span></button></div><div className="dialog-footer"><span>Tab to navigate · Enter to select</span><span><kbd>esc</kbd> to close</span></div>
    </dialog>
  </>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
