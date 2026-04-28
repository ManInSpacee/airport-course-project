import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { aiApi } from "../api/ai";
import { flightsApi } from "../api/flights";
import type { RiskResult, Flight } from "../api/types";
import { Frame } from "../components/Layout/Frame";
import { useToast } from "../context/ToastContext";

function riskClass(level: string) {
  if (level === "LOW") return "low";
  if (level === "MEDIUM") return "med";
  return "high";
}

export function AIRiskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [flight, setFlight] = useState<Flight | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [f, r] = await Promise.all([
          flightsApi.get(Number(id)),
          aiApi.getRisk(Number(id)),
        ]);
        setFlight(f);
        setResult(r);
      } catch (err: any) {
        showToast(err.message, "err");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading)
    return (
      <Frame>
        <div className="loading">Загрузка AI-оценки...</div>
      </Frame>
    );
  if (!result || !flight)
    return (
      <Frame>
        <div className="msg err">Не удалось получить оценку</div>
      </Frame>
    );

  const cls = riskClass(result.level);
  const probs = result.probabilities;

  return (
    <Frame>
      <div className="breadcrumb">
        <button className="btn link" onClick={() => navigate(`/flights/${id}`)}>
          ← Рейс {flight.flightNumber}
        </button>
      </div>
      <h1 className="page-title">
        Оценка риска задержки — Рейс {flight.flightNumber}
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div className="risk-box">
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Уровень риска
          </div>
          <div className={`risk-level ${cls}`}>{result.level}</div>
          <div style={{ fontSize: 12 }}>{result.interpretation}</div>
        </div>
        <div className="panel">
          <div className="panel-head">Вероятности</div>
          <div className="panel-body">
            <div className={`bar low`}>
              <span>LOW</span>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${probs.LOW}%`, background: "var(--ok)" }}
                />
              </div>
              <span>{probs.LOW}%</span>
            </div>
            <div className={`bar med`}>
              <span>MEDIUM</span>
              <div className="track">
                <div
                  className="fill"
                  style={{
                    width: `${probs.MEDIUM}%`,
                    background: "var(--warn)",
                  }}
                />
              </div>
              <span>{probs.MEDIUM}%</span>
            </div>
            <div className={`bar high`}>
              <span>HIGH</span>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${probs.HIGH}%`, background: "var(--err)" }}
                />
              </div>
              <span>{probs.HIGH}%</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              Уверенность модели:
              <div className="bar" style={{ marginTop: 4 }}>
                <span></span>
                <div className="track">
                  <div
                    className="fill"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                <span>{result.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="panel">
          <div className="panel-head">Причины</div>
          <div className="panel-body">
            <ul style={{ paddingLeft: 16, fontSize: 13 }}>
              {result.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div style={{ marginTop: 10, fontSize: 13 }}>
              Ожидаемая задержка:{" "}
              <strong>~{result.expected_delay_minutes} мин.</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">Признаки модели</div>
          <div className="panel-body">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Признак</th>
                  <th>Значение</th>
                  <th>Пояснение</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Час вылета</td>
                  <td className="num">{result.features.hour}</td>
                  <td style={{ whiteSpace: "normal" }}>
                    {(result.features.hour >= 6 && result.features.hour <= 9) ||
                    (result.features.hour >= 16 && result.features.hour <= 20)
                      ? "Час пик"
                      : "Не час пик"}
                  </td>
                </tr>
                <tr>
                  <td>Выходной день</td>
                  <td>{result.features.is_weekend ? "Да" : "Нет"}</td>
                  <td style={{ whiteSpace: "normal" }}>
                    {result.features.is_weekend
                      ? "Повышенный трафик"
                      : "Рабочий день"}
                  </td>
                </tr>
                <tr>
                  <td>Загрузка гейта</td>
                  <td className="num">{result.features.gate_load} рейс.</td>
                  <td style={{ whiteSpace: "normal" }}>
                    Рейсы за 2 часа до вылета
                  </td>
                </tr>
                <tr>
                  <td>История задержек</td>
                  <td className="num">{result.features.historical_delays}</td>
                  <td style={{ whiteSpace: "normal" }}>
                    Задержки на маршруте за 30 дней
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => navigate(`/flights/${id}`)}>
          ← Назад к рейсу
        </button>
      </div>
    </Frame>
  );
}
