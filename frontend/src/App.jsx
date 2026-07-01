import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';

/* ─── Palette ───────────────────────────────────────────────────────────────── */
const C = {
  darkBlue:   '#005130',
  lightBlue:  '#64a357',
  yellow:     '#ff8eff',
  white:      '#FFFFFF',
  bg:         '#eef3ee',
  border:     '#d0e2d1',
  muted:      '#609472',
  rowAlt:     '#f4faf5',
  rowCurrent: '#fff6ff',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const fh = v => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));

const calcTotals = list => {
  const h = list.reduce((s, e) => s + e.home_hours,    0);
  const c = list.reduce((s, e) => s + e.company_hours, 0);
  const t = h + c;
  return { h, c, t, hr: t > 0 ? (h / t) * 100 : 0, cr: t > 0 ? (c / t) * 100 : 0 };
};

/* ─── Shared static styles ──────────────────────────────────────────────────── */
const NAV_BTN = {
  width:           34,
  height:          34,
  borderRadius:    7,
  border:          `1.5px solid ${C.border}`,
  backgroundColor: C.white,
  color:           C.darkBlue,
  cursor:          'pointer',
  fontSize:        22,
  fontWeight:      700,
  fontFamily:      'Barlow, sans-serif',
  lineHeight:      1,
  padding:         0,
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  transition:      'background-color 0.15s',
};

const LABEL = {
  display:       'block',
  marginBottom:  6,
  fontFamily:    'Barlow, sans-serif',
  fontWeight:    700,
  fontSize:      12,
  color:         C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

/* ─── RatioBar ──────────────────────────────────────────────────────────────── */
function RatioBar({ hr, cr, height = 28 }) {
  if (!hr && !cr) {
    return <div style={{ height, borderRadius: 6, backgroundColor: C.border }} />;
  }

  const seg = (pct, bg) =>
    pct > 0 ? (
      <div
        style={{
          width:          `${pct}%`,
          minWidth:       3,
          height,
          backgroundColor: bg,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          C.white,
          fontSize:       11,
          fontWeight:     700,
          fontFamily:     'Barlow, sans-serif',
          transition:     'width 0.35s ease',
          overflow:       'hidden',
        }}
      >
        {pct >= 15 ? `${pct.toFixed(1)}%` : ''}
      </div>
    ) : null;

  return (
    <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height }}>
      {seg(hr, C.lightBlue)}
      {seg(cr, C.darkBlue)}
    </div>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────────────────── */
function StatCard({ title, data, accent }) {
  const chips = [
    { emoji: '🏠', label: 'Home Office', val: data.h, ratio: data.hr, color: C.lightBlue, bg: '#eef3e6' },
    { emoji: '🏢', label: 'Company',     val: data.c, ratio: data.cr, color: C.darkBlue,  bg: '#e6f0e8' },
  ];

  return (
    <div
      style={{
        backgroundColor: C.white,
        borderRadius:    12,
        padding:         '20px 22px',
        boxShadow:       '0 2px 14px rgba(25,70,125,0.08)',
        border:          `1px solid ${C.border}`,
        borderTop:       `4px solid ${accent}`,
      }}
    >
      <p
        style={{
          margin:        '0 0 14px',
          fontFamily:    'Barlow, sans-serif',
          fontWeight:    700,
          fontSize:      12,
          color:         C.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}
      >
        {title}
      </p>

      <RatioBar hr={data.hr} cr={data.cr} height={30} />

      {/* Legend row */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 2 }}>
        {chips.map(({ color, label }) => (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.muted }}
          >
            <span
              style={{
                display:         'inline-block',
                width:           10,
                height:          10,
                borderRadius:    2,
                backgroundColor: color,
                flexShrink:      0,
              }}
            />
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        {chips.map(({ emoji, label, val, ratio, color, bg }) => (
          <div
            key={label}
            style={{
              flex:        1,
              backgroundColor: bg,
              borderRadius: 8,
              padding:     '10px 12px',
              borderLeft:  `3px solid ${color}`,
            }}
          >
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2 }}>
              {emoji} {label.toUpperCase()}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>
              {fh(val)}
              <span style={{ fontSize: 12, fontWeight: 600 }}> h</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{ratio.toFixed(1)}%</div>
          </div>
        ))}
      </div>

      {data.t > 0 && (
        <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 12, color: C.muted }}>
          {fh(data.t)} h worked total
        </p>
      )}
    </div>
  );
}

