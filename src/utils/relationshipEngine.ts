import type { FamilyMember } from "@/types";

function getMember(id: string | null | undefined, members: FamilyMember[]): FamilyMember | undefined {
  if (!id) return undefined;
  return members.find((m) => m.id === id);
}

function isElderThan(a: FamilyMember, b: FamilyMember): boolean | null {
  if (!a.birth_date || !b.birth_date) return null;
  return new Date(a.birth_date) < new Date(b.birth_date);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getChildren(parentId: string, members: FamilyMember[]): FamilyMember[] {
  return members.filter((m) => m.father_id === parentId || m.mother_id === parentId);
}

function getSiblings(member: FamilyMember, members: FamilyMember[]): FamilyMember[] {
  return members.filter(
    (m) => m.id !== member.id &&
      ((member.father_id && m.father_id === member.father_id) ||
        (member.mother_id && m.mother_id === member.mother_id))
  );
}

export interface RelationshipResult {
  hindiLabel: string;
  englishLabel: string;
  path: string;
  category: string;
  emoji: string;
}

export function getRelation(self: FamilyMember, target: FamilyMember, all: FamilyMember[]): RelationshipResult | null {
  if (self.id === target.id) return null;

  // Parents
  if (target.id === self.father_id) return { hindiLabel: "Papa", englishLabel: "Father", path: "Father", category: "parent", emoji: "👨" };
  if (target.id === self.mother_id) return { hindiLabel: "Mummy", englishLabel: "Mother", path: "Mother", category: "parent", emoji: "👩" };

  // Spouse
  if (target.id === self.spouse_id || target.spouse_id === self.id) {
    return { hindiLabel: target.gender === "female" ? "Patni" : "Pati", englishLabel: target.gender === "female" ? "Wife" : "Husband", path: "Spouse", category: "spouse", emoji: "💍" };
  }

  // Children
  if (target.father_id === self.id || target.mother_id === self.id) {
    return { hindiLabel: target.gender === "female" ? "Beti" : "Beta", englishLabel: target.gender === "female" ? "Daughter" : "Son", path: target.gender === "female" ? "Daughter" : "Son", category: "child", emoji: target.gender === "female" ? "👧" : "👦" };
  }

  // Siblings
  const isSib = (self.father_id && target.father_id === self.father_id) || (self.mother_id && target.mother_id === self.mother_id);
  if (isSib) {
    const elder = isElderThan(target, self);
    if (target.gender === "male") {
      const p = elder === true ? "Bade" : elder === false ? "Chhote" : "";
      return { hindiLabel: p ? `${p} Bhai` : "Bhai", englishLabel: elder === true ? "Elder Brother" : elder === false ? "Younger Brother" : "Brother", path: elder === true ? "Elder Brother" : elder === false ? "Younger Brother" : "Brother", category: "sibling", emoji: "👦" };
    } else {
      const p = elder === true ? "Badi" : elder === false ? "Chhoti" : "";
      return { hindiLabel: p ? `${p} Behen` : "Behen", englishLabel: elder === true ? "Elder Sister" : elder === false ? "Younger Sister" : "Sister", path: elder === true ? "Elder Sister" : elder === false ? "Younger Sister" : "Sister", category: "sibling", emoji: "👧" };
    }
  }

  // Grandparents
  const father = getMember(self.father_id, all);
  const mother = getMember(self.mother_id, all);
  if (father && target.id === father.father_id) return { hindiLabel: "Dada", englishLabel: "Paternal Grandfather", path: "Father's Father", category: "grandparent", emoji: "👴" };
  if (father && target.id === father.mother_id) return { hindiLabel: "Dadi", englishLabel: "Paternal Grandmother", path: "Father's Mother", category: "grandparent", emoji: "👵" };
  if (mother && target.id === mother.father_id) return { hindiLabel: "Nana", englishLabel: "Maternal Grandfather", path: "Mother's Father", category: "grandparent", emoji: "👴" };
  if (mother && target.id === mother.mother_id) return { hindiLabel: "Nani", englishLabel: "Maternal Grandmother", path: "Mother's Mother", category: "grandparent", emoji: "👵" };

  // Paternal uncles & aunts (Father's siblings + their spouses)
  if (father) {
    const fSibs = getSiblings(father, all);
    for (const u of fSibs) {
      if (u.id === target.id) {
        if (u.gender === "male") {
          const e = isElderThan(u, father);
          if (e === true) return { hindiLabel: "Tauji", englishLabel: "Father's Elder Brother", path: "Father's elder brother", category: "uncle-aunt", emoji: "👨" };
          if (e === false) return { hindiLabel: "Chacha", englishLabel: "Father's Younger Brother", path: "Father's younger brother", category: "uncle-aunt", emoji: "👨" };
          return { hindiLabel: "Chacha/Tauji", englishLabel: "Paternal Uncle", path: "Father's brother (add birth dates to differentiate)", category: "uncle-aunt", emoji: "👨" };
        }
        return { hindiLabel: "Bua", englishLabel: "Paternal Aunt", path: "Father's sister", category: "uncle-aunt", emoji: "👩" };
      }
      if (u.spouse_id === target.id || target.spouse_id === u.id) {
        if (u.gender === "male") {
          const e = isElderThan(u, father);
          if (e === true) return { hindiLabel: "Taiji", englishLabel: "Tauji's Wife", path: "Father's elder brother's wife", category: "uncle-aunt", emoji: "👩" };
          if (e === false) return { hindiLabel: "Chachi", englishLabel: "Chacha's Wife", path: "Father's younger brother's wife", category: "uncle-aunt", emoji: "👩" };
          return { hindiLabel: "Chachi/Taiji", englishLabel: "Paternal Uncle's Wife", path: "Father's brother's wife", category: "uncle-aunt", emoji: "👩" };
        }
        return { hindiLabel: "Fufaji", englishLabel: "Bua's Husband", path: "Father's sister's husband", category: "uncle-aunt", emoji: "👨" };
      }
    }
  }

  // Maternal uncles & aunts
  if (mother) {
    const mSibs = getSiblings(mother, all);
    for (const r of mSibs) {
      if (r.id === target.id) {
        if (r.gender === "male") return { hindiLabel: "Mama", englishLabel: "Maternal Uncle", path: "Mother's brother", category: "uncle-aunt", emoji: "👨" };
        return { hindiLabel: "Maasi", englishLabel: "Maternal Aunt", path: "Mother's sister", category: "uncle-aunt", emoji: "👩" };
      }
      if (r.spouse_id === target.id || target.spouse_id === r.id) {
        if (r.gender === "male") return { hindiLabel: "Mami", englishLabel: "Mama's Wife", path: "Mother's brother's wife", category: "uncle-aunt", emoji: "👩" };
        return { hindiLabel: "Mausa", englishLabel: "Maasi's Husband", path: "Mother's sister's husband", category: "uncle-aunt", emoji: "👨" };
      }
    }
  }

  // Grandchildren
  const myKids = getChildren(self.id, all);
  for (const c of myKids) {
    for (const gc of getChildren(c.id, all)) {
      if (gc.id === target.id) {
        if (c.gender === "male") return { hindiLabel: target.gender === "female" ? "Poti" : "Pota", englishLabel: target.gender === "female" ? "Granddaughter" : "Grandson", path: `${capitalize(c.first_name)}'s ${target.gender === "female" ? "daughter" : "son"}`, category: "grandchild", emoji: "👶" };
        return { hindiLabel: target.gender === "female" ? "Dohiti" : "Dohita", englishLabel: target.gender === "female" ? "Granddaughter" : "Grandson", path: `${capitalize(c.first_name)}'s ${target.gender === "female" ? "daughter" : "son"}`, category: "grandchild", emoji: "👶" };
      }
    }
  }

  // Cousins
  const checkCousins = (parent: FamilyMember | undefined) => {
    if (!parent) return null;
    for (const sib of getSiblings(parent, all)) {
      const kids = getChildren(sib.id, all);
      const sp = getMember(sib.spouse_id, all);
      if (sp) for (const c of getChildren(sp.id, all)) { if (!kids.find(k => k.id === c.id)) kids.push(c); }
      for (const cousin of kids) {
        if (cousin.id === target.id) {
          return { hindiLabel: target.gender === "female" ? "Cousin Sister" : "Cousin Brother", englishLabel: target.gender === "female" ? "Cousin Sister" : "Cousin Brother", path: `${capitalize(sib.first_name)}'s ${target.gender === "female" ? "daughter" : "son"}`, category: "cousin", emoji: target.gender === "female" ? "👧" : "👦" } as RelationshipResult;
        }
      }
    }
    return null;
  };
  const cousinResult = checkCousins(father) || checkCousins(mother);
  if (cousinResult) return cousinResult;

  // Nephews / Nieces
  for (const sib of getSiblings(self, all)) {
    for (const child of getChildren(sib.id, all)) {
      if (child.id === target.id) {
        const hindi = target.gender === "female" ? (sib.gender === "male" ? "Bhatiji" : "Bhanji") : (sib.gender === "male" ? "Bhatija" : "Bhanja");
        return { hindiLabel: hindi, englishLabel: target.gender === "female" ? "Niece" : "Nephew", path: `${capitalize(sib.first_name)}'s ${target.gender === "female" ? "daughter" : "son"}`, category: "nephew-niece", emoji: target.gender === "female" ? "👧" : "👦" };
      }
    }
  }

  // In-laws via spouse
  const spouse = getMember(self.spouse_id, all);
  if (spouse) {
    if (target.id === spouse.father_id) return { hindiLabel: "Sasurji", englishLabel: "Father-in-law", path: "Spouse's father", category: "in-law", emoji: "👨" };
    if (target.id === spouse.mother_id) return { hindiLabel: "Saasji", englishLabel: "Mother-in-law", path: "Spouse's mother", category: "in-law", emoji: "👩" };
    for (const sib of getSiblings(spouse, all)) {
      if (sib.id === target.id) {
        if (self.gender === "male") return { hindiLabel: target.gender === "male" ? "Saala" : "Saali", englishLabel: target.gender === "male" ? "Wife's Brother" : "Wife's Sister", path: `Spouse's ${target.gender === "male" ? "brother" : "sister"}`, category: "in-law", emoji: target.gender === "male" ? "👨" : "👩" };
        if (target.gender === "male") {
          const e = isElderThan(target, spouse);
          if (e === true) return { hindiLabel: "Jethji", englishLabel: "Husband's Elder Brother", path: "Spouse's elder brother", category: "in-law", emoji: "👨" };
          if (e === false) return { hindiLabel: "Devar", englishLabel: "Husband's Younger Brother", path: "Spouse's younger brother", category: "in-law", emoji: "👨" };
          return { hindiLabel: "Devar/Jeth", englishLabel: "Husband's Brother", path: "Spouse's brother", category: "in-law", emoji: "👨" };
        }
        return { hindiLabel: "Nanad", englishLabel: "Husband's Sister", path: "Spouse's sister", category: "in-law", emoji: "👩" };
      }
    }
  }

  // Children's spouses
  for (const c of myKids) {
    const cSpouse = getMember(c.spouse_id, all);
    if (cSpouse && cSpouse.id === target.id) {
      if (c.gender === "male") return { hindiLabel: "Bahu", englishLabel: "Daughter-in-law", path: `${capitalize(c.first_name)}'s wife`, category: "in-law", emoji: "👩" };
      return { hindiLabel: "Damad", englishLabel: "Son-in-law", path: `${capitalize(c.first_name)}'s husband`, category: "in-law", emoji: "👨" };
    }
  }

  // Sibling's spouses
  for (const sib of getSiblings(self, all)) {
    const sibSp = getMember(sib.spouse_id, all);
    if (sibSp && sibSp.id === target.id) {
      if (sib.gender === "male") return { hindiLabel: "Bhabhi", englishLabel: "Brother's Wife", path: `${capitalize(sib.first_name)}'s wife`, category: "in-law", emoji: "👩" };
      return { hindiLabel: "Jijaji", englishLabel: "Sister's Husband", path: `${capitalize(sib.first_name)}'s husband`, category: "in-law", emoji: "👨" };
    }
  }

  return null;
}

export function getAllRelationships(selfId: string, allMembers: FamilyMember[]) {
  const self = allMembers.find((m) => m.id === selfId);
  if (!self) return [];
  const results: { member: FamilyMember; relation: RelationshipResult }[] = [];
  for (const other of allMembers) {
    if (other.id === selfId) continue;
    const rel = getRelation(self, other, allMembers);
    if (rel) results.push({ member: other, relation: rel });
  }
  const order: Record<string, number> = { parent: 0, grandparent: 1, spouse: 2, sibling: 3, child: 4, grandchild: 5, "uncle-aunt": 6, cousin: 7, "nephew-niece": 8, "in-law": 9, extended: 10 };
  results.sort((a, b) => (order[a.relation.category] ?? 99) - (order[b.relation.category] ?? 99));
  return results;
}

export function computeAge(birthDate: string | null, deathDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const md = end.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && end.getDate() < birth.getDate())) age--;
  if (age < 0) return null;
  return deathDate ? `Passed at ${age} yrs` : `${age} yrs`;
}

export const categoryLabels: Record<string, string> = {
  parent: "Parents", grandparent: "Grandparents", "great-grandparent": "Great-Grandparents",
  spouse: "Spouse", sibling: "Siblings", child: "Children", grandchild: "Grandchildren",
  "uncle-aunt": "Uncles & Aunts", cousin: "Cousins", "nephew-niece": "Nephews & Nieces",
  "in-law": "In-Laws", extended: "Extended Family",
};
