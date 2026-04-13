/** Kategorije i podkategorije — hrvatski nazivi (isti stringovi u bazi). */
export const CATEGORIES = {
  "Opće znanje": [
    "Svakodnevica",
    "Aktualnosti",
    "Brojke i rekordi",
    "Svijet i zemljopis",
    "Logika i zdrav razum",
    "Zanimljivosti i trik pitanja",
    "Definicije i pojmovi",
    "Kratice",
    "Ostalo",
  ],
  Povijest: [
    "Stari vijek",
    "Srednji vijek",
    "Novi vijek",
    "20. stoljeće",
    "Ratovi i sukobi",
    "Politička povijest",
    "Kulturna povijest",
    "Povijesne osobe",
    "Ostalo",
  ],
  Geografija: [
    "Države",
    "Glavni gradovi",
    "Zastave",
    "Gradovi",
    "Znamenitosti",
    "Fizička geografija",
    "Karte i granice",
    "Rijeke i planine",
    "Ostalo",
  ],
  Znanost: [
    "Fizika",
    "Kemija",
    "Biologija",
    "Astronomija",
    "Zemlja i okoliš",
    "Ljudsko tijelo",
    "Izumi i otkrića",
    "Znanstvene činjenice",
    "Ostalo",
  ],
  "Priroda i životinje": [
    "Divlje životinje",
    "Domaće životinje",
    "Morski svijet",
    "Ptice",
    "Biljke i drveće",
    "Ekosustavi",
    "Ugrožene vrste",
    "Činjenice o životinjama",
    "Ostalo",
  ],
  Sport: [
    "Nogomet",
    "Košarka",
    "Tenis",
    "Olimpijske igre",
    "Formula i motosport",
    "Američki sportovi",
    "Povijest sporta",
    "Sportaši",
    "Ostalo",
  ],
  "Film i televizija": [
    "Glumci i glumice",
    "Redatelji",
    "Žanrovi filma",
    "TV serije",
    "Streaming",
    "Oscari i nagrade",
    "Poznati citati",
    "Likovi iz filmova",
    "Ostalo",
  ],
  Glazba: [
    "Izvođači i bendovi",
    "Pjesme",
    "Albumi",
    "Tekstovi",
    "Glazbeni žanrovi",
    "Glazbene nagrade",
    "80-e, 90-e, 2000-e",
    "Povijest glazbe",
    "Ostalo",
  ],
  Književnost: [
    "Klasična književnost",
    "Moderna književnost",
    "Autori",
    "Likovi",
    "Poezija",
    "Citati",
    "Dječje knjige",
    "Fantastika i SF",
    "Ostalo",
  ],
  "Umjetnost i kultura": [
    "Slikarstvo",
    "Kiparstvo",
    "Arhitektura",
    "Muzeji i galerije",
    "Tradicije kulture",
    "Kazalište",
    "Ples",
    "Povijest umjetnosti",
    "Ostalo",
  ],
  "Hrana i piće": [
    "Kuhinje svijeta",
    "Sastojci",
    "Jela",
    "Bezalkoholna pića",
    "Alkoholna pića",
    "Tehnike kuhanja",
    "Deserti",
    "Kultura hrane",
    "Ostalo",
  ],
  "Tehnologija i videoigre": [
    "Videoigre",
    "Konsole i platforme",
    "Tehnološke tvrtke",
    "Gadgeti",
    "Internet i web",
    "Softver",
    "Informatika",
    "Povijest igranja",
    "Ostalo",
  ],
  "Život i trendovi": [
    "Slavne osobe",
    "Moda",
    "Društvene mreže",
    "Trendovi",
    "Zdravlje i fitness",
    "Odnosi",
    "Svakodnevica",
    "Influenceri",
    "Ostalo",
  ],
} as const;

export type Category = keyof typeof CATEGORIES;
export type Subcategory = (typeof CATEGORIES)[Category][number];

export const CATEGORY_LIST = Object.keys(CATEGORIES) as Category[];

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

/** Jezik pitanja u bazi (HR / EN). */
export const LANGUAGES = ["HR", "EN"] as const;
export type Language = (typeof LANGUAGES)[number];

export const QUESTION_TYPES = ["open", "multiple_choice", "true_false"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  open: "Otvoreno",
  multiple_choice: "Višestruki izbor",
  true_false: "Točno / netočno",
};

export const QUESTION_STATUSES = ["draft", "approved"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  draft: "Nacrt",
  approved: "Odobreno",
};

export const USER_ROLES = ["admin", "creator", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  creator: "Autor",
  user: "Korisnik",
};

export const PURCHASE_STATUSES = ["pending", "completed", "failed"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const DIFFICULTY_LABELS_HR: Record<number, string> = {
  1: "Lako",
  2: "Lako–srednje",
  3: "Srednje",
  4: "Srednje–teško",
  5: "Teško",
};

export function getSubcategories(category: Category): readonly string[] {
  return CATEGORIES[category];
}

/** Za kategorije/podkategorije na hrvatskom — string je već čitljiv. */
export function formatCategoryLabel(value: string): string {
  return value;
}

export function questionTypeLabel(type: string): string {
  if (type === "open" || type === "multiple_choice" || type === "true_false") {
    return QUESTION_TYPE_LABELS[type];
  }
  return type;
}
