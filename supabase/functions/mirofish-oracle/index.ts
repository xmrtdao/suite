import { startUsageTracking } from '../_shared/edgeFunctionUsageLogger.ts';

const FUNCTION_NAME = 'mirofish-oracle';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NumericPoint = {
  timestamp?: string;
  value: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
};

type SwarmAgent = {
  id: string;
  lookback: number;
  momentumWeight: number;
  meanReversionWeight: number;
  volatilityPenalty: number;
  confidenceBias: number;
};

type PredictRequest = {
  action?: 'predict' | 'consensus' | 'health';
  stream_name?: string;
  data_stream?: NumericPoint[];
  horizon?: number;
  swarm_size?: number;
  historical_accuracy?: number;
  metadata?: Record<string, unknown>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function createSwarmAgents(count: number, seed = 1337): SwarmAgent[] {
  const size = clamp(count, 3, 64);
  const rand = seededRandom(seed);
  const agents: SwarmAgent[] = [];

  for (let i = 0; i < size; i++) {
    const lookback = Math.floor(4 + rand() * 20);
    agents.push({
      id: `agent_${i + 1}`,
      lookback,
      momentumWeight: 0.3 + rand() * 0.9,
      meanReversionWeight: 0.1 + rand() * 0.8,
      volatilityPenalty: 0.05 + rand() * 0.4,
      confidenceBias: 0.7 + rand() * 0.6,
    });
  }

  return agents;
}

function validatePoints(raw: unknown): NumericPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((point) => {
      if (!point || typeof point !== 'object') return null;
      const candidate = point as Record<string, unknown>;
      const value = Number(candidate.value);
      if (!Number.isFinite(value)) return null;
      return {
        timestamp: typeof candidate.timestamp === 'string' ? candidate.timestamp : undefined,
        value,
        confidence: Number.isFinite(Number(candidate.confidence))
          ? clamp(Number(candidate.confidence), 0, 1)
          : undefined,
        metadata: typeof candidate.metadata === 'object' && candidate.metadata !== null
          ? (candidate.metadata as Record<string, unknown>)
          : undefined,
      };
    })
    .filter((point): point is NumericPoint => point !== null);
}

function slope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const xDelta = i - xMean;
    numerator += xDelta * (values[i] - yMean);
    denominator += xDelta * xDelta;
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}

function predictWithAgent(agent: SwarmAgent, points: NumericPoint[], horizon: number): NumericPoint[] {
  const values = points.map((p) => p.value);
  const lookbackSlice = values.slice(-agent.lookback);
  const current = values[values.length - 1] ?? 0;

  const momentum = slope(lookbackSlice) * agent.momentumWeight;
  const average = lookbackSlice.length
    ? lookbackSlice.reduce((sum, value) => sum + value, 0) / lookbackSlice.length
    : current;
  const meanReversion = (average - current) * agent.meanReversionWeight;
  const volatility = stdDev(lookbackSlice);
  const dampening = clamp(1 - volatility * agent.volatilityPenalty, 0.25, 1);

  const predictions: NumericPoint[] = [];
  let prev = current;

  for (let step = 1; step <= horizon; step++) {
    const directionalMove = (momentum + meanReversion / step) * dampening;
    const next = prev + directionalMove;
    predictions.push({
      value: next,
      confidence: clamp((1 / (1 + volatility)) * agent.confidenceBias - step * 0.04, 0.05, 0.98),
      metadata: {
        agent_id: agent.id,
        lookback: agent.lookback,
        step,
      },
    });
    prev = next;
  }

  return predictions;
}

function consensusForecast(points: NumericPoint[], swarmSize: number, horizon: number) {
  const agents = createSwarmAgents(swarmSize);
  const normalizedHorizon = clamp(Math.floor(horizon), 1, 72);
  const predictionsByAgent = agents.map((agent) => ({
    agent,
    forecast: predictWithAgent(agent, points, normalizedHorizon),
  }));

  const forecast: NumericPoint[] = [];

  for (let step = 0; step < normalizedHorizon; step++) {
    const stepValues = predictionsByAgent.map((item) => item.forecast[step].value);
    const stepConfidences = predictionsByAgent.map((item) => item.forecast[step].confidence ?? 0.5);
    const confidenceWeightedDenominator = stepConfidences.reduce((sum, c) => sum + c, 0) || 1;
    const weightedValue = stepValues.reduce((sum, value, i) => sum + value * stepConfidences[i], 0) / confidenceWeightedDenominator;
    const dispersion = stdDev(stepValues);

    forecast.push({
      value: weightedValue,
      confidence: clamp((stepConfidences.reduce((s, c) => s + c, 0) / stepConfidences.length) * (1 / (1 + dispersion * 0.5)), 0.05, 0.99),
      metadata: {
        step: step + 1,
        lower_bound: weightedValue - dispersion,
        upper_bound: weightedValue + dispersion,
        disagreement: dispersion,
      },
    });
  }

  return {
    swarm_size: agents.length,
    horizon: normalizedHorizon,
    forecast,
    agent_summaries: agents.map((agent) => ({
      id: agent.id,
      lookback: agent.lookback,
      momentumWeight: agent.momentumWeight,
      meanReversionWeight: agent.meanReversionWeight,
    })),
  };
}

function buildHealth(points: NumericPoint[]) {
  const values = points.map((p) => p.value);
  const volatility = stdDev(values);
  const recentTrend = slope(values.slice(-12));

  return {
    samples: points.length,
    volatility,
    trend: recentTrend,
    trend_direction: recentTrend > 0 ? 'up' : recentTrend < 0 ? 'down' : 'flat',
    data_quality: points.length >= 12 ? 'good' : points.length >= 6 ? 'limited' : 'insufficient',
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const usageTracker = startUsageTracking(FUNCTION_NAME, undefined, { method: req.method });

  try {
    const body = (await req.json()) as PredictRequest;
    const action = body.action ?? 'predict';
    const points = validatePoints(body.data_stream);

    if (points.length < 3) {
      await usageTracker.failure('insufficient_data', 400);
      return new Response(
        JSON.stringify({
          error: 'data_stream must include at least 3 numeric points',
          received_points: points.length,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'health') {
      const health = buildHealth(points);
      await usageTracker.success({ action, samples: points.length });
      return new Response(
        JSON.stringify({
          success: true,
          function: FUNCTION_NAME,
          action,
          stream_name: body.stream_name ?? 'unknown',
          health,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const consensus = consensusForecast(points, body.swarm_size ?? 12, body.horizon ?? 12);
    const health = buildHealth(points);

    await usageTracker.success({
      action,
      stream_name: body.stream_name ?? 'unknown',
      samples: points.length,
      swarm_size: consensus.swarm_size,
      horizon: consensus.horizon,
    });

    return new Response(
      JSON.stringify({
        success: true,
        function: FUNCTION_NAME,
        action,
        stream_name: body.stream_name ?? 'unknown',
        generated_at: new Date().toISOString(),
        input: {
          samples: points.length,
          latest_value: points[points.length - 1].value,
          metadata: body.metadata ?? {},
        },
        health,
        prediction: consensus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('mirofish-oracle error', message);
    await usageTracker.failure(message, 500);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
