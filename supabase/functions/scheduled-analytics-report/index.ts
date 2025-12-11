import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScheduleRequest {
  frequency: "weekly" | "monthly";
  email: string;
  enabled?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a manual trigger or scheduled trigger
    const url = new URL(req.url);
    const isScheduledRun = url.searchParams.get("scheduled") === "true";

    // For manual management requests, verify admin authentication
    if (!isScheduledRun) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error("Missing authorization header for analytics report management");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });

      const { data: { user }, error: userError } = await userClient.auth.getUser();
      
      if (userError || !user) {
        console.error("Invalid token or user not found:", userError);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (rolesError || !roles || roles.length === 0) {
        console.error("User is not an admin:", user.id);
        return new Response(
          JSON.stringify({ error: "Forbidden: Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Admin user ${user.id} is managing analytics report schedules`);
    }

    if (isScheduledRun) {
      // Fetch all active schedules
      const { data: schedules, error: scheduleError } = await supabase
        .from("analytics_report_schedules")
        .select("*")
        .eq("is_active", true);

      if (scheduleError) {
        throw scheduleError;
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayOfMonth = now.getDate();

      for (const schedule of schedules || []) {
        let shouldSend = false;

        if (schedule.frequency === "weekly" && dayOfWeek === 1) {
          // Send weekly reports on Monday
          shouldSend = true;
        } else if (schedule.frequency === "monthly" && dayOfMonth === 1) {
          // Send monthly reports on the 1st
          shouldSend = true;
        }

        if (shouldSend) {
          await sendAnalyticsReport(supabase, schedule.email, schedule.frequency);
          
          // Update last_sent timestamp
          await supabase
            .from("analytics_report_schedules")
            .update({ last_sent: now.toISOString() })
            .eq("id", schedule.id);
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Scheduled reports processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle manual schedule management
    const { frequency, email, enabled }: ScheduleRequest = await req.json();

    if (enabled === false) {
      // Disable schedule
      const { error } = await supabase
        .from("analytics_report_schedules")
        .update({ is_active: false })
        .eq("email", email);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Schedule disabled" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Upsert schedule
    const { error } = await supabase
      .from("analytics_report_schedules")
      .upsert(
        { email, frequency, is_active: true },
        { onConflict: "email" }
      );

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: "Schedule saved" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in scheduled-analytics-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendAnalyticsReport(supabase: any, email: string, frequency: string) {
  const days = frequency === "weekly" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch analytics data
  const { data: orders } = await supabase
    .from("orders")
    .select("total_amount, status, created_at")
    .gte("created_at", startDate.toISOString());

  const { data: users } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", startDate.toISOString());

  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0) || 0;
  const totalOrders = orders?.length || 0;
  const newUsers = users?.length || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  orders?.forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const statusRows = Object.entries(statusCounts)
    .map(([status, count]) => `<tr><td style="padding: 8px; border: 1px solid #e5e7eb;">${status}</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${count}</td></tr>`)
    .join("");

  const periodLabel = frequency === "weekly" ? "Weekly" : "Monthly";
  const dateRange = `${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;

  await resend.emails.send({
    from: "Blinno Analytics <analytics@blinno.app>",
    to: [email],
    subject: `${periodLabel} Analytics Report - ${new Date().toLocaleDateString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #14b8a6, #0891b2); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
          .stat-card { background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #14b8a6; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #14b8a6; color: white; padding: 12px; text-align: left; }
          td { padding: 8px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${periodLabel} Analytics Report</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">${dateRange}</p>
          </div>
          <div class="content">
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
                <div class="stat-label">Total Revenue</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${totalOrders}</div>
                <div class="stat-label">Total Orders</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${newUsers}</div>
                <div class="stat-label">New Users</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">$${avgOrderValue.toFixed(2)}</div>
                <div class="stat-label">Avg Order Value</div>
              </div>
            </div>
            
            ${statusRows ? `
            <h3 style="margin-bottom: 8px;">Order Status Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                ${statusRows}
              </tbody>
            </table>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated report from Blinno Platform</p>
            <p>To manage your report preferences, visit the Admin Dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log(`Analytics report sent to ${email}`);
}

serve(handler);
