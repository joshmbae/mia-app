// ─── Export des Tagebuchs als Buch (PDF) ─────────────────────────────────────
// Ein kleines Fotobuch im A5-Format im Kuschelwolke-Stil: Cover, Begrüßung,
// ein Kapitel je Phase/Lebensjahr, eine Seite pro Moment, optional eine
// Messlatten-Seite. Native: PDF erzeugen und teilen. Web: Druckdialog.

import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Child, GrowthEntry, MomentEntry } from "../types";
import { photoDataUri } from "./storage";
import { buildChapters, formatMeasurement, momentColor, momentEmoji, momentTitle } from "./moments";
import { ageAtDate, formatDate, pregnancyWeek, todayISO } from "./dates";

export interface BookOptions {
  includeGrowth: boolean;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");
}

const BLOB_COLORS = ["#FFE1D2", "#E3F1FF", "#FFF6D9", "#EAF6EF", "#EFE9FB"];

function blobs(seed: number): string {
  let html = "";
  for (let i = 0; i < 3; i++) {
    const size = 120 + ((seed * 37 + i * 53) % 90);
    const top = (seed * 29 + i * 41) % 80;
    const left = (seed * 17 + i * 67) % 85;
    html += `<span class="blob" style="width:${size}px;height:${size}px;top:${top}%;left:${left}%;background:${BLOB_COLORS[(seed + i) % BLOB_COLORS.length]}"></span>`;
  }
  return html;
}

function ageLabel(child: Child, iso: string): string {
  if (child.kind === "baby") return ageAtDate(child.profile.birthDate, iso);
  return `in SSW ${pregnancyWeek(child.profile.dueDate, iso).week}`;
}

async function photosFor(refs: string[]): Promise<string[]> {
  const uris = await Promise.all(refs.slice(0, 4).map(photoDataUri));
  return uris.filter((u): u is string => !!u);
}

function momentPage(child: Child, m: MomentEntry, photos: string[], index: number): string {
  const color = momentColor(m);
  const photoHtml =
    photos.length === 0
      ? `<div class="sticker" style="background:${color}26"><span>${momentEmoji(m)}</span></div>`
      : `<div class="photos photos-${photos.length}">${photos
          .map((src, i) => `<div class="photo" style="transform:rotate(${[-2, 1.6, -1.2, 2][i]}deg)"><img src="${src}"/></div>`)
          .join("")}</div>`;
  return `
  <section class="page moment">
    ${blobs(index + 3)}
    ${photoHtml}
    <div class="moment-text">
      <div class="tag" style="background:${color}26;color:${color}">${momentEmoji(m)}&nbsp; ${esc(ageLabel(child, m.happenedOn))}</div>
      <h2>${esc(momentTitle(m))}</h2>
      <div class="date">${esc(formatDate(m.happenedOn))}</div>
      ${m.note ? `<p class="note">${esc(m.note)}</p>` : ""}
    </div>
  </section>`;
}

function growthPage(child: Child, growth: GrowthEntry[]): string {
  const rows = growth
    .filter((g) => g.heightCm || g.weightGrams || g.headCm)
    .map(
      (g) => `<div class="g-row"><div class="g-date">${esc(formatDate(g.measuredOn))}<small>${esc(ageLabel(child, g.measuredOn))}</small></div><div class="g-val">${esc(formatMeasurement(g))}</div></div>`
    )
    .join("");
  return `
  <section class="page">
    ${blobs(42)}
    <div class="kicker">Die Messlatte</div>
    <h2>So bist du gewachsen</h2>
    <div class="growth">${rows}</div>
  </section>`;
}

