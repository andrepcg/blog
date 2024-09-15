import React from "react";
import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";

async function getWeather(api_key) {
  const url = `https://api.weather.com/v2/pws/observations/current?stationId=ICOIMB53&format=json&units=m&apiKey=${api_key}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function windDirection(deg) {
  let dir;
  if (deg >= 337.5 || deg < 22.5) dir = "N";
  if (deg >= 22.5 && deg < 67.5) dir = "NE";
  if (deg >= 67.5 && deg < 112.5) dir = "E";
  if (deg >= 112.5 && deg < 157.5) dir = "SE";
  if (deg >= 157.5 && deg < 202.5) dir = "S";
  if (deg >= 202.5 && deg < 247.5) dir = "SW";
  if (deg >= 247.5 && deg < 292.5) dir = "W";
  if (deg >= 292.5 && deg < 337.5) dir = "NW";

  return (
    <span>
      {dir}
      <span style={{ transform: `rotate(${deg}deg)` }}>⬇</span>
    </span>
  );
}

function formatDate(epoch) {
  const date = new Date(epoch * 1000);
  return date.toLocaleString("pt-PT", { timeZone: 'Europe/Lisbon', timeZoneName: 'short' });
}

const ICON_STYLE = { fontSize: 40, textShadow: "1px 1px 0px #333" };
const DATA_POINT_STYLE = {
  fontSize: 30,
  display: "flex",
  flexDirection: "column",
  padding: 2,
  alignItems: "center",
  paddingLeft: 30,
  paddingRight: 30,
}

function DataPoint({ icon, units, value, extraValue }) {
  return (
    <div style={DATA_POINT_STYLE}>
      <span style={ICON_STYLE}>{icon}</span>
      <span>
        {`${value} ${units}`}
      </span>
      {extraValue && <span>{extraValue}</span>}
    </div>
  )
}

function Widget({ observation }) {

  const main = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    backgroundColor: "#eec35e",
    background: "linear-gradient(20deg, rgba(238,195,94,1) 0%, rgba(245,223,171,1) 85%)",
    color: "#333",
    padding: "20px",
    borderRadius: "10px",
  };
  const row = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  }

  return (
    <div style={main}>
      <h2
        style={{
          fontSize: 60,
          marginBottom: 0,
          lineHeight: 0.5,
          fontWeight: 600,
        }}
      >
        ICOIMB53
      </h2>
      <p style={{ fontSize: 30, marginBottom: 0, lineHeight: 0.8 }}>
        <strong>Carvalhais de Baixo, Coimbra (40.174, -8.440)</strong>
      </p>
      <p style={{ fontSize: 20, marginBottom: 15 }}>
        <span style={{ marginRight: 8 }}>Last Measurement:</span> {formatDate(observation.epoch)}
      </p>

      <div style={row}>
        <DataPoint icon="🌡️" units="°C" value={observation.metric.temp} />
        <DataPoint icon="💧" units="%" value={observation.humidity} />
        <DataPoint icon="🌬️" units="hPa" value={observation.metric.pressure} />
        <DataPoint icon="🌧️" units="mm/hr" value={observation.metric.precipRate} />
      </div>

      <div style={row}>
        <DataPoint icon="☀️" units="W/m²" value={observation.solarRadiation} extraValue={`${observation.uv} UV`} />
        <DataPoint icon="💨" units="km/h" value={observation.solarRadiation} extraValue={windDirection(observation.winddir)} />
        <DataPoint icon="🌪️" units="km/h" value={observation.metric.windGust} />
      </div>
    </div>
  );
}

const IMAGE_CACHE_MINUTES = 3;

export const onRequest = async ({ env }) => {
  const generated_at = await env.KV_BLOG.get("image_generated_at");
  if (generated_at) {
    const last_generated = new Date(generated_at);
    console.log("Last generated at", last_generated);
    const diff = new Date() - last_generated;
    if (diff < 1000 * 60 * IMAGE_CACHE_MINUTES) { // 5 minutes
      console.log("Returning cached image")
      return new Response(await env.KV_BLOG.get("image_data", "stream"));
    }
  }

  const data = await getWeather(env.WUNDERGROUND_API_KEY);

  const img = new ImageResponse(
    <Widget observation={data.observations[0]} />,
    {
      width: 700,
      height: 430,
      emoji: "openmoji",
      headers: {
        "Cache-Control": `public, max-age=${60 * IMAGE_CACHE_MINUTES}`,
      }
    }
  );
  console.log("Generating new image")
  await Promise.all([
    env.KV_BLOG.put("image_generated_at", new Date().toISOString()),
    env.KV_BLOG.put("image_data", img.body),
  ]);

  return new Response(await env.KV_BLOG.get("image_data", "stream"));
};
