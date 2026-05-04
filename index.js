
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as readline from "readline";

const client = new Anthropic();

// Data storage
const DATA_FILE = "habits_data.json";

interface HabitEntry {
  date: string;
  completed: boolean;
}

interface Habit {
  name: string;
  description: string;
  entries: HabitEntry[];
  createdAt: string;
}

interface HabitsData {
  habits: { [key: string]: Habit };
}

// Load data from file
function loadData(): HabitsData {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  }
  return { habits: {} };
}

// Save data to file
function saveData(data: HabitsData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get today's date as string
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Add a new habit
function addHabit(
  data: HabitsData,
  name: string,
  description: string
): string {
  if (data.habits[name]) {
    return `Habit "${name}" already exists!`;
  }

  data.habits[name] = {
    name,
    description,
    entries: [],
    createdAt: new Date().toISOString(),
  };

  saveData(data);
  return `Habit "${name}" added successfully!`;
}

// Mark habit as completed for today
function completeHabit(data: HabitsData, name: string): string {
  if (!data.habits[name]) {
    return `Habit "${name}" not found!`;
  }

  const today = getTodayDate();
  const habit = data.habits[name];

  // Check if already completed today
  const todayEntry = habit.entries.find((e) => e.date === today);
  if (todayEntry) {
    if (todayEntry.completed) {
      return `Habit "${name}" already completed today!`;
    }
    todayEntry.completed = true;
  } else {
    habit.entries.push({ date: today, completed: true });
  }

  saveData(data);
  return `Great! Habit "${name}" marked as completed for today!`;
}

// Get statistics for a habit
function getHabitStats(data: HabitsData, name: string): string {
  if (!data.habits[name]) {
    return `Habit "${name}" not found!`;
  }

  const habit = data.habits[name];
  const entries = habit.entries;

  if (entries.length === 0) {
    return `No entries yet for habit "${name}". Start tracking!`;
  }

  const completed = entries.filter((e) => e.completed).length;
  const total = entries.length;
  const percentage = ((completed / total) * 100).toFixed(1);

  // Calculate streak
  let streak = 0;
  const today = getTodayDate();
  let currentDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const entry = entries.find((e) => e.date === dateStr);

    if (entry && entry.completed) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return `
Habit: ${name}
Description: ${habit.description}
Total Days Tracked: ${total}
Completed: ${completed}/${total} (${percentage}%)
Current Streak: ${streak} days
Created: ${habit.createdAt}`;
}

// Get all habits summary
function getAllHabitsSummary(data: HabitsData): string {
  const habitNames = Object.keys(data.habits);

  if (habitNames.length === 0) {
    return "No habits tracked yet. Add a habit to get started!";
  }

  let summary = "=== Health Habits Tracker ===\n";

  for (const habitName of habitNames) {
    const habit = data.habits[habitName];
    const completed = habit.entries.filter((e) => e.completed).length;
    const total = habit.entries.length;
    const percentage = total > 0 ? ((completed / total) * 100).toFixed(0) : "0";

    summary += `\n${habitName}: ${completed}/${total} days (${percentage}%)`;
  }

  return summary;
}

// Simulate user interaction through conversation
async function runHealthHabitTracker(): Promise<void> {
  let data = loadData();
  let conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [];

  // System message for Claude
  const systemMessage = `You are a friendly health habits tracker assistant. Help users track their healthy habits like exercise, meditation, sleep, hydration, etc.

Available commands:
1. "add habit" - Add a new habit to track
2. "complete [habit name]" - Mark a habit as completed for today
3. "stats [habit name]" - Get statistics for a specific habit
4. "summary" - See overview of all habits
5. "list" - Show all tracked habits
6. "quit" - Exit the program

When users want to add a habit, ask for the habit name and description.
When users complete a habit, confirm it was completed.
Provide encouraging messages and insights about their health progress.
Be supportive and motivating!`;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🏃 Health Habits Tracker");
  console.log("========================");