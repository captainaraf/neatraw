
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { ArrowRight, FileSpreadsheet, Share2, Sparkles, Database, MessageSquareText, BarChart3, Lock, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: FileSpreadsheet,
      title: "Drop Any Spreadsheet",
      desc: "Drag & drop Excel, CSV, or paste data directly. We auto-detect headers and data types instantly.",
    },
    {
      icon: Database,
      title: "Structured & Clean",
      desc: "View your data in a pristine grid. Sort, filter, and aggregate without breaking anything.",
    },
    {
      icon: Share2,
      title: "Share Securely",
      desc: "Generate expiring links or invite collaborators by email. They see exactly what you share.",
    },
    {
      icon: BarChart3,
      title: "Instant Visualizations",
      desc: "Create bar, line, and pie charts from your data with one click. Export as PNG or PDF.",
    },
    {
      icon: MessageSquareText,
      title: "Chat With Your Data",
      desc: "Ask questions in plain English. Our AI analyzes your data and gives you clear answers.",
    },
    {
      icon: Lock,
      title: "Privacy First",
      desc: "Your data stays yours. Private by default, share only what you choose to share.",
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden text-foreground">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8 fade-up-1">
              <Sparkles className="h-3.5 w-3.5" />
              Data Sharing Reimagined
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6 fade-up-1 leading-[1.15]">
              Share raw data.{" "}
              <span className="text-primary">
                Create any view.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10 fade-up-2 leading-relaxed">
              Stop wrestling with spreadsheet formatting. Upload your raw Excel data,
              and let recipients create their own tables, charts, and insights—without touching your original.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-up-2">
              <Link
                href="/login"
                className="btn btn-primary btn-lg w-full sm:w-auto"
              >
                <Zap className="h-5 w-5" />
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="btn btn-secondary btn-lg w-full sm:w-auto"
              >
                See how it works
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground fade-up-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                No credit card required
              </div>
              <div className="divider-vertical"></div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private by default
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 fade-up-3">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                Everything you need to share data
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Upload once, visualize infinitely. Each recipient can explore your data their own way.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 fade-up-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="card card-hover p-6"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Showcase */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                One upload, endless possibilities
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Your recipient decides how to view the data—table, chart, or chat.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-lg fade-up-3">
              <div className="rounded-xl overflow-hidden">
                {/* Window Chrome */}
                <div className="h-11 border-b border-border bg-muted/50 flex items-center px-4 gap-2">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="ml-4 h-6 flex-1 max-w-sm rounded-md bg-muted flex items-center px-3">
                    <span className="text-xs text-muted-foreground">neatraw.app/data/q3-sales-report</span>
                  </div>
                </div>

                {/* Mock Content */}
                <div className="p-6 sm:p-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                  {/* Left: Table Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="tabs">
                        <div className="tab tab-active">Raw Data</div>
                        <div className="tab">Charts</div>
                        <div className="tab">Ask AI</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-20 rounded-lg bg-muted" />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted/50 px-4 py-2 flex gap-4 text-xs font-semibold text-muted-foreground uppercase">
                        <span className="w-24">Region</span>
                        <span className="w-24">Revenue</span>
                        <span className="w-20">Growth</span>
                      </div>
                      {[
                        { region: "North", revenue: "$124,500", growth: "+12%" },
                        { region: "South", revenue: "$98,200", growth: "+8%" },
                        { region: "East", revenue: "$156,800", growth: "+18%" },
                        { region: "West", revenue: "$87,300", growth: "+5%" },
                      ].map((row, i) => (
                        <div key={i} className={`px-4 py-3 flex gap-4 text-sm ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                          <span className="w-24 font-medium text-foreground">{row.region}</span>
                          <span className="w-24 text-foreground">{row.revenue}</span>
                          <span className="w-20 text-success font-medium">{row.growth}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Chart + Chat Preview */}
                  <div className="space-y-4">
                    {/* Mini Chart */}
                    <div className="h-40 rounded-lg bg-muted/30 border border-border p-4 flex items-end justify-center gap-3">
                      {[55, 40, 70, 35].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-12 rounded-t-lg bg-primary"
                        />
                      ))}
                    </div>

                    {/* Chat Preview */}
                    <div className="rounded-lg border border-border p-4 space-y-3 bg-card">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 h-8 rounded-lg bg-muted/50 flex items-center px-3 text-xs text-muted-foreground">
                          Which region grew the most?
                        </div>
                      </div>
                      <div className="ml-10 p-3 rounded-lg bg-primary/5 text-sm text-foreground border border-primary/10">
                        <strong>East</strong> showed the highest growth at <strong>+18%</strong>, generating $156,800 in revenue.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
              Ready to simplify data sharing?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands who&apos;ve stopped sending messy spreadsheets.
            </p>
            <Link
              href="/login"
              className="btn btn-primary btn-lg inline-flex"
            >
              <Zap className="h-5 w-5" />
              Get started—it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground">
                neat<span className="text-primary">raw</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NeatRaw. Share data, not headaches.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
