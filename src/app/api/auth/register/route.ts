import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { username, password, cfHandle, targetRating } = await req.json();

    if (!username || !password || !cfHandle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if targetRating is provided, else default to 900 or whatever minimum
    const rating = targetRating ? Math.max(800, Number(targetRating)) : 900;

    const user = await User.create({
      username,
      password: hashedPassword,
      cfHandle,
      targetRating: rating
    });

    const sessionData = { userId: user._id.toString(), username: user.username, cfHandle: user.cfHandle };
    const session = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ message: 'User registered successfully', user: sessionData }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
