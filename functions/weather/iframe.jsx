import React from "react";
import { renderToString } from 'react-dom/server';

async function getWeather(api_key) {
  const url = `https://api.weather.com/v2/pws/observations/current?stationId=ICOIMB53&format=json&units=m&apiKey=${api_key}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function windDirection(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  const dir = directions[index];

  return (
    <>
      {dir}
      <span style={{ display: "inline-block", transform: `rotate(${deg}deg)`, fontWeight: 900, marginLeft: 10, fontSize: 20 }}>↓</span>
    </>
  );
}

function formatDate(epoch) {
  const date = new Date(epoch * 1000);
  return date.toLocaleString("pt-PT", { timeZone: 'Europe/Lisbon', timeZoneName: 'short' });
}

const ICON_STYLE = { fontSize: 26, textShadow: "1px 1px 0px #333" };

function DataPoint({ icon, units, value, extraValue }) {
  return (
    <div className="data_point">
      <span style={ICON_STYLE}>{icon}</span>
      <span>
        {`${value} ${units}`}
      </span>
      {extraValue && <div>{extraValue}</div>}
    </div>
  )
}

function Widget({ observation }) {
  const row = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  }

  return (
    <div className="main">
      <h2
        style={{
          fontSize: 50,
          marginBottom: 0,
          marginTop: 4,
          lineHeight: 0.7,
          fontWeight: 600,
        }}
      >
        ICOIMB53
      </h2>
      <p style={{ fontSize: 16, marginBottom: 0, lineHeight: 0.8 }}>
        Carvalhais de Baixo, Coimbra (40.174, -8.440)
      </p>
      <p style={{ fontSize: 10, marginBottom: 15 }}>
        {formatDate(observation.epoch)}
      </p>

      <div style={row}>
        <DataPoint icon="🌡️" units="°C" value={observation.metric.temp} />
        <DataPoint icon="💧" units="%" value={observation.humidity} />
        <DataPoint icon="🌬️" units="hPa" value={observation.metric.pressure} />
        <DataPoint icon="🌧️" units="mm/hr" value={observation.metric.precipRate} />
      </div>

      <div style={row}>
        <DataPoint icon="☀️" units="W/m²" value={observation.solarRadiation} extraValue={`${observation.uv} UV`} />
        <DataPoint icon="💨" units="km/h" value={observation.metric.windSpeed} extraValue={windDirection(observation.winddir)} />
        <DataPoint icon="🌪️" units="km/h" value={observation.metric.windGust} />
      </div>
    </div>
  );
}

const CACHE_MINUTES = 2;

async function loadWundergroundData(env) {
  let wunderground_data = await env.KV_BLOG.get("wunderground_data")
  if (!wunderground_data) {
    console.log("Fetching new data");
    wunderground_data = await getWeather(env.WUNDERGROUND_API_KEY);
    await env.KV_BLOG.put("wunderground_data", JSON.stringify(wunderground_data), { expirationTtl: CACHE_MINUTES * 60 });
  } else {
    console.log("Using cached data");
    wunderground_data = JSON.parse(wunderground_data);
  }

  return wunderground_data;
}

export const onRequest = async ({ env }) => {
  const wunderground_data = await loadWundergroundData(env);

  const app = renderToString(<Widget observation={wunderground_data.observations[0]} />);

  const html = `<!DOCTYPE html><html lang="pt">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
    body {
      font-family: "Roboto", sans-serif;
      font-weight: 400;
      font-style: normal;
    }
    .main {
      display: flex;
      flex-direction: column;
      width: 350px;
      background-color: #eec35e;
      background: linear-gradient(20deg, rgba(238, 195, 94, 1) 0%, rgba(245, 223, 171, 1) 85%);
      color: #333;
      padding: 20px;
      border-radius: 10px;
    }
    .data_point {
      font-size: 14px;
      display: flex;
      flex-direction: column;
      padding: 2px;
      align-items: center;
      padding-left: 15px;
      padding-right: 15px;
    }
  </style>
  <body>${app}</body>
</html>`
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
};
