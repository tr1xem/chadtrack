import { NextRequest, NextResponse } from 'next/server';
import { getSession, encrypt } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';

type UpdateFields = {
  cfHandle?: string;
  targetRating?: number;
  customDailyGoal?: number | null;
  friends?: string[];
  currentBlock?: Array<unknown>;
  blockDate?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { cfHandle, targetRating, customDailyGoal, friends } = await req.json();

    const updateFields: UpdateFields = {};
    let sessionNeedsUpdate = false;

    if (cfHandle && cfHandle !== user.cfHandle) {
      updateFields.cfHandle = cfHandle;
      updateFields.currentBlock = [];
      sessionNeedsUpdate = true;
    }

    if (targetRating) {
      const parsedRating = Math.max(800, Number(targetRating));
      if (parsedRating !== user.targetRating) {
        updateFields.targetRating = parsedRating;
        updateFields.currentBlock = [];
      }
    }

    if (customDailyGoal !== undefined) {
      if (customDailyGoal === "" || customDailyGoal === null || customDailyGoal === 0) {
        updateFields.customDailyGoal = null;
      } else {
        updateFields.customDailyGoal = Math.max(1, Number(customDailyGoal));
      }
    }

    if (friends !== undefined) {
      updateFields.friends = String(friends)
        .split(',')
        .map((friend) => friend.trim())
        .filter(Boolean)
        .filter((friend, index, arr) => arr.indexOf(friend) === index);
    }

    console.log(`[Settings] Updating fields:`, JSON.stringify(updateFields));

    // Use $set to directly write to MongoDB
    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(user._id, { $set: updateFields });
    }

    if (sessionNeedsUpdate) {
      const newCfHandle = updateFields.cfHandle || user.cfHandle;
      const sessionData = { userId: user._id.toString(), username: user.username, cfHandle: newCfHandle };
      const newSession = await encrypt(sessionData);
      const cookieStore = await cookies();
      cookieStore.set('session', newSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return NextResponse.json({ message: 'Settings updated successfully' }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: unknown) {
    console.error('[Settings Error]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
