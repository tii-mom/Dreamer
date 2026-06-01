import { Solar } from "lunar-javascript";
import type { FortuneSignal } from "../types";

const DIRECTIONS = ["east", "south", "west", "north", "southeast", "southwest"];
const HOURS = ["07:00-09:00", "09:00-11:00", "11:00-13:00", "15:00-17:00", "19:00-21:00"];

export function buildAlmanacSignals(date = new Date()): FortuneSignal[] {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const day = solar.getDay();
  const luckyHour = HOURS[day % HOURS.length];
  const direction = DIRECTIONS[day % DIRECTIONS.length];
  const yi = lunar.getDayYi().slice(0, 4);
  const ji = lunar.getDayJi().slice(0, 4);

  return [
    {
      id: "almanac:daily-action",
      source: "almanac",
      topic: "daily",
      title: "Daily timing window",
      evidence: `Lunar date ${lunar.toString()}, yi ${yi.join("/") || "none"}, ji ${ji.join("/") || "none"}`,
      score: 35,
      weight: 6,
      advice: `Use ${luckyHour} for the most important small action. Direction hint: ${direction}.`,
      tags: [luckyHour, direction, ...yi],
    },
  ];
}

export function almanacSummary(date = new Date()) {
  const signal = buildAlmanacSignals(date)[0];
  return `${signal.title}: ${signal.advice}`;
}
