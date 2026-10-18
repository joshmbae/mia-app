// ─── Meilensteine als Tagebuch-Momente ───────────────────────────────────────
// Ein Katalog schöner Momente, die Familien festhalten können — mit Datum,
// Fotos und ein paar Zeilen Text. Bewusst OHNE Altersangaben oder Zeitfenster:
// Jedes Kind hat sein eigenes Tempo, es gibt kein "zu früh" und kein "zu spät".
// Die Reihenfolge im Array ist nur eine grobe, natürliche Abfolge zur Anzeige.

export type MilestoneCategory = "schwangerschaft" | "erste_male" | "motorik" | "sprache" | "sozial" | "kognitiv";

export interface Milestone {
  id: string;
  title: string;
  emoji: string;
  category: MilestoneCategory;
  description: string;
  tip?: string;
}

export const CATEGORY_ORDER: MilestoneCategory[] = ["erste_male", "motorik", "sprache", "sozial", "kognitiv", "schwangerschaft"];

/** Reihenfolge der Kategorien während der Schwangerschaft */
export const PREGNANCY_CATEGORY_ORDER: MilestoneCategory[] = ["schwangerschaft"];

export const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  schwangerschaft: "Im Bauch",
  erste_male: "Erste Male",
  motorik: "Bewegung",
  sprache: "Sprache",
  sozial: "Gefühle & Nähe",
  kognitiv: "Entdecken",
};

export const CATEGORY_EMOJIS: Record<MilestoneCategory, string> = {
  schwangerschaft: "🤰",
  erste_male: "✨",
  motorik: "🤸",
  sprache: "💬",
  sozial: "💛",
  kognitiv: "🔭",
};

export const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  schwangerschaft: "#B36BC2",
  erste_male: "#F2A541",
  motorik: "#3FA38A",
  sprache: "#8C6CD9",
  sozial: "#F07B6E",
  kognitiv: "#4F94D4",
};

/** Emoji & Farbe für selbst angelegte Momente */
export const CUSTOM_MOMENT_EMOJI = "🌟";
export const CUSTOM_MOMENT_COLOR = "#E8789A";

