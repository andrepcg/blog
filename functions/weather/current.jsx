import React from "react";
import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";

//https://api.weather.com/v2/pws/observations/current?stationId=ICOIMB53&format=json&units=m&apiKey=API_KEY

//WUNDERGROUND_API_KEY

const MOCK_DATA = {
  observations: [
    {
      stationID: "ICOIMB53",
      obsTimeUtc: "2024-09-14T22:46:58Z",
      obsTimeLocal: "2024-09-14 23:46:58",
      neighborhood: "Coimbra",
      softwareType: "Cumulus v4.1.3",
      country: "PT",
      solarRadiation: 0.0,
      lon: -8.440329,
      realtimeFrequency: null,
      epoch: 1726354018,
      lat: 40.174385,
      uv: 0.0,
      winddir: 45,
      humidity: 54,
      qcStatus: 1,
      metric: {
        temp: 18,
        heatIndex: 18,
        dewpt: 9,
        windChill: 18,
        windSpeed: 4,
        windGust: 6,
        pressure: 1000.51,
        precipRate: 0.0,
        precipTotal: 0.0,
        elev: 52,
      },
    },
  ],
};

async function getWeather(api_key) {
  const url = `https://api.weather.com/v2/pws/observations/current?stationId=ICOIMB53&format=json&units=m&apiKey=${api_key}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function windDirection(deg) {
  if (deg >= 337.5 || deg < 22.5) return "N";
  if (deg >= 22.5 && deg < 67.5) return "NE";
  if (deg >= 67.5 && deg < 112.5) return "E";
  if (deg >= 112.5 && deg < 157.5) return "SE";
  if (deg >= 157.5 && deg < 202.5) return "S";
  if (deg >= 202.5 && deg < 247.5) return "SW";
  if (deg >= 247.5 && deg < 292.5) return "W";
  if (deg >= 292.5 && deg < 337.5) return "NW";
}

function formatDate(epoch) {
  const date = new Date(epoch * 1000);
  return date.toLocaleString();
}

function renderWidget(data) {
  const o = data.observations[0];

  const a = {
    fontSize: 30,
    display: "flex",
    flexDirection: "column",
    padding: 2,
    alignItems: "center",
    // marginBottom: "10px",
    paddingLeft: 30,
    paddingRight: 30,
  };
  const zero_margin = {};
  const icon = { fontSize: 40, textShadow: "1px 1px 0px #333" };
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
    // justifyContent: "space-between",
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
        <span style={{ marginRight: 8 }}>Last Measurement:</span> {formatDate(o.epoch)}
      </p>

      <div style={row}>
        <div style={a}>
          <span style={icon}>🌡️</span>
          <span id="temperature" style={zero_margin}>
            {o.metric.temp}°C
          </span>
        </div>
        <div style={a}>
          <span style={icon}>💧</span>
          <span id="humidity" style={zero_margin}>
            {o.humidity}%
          </span>
        </div>
        <div style={a}>
          <span style={icon}>🌬️</span>
          <span id="pressure" style={zero_margin}>
            {o.metric.pressure} hPa
          </span>
        </div>
        <div style={a}>
          <span style={icon}>🌧️</span>
          <span id="precipitation" style={zero_margin}>
            {o.metric.precipRate} mm/hr
          </span>
        </div>
      </div>

      <div style={row}>
        <div style={a}>
          <span style={icon}>☀️</span>
          <span id="solar-radiation" style={zero_margin}>
            {o.solarRadiation} W/m²
          </span>
          <span>({o.uv} UV)</span>
          </div>
        <div style={a}>
          <span style={icon}>💨</span>
          <span id="wind-speed" style={zero_margin}>
            {o.metric.windSpeed} km/h
          </span>
          <span>({windDirection(o.winddir)})</span>
          </div>
        <div style={{ ...a, marginBottom: 0 }}>
          <span style={icon}>🌪️</span>
          <span id="wind-gust" style={zero_margin}>
            {o.metric.windGust} km/h
          </span>
        </div>
      </div>
    </div>
  );
}

export const onRequest = async (context) => {
  const data = await getWeather(context.env.WUNDERGROUND_API_KEY);

  return new ImageResponse(
    renderWidget(data),
    {
      width: 700,
      height: 430,
      emoji: "openmoji"
    }
  );
};
