export function sentenceIsValid(sentence: string) {
  return !(
    sentence === "\n" ||
    !sentence ||
    sentence === " " ||
    (sentence.length === 1 && !sentence.match(/^[a-zA-Z0-9]+$/)) ||
    (sentence.trim().length <= 2 && !sentence.match(/^[a-zA-Z0-9]+$/)) ||
    !sentence.match(/[a-zA-Z0-9]/)
  );
}

const SENTENCE_DELIMITERS = [".", "?", "\n"];

export function extractSentences(text: string): string[] {
  const sentences: string[] = [];
  let sentence = "";

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (SENTENCE_DELIMITERS.includes(character)) {
      if (character !== "\n") {
        sentence += character;
      }

      if (sentence.length === 0) {
        if (character === "\n") {
          sentences.push("\n");
        }
        continue;
      }

      sentences.push(sentence);

      sentence = "";

      if (character === "\n") {
        sentences.push("\n");
      }
    } else {
      sentence += character;
    }
  }

  if (sentence.length > 0) {
    sentences.push(sentence);
  }

  return sentences;
}
