/* Generador de Open Graph PNG (1200x630) con Satori + ResVG
   - Prerender: se emite /og.png como archivo estático en build.
   - Personaliza los textos/colores/logo/screenshot en las constantes de abajo.
*/
export const prerender = true;

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs/promises";
import path from "path";

// =========================
// Config rápida (puedes editar esto)
// =========================
const WIDTH = 1200;
const HEIGHT = 630;

const SITE_NAME = "TePeuVe";
const TITLE = "El TPV para tu tienda";
const SUBTITLE = "Cobra en segundos, factura y controla inventario. VeriFactu-ready.";
const BADGE = "Desde 9,90 €/mes";
const BG_GRADIENT_LIGHT = "linear-gradient(135deg, #F6F0E6 0%, #E9EEF2 100%)";

const LOGO_PATH = "public/logo.png"; // deja vacío "" si no quieres logo
const SCREENSHOT_PATH = "public/assets/features/welcome_page.png"; // deja vacío "" si no quieres screenshot

// =========================
async function fetchFirstFontUrlFromGoogle(cssUrl: string): Promise<string | null> {
  const css = await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  const m = css.match(/url\((https:[^)]+)\)/);
  return m ? m[1] : null;
}

async function loadFontGoogle(family: string, weights: number[], textSample?: string) {
  const fonts: { name: string; data: ArrayBuffer; weight: number; style: "normal" }[] = [];
  for (const w of weights) {
    const cssUrl =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}` +
      (textSample ? `&text=${encodeURIComponent(textSample)}` : "");
    const fontUrl = await fetchFirstFontUrlFromGoogle(cssUrl);
    if (!fontUrl) continue;
    const buf = await fetch(fontUrl).then((r) => r.arrayBuffer());
    fonts.push({ name: family, data: buf, weight: w, style: "normal" });
  }
  return fonts;
}

async function readPublicFile(relPath: string): Promise<Buffer | null> {
  if (!relPath) return null;
  try {
    const full = path.join(process.cwd(), relPath);
    return await fs.readFile(full);
  } catch {
    return null;
  }
}

// =========================
export async function GET() {
  // Carga tipografías
  const sample = `${SITE_NAME} ${TITLE} ${SUBTITLE} ${BADGE}`;
  const manrope = await loadFontGoogle("Manrope", [500, 700], sample);
  const spaceGrotesk = await loadFontGoogle("Space Grotesk", [700], sample);
  const fonts = [...manrope, ...spaceGrotesk];

  // Assets
  const logoBuf = await readPublicFile(LOGO_PATH);
  const logoDataUrl = logoBuf ? `data:image/png;base64,${logoBuf.toString("base64")}` : "";
  const screenshotBuf = await readPublicFile(SCREENSHOT_PATH);
  const screenshotDataUrl = screenshotBuf ? `data:image/png;base64,${screenshotBuf.toString("base64")}` : "";

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          background: BG_GRADIENT_LIGHT,
          fontFamily: "Manrope, sans-serif",
          color: "#0F172A",
          padding: 48,
          boxSizing: "border-box",
        },
        children: [
          // Izquierda: textos
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 18,
                flex: 1,
              },
              children: [
                logoDataUrl
                  ? {
                      type: "img",
                      props: {
                        src: logoDataUrl,
                        width: 90,
                        height: 90,
                        style: {
                          width: 90,
                          height: 90,
                          objectFit: "contain",
                          borderRadius: 16,
                          background: "rgba(255,255,255,.6)",
                          padding: 10,
                        },
                      },
                    }
                  : null,
                {
                  type: "div",
                  props: {
                    style: {
                      fontFamily: "Space Grotesk, Manrope, sans-serif",
                      fontWeight: 700,
                      fontSize: 72,
                      lineHeight: 1.05,
                      letterSpacing: -1.2,
                      maxWidth: 700,
                    },
                    children: TITLE,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 28,
                      lineHeight: 1.35,
                      color: "#445159",
                      maxWidth: 740,
                      fontWeight: 500,
                    },
                    children: SUBTITLE,
                  },
                },
                BADGE
                  ? {
                      type: "div",
                      props: {
                        style: {
                          marginTop: 8,
                          display: "flex",            // antes: "inline-flex" (no soportado)
                          alignItems: "center",
                          gap: 10,
                          alignSelf: "flex-start",    // para que no se estire a todo el ancho
                          fontWeight: 700,
                          fontSize: 20,
                          color: "#0F172A",
                          padding: "10px 14px",
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, rgba(232,202,166,.9), rgba(212,176,136,.9))",
                          border: "1px solid rgba(2,6,23,.12)",
                          boxShadow: "0 10px 30px rgba(2,6,23,.12)",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: "#0F172A",
                              },
                            },
                          },
                          BADGE,
                        ],
                      },
                    }
                  : null,
              ],
            },
          },
          // Derecha: screenshot (opcional)
          screenshotDataUrl
            ? {
                type: "div",
                props: {
                  style: {
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  children: {
                    type: "div",
                    props: {
                      style: {
                        width: 520,
                        height: 340,
                        borderRadius: 20,
                        overflow: "hidden",
                        boxShadow: "0 20px 60px rgba(2,6,23,.22), 0 6px 16px rgba(2,6,23,.12)",
                        border: "1px solid rgba(2,6,23,.08)",
                        background: "#fff",
                        display: "flex",
                      },
                      children: {
                        type: "img",
                        props: {
                          src: screenshotDataUrl,
                          width: 520,
                          height: 340,
                          style: {
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          },
                        },
                      },
                    },
                  },
                },
              }
            : null,
        ],
      },
    } as any,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts,
    }
  );

  const png = new Resvg(svg, { background: "transparent" }).render().asPng();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}