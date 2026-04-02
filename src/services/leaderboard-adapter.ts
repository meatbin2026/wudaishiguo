export async function submitScore(): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: "not-configured" };
}

export async function fetchLeaderboard(): Promise<Array<{ name: string; score: number }>> {
  return [];
}
