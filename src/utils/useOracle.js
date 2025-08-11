// utils/useOracle.js
import {
  generateAdvancedIChingResponse,
  generateAdvancedTarotResponse,
  generateAdvancedRunesResponse,
  generateAdvancedDreamsResponse,
  getUserProfile,
} from "@/utils/quantumOracleEngine";
import { useState } from "react";

const engines = {
  "I Ching Cuántico": generateAdvancedIChingResponse,
  "Tarot Multidimensional": generateAdvancedTarotResponse,
  "Runas Algorítmicas": generateAdvancedRunesResponse,
  "Sueños Conscientes": generateAdvancedDreamsResponse,
};

export function useOracle() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function consult(name, query, ritual = false) {
    setLoading(true);
    setAnswer("");
    const delay = ritual ? 3000 : 1500;
    await new Promise((r) => setTimeout(r, delay));
    const gen = engines[name];
    if (!gen) {
      setAnswer("El oráculo guarda silencio…");
      setLoading(false);
      return;
    }
    const result = await gen(query);
    setAnswer(result);
    setLoading(false);
  }

  return { answer, loading, consult, profile: getUserProfile() };
}
