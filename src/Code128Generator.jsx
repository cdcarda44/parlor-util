import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

export default function Code128Generator() {
  const [value, setValue] = useState("1234567890");
  const [barWidth, setBarWidth] = useState(2);
  const [height, setHeight] = useState(80);

  const [labelText, setLabelText] = useState("");
  const [labelPosition, setLabelPosition] = useState("below"); // above | below | left | right
  const [labelFontFamily, setLabelFontFamily] = useState("Arial, sans-serif");
  const [labelFontSize, setLabelFontSize] = useState(18);
  const [labelBold, setLabelBold] = useState(false);
  const [labelItalic, setLabelItalic] = useState(false);
  const [labelUnderline, setLabelUnderline] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const svgRef = useRef(null);
  const barcodeSourceRef = useRef(null);

  const canRender = useMemo(() => value.trim().length > 0, [value]);

  useEffect(() => {
    setError("");

    const previewSvg = svgRef.current;
    const barcodeSourceSvg = barcodeSourceRef.current;

    if (!previewSvg || !barcodeSourceSvg) return;

    previewSvg.innerHTML = "";
    barcodeSourceSvg.innerHTML = "";

    if (!canRender) {
      return;
    }

    try {
      JsBarcode(barcodeSourceSvg, value.trim(), {
        format: "CODE128",
        lineColor: "#000",
        background: "#fff",
        width: barWidth,
        height,
        displayValue: true,
        fontSize: 18,
        margin: 12,
      });

      const svgNS = "http://www.w3.org/2000/svg";

      const barcodeGroup = document.createElementNS(svgNS, "g");
      Array.from(barcodeSourceSvg.childNodes).forEach((node) => {
        barcodeGroup.appendChild(node.cloneNode(true));
      });

      previewSvg.appendChild(barcodeGroup);

      const barcodeBox = barcodeGroup.getBBox();

      const normalizedLabelText = labelText.replace(/\r\n/g, "\n");
      const hasLabel = normalizedLabelText.trim().length > 0;
      const gap = hasLabel ? 12 : 0;

      let labelEl = null;
      let labelBox = { width: 0, height: 0 };

      if (hasLabel) {
        const lines = normalizedLabelText.split("\n");

        labelEl = document.createElementNS(svgNS, "text");
        labelEl.setAttribute("font-size", String(labelFontSize));
        labelEl.setAttribute("font-family", labelFontFamily);
        labelEl.setAttribute("font-weight", labelBold ? "700" : "400");
        labelEl.setAttribute("font-style", labelItalic ? "italic" : "normal");
        labelEl.setAttribute(
          "text-decoration",
          labelUnderline ? "underline" : "none"
        );
        labelEl.setAttribute("fill", "#000");
        labelEl.setAttribute("dominant-baseline", "hanging");

        const lineHeight = Math.round(labelFontSize * 1.2);

        lines.forEach((line, index) => {
          const tspan = document.createElementNS(svgNS, "tspan");
          tspan.textContent = line || " ";
          tspan.setAttribute("x", "0");
          tspan.setAttribute("dy", index === 0 ? "0" : String(lineHeight));
          labelEl.appendChild(tspan);
        });

        previewSvg.appendChild(labelEl);
        labelBox = labelEl.getBBox();
      }

      let totalWidth = barcodeBox.width;
      let totalHeight = barcodeBox.height;

      if (hasLabel) {
        if (labelPosition === "above" || labelPosition === "below") {
          totalWidth = Math.max(barcodeBox.width, labelBox.width);
          totalHeight = barcodeBox.height + gap + labelBox.height;
        } else {
          totalWidth = barcodeBox.width + gap + labelBox.width;
          totalHeight = Math.max(barcodeBox.height, labelBox.height);
        }
      }

      const padding = 16;
      const outerWidth = Math.ceil(totalWidth + padding * 2);
      const outerHeight = Math.ceil(totalHeight + padding * 2);

      let barcodeX = padding;
      let barcodeY = padding;
      let labelX = padding;
      let labelY = padding;

      if (!hasLabel) {
        barcodeX = padding + (totalWidth - barcodeBox.width) / 2;
        barcodeY = padding + (totalHeight - barcodeBox.height) / 2;
      } else if (labelPosition === "above") {
        labelX = padding + (totalWidth - labelBox.width) / 2;
        labelY = padding;
        barcodeX = padding + (totalWidth - barcodeBox.width) / 2;
        barcodeY = padding + labelBox.height + gap;
      } else if (labelPosition === "below") {
        barcodeX = padding + (totalWidth - barcodeBox.width) / 2;
        barcodeY = padding;
        labelX = padding + (totalWidth - labelBox.width) / 2;
        labelY = padding + barcodeBox.height + gap;
      } else if (labelPosition === "left") {
        labelX = padding;
        labelY = padding + (totalHeight - labelBox.height) / 2;
        barcodeX = padding + labelBox.width + gap;
        barcodeY = padding + (totalHeight - barcodeBox.height) / 2;
      } else if (labelPosition === "right") {
        barcodeX = padding;
        barcodeY = padding + (totalHeight - barcodeBox.height) / 2;
        labelX = padding + barcodeBox.width + gap;
        labelY = padding + (totalHeight - labelBox.height) / 2;
      }

      const barcodeTranslateX = barcodeX - barcodeBox.x;
      const barcodeTranslateY = barcodeY - barcodeBox.y;
      barcodeGroup.setAttribute(
        "transform",
        `translate(${barcodeTranslateX}, ${barcodeTranslateY})`
      );

      if (labelEl) {
        labelEl.setAttribute("transform", `translate(${labelX}, ${labelY})`);
      }

      previewSvg.setAttribute("xmlns", svgNS);
      previewSvg.setAttribute("width", String(outerWidth));
      previewSvg.setAttribute("height", String(outerHeight));
      previewSvg.setAttribute("viewBox", `0 0 ${outerWidth} ${outerHeight}`);
      previewSvg.style.display = "block";
      previewSvg.style.background = "#fff";
    } catch (e) {
      previewSvg.innerHTML = "";
      barcodeSourceSvg.innerHTML = "";
      setError(e?.message ?? String(e));
    }
  }, [
    value,
    barWidth,
    height,
    labelText,
    labelPosition,
    labelFontFamily,
    labelFontSize,
    labelBold,
    labelItalic,
    labelUnderline,
    canRender,
  ]);

  const onPrint = () => window.print();

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2000);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function svgToPngBlob(svgEl, scale = 3) {
    const svgText = new XMLSerializer().serializeToString(svgEl);
    const fixedSvgText = svgText.includes('xmlns="http://www.w3.org/2000/svg"')
      ? svgText
      : svgText.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');

    const svgBlob = new Blob([fixedSvgText], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });

      const width =
        Number(svgEl.getAttribute("width")) ||
        img.width ||
        svgEl.clientWidth ||
        300;
      const height =
        Number(svgEl.getAttribute("height")) ||
        img.height ||
        svgEl.clientHeight ||
        150;

      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported.");

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Failed to encode PNG.");

      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function onCopyImage() {
    setError("");
    const svg = svgRef.current;
    if (!svg || !canRender) {
      showToast("Nothing to copy.");
      return;
    }

    try {
      const pngBlob = await svgToPngBlob(svg, 3);

      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
        showToast("Copied preview to clipboard.");
        return;
      }

      downloadBlob(pngBlob, `barcode-${value.trim()}.png`);
      showToast("Clipboard unavailable — PNG downloaded.");
    } catch (e) {
      setError(e?.message ?? String(e));
    }
  }

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 24,
      }}
    >
      <style>{`
        @media print {
          body { margin: 0; }
          body * { visibility: hidden !important; }
          .barcode-print-area, .barcode-print-area * { visibility: visible !important; }
          .barcode-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
          }
          .barcode-preview {
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="no-print">
        <h2 style={{ margin: "0 0 12px 0" }}>Code-128 Barcode Generator</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Value
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{
                fontSize: 16,
                padding: "10px 12px",
                border: "1px solid #bbb",
                borderRadius: 10,
                minWidth: 280,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Bar width
            </label>
            <input
              type="number"
              min={1}
              max={6}
              value={barWidth}
              onChange={(e) =>
                setBarWidth(Math.max(1, Math.min(6, Number(e.target.value))))
              }
              style={{
                fontSize: 16,
                padding: "10px 12px",
                border: "1px solid #bbb",
                borderRadius: 10,
                width: 120,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Height
            </label>
            <input
              type="number"
              min={30}
              max={200}
              value={height}
              onChange={(e) =>
                setHeight(Math.max(30, Math.min(200, Number(e.target.value))))
              }
              style={{
                fontSize: 16,
                padding: "10px 12px",
                border: "1px solid #bbb",
                borderRadius: 10,
                width: 120,
              }}
            />
          </div>

          <div style={{ flexBasis: "100%", height: 0 }} />

          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Extra text
            </label>
            <textarea
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Optional label"
              rows={4}
              style={{
                fontSize: 16,
                padding: "10px 12px",
                border: "1px solid #bbb",
                borderRadius: 10,
                minWidth: 320,
                width: 320,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ flexBasis: "100%", height: 0 }} />

          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Text position
            </label>
            <select
              value={labelPosition}
              onChange={(e) => setLabelPosition(e.target.value)}
              style={{
                fontSize: 16,
                padding: "10px 12px",
                border: "1px solid #bbb",
                borderRadius: 10,
                width: 140,
                background: "#fff",
              }}
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Font
            </label>
            <select
              value={labelFontFamily}
              onChange={(e) => setLabelFontFamily(e.target.value)}
              style={{
                fontSize: 16,
                padding: "10px 12px",
                border: "1px solid #bbb",
                borderRadius: 10,
                width: 180,
                background: "#fff",
              }}
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value='"Times New Roman", serif'>Times New Roman</option>
              <option value='"Courier New", monospace'>Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Font size
            </label>
            <input
              type="number"
              min={8}
              max={72}
              value={labelFontSize}
              onChange={(e) =>
                setLabelFontSize(
                  Math.max(8, Math.min(72, Number(e.target.value) || 18))
                )
              }
              style={{
                fontSize: 16,
                padding: "10px 12px",
                border: "1px solid #bbb",
                borderRadius: 10,
                width: 120,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Style
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setLabelBold((v) => !v)}
                style={{
                  fontSize: 14,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #aaa",
                  background: labelBold ? "#dbeafe" : "#e5e5e5",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                B
              </button>

              <button
                type="button"
                onClick={() => setLabelItalic((v) => !v)}
                style={{
                  fontSize: 14,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #aaa",
                  background: labelItalic ? "#dbeafe" : "#e5e5e5",
                  cursor: "pointer",
                  fontStyle: "italic",
                }}
              >
                I
              </button>

              <button
                type="button"
                onClick={() => setLabelUnderline((v) => !v)}
                style={{
                  fontSize: 14,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #aaa",
                  background: labelUnderline ? "#dbeafe" : "#e5e5e5",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                U
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={onCopyImage}
            style={{
              fontSize: 14,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #aaa",
              background: "#e5e5e5",
              color: "#111",
              cursor: "pointer",
            }}
          >
            Copy
          </button>

          <button
            onClick={onPrint}
            style={{
              fontSize: 14,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #aaa",
              background: "#e5e5e5",
              color: "#111",
              cursor: "pointer",
            }}
          >
            Print
          </button>
        </div>

        {toast && <div style={{ marginTop: 10, color: "#166534" }}>{toast}</div>}
        {error && <div style={{ marginTop: 10, color: "#b00020" }}>{error}</div>}

        <hr style={{ margin: "18px 0" }} />
      </div>

      <div className="barcode-print-area">
        <div
          className="barcode-preview"
          style={{
            display: "inline-block",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <svg ref={svgRef} />
        </div>
      </div>

      <svg
        ref={barcodeSourceRef}
        style={{
          position: "absolute",
          left: -99999,
          top: -99999,
          visibility: "hidden",
        }}
      />
    </div>
  );
}