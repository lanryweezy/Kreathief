export function getLevenshteinDistance(a: string, b: string): number {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] =
        b[i - 1] === a[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return true;
  if (t.includes(q)) return true;

  const queryWords = q.split(/\s+/).filter(Boolean);
  const targetWords = t.split(/[\s\W]+/).filter(Boolean);

  return queryWords.every((qw) => {
    const maxDist = qw.length <= 2 ? 0 : qw.length <= 5 ? 1 : 2;
    return targetWords.some((tw) =>
      Math.abs(tw.length - qw.length) <= maxDist &&
      getLevenshteinDistance(tw, qw) <= maxDist
    );
  });
}