export const MILESTONES: Milestone[] = [

  // ── Im Bauch ─────────────────────────────────────────────────────────────────
  { id: "preg_test", title: "Der positive Test", emoji: "💗", category: "schwangerschaft",
    description: "Zwei Striche, ganz viel Herzklopfen — der Moment, in dem alles anfängt." },
  { id: "preg_first_ultrasound", title: "Das erste Ultraschallbild", emoji: "🩻", category: "schwangerschaft",
    description: "Ein kleines Pünktchen auf dem Bildschirm — und vielleicht schon ein flackernder Herzschlag.",
    tip: "Ultraschallbilder verblassen mit der Zeit — ein Foto davon hält länger." },
  { id: "preg_heartbeat", title: "Den Herzschlag hören", emoji: "💓", category: "schwangerschaft",
    description: "Schnell wie ein galoppierendes Pferdchen." },
  { id: "preg_tell_family", title: "Es der Familie erzählen", emoji: "🎁", category: "schwangerschaft",
    description: "Wie haben Oma, Opa und Freunde reagiert?" },
  { id: "preg_first_kick", title: "Der erste Tritt", emoji: "🦶", category: "schwangerschaft",
    description: "Erst ein Blubbern, dann ein deutlicher Stups von innen." },
  { id: "preg_bump", title: "Babybauch-Foto", emoji: "🤰", category: "schwangerschaft",
    description: "Woche für Woche ein bisschen runder.",
    tip: "Immer am selben Ort fotografieren — dann sieht man später schön, wie der Bauch wächst." },
  { id: "preg_name", title: "Den Namen gefunden", emoji: "✍️", category: "schwangerschaft",
    description: "Nach vielen Listen und Diskussionen: Das ist er!" },
  { id: "preg_nursery", title: "Das Kinderzimmer ist fertig", emoji: "🧸", category: "schwangerschaft",
    description: "Ein kleines Nest wartet." },
  { id: "preg_hospital_bag", title: "Kliniktasche gepackt", emoji: "🧳", category: "schwangerschaft",
    description: "Jetzt kann es losgehen." },

  // ── Erste Male ───────────────────────────────────────────────────────────────
  { id: "first_bath", title: "Das erste Bad", emoji: "🛁", category: "erste_male",
    description: "Warmes Wasser, große Augen — das erste Bad ist für viele Familien ein ganz besonderer Moment." },
  { id: "first_walk_outside", title: "Der erste Spaziergang", emoji: "🌳", category: "erste_male",
    description: "Frische Luft, Vogelgezwitscher und vielleicht das erste Nickerchen im Kinderwagen." },
  { id: "first_tooth", title: "Der erste Zahn", emoji: "🦷", category: "erste_male",
    description: "Ein kleines weißes Spitzchen — oft nach ein paar unruhigen Nächten.",
    tip: "Ein gekühlter Beißring kann beim Zahnen wohltun." },
  { id: "first_food", title: "Der erste Brei", emoji: "🥕", category: "erste_male",
    description: "Möhre, Banane oder Avocado? Das erste Essen ist oft eine herrlich chaotische Angelegenheit.",
    tip: "Fotos vom verschmierten Gesicht sind später Gold wert." },
  { id: "first_night_through", title: "Die erste lange Nacht", emoji: "🌙", category: "erste_male",
    description: "Eine Nacht mit langem Schlafstück — ein Geschenk, egal wann (und wie oft) es kommt." },
  { id: "first_trip", title: "Die erste Reise", emoji: "🧳", category: "erste_male",
    description: "Ob Oma besuchen oder ans Meer — der erste Ausflug mit Übernachtung." },
  { id: "first_swim", title: "Das erste Mal im Schwimmbad", emoji: "🏊", category: "erste_male",
    description: "Planschen, Spritzen, Staunen." },
  { id: "first_haircut", title: "Der erste Haarschnitt", emoji: "✂️", category: "erste_male",
    description: "Eine kleine Locke zum Aufbewahren?" },
  { id: "first_snow", title: "Der erste Schnee", emoji: "❄️", category: "erste_male",
    description: "Kalt, weiß, faszinierend — der erste Kontakt mit Schnee." },
  { id: "first_birthday", title: "Der erste Geburtstag", emoji: "🎂", category: "erste_male",
    description: "Ein ganzes Jahr! Kerze, Kuchen und eine Menge Erinnerungen." },
  { id: "first_kita", title: "Der erste Kita-Tag", emoji: "🎒", category: "erste_male",
    description: "Ein großer Schritt — für das Kind und für euch." },
  { id: "first_friend", title: "Der erste Freund / die erste Freundin", emoji: "🤝", category: "erste_male",
    description: "Jemand, auf den sich euer Kind besonders freut." },


  // ── Motorik: Grobmotorik ─────────────────────────────────────────────────────
  {
    id: "head_lift",
    emoji: "🐢",
    title: "Kopf in Bauchlage anheben",
    category: "motorik",
    description:
      "Dein Baby hebt in Bauchlage kurz den Kopf an — erster Schritt zur Kopfkontrolle, die Basis für alles Weitere.",
    tip: "Täglich 5–10 Min Bauchlage (unter Aufsicht) — anfangs auf deiner Brust.",
  },
  {
    id: "head_hold",
    emoji: "🦒",
    title: "Kopf stabil halten",
    category: "motorik",
    description:
      "Kopf und Nacken sind so weit gestärkt, dass dein Baby den Kopf ohne Stütze halten kann.",
    tip: "Tragen in aufrechter Position stärkt die Nackenmuskulatur auf natürliche Weise.",
  },
  {
    id: "roll_front_back",
    emoji: "🔄",
    title: "Drehen: Bauch → Rücken",
    category: "motorik",
    description:
      "Das erste Drehen — meist vom Bauch auf den Rücken, weil der Schwung hilft.",
    tip: "Buntes Spielzeug seitlich in Sichtweite legt den Grundstein fürs Drehen.",
  },
  {
    id: "roll_back_front",
    emoji: "🌀",
    title: "Drehen: Rücken → Bauch",
    category: "motorik",
    description:
      "Dreht von Rücken auf Bauch — erfordert mehr Kraft und Koordination als die andere Richtung.",
    tip: "Ab jetzt nie mehr ungesichert auf dem Wickeltisch lassen.",
  },
  {
    id: "sit_support",
    emoji: "🪑",
    title: "Sitzen mit Unterstützung",
    category: "motorik",
    description:
      "Sitzt mit Rücken- oder Kissenstütze — Rumpfmuskulatur wird aufgebaut.",
    tip: "Kein erzwungenes Sitzen — Bodenzeit ist wichtiger für die Entwicklung.",
  },
  {
    id: "sit_alone",
    emoji: "🧘",
    title: "Alleine sitzen",
    category: "motorik",
    description:
      "Sitzt stabil ohne Unterstützung — Hände sind jetzt frei zum Spielen.",
    tip: "Weiche Unterlage drumherum, falls es fällt — das gehört dazu.",
  },
  {
    id: "crawl",
    emoji: "🐛",
    title: "Krabbeln oder Robben",
    category: "motorik",
    description:
      "Erste echte Fortbewegung — ob Krabbeln, Robben oder Schieben, alle Wege sind entwicklungsrelevant.",
    tip: "Krabbeln stärkt Koordination und Körpermitte. Kein Lauflernwagen in dieser Phase.",
  },
  {
    id: "pull_up",
    emoji: "🧗",
    title: "Hochziehen zum Stehen",
    category: "motorik",
    description:
      "Zieht sich an Möbeln oder Gitter hoch — Beinmuskeln und Gleichgewicht trainieren sich.",
    tip: "Stabile, niedrige Möbel bereitstellen. Tischchen und Stühle sichern.",
  },
  {
    id: "cruise",
    emoji: "🛋️",
    title: "An Möbeln entlanglaufen",
    category: "motorik",
    description:
      "Läuft seitlich an Sofas und Tischen entlang — das Gleichgewicht für freies Laufen wird trainiert.",
    tip: "Eine sichere Route entlangführen — nicht festhalten, es soll selbst balancieren.",
  },
  {
    id: "walk",
    emoji: "👣",
    title: "Freies Laufen",
    category: "motorik",
    description:
      "Die ersten freien Schritte — einer der aufregendsten Momente überhaupt. Jedes Kind macht sie, wenn es bereit ist.",
    tip: "Barfuß auf verschiedenen Böden trainiert das Gleichgewicht am besten. Schuhe erst draußen.",
  },
  {
    id: "climb",
    emoji: "🧗‍♀️",
    title: "Klettern",
    category: "motorik",
    description:
      "Klettert auf Sofas, Stühle und Treppen — Gleichgewicht und Körperbewusstsein werden intensiv trainiert.",
    tip: "Klettern erlauben, aber sichern: Treppengitter, weiche Matten unter Kletterobjekten.",
  },
  {
    id: "stairs",
    emoji: "🪜",
    title: "Treppen steigen",
    category: "motorik",
    description:
      "Steigt Treppen rauf und runter — zunächst mit Festhalten, später freihändig. Koordination und Vertrauen wachsen.",
    tip: "Erst mit Festhalten üben, dann eine Stufe gleichzeitig freihändig. Nie unbeaufsichtigt.",
  },
  {
    id: "run",
    emoji: "🏃",
    title: "Rennen",
    category: "motorik",
    description:
      "Rennt, obwohl die Koordination noch wackelt — Stürze gehören dazu und sind normal.",
    tip: "Weiches Terrain und Raum zum Ausprobieren. Stürze nicht dramatisieren.",
  },
  {
    id: "jump",
    emoji: "🐸",
    title: "Springen",
    category: "motorik",
    description:
      "Springt mit beiden Füßen gleichzeitig vom Boden — erfordert Kraft, Koordination und Vertrauen in den eigenen Körper.",
    tip: "Trampolin-Matratzen, Kissen auf dem Boden — Springen üben macht riesigen Spaß.",
  },
  {
    id: "kick_ball",
    emoji: "⚽",
    title: "Ball kicken",
    category: "motorik",
    description:
      "Tritt gezielt gegen einen Ball — kombiniert Gleichgewicht auf einem Bein mit Koordination.",
    tip: "Großen, leichten Ball verwenden. Vorzeigen und gemeinsam üben.",
  },

  // ── Motorik: Feinmotorik ─────────────────────────────────────────────────────
  {
    id: "hands_midline",
    emoji: "👐",
    title: "Hände zusammenführen",
    category: "motorik",
    description:
      "Bringt beide Hände zur Körpermitte und beobachtet sie — erste bewusste Körperwahrnehmung und Koordination.",
    tip: "Spielzeug über dem Bauch aufhängen (Babygymnastik) motiviert die Hände.",
  },
  {
    id: "reach",
    emoji: "🤲",
    title: "Nach Dingen greifen",
    category: "motorik",
    description:
      "Augen und Hände arbeiten erstmals zusammen — ein enormer Entwicklungsschritt.",
    tip: "Greifspielzeug (Ringe, Rasseln) in Reichweite legen, nicht direkt in die Hand geben.",
  },
  {
    id: "transfer",
    emoji: "🔁",
    title: "Objekte von Hand zu Hand",
    category: "motorik",
    description:
      "Reicht ein Spielzeug von einer Hand in die andere — zeigt bewusste bimanuele Koordination.",
    tip: "Spielzeug anbieten, das eine Hand schon hält — das animiert zum Transferieren.",
  },
  {
    id: "bang",
    emoji: "🥁",
    title: "Dinge zusammenschlagen",
    category: "motorik",
    description:
      "Schlägt zwei Gegenstände gegeneinander — entdeckt, dass Aktionen Geräusche erzeugen.",
    tip: "Holzlöffel, Becher oder Rasseln — alles ist erlaubt (und laut).",
  },
  {
    id: "finger_foods",
    emoji: "🫐",
    title: "Mit Fingern essen",
    category: "motorik",
    description:
      "Nimmt kleine Stücke auf und führt sie zum Mund — kombiniert Feinmotorik mit Selbstständigkeit.",
    tip: "Weiche Stücke anbieten (Banane, gekochte Karotte). Selbst essen fördern, nicht füttern.",
  },
  {
    id: "pincer",
    emoji: "🤏",
    title: "Pinzettengriff",
    category: "motorik",
    description:
      "Greift mit Zeigefinger und Daumen — eine präzise Feinmotorik, die für fast alle späteren Tätigkeiten wichtig ist.",
    tip: "Kleine, sichere Dinge zum Greifen anbieten. Zeigefinger und Daumen gezielt einsetzen lassen.",
  },
  {
    id: "stack_blocks",
    emoji: "🧱",
    title: "Würfel stapeln",
    category: "motorik",
    description:
      "Stapelt 2–4 Würfel aufeinander — kombiniert Feinmotorik, Augen-Hand-Koordination und erste räumliche Planung.",
    tip: "Große, leichte Holzwürfel sind am einfachsten. Begeisterung beim Umwerfen ist normal.",
  },
  {
    id: "throw_ball",
    emoji: "🏀",
    title: "Ball werfen",
    category: "motorik",
    description:
      "Wirft einen Ball gezielt — koordiniert Arm, Körperdrehung und Blick auf ein Ziel.",
    tip: "Leichten, großen Ball verwenden. Hin-und-her-Werfen macht am meisten Spaß.",
  },
  {
    id: "spoon",
    emoji: "🥄",
    title: "Löffel benutzen",
    category: "motorik",
    description:
      "Führt einen Löffel mit Essen zum Mund — noch kleckrig, aber das ist Teil des Lernens.",
    tip: "Dicken Brei anbieten, der am Löffel bleibt. Kleckern aushalten — es ist Übung.",
  },
  {
    id: "scribble",
    emoji: "🖍️",
    title: "Kritzeln mit Stift",
    category: "motorik",
    description:
      "Hält einen Stift und kritzelt auf Papier — erste Verbindung zwischen Handlung und sichtbarem Ergebnis.",
    tip: "Große Wachsstifte, viel Papier. Das Kritzeln selbst ist das Ziel, kein Ergebnis erwartet.",
  },

  // ── Sprache ──────────────────────────────────────────────────────────────────
  {
    id: "coo",
    emoji: "🐣",
    title: "Gurren & erste Laute",
    category: "sprache",
    description:
      "Gibt weiche, kehlige Laute von sich — erste Kommunikationsversuche jenseits des Weinens.",
    tip: "Auf jeden Laut eingehen und antworten — das zeigt dem Baby, dass seine Stimme zählt.",
  },
  {
    id: "vocal_turn",
    emoji: "🗨️",
    title: "Lautgespräche führen",
    category: "sprache",
    description:
      "Wartet auf deine Reaktion, äußert einen Laut, wartet wieder — ein echter Dialog ohne Worte.",
    tip: "Pause machen nach einem Laut des Babys und es 'antworten lassen'. Kein Überreden.",
  },
  {
    id: "babble",
    emoji: "🎶",
    title: "Silben plappern",
    category: "sprache",
    description:
      "'Mamama', 'bababa', 'dadada' — noch ohne Bedeutung, aber die Sprechorgane und das Gehirn üben intensiv.",
    tip: "Auf Laute eingehen, antworten, erweitern — Konversationen imitieren.",
  },
  {
    id: "name_response",
    emoji: "👂",
    title: "Auf eigenen Namen reagieren",
    category: "sprache",
    description:
      "Dreht sich um oder schaut, wenn der eigene Name gerufen wird — das Gehirn verarbeitet Sprache als bedeutungsvoll.",
    tip: "Namen konsequent in natürlichem Ton nutzen — nicht im Befehlston.",
  },
  {
    id: "understands_no",
    emoji: "🙅",
    title: 'Versteht "Nein"',
    category: "sprache",
    description:
      "Hält inne oder schaut, wenn 'Nein' gesagt wird — zeigt, dass einzelne Wörter verstanden werden.",
    tip: "Klar und ruhig sagen, nicht schreien. Konsequenz ist wichtiger als Lautstärke.",
  },
  {
    id: "follow_simple",
    emoji: "📦",
    title: "Einfache Aufforderungen verstehen",
    category: "sprache",
    description:
      "Holt einen Ball, wenn man 'Bring mir den Ball' sagt — Sprache verbindet sich mit Handlung.",
    tip: "Aufforderungen mit Geste kombinieren ('Komm her' + Hand ausstrecken) erleichtert den Einstieg.",
  },
  {
    id: "first_words",
    emoji: "🗣️",
    title: "Erste gezielte Wörter",
    category: "sprache",
    description:
      "'Mama', 'Papa', 'da', 'nein' — das erste Mal gezielt und mit Bedeutung benutzt. Revolutionär.",
    tip: "Wörter natürlich wiederholen, nie als Übung erzwingen.",
  },
  {
    id: "body_parts",
    emoji: "👃",
    title: "Körperteile zeigen",
    category: "sprache",
    description:
      "Zeigt auf Nase, Mund, Bauch wenn gefragt — Sprache und Körperwahrnehmung verbinden sich.",
    tip: "Beim Baden spielerisch benennen: 'Wo ist die Nase?' Keine Pflichtübung daraus machen.",
  },
  {
    id: "vocab_10",
    emoji: "🔟",
    title: "10 Wörter sprechen",
    category: "sprache",
    description:
      "Nutzt aktiv etwa 10 einzelne Wörter — auch 'Babyversionen' wie 'wau-wau' oder 'wauwau' zählen.",
    tip: "Jedes neue Wort feiern. Korrekte Aussprache kommt von selbst — nicht korrigieren.",
  },
  {
    id: "two_words",
    emoji: "💬",
    title: "Zwei-Wort-Sätze",
    category: "sprache",
    description:
      "'Mehr Saft', 'Mama da', 'Hund groß' — die Grammatik beginnt sich zu formen.",
    tip: "Sätze leicht erweitern: Kind sagt 'Ball' → Du sagst 'Ja, der rote Ball!'",
  },
  {
    id: "vocab_50",
    emoji: "📚",
    title: "50 Wörter sprechen",
    category: "sprache",
    description:
      "Wortschatz-Explosion — viele Kinder lernen jetzt täglich 1–3 neue Wörter. Ein enormer Schub.",
    tip: "Vorlesen, Benennen im Alltag, Lieder — Sprache ist Input, der sich summiert.",
  },

  // ── Sozial & Gefühle ─────────────────────────────────────────────────────────
  {
    id: "eye_contact",
    emoji: "👀",
    title: "Augenkontakt halten",
    category: "sozial",
    description:
      "Hält gezielt Blickkontakt — das Gesicht der Bezugsperson ist das faszinierendste Objekt der Welt.",
    tip: "Nah am Gesicht sprechen (20–30 cm), langsam sprechen, Pausen lassen.",
  },
  {
    id: "smile",
    emoji: "😊",
    title: "Soziales Lächeln",
    category: "sozial",
    description:
      "Das erste echte Lächeln als Reaktion auf dein Gesicht — kein Reflex mehr. Das Gehirn erkennt dich als vertraute, sichere Person.",
    tip: "Lächle viel zurück und sprich dabei — das verstärkt die Verbindung.",
  },
  {
    id: "mirror_faces",
    emoji: "😜",
    title: "Mimik nachahmen",
    category: "sozial",
    description:
      "Ahmt Mundbewegungen oder Zungenzeigen nach — der Beginn von Empathie und sozialem Lernen.",
    tip: "Übertriebene Mimik machen (weit öffnen, staunen) — das motiviert zur Nachahmung.",
  },
  {
    id: "laugh",
    emoji: "😂",
    title: "Lachen",
    category: "sozial",
    description:
      "Lautes, echtes Lachen als soziale Reaktion — zeigt Freude und soziale Verbindung.",
    tip: "Leichtes Kitzeln, lustige Geräusche, Guck-Guck — alles ist erlaubt.",
  },
  {
    id: "separation_anxiety",
    emoji: "🫂",
    title: "Trennungsangst",
    category: "sozial",
    description:
      "Weint, wenn du das Zimmer verlässt — zeigt, wie stark die Bindung ist. Kein Rückschritt, sondern gesunde Entwicklung.",
    tip: "Kurze Abwesenheiten ankündigen und konsequent zurückkommen — Verlässlichkeit ist die Lösung.",
  },
  {
    id: "stranger_anxiety",
    emoji: "🙈",
    title: "Fremdeln",
    category: "sozial",
    description:
      "Weint bei Fremden, sucht Nähe der Bezugsperson — Beweis gesunder Bindungsentwicklung.",
    tip: "Nicht erzwingen, dass Fremde das Baby halten. Fremdeln geht von selbst vorbei.",
  },
  {
    id: "wave",
    emoji: "👋",
    title: "Winken",
    category: "sozial",
    description:
      "Winkt 'Hallo' und 'Tschüss' — soziale Kommunikation durch Geste, ein Vorläufer der Sprache.",
    tip: "Konsequent winken beim Kommen und Gehen — Imitation ist der Motor.",
  },
  {
    id: "imitate_actions",
    emoji: "🐒",
    title: "Aktionen nachahmen",
    category: "sozial",
    description:
      "Klatscht, wenn du klatschst — ahmt einfache Handlungen nach und lernt durch Beobachtung.",
    tip: "Alltägliche Handlungen bewusst und langsam vorzeigen: Hände waschen, Zähne putzen.",
  },
  {
    id: "pointing",
    emoji: "👉",
    title: "Zeigen auf Dinge",
    category: "sozial",
    description:
      "'Shared attention' — zeigt auf Dinge, die es interessant findet oder will. Wichtiger sozialer und sprachlicher Meilenstein.",
    tip: "Auf alles eingehen, was gezeigt wird, und benennen: 'Ja, das ist ein Vogel!'",
  },
  {
    id: "express_emotions",
    emoji: "🎭",
    title: "Gefühle ausdrücken",
    category: "sozial",
    description:
      "Zeigt Freude, Ärger, Enttäuschung klar — und beginnt, auf die Gefühle anderer zu reagieren.",
    tip: "Gefühle benennen: 'Du bist gerade traurig, weil...' — das gibt Worten eine Bedeutung.",
  },
  {
    id: "empathy",
    emoji: "💗",
    title: "Erste Empathie",
    category: "sozial",
    description:
      "Tröstet eine weinende Puppe oder ein trauriges Kind — zeigt Theory of Mind in erster Form.",
    tip: "Gefühle vorleben und benennen. Kein Erzwingen von Trösten.",
  },
  {
    id: "parallel_play",
    emoji: "🧸",
    title: "Parallelspiel",
    category: "sozial",
    description:
      "Spielt neben anderen Kindern, noch nicht wirklich mit ihnen — das ist normale erste Sozialentwicklung, kein Zeichen von Desinteresse.",
    tip: "Spieldates ermöglichen. Nicht auf gemeinsames Spiel drängen — Parallelspiel ist der natürliche erste Schritt.",
  },

  // ── Denken & Lernen ──────────────────────────────────────────────────────────
  {
    id: "tracking",
    emoji: "🎈",
    title: "Bewegungen verfolgen",
    category: "kognitiv",
    description:
      "Folgt einem sich bewegenden Gesicht oder Spielzeug mit den Augen — visuelles Tracking, Grundlage späterer Kognition.",
    tip: "Langsame Bewegungen mit buntem Spielzeug oder dem eigenen Gesicht.",
  },
  {
    id: "voice_recognition",
    emoji: "🎧",
    title: "Bekannte Stimmen erkennen",
    category: "kognitiv",
    description:
      "Dreht sich zur vertrauten Stimme — das Gehirn hat sie bereits vor der Geburt gespeichert.",
    tip: "Viel sprechen, singen, vorlesen — besonders in ruhiger Umgebung.",
  },
  {
    id: "cause_effect",
    emoji: "💡",
    title: "Ursache & Wirkung",
    category: "kognitiv",
    description:
      "Merkt, dass Handlungen Konsequenzen haben ('Ich schüttle die Rassel → es macht Geräusch').",
    tip: "Spielzeug mit Ursache-Wirkung-Mechanismus (Knopf drücken → Tier erscheint).",
  },
  {
    id: "oral_explore",
    emoji: "🔍",
    title: "Alles erkunden & testen",
    category: "kognitiv",
    description:
      "Steckt alles in den Mund — das ist kein Unsinn, sondern die effizienteste Sinneserkundung in diesem Alter.",
    tip: "Ausreichend sicheres Spielzeug bereitstellen und gefährliche Objekte aus Reichweite räumen.",
  },
  {
    id: "object_permanence",
    emoji: "🙉",
    title: "Objektpermanenz",
    category: "kognitiv",
    description:
      "Sucht nach Dingen, die verschwunden sind — versteht, dass Objekte existieren, auch wenn sie nicht sichtbar sind.",
    tip: "Guck-Guck und Verstecken unter Tuch spielen — das ist kein Spaß, sondern kognitive Übung.",
  },
  {
    id: "containers",
    emoji: "🧺",
    title: "Dinge in Behälter legen",
    category: "kognitiv",
    description:
      "Legt Spielzeug gezielt in eine Box und leert sie wieder — versteht räumliche Beziehungen.",
    tip: "Eimer mit großen Ringen oder Bällen anbieten. Das Ein-und-Ausräumen nicht unterbrechen.",
  },
  {
    id: "book_pictures",
    emoji: "📖",
    title: "Bilder in Büchern zeigen",
    category: "kognitiv",
    description:
      "Zeigt auf Bilder, wenn man fragt: 'Wo ist der Hund?' — verbindet Sprache mit Darstellungen.",
    tip: "Einfache Pappbücher mit klaren Bildern. Auf das zeigen, was du benennst.",
  },
  {
    id: "shape_sort",
    emoji: "🔷",
    title: "Formen stecken",
    category: "kognitiv",
    description:
      "Steckt einfache Formen (Kreis, Dreieck) in das passende Loch — räumliches Denken und Problemlösen.",
    tip: "Einfaches Formensortierspielzeug mit 2–3 Formen. Nicht vorführen, sondern ausprobieren lassen.",
  },
  {
    id: "symbolic_play",
    emoji: "☕",
    title: "Symbolisches Spielen",
    category: "kognitiv",
    description:
      "Füttert eine Puppe, telefoniert mit einem Baustein — nutzt Objekte als Symbole für etwas anderes.",
    tip: "Spielzeugküche, Puppen, Fahrzeuge — und mitspielen, nicht vorspielen.",
  },
  {
    id: "mirror_self",
    emoji: "🪞",
    title: "Sich im Spiegel erkennen",
    category: "kognitiv",
    description:
      "Zeigt auf sich im Spiegel, wenn gefragt, oder wischt einen Fleck von der eigenen Nase — Selbstwahrnehmung entsteht.",
    tip: "Großen Spiegel in Bodennähe anbieten. Gemeinsam schauen und benennen.",
  },
  {
    id: "simple_puzzle",
    emoji: "🧩",
    title: "Einfache Puzzles lösen",
    category: "kognitiv",
    description:
      "Legt 2–3 Teile in ein Einlegepuzzle — Problemlösen, räumliches Denken und Ausdauer.",
    tip: "Mit 2-teiligen Holzpuzzles beginnen. Nicht die Lösung zeigen — Fehler gehören dazu.",
  },
];
