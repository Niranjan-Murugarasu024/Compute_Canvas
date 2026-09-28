import {
  type Architecture,
  type Workload,
  type SimulationResult,
  simulate,
} from './engine';

export interface RegionDefinition {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  x: number; // Normalized 0-100 on world coordinate space
  y: number; // Normalized 0-100 on world coordinate space
  provider: 'AWS' | 'GCP' | 'Azure' | 'Cloudflare';
  baseEgressCostPerGB: number;
}

export const REGIONS: Record<string, RegionDefinition> = {
  'us-east': {
    id: 'us-east',
    name: 'US East (N. Virginia)',
    code: 'us-east-1',
    city: 'North Virginia',
    country: 'United States',
    x: 28,
    y: 38,
    provider: 'AWS',
    baseEgressCostPerGB: 0.09,
  },
  'us-west': {
    id: 'us-west',
    name: 'US West (Oregon)',
    code: 'us-west-2',
    city: 'Oregon',
    country: 'United States',
    x: 18,
    y: 34,
    provider: 'AWS',
    baseEgressCostPerGB: 0.09,
  },
  'eu-west': {
    id: 'eu-west',
    name: 'Europe (Frankfurt)',
    code: 'eu-central-1',
    city: 'Frankfurt',
    country: 'Germany',
    x: 52,
    y: 30,
    provider: 'AWS',
    baseEgressCostPerGB: 0.08,
  },
  'ap-southeast': {
    id: 'ap-southeast',
    name: 'Asia Pacific (Singapore)',
    code: 'ap-southeast-1',
    city: 'Singapore',
    country: 'Singapore',
    x: 78,
    y: 56,
    provider: 'AWS',
    baseEgressCostPerGB: 0.11,
  },
};

// Round-trip network latency matrix (milliseconds) between major data center regions
export const INTER_REGION_LATENCY_MS: Record<string, Record<string, number>> = {
  'us-east': { 'us-east': 5, 'us-west': 68, 'eu-west': 82, 'ap-southeast': 195 },
  'us-west': { 'us-east': 68, 'us-west': 5, 'eu-west': 135, 'ap-southeast': 145 },
  'eu-west': { 'us-east': 82, 'us-west': 135, 'eu-west': 6, 'ap-southeast': 160 },
  'ap-southeast': { 'us-east': 195, 'us-west': 145, 'eu-west': 160, 'ap-southeast': 5 },
};

export interface RegionalDeployment {
  regionId: string;
  trafficShare: number; // 0 to 1
  isPrimary: boolean;
  status: 'active' | 'degraded' | 'offline';
}

export interface MultiRegionSimulationResult {
  baseSimulation: SimulationResult;
  regionalSimulations: Record<string, SimulationResult>;
  effectiveP95Latency: number;
  effectiveMonthlyCost: number;
  crossRegionEgressCost: number;
  crossRegionLatencyPenaltyMs: number;
  activeRegionsCount: number;
  redundancyLevel: 'Single Region' | 'Dual Region Active-Passive' | 'Multi-Region Active-Active';
  resilienceScore: number; // 0-100
  failoverFeasible: boolean;
  notes: string[];
}

