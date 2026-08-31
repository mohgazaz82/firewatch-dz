export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        service: "FireWatch DZ FIRMS",
        time: new Date().toISOString()
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    if (url.pathname !== "/fires") {
      return new Response("FireWatch DZ FIRMS", { status: 404 });
    }

    if (!env.FIRMS_MAP_KEY) {
      return new Response(JSON.stringify({
        ok: false,
        error: "FIRMS_MAP_KEY is not configured"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const source =
      url.searchParams.get("source") || "VIIRS_NOAA21_NRT";

    const days =
      Math.min(
        5,
        Math.max(
          1,
          Number(url.searchParams.get("days") || 1)
        )
      );

    const area = "-8.70,18.96,11.98,37.10";

    const api =
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${env.FIRMS_MAP_KEY}/${source}/${area}/${days}`;

    try {
      const response = await fetch(api);
      const text = await response.text();

      if (!response.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: `NASA FIRMS HTTP ${response.status}`,
          details: text.substring(0, 500)
        }), {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        source,
        days,
        fetched_at: new Date().toISOString(),
        csv: text
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (error) {

      return new Response(JSON.stringify({
        ok: false,
        error: "Unable to reach NASA FIRMS",
        details: String(error)
      }), {
        status: 502,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  }
};
