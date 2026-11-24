import { useState } from "react";
import estate from "../../data/demos/it-estate-ops.json";
import branchData from "../../data/demos/it-estate-branches.json";
import desk from "../../data/demos/it-service-desk.json";
import "../../styles/sys01.css";

type Endpoint = (typeof estate.endpoints)[number];
type EstateAlert = (typeof estate.alerts)[number];
type BranchAllocation = {
  assets: number;
  loanIds: readonly string[];
  licenseIds: readonly string[];
  backupNames: readonly string[];
  failedCommands: number;
  ticketFlow: typeof estate.ticketFlow;
};
const allocations: Readonly<Partial<Record<string, BranchAllocation>>> = branchData;
const clock = Date.parse(estate.now);
const day = 86_400_000;
const flowMax = Math.max(1, ...estate.ticketFlow.flatMap(item => [item.opened, item.resolved]));

function freshness(endpoint: Endpoint) {
  if (!endpoint.last_seen) return "Never seen";
  return clock - Date.parse(endpoint.last_seen) > estate.staleAfterMinutes * 60000 ? "Stale" : "Online";
}

function reconcile(alerts: EstateAlert[], endpoint: Endpoint, rule: string | null, triggered: boolean, severity: string, title: string) {
  const matches = (alert: EstateAlert) => !alert.resolved && alert.endpoint === endpoint.id && alert.rule === rule;
  if (!triggered) return alerts.map(alert => matches(alert) ? { ...alert, resolved: true } : alert);
  if (alerts.some(matches)) return alerts.map(alert => matches(alert) ? { ...alert, title } : alert);
  return [...alerts, { id: `sim-${alerts.length + 1}`, endpoint: endpoint.id, rule, severity, title, resolved: false, source: rule ? "Threshold breach" : "Availability" }];
}

function availability(alerts: EstateAlert[], endpoint: Endpoint) {
  return reconcile(alerts, endpoint, null, freshness(endpoint) !== "Online", "critical",
    `${endpoint.name} · ${endpoint.last_seen ? "last seen over 15 minutes ago" : "never checked in"}`);
}

function digestCounts(allocation?: BranchAllocation) {
  const loans = allocation ? estate.loans.filter(loan => allocation.loanIds.includes(loan.id)) : estate.loans;
  const licenses = allocation ? estate.licenses.filter(license => allocation.licenseIds.includes(license.id)) : estate.licenses;
  const backups = allocation ? estate.backups.filter(backup => allocation.backupNames.includes(backup.name)) : estate.backups;
  return [
    ["Overdue loans", loans.filter(loan => !loan.returned_at && loan.due_at && Date.parse(loan.due_at) < clock).length],
    ["Licenses expiring within 30 days", licenses.filter(license => {
      const remaining = Date.parse(license.expires_on + "T00:00:00Z") - clock;
      return remaining >= 0 && remaining <= 30 * day;
    }).length],
    ["Stale backups", backups.filter(backup => clock - Date.parse(backup.last_success_at) > backup.expected_interval_hours * 3_600_000).length],
    ["Failed commands in 24 hours", allocation?.failedCommands ?? estate.commands.failed_last_24h],
  ] as const;
}

