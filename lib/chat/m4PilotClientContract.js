// Only completed, server-validated pilot output is adapted to the existing chat UI.
export function pilotChatResult(turn, convId) {
  if (turn.state !== 'completed') return { ok: false, messageKey: 'm4Pilot.pending', pilotState: turn.state };
  const answer = [...turn.answer.blocks.map(b => `${b.text}${b.refs.length ? ` [${b.refs.join(', ')}]` : ''}`),
    ...turn.answer.limitations, ...(turn.answer.clarification ? [turn.answer.clarification] : [])].join('\n\n');
  const sources = turn.sources.map(s => ({ key: `${turn.id}/${s.ref}`, id: `${turn.id}/${s.ref}`, title: s.title,
    label: `${s.ref} · ${s.title} · ${s.used ? 'Vastuses kasutatud' : 'Ainult otsingus leitud'}`, pages: s.pages,
    short_ref: `${s.ref} · ${s.title} · ${s.used ? 'Vastuses kasutatud' : 'Ainult otsingus leitud'}`,
    url: `/chat-source?convId=${encodeURIComponent(convId)}&turnId=${encodeURIComponent(turn.id)}&ref=${encodeURIComponent(s.ref)}`,
    source_type: 'm4_pilot', used: s.used }));
  return { ok: true, answer, sources, displayed_sources: sources, completionStatus: 'COMPLETED', pilotKind: turn.answer.kind, pilotMode: turn.mode };
}
