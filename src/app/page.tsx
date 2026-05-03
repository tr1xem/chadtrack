"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, LogOut, Settings, ExternalLink, Trophy, Flame, Info, Users } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserData {
  username: string;
  cfHandle: string;
}

interface Problem {
  contestId: number;
  index: string;
  rating?: number;
  name: string;
  solved?: boolean;
}

interface StatsData {
  currentBlock: Problem[];
  targetRating: number;
  solvedAtTargetRating: number;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  history: Record<string, number>;
}

interface LeaderboardRow {
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  solvedCount: number;
  isYou: boolean;
  error?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/problems');
      const data = await res.json();
      if (res.ok) return data;
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (res.ok) return data.rows as LeaderboardRow[];
    } catch (error) {
      console.error(error);
    }
    return [];
  };

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        const [statsData, leaderboardData] = await Promise.all([fetchStats(), fetchLeaderboard()]);
        if (statsData) setStats(statsData);
        if (leaderboardData) setLeaderboard(leaderboardData);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const syncProgress = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/problems/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        console.error('Sync failed:', data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || !user || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const progressPercentage = (stats.solvedAtTargetRating / 50) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              ChadForce
            </h1>
            <p className="text-zinc-400 mt-1">Welcome back, {user.username} ({user.cfHandle})</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" size="sm" className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white" />}>
                <Info className="w-4 h-4 mr-2" />
                About
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">About ChadForce</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Your personal competitive programming tracker.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 text-sm text-zinc-300">
                  <p>
                    ChadForce assigns a daily block of Codeforces problems scaled to your chosen daily goal, distributed as follows:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>50%</strong> at your target rating</li>
                    <li><strong>30%</strong> at target + 100</li>
                    <li><strong>20%</strong> at target + 200</li>
                  </ul>
                  <p>
                    Solve 50 problems at your target rating to automatically level up!
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white" onClick={syncProgress} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync CF'}
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="icon" className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="destructive" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">Current Level</CardDescription>
              <CardTitle className="text-4xl text-indigo-400">{stats.targetRating}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">Target Rating</p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">Current Streak</CardDescription>
              <div className="flex items-end gap-2">
                <CardTitle className="text-4xl text-orange-500">{stats.currentStreak ?? 0}</CardTitle>
                <Flame className="w-6 h-6 text-orange-500 mb-1" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">Longest: {stats.longestStreak ?? 0} days</p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800 md:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardDescription className="text-zinc-400">Level Up Progress</CardDescription>
                <span className="text-sm font-medium text-cyan-400">{stats.solvedAtTargetRating} / 50</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={progressPercentage} className="[&_[data-slot=progress-track]]:h-3 [&_[data-slot=progress-track]]:bg-zinc-800 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-indigo-500 [&_[data-slot=progress-indicator]]:to-cyan-400" />
              <p className="text-xs text-zinc-500">Solve {50 - stats.solvedAtTargetRating} more to level up.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Vs Friends
            </CardTitle>
            <CardDescription className="text-zinc-400">
              A simple leaderboard built from your saved Codeforces handles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                Add friend handles in Settings to populate this leaderboard.
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((row, index) => (
                  <div
                    key={row.handle}
                    className={`flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${row.isYou ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-zinc-800 bg-zinc-950/40'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-200">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-100">{row.handle}</span>
                          {row.isYou && <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">You</Badge>}
                          {row.rank && <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">{row.rank}</Badge>}
                        </div>
                        {row.error ? (
                          <p className="text-sm text-red-400 mt-1">{row.error}</p>
                        ) : (
                          <p className="text-sm text-zinc-500 mt-1">Max rating {row.maxRating ?? 'N/A'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-center min-w-20">
                        <div className="text-zinc-500 text-xs">Rating</div>
                        <div className="text-zinc-100 font-semibold">{row.rating ?? 'N/A'}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-center min-w-20">
                        <div className="text-zinc-500 text-xs">Solved</div>
                        <div className="text-zinc-100 font-semibold">{row.solvedCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Daily Block */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Your Active Problem Block
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">
                  Solve these {stats.currentBlock?.length || 0} problems. The system strictly enforces the 5:3:2 ratio for {stats.targetRating}, {stats.targetRating + 100}, and {stats.targetRating + 200}.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm px-3 py-1">
                Daily Goal: {stats.dailyGoal}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!stats.currentBlock || stats.currentBlock.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No active block. Click &quot;Sync CF&quot; to generate your first block of problems!</p>
                <Button onClick={syncProgress} disabled={syncing} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {syncing ? 'Generating...' : 'Generate Block'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.currentBlock.map((prob) => {
                  let ratingColor = "text-zinc-300";
                  let borderColor = "border-zinc-700";
                  
                  if (prob.rating === stats.targetRating) {
                    ratingColor = "text-green-400";
                    borderColor = "border-green-500/30";
                  } else if (prob.rating === stats.targetRating + 100) {
                    ratingColor = "text-cyan-400";
                    borderColor = "border-cyan-500/30";
                  } else if (prob.rating === stats.targetRating + 200) {
                    ratingColor = "text-purple-400";
                    borderColor = "border-purple-500/30";
                  }

                  return (
                    <a 
                      key={`${prob.contestId}-${prob.index}`}
                      href={`https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`block p-4 rounded-xl border ${borderColor} ${prob.solved ? 'bg-zinc-950/20 opacity-60 grayscale' : 'bg-zinc-950/50 hover:bg-zinc-800'} transition-all duration-200 group relative overflow-hidden`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-bold ${ratingColor} bg-zinc-900 px-2 py-0.5 rounded text-sm`}>
                          {prob.rating || 'N/A'}
                        </span>
                        {prob.solved ? (
                          <div className="flex items-center gap-1 text-green-500 text-xs font-semibold">
                            SOLVED
                          </div>
                        ) : (
                          <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                        )}
                      </div>
                      <h3 className={`font-medium ${prob.solved ? 'text-zinc-500 line-through' : 'text-zinc-200'} line-clamp-2`} title={prob.name}>{prob.name}</h3>
                      <div className="mt-3 text-xs text-zinc-500 font-mono">
                        {prob.contestId}{prob.index}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
