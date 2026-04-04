import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { Trophy, Dumbbell, Scale, CalendarCheck, Star, Plus, CheckCircle2 } from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";

const MOCK_CHALLENGES = [
  {
    id: "c1",
    title: "April Check-In Blitz",
    description: "Check in to the gym 20 times this month and earn big points. Every visit counts!",
    challenge_type: "check_ins",
    goal_value: 20,
    points_reward: 500,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
  },
  {
    id: "c2",
    title: "Strength Month",
    description: "Complete 16 strength training sessions in April. Build muscle, earn rewards.",
    challenge_type: "workouts",
    goal_value: 16,
    points_reward: 400,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
  },
  {
    id: "c3",
    title: "Weigh-In Warrior",
    description: "Log 4 official weigh-ins this month and track your progress consistently.",
    challenge_type: "weigh_ins",
    goal_value: 4,
    points_reward: 150,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
  },
  {
    id: "c4",
    title: "Step It Up",
    description: "Hit 10,000 steps per day for 15 days this month. Your smartwatch counts it all.",
    challenge_type: "steps",
    goal_value: 15,
    points_reward: 300,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
  },
];

const MOCK_ENTRIES = [
  { id: "e1", challenge_id: "c1", user_id: "me", current_value: 13, completed: false, points_earned: 0 },
  { id: "e2", challenge_id: "c3", user_id: "me", current_value: 4, completed: true, points_earned: 150 },
];

const MOCK_REWARD_POINTS = { total_points: 650, redeemable_points: 300 };

const TYPE_ICONS = {
  check_ins: CalendarCheck,
  workouts: Dumbbell,
  weigh_ins: Scale,
  steps: Star,
  custom: Trophy,
};

const TYPE_LABELS = {
  check_ins: "Check-Ins",
  workouts: "Workouts",
  weigh_ins: "Weigh-Ins",
  steps: "Steps",
  custom: "Custom",
};

function ChallengeCard({ challenge, entry, onEnroll, onLogProgress, enrolling, logging }) {
  const Icon = TYPE_ICONS[challenge.challenge_type] || Trophy;
  const isEnrolled = !!entry;
  const progress = isEnrolled ? Math.min(100, Math.round((entry.current_value / challenge.goal_value) * 100)) : 0;
  const now = new Date();
  const isActive =
    !isBefore(now, parseISO(challenge.start_date)) &&
    !isAfter(now, parseISO(challenge.end_date));
  const isCompleted = isEnrolled && entry.completed;

  return (
    <Card className="relative overflow-hidden">
      {isCompleted && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base">{challenge.title}</CardTitle>
            <CardDescription className="text-xs">
              {format(parseISO(challenge.start_date), "MMM d")} – {format(parseISO(challenge.end_date), "MMM d, yyyy")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{challenge.description}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{TYPE_LABELS[challenge.challenge_type]}: {challenge.goal_value} goal</span>
          <span className="font-bold text-yellow-600">+{challenge.points_reward} pts</span>
        </div>

        {isEnrolled && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{entry.current_value} / {challenge.goal_value}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {!isEnrolled ? (
            <Button
              size="sm"
              className="w-full"
              disabled={enrolling || !isActive}
              onClick={() => onEnroll(challenge)}
            >
              <Plus className="w-4 h-4 mr-1" />
              {isActive ? "Join Challenge" : "Not Active"}
            </Button>
          ) : (
            <>
              {!isCompleted && isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={logging}
                  onClick={() => onLogProgress(entry, challenge)}
                >
                  Log Progress
                </Button>
              )}
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 w-full justify-center py-1">
                  Completed — {entry.points_earned} pts earned
                </Badge>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Rewards() {
  const { environment } = useEnvironment();
  const [currentUser, setCurrentUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [entries, setEntries] = useState([]);
  const [rewardPoints, setRewardPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const user = await api.auth.me();
    setCurrentUser(user);
    const [chs, ents, pts] = await Promise.all([
      api.entities.RewardChallenge.filter({ is_active: true }),
      api.entities.ChallengeEntry.filter({ user_id: user.email }),
      api.entities.RewardPoints.filter({ user_id: user.email }),
    ]);
    setChallenges(chs.length > 0 ? chs : MOCK_CHALLENGES);
    setEntries(ents.length > 0 ? ents : MOCK_ENTRIES);
    setRewardPoints(pts[0] || MOCK_REWARD_POINTS);
    setLoading(false);
  };

  const getEntry = (challengeId) => entries.find((e) => e.challenge_id === challengeId);

  const handleEnroll = async (challenge) => {
    setEnrolling(true);
    await api.entities.ChallengeEntry.create({
      challenge_id: challenge.id,
      user_id: currentUser.email,
      current_value: 0,
      completed: false,
      points_earned: 0,
    });
    await init();
    setEnrolling(false);
  };

  const handleLogProgress = async (entry, challenge) => {
    const input = prompt(`Log progress for "${challenge.title}"\nCurrent: ${entry.current_value} / ${challenge.goal_value}\n\nEnter your new total:`);
    if (input === null) return;
    const newValue = Math.max(entry.current_value, parseFloat(input) || entry.current_value);
    const completed = newValue >= challenge.goal_value;
    const pointsEarned = completed && !entry.completed ? challenge.points_reward : entry.points_earned;
    setLogging(true);
    await api.entities.ChallengeEntry.update(entry.id, {
      current_value: newValue,
      completed,
      points_earned: pointsEarned,
    });
    if (completed && !entry.completed) {
      // Update reward points
      if (rewardPoints) {
        await api.entities.RewardPoints.update(rewardPoints.id, {
          total_points: (rewardPoints.total_points || 0) + challenge.points_reward,
          redeemable_points: (rewardPoints.redeemable_points || 0) + challenge.points_reward,
        });
      } else {
        await api.entities.RewardPoints.create({
          user_id: currentUser.email,
          total_points: challenge.points_reward,
          redeemable_points: challenge.points_reward,
        });
      }
    }
    await init();
    setLogging(false);
  };

  const totalPoints = rewardPoints?.total_points || 0;
  const redeemable = rewardPoints?.redeemable_points || 0;
  const completedCount = entries.filter((e) => e.completed).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: environment.primaryColor }}>
          Rewards &amp; Challenges
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete challenges, earn points, and climb the leaderboard.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-7 h-7 mx-auto mb-2" style={{ color: environment.primaryColor }} />
            <p className="text-3xl font-bold">{totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-7 h-7 mx-auto mb-2 text-yellow-500" />
            <p className="text-3xl font-bold">{redeemable}</p>
            <p className="text-xs text-muted-foreground mt-1">Redeemable</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Challenges */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active Challenges</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading challenges...</p>
        ) : challenges.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No active challenges right now. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {challenges.map((ch) => (
              <ChallengeCard
                key={ch.id}
                challenge={ch}
                entry={getEntry(ch.id)}
                onEnroll={handleEnroll}
                onLogProgress={handleLogProgress}
                enrolling={enrolling}
                logging={logging}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enrolled challenges summary */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">My Challenge History</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="divide-y">
                {entries.map((entry) => {
                  const ch = challenges.find((c) => c.id === entry.challenge_id);
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-semibold text-sm">{ch?.title || "Challenge"}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.current_value} / {ch?.goal_value} {ch ? TYPE_LABELS[ch.challenge_type] : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-yellow-600">+{entry.points_earned} pts</span>
                        <Badge className={entry.completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                          {entry.completed ? "Done" : "In Progress"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}