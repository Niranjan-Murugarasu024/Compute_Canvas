import {
  type Architecture,
  type Workload,
  type ArchNode,
  type ArchEdge,
  type SimulationResult,
  simulate,
  formatCurrency,
  formatLatency,
} from '@/lib/simulation/engine';

export interface ParsedConstraints {
  requestsPerMonth?: number;
  maxMonthlyCost?: number;
  maxP95Latency?: number;
  minQuality?: number;
  targetCostReductionPct?: number;
  useCase?: 'customer-support' | 'rag' | 'agent' | 'code' | 'classification' | 'general';
  intent: 'new_architecture' | 'optimize_cost' | 'optimize_latency' | 'scale_up';
}

export interface AIProposal {
  id: string;
  title: string;
  summary: string;
  architecture: Architecture;
  workload: Workload;
  simulation: SimulationResult;
  constraintsMet: {
    budgetMet: boolean;
    latencyMet: boolean;
    capacityMet: boolean;
  };
  rationale: string[];
  tradeoffs: string[];
}

export function parseNaturalLanguageQuery(query: string, currentWorkload: Workload, currentArch: Architecture): ParsedConstraints {
  const q = query.toLowerCase();

  // Detect Intent
  let intent: ParsedConstraints['intent'] = 'new_architecture';
  if (q.includes('reduce cost') || q.includes('cut cost') || q.includes('cheaper') || q.includes('lower cost') || q.includes('save money')) {
    intent = 'optimize_cost';
  } else if (q.includes('faster') || q.includes('reduce latency') || q.includes('sub-second') || q.includes('speed up')) {
    intent = 'optimize_latency';
  } else if (q.includes('10x') || q.includes('scale') || q.includes('spike') || q.includes('black friday')) {
    intent = 'scale_up';
  }

  // Detect Requests/month
  let requestsPerMonth: number | undefined;
  const trafficMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:m|million)\s*(?:conversations|requests|reqs|queries|calls)?/);
  if (trafficMatch) {
    requestsPerMonth = Math.round(parseFloat(trafficMatch[1]) * 1_000_000);
  } else {
    const kMatch = q.match(/(\d+(?:\.\d+)?)\s*k\s*(?:conversations|requests|reqs)?/);
    if (kMatch) {
      requestsPerMonth = Math.round(parseFloat(kMatch[1]) * 1_000);
    }
  }

  // Detect Budget / Max Cost
  let maxMonthlyCost: number | undefined;
  const budgetMatch = q.match(/(?:\$|budget|under|below|max)\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:k|thousand)?/);
  if (budgetMatch) {
    let raw = budgetMatch[1].replace(/,/g, '');
    let val = parseFloat(raw);
    if (q.includes(`${budgetMatch[1]}k`) || q.includes(`${budgetMatch[1]} k`) || val < 1000) {
      val = val * 1000;
    }
    maxMonthlyCost = val;
  }

  // Detect Latency constraint
  let maxP95Latency: number | undefined;
  const secMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|second)s?/);
  if (secMatch && !q.includes('conversations')) {
    maxP95Latency = Math.round(parseFloat(secMatch[1]) * 1000);
  }
  const msMatch = q.match(/(\d+)\s*ms/);
  if (msMatch) {
    maxP95Latency = parseInt(msMatch[1], 10);
  }

  // Cost reduction percentage
  let targetCostReductionPct: number | undefined;
  const pctMatch = q.match(/(\d+)%\s*(?:cost|budget|reduction|cheaper)/);
  if (pctMatch) {
    targetCostReductionPct = parseInt(pctMatch[1], 10);
  }

  // Use case
  let useCase: ParsedConstraints['useCase'] = 'general';
  if (q.includes('support') || q.includes('customer')) useCase = 'customer-support';
  else if (q.includes('rag') || q.includes('search') || q.includes('retriev') || q.includes('document')) useCase = 'rag';
  else if (q.includes('agent') || q.includes('tool') || q.includes('autonomous')) useCase = 'agent';
  else if (q.includes('code') || q.includes('copilot') || q.includes('developer')) useCase = 'code';
  else if (q.includes('classif') || q.includes('moderation')) useCase = 'classification';

  return {
    requestsPerMonth,
    maxMonthlyCost,
    maxP95Latency,
    targetCostReductionPct,
    useCase,
    intent,
  };
}

