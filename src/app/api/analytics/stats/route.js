import { NextResponse } from "next/server";
import { requireCrmAdmin } from "@/lib/crm/guard";
import {
  getOverviewStats,
  getTrafficSources,
  getTopPages,
  getDeviceBreakdown,
  getDailyPageviews,
  getRecentSignups,
  getUserCounts,
  getCrmEmailStats,
  getCrmTopEmails,
  getCrmContactStats,
  generateInsights,
} from "@/lib/analytics/db";

/**
 * GET /api/analytics/stats?period=7d
 * Dashboard de inteligência — admin only.
 */
export async function GET(req) {
  const guard = await requireCrmAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "7d";

  try {
    // Run queries in parallel where possible
    const [overview, traffic, topPages, devices, daily, recentSignups, userCounts, emailStats, topEmails, crmContacts] =
      await Promise.all([
        getOverviewStats(period),
        getTrafficSources(period),
        getTopPages(period),
        getDeviceBreakdown(period),
        getDailyPageviews(period),
        getRecentSignups(15),
        getUserCounts(),
        getCrmEmailStats().catch(() => ({
          sent: 0, opened: 0, clicked: 0, bounced: 0,
          complained: 0, failed: 0, openRate: 0, clickRate: 0, complaintRate: 0,
        })),
        getCrmTopEmails(10).catch(() => []),
        getCrmContactStats().catch(() => ({
          total: 0, subscribed: 0, unsubscribed: 0, customers: 0,
        })),
      ]);

    const insights = generateInsights({
      overview,
      traffic,
      topPages,
      devices,
      emailStats,
      crmContacts,
      userCounts,
    });

    return NextResponse.json({
      period,
      overview,
      traffic,
      topPages,
      devices,
      daily,
      recentSignups,
      userCounts,
      emailStats,
      topEmails,
      crmContacts,
      insights,
    });
  } catch (err) {
    console.error("[analytics/stats]", err);
    return NextResponse.json(
      { error: "Falha ao buscar stats", detail: err.message },
      { status: 500 }
    );
  }
}
