// Thin service layer over local demo data.
//
// Every export returns a Promise so the rest of the app already talks to an
// async data boundary. If a verified public read-only Polymarket endpoint is
// wired in later, only this file needs to change.

import {
  profile,
  stats,
  portfolioSummary,
  performanceHistory,
  openPositions,
  resolvedPositions,
  recentActivity,
} from "../data/profileData";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProfile() {
  await delay(350);
  return profile;
}

export async function getStats() {
  await delay(400);
  return stats;
}

export async function getPortfolioSummary() {
  await delay(400);
  return portfolioSummary;
}

export async function getPerformance(range = "1M") {
  await delay(150);
  return performanceHistory[range] ?? performanceHistory["1M"];
}

export async function getOpenPositions() {
  await delay(450);
  return openPositions;
}

export async function getResolvedPositions() {
  await delay(450);
  return resolvedPositions;
}

export async function getRecentActivity() {
  await delay(400);
  return recentActivity;
}

export async function getProfileBundle() {
  const [profileData, statsData, summaryData, openPos, resolvedPos, activity] = await Promise.all([
    getProfile(),
    getStats(),
    getPortfolioSummary(),
    getOpenPositions(),
    getResolvedPositions(),
    getRecentActivity(),
  ]);
  return {
    profile: profileData,
    stats: statsData,
    portfolioSummary: summaryData,
    openPositions: openPos,
    resolvedPositions: resolvedPos,
    recentActivity: activity,
  };
}
