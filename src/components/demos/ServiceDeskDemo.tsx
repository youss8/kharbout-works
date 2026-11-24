import { Fragment, useEffect, useEffectEvent, useRef, useState, type SubmitEvent, type ReactNode } from "react";
import fixture from "../../data/demos/it-service-desk.json";
import "../../styles/sys01.css";
import { compareUrgency, durationParts, rankPriority, slaElapsedPercent, slaState } from "../../lib/kernels/sla";

interface Ticket {
  id: string; ref: number; title: string; requester: string; branch: string; priority: string;
  status: string; assignee: string | null; created_at: string; sla_due_at: string;
  first_response_at: string | null; resolved_at: string | null;
}
type Slice = "Active" | "Breached" | "Closing <2h" | "Unassigned";
const statuses = ["Open", "In Progress", "Pending", "Scheduled", "Resolved", "Closed"];
const priorities = Object.keys(fixture.slaHours) as Array<keyof typeof fixture.slaHours>;
const slices: Slice[] = ["Active", "Breached", "Closing <2h", "Unassigned"];
const now = Date.parse(fixture.now);
const hour = 3_600_000;
const isActive = (ticket: Ticket) => !["Closed", "Resolved"].includes(ticket.status);
const deadline = (ticket: Ticket) => Date.parse(ticket.sla_due_at);
const priorityRank = (ticket: Ticket) => rankPriority(ticket.priority);

function matchesSlice(ticket: Ticket, slice: Slice) {
  if (!isActive(ticket)) return false;
  const state = slaState(ticket, now);
  switch (slice) {
    case "Active": return true;
    case "Breached": return state === "breached";
    case "Closing <2h": return state === "closing";
    case "Unassigned": return ticket.assignee === null;
  }
}

function updateStatus(ticket: Ticket, status: string): Ticket {
  return { ...ticket, status, resolved_at: ["Resolved", "Closed"].includes(status) ? ticket.resolved_at ?? fixture.now : null };
}

function duration(milliseconds: number) {
  const { hours, minutes } = durationParts(milliseconds);
  return [hours ? `${hours}h` : "", minutes || !hours ? `${minutes}m` : ""].filter(Boolean).join(" ");
}

function agentName(id: string | null) {
  return fixture.agents.find(agent => agent.id === id)?.name ?? "Unassigned";
}

function matchesSearch(ticket: Ticket, term: string) {
  return [ticket.ref, ticket.title, ticket.requester, ticket.branch, agentName(ticket.assignee)]
    .join(" ").toLowerCase().includes(term.trim().toLowerCase());
}

function RequestSla({ ticket }: { ticket: Ticket }) {
  const end = deadline(ticket);
  const remaining = end - (ticket.resolved_at ? Date.parse(ticket.resolved_at) : now);
  const width = slaElapsedPercent(ticket, now);
  if (width === null) return <span aria-label="not set">—</span>;
  const label = isActive(ticket) ? <><bdi>{duration(remaining)}</bdi> {remaining < 0 ? "overdue" : "left"}</> : (remaining < 0 ? "Resolved late" : "Met SLA");
  return <div className="desk-sla" data-breached={isActive(ticket) && remaining < 0}><span>{label}</span><div className="desk-track"><i style={{ width: width + "%" }} /></div></div>;
}

function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return <dialog ref={ref} aria-label={title} className="ops-dialog" onCancel={close} onClick={event => { if (event.target === ref.current) close(); }}>
    <div className="ops-dialog-body"><header><h4>{title}</h4><button type="button" aria-label="Close dialog" onClick={close}>Close ×</button></header>{children}</div>
  </dialog>;
}

const initialFilters = { status: "", priority: "", owner: "", branch: "", sort: "Urgency" };