export async function buildBookHtml(child: Child, moments: MomentEntry[], growth: GrowthEntry[], options: BookOptions): Promise<string> {
  const chapters = buildChapters(child, moments);
  const coverRef = (child.kind === "baby" ? child.profile.photoUri : undefined) ?? [...moments].reverse().find((m) => m.photos.length > 0)?.photos[0];
  const coverPhoto = coverRef ? await photoDataUri(coverRef) : null;
  const isBaby = child.kind === "baby";
  const since = isBaby ? `seit dem ${formatDate(child.profile.birthDate)}` : `Termin: ${formatDate(child.profile.dueDate)}`;

  let body = `
  <section class="page cover">
    ${blobs(1)}
    <div class="cover-card">
      ${coverPhoto ? `<div class="cover-photo"><img src="${coverPhoto}"/></div>` : `<div class="cover-initial" style="background:${child.color}">${esc(child.name.charAt(0).toUpperCase())}</div>`}
      <div class="kicker">Unsere Momente mit</div>
      <h1>${esc(child.name)}</h1>
      <div class="sub">${esc(since)}</div>
    </div>
  </section>
  <section class="page center">
    ${blobs(2)}
    <div class="big-emoji">${isBaby ? "🐣" : "🤰"}</div>
    <h2>${isBaby ? `Willkommen auf der Welt, ${esc(child.name)}!` : `Wir freuen uns auf dich, ${esc(child.name)}!`}</h2>
    <p class="lead">${isBaby ? `Geboren am ${esc(formatDate(child.profile.birthDate))}.<br/>Hier beginnt deine Geschichte.` : "Diese Seiten haben wir schon vor deiner Geburt für dich gesammelt."}</p>
  </section>`;

  let index = 0;
  for (const chapter of chapters) {
    body += `
  <section class="page center chapter">
    ${blobs(index + 7)}
    <div class="big-emoji">${chapter.emoji}</div>
    <div class="kicker">${esc(chapter.subtitle)}</div>
    <h2>${esc(chapter.title)}</h2>
    <p class="lead">${chapter.moments.length} ${chapter.moments.length === 1 ? "Moment" : "Momente"}</p>
  </section>`;
    for (const m of chapter.moments) {
      body += momentPage(child, m, await photosFor(m.photos), index++);
    }
  }

  if (options.includeGrowth && growth.length > 0) body += growthPage(child, growth);

  body += `
  <section class="page center">
    ${blobs(99)}
    <div class="big-emoji">💛</div>
    <h2>Fortsetzung folgt …</h2>
    <p class="lead">Erstellt mit Mia am ${esc(formatDate(todayISO()))}</p>
  </section>`;

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A5; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Nunito, "Avenir Next", "Helvetica Neue", sans-serif; color: #3B2F3A; background: #FFF3EA; }
  .page { position: relative; width: 148mm; height: 210mm; padding: 16mm 14mm; overflow: hidden; page-break-after: always; break-after: page; background: #FFF3EA; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .page > *:not(.blob) { position: relative; }
  .center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .blob { position: absolute; border-radius: 50%; opacity: .9; }
  h1, h2 { font-family: Fredoka, "Avenir Next Rounded", sans-serif; font-weight: 700; }
  h1 { font-size: 44px; margin: 6px 0 4px; }
  h2 { font-size: 26px; margin: 6px 0; font-weight: 600; }
  .kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #A797A2; font-weight: 800; }
  .sub, .lead { font-size: 14px; color: #6E5E6A; line-height: 1.5; font-weight: 600; }
  .big-emoji { font-size: 66px; margin-bottom: 8px; }
  .cover { display: flex; align-items: center; justify-content: center; }
  .cover-card { text-align: center; background: #fff; border-radius: 36px; padding: 26px 22px 28px; width: 100%; box-shadow: 0 16px 30px rgba(226,114,91,.18); }
  .cover-photo { width: 74%; aspect-ratio: 1; margin: 0 auto 16px; overflow: hidden; border-radius: 46% 54% 45% 55% / 52% 46% 54% 48%; border: 10px solid #FFE1D2; }
  .cover-photo img { width: 100%; height: 100%; object-fit: cover; }
  .cover-initial { width: 140px; height: 140px; margin: 6px auto 16px; border-radius: 46% 54% 45% 55% / 52% 46% 54% 48%; color: #fff; font-family: Fredoka, sans-serif; font-weight: 700; font-size: 64px; display: flex; align-items: center; justify-content: center; }
  .moment { display: flex; flex-direction: column; }
  .photos { display: grid; gap: 10px; flex: 1; min-height: 0; margin-bottom: 14px; }
  .photos-1 { grid-template-columns: 1fr; }
  .photos-2 { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
  .photos-3, .photos-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
  .photos-3 .photo:first-child { grid-column: span 2; }
  .photo { background: #fff; padding: 7px; border-radius: 26px; box-shadow: 0 10px 22px rgba(59,47,58,.12); min-height: 0; }
  .photo img { width: 100%; height: 100%; object-fit: cover; border-radius: 20px; display: block; }
  .sticker { flex: 1; border-radius: 36px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .sticker span { font-size: 100px; }
  .moment-text { flex-shrink: 0; background: #fff; border-radius: 26px; padding: 14px 16px; box-shadow: 0 10px 22px rgba(226,114,91,.12); }
  .tag { display: inline-block; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; }
  .date { font-size: 12px; color: #A797A2; font-weight: 700; margin-bottom: 4px; }
  .note { font-size: 14px; line-height: 1.55; color: #6E5E6A; margin: 6px 0 0; font-weight: 600; }
  .growth { margin-top: 16px; background: #fff; border-radius: 26px; padding: 6px 16px; box-shadow: 0 10px 22px rgba(242,165,65,.14); }
  .g-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 2px dashed #FFE9DC; gap: 10px; }
  .g-row:last-child { border-bottom: none; }
  .g-date { font-size: 13px; font-weight: 800; }
  .g-date small { display: block; font-size: 11px; color: #A797A2; font-weight: 700; }
  .g-val { font-family: Fredoka, sans-serif; font-weight: 600; font-size: 15px; text-align: right; }
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
  }, 600);
}

export async function exportBook(child: Child, moments: MomentEntry[], growth: GrowthEntry[], options: BookOptions): Promise<void> {
  const html = await buildBookHtml(child, moments, growth, options);
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
      dialogTitle: `${child.name} – Unsere Momente`,
    });
  } else {
    await Print.printAsync({ uri });
  }
}
