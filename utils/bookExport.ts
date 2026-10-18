// ─── Export des Tagebuchs als Buch (PDF) ─────────────────────────────────────
// Baut ein kleines Fotobuch im A5-Format: Cover, Geburt, ein Kapitel je Phase /
// Lebensjahr und eine Seite pro Moment. Native: PDF erzeugen und teilen.
// Web: Druckdialog des Browsers (dort "Als PDF speichern").

import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { BabyProfile, MomentEntry } from "../types";
import { photoDataUri } from "./storage";
import {
  buildChapters,
  momentTitle,
  momentEmoji,
  momentColor,
  formatMomentDate,
  ageAtDate,
} from "./moments";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");
}

const CONFETTI = ["#FFC857", "#F07B6E", "#8C6CD9", "#4F94D4", "#3FA38A", "#E8789A"];

function confetti(count: number): string {
  let html = "";
  for (let i = 0; i < count; i++) {
    const size = 8 + ((i * 7) % 14);
    const top = (i * 37) % 92;
    const left = (i * 53) % 94;
    html += `<span class="dot" style="width:${size}px;height:${size}px;top:${top}%;left:${left}%;background:${CONFETTI[i % CONFETTI.length]}"></span>`;
  }
  return html;
}

async function photosFor(refs: string[]): Promise<string[]> {
  const uris = await Promise.all(refs.map(photoDataUri));
  return uris.filter((u): u is string => !!u);
}

function momentPage(profile: BabyProfile, m: MomentEntry, photos: string[]): string {
  const color = momentColor(m);
  const photoHtml =
    photos.length === 0
      ? `<div class="sticker" style="background:${color}22">${momentEmoji(m)}</div>`
      : `<div class="photos photos-${Math.min(photos.length, 4)}">${photos
          .slice(0, 4)
          .map((src, i) => `<div class="polaroid" style="transform:rotate(${[-2, 1.5, -1, 2][i]}deg)"><img src="${src}"/></div>`)
          .join("")}</div>`;
  return `
  <section class="page moment">
    ${photoHtml}
    <div class="moment-text">
      <div class="tag" style="background:${color}22;color:${color}">${momentEmoji(m)} ${esc(ageAtDate(profile.birthDate, m.happenedOn))}</div>
      <h2>${esc(momentTitle(m))}</h2>
      <div class="date">${esc(formatMomentDate(m.happenedOn))}</div>
      ${m.note ? `<p class="note">${esc(m.note)}</p>` : ""}
    </div>
  </section>`;
}

export async function buildBookHtml(profile: BabyProfile, moments: MomentEntry[]): Promise<string> {
  const chapters = buildChapters(profile.birthDate, moments);
  const coverRef = profile.photoUri ?? moments.find((m) => m.photos.length > 0)?.photos[0];
  const coverPhoto = coverRef ? await photoDataUri(coverRef) : null;
  const birth = formatMomentDate(profile.birthDate);

  let body = `
  <section class="page cover">
    ${confetti(22)}
    <div class="cover-inner">
      ${coverPhoto ? `<div class="cover-photo"><img src="${coverPhoto}"/></div>` : `<div class="cover-emoji">🌱</div>`}
      <div class="kicker">Unsere Momente mit</div>
      <h1>${esc(profile.name)}</h1>
      <div class="sub">seit dem ${esc(birth)}</div>
    </div>
  </section>
  <section class="page center">
    <div class="big-emoji">👶</div>
    <h2>Willkommen auf der Welt, ${esc(profile.name)}!</h2>
    <p class="lead">Geboren am ${esc(birth)}.<br/>Hier beginnt deine Geschichte.</p>
  </section>`;

  for (const chapter of chapters) {
    body += `
  <section class="page center chapter">
    ${confetti(10)}
    <div class="big-emoji">${chapter.emoji}</div>
    <div class="kicker">${esc(chapter.subtitle)}</div>
    <h2>${esc(chapter.title)}</h2>
    <p class="lead">${chapter.moments.length} ${chapter.moments.length === 1 ? "Moment" : "Momente"}</p>
  </section>`;
    for (const m of chapter.moments) {
      body += momentPage(profile, m, await photosFor(m.photos));
    }
  }

  body += `
  <section class="page center">
    <div class="big-emoji">💛</div>
    <h2>Fortsetzung folgt …</h2>
    <p class="lead">Erstellt mit Mia am ${esc(formatMomentDate(new Date().toISOString()))}</p>
  </section>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: A5; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #2E2A35; background: #FFF8F0; }
  .page { position: relative; width: 148mm; height: 210mm; padding: 16mm 14mm; overflow: hidden; page-break-after: always; break-after: page; background: #FFF8F0; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .dot { position: absolute; border-radius: 50%; opacity: .55; }
  h1 { font-size: 40px; margin: 6px 0 4px; letter-spacing: -0.5px; }
  h2 { font-size: 24px; margin: 6px 0; letter-spacing: -0.3px; }
  .kicker { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #9A92A3; font-weight: 700; }
  .sub, .lead { font-size: 14px; color: #5F5868; line-height: 1.5; }
  .big-emoji { font-size: 64px; margin-bottom: 8px; position: relative; }
  .chapter h2, .chapter .kicker, .chapter .lead { position: relative; }
  .cover { display: flex; align-items: center; justify-content: center; background: #FFF3D6; }
  .cover-inner { position: relative; text-align: center; background: #fff; border-radius: 28px; padding: 22px 20px 26px; width: 100%; box-shadow: 0 8px 24px rgba(46,42,53,.10); }
  .cover-photo { width: 78%; aspect-ratio: 1; margin: 0 auto 16px; border-radius: 22px; overflow: hidden; transform: rotate(-2deg); }
  .cover-photo img { width: 100%; height: 100%; object-fit: cover; }
  .cover-emoji { font-size: 80px; margin: 10px 0 14px; }
  .moment { display: flex; flex-direction: column; }
  .photos { display: grid; gap: 10px; flex: 1; min-height: 0; margin-bottom: 12px; }
  .photos-1 { grid-template-columns: 1fr; }
  .photos-2 { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
  .photos-3, .photos-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
  .photos-3 .polaroid:first-child { grid-column: span 2; }
  .polaroid { background: #fff; padding: 6px 6px 14px; border-radius: 6px; box-shadow: 0 4px 14px rgba(46,42,53,.12); min-height: 0; }
  .polaroid img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; display: block; }
  .sticker { flex: 1; border-radius: 28px; display: flex; align-items: center; justify-content: center; font-size: 96px; margin-bottom: 14px; }
  .moment-text { flex-shrink: 0; }
  .tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
  .date { font-size: 12px; color: #9A92A3; margin-bottom: 8px; }
  .note { font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 14px; line-height: 1.55; color: #5F5868; margin: 6px 0 0; }
</style></head>
<body>${body}</body></html>`;
}

// expo-print druckt im Browser nur die aktuelle Seite — daher das Buch in einem
// unsichtbaren iframe öffnen und dort den Druckdialog starten.
function printHtmlOnWeb(html: string): void {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
  }, 300);
}

export async function exportBook(profile: BabyProfile, moments: MomentEntry[]): Promise<void> {
  const html = await buildBookHtml(profile, moments);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  // A5 in Punkten (1/72 Zoll)
  const { uri } = await Print.printToFileAsync({ html, width: 420, height: 595 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: `${profile.name} – Unsere Momente`,
    });
  } else {
    await Print.printAsync({ uri });
  }
}
