import { NextRequest, NextResponse } from 'next/server';
import { getSession, encrypt } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { cfHandle, targetRating, customDailyGoal } = await req.json();

    const updateFields: Record<string, any> = {};
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
      // Clear block so next sync generates with the new count
      updateFields.currentBlock = [];
      updateFields.blockDate = null;
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

  } catch (error: any) {
    console.error('[Settings Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
