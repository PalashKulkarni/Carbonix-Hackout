export type Tier = 1 | 2 | 3;

export type MaterialCode = 'steel' | 'aluminium' | 'plastic' | 'cement' | 'other';

export type ElectricitySource = 'grid_coal' | 'grid_mixed' | 'grid_renewable' | 'onsite_solar';

export type TransportMode = 'road' | 'rail' | 'sea' | 'air';

export type EmissionCategory = 'energy' | 'transport' | 'material' | 'manufacturing' | 'logistics';

export type FactorCategory = 'material' | 'energy' | 'transport' | 'manufacturing' | 'logistics';

export type CarbonRisk = 'low' | 'medium' | 'high';

export type DataSource = 'primary' | 'modeled' | 'mixed';

export type RecommendationActionType = 
  | 'recycled_material' 
  | 'low_carbon_material' 
  | 'renewable_energy' 
  | 'modal_shift' 
  | 'local_sourcing' 
  | 'alternative_supplier';

export type RecommendationStatus = 'open' | 'accepted' | 'dismissed' | 'in_progress';

export interface Supplier {
  supplier_id: string;
  org_id: string;
  parent_id: string | null;
  name: string;
  tier: Tier;
  material_code: MaterialCode;
  material_quantity_kg: number;
  energy_kwh: number;
  electricity_source: ElectricitySource;
  transport_distance_km: number;
  transport_mode: TransportMode;
  location_label: string;
  latitude: number;
  longitude: number;
  production_volume: number;
  production_unit: string;
  data_source: DataSource;
  // Computed fields from engine
  total_co2e_kg?: number;
  energy_co2e_kg?: number;
  transport_co2e_kg?: number;
  material_co2e_kg?: number;
  manufacturing_co2e_kg?: number;
  logistics_co2e_kg?: number;
  intensity_kg_per_unit?: number;
  carbon_risk?: CarbonRisk;
  rank?: number;
}

export interface SupplierCreatePayload {
  name: string;
  tier: Tier;
  parent_id?: string | null;
  material_code: MaterialCode;
  material_quantity_kg?: number;
  energy_kwh?: number;
  electricity_source?: ElectricitySource;
  transport_distance_km?: number;
  transport_mode?: TransportMode;
  location_label: string;
  latitude: number;
  longitude: number;
  production_volume?: number;
  production_unit?: string;
}

export interface EmissionFactor {
  factor_id: string;
  org_id: string | null;
  factor_category: FactorCategory;
  code: string;
  factor_kg_co2e_per_unit: number;
  unit: string;
  source: string;
  year: number;
}

export interface Recommendation {
  recommendation_id: string;
  org_id: string;
  supplier_id: string;
  supplier_name?: string;
  action_type: RecommendationActionType;
  title: string;
  description: string;
  current_co2e_kg: number;
  projected_co2e_kg: number;
  delta_co2e_kg: number;
  status: RecommendationStatus;
  created_at?: string;
}

export interface HierarchyNode {
  supplier_id: string;
  name: string;
  tier: Tier;
  total_co2e_kg: number;
  carbon_risk: CarbonRisk;
  children: HierarchyNode[];
}

export interface MapSupplier {
  supplier_id: string;
  name: string;
  latitude: number;
  longitude: number;
  total_co2e_kg: number;
  carbon_risk: CarbonRisk;
  tier: Tier;
}

export interface DashboardCategoryBreakdown {
  emission_category: EmissionCategory;
  co2e_kg: number;
  percentage?: number;
}

export interface DashboardTierBreakdown {
  tier: Tier;
  co2e_kg: number;
  percentage?: number;
}

export interface DashboardHotspot {
  supplier_id: string;
  name: string;
  total_co2e_kg: number;
  carbon_risk: CarbonRisk;
  rank: number;
}

export interface RankingSnapshotItem {
  supplier_id: string;
  name: string;
  intensity_kg_per_unit: number;
  carbon_risk: CarbonRisk;
}

export interface TopRecommendationTeaser {
  recommendation_id: string;
  supplier_id: string;
  title: string;
  delta_co2e_kg: number;
}

export interface DashboardData {
  period: string;
  org_id: string;
  org_name: string;
  total_co2e_kg: number;
  supplier_count: number;
  data_coverage_pct: number;
  tier1_share_pct: number;
  by_category: DashboardCategoryBreakdown[];
  by_tier: DashboardTierBreakdown[];
  hotspots: DashboardHotspot[];
  ranking_snapshot: RankingSnapshotItem[];
  top_recommendations: TopRecommendationTeaser[];
}

export interface ScenarioSimulationRequest {
  period?: string;
  recycled_material_pct: number;
  renewable_energy_pct: number;
  rail_transport_pct: number;
}

export interface ScenarioSimulationResponse {
  period: string;
  recycled_material_pct: number;
  renewable_energy_pct: number;
  rail_transport_pct: number;
  current_total_co2e_kg: number;
  projected_total_co2e_kg: number;
  delta_co2e_kg: number;
  delta_pct: number;
}

export interface AuthResponse {
  token: string;
  org_id: string;
  org_name: string;
  email: string;
}
