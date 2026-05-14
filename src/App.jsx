import { useState, useEffect, useRef, useCallback } from "react";

/* ── CONSTANTS ── */
const DIRECTIONS = {
  tablet: "Adults, take 1-2 tablets daily, or as directed by your healthcare provider.",
  sublingual: "Adults, place one tablet under the tongue and allow it to dissolve completely. Do not swallow initially. Keep the dissolved material under the tongue for a few minutes. A warming or tingling sensation may be experienced and is normal, indicating sublingual absorption."
};
const WARNINGS = "For use in adults only. This product should not be taken by those who are pregnant or nursing. If you are taking medication or have a medical condition, consult with your doctor before use. Keep out of reach of children. Store in a cool dry place.";
const FDA = "*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

const SCHEMES = [
  { id: "bw", name: "Black & White", leftBg: "#222222", leftText: "#ffffff", accent: "#000000", contentBg: "#ffffff", contentText: "#111111", headerColor: "#000000" },
  { id: "warm", name: "Warm Earth", leftBg: "#8B5E3C", leftText: "#ffffff", accent: "#b07d4f", contentBg: "#fff8eb", contentText: "#222222", headerColor: "#b07d4f" },
  { id: "navy", name: "Navy & Silver", leftBg: "#1a2744", leftText: "#e8edf4", accent: "#8a9bbd", contentBg: "#f4f6f9", contentText: "#1a2744", headerColor: "#4a6491" },
  { id: "forest", name: "Forest", leftBg: "#1e3a2f", leftText: "#e2efe8", accent: "#5a8f72", contentBg: "#f2f8f5", contentText: "#1e3a2f", headerColor: "#3d7a5c" },
  { id: "slate", name: "Charcoal Slate", leftBg: "#2d2d2d", leftText: "#e0e0e0", accent: "#888888", contentBg: "#f5f5f5", contentText: "#222222", headerColor: "#555555" },
  { id: "plum", name: "Plum & Gold", leftBg: "#3b1f4a", leftText: "#f0e4f7", accent: "#c9a84c", contentBg: "#faf7f0", contentText: "#2a1533", headerColor: "#9b7b2a" },
];

const LOGO_MAX_KB = 500;
const LOGO_MAX_PX = 800;
const LOGO_FORMATS = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

const blank = {
  brandName: "", productName: "", strength: "", tabletCount: "",
  tabletType: "tablet", directions: DIRECTIONS.tablet,
  ingredientName: "", ingredientForm: "", ingredientAmount: "",
  otherIngredients: "", manufacturedFor: "", servingsPerContainer: "",
  lotNumber: "", expDate: "",
};

