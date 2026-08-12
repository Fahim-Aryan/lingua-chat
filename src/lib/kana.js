/**
 * kana.js — Romaji -> Hiragana/Katakana input engine.
 *
 * Powers the virtual Japanese keyboard AND lets users type Japanese with a
 * standard Latin keyboard. Longest-match conversion so "kyou" -> きょう.
 */

const BASE = {
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", shi: "し", si: "し", su: "す", se: "せ", so: "そ",
  ta: "た", chi: "ち", ti: "ち", tsu: "つ", tu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を", n: "ん",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  "-": "ー", ".": "。", ",": "、", "?": "？", "!": "！",
};

const MAX_LEN = 3;

/** Convert a trailing romaji buffer to hiragana. Returns { kana, rest }. */
export function romajiToKana(buffer) {
  let out = "";
  let i = 0;
  const s = buffer.toLowerCase();

  while (i < s.length) {
    // sokuon: double consonant -> small tsu
    if (
      i + 1 < s.length &&
      s[i] === s[i + 1] &&
      !"aiueon".includes(s[i]) &&
      /[a-z]/.test(s[i])
    ) {
      out += "っ";
      i += 1;
      continue;
    }

    let matched = false;
    for (let len = MAX_LEN; len >= 1; len--) {
      const chunk = s.slice(i, i + len);
      if (BASE[chunk]) {
        out += BASE[chunk];
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // "n" before consonant -> ん
    if (s[i] === "n" && i + 1 < s.length && !"aiueoy".includes(s[i + 1])) {
      out += "ん";
      i += 1;
      continue;
    }

    // Unconvertible trailing fragment (still being typed) -> keep as rest
    return { kana: out, rest: s.slice(i) };
  }
  return { kana: out, rest: "" };
}

/** Hiragana -> Katakana */
export function toKatakana(str) {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/** Keyboard rows for the on-screen kana pad. */
export const KANA_ROWS = {
  hiragana: [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "ぬ", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["や", "ゆ", "よ", "わ", "を"],
    ["ら", "り", "る", "れ", "ろ"],
    ["ん", "、", "。", "ー", "？"],
  ],
  katakana: [
    ["ア", "イ", "ウ", "エ", "オ"],
    ["カ", "キ", "ク", "ケ", "コ"],
    ["サ", "シ", "ス", "セ", "ソ"],
    ["タ", "チ", "ツ", "テ", "ト"],
    ["ナ", "ニ", "ヌ", "ネ", "ノ"],
    ["ハ", "ヒ", "フ", "ヘ", "ホ"],
    ["マ", "ミ", "ム", "メ", "モ"],
    ["ヤ", "ユ", "ヨ", "ワ", "ヲ"],
    ["ラ", "リ", "ル", "レ", "ロ"],
    ["ン", "、", "。", "ー", "？"],
  ],
};
