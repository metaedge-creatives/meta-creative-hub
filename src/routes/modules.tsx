import { createFileRoute } from "@tanstack/react-router";
import { useCRM } from "@/lib/crm/store";
import { useCan, usePaymentsModuleEnabled, useStripeConnected } from "@/lib/crm/hooks";
import { NoAccess } from "@/components/crm/AppShell";
import { PageHeader } from "@/components/crm/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Info, Zap } from "lucide-react";

export const Route = createFileRoute("/modules")({
  head: () => ({
    meta: [
      { title: "Modules · MetaEdge CRM" },
      { name: "description", content: "Toggle optional CRM modules and connect payment providers." },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const can = useCan("settings");
  const paymentsEnabled = usePaymentsModuleEnabled();
  const stripeConnected = useStripeConnected();
  const setSetting = useCRM((s) => s.setSetting);

  if (!can) return <NoAccess module="Modules" />;

  return (
    <div>
      <PageHeader
        title="Modules"
        subtitle="Turn optional modules on or off and connect the services that power them."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Payments card */}
        <section className="rounded-2xl border border-divider bg-card p-6 brand-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-black">Online Payments</div>
                <div className="text-xs" style={{ color: "#777" }}>Let clients pay invoices from the client portal.</div>
              </div>
            </div>
            <Switch
              checked={paymentsEnabled}
              onCheckedChange={(v) => setSetting("modules", "payments", v)}
            />
          </div>

          {paymentsEnabled ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-divider bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Stripe
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: "#777" }}>
                      {stripeConnected
                        ? "Stripe is connected. Clients can pay via secure checkout."
                        : "Not connected — enable Stripe to accept card payments on invoices."}
                    </div>
                  </div>
                  {stripeConnected ? (
                    <Button variant="outline" size="sm" onClick={() => setSetting("modules", "stripeConnected", false)}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setSetting("modules", "stripeConnected", true)}>
                      <Zap className="h-3.5 w-3.5" /> Connect Stripe
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-accent/60 p-3 text-[12px]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  Live Stripe checkout requires Lovable Cloud + Stripe payments to be enabled at the workspace level.
                  Ask us to wire it up and clients will pay directly from their portal.
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs" style={{ color: "#777" }}>
              Payments module is off — the "Pay" button is hidden in the client portal.
            </p>
          )}
        </section>

        {/* Reports card (informational) */}
        <section className="rounded-2xl border border-divider bg-card p-6 brand-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-black">Client Portal Modules</div>
              <div className="text-xs" style={{ color: "#777" }}>Projects, Reports, Services and Proposals — always on.</div>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-[12px]">
            <li>• Clients see live project progress on the <b>Projects</b> tab.</li>
            <li>• Send weekly / monthly updates from <b>Reports</b> — they appear instantly for the client.</li>
            <li>• Clients can browse <b>Services</b> and send custom briefs.</li>
            <li>• Team-created proposals (matched by client name) show in the client's <b>Proposals</b> tab for accept / decline.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