export default function LabelBuilder() {
  const [form, setForm] = useState(blank);
  const [tab, setTab] = useState("product");
  const [scale, setScale] = useState(2.5);
  const [scheme, setScheme] = useState(SCHEMES[0]);
  const [isCustom, setIsCustom] = useState(false);
  const [customScheme, setCustomScheme] = useState({
    id: "custom", name: "Custom", leftBg: "#222222", leftText: "#ffffff",
    accent: "#000000", contentBg: "#ffffff", contentText: "#111111", headerColor: "#000000",
  });
  const [logo, setLogo] = useState(null);
  const [logoError, setLogoError] = useState("");
  const [nakedMode, setNakedMode] = useState(false);

  const activeScheme = isCustom ? customScheme : scheme;
  const setCustomColor = (key) => (e) => setCustomScheme((p) => ({ ...p, [key]: e.target.value }));

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const switchType = (type) => setForm((p) => ({ ...p, tabletType: type, directions: DIRECTIONS[type] }));

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    setLogoError("");
    if (!file) return;
    if (!LOGO_FORMATS.includes(file.type)) {
      setLogoError("Format must be PNG, JPG, SVG, or WebP.");
      return;
    }
    if (file.size > LOGO_MAX_KB * 1024) {
      setLogoError(`File too large (${(file.size/1024).toFixed(0)}KB). Max ${LOGO_MAX_KB}KB.`);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width > LOGO_MAX_PX || img.height > LOGO_MAX_PX) {
        setLogoError(`Image dimensions (${img.width}×${img.height}) exceed ${LOGO_MAX_PX}px max.`);
        URL.revokeObjectURL(url);
        return;
      }
      if (img.width / img.height > 4 || img.height / img.width > 3) {
        setLogoError("Aspect ratio too extreme. Keep within 4:1 wide or 3:1 tall.");
        URL.revokeObjectURL(url);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogo(ev.target.result);
        URL.revokeObjectURL(url);
      };
      reader.readAsDataURL(file);
    };
    img.onerror = () => { setLogoError("Could not read image."); URL.revokeObjectURL(url); };
    img.src = url;
  };

  const tabs = [
    { id: "product", label: "Product" },
    { id: "ingredients", label: "Ingredients" },
    { id: "mfg", label: "Mfg / Lot" },
    { id: "design", label: "Design" },
  ];

  return (
    <div style={S.shell}>
      <style>{CSS}</style>
      <div style={S.topBar}>
        <div style={S.topTitle}>Peptide Label Builder</div>
        <div style={S.topSub}>1.2″ × 3.9″ &nbsp;·&nbsp; Auto-scaling text &nbsp;·&nbsp; {nakedMode ? "Naked Export Mode" : "Styled Preview"}</div>
      </div>
      <div style={S.main}>
        {/* ── FORM ── */}
        <div style={S.form}>
          <div style={S.tabs}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ ...S.tabBtn, ...(tab === t.id ? S.tabOn : {}) }}>{t.label}</button>
            ))}
          </div>
          <div style={S.fields}>
            {tab === "product" && <>
              <F label="Brand Name" value={form.brandName} onChange={set("brandName")} placeholder="e.g. PEPTERNITY" />
              <F label="Product Name" value={form.productName} onChange={set("productName")} placeholder="e.g. BPC-157" />
              <F label="Strength" value={form.strength} onChange={set("strength")} placeholder="e.g. 500mcg" />
              <Row>
                <F label="Tablet Count" value={form.tabletCount} onChange={set("tabletCount")} placeholder="60" half />
                <F label="Servings / Container" value={form.servingsPerContainer} onChange={set("servingsPerContainer")} placeholder="60" half />
              </Row>
              <div style={S.fieldWrap}>
                <div style={S.fieldLabel}>Tablet Type</div>
                <div style={S.toggleRow}>
                  {["tablet", "sublingual"].map((t) => (
                    <button key={t} onClick={() => switchType(t)}
                      style={{ ...S.toggle, ...(form.tabletType === t ? S.toggleOn : {}) }}>
                      {t === "tablet" ? "Regular" : "Sublingual"}
                    </button>
                  ))}
                </div>
              </div>
              <F label="Directions" value={form.directions} onChange={set("directions")} multi rows={3}
                note="Auto-fills from tablet type. Edit freely." />
            </>}
            {tab === "ingredients" && <>
              <F label="Active Ingredient Name" value={form.ingredientName} onChange={set("ingredientName")} placeholder="e.g. BPC-157" />
              <F label="Ingredient Form" value={form.ingredientForm} onChange={set("ingredientForm")} placeholder="e.g. (as Pentadeca Short Chain Amino Acids)" />
              <F label="Amount Per Serving" value={form.ingredientAmount} onChange={set("ingredientAmount")} placeholder="e.g. 1mg" />
              <F label="Other Ingredients" value={form.otherIngredients} onChange={set("otherIngredients")} multi rows={3}
                placeholder="Comma-separated list" />
            </>}
            {tab === "mfg" && <>
              <F label="Manufactured For" value={form.manufacturedFor} onChange={set("manufacturedFor")} multi rows={2}
                placeholder="Company name, full address" />
              <Row>
                <F label="LOT Number" value={form.lotNumber} onChange={set("lotNumber")} placeholder="050120261" half />
                <F label="EXP Date" value={form.expDate} onChange={set("expDate")} placeholder="05/01/2028" half />
              </Row>
            </>}
            {tab === "design" && <>
              {/* Color Scheme */}
              <div style={S.fieldWrap}>
                <div style={S.fieldLabel}>Color Scheme</div>
                <div style={S.schemeGrid}>
                  {SCHEMES.map((s) => (
                    <button key={s.id} onClick={() => { setScheme(s); setIsCustom(false); }}
                      style={{ ...S.schemePill, border: !isCustom && scheme.id === s.id ? "2px solid #ddd" : "2px solid transparent" }}>
                      <div style={{ display: "flex", height: 18, borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
                        <div style={{ flex: 1, background: s.leftBg }} />
                        <div style={{ flex: 1, background: s.accent }} />
                        <div style={{ flex: 1, background: s.contentBg }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#aaa" }}>{s.name}</div>
                    </button>
                  ))}
                  <button onClick={() => { setIsCustom(true); setCustomScheme((p) => ({ ...p, ...scheme, id: "custom", name: "Custom" })); }}
                    style={{ ...S.schemePill, border: isCustom ? "2px solid #ddd" : "2px solid transparent" }}>
                    <div style={{ display: "flex", height: 18, borderRadius: 3, overflow: "hidden", marginBottom: 3, border: "1px dashed #666", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, color: "#888" }}>✎</span>
                    </div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>Custom</div>
                  </button>
                </div>
              </div>

              {/* Custom Color Pickers — only visible when custom is selected */}
              {isCustom && (
                <div style={S.fieldWrap}>
                  <div style={S.fieldLabel}>Custom Colors</div>
                  <div style={S.customColorGrid}>
                    <ColorField label="Left Panel BG" value={customScheme.leftBg} onChange={setCustomColor("leftBg")} />
                    <ColorField label="Left Panel Text" value={customScheme.leftText} onChange={setCustomColor("leftText")} />
                    <ColorField label="Accent / Headers" value={customScheme.accent} onChange={setCustomColor("accent")} />
                    <ColorField label="Section Headers" value={customScheme.headerColor} onChange={setCustomColor("headerColor")} />
                    <ColorField label="Content BG" value={customScheme.contentBg} onChange={setCustomColor("contentBg")} />
                    <ColorField label="Content Text" value={customScheme.contentText} onChange={setCustomColor("contentText")} />
                  </div>
                </div>
              )}

              {/* Logo Upload */}
              <div style={S.fieldWrap}>
                <div style={S.fieldLabel}>Logo Upload</div>
                <div style={S.logoZone}>
                  {logo ? (
                    <div style={{ position: "relative", textAlign: "center" }}>
                      <img src={logo} alt="Logo" style={{ maxWidth: "100%", maxHeight: 60, objectFit: "contain" }} />
                      <button onClick={() => { setLogo(null); setLogoError(""); }}
                        style={S.logoRemove}>✕ Remove</button>
                    </div>
                  ) : (
                    <label style={S.logoLabel}>
                      <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogo} style={{ display: "none" }} />
                      <div style={{ fontSize: 20, marginBottom: 4 }}>⬆</div>
                      <div style={{ fontSize: 11, color: "#999" }}>Click to upload logo</div>
                      <div style={{ fontSize: 9, color: "#666", marginTop: 4 }}>PNG, JPG, SVG, WebP · Max 500KB · Max 800×800px</div>
                      <div style={{ fontSize: 9, color: "#666" }}>Aspect ratio: 4:1 max wide, 3:1 max tall</div>
                    </label>
                  )}
                  {logoError && <div style={S.logoErr}>{logoError}</div>}
                </div>
              </div>

              {/* Naked Export Toggle */}
              <div style={S.fieldWrap}>
                <div style={S.fieldLabel}>Export Mode</div>
                <div style={S.toggleRow}>
                  <button onClick={() => setNakedMode(false)}
                    style={{ ...S.toggle, ...(nakedMode ? {} : S.toggleOn) }}>Styled Label</button>
                  <button onClick={() => setNakedMode(true)}
                    style={{ ...S.toggle, ...(nakedMode ? S.toggleOn : {}) }}>Naked (Designer)</button>
                </div>
                <div style={{ fontSize: 10, color: "#666", fontStyle: "italic", marginTop: 4 }}>
                  {nakedMode
                    ? "Shows raw content spec — no colors, no logo. Copy-paste or screenshot for your designer."
                    : "Full styled preview with colors and logo."}
                </div>
              </div>
            </>}
          </div>
          <div style={S.zoomBar}>
            <span style={S.zoomLabel}>Scale</span>
            <input type="range" min="1.5" max="4" step="0.1" value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))} style={S.slider} />
            <span style={S.zoomVal}>{scale.toFixed(1)}×</span>
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div style={S.previewWrap}>
          <div style={S.previewBar}>
            <span style={S.previewLabel}>{nakedMode ? "Naked Export — Content Spec" : "Live Label Preview"}</span>
          </div>
          <div style={S.previewScroll}>
            {nakedMode
              ? <NakedLabel form={form} scale={scale} />
              : <StyledLabel form={form} scale={scale} scheme={activeScheme} logo={logo} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared form components ── */
function F({ label, value, onChange, placeholder, multi, rows, note, half }) {
  return (
    <div style={{ ...S.fieldWrap, ...(half ? { flex: 1, minWidth: 0 } : {}) }}>
      <div style={S.fieldLabel}>{label}</div>
      {multi
        ? <textarea style={S.input} value={value} onChange={onChange} placeholder={placeholder} rows={rows || 2} />
        : <input style={S.input} value={value} onChange={onChange} placeholder={placeholder} />}
      {note && <div style={{ fontSize: 10, color: "#666", fontStyle: "italic" }}>{note}</div>}
    </div>
  );
}
function Row({ children }) { return <div style={{ display: "flex", gap: 10 }}>{children}</div>; }

function ColorField({ label, value, onChange }) {
  const isValid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div style={S.colorField}>
      <div style={{ fontSize: 9, color: "#888", marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <label style={{ width: 26, height: 26, borderRadius: 4, border: "1px solid #555", cursor: "pointer", overflow: "hidden", flexShrink: 0, position: "relative" }}>
          <input type="color" value={value} onChange={onChange}
            style={{ position: "absolute", inset: -4, width: "calc(100% + 8px)", height: "calc(100% + 8px)", border: "none", padding: 0, cursor: "pointer" }} />
        </label>
        <input
          type="text" value={value} maxLength={7}
          onChange={(e) => {
            let v = e.target.value;
            if (!v.startsWith("#")) v = "#" + v;
            onChange({ target: { value: v.slice(0, 7) } });
          }}
          style={{ ...S.input, padding: "4px 6px", fontSize: 11, fontFamily: "monospace", width: "100%",
            borderColor: isValid ? "#333" : "#663333" }}
        />
      </div>
    </div>
  );
}

/* ── AutoText ── */
function AutoText({ text, maxFontSize, minFontSize = 3, style = {}, containerStyle = {} }) {
  const cRef = useRef(null);
  const tRef = useRef(null);
  const fit = useCallback(() => {
    const c = cRef.current, t = tRef.current;
    if (!c || !t || !text) return;
    let sz = maxFontSize;
    t.style.fontSize = sz + "px";
    while ((t.scrollHeight > c.clientHeight + 1 || t.scrollWidth > c.clientWidth + 1) && sz > minFontSize) {
      sz -= 0.25;
      t.style.fontSize = sz + "px";
    }
  }, [text, maxFontSize, minFontSize]);
  useEffect(() => { fit(); }, [fit]);
  useEffect(() => { window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit); }, [fit]);
  return (
    <div ref={cRef} style={{ overflow: "hidden", width: "100%", height: "100%", ...containerStyle }}>
      <div ref={tRef} style={{ fontSize: maxFontSize, lineHeight: 1.3, wordBreak: "break-word", ...style }}>{text}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STYLED LABEL
   ═══════════════════════════════════════════ */
const BASE_H = 120, BASE_W = 390;

function StyledLabel({ form, scale, scheme, logo }) {
  const W = BASE_W * scale, H = BASE_H * scale, s = scale;
  const typeLabel = form.tabletType === "sublingual" ? "SUBLINGUAL TABLETS" : "TABLETS";

  return (
    <div style={{ display: "inline-block" }}>
      <div style={{ width: W, height: H, display: "flex", borderRadius: 4, overflow: "hidden", boxShadow: "0 6px 30px rgba(0,0,0,0.45)", fontFamily: "'DM Sans', sans-serif" }}>

        {/* LEFT */}
        <div style={{ width: W * 0.24, background: scheme.leftBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `${2*s}px ${4*s}px`, textAlign: "center", gap: 1*s }}>
          {logo && <img src={logo} alt="Logo" style={{ maxWidth: "80%", maxHeight: 14*s, objectFit: "contain", marginBottom: 1*s }} />}
          <AutoText text={form.brandName || "BRAND"} maxFontSize={5.5*s} style={{ fontWeight: 700, letterSpacing: 1.5, color: scheme.accent, textAlign: "center", opacity: form.brandName ? 1 : 0.25 }}
            containerStyle={{ maxHeight: 9*s, flexShrink: 0 }} />
          <AutoText text={form.productName || "PRODUCT"} maxFontSize={12*s} minFontSize={5*s} style={{ fontWeight: 900, color: scheme.leftText, textAlign: "center", letterSpacing: 1, lineHeight: 1.05 }}
            containerStyle={{ maxHeight: 18*s, flexShrink: 0 }} />
          <AutoText text={form.strength || "000mg"} maxFontSize={9*s} style={{ fontWeight: 800, color: scheme.accent, textAlign: "center", opacity: form.strength ? 1 : 0.25 }}
            containerStyle={{ maxHeight: 12*s, flexShrink: 0 }} />
          <div style={{ marginTop: 1*s }}>
            <div style={{ fontSize: 7*s, fontWeight: 800, color: scheme.leftText, lineHeight: 1 }}>{form.tabletCount || "00"}</div>
            <div style={{ fontSize: 2.8*s, fontWeight: 700, letterSpacing: 1, color: scheme.leftText, opacity: 0.65, marginTop: 0.5*s }}>{typeLabel}</div>
          </div>
          <div style={{ fontSize: 2.6*s, fontWeight: 600, letterSpacing: 1.5, color: scheme.leftText, opacity: 0.45, marginTop: 1.5*s }}>DIETARY SUPPLEMENT</div>
        </div>

        {/* CENTER */}
        <div style={{ flex: 1, background: scheme.contentBg, padding: `${3*s}px ${4*s}px`, display: "flex", flexDirection: "column", gap: 0.5*s }}>
          <div style={{ fontSize: 3*s, fontWeight: 700, color: scheme.headerColor, letterSpacing: 0.5 }}>DIRECTIONS:</div>
          <div style={{ maxHeight: 17*s, overflow: "hidden", flexShrink: 1 }}>
            <AutoText text={form.directions} maxFontSize={2.8*s} minFontSize={1.6*s} style={{ color: scheme.contentText }} containerStyle={{ maxHeight: 17*s }} />
          </div>
          <div style={{ fontSize: 3*s, fontWeight: 700, color: scheme.headerColor, letterSpacing: 0.5, marginTop: 0.8*s }}>WARNINGS:</div>
          <div style={{ maxHeight: 13*s, overflow: "hidden", flexShrink: 1 }}>
            <AutoText text={WARNINGS} maxFontSize={2.4*s} minFontSize={1.4*s} style={{ color: scheme.contentText, opacity: 0.75 }} containerStyle={{ maxHeight: 13*s }} />
          </div>
          <div style={{ fontSize: 3*s, fontWeight: 700, color: scheme.headerColor, letterSpacing: 0.5, marginTop: 0.8*s }}>OTHER INGREDIENTS:</div>
          <div style={{ maxHeight: 7*s, overflow: "hidden", flexShrink: 1 }}>
            <AutoText text={form.otherIngredients || "—"} maxFontSize={2.4*s} minFontSize={1.4*s} style={{ color: scheme.contentText, opacity: 0.75 }} containerStyle={{ maxHeight: 7*s }} />
          </div>
          <div style={{ maxHeight: 6*s, overflow: "hidden", marginTop: 0.8*s, flexShrink: 1 }}>
            <AutoText text={form.manufacturedFor ? `MANUFACTURED FOR: ${form.manufacturedFor}` : "MANUFACTURED FOR: —"}
              maxFontSize={2.4*s} minFontSize={1.3*s} style={{ color: scheme.contentText, fontWeight: 600 }} containerStyle={{ maxHeight: 6*s }} />
          </div>
          <div style={{ marginTop: "auto", padding: `${1*s}px 0`, fontSize: 2*s, lineHeight: 1.3, color: scheme.contentText, opacity: 0.55, borderTop: `${0.4*s}px solid ${scheme.accent}44` }}>
            {FDA}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width: W * 0.27, background: scheme.contentBg, padding: `${3*s}px ${3*s}px ${3*s}px 0`, display: "flex", flexDirection: "column", gap: 1.5*s }}>
          <div style={{ fontSize: 2.6*s, fontWeight: 700, textAlign: "right", color: scheme.contentText, letterSpacing: 0.5 }}>MADE IN THE USA 🇺🇸</div>
          <div style={{ border: `${0.8*s}px solid ${scheme.contentText}`, background: "#fff", padding: `${1.5*s}px ${2*s}px`, flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 5*s, fontWeight: 900, textAlign: "center", borderBottom: `${0.5*s}px solid ${scheme.contentText}`, paddingBottom: 1*s, marginBottom: 1*s, letterSpacing: 0.3, color: scheme.contentText }}>SUPPLEMENT FACTS</div>
            <div style={{ fontSize: 2.8*s, color: scheme.contentText }}>Serving Size: 1 Tablet</div>
            <div style={{ fontSize: 2.8*s, color: scheme.contentText, borderBottom: `${0.8*s}px solid ${scheme.contentText}`, paddingBottom: 1*s, marginBottom: 1*s }}>
              Servings Per Container: {form.servingsPerContainer || "—"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 2.4*s, fontWeight: 700, marginBottom: 0.5*s, color: scheme.contentText }}>
              <span>AMOUNT PER SERVING</span><span>%DV</span>
            </div>
            <div style={{ borderTop: `${0.3*s}px solid #999`, paddingTop: 1*s, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <AutoText text={form.ingredientName || "Ingredient"} maxFontSize={3*s} minFontSize={1.6*s}
                    style={{ fontWeight: 700, color: scheme.contentText, opacity: form.ingredientName ? 1 : 0.25 }} containerStyle={{ maxHeight: 4.5*s }} />
                  <AutoText text={form.ingredientForm || "(form)"} maxFontSize={2.2*s} minFontSize={1*s}
                    style={{ color: scheme.contentText, opacity: form.ingredientForm ? 0.7 : 0.2 }} containerStyle={{ maxHeight: 4.5*s }} />
                </div>
                <div style={{ fontSize: 2.8*s, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 2*s, color: scheme.contentText }}>
                  {form.ingredientAmount || "—"} <span style={{ fontWeight: 400 }}>†</span>
                </div>
              </div>
            </div>
            <div style={{ borderTop: `${0.3*s}px solid #999`, paddingTop: 0.5*s, fontSize: 2*s, color: "#777" }}>† Daily Value (DV) not established.</div>
          </div>
          <div style={{ fontSize: 2.2*s, color: scheme.contentText, opacity: 0.5, textAlign: "center" }}>
            {form.lotNumber || form.expDate ? `LOT: ${form.lotNumber || "—"}  EXP: ${form.expDate || "—"}` : "LOT / EXP"}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "#666", marginTop: 8, fontStyle: "italic" }}>
        Print: 1.2″ × 3.9″ — preview at {scale.toFixed(1)}×
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   NAKED LABEL — Designer handoff
   ═══════════════════════════════════════════ */
function NakedLabel({ form, scale }) {
  const W = BASE_W * scale, H = BASE_H * scale, s = scale;
  const typeLabel = form.tabletType === "sublingual" ? "SUBLINGUAL TABLETS" : "TABLETS";
  const sec = { fontSize: 3*s, fontWeight: 700, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 0.5*s, marginTop: 2*s };
  const val = { fontSize: 3.2*s, color: "#222", lineHeight: 1.4, marginBottom: 1*s, minHeight: 3.5*s };
  const dimNote = { fontSize: 2.2*s, color: "#bbb", fontStyle: "italic" };

  return (
    <div style={{ display: "inline-block" }}>
      <div style={{
        width: W, height: H, display: "flex", fontFamily: "'DM Sans', sans-serif",
        border: "1.5px dashed #999", borderRadius: 4, background: "#fff", overflow: "hidden",
      }}>
        {/* LEFT PANEL — outlined zone */}
        <div style={{ width: W * 0.24, borderRight: "1px dashed #ccc", padding: `${3*s}px`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1*s }}>
          <div style={{ ...dimNote, textAlign: "center", marginBottom: 2*s }}>← LEFT PANEL →</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 16*s, height: 10*s, border: "1px dashed #ccc", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2*s }}>
              <span style={{ fontSize: 2.2*s, color: "#bbb" }}>LOGO</span>
            </div>
            <div style={sec}>Brand</div>
            <div style={{ ...val, fontWeight: 700, fontSize: 4*s }}>{form.brandName || "—"}</div>
            <div style={sec}>Product</div>
            <div style={{ ...val, fontWeight: 900, fontSize: 5*s }}>{form.productName || "—"}</div>
            <div style={sec}>Strength</div>
            <div style={{ ...val, fontWeight: 700 }}>{form.strength || "—"}</div>
            <div style={{ ...val, fontSize: 2.6*s, color: "#666" }}>{form.tabletCount || "—"} {typeLabel}</div>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div style={{ flex: 1, borderRight: "1px dashed #ccc", padding: `${3*s}px ${4*s}px`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ ...dimNote, marginBottom: 1*s }}>← CENTER PANEL →</div>
          <div style={sec}>Directions</div>
          <div style={val}>{form.directions || "—"}</div>
          <div style={sec}>Warnings</div>
          <div style={{ ...val, fontSize: 2.6*s, color: "#555" }}>{WARNINGS}</div>
          <div style={sec}>Other Ingredients</div>
          <div style={{ ...val, fontSize: 2.6*s }}>{form.otherIngredients || "—"}</div>
          <div style={sec}>Manufactured For</div>
          <div style={{ ...val, fontSize: 2.6*s }}>{form.manufacturedFor || "—"}</div>
          <div style={{ marginTop: "auto", fontSize: 2*s, color: "#999", borderTop: "1px dashed #ddd", paddingTop: 1*s }}>{FDA}</div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width: W * 0.27, padding: `${3*s}px`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ ...dimNote, textAlign: "right", marginBottom: 1*s }}>← RIGHT PANEL →</div>
          <div style={{ border: "1px solid #222", padding: `${2*s}px`, flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 4.5*s, fontWeight: 900, textAlign: "center", borderBottom: "1px solid #222", paddingBottom: 1*s, marginBottom: 1*s }}>SUPPLEMENT FACTS</div>
            <div style={{ fontSize: 2.6*s }}>Serving Size: 1 Tablet</div>
            <div style={{ fontSize: 2.6*s, borderBottom: "2px solid #222", paddingBottom: 1*s, marginBottom: 1*s }}>Servings Per Container: {form.servingsPerContainer || "—"}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 2.2*s, fontWeight: 700 }}>
              <span>AMOUNT PER SERVING</span><span>%DV</span>
            </div>
            <div style={{ borderTop: "1px solid #999", marginTop: 0.5*s, paddingTop: 1*s, flex: 1 }}>
              <div style={{ fontSize: 2.8*s, fontWeight: 700 }}>{form.ingredientName || "—"}</div>
              <div style={{ fontSize: 2*s, color: "#666" }}>{form.ingredientForm || "—"}</div>
              <div style={{ fontSize: 2.6*s, fontWeight: 700, textAlign: "right", marginTop: 0.5*s }}>{form.ingredientAmount || "—"} †</div>
            </div>
            <div style={{ borderTop: "1px solid #999", paddingTop: 0.5*s, fontSize: 1.8*s, color: "#999" }}>† Daily Value not established.</div>
          </div>
          <div style={{ fontSize: 2.2*s, color: "#888", textAlign: "center", marginTop: 1.5*s }}>
            LOT: {form.lotNumber || "______"}  EXP: {form.expDate || "______"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 2px" }}>
        <span style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>Naked export — content only, no styling applied</span>
        <span style={{ fontSize: 11, color: "#999" }}>1.2″ × 3.9″ at {scale.toFixed(1)}×</span>
      </div>
    </div>
  );
}