export default function ServiceDeskDemo() {
  const [tickets, setTickets] = useState<Ticket[]>(fixture.tickets);
  const [comments, setComments] = useState(fixture.comments);
  const [timeEntries, setTimeEntries] = useState(fixture.timeEntries);
  const [history, setHistory] = useState<{ id: string; message: string; at: string }[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [slice, setSlice] = useState<Slice | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const searchPending = query.trim().toLowerCase() !== search;
  const [selected, setSelected] = useState<string[]>([]);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [newRequest, setNewRequest] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim().toLowerCase()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  function reveal(ticket: Ticket) {
    setFilters(previous => ({
      ...previous,
      status: previous.status === ticket.status ? previous.status : "",
      priority: previous.priority === ticket.priority ? previous.priority : "",
      branch: previous.branch === ticket.branch ? previous.branch : "",
      owner: previous.owner === (ticket.assignee ?? "unassigned") ? previous.owner : "",
    }));
    setSlice(previous => previous && matchesSlice(ticket, previous) ? previous : null);
    setQuery(previous => matchesSearch(ticket, previous) ? previous : "");
    setSearch(previous => matchesSearch(ticket, previous) ? previous : "");
    setOpenedId(ticket.id);
  }
  const readTicketLink = useEffectEvent(() => {
    const id = new URLSearchParams(window.location.search).get("ticket");
    const ticket = tickets.find(row => row.id === id);
    if (ticket) reveal(ticket);
    else {
      setOpenedId(null);
      if (id) setNotice("This ticket is unavailable in the local demo.");
    }
  });
  useEffect(() => {
    const sync = () => readTicketLink();
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  function showTicket(id: string | null, replace = false) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("ticket", id); else url.searchParams.delete("ticket");
    if (url.href !== window.location.href) {
      if (replace) window.history.replaceState(window.history.state, "", url); else window.history.pushState(window.history.state, "", url);
    }
    setOpenedId(id);
  }
  function clearFilters() {
    setQuery(""); setSearch(""); setFilters(initialFilters); setSlice(null); setSelected([]);
  }
  function reset() {
    setTickets(fixture.tickets); setComments(fixture.comments); setTimeEntries(fixture.timeEntries);
    setHistory([]); clearFilters(); showTicket(null, true); setNewRequest(false); setNotice("Service desk reset to its initial state.");
  }
  function changeFilter(key: keyof typeof filters, value: string) {
    if (key !== "sort" && openedId) showTicket(null);
    setFilters(previous => ({ ...previous, [key]: value })); setSelected([]);
  }
  const matches = tickets.filter(ticket =>
    (!slice || matchesSlice(ticket, slice)) &&
    (!filters.status || filters.status === ticket.status) &&
    (!filters.priority || filters.priority === ticket.priority) &&
    (!filters.owner || filters.owner === (ticket.assignee ?? "unassigned")) &&
    (!filters.branch || ticket.branch === filters.branch) &&
    matchesSearch(ticket, search)
  ).sort((a, b) => {
    const age = Date.parse(a.created_at) - Date.parse(b.created_at);
    if (filters.sort === "Newest") return -age;
    if (filters.sort === "Oldest") return age;
    if (filters.sort === "Priority") return priorityRank(a) - priorityRank(b) || age;
    return compareUrgency(a, b, now);
  });
  const selectedIds = matches.filter(ticket => selected.includes(ticket.id)).map(ticket => ticket.id);
  function appendHistory(ids: string[], message: string) {
    setHistory(previous => [...previous, ...ids.map(id => ({ id, message, at: fixture.now }))]);
  }
  function editTicket(ticket: Ticket, updated: Ticket, message: string) {
    setTickets(previous => previous.map(row => row.id === ticket.id ? updated : row));
    appendHistory([ticket.id], message);
    reveal(updated);
  }
  function bulk(action: string) {
    if (openedId && selectedIds.includes(openedId)) showTicket(null);
    setTickets(previous => previous.map(ticket => selectedIds.includes(ticket.id) ?
      (action === "assign" ? { ...ticket, assignee: "u1" } : updateStatus(ticket, action)) : ticket));
    appendHistory(selectedIds, action === "assign" ? "Assigned to Alex Rivera." : "Status changed to " + action + ".");
    setNotice(`${selectedIds.length} requests ${action === "assign" ? "assigned to Alex Rivera" : "updated to " + action}.`); setSelected([]);
  }
  function create(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const priority = String(data.get("priority")) as keyof typeof fixture.slaHours;
    const title = String(data.get("title") ?? "").trim();
    const requester = String(data.get("requester") ?? "").trim();
    if (!title || !requester) { setNotice("Enter a request title and requester."); return; }
    const ref = Math.max(...tickets.map(ticket => ticket.ref)) + 1;
    const ticket = { id: "t" + ref, ref, title, requester, branch: String(data.get("branch")), priority,
      status: "Open", created_at: fixture.now, assignee: null, first_response_at: null, resolved_at: null,
      sla_due_at: new Date(now + fixture.slaHours[priority] * hour).toISOString() };
    setTickets(previous => [...previous, ticket]); setNewRequest(false); clearFilters();
    setNotice(`Created request #${ref} with a ${fixture.slaHours[priority]}h SLA.`);
    showTicket(ticket.id);
  }
  function postComment(event: SubmitEvent<HTMLFormElement>, ticket: Ticket) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = String(data.get("body") ?? "").trim();
    if (!body) return;
    const internal = data.get("visibility") === "Internal";
    setComments(previous => [...previous, { ticket: ticket.id, author: "u1", internal, body, at: fixture.now }]);
    appendHistory([ticket.id], internal ? "Internal note added." : "Public reply posted.");
    if (!internal) setTickets(previous => previous.map(row => row.id === ticket.id && !row.first_response_at ? { ...row, first_response_at: fixture.now } : row));
    event.currentTarget.reset();
  }
  function logTime(event: SubmitEvent<HTMLFormElement>, ticket: Ticket) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const note = String(data.get("note") ?? "").trim();
    const minutes = Number(data.get("minutes"));
    if (!note || !Number.isInteger(minutes) || minutes < 1) return;
    appendHistory([ticket.id], `Logged ${minutes} minutes of work.`);
    setTimeEntries(previous => [...previous, { ticket: ticket.id, tech: "u1", minutes, note }]); event.currentTarget.reset();
  }
  function renderDetails(openTicket: Ticket) {
    const times = timeEntries.filter(entry => entry.ticket === openTicket.id);
    function close() {
      showTicket(null);
      document.getElementById(`toggle-${openTicket.id}`)?.focus();
    }
    return <section className="ops-ticket-detail" id={`detail-${openTicket.id}`} aria-label={`Request #${openTicket.ref}`}
      onKeyDown={event => { if (event.key === "Escape") close(); }}>
      <header className="ops-heading"><h4><bdi>#{openTicket.ref}</bdi> · {openTicket.title}</h4><button type="button" onClick={close}>Collapse request</button></header>
      <p>{openTicket.requester} · {openTicket.branch}</p>
      <div className="ops-formbar"><label>Status<select value={openTicket.status} onChange={event => editTicket(openTicket, updateStatus(openTicket, event.target.value), `Status changed to ${event.target.value}.`)}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Assignee<select value={openTicket.assignee ?? ""} onChange={event => { const assignee = event.target.value || null; editTicket(openTicket, { ...openTicket, assignee }, `Assignee set to ${agentName(assignee)}.`); }}><option value="">Unassigned</option>{fixture.agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label></div>
      <dl className="ops-dates">{[["SLA due", openTicket.sla_due_at], ["First public response", openTicket.first_response_at], ["Resolved at", openTicket.resolved_at]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd><bdi aria-label={value == null ? "not set" : undefined}>{value ?? "—"}</bdi></dd></div>)}</dl>
      <h5>Comment thread</h5><ul className="ops-list">{comments.filter(comment => comment.ticket === openTicket.id).map((comment, index) => <li key={index}><strong>{comment.internal ? "Internal" : "Public"} · {agentName(comment.author)}</strong><small><bdi>{comment.at}</bdi></small><p>{comment.body}</p></li>)}</ul>
      <form className="ops-stack" onSubmit={event => postComment(event, openTicket)}><label>Visibility<select name="visibility"><option>Public</option><option>Internal</option></select></label><label>Comment<textarea name="body" required maxLength={2000}/></label><button>Post comment</button></form>
      <h5>Time log · <bdi>{times.reduce((sum, item) => sum + item.minutes, 0)} min</bdi></h5><ul className="ops-list">{times.map((entry, index) => <li key={index}><bdi>{entry.minutes} min</bdi> · {agentName(entry.tech)} · {entry.note}</li>)}</ul>
      <form className="ops-stack" onSubmit={event => logTime(event, openTicket)}><label>Minutes<input name="minutes" type="number" min="1" max="1440" step="1" required/></label><label>Work note<input name="note" required maxLength={300}/></label><button>Log time</button></form>
      <h5>Audit timeline</h5>
      <ol className="ops-list"><li><small><bdi>{openTicket.created_at}</bdi></small>Request opened.</li>
        {history.filter(entry => entry.id === openTicket.id).map((entry, index) =>
          <li key={index}><small><bdi>{entry.at}</bdi></small>{entry.message}</li>)}</ol>
    </section>;
  }
  return <div className="it-ops" data-service-desk>
    <header className="ops-heading"><p className="ops-caption"><bdi>10 March 2026, 10:00 UTC</bdi> · Signed in as Alex Rivera</p><button type="button" className="ops-primary" onClick={() => { setNotice(""); setNewRequest(true); }}>New request</button>
    {selectedIds.length > 0 && <div className="ops-bulk" role="group" aria-label="Bulk actions"><strong><bdi>{selectedIds.length}</bdi> selected</strong><button onClick={() => bulk("assign")}>Assign to me</button>
      <label>Set status<select value="" onChange={event => { if (event.target.value) bulk(event.target.value); }}><option value="">Choose…</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label></div>}
    </header>
    <div className="ops-kpis">{slices.map(item => { const count = tickets.filter(ticket => matchesSlice(ticket, item)).length;
      return <button key={item} aria-pressed={item === slice} data-alert={item === "Breached" && count > 0} onClick={() => { if (openedId) showTicket(null); setSlice(slice === item ? null : item); setSelected([]); }}><span>{item}</span><strong><bdi>{count}</bdi></strong></button>; })}</div>
    <div className="ops-formbar">
      <label>Search requests<input type="search" value={query} onChange={event => { if (openedId) showTicket(null); setQuery(event.target.value); setSelected([]); }} /></label>
      {([["status", "Status", statuses], ["priority", "Priority", priorities], ["branch", "Branch", fixture.branches], ["sort", "Sort", ["Urgency", "Newest", "Oldest", "Priority"]]] as const).map(([key, label, values]) => <label key={key}>{label}<select value={filters[key]} onChange={event => changeFilter(key, event.target.value)}>
        {key !== "sort" && <option value="">All</option>}{values.map(value => <option key={value}>{value}</option>)}</select></label>)}
      <label>Owner<select value={filters.owner} onChange={event => changeFilter("owner", event.target.value)}><option value="">All</option><option value="unassigned">Unassigned</option>{fixture.agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
      <button onClick={clearFilters}>Clear filters</button>
    </div>
    <div className="ops-table-scroll" role="region" aria-label="Request table" aria-busy={searchPending} data-loading={searchPending || undefined} tabIndex={0}><table>
      <thead><tr><th><label className="desk-selection"><input type="checkbox" aria-label="Select all visible requests" checked={matches.length > 0 && selectedIds.length === matches.length} disabled={matches.length === 0}
        ref={input => { if (input) input.indeterminate = selectedIds.length > 0 && selectedIds.length < matches.length; }}
        onChange={event => setSelected(event.target.checked ? matches.map(ticket => ticket.id) : [])}/><span aria-hidden="true">Select all visible requests</span></label></th><th>Request</th><th>Branch</th><th>Priority</th><th>Status</th><th>Assignee</th><th>SLA</th></tr></thead>
      <tbody>{matches.map(ticket => <Fragment key={ticket.id}><tr data-request-row><td><label className="desk-selection"><input type="checkbox" aria-label={`Select request ${ticket.ref}`} checked={selectedIds.includes(ticket.id)} onChange={event => setSelected(event.target.checked ? [...selected, ticket.id] : selected.filter(id => id !== ticket.id))}/></label></td>
        <th scope="row"><button id={`toggle-${ticket.id}`} className="ops-text-action" aria-expanded={openedId === ticket.id} aria-controls={openedId === ticket.id ? `detail-${ticket.id}` : undefined} onClick={() => showTicket(openedId === ticket.id ? null : ticket.id)}><bdi>#{ticket.ref}</bdi> · {ticket.title}</button><small>{ticket.requester}</small></th>
        <td>{ticket.branch}</td><td>{ticket.priority}</td><td><span className={`ops-state ${isActive(ticket) ? "outline" : "surface"}`}>{isActive(ticket) ? "◷" : "✓"} {ticket.status}</span></td><td>{agentName(ticket.assignee)}</td><td><RequestSla ticket={ticket}/></td></tr>
        {openedId === ticket.id && <tr className="ops-detail-row"><td colSpan={7}>{renderDetails(ticket)}</td></tr>}
      </Fragment>)}</tbody></table>
    </div>
    {!matches.length && <p>No requests match these filters.</p>}

    <p role="status" className="ops-notice">{notice}</p>
    <p className="ops-caption">Observed in Codebase · Ticket links expand a row in the queue. This local sandbox uses fictional requests and records activity as timeline messages.</p>
    <details><summary>What engineering invariant is running here?</summary><p>Priority determines the resolution deadline. Only a public reply stamps the first response. Reopening clears the resolution timestamp. SLA bars keep a visible 2% floor.</p></details>
    <button type="button" onClick={reset}>Reset demo state</button>
    {newRequest && <Dialog title="New request" close={() => setNewRequest(false)}><form className="ops-stack" onSubmit={create}><label>Request title<input name="title" maxLength={180} required autoFocus/></label><label>Requester<input name="requester" maxLength={100} required/></label>
      <label>Branch<select name="branch">{fixture.branches.map(branch => <option key={branch}>{branch}</option>)}</select></label><label>Priority<select name="priority" defaultValue="Medium">{priorities.map(value => <option key={value}>{value}</option>)}</select></label><button className="ops-primary">Create request</button></form></Dialog>}

  </div>;
}
