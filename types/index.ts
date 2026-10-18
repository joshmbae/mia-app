export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string;
  dueDate?: string;         // Errechneter Geburtstermin (bei Frühchen für das korrigierte Alter)
  gender?: "male" | "female" | "other";
  feedingType?: "breastfed" | "formula" | "mixed"; // Altbestand, wird nicht mehr abgefragt
  avatarColor: string;
  createdAt: string;
  photoUri?: string;        // "storage:<pfad>" oder lokale URI
  weightGrams?: number;     // Altbestand: Geburtsgewicht, jetzt als Wachstumseintrag
  premature?: boolean;
  siblings?: string;
  medicalNotes?: string;
  description?: string;     // Notizen
}

export interface PregnancyProfile {
  id: string;
  nickname: string;         // z. B. "Erdnuss", "Mein Baby"
  dueDate: string;          // ISO — Errechneter Geburtstermin
  avatarColor: string;
  createdAt: string;
  description?: string;
}

/** Ein Kind in der App — schon geboren oder noch im Bauch */
export type Child =
  | { kind: "baby"; id: string; name: string; color: string; profile: BabyProfile }
  | { kind: "pregnancy"; id: string; name: string; color: string; profile: PregnancyProfile };

// Ein festgehaltener Moment im Tagebuch — entweder zu einem Meilenstein aus
// dem Katalog (milestoneId) oder ein ganz eigener Moment (ohne milestoneId).
export interface MomentEntry {
  id: string;
  babyId: string;         // Kind- oder Schwangerschafts-ID
  milestoneId?: string;
  title: string;
  emoji?: string;
  happenedOn: string;     // ISO date only: "2025-03-01"
  note?: string;
  photos: string[];       // "storage:<pfad>" (Supabase Storage) oder lokale URI
  createdAt: string;
}

/** Eine Messung: Größe, Gewicht und/oder Kopfumfang an einem Tag */
export interface GrowthEntry {
  id: string;
  babyId: string;
  measuredOn: string;     // ISO date only
  heightCm?: number;
  weightGrams?: number;
  headCm?: number;
  note?: string;
  createdAt: string;
}