/* ── CSS ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input, textarea, select, button { font-family: 'DM Sans', sans-serif; }
  textarea { resize: vertical; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
  input[type="range"] { -webkit-appearance: none; height: 4px; background: #333; border-radius: 2px; outline: none; }
  input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #b07d4f; border-radius: 50%; cursor: pointer; }
  input[type="color"] { -webkit-appearance: none; border: none; }
  input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  input[type="color"]::-webkit-color-swatch { border: none; border-radius: 3px; }
`;

const S = {
  shell: { fontFamily: "'DM Sans', sans-serif", background: "#111", color: "#ddd", minHeight: "100vh", padding: 20 },
  topBar: { textAlign: "center", marginBottom: 16 },
  topTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: "#b07d4f" },
  topSub: { fontSize: 12, color: "#888", marginTop: 2 },
  main: { display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" },
  form: { flex: "1 1 300px", background: "#1a1a1a", borderRadius: 10, border: "1px solid #2a2a2a", overflow: "hidden", minWidth: 280, maxWidth: 380 },
  tabs: { display: "flex", borderBottom: "1px solid #2a2a2a" },
  tabBtn: { flex: 1, padding: "10px 0", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#888", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s" },
  tabOn: { color: "#b07d4f", borderBottomColor: "#b07d4f" },
  fields: { padding: 14, display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 4 },
  fieldLabel: { fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { width: "100%", padding: "7px 10px", background: "#222", border: "1px solid #333", borderRadius: 6, color: "#ddd", fontSize: 13, outline: "none", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" },
  toggleRow: { display: "flex", gap: 6 },
  toggle: { flex: 1, padding: "7px 0", background: "#222", border: "1px solid #333", borderRadius: 6, color: "#777", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" },
  toggleOn: { background: "#2a1f16", borderColor: "#b07d4f", color: "#b07d4f" },
  schemeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 },
  schemePill: { background: "#222", borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "center", transition: "all .15s" },
  customColorGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#1e1e1e", borderRadius: 8, padding: 10, border: "1px solid #333" },
  colorField: { display: "flex", flexDirection: "column" },
  logoZone: { background: "#1e1e1e", border: "1px dashed #444", borderRadius: 8, padding: 12, textAlign: "center" },
  logoLabel: { cursor: "pointer", display: "block", padding: "8px 0" },
  logoRemove: { marginTop: 6, background: "transparent", border: "1px solid #555", borderRadius: 4, color: "#aaa", fontSize: 10, padding: "3px 10px", cursor: "pointer" },
  logoErr: { marginTop: 6, fontSize: 11, color: "#e65555", fontWeight: 600 },
  zoomBar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: "1px solid #2a2a2a" },
  zoomLabel: { fontSize: 10, color: "#888", fontWeight: 600, textTransform: "uppercase" },
  slider: { flex: 1 },
  zoomVal: { fontSize: 11, color: "#b07d4f", fontWeight: 600, minWidth: 32 },
  previewWrap: { flex: "1 1 500px", background: "#1a1a1a", borderRadius: 10, border: "1px solid #2a2a2a", overflow: "hidden", minWidth: 400 },
  previewBar: { padding: "10px 14px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center" },
  previewLabel: { fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 1 },
  previewScroll: { padding: 20, overflowX: "auto" },
};
