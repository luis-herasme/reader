export function getChaptersSlugs(slug: string) {
  const currentChapterNumber = Number(slug.split("-").pop());
  const novelSlug = slug.split("-").slice(0, -1).join("-");
  const nextChapterSlug = `${novelSlug}-${currentChapterNumber + 1}`;
  const previousChapterSlug = `${novelSlug}-${currentChapterNumber - 1}`;
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title,
    novelSlug,
    nextChapterSlug,
    previousChapterSlug,
    currentChapterNumber,
  } as const;
}
