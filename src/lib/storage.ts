import { supabase } from './supabaseClient';

export type UserData = {
  name: string;
  year: string;
  favoriteSubjects: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  lifeGoals: string;
};

const KEY = 'itineris:user:v1';
const USER_DATA_TABLE = 'user_data';
const DASHBOARD_DATA_TABLE = 'dashboard_data';
const DASHBOARD_CACHE_PREFIX = 'itineris:dashboard:v1';

export type DashboardTask = {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  color: string;
  priority: 1 | 2 | 3;
  date?: string;
  time?: string;
};

export type DashboardData = {
  tasks: DashboardTask[];
  studyData: Record<string, number[]>;
  sessionsByDay: Record<string, number>;
};

export function loadUserData(): UserData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
}

export function saveUserData(data: UserData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full or disabled — ignore
  }
}

export function clearUserData() {
  localStorage.removeItem(KEY);
}

export async function loadUserDataFromSupabase(userId: string): Promise<UserData | null> {
  try {
    const { data, error } = await supabase
      .from(USER_DATA_TABLE)
      .select('data')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase load user data error:', error);
      return null;
    }

    return (data?.data as UserData) ?? null;
  } catch (error) {
    console.error('Supabase load user data error:', error);
    return null;
  }
}

export async function saveUserDataToSupabase(userId: string, data: UserData): Promise<void> {
  try {
    const { error } = await supabase.from(USER_DATA_TABLE).upsert({ id: userId, data });
    if (error) {
      console.error('Supabase save user data error:', error);
    }
  } catch (error) {
    console.error('Supabase save user data error:', error);
  }
}

export async function loadDashboardDataFromSupabase(userId: string): Promise<DashboardData | null> {
  try {
    const { data, error } = await supabase
      .from(DASHBOARD_DATA_TABLE)
      .select('data')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase load dashboard data error:', error);
      return null;
    }

    return (data?.data as DashboardData) ?? null;
  } catch (error) {
    console.error('Supabase load dashboard data error:', error);
    return null;
  }
}

export async function saveDashboardDataToSupabase(userId: string, data: DashboardData): Promise<void> {
  try {
    const { error } = await supabase.from(DASHBOARD_DATA_TABLE).upsert({ id: userId, data });
    if (error) {
      console.error('Supabase save dashboard data error:', error);
    }
  } catch (error) {
    console.error('Supabase save dashboard data error:', error);
  }
}

export function loadDashboardDataFromLocal(userId?: string): DashboardData | null {
  const key = `${DASHBOARD_CACHE_PREFIX}:${userId ?? 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DashboardData) : null;
  } catch {
    return null;
  }
}

export function saveDashboardDataToLocal(userId: string | undefined, data: DashboardData) {
  const key = `${DASHBOARD_CACHE_PREFIX}:${userId ?? 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full or disabled — ignore
  }
}
