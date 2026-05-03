export async function fetchUserSubmissions(handle: string) {
  const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
  const data = await res.json();
  if (data.status !== 'OK') {
    throw new Error(data.comment || 'Failed to fetch user submissions');
  }
  return data.result;
}

export async function fetchUserInfo(handle: string) {
  const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
  const data = await res.json();
  if (data.status !== 'OK') {
    throw new Error(data.comment || 'Failed to fetch user info');
  }
  return data.result?.[0];
}

export function countSolvedProblems(submissions: Array<{ verdict?: string; problem: { contestId: number; index: string } }>) {
  const solved = new Set<string>();
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
    }
  }
  return solved.size;
}

export async function fetchProblemset() {
  const res = await fetch('https://codeforces.com/api/problemset.problems');
  const data = await res.json();
  if (data.status !== 'OK') {
    throw new Error(data.comment || 'Failed to fetch problemset');
  }
  return data.result;
}

export function getSolvedProblemIdentifiers(submissions: Array<{ verdict?: string; problem: { contestId: number; index: string } }>) {
  const solved = new Set<string>();
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
    }
  }
  return solved;
}

export async function getRecommendations(handle: string, targetRating: number, countX: number, countX100: number, countX200: number) {
  const [submissions, problemsetData] = await Promise.all([
    fetchUserSubmissions(handle),
    fetchProblemset()
  ]);

  const solvedSet = getSolvedProblemIdentifiers(submissions);
  const allProblems = problemsetData.problems;

  // Filter out solved problems and group by rating
  const unsolvedByRating: Record<number, Array<{ contestId: number; index: string; rating?: number }>> = {};
  
  for (const prob of allProblems) {
    if (!prob.rating) continue;
    const id = `${prob.contestId}-${prob.index}`;
    if (!solvedSet.has(id)) {
      if (!unsolvedByRating[prob.rating]) {
        unsolvedByRating[prob.rating] = [];
      }
      unsolvedByRating[prob.rating].push(prob);
    }
  }

  // Helper to get random problems
  const getRandom = <T,>(arr: T[], count: number) => {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const poolX = getRandom(unsolvedByRating[targetRating] || [], countX);
  const poolX100 = getRandom(unsolvedByRating[targetRating + 100] || [], countX100);
  const poolX200 = getRandom(unsolvedByRating[targetRating + 200] || [], countX200);

  return [...poolX, ...poolX100, ...poolX200];
}