export function generateArchitectureProposal(
  query: string,
  currentWorkload: Workload,
  currentArch: Architecture
): AIProposal {
  const constraints = parseNaturalLanguageQuery(query, currentWorkload, currentArch);

  // Target Workload
  const targetWorkload: Workload = {
    ...currentWorkload,
    requestsPerMonth: constraints.requestsPerMonth || (constraints.intent === 'scale_up' ? currentWorkload.requestsPerMonth * 5 : currentWorkload.requestsPerMonth),
  };

  // ── Strategy Selection based on constraints ──
  let proposedArch: Architecture;
  let title = '';
  let summary = '';
  const rationale: string[] = [];
  const tradeoffs: string[] = [];

  if (constraints.intent === 'optimize_cost') {
    title = 'Cost-Optimized Routed Architecture';
    summary = `Introduces an intelligent semantic cache and multi-tier model router to route simple queries to fast low-cost models while preserving high-tier reasoning for complex tasks.`;

    targetWorkload.cacheHitRate = Math.max(0.35, currentWorkload.cacheHitRate + 0.15);

    proposedArch = {
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway', x: 100, y: 160 },
        { id: 'cache', type: 'cache', label: 'Semantic Cache (Redis)', x: 260, y: 160 },
        { id: 'router', type: 'router', label: 'Complexity Router', x: 420, y: 160 },
        { id: 'model-fast', type: 'model', label: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash', x: 600, y: 100 },
        { id: 'model-strong', type: 'model', label: 'GPT-4o', modelId: 'gpt-4o', x: 600, y: 230 },
        { id: 'vectordb', type: 'vectordb', label: 'Vector DB', x: 780, y: 160 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'router' },
        { source: 'router', target: 'model-fast', trafficShare: 0.75 },
        { source: 'router', target: 'model-strong', trafficShare: 0.25 },
        { source: 'model-fast', target: 'vectordb' },
        { source: 'model-strong', target: 'vectordb' },
      ],
    };

    rationale.push('75% of volume routed to Gemini 2.0 Flash ($0.10/M input tokens vs $2.50/M on GPT-4o).');
    rationale.push('Semantic cache intercepts ~35% of repetitive queries before hitting any model.');
    rationale.push('Preserves full GPT-4o reasoning power for the top 25% most difficult requests.');
    tradeoffs.push('Router adds ~15ms pipeline evaluation overhead.');
    tradeoffs.push('Cached answers may reflect up to 1-hour TTL staleness.');

  } else if (constraints.useCase === 'customer-support' || constraints.maxMonthlyCost) {
    title = 'High-Volume Support Pipeline with Multi-Tier Escalation';
    summary = `Designed to comfortably handle ${(targetWorkload.requestsPerMonth / 1_000_000).toFixed(1)}M requests within budget constraints using automated semantic tiering.`;

    targetWorkload.cacheHitRate = 0.30;
    targetWorkload.avgInputTokens = 1200;
    targetWorkload.avgOutputTokens = 350;

    proposedArch = {
      nodes: [
        { id: 'api', type: 'api', label: 'Edge Ingestion', x: 80, y: 160 },
        { id: 'cache', type: 'cache', label: 'FAQ Cache', x: 240, y: 160 },
        { id: 'router', type: 'router', label: 'Intent Classifier', x: 400, y: 160 },
        { id: 'model-tier1', type: 'model', label: 'Claude 3 Haiku', modelId: 'claude-3-haiku', x: 580, y: 90 },
        { id: 'model-tier2', type: 'model', label: 'Claude 3.5 Sonnet', modelId: 'claude-3.5-sonnet', x: 580, y: 230 },
        { id: 'vectordb', type: 'vectordb', label: 'KB Vector Search', x: 760, y: 160 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'router' },
        { source: 'router', target: 'model-tier1', trafficShare: 0.80 },
        { source: 'router', target: 'model-tier2', trafficShare: 0.20 },
        { source: 'model-tier1', target: 'vectordb' },
        { source: 'model-tier2', target: 'vectordb' },
      ],
    };

    rationale.push('80% common support tickets handled by Claude 3 Haiku ($0.25/M input).');
    rationale.push('FAQ cache absorbs high-frequency billing and account status inquiries.');
    rationale.push('Escalates edge cases to Claude 3.5 Sonnet only when sentiment or complexity demands it.');
    tradeoffs.push('Requires training or fine-tuning routing classifier thresholds.');

  } else if (constraints.useCase === 'rag') {
    title = 'Enterprise RAG Retrieval Architecture';
    summary = `Optimized for deep document comprehension with embedding models, dense vector search, and synthesized response caching.`;

    targetWorkload.retrievalsPerRequest = 3;
    targetWorkload.avgInputTokens = 2500;
    targetWorkload.cacheHitRate = 0.20;

    proposedArch = {
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway', x: 100, y: 160 },
        { id: 'cache', type: 'cache', label: 'Query Cache', x: 250, y: 160 },
        { id: 'embedding', type: 'embedding', label: 'Text Embedding 3', x: 400, y: 160 },
        { id: 'vectordb', type: 'vectordb', label: 'Pinecone Cluster', x: 550, y: 160 },
        { id: 'model', type: 'model', label: 'GPT-4o', modelId: 'gpt-4o', x: 700, y: 160 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'embedding' },
        { source: 'embedding', target: 'vectordb' },
        { source: 'vectordb', target: 'model' },
      ],
    };

    rationale.push('Text Embedding 3 produces accurate dense vectors at $0.02/M tokens.');
    rationale.push('Pinecone cluster handles 3 retrievals per query with sub-25ms index search.');
    tradeoffs.push('Large prompt context (2.5K tokens) increases cost per inference.');

  } else {
    // General balanced system
    title = 'Balanced Modern AI Pipeline';
    summary = `Balanced system calibrated for reliable sub-second response times and predictable token unit economics.`;

    proposedArch = {
      nodes: [
        { id: 'api', type: 'api', label: 'API Gateway', x: 120, y: 160 },
        { id: 'cache', type: 'cache', label: 'Prompt Cache', x: 280, y: 160 },
        { id: 'model', type: 'model', label: 'GPT-4o-mini', modelId: 'gpt-4o-mini', x: 450, y: 160 },
        { id: 'vectordb', type: 'vectordb', label: 'Vector Store', x: 620, y: 160 },
        { id: 'observability', type: 'observability', label: 'Traces (Datadog)', x: 780, y: 160 },
      ],
      edges: [
        { source: 'api', target: 'cache' },
        { source: 'cache', target: 'model' },
        { source: 'model', target: 'vectordb' },
        { source: 'model', target: 'observability' },
      ],
    };

    rationale.push('GPT-4o-mini offers 95% of GPT-4o quality at 1/15th of the price.');
    rationale.push('Full distributed tracing enabled for latency anomaly detection.');
  }

  // ── Deterministic Validation ──
  const simResult = simulate(targetWorkload, proposedArch);

  const budgetMet = constraints.maxMonthlyCost ? simResult.monthlyCost <= constraints.maxMonthlyCost : true;
  const latencyMet = constraints.maxP95Latency ? simResult.p95Latency <= constraints.maxP95Latency : true;
  const capacityMet = simResult.capacityUtilization <= 100;

  return {
    id: `proposal-${Date.now()}`,
    title,
    summary,
    architecture: proposedArch,
    workload: targetWorkload,
    simulation: simResult,
    constraintsMet: {
      budgetMet,
      latencyMet,
      capacityMet,
    },
    rationale,
    tradeoffs,
  };
}