/* ─── App ───────────────────────────────────────────────────────────────────── */
export default function App() {
  /* Server state */
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connErr, setConnErr] = useState(false);

  /* Form state */
  const todayISO = new Date().toISOString().split('T')[0];
  const [date,      setDate]      = useState(todayISO);
  const [homeInput, setHomeInput] = useState('');
  const [coInput,   setCoInput]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [feedback,  setFeedback]  = useState(null); // { ok: bool, msg: string }

  /* Month navigation */
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  /* ── Data fetching ──────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/entries');
      if (!r.ok) throw new Error('bad response');
      setEntries(await r.json());
      setConnErr(false);
    } catch {
      setConnErr(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  /* ── Populate form when date changes or after initial load ──────────────── */
  // We intentionally omit `entries` from deps so polling never overwrites user input.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loading) return;
    const saved = entries.find(e => e.date === date);
    setHomeInput(saved ? String(saved.home_hours)    : '');
    setCoInput(  saved ? String(saved.company_hours) : '');
  }, [date, loading]);

  /* ── Derived values ─────────────────────────────────────────────────────── */
  const hv = parseFloat(homeInput) || 0;
  const cv = parseFloat(coInput)   || 0;

  // Blend form's live values with saved entries for real-time stats
  const effective = useMemo(() => {
    const base = entries.filter(e => e.date !== date);
    if (hv || cv) {
      return [...base, { date, home_hours: hv, company_hours: cv }];
    }
    const saved = entries.find(e => e.date === date);
    return saved ? [...base, saved] : base;
  }, [entries, date, hv, cv]);

  const monthKey  = `${year}-${String(month).padStart(2, '0')}`;
  const monthRows = useMemo(
    () =>
      effective
        .filter(e => e.date.startsWith(monthKey))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [effective, monthKey]
  );

  const monthly = useMemo(() => calcTotals(monthRows),  [monthRows]);
  const allTime = useMemo(() => calcTotals(effective),   [effective]);

  // Table rows with cumulative running totals
  const tableData = useMemo(() => {
    let ch = 0, cc = 0;
    return monthRows.map(e => {
      ch += e.home_hours;
      cc += e.company_hours;
      const ct = ch + cc;
      const dt = e.home_hours + e.company_hours;
      return {
        ...e,
        dt,
        dhr:    dt > 0 ? (e.home_hours    / dt) * 100 : 0,
        dcr:    dt > 0 ? (e.company_hours / dt) * 100 : 0,
        cumHR:  ct > 0 ? (ch              / ct) * 100 : 0,
        isEdit: e.date === date,
      };
    });
  }, [monthRows, date]);

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleSubmit = async ev => {
    ev.preventDefault();
    if (!hv && !cv) {
      setFeedback({ ok: false, msg: 'Enter at least one value greater than 0.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/entries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ date, home_hours: hv, company_hours: cv }),
      });
      setFeedback(r.ok
        ? { ok: true,  msg: '✓ Entry saved' }
        : { ok: false, msg: '✗ Save failed — is the backend running?' }
      );
      if (r.ok) load();
    } catch {
      setFeedback({ ok: false, msg: '✗ Connection error' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDelete = async d => {
    if (!window.confirm(`Delete entry for ${d}?`)) return;
    try {
      await fetch(`/api/entries/${d}`, { method: 'DELETE' });
      if (d === date) { setHomeInput(''); setCoInput(''); }
      load();
    } catch { /* silent */ }
  };

  const prevMonth = () =>
    month === 1
      ? (setMonth(12), setYear(y => y - 1))
      : setMonth(m => m - 1);
  const nextMonth = () =>
    month === 12
      ? (setMonth(1), setYear(y => y + 1))
      : setMonth(m => m + 1);

  /* ── Shared input style factory ─────────────────────────────────────────── */
  const inp = active => ({
    width:           '100%',
    padding:         '10px 14px',
    border:          `1.5px solid ${active ? C.darkBlue : C.border}`,
    borderRadius:    8,
    fontFamily:      'Barlow, sans-serif',
    fontSize:        15,
    color:           C.darkBlue,
    outline:         'none',
    backgroundColor: C.white,
    transition:      'border-color 0.2s',
  });

  const savedEntry = entries.find(e => e.date === date);
  const dayTotal   = hv + cv;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div 
    style={{
      minHeight: '100vh', 
      fontFamily: 'Barlow, sans-serif',
      background: `linear-gradient(to bottom, ${C.white} 0%, ${C.bg} 75%, ${C.bg}`
      }}>
      <Navbar />

      {/* ── Connection error banner ── */}
      {connErr && (
        <div
          style={{
            backgroundColor: '#FFF3CD',
            borderBottom:    '1px solid #FFC107',
            color:           '#7D5A00',
            padding:         '10px 32px',
            fontSize:        14,
            fontFamily:      'Barlow, sans-serif',
          }}
        >
          ⚠ Backend unreachable — ensure the server is running on port 8000. Retrying every 3 s.
        </div>
      )}

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* ══ Row 1: Form + Stats ══════════════════════════════════════════════ */}
        <div
          style={{
            display:    'flex',
            flexWrap:   'wrap',
            gap:        22,
            alignItems: 'flex-start',
            marginBottom: 22,
          }}
        >
          {/* ── Log Form ── */}
          <div
            style={{
              flex:            '0 1 355px',
              minWidth:        260,
              backgroundColor: C.white,
              borderRadius:    12,
              padding:         '26px 24px',
              boxShadow:       '0 2px 14px rgba(25,70,125,0.08)',
              border:          `1px solid ${C.border}`,
              borderTop:       `4px solid ${C.yellow}`,
            }}
          >
            <h2
              style={{
                margin:     '0 0 22px',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize:   18,
                color:      C.darkBlue,
              }}
            >
              📝 Log Work Hours
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              {/* Date */}
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={inp(false)}
                />
                {savedEntry && (
                  <p style={{ margin: '5px 0 0', fontSize: 12, color: C.lightBlue }}>
                    ✓ Editing existing entry for this date
                  </p>
                )}
              </div>

              {/* Home hours */}
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL}>
                  <span style={{ color: C.lightBlue, marginRight: 5 }}>■</span>
                  Home Office Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="0"
                  value={homeInput}
                  onChange={e => setHomeInput(e.target.value)}
                  style={inp(hv > 0)}
                />
              </div>

              {/* Company hours */}
              <div style={{ marginBottom: 20 }}>
                <label style={LABEL}>
                  <span style={{ color: C.darkBlue, marginRight: 5 }}>■</span>
                  Company Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="0"
                  value={coInput}
                  onChange={e => setCoInput(e.target.value)}
                  style={inp(cv > 0)}
                />
              </div>

              {/* Live day-split preview */}
              {(hv > 0 || cv > 0) && (
                <div
                  style={{
                    marginBottom:    18,
                    padding:         '10px 12px',
                    backgroundColor: '#f4faf5',
                    borderRadius:    8,
                    border:          `1px solid ${C.border}`,
                  }}
                >
                  <p style={{ margin: '0 0 7px', fontSize: 12, color: C.muted, fontWeight: 600 }}>
                    Today's split — {fh(dayTotal)} h entered
                  </p>
                  <RatioBar
                    hr={dayTotal > 0 ? (hv / dayTotal) * 100 : 0}
                    cr={dayTotal > 0 ? (cv / dayTotal) * 100 : 0}
                    height={22}
                  />
                </div>
              )}

              {/* Save button */}
              <button
                type="submit"
                disabled={saving}
                style={{
                  width:           '100%',
                  padding:         '11px 0',
                  backgroundColor: saving ? '#99AECA' : C.darkBlue,
                  color:           C.white,
                  border:          'none',
                  borderRadius:    8,
                  fontFamily:      'Barlow, sans-serif',
                  fontWeight:      700,
                  fontSize:        15,
                  cursor:          saving ? 'not-allowed' : 'pointer',
                  transition:      'background-color 0.2s',
                }}
                onMouseEnter={e => {
                  if (!saving) e.currentTarget.style.backgroundColor = C.lightBlue;
                }}
                onMouseLeave={e => {
                  if (!saving) e.currentTarget.style.backgroundColor = C.darkBlue;
                }}
              >
                {saving ? 'Saving…' : 'Save Entry'}
              </button>

              {/* Feedback */}
              {feedback && (
                <div
                  style={{
                    marginTop:       10,
                    padding:         '8px 12px',
                    borderRadius:    6,
                    textAlign:       'center',
                    fontSize:        14,
                    fontWeight:      600,
                    fontFamily:      'Barlow, sans-serif',
                    backgroundColor: feedback.ok ? '#E8F5E9' : '#FFF3CD',
                    color:           feedback.ok ? '#2E7D32' : '#7D5A00',
                  }}
                >
                  {feedback.msg}
                </div>
              )}
            </form>
          </div>

          {/* ── Stats cards ── */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <StatCard
              title={`${MONTHS[month - 1]} ${year}`}
              data={monthly}
              accent={C.border} /* C.lightBlue */
            />
            <StatCard
              title="All Time"
              data={allTime}
              accent={C.border} /* C.yellow */
            />
          </div>
        </div>

        {/* ══ Row 2: Monthly Table ══════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius:    12,
            padding:         '26px 24px',
            boxShadow:       '0 2px 14px rgba(25,70,125,0.08)',
            border:          `1px solid ${C.border}`,
          }}
        >
          {/* Table header row */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              flexWrap:       'wrap',
              gap:            12,
              marginBottom:   18,
            }}
          >
            <h2
              style={{
                margin:     0,
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize:   18,
                color:      C.darkBlue,
              }}
            >
              📅 Monthly Breakdown
            </h2>

            {/* Month navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={prevMonth} style={NAV_BTN}>‹</button>
              <span
                style={{
                  minWidth:   162,
                  textAlign:  'center',
                  fontFamily: 'Barlow, sans-serif',
                  fontWeight: 700,
                  fontSize:   15,
                  color:      C.darkBlue,
                }}
              >
                {MONTHS[month - 1]} {year}
              </span>
              <button onClick={nextMonth} style={NAV_BTN}>›</button>
            </div>
          </div>

          {/* Color legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {[
              { color: C.lightBlue, label: 'Home Office' },
              { color: C.darkBlue,  label: 'Company' },
            ].map(({ color, label }) => (
              <div
                key={label}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.muted }}
              >
                <span
                  style={{
                    display:         'inline-block',
                    width:           12,
                    height:          12,
                    borderRadius:    3,
                    backgroundColor: color,
                    flexShrink:      0,
                  }}
                />
                {label}
              </div>
            ))}
          </div>

          {/* Table content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
              Loading data…
            </div>
          ) : tableData.length === 0 ? (
            <div
              style={{
                textAlign:  'center',
                padding:    '40px 0',
                color:      C.muted,
                lineHeight: 1.9,
                fontSize:   14,
              }}
            >
              No entries for {MONTHS[month - 1]} {year}.
              <br />
              Log some hours above, or edit{' '}
              <code
                style={{
                  backgroundColor: '#EBF0F8',
                  padding:         '1px 5px',
                  borderRadius:    4,
                }}
              >
                backend/work_hours.csv
              </code>{' '}
              directly.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width:           '100%',
                  borderCollapse:  'collapse',
                  fontFamily:      'Barlow, sans-serif',
                  fontSize:        14,
                }}
              >
                <thead>
                  <tr>
                    {[
                      'Date', 'Home (h)', 'Office (h)', 'Total (h)',
                      'Day Split', 'Running HO %', '',
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding:         '9px 12px',
                          backgroundColor: C.darkBlue,
                          color:           C.white,
                          fontWeight:      700,
                          fontSize:        12,
                          textTransform:   'uppercase',
                          letterSpacing:   '0.5px',
                          textAlign:       i === 0 || i === 4 ? 'left' : 'center',
                          whiteSpace:      'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tableData.map((row, idx) => (
                    <tr
                      key={row.date}
                      style={{
                        backgroundColor: row.isEdit
                          ? C.rowCurrent
                          : idx % 2 === 0 ? C.white : C.rowAlt,
                        outline:      row.isEdit ? `2px solid ${C.yellow}` : 'none',
                        outlineOffset: -1,
                      }}
                    >
                      {/* Date */}
                      <td
                        style={{
                          padding:    '9px 12px',
                          whiteSpace: 'nowrap',
                          fontWeight: row.isEdit ? 700 : 500,
                          color:      C.darkBlue,
                        }}
                      >
                        {new Date(row.date + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month:   'short',
                          day:     'numeric',
                        })}
                        {row.isEdit && (
                          <span
                            style={{
                              marginLeft:      7,
                              fontSize:        10,
                              fontWeight:      700,
                              backgroundColor: C.yellow,
                              color:           C.white,
                              padding:         '1px 6px',
                              borderRadius:    4,
                            }}
                          >
                            editing
                          </span>
                        )}
                      </td>

                      {/* Home hours */}
                      <td
                        style={{
                          padding:    '9px 12px',
                          textAlign:  'center',
                          fontWeight: 700,
                          color:      C.lightBlue,
                        }}
                      >
                        {fh(row.home_hours)}
                      </td>

                      {/* Company hours */}
                      <td
                        style={{
                          padding:    '9px 12px',
                          textAlign:  'center',
                          fontWeight: 700,
                          color:      C.darkBlue,
                        }}
                      >
                        {fh(row.company_hours)}
                      </td>

                      {/* Day total */}
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: C.muted }}>
                        {fh(row.dt)}
                      </td>

                      {/* Day split bar */}
                      <td style={{ padding: '9px 12px', minWidth: 120 }}>
                        <RatioBar hr={row.dhr} cr={row.dcr} height={18} />
                      </td>

                      {/* Cumulative home-office % */}
                      <td
                        style={{
                          padding:    '9px 12px',
                          textAlign:  'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ color: C.lightBlue, fontWeight: 700 }}>
                          {row.cumHR.toFixed(1)}%
                        </span>
                        <span style={{ color: C.muted, fontSize: 11, marginLeft: 3 }}>HO</span>
                      </td>

                      {/* Delete */}
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(row.date)}
                          title="Delete this entry"
                          style={{
                            backgroundColor: 'transparent',
                            border:          'none',
                            color:           '#C0392B',
                            cursor:          'pointer',
                            fontSize:        15,
                            padding:         '2px 6px',
                            borderRadius:    5,
                            fontFamily:      'Barlow, sans-serif',
                            opacity:         0.5,
                            transition:      'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.backgroundColor = '#FDECEA';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.opacity = '0.5';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer summary */}
                <tfoot>
                  <tr style={{ backgroundColor: '#e6f0e8', fontWeight: 700 }}>
                    <td style={{ padding: '9px 12px', color: C.darkBlue, fontSize: 13 }}>
                      Monthly Total
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: C.lightBlue }}>
                      {fh(monthly.h)}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: C.darkBlue }}>
                      {fh(monthly.c)}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: C.muted }}>
                      {fh(monthly.t)}
                    </td>
                    <td style={{ padding: '9px 12px', minWidth: 120 }}>
                      <RatioBar hr={monthly.hr} cr={monthly.cr} height={18} />
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      <span style={{ color: C.lightBlue, fontWeight: 700 }}>
                        {monthly.hr.toFixed(1)}%
                      </span>
                      <span style={{ color: C.muted, fontSize: 11, marginLeft: 3 }}>HO</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: C.muted }}>
          Stats refresh every 3 s · Edit{' '}
          <code
            style={{
              backgroundColor: '#e6f0e8',
              padding:         '1px 5px',
              borderRadius:    4,
            }}
          >
            backend/work_hours.csv
          </code>{' '}
          directly — changes appear automatically
        </p>
      </main>
    </div>
  );
}