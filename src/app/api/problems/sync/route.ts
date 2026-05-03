import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User, { ensureUserDefaults } from '@/models/User';
import { fetchUserSubmissions, getSolvedProblemIdentifiers, getRecommendations } from '@/lib/codeforces';

/**
 * Compute how many problems of each rating to generate,
 * maintaining the 5:3:2 ratio scaled to the daily goal.
 */
function computeBlockDistribution(dailyGoal: number) {
  const countX = Math.ceil(dailyGoal * 0.5);
  const countX100 = Math.floor(dailyGoal * 0.3);
  const countX200 = Math.max(0, dailyGoal - countX - countX100);
  return { countX, countX100, countX200 };
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    ensureUserDefaults(user);

    const submissions = await fetchUserSubmissions(user.cfHandle);
    const solvedSet = getSolvedProblemIdentifiers(submissions);

    console.log(`[Sync] User ${user.cfHandle}: ${solvedSet.size} total solved on CF`);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // Compute daily goal
    let dailyGoal = 5;
    if (user.targetRating >= 1300) {
      dailyGoal = 3;
    }
    if (user.customDailyGoal) {
      dailyGoal = user.customDailyGoal;
    }

    // Work with local copies
    let currentStreak = user.currentStreak || 0;
    let longestStreak = user.longestStreak || 0;
    let lastStreakDate = user.lastStreakDate || null;
    let solvedAtTargetRating = user.solvedAtTargetRating || 0;
    let targetRating = user.targetRating;
    let history: Record<string, number> = { ...(user.history || {}) };
    let currentBlock = [...(user.currentBlock || [])];
    let blockDate = user.blockDate || null;

    // Reset streak if missed a day
    if (lastStreakDate && lastStreakDate !== today && lastStreakDate !== yesterday) {
      currentStreak = 0;
    }

    let newlySolvedCount = 0;
    let needsNewBlock = false;

    // Check if it's a new day → need fresh problems
    if (blockDate && blockDate !== today) {
      console.log(`[Sync] New day detected (block was from ${blockDate}). Checking solved before refreshing.`);

      // First, record any solved problems from yesterday's block before discarding
      for (const prob of currentBlock) {
        if (prob.solved && prob.historyRecorded) continue;

        const id = `${prob.contestId}-${prob.index}`;
        if (solvedSet.has(id)) {
          if (!prob.solved) {
            prob.solved = true;
            if (prob.rating === targetRating) {
              solvedAtTargetRating += 1;
            }
          }
          if (!prob.historyRecorded) {
            // Record to blockDate (the day they were assigned), not today
            const recordDate = blockDate;
            history[recordDate] = (history[recordDate] || 0) + 1;
            newlySolvedCount += 1;
          }
        }
      }

      needsNewBlock = true;
    } else {
      // Same day — check current block for newly solved problems
      if (currentBlock.length > 0) {
        let unsolvedRemaining = 0;

        for (const prob of currentBlock) {
          const id = `${prob.contestId}-${prob.index}`;
          const isSolvedOnCF = solvedSet.has(id);

          if (prob.solved && prob.historyRecorded) {
            continue;
          }

          if (isSolvedOnCF) {
            if (!prob.solved) {
              prob.solved = true;
              if (prob.rating === targetRating) {
                solvedAtTargetRating += 1;
              }
            }
            if (!prob.historyRecorded) {
              newlySolvedCount += 1;
              prob.historyRecorded = true;
              console.log(`[Sync] Recording solved: ${id} (rating ${prob.rating})`);
            }
          } else {
            unsolvedRemaining += 1;
          }
        }

        // All solved → generate new block
        if (unsolvedRemaining === 0 && currentBlock.some((p: any) => p.solved)) {
          console.log(`[Sync] All problems in block solved!`);
          needsNewBlock = true;
        }
      } else {
        needsNewBlock = true;
      }
    }

    // Update history and streak for today's solves
    if (newlySolvedCount > 0) {
      console.log(`[Sync] Newly recorded: ${newlySolvedCount}`);

      // If not already added in the new-day path above, add to today
      if (!blockDate || blockDate === today) {
        history[today] = (history[today] || 0) + newlySolvedCount;
      }

      if (lastStreakDate === yesterday) {
        currentStreak += 1;
      } else if (lastStreakDate !== today) {
        currentStreak = 1;
      }
      lastStreakDate = today;

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      console.log(`[Sync] Streak: ${currentStreak}, History: ${JSON.stringify(history)}`);
    }

    // Check level up condition
    if (solvedAtTargetRating >= 50) {
      targetRating += 100;
      solvedAtTargetRating = 0;
      needsNewBlock = true;
    }

    // Generate new block if needed
    if (needsNewBlock) {
      const { countX, countX100, countX200 } = computeBlockDistribution(dailyGoal);
      console.log(`[Sync] Generating new block: ${countX} at ${targetRating}, ${countX100} at ${targetRating + 100}, ${countX200} at ${targetRating + 200}, UnchadMode: ${user.unchadMode}`);
      currentBlock = await getRecommendations(user.cfHandle, targetRating, countX, countX100, countX200, user.unchadMode);
      blockDate = today;
    }

    // Save everything with $set
    await User.findByIdAndUpdate(user._id, {
      $set: {
        currentBlock,
        targetRating,
        solvedAtTargetRating,
        currentStreak,
        longestStreak,
        lastStreakDate,
        history,
        blockDate,
      }
    });

    console.log(`[Sync] Done. Streak: ${currentStreak}, DailyGoal: ${dailyGoal}, BlockSize: ${currentBlock.length}`);

    return NextResponse.json({ 
      currentBlock,
      targetRating,
      solvedAtTargetRating,
      currentStreak,
      longestStreak,
      history,
      dailyGoal,
      blockDate,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (error: any) {
    console.error('[Sync Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
