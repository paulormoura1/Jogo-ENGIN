export interface RankingEntry { playerName: string; area: string; points: number }

/** Accumulate the points already awarded by the calibrated evaluator. */
export function addRoundToRanking(ranking: RankingEntry[], players: string[], area: string, points: number): RankingEntry[] {
  const result = ranking.map(entry => ({ ...entry }));
  for (const playerName of new Set(players)) {
    const existing = result.find(entry => entry.playerName === playerName && entry.area === area);
    if (existing) existing.points += points;
    else result.push({ playerName, area, points });
  }
  return result;
}
