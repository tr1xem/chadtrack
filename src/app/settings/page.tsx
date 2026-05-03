"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cfHandle, setCfHandle] = useState('');
  const [friends, setFriends] = useState('');
  const [targetRating, setTargetRating] = useState('');
  const [customDailyGoal, setCustomDailyGoal] = useState('');
  const [unchadMode, setUnchadMode] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setCfHandle(data.user.cfHandle);
        setFriends(Array.isArray(data.user.friends) ? data.user.friends.join(', ') : '');
        setTargetRating(data.user.targetRating.toString());
        if (data.user.customDailyGoal) {
          setCustomDailyGoal(data.user.customDailyGoal.toString());
        }
        setUnchadMode(!!data.user.unchadMode);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cfHandle, targetRating, customDailyGoal, friends, unchadMode }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Settings updated successfully!');
      } else {
        setError(data.error);
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <header className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Settings
            </h1>
            <p className="text-sm text-zinc-400">Manage your ChadForce configuration</p>
          </div>
        </header>

        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription className="text-zinc-400">Update your Codeforces handle or manually adjust your target rating.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">{error}</div>}
            {success && <div className="p-3 mb-4 text-sm text-green-500 bg-green-500/10 rounded-md border border-green-500/20">{success}</div>}
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cfHandle">Codeforces Handle</Label>
                <Input 
                  id="cfHandle" 
                  value={cfHandle} 
                  onChange={(e) => setCfHandle(e.target.value)} 
                  required 
                  className="bg-zinc-800 border-zinc-700" 
                />
                <p className="text-xs text-zinc-500">Changing your handle will invalidate your current problem block.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetRating">Target Rating</Label>
                <Input 
                  id="targetRating" 
                  type="number"
                  min="800"
                  value={targetRating} 
                  onChange={(e) => setTargetRating(e.target.value)} 
                  required 
                  className="bg-zinc-800 border-zinc-700" 
                />
                <p className="text-xs text-zinc-500">The rating &apos;X&apos; around which problem blocks are generated. Minimum is 800.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="friends">Vs Friends</Label>
                <Input
                  id="friends"
                  value={friends}
                  onChange={(e) => setFriends(e.target.value)}
                  placeholder="tourist, petr, ecnerwala"
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-zinc-500">Comma-separated Codeforces handles for the leaderboard.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customDailyGoal">Daily Goal (Optional)</Label>
                <Input 
                  id="customDailyGoal" 
                  type="number"
                  min="1"
                  value={customDailyGoal} 
                  onChange={(e) => setCustomDailyGoal(e.target.value)} 
                  placeholder="e.g. 10"
                  className="bg-zinc-800 border-zinc-700" 
                />
                <p className="text-xs text-zinc-500">Override the dynamic daily goal. Changing this will invalidate your current block.</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="space-y-0.5">
                  <Label htmlFor="unchadMode" className="text-base font-semibold">Unchad Mode</Label>
                  <p className="text-sm text-zinc-400">Filter out DP, Graphs, and Trees for lower ratings. Resets current block.</p>
                </div>
                <Button 
                  type="button" 
                  variant={unchadMode ? "default" : "outline"}
                  className={unchadMode ? "bg-indigo-600 hover:bg-indigo-700" : "border-zinc-700 text-zinc-400"}
                  onClick={() => setUnchadMode(!unchadMode)}
                >
                  {unchadMode ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