export function simulateMultiRegion(
  workload: Workload,
  architecture: Architecture,
  deployments: RegionalDeployment[],
  failedRegionId?: string
): MultiRegionSimulationResult {
  // Normalize traffic across healthy regions
  const activeDeployments = deployments.map(d => ({
    ...d,
    status: (failedRegionId === d.regionId ? 'offline' : d.status) as 'active' | 'degraded' | 'offline',
  }));

  const healthyDeployments = activeDeployments.filter(d => d.status !== 'offline');
  const totalHealthyShare = healthyDeployments.reduce((sum, d) => sum + d.trafficShare, 0);

  // If all regions offline, system is unavailable
  if (healthyDeployments.length === 0 || totalHealthyShare <= 0) {
    const baseSim = simulate(workload, architecture);
    return {
      baseSimulation: baseSim,
      regionalSimulations: {},
      effectiveP95Latency: 9999,
      effectiveMonthlyCost: 0,
      crossRegionEgressCost: 0,
      crossRegionLatencyPenaltyMs: 9999,
      activeRegionsCount: 0,
      redundancyLevel: 'Single Region',
      resilienceScore: 0,
      failoverFeasible: false,
      notes: ['CRITICAL: All configured regions are offline. System is unreachable.'],
    };
  }

  const regionalSimulations: Record<string, SimulationResult> = {};
  let weightedLatencySum = 0;
  let totalCostSum = 0;
  let totalCrossRegionEgressGB = 0;

  healthyDeployments.forEach(d => {
    // Re-balance traffic share if one region failed
    const effectiveTrafficShare = totalHealthyShare > 0 ? d.trafficShare / totalHealthyShare : 1 / healthyDeployments.length;
    const regionalWorkload: Workload = {
      ...workload,
      requestsPerMonth: Math.round(workload.requestsPerMonth * effectiveTrafficShare),
      concurrency: Math.max(1, Math.round((workload.concurrency || 50) * effectiveTrafficShare)),
    };

    const regionalSim = simulate(regionalWorkload, architecture);
    regionalSimulations[d.regionId] = regionalSim;

    // Cross-region roundtrip penalty if accessing cross-region model or data
    const localLatency = INTER_REGION_LATENCY_MS[d.regionId]?.[d.regionId] || 5;
    const regionalP95 = regionalSim.p95Latency + localLatency;

    weightedLatencySum += regionalP95 * effectiveTrafficShare;
    totalCostSum += regionalSim.monthlyCost;

    // Cross-region data replication (approx 15% of payload replicated across regions)
    if (healthyDeployments.length > 1) {
      const payloadBytesPerReq = (workload.avgInputTokens + workload.avgOutputTokens) * 4;
      const monthlyGB = (regionalWorkload.requestsPerMonth * payloadBytesPerReq * 0.15) / (1024 * 1024 * 1024);
      totalCrossRegionEgressGB += monthlyGB;
    }
  });

  // Cross-region network egress pricing ($0.02 / GB internal transfer)
  const crossRegionEgressCost = Math.round(totalCrossRegionEgressGB * 0.02);
  const effectiveMonthlyCost = Math.round(totalCostSum + crossRegionEgressCost);
  const effectiveP95Latency = Math.round(weightedLatencySum);

  // Compute redundancy level
  let redundancyLevel: MultiRegionSimulationResult['redundancyLevel'] = 'Single Region';
  if (healthyDeployments.length >= 3) {
    redundancyLevel = 'Multi-Region Active-Active';
  } else if (healthyDeployments.length === 2) {
    redundancyLevel = 'Dual Region Active-Passive';
  }

  // Resilience score (0-100) based on regional distribution and capacity headroom
  let resilienceScore = healthyDeployments.length === 1 ? 40 : healthyDeployments.length === 2 ? 75 : 95;
  if (failedRegionId) {
    resilienceScore = Math.max(20, resilienceScore - 25);
  }

  const notes: string[] = [];
  if (failedRegionId) {
    notes.push(`Simulating outage in ${REGIONS[failedRegionId]?.name || failedRegionId}. Traffic redistributed across ${healthyDeployments.length} healthy regions.`);
  }
  if (healthyDeployments.length > 1) {
    notes.push(`Cross-region replication active (~${Math.round(totalCrossRegionEgressGB)} GB/mo internal network transfer).`);
  } else {
    notes.push('Single region deployment: single failure domain without automatic failover.');
  }

  const baseSimulation = simulate(workload, architecture);

  return {
    baseSimulation,
    regionalSimulations,
    effectiveP95Latency,
    effectiveMonthlyCost,
    crossRegionEgressCost,
    crossRegionLatencyPenaltyMs: healthyDeployments.length > 1 ? 18 : 0,
    activeRegionsCount: healthyDeployments.length,
    redundancyLevel,
    resilienceScore,
    failoverFeasible: healthyDeployments.length > 0,
    notes,
  };
}
