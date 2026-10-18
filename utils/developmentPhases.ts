// ─── Kinderentwicklung 0–36 Monate ───────────────────────────────────────────
// Quellen: CDC "Learn the Signs. Act Early." (cdc.gov/actearly),
// American Academy of Pediatrics (AAP), NIH StatPearls, WHO Child Growth Standards
//
// Nutzungshinweis für die App:
// "Entwicklungsinformationen basieren auf CDC- und AAP-Richtlinien.
//  Jedes Kind entwickelt sich in seinem eigenen Tempo.
//  Bei Fragen wende dich an deine Kinderärztin oder Hebamme."
//
// Lizenz: Die zugrundeliegenden Meilensteine (CDC, AAP, WHO) sind
// öffentliches Gesundheitswissen und frei zitierbar.
// ─────────────────────────────────────────────────────────────────────────────

export interface DevelopmentPhase {
  id: string;

  // Zeitraum
  weeksFrom: number;        // Alter in Wochen ab Geburt (nicht ET)
  weeksTo: number;
  ageLabel: string;         // Anzeige für UI: nur der Beginn ("ab 3 Monaten"), bewusst kein Zeitfenster

  // Inhalt
  title: string;            // Kurzer Name der Phase
  emoji: string;
  summary: string;          // 2 Sätze — was ist der Kern dieser Phase

  typical: string[];        // Was viele Familien in dieser Zeit erleben (3–4 Punkte)
  parentTip: string;        // 1 konkreter Tipp — was Eltern jetzt tun können
  forParents: string;       // Ehrlicher Mental-Health / Erschöpfungs-Hinweis
  developmentHint?: string; // Intensive Entwicklungsphase — wann vorhanden
}

