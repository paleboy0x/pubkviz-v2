export const CATEGORIES = {
  General_Knowledge: [
    "Everyday_Knowledge",
    "Actualities",
    "Numbers_Records",
    "Basic_World_Facts",
    "Logic_Common_Sense",
    "Surprising_Facts_Trick_Questions",
    "Definitions_Terms",
    "Abbreviations_Acronyms",
    "Other",
  ],
  History: [
    "Ancient_History",
    "Medieval_History",
    "Modern_History",
    "20th_Century",
    "Wars_Conflicts",
    "Political_History",
    "Cultural_History",
    "Historical_Figures",
    "Other",
  ],
  Geography: [
    "Countries",
    "Capitals",
    "Flags",
    "Cities",
    "Landmarks",
    "Physical_Geography",
    "Maps_Borders",
    "Rivers_Mountains",
    "Other",
  ],
  Science: [
    "Physics",
    "Chemistry",
    "Biology",
    "Astronomy",
    "Earth_Science",
    "Human_Body",
    "Inventions_Discoveries",
    "Scientific_Facts",
    "Other",
  ],
  Nature_Animals: [
    "Wild_Animals",
    "Domestic_Animals",
    "Marine_Life",
    "Birds",
    "Plants_Trees",
    "Ecosystems",
    "Endangered_Species",
    "Animal_Facts",
    "Other",
  ],
  Sports: [
    "Football",
    "Basketball",
    "Tennis",
    "Olympics",
    "Formula1_Motorsport",
    "American_Sports",
    "Sports_History",
    "Athletes",
    "Other",
  ],
  Movies_TV: [
    "Actors_Actresses",
    "Directors",
    "Movies_Genres",
    "TV_Shows",
    "Netflix_Streaming",
    "Oscars_Awards",
    "Famous_Quotes",
    "Movie_Characters",
    "Other",
  ],
  Music: [
    "Artists_Bands",
    "Songs",
    "Albums",
    "Lyrics",
    "Music_Genres",
    "Music_Awards",
    "80s_90s_2000s",
    "Music_History",
    "Other",
  ],
  Literature_Books: [
    "Classic_Literature",
    "Modern_Books",
    "Authors",
    "Characters",
    "Poetry",
    "Quotes",
    "Children_Books",
    "Fantasy_SciFi",
    "Other",
  ],
  Art_Culture: [
    "Painting",
    "Sculpture",
    "Architecture",
    "Museums_Galleries",
    "Cultural_Traditions",
    "Theatre",
    "Dance",
    "Art_History",
    "Other",
  ],
  Food_Drink: [
    "World_Cuisine",
    "Ingredients",
    "Dishes",
    "Drinks_NonAlcoholic",
    "Alcoholic_Beverages",
    "Cooking_Techniques",
    "Desserts",
    "Food_Culture",
    "Other",
  ],
  Technology_Gaming: [
    "Video_Games",
    "Consoles_Platforms",
    "Tech_Companies",
    "Gadgets",
    "Internet_Web",
    "Software",
    "IT_Computing",
    "Gaming_History",
    "Other",
  ],
  Lifestyle: [
    "Celebrities",
    "Fashion",
    "Social_Media",
    "Trends",
    "Health_Fitness",
    "Relationships",
    "Daily_Life",
    "Influencers",
    "Other",
  ],
} as const;

export type Category = keyof typeof CATEGORIES;
export type Subcategory = (typeof CATEGORIES)[Category][number];

export const CATEGORY_LIST = Object.keys(CATEGORIES) as Category[];

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export const LANGUAGES = ["HR", "EN"] as const;
export type Language = (typeof LANGUAGES)[number];

export const QUESTION_TYPES = ["open", "multiple_choice", "true_false"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_STATUSES = ["draft", "approved"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const USER_ROLES = ["admin", "creator", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PURCHASE_STATUSES = ["pending", "completed", "failed"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export function getSubcategories(category: Category): readonly string[] {
  return CATEGORIES[category];
}

export function formatCategoryLabel(value: string): string {
  return value.replace(/_/g, " ");
}
