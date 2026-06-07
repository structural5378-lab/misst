import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { lat = 25.77, lng = -80.19, distance = 100, band = "GMRS" } = body;

    // RepeaterBook public API (no key required for basic queries)
    const url = `https://www.repeaterbook.com/api/exportROW.php?lat=${lat}&lng=${lng}&distance=${distance}&Dunit=m&band=${encodeURIComponent(band)}&freq=&call=&use=OPEN&status_id=1&order=distance_asc`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "MistApp/1.0 (insomniacsgmrs.com)",
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      return Response.json({ error: `RepeaterBook returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const repeaters = (data?.results || []).map((r) => ({
      callsign: r.Callsign || "",
      frequency: parseFloat(r.Frequency) || 0,
      offset: r.Offset || "",
      tone: r.PL || r.TSQ || "",
      location: `${r.Nearest_City || ""}, ${r.State || ""}`.trim().replace(/^,\s*/, ""),
      latitude: parseFloat(r.Lat) || null,
      longitude: parseFloat(r.Long) || null,
      status: "online",
      owner_callsign: r.Trustee || "",
      description: r.Use || ""
    }));

    return Response.json({ repeaters, count: repeaters.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});