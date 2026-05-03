import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User, { ensureUserDefaults } from '@/models/User';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    ensureUserDefaults(user);

    // Calculate daily goal based on target rating, or override with custom
    let dailyGoal = 5;
    if (user.targetRating >= 1300) {
      dailyGoal = 3;
    }
    if (user.customDailyGoal) {
      dailyGoal = user.customDailyGoal;
    }

    return NextResponse.json({ 
      currentBlock: user.currentBlock, 
      targetRating: user.targetRating,
      solvedAtTargetRating: user.solvedAtTargetRating,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      history: user.history,
      dailyGoal,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