export default function EstateOverviewDemo() {
  const [branchId, setBranchId] = useState("");
  const [endpoints, setEndpoints] = useState<Endpoint[]>(estate.endpoints);
  const [alerts, setAlerts] = useState<EstateAlert[]>(estate.alerts);
  const [inspected, setInspected] = useState("e1");
  const [disk, setDisk] = useState(estate.endpoints[0].disk);
  const [scope, setScope] = useState("in-hours");
  const [dueDate, setDueDate] = useState("2026-03-11T17:00");
  const [notice, setNotice] = useState("");
  const visible = endpoints.filter(endpoint => !branchId || endpoint.branch === branchId);
  const activeAlerts = alerts.filter(alert => !alert.resolved && visible.some(endpoint => endpoint.id === alert.endpoint));
  const selected = visible.find(endpoint => endpoint.id === inspected) ?? visible[0];
  const branch = estate.branches.find(item => item.id === branchId);
  const allocation = allocations[branchId];
  const activeTickets = desk.tickets.filter(ticket => !["Resolved", "Closed"].includes(ticket.status) && (!branch || ticket.branch === branch.name)).length;
  const digest = digestCounts(allocation).filter(([, count]) => count > 0);
  const ticketFlow = allocation?.ticketFlow ?? estate.ticketFlow;
  function inspect(endpoint: Endpoint) {
    setInspected(endpoint.id); setDisk(endpoint.disk);
  }
  function changeBranch(id: string) {
    setBranchId(id);
    const first = endpoints.find(endpoint => !id || endpoint.branch === id);
    if (first && id && selected?.branch !== id) inspect(first);
    setNotice("");
  }
  function checkIn() {
    if (!selected) return;
    const updated = { ...selected, disk, last_seen: estate.now };
    setEndpoints(previous => previous.map(endpoint => endpoint.id === updated.id ? updated : endpoint));
    setAlerts(previous => {
      let next = availability(previous, updated);
      for (const rule of estate.alertRules) {
        const value = updated[rule.metric as "disk" | "cpu"];
        next = reconcile(next, updated, rule.id, value > rule.threshold, rule.severity, `${rule.name}: ${rule.metric} at ${value}% (limit > ${rule.threshold}%)`);
      }
      return next;
    });
    setNotice(`Check-in received from ${updated.name}. Thresholds and availability reconciled.`);
  }
  function sweep() {
    setAlerts(previous => visible.reduce((next, endpoint) => availability(next, endpoint), previous));
    setNotice(`Availability sweep checked ${visible.length} endpoints.`);
  }
  function reset() {
    setBranchId(""); setEndpoints(estate.endpoints); setAlerts(estate.alerts); inspect(estate.endpoints[0]);
    setScope("in-hours"); setDueDate("2026-03-11T17:00"); setNotice("Estate monitor reset to its initial state.");
  }
  return <div className="it-ops" data-estate-overview>
    <header className="ops-heading"><p className="ops-caption"><bdi>10 March 2026, 10:00 UTC</bdi> · Stale after <bdi>{estate.staleAfterMinutes} minutes</bdi></p>
      <label>Branch scope<select value={branchId} onChange={event => changeBranch(event.target.value)}><option value="">All branches</option>{estate.branches.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></header>
    <dl className="ops-readouts">{[
      ["Endpoints / offline", `${visible.length} / ${visible.filter(endpoint => freshness(endpoint) !== "Online").length}`],
      ["Open critical alerts", activeAlerts.filter(alert => alert.severity === "critical").length],
      ["Active tickets", activeTickets], ["Registered assets", (allocation?.assets ?? estate.assets.total).toLocaleString("en-US")],
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd><bdi>{value}</bdi></dd></div>)}</dl>
    <h4>Branch patch panels</h4><div className="patch-matrix">{estate.branches.filter(item => !branchId || item.id === branchId).map(item => <fieldset key={item.id}><legend>{item.name}</legend>
      <div className="patch-ports">{visible.filter(endpoint => endpoint.branch === item.id).map(endpoint => {
        const state = freshness(endpoint);
        return <button key={endpoint.id} aria-pressed={inspected === endpoint.id} data-state={state} title={`${endpoint.name}: ${endpoint.last_seen ?? "never checked in"}`} onClick={() => inspect(endpoint)}>
          <i aria-hidden="true">{state === "Online" ? "●" : state === "Stale" ? "◷" : "◇"}</i><span><bdi>{endpoint.name}</bdi><small>{state}</small></span></button>;
      })}</div></fieldset>)}</div>
    <div className="ops-panes">
      {selected && <div className="ops-pane"><h4>Endpoint telemetry</h4><p><strong><bdi>{selected.name}</bdi></strong> · {selected.type}</p><p className="ops-caption">Last seen <bdi aria-label={selected.last_seen === null ? "not set" : undefined}>{selected.last_seen ?? "—"}</bdi></p>
        <dl className="ops-dates"><div><dt>CPU</dt><dd><bdi>{selected.cpu}%</bdi></dd></div><div><dt>RAM</dt><dd><bdi>{selected.ram}%</bdi></dd></div><div><dt>Reported disk</dt><dd><bdi>{selected.disk}%</bdi></dd></div></dl>
        <label><span>Simulated disk usage · <bdi>{disk}%</bdi></span><input type="range" min="0" max="100" step="1" value={disk} onChange={event => setDisk(Number(event.target.value))}/></label>
        <div className="ops-formbar"><button className="ops-primary" onClick={checkIn}>Simulate agent check-in</button><button onClick={sweep}>Run availability sweep</button></div>
      </div>}
      <div className="ops-pane"><h4>Open alerts · <bdi>{activeAlerts.length}</bdi></h4>{activeAlerts.length ? <ul className="ops-list">{activeAlerts.map(alert => <li key={alert.id}>
        <span className={`ops-state ${alert.severity === "critical" ? "critical" : "outline"}`}>{alert.severity === "critical" ? "!" : "△"} {alert.severity}</span>
        <strong><bdi>{endpoints.find(endpoint => endpoint.id === alert.endpoint)?.name}</bdi></strong><p><bdi>{alert.title}</bdi></p>
        <button onClick={() => { setAlerts(previous => previous.map(item => item.id === alert.id ? { ...item, resolved: true } : item)); setNotice(`Resolved ${alert.title}.`); }}>Resolve</button>
      </li>)}</ul> : <p>No open alerts in this scope.</p>}</div>
    </div>
    <p className="ops-notice" role="status">{notice}</p>
    <div className="ops-panes"><div className="ops-pane"><h4>Needs action</h4>{digest.length ? <dl className="ops-dates">{digest.map(([label, count]) => <div key={label}><dt>{label}</dt><dd><bdi>{count}</bdi></dd></div>)}</dl> : <p>No outstanding actions in this scope.</p>}</div>
      <div className="ops-pane"><h4>Loan scope trigger tester</h4><p className="ops-caption">Test loan · {branch?.name ?? "All branches"}</p><label>Loan scope<select value={scope} onChange={event => setScope(event.target.value)}>{["in-hours", "overnight", "off-site", "after-hours"].map(value => <option key={value}>{value}</option>)}</select></label>
      {scope !== "in-hours" && <label>Return deadline (UTC)<input type="datetime-local" min="2026-03-10T10:01" value={dueDate} onChange={event => setDueDate(event.target.value)}/></label>}
      <dl className="ops-dates"><div><dt>Due at</dt><dd><bdi aria-label={scope === "in-hours" ? "not set" : undefined}>{scope === "in-hours" ? "—" : (dueDate && dueDate > "2026-03-10T10:00" ? dueDate + "Z" : "Future deadline required")}</bdi></dd></div><div><dt>Email record</dt><dd>{scope === "in-hours" ? "Cleared" : "Required"}</dd></div></dl></div></div>
    <div className="ops-pane"><h4>Seven-day ticket flow</h4><p className="ops-caption">Solid bar · Opened. Hatched bar · Resolved.</p><div className="flow-chart" role="group" aria-label={`Daily opened and resolved ticket counts · ${branch?.name ?? "All branches"}`}>{ticketFlow.map(item => <div key={item.day} className="flow-day">
      <div className="flow-bars" aria-hidden="true"><i style={{ height: `${100 * item.opened / flowMax}%` }}/><i style={{ height: `${100 * item.resolved / flowMax}%` }}/></div><bdi>{item.day}</bdi><small aria-label={`${item.opened} opened, ${item.resolved} resolved`}><bdi>{item.opened} / {item.resolved}</bdi></small>
    </div>)}</div></div>
    <details><summary>What engineering invariant is running here?</summary><p>Each endpoint can have one open alert per threshold and one availability alert. Repeated checks reconcile that alert. A healthy reading resolves it. In-hours loans clear both their deadline and email obligation.</p><p>Branch allocations are synthetic and add up to the original estate totals.</p></details>
    <button type="button" onClick={reset}>Reset demo state</button>
  </div>;
}
