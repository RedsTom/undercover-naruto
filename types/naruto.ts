export type NarutoCategory = 'character' | 'technique' | 'village' | 'clan' | 'bijuu' | 'organization' | 'title' | 'item' | 'kage' | 'kekkei-genkai';

export const ALL_ERAS = ['naruto', 'shippuden', 'shippuden-end', 'boruto', 'naruto-backstory'] as const;
export type Era = typeof ALL_ERAS[number];

export interface NarutoEntry {
  id: string;
  name: string;
  category: NarutoCategory;
  era: Era[];
  tags: string[];
  summary: string;
  details: string[];
  image?: string;
  [key: string]: unknown;
}

export interface NarutoCharacter extends NarutoEntry {
  category: 'character';
  clan?: string;
  village?: string;
  rank?: string;
  team?: string;
  jutsu?: string[];
  kageTitle?: string;
}

export interface NarutoTechnique extends NarutoEntry {
  category: 'technique';
  type: 'ninjutsu' | 'taijutsu' | 'genjutsu' | 'dojutsu' | 'kekkei-genkai' | 'kinjutsu';
  rank?: string;
  nature?: string[];
  users?: string[];
}

export interface NarutoVillage extends NarutoEntry {
  category: 'village';
  country: string;
  kage: string;
  notableClans?: string[];
}

export interface NarutoClan extends NarutoEntry {
  category: 'clan';
  village?: string;
  kekkeiGenkai?: string[];
  notableMembers?: string[];
}

export interface NarutoBijuu extends NarutoEntry {
  category: 'bijuu';
  tails: number;
  jinchuriki?: string[];
  nature?: string[];
}

export interface NarutoOrganization extends NarutoEntry {
  category: 'organization';
  members?: string[];
  leader?: string;
}

export interface NarutoKage extends NarutoEntry {
  category: 'kage';
  title: string;
  village: string;
  person?: string;
}

export interface NarutoKekkeiGenkai extends NarutoEntry {
  category: 'kekkei-genkai';
  natures?: string[];
  clans?: string[];
  users?: string[];
}

export interface NarutoItem extends NarutoEntry {
  category: 'item';
  wielder?: string;
  origin?: string;
}

export interface NarutoTitle extends NarutoEntry {
  category: 'title';
  holders?: string[];
}