import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password?: string;
  cfHandle: string;
  friends: string[];
  targetRating: number;
  solvedAtTargetRating: number;
  lastUpdated: Date;
  dailySolvedCount: number;
  lastActivityDate: Date;
  currentBlock: any[];
  customDailyGoal?: number;
  currentStreak: number;
  longestStreak: number;
  history: Record<string, number>; // { 'YYYY-MM-DD': count }
  lastStreakDate?: string;
  blockDate?: string; // YYYY-MM-DD when current block was generated
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cfHandle: { type: String, required: true },
  friends: { type: [String], default: [] },
  targetRating: { type: Number, default: 900, min: 800 },
  solvedAtTargetRating: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  dailySolvedCount: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: Date.now },
  currentBlock: { type: Schema.Types.Mixed, default: [] },
  customDailyGoal: { type: Number },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  history: { type: Schema.Types.Mixed, default: {} },
  lastStreakDate: { type: String },
  blockDate: { type: String },
}, { strict: false }); // Allow saving fields not in schema (prevents stripping during dev HMR)

/**
 * Ensures all fields exist on a user document loaded from the DB.
 */
export function ensureUserDefaults(user: any) {
  if (user.currentStreak == null) user.currentStreak = 0;
  if (user.longestStreak == null) user.longestStreak = 0;
  if (!user.history || typeof user.history !== 'object') user.history = {};
  if (!user.currentBlock) user.currentBlock = [];
  if (!Array.isArray(user.friends)) user.friends = [];
}

// Force re-register model in dev to pick up schema changes
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', UserSchema);
