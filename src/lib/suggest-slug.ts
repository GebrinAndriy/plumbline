// Ukrainian national transliteration (2010), the one used in passports and road signs.
const LETTERS: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", ж: "zh", з: "z", и: "y", і: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", "'": "", "’": "", ʼ: "",
  є: "ie", ї: "i", й: "i", ю: "iu", я: "ia",
  ё: "io", ы: "y", э: "e", ъ: "",
};

// At the start of a word these letters keep their "y" sound: Ялта → Yalta, but Біля → Bilia.
const WORD_START: Record<string, string> = { є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya" };

const MAX_SLUG = 40;

export function transliterate(text: string): string {
  let result = "";
  let wordStart = true;
  for (const char of text.toLowerCase()) {
    const isLetter = /\p{L}/u.test(char);
    if (wordStart && WORD_START[char]) result += WORD_START[char];
    else if (char === "г" && result.endsWith("z")) result += "gh";
    else result += LETTERS[char] ?? char;
    wordStart = !isLetter && !(char in LETTERS);
  }
  return result;
}

export function suggestSlug(businessName: string): string {
  return transliterate(businessName)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/, "");
}
