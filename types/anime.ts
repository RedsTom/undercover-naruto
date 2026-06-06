export interface AnimeManifest {
  name: string;
  slug: string;
  color: string;
  eras: Array<{ id: string; label: string }>;
  categories: Record<string, string>;
}

export interface AnimeEntry {
  id: string;
  name: string;
  category: string;
  era: string[];
  tags: string[];
  summary: string;
  details: string[];
}