export const DEVELOPMENT_PHASES: DevelopmentPhase[] = [

  // ─── NEUGEBORENES ──────────────────────────────────────────────────────────

  {
    id: "w01-02",
    weeksFrom: 0,
    weeksTo: 2,
    ageLabel: "ab der Geburt",
    title: "Ankommen in der Welt",
    emoji: "🌱",
    summary:
      "Dein Baby verarbeitet gerade den größten Wechsel seines Lebens — von der warmen, dunklen Gebärmutter in eine vollkommen neue Welt. Die wichtigste Aufgabe jetzt: Wärme, Nähe und regelmäßiges Trinken.",
    typical: [
      "Schläft 16–20 Stunden täglich, in kurzen Phasen — kein Durchschlafen erwarten",
      "Trinkt alle 2–3 Stunden, auch nachts",
      "Weint als einzige Kommunikation (Hunger, Nässe, Müdigkeit, Überstimulation)",
      "Verliert in den ersten Tagen bis zu 10 % des Geburtsgewichts — holt das meist bis Woche 2 auf",
    ],
    parentTip:
      "Haut-zu-Haut-Kontakt (Känguru-Pflege) beruhigt das Baby und reguliert seinen Herzschlag und seine Temperatur. Deine Stimme ist die vertrauteste Sache der Welt für dein Kind — einfach reden reicht.",
    forParents:
      "Die ersten zwei Wochen sind für viele Eltern die härteste Zeit überhaupt — Schlafentzug, Unsicherheit, Hormone. Das ist nicht Versagen, das ist Normalität. Baby-Blues (Stimmungstiefs in den ersten Wochen) ist sehr häufig. Hält er länger als zwei Wochen an oder wird stärker, sprich mit deiner Hebamme — postpartale Depression ist gut behandelbar. Telefonseelsorge: 0800 111 0 111 (kostenlos, 24h).",
  },

  {
    id: "w02-06",
    weeksFrom: 2,
    weeksTo: 6,
    ageLabel: "ab 2 Wochen",
    title: "Erste Verbindungen",
    emoji: "🤍",
    summary:
      "Das Baby wird zum aktiven Gesprächspartner. Erste Vokale und Gurren entstehen — und das erste echte Lächeln kündigt sich an. Eine der aufregendsten Phasen.",
    typical: [
      "Weinpeak oft bei Woche 6 — der schwierigste Moment für viele Eltern",
      "Koliken (untröstliches Weinen über 3 Stunden) betreffen ca. 20 % der Babys",
      "Schläft noch 15–18 Stunden, aber wacher in kurzen Phasen",
      "Unterscheidet Tag und Nacht noch nicht zuverlässig",
    ],
    parentTip:
      "Auf jedes Gurren eingehen und antworten — Baby wartet auf Reaktion und antwortet dann. So lernt es die Grundstruktur von Dialog.",
    forParents:
      "Der Weinpeak bei Woche 6 überrascht viele Eltern, die dachten, es wird langsam besser. Wenn du nachts alleine bist und das Baby nicht aufhört zu weinen: Baby sicher ablegen, kurz in ein anderes Zimmer gehen, durchatmen. Das ist Selbstfürsorge, kein Versagen.",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Woche 4): Das Gehirn verarbeitet die neue Umgebung intensiv — alle Sinne werden aktiver. Mehr Quengeln, Schlafschwierigkeiten und Nähebedarf in dieser Zeit sind biologisch normal. Quelle: AAP Developmental Surveillance.",
  },

  // ─── MONAT 1–3 ─────────────────────────────────────────────────────────────

  {
    id: "w06-09",
    weeksFrom: 6,
    weeksTo: 9,
    ageLabel: "ab 6 Wochen",
    title: "Das erste Lächeln",
    emoji: "😊",
    summary:
      "Bei vielen Babys taucht jetzt irgendwann das soziale Lächeln auf — als Reaktion auf dich, nicht zufällig. Das Gehirn macht jetzt riesige Sprünge in der sozialen Wahrnehmung.",
    typical: [
      "Weinphasen noch häufig — aber das erste Lächeln verändert alles emotional",
      "Wachphasen werden etwas länger (30–60 Min am Stück)",
      "Erster sozialer Blickkontakt mit bewusstem Lächeln",
    ],
    parentTip:
      "Kontrastreiche Muster zeigen (Schwarz-Weiß, Gesichter). Auf jedes Lächeln reagieren und wiederholen — das ist Dialog-Lernen.",
    forParents:
      "Wenn du dich oft leer, abgeschnitten oder traurig fühlst — auch als Vater — ist das kein Zeichen von Schwäche. Postpartale Depressionen kommen bei Vätern in 10 % der Fälle vor. Du musst das nicht alleine tragen.",
  },

  {
    id: "w09-13",
    weeksFrom: 9,
    weeksTo: 13,
    ageLabel: "ab 9 Wochen",
    title: "Entdecken & Staunen",
    emoji: "🔍",
    summary:
      "Das Baby wird aktiver und deutlich wacher. Es entdeckt die eigenen Hände und führt erste 'Gespräche' mit Lauten. Die Welt ist faszinierend.",
    typical: [
      "Wachphasen werden deutlich länger (1–2 Stunden am Stück)",
      "Schlaf beginnt sich langsam zu strukturieren — aber kein Durchschlafen erwarten",
      "Weniger Weinen als in den ersten Wochen",
      "Sehr interessiert an der Umgebung",
    ],
    parentTip:
      "Mobile übers Bett oder Spielbogen mit greifbaren Elementen. Bauchlage täglich 10–15 Minuten — wird später für Krabbeln wichtig.",
    forParents:
      "Jetzt ist ein guter Zeitpunkt, eine sanfte Schlaf-Routine einzuführen — nicht als strenger Zeitplan, sondern als Signale: Baden → Stillen/Füttern → Schlaflied. Vorhersehbarkeit hilft dem Gehirn, sich zu beruhigen.",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Woche 7): Das Gehirn baut neuronale Vernetzungen für Mustererkennung auf — das Baby erkennt Muster in Bildern, Klängen und Bewegungen. Mehr Quengeln und Nähebedarf sind typisch. Quelle: AAP.",
  },

  // ─── MONAT 3–6 ─────────────────────────────────────────────────────────────

  {
    id: "m03-04",
    weeksFrom: 13,
    weeksTo: 18,
    ageLabel: "ab 3 Monaten",
    title: "Hände entdecken",
    emoji: "✋",
    summary:
      "Hände und Augen beginnen zusammenzuarbeiten. Das Baby beginnt, die Welt mit den Händen zu erkunden. Gleichzeitig beginnt eines der bekanntesten Phänomene: die Schlafregression um Monat 4.",
    typical: [
      "Schläft möglicherweise plötzlich schlechter — Schlafzyklen verändern sich um Monat 4 biologisch",
      "Legt alles in den Mund (Erkunden, kein Hunger)",
      "Quengeliger abends — oft Überstimulation nach aktivem Tag",
      "Will mehr Aufmerksamkeit und Nähe",
    ],
    parentTip:
      "Greifspielzeug in Reichweite legen — nicht in die Hand geben. Das Auge-Hand-Greifen selbst zu entdecken ist der eigentliche Lernmoment.",
    forParents:
      "Die Schlafregression um Monat 4 trifft viele Eltern unvorbereitet — gerade wenn es endlich besser geworden war. Sie ist biologisch bedingt: Schlafzyklen reifen, das Baby wacht in leichteren Phasen öfter auf. Das geht vorbei. Konsistenz in der Routine hilft.",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Monat 3): Das Gehirn verarbeitet Übergänge — Licht, Klang, Bewegung, Stimmungen werden als Kontinuum wahrgenommen. Mehr Quengeln ist typisch. Quelle: AAP.",
  },

  {
    id: "m04-06",
    weeksFrom: 18,
    weeksTo: 27,
    ageLabel: "ab 4 Monaten",
    title: "Entdecker auf dem Bauch",
    emoji: "🚀",
    summary:
      "Viele Babys werden jetzt beweglicher und neugieriger — und entdecken, dass sie selbst etwas bewirken können. Beikost steht vor der Tür — ein komplett neues Kapitel.",
    typical: [
      "Zeigt Interesse an Essen der Eltern (Beikost-Signal)",
      "Fremdeln beginnt sich anzukündigen",
      "Alles wandert in den Mund — Zahnung kann beginnen",
      "Wachphasen deutlich länger, Schlaf etwas stabiler (nicht bei allen)",
    ],
    parentTip:
      "Beikost ab Monat 6: Brei oder Baby-Led Weaning — beide Wege funktionieren. Freies Liegen und Spielen auf dem Boden fördert Motorik am besten (kein Sitzen erzwingen).",
    forParents:
      "Wenn du noch stillst und Beikost einführst: Beides kombinieren ist problemlos, solange du willst. Die WHO empfiehlt Stillen bis mindestens 6 Monate, gerne länger. Es gibt kein Richtig oder Falsch.",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Monat 4): Baby versteht Ursache und Wirkung bewusster, Objektpermanenz beginnt. Das Kind merkt: Dinge existieren weiter, auch wenn sie nicht sichtbar sind. Quelle: AAP, NIH StatPearls.",
  },

  // ─── MONAT 6–9 ─────────────────────────────────────────────────────────────

  {
    id: "m06-07",
    weeksFrom: 27,
    weeksTo: 31,
    ageLabel: "ab 6 Monaten",
    title: "Nähe & Fremdeln",
    emoji: "💞",
    summary:
      "Ein großer Schritt zur Eigenständigkeit — und gleichzeitig der Beginn des Fremdelns. Das ist kein Rückschritt, sondern ein Zeichen, dass dein Baby Bindungspersonen sicher erkennt.",
    typical: [
      "Fremdelt stark — weint bei Fremden, sucht Nähe der Bezugsperson",
      "Schläft evtl. schlechter — Separationsangst beginnt",
      "Erkundet aktiv — legt alles in den Mund",
      "Sehr eigenständig und gleichzeitig sehr bindungssuchend",
    ],
    parentTip:
      "Fremdeln respektieren — nicht erzwingen, dass Fremde das Baby halten. Peekaboo trainiert Objektpermanenz: 'Dinge verschwinden nicht für immer.'",
    forParents:
      "Fremdeln ist für Großeltern und Verwandte oft schmerzhaft. Erkläre ihnen: Das ist ein Zeichen gesunder Bindung, kein Persönlichkeitsproblem des Kindes. Es geht vorbei — Geduld und kein Zwang helfen.",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Monat 6): Baby versteht räumliche Beziehungen und Entfernungen. Trennungsangst und Objektpermanenz entstehen gleichzeitig. Quelle: AAP, NIH StatPearls.",
  },

  {
    id: "m07-09",
    weeksFrom: 31,
    weeksTo: 39,
    ageLabel: "ab 7 Monaten",
    title: "Mobil & neugierig",
    emoji: "🐛",
    summary:
      "Die Welt gehört jetzt dem Baby. Erste Fortbewegung bedeutet Freiheit — und neue Gefahren. Gleichzeitig wächst der passive Wortschatz rasant: das Baby versteht viel mehr als es sagt.",
    typical: [
      "Trennungsangst kann sehr stark sein — weint wenn du das Zimmer verlässt",
      "Stopft alles in den Mund (Babyproofing jetzt kritisch)",
      "Schläft möglicherweise schlechter — Mobilitätsschub",
      "Sehr aktiv und explorativ",
    ],
    parentTip:
      "Wohnung babyproofing: Steckdosen, Schranktüren, kleine Gegenstände entfernen. Eine sichere Umgebung gibt dir Entspannung und dem Baby Freiheit.",
    forParents:
      "Mit der Mobilität beginnt die 'Augen-überall'-Phase. Das ist real erschöpfend. Babyproofing schafft Sicherheit — du musst nicht jede Sekunde dabei sein, wenn die Umgebung sicher ist. Das ist keine schlechte Elternschaft, das ist kluge Planung.",
  },

  // ─── MONAT 9–12 ────────────────────────────────────────────────────────────

  {
    id: "m09-12",
    weeksFrom: 39,
    weeksTo: 52,
    ageLabel: "ab 9 Monaten",
    title: "Verstehen & Entdecken",
    emoji: "💡",
    summary:
      "Ein bedeutsamer kognitiver Schritt: Das Baby sucht versteckte Gegenstände aktiv — es versteht, dass Dinge existieren, auch wenn es sie nicht sieht. Bei manchen Kindern tauchen erste Wörter auf — bei anderen dauert das noch, beides ist gut.",
    typical: [
      "Trennungsangst kann in diesem Alter sehr stark sein",
      "Tagsüber oft auf 1 Schlaf reduziert",
      "Wählerisch beim Essen beginnt — Neo-Phobie ist normal",
      "Wer schon steht oder läuft, purzelt oft — das gehört dazu",
    ],
    parentTip:
      "Versteckspiele wie Kuckuck trainieren aktiv Objektpermanenz. Was wie Spaß aussieht, ist gleichzeitig kognitive Hochleistungsarbeit.",
    forParents:
      "Der erste Geburtstag ist auch dein Jahrestag als Elternteil. Ein Jahr durchgemacht, gewachsen, nicht aufgegeben — das verdient echte Anerkennung, auch von dir selbst. Nimm dir einen Moment: Was hat dich überrascht? Was hat dich stolz gemacht?",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Monat 9): Baby ordnet die Welt in Kategorien — alle Hunde sind 'Hunde'. Konstruktives Spielen (Stapeln, Sortieren) ist ein Ausdruck dieser kognitiven Reifung. Quelle: NIH StatPearls, AAP.",
  },

  // ─── MONAT 12–18 ───────────────────────────────────────────────────────────

  {
    id: "m12-15",
    weeksFrom: 52,
    weeksTo: 65,
    ageLabel: "ab 1 Jahr",
    title: "Vom Baby zum Kleinkind",
    emoji: "👣",
    summary:
      "Aus dem Baby wird ein Kleinkind. Manche Kinder machen jetzt erste Schritte, andere lassen sich damit noch viel Zeit — beides ist völlig in Ordnung.",
    typical: [
      "Erste Trotzanfälle — kurzangebunden, schnell vergessen",
      "Wählerisch beim Essen — kein Machtkampf daraus machen",
      "Trennungsangst kann wieder stärker werden",
      "Stürze gehören zum Laufen lernen dazu",
    ],
    parentTip:
      "Barfuß auf verschiedenen Böden fördert das Gleichgewicht am besten. Schuhe erst draußen. Stürze nicht überdramatisieren — das signalisiert dem Kind, ob es sich traut weiterzumachen.",
    forParents:
      "Trotz ist kein böses Verhalten — es ist Selbstausdruck ohne sprachliche Mittel. Das Kind ist frustriert, nicht manipulativ. Ruhig bleiben und die Emotion benennen ('Du bist gerade wütend, weil...') hilft langfristig.",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Monat 12): Kind versteht, dass es verschiedene Wege zum gleichen Ziel gibt — es plant und wählt Strategien (Piaget: präoperationale Phase beginnt). Quelle: NIH StatPearls, AAP.",
  },

  {
    id: "m15-18",
    weeksFrom: 65,
    weeksTo: 78,
    ageLabel: "ab 15 Monaten",
    title: "Sprache & Selbstwille",
    emoji: "💬",
    summary:
      "Manche Kinder lernen in dieser Phase täglich ein neues Wort. Verstehen kommt immer vor Sprechen — das Kind versteht oft fünfmal so viel wie es sagt. Vorlesen ist jetzt der stärkste Sprachbooster.",
    typical: [
      "Trotzanfälle entstehen — kurz, intensiv, schnell vergessen",
      "Will alles selbst machen — braucht dabei aber oft Hilfe",
      "Schläft tagsüber noch 1 Mal",
      "Versteht viel mehr als es sagen kann — Frustration wenn die Sprache fehlt",
    ],
    parentTip:
      "Wahlmöglichkeiten geben ('Willst du das rote oder das blaue?') gibt dem Kind Gefühl von Kontrolle — und reduziert Trotz erheblich.",
    forParents:
      "Du kannst nicht zu viel vorlesen. Kinder, denen täglich vorgelesen wird, haben mit 5 Jahren einen um Jahre größeren Wortschatz. 10 Minuten am Tag reichen — das gleiche Buch 20 Mal ist völlig normal und gut.",
  },

  // ─── MONAT 18–24 ───────────────────────────────────────────────────────────

  {
    id: "m18-21",
    weeksFrom: 78,
    weeksTo: 91,
    ageLabel: "ab 1½ Jahren",
    title: "Ich-Phase beginnt",
    emoji: "🙋",
    summary:
      "'Ich!' und 'Nein!' werden häufiger. Das Kind entdeckt seine Identität als eigene Person. Das ist anstrengend und wunderbar zugleich — und absolut gesund.",
    typical: [
      "Starke Trotzphasen — emotional sehr intensiv",
      "Will Autonomie: selbst entscheiden, selbst machen",
      "Wählerisch beim Essen (Neophobie-Peak)",
      "Schläft auf 1 Mittagsschlaf oder gar keinen mehr",
    ],
    parentTip:
      "Routinen stärken — Vorhersehbarkeit reduziert Trotz erheblich. Emotionen benennen: 'Du bist wütend, weil...' ist langfristig wirksamer als Ignorieren.",
    forParents:
      "\"Ich mache das falsch\" ist in dieser Phase fast nie richtig. Liebevolles, konsequentes Elternsein — auch wenn es sich chaotisch anfühlt — ist genug. Kein Elternteil ist immer geduldig. Das Ziel ist nicht Perfektion.",
    developmentHint:
      "Intensive Entwicklungsphase (oft ab Monat 18): Kind versteht zunehmend abstrakte Prinzipien — fair/unfair, richtig/falsch. Regelverständnis und Autonomieanspruch wachsen gleichzeitig. Quelle: Piaget, AAP.",
  },

  {
    id: "m21-24",
    weeksFrom: 91,
    weeksTo: 104,
    ageLabel: "ab 21 Monaten",
    title: "Wörter-Welt",
    emoji: "🌊",
    summary:
      "Bei vielen Kindern wächst der Wortschatz jetzt spürbar — jedes in seinem eigenen Tempo. Spielen neben anderen Kindern wird spannender.",
    typical: [
      "Oft kommen nach und nach neue Wörter dazu — bei jedem Kind unterschiedlich schnell",
      "Trotzphasen weiterhin intensiv",
      "Teilen fällt noch sehr schwer",
      "Zeigt erste Ansätze von Problemlösung im Spiel",
    ],
    parentTip:
      "Vorlesen ist jetzt der stärkste Sprachbooster — 10 Minuten täglich, gern dasselbe Buch 20 Mal. Fragen stellen: 'Wo ist der Hund?' trainiert aktiv den Wortabruf.",
    forParents:
      "Trotzphasen intensivieren sich oft kurz vor dem zweiten Geburtstag. Das ist Piagets präoperationale Phase: abstrakte Prinzipien werden gespürt, aber noch nicht vollständig verstanden. Real erschöpfend, aber entwicklungsgesund.",
  },

  // ─── MONAT 24–36 ───────────────────────────────────────────────────────────

  {
    id: "m24-30",
    weeksFrom: 104,
    weeksTo: 130,
    ageLabel: "ab 2 Jahren",
    title: "Kleine Persönlichkeit",
    emoji: "🌟",
    summary:
      "Sätze werden länger, Fragen zahlloser. Das Kind wird zu einer echten Persönlichkeit mit Vorlieben, Humor und ersten Freundschaften. Grenzen werden konsequent getestet — das ist kognitive Entwicklung.",
    typical: [
      "Grenzen testen ist der Job — das ist kognitive Entwicklung, kein Aufstand",
      "Intensive Fantasiespiele und Rollenspiele",
      "Fragen ohne Ende ('Warum?')",
      "Trotzphasen können bis ins dritte Jahr anhalten",
    ],
    parentTip:
      "Regeln erklären, nicht nur diktieren. 'Wir waschen Hände, damit keine Bakterien zu uns kommen' — das ist das Fundament für echte Regelakzeptanz.",
    forParents:
      "Das 'Warum?' kann erschöpfen — es ist aber Hochleistungskognition. Paarkommunikation leidet in dieser Phase oft im Trubel. Ein kurzes abendliches Check-in ('Wie geht es dir wirklich?') macht einen realen Unterschied.",
  },

  {
    id: "m30-36",
    weeksFrom: 130,
    weeksTo: 156,
    ageLabel: "ab 2½ Jahren",
    title: "Eigene Welt",
    emoji: "🏡",
    summary:
      "Das Kleinkind lebt in einer reichen inneren Welt aus Fantasie, Regeln und ersten Moralfragen. Sprache ist jetzt komplex genug für Geschichten, Witze und Verhandlungen.",
    typical: [
      "Potty Training beginnt oder ist in vollem Gange",
      "Erste Moralfragen: 'Ist das fair?', 'Das ist nicht nett'",
      "Geschwisterrivalität wenn vorhanden sehr präsent",
      "Braucht mehr Schlaf als es zeigt — Übermüdung als Trotz-Auslöser",
    ],
    parentTip:
      "Gemeinsam basteln, malen, bauen — Kreativprozesse fördern Sprache, Konzentration und Frustrationstoleranz gleichzeitig.",
    forParents:
      "In dieser Phase brauchen auch Paare manchmal eine Pause voneinander, nicht nur vom Kind. Gemeinsame Zeit — auch nur 15 Minuten abends — ist wichtig. Das Kind profitiert davon, wenn es euch gut geht.",
  },
];

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/** Alter in Wochen ab Geburtsdatum */
export function getAgeWeeks(birthDateISO: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDateISO).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
}

/** Aktuelle Phase basierend auf Geburtsdatum */
export function getCurrentPhase(birthDateISO: string): DevelopmentPhase | null {
  const weeks = getAgeWeeks(birthDateISO);
  return (
    DEVELOPMENT_PHASES.find((p) => weeks >= p.weeksFrom && weeks < p.weeksTo) ??
    (weeks >= 156 ? DEVELOPMENT_PHASES[DEVELOPMENT_PHASES.length - 1] : null)
  );
}

/** Phase, in die ein bestimmtes Datum im Leben des Kindes fällt */
export function getPhaseForDate(birthDateISO: string, dateISO: string): DevelopmentPhase | null {
  const weeks = Math.floor(
    (new Date(dateISO).getTime() - new Date(birthDateISO).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return DEVELOPMENT_PHASES.find((p) => weeks >= p.weeksFrom && weeks < p.weeksTo) ?? null;
}
