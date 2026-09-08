import { StrictMode, useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { useKeyBinding } from "../src/index.js";
import { getDemoBinding } from "./binding.js";
import "./style.css";

const createExample = (binding: string) => `import { useState, type FormEvent } from "react";
import { useKeyBinding } from "use-key-binding";

export default function App() {
  const [open, setOpen] = useState(false);

  ${binding}
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
  const [draftModifier, setDraftModifier] = useState("cmd");
  const [draftKey, setDraftKey] = useState("k");
  const [draftShift, setDraftShift] = useState(false);
  const [draftAlt, setDraftAlt] = useState(false);
  const [keys, setKeys] = useState(["cmd", "k"]);
  const [bindingError, setBindingError] = useState("");
  const shortcutDisplay = useRef<HTMLDivElement>(null);
  const keyLabels: Record<string, string> = { cmd: mac ? "⌘" : "Ctrl", ctrl: "Ctrl", meta: mac ? "⌘" : "Meta", alt: mac ? "Option" : "Alt", shift: "Shift", space: "Space", escape: "Esc", arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→" };
  const labels = keys.map(key => keyLabels[key] ?? (key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1)));
  const shortcutLabel = labels.join(" + ");
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [allowInInputs, setAllowInInputs] = useState(false);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("Waiting for your first shortcut…");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const binding = getDemoBinding(keys);
  const bindingCode = `useKeyBinding(${binding.keys.map(key => JSON.stringify(mac && key === "alt" ? "option" : key)).join(", ")}, () => {
    setOpen(true);
  }, { enabled: ${enabled}, allowInInputs: ${allowInInputs}${binding.useCode ? ", useCode: true" : ""} });`;

  function applyBinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const aliases: Record<string, string> = { esc: "escape", return: "enter", up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright", spacebar: "space" };
    const value = draftKey === " " ? "space" : draftKey.trim().toLowerCase();
    const key = aliases[value] ?? value;
    const namedKeys = ["space", "escape", "enter", "tab", "backspace", "delete", "insert", "home", "end", "pageup", "pagedown", "arrowup", "arrowdown", "arrowleft", "arrowright"];
    if (!key || !(Array.from(key).length === 1 || namedKeys.includes(key) || /^f([1-9]|1[0-9]|2[0-4])$/.test(key))) {
      setBindingError("Enter one character or a key name such as Enter, Space, Escape, or ArrowDown.");
      return;
    }
    const nextKeys = [...(draftModifier ? [draftModifier] : []), ...(draftAlt ? ["alt"] : []), ...(draftShift ? ["shift"] : []), key];
    setKeys(nextKeys);
    setDraftKey(key);
    setBindingError("");
    setCount(0);
    setCopied(false);
    setCopyError(false);
    setStatus("Binding updated. Press your shortcut to test it.");
    shortcutDisplay.current?.focus();
  }

  function openMenu(fromKeyboard = false) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
    if (fromKeyboard) {
      setCount(value => value + 1);
      setStatus(`${shortcutLabel} received. Callback fired.`);
    } else setStatus("Command menu opened with a click.");
  }

  useKeyBinding(...binding.keys, () => openMenu(true), { enabled: enabled && !open, allowInInputs, useCode: binding.useCode });
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
    try { await navigator.clipboard.writeText(createExample(bindingCode)); setCopied(true); setCopyError(false); }
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
            <form className="binding-editor" onSubmit={applyBinding} onKeyDown={event => event.stopPropagation()}>
              <div className="binding-fields">
                <label htmlFor="binding-modifier">Modifier<select id="binding-modifier" value={draftModifier} onChange={event => setDraftModifier(event.target.value)}>
                  <option value="cmd">Cmd / Ctrl (auto)</option><option value="ctrl">Ctrl</option><option value="meta">Meta</option><option value="">None</option>
                </select></label>
                <label htmlFor="binding-key">Key<input id="binding-key" value={draftKey} onChange={event => { setDraftKey(event.target.value); setBindingError(""); }} aria-invalid={!!bindingError} aria-describedby={bindingError ? "binding-error" : "binding-hint"} autoComplete="off" spellCheck={false} /></label>
              </div>
              <div className="binding-actions"><div className="extra-modifiers"><label><input type="checkbox" checked={draftShift} onChange={event => setDraftShift(event.target.checked)} />Shift</label><label><input type="checkbox" checked={draftAlt} onChange={event => setDraftAlt(event.target.checked)} />{mac ? "Option" : "Alt"}</label></div><button className="apply-binding" type="submit">Apply binding <span aria-hidden="true">↵</span></button></div>
              <p id="binding-hint" className="binding-hint">Try a letter, Enter, Space, or ArrowDown. Include Shift for shifted characters.</p>
              {bindingError && <p className="binding-error" id="binding-error" role="alert">{bindingError}</p>}
            </form>
            <div className="shortcut-display" ref={shortcutDisplay} tabIndex={-1} aria-label={`Active shortcut: ${shortcutLabel}`}>{labels.map((label, index) => <span className="shortcut-part" key={index}>{index > 0 && <span className="shortcut-plus" aria-hidden="true">+</span>}<kbd>{label}</kbd></span>)}</div>
            <p className="demo-caption">Your command menu, one shortcut away.</p>
            <button className="button demo-button" onClick={() => openMenu()}>Or open it with a click <span aria-hidden="true">↗</span></button>
            <div className="event-status" role="status"><span className="terminal-arrow">›</span><span>{status}</span><span className="event-count">{String(count).padStart(2, "0")}</span></div>
            <div className="demo-controls"><label className="switch-label"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /><span className="switch" />Enable shortcut</label><label className="switch-label"><input type="checkbox" checked={allowInInputs} onChange={event => setAllowInInputs(event.target.checked)} /><span className="switch" />Allow in inputs</label></div>
            <label className="typing-label" htmlFor="typing-test">Typing stays yours. Try the shortcut in this field.</label><input id="typing-test" className="typing-input" placeholder="Type something here…" autoComplete="off" />
          </div>
          <div className="code-panel"><div className="code-toolbar"><span><span className="file-icon">⌑</span> App.tsx</span><span>REACT</span></div><pre aria-label="Demo implementation"><code><span className="syntax-purple">import</span>{' { useKeyBinding } '}<span className="syntax-purple">from</span>{' '}<span className="syntax-green">{'"use-key-binding"'}</span>{';\n\n'}<span className="syntax-comment">{'// Your active binding\n'}</span><span className="syntax-green">{bindingCode}</span>{'\n\n'}<span className="syntax-comment">{'// Escape closes the demo menu.'}</span></code></pre><div className="code-note"><span aria-hidden="true">↳</span><p>{binding.useCode ? <>{mac ? "Option" : "Alt"} can change the typed character.<br />This chord uses <code>{binding.keys[binding.keys.length - 1]}</code>, a physical key position.</> : keys.includes("cmd") ? <><code>cmd</code> becomes Command on Mac<br />and Ctrl on Windows & Linux.</> : <>This binding uses literal keys.<br />Add Cmd / Ctrl for automatic platform mapping.</>}</p></div><div className="platform-chips"><span>{shortcutLabel}</span><span>LIVE EXAMPLE</span></div></div>
        </div><p className="small-note">Keep this page focused. Some shortcuts are reserved by your browser or operating system. The button works on touch screens, too.</p>
      </section>

      <section id="getting-started" className="section guide" aria-labelledby="guide-title"><div className="section-heading"><div><div className="eyebrow">02 / GETTING STARTED</div><h2 id="guide-title" tabIndex={-1}>Small API. Short setup.</h2></div><span className="outline-badge">EARLY RELEASE</span></div>
        <div className="guide-grid"><div className="guide-step"><span className="step-number">1</span><h3>Build it locally</h3><p>This project isn’t on npm yet. From a local checkout, build a package, then install the archive in your React app.</p><pre><code>{'npm ci\nnpm pack\n\n# Run from your React app\nnpm install /path/to/use-key-binding-0.1.0.tgz'}</code></pre></div><div className="guide-step"><span className="step-number">2</span><h3>Bind something good</h3><p>Import the hook. Pass your keys, then a callback. Here’s the binding to put inside your component.</p><div className="snippet"><button className="copy-button" onClick={copyCode}>{copied ? "Copied ✓" : "Copy example"}</button><pre><code>{bindingCode}</code></pre></div><p className="copy-feedback" role="status">{copyError ? "Clipboard unavailable. Select and copy the code above." : copied ? "Copied a complete React example. Make it yours." : "Use with React 18+ and an ESM-compatible bundler."}</p></div></div>
        <div className="api-notes"><div><span aria-hidden="true">⌥</span><h3>Make it your own</h3><p>Add <code>shift</code> or <code>{mac ? "option" : "alt"}</code> to a chord. Use <code>ctrl</code> or <code>meta</code> for literal modifier keys.</p></div><div><span aria-hidden="true">↹</span><h3>Respect the input</h3><p>Inputs are ignored by default. Opt in with <code>{'{ allowInInputs: true }'}</code> when it makes sense.</p></div><div><span aria-hidden="true">↩</span><h3>Leave no listeners behind</h3><p>Automatic cleanup on unmount. Current callbacks. Server rendering support. Just a little less to think about.</p></div></div>
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
