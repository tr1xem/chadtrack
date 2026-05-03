import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User, { ensureUserDefaults } from '@/models/User';
import { countSolvedProblems, fetchUserInfo, fetchUserSubmissions } from '@/lib/codeforces';

type LeaderboardRow = {
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  solvedCount: number;
  isYou: boolean;
  error?: string;
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    ensureUserDefaults(user);

    const friends = Array.isArray(user.friends) ? user.friends : [];
    const handles = [user.cfHandle, ...friends]
      .map((handle: string) => handle.trim())
      .filter(Boolean)
      .filter((handle: string, index: number, arr: string[]) => arr.indexOf(handle) === index);

    const rows = await Promise.all(handles.map(async (handle): Promise<LeaderboardRow> => {
      try {
        const [info, submissions] = await Promise.all([
          fetchUserInfo(handle),
          fetchUserSubmissions(handle),
        ]);

        return {
          handle,
          rating: info?.rating ?? null,
          maxRating: info?.maxRating ?? null,
          rank: info?.rank ?? null,
          solvedCount: countSolvedProblems(submissions),
          isYou: handle.toLowerCase() === String(user.cfHandle).toLowerCase(),
        };
      } catch (error: unknown) {
        return {
          handle,
          rating: null,
          maxRating: null,
          rank: null,
          solvedCount: 0,
          isYou: handle.toLowerCase() === String(user.cfHandle).toLowerCase(),
          error: error instanceof Error ? error.message : 'Failed to load profile',
        };
      }
    }));

    rows.sort((a, b) => {
      if (a.isYou) return -1;
      if (b.isYou) return 1;
      if (a.error && !b.error) return 1;
      if (!a.error && b.error) return -1;
      const ratingA = a.rating ?? -1;
      const ratingB = b.rating ?? -1;
      if (ratingA !== ratingB) return ratingB - ratingA;
      return b.solvedCount - a.solvedCount;
    });

    return NextResponse.json({ rows }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
