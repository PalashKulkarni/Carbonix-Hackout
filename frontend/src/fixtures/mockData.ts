import type {
  DashboardData,
  Supplier,
  EmissionFactor,
  Recommendation,
  HierarchyNode,
  MapSupplier,
  ScenarioSimulationResponse,
} from '../types';


export const MOCK_DASHBOARD: DashboardData = {
  period: "2025",
  org_id: "org_apex",
  org_name: "Apex Manufacturing",
  total_co2e_kg: 285446.8,
  supplier_count: 6,
  data_coverage_pct: 100,
  tier1_share_pct: 60.25,
  by_category: [
    { emission_category: "energy", co2e_kg: 73520 },
    { emission_category: "transport", co2e_kg: 8698.8 },
    { emission_category: "material", co2e_kg: 199170 },
    { emission_category: "manufacturing", co2e_kg: 3440 },
    { emission_category: "logistics", co2e_kg: 618 }
  ],
  by_tier: [
    { tier: 1, co2e_kg: 171986 },
    { tier: 2, co2e_kg: 84944 },
    { tier: 3, co2e_kg: 28516.8 }
  ],
  hotspots: [
    { supplier_id: "sup_steelco", name: "SteelCo India", total_co2e_kg: 89850, carbon_risk: "high", rank: 1 },
    { supplier_id: "sup_aluco", name: "AluCo Extrusions", total_co2e_kg: 82136, carbon_risk: "high", rank: 2 },
    { supplier_id: "sup_plastix", name: "Plastix Components", total_co2e_kg: 43164, carbon_risk: "high", rank: 3 },
    { supplier_id: "sup_cementa", name: "Cementa Works", total_co2e_kg: 41780, carbon_risk: "low", rank: 4 },
    { supplier_id: "sup_quarry", name: "Deccan Quarry", total_co2e_kg: 20720, carbon_risk: "low", rank: 5 }
  ],
  ranking_snapshot: [
    { supplier_id: "sup_aluco", name: "AluCo Extrusions", intensity_kg_per_unit: 10267, carbon_risk: "high" },
    { supplier_id: "sup_plastix", name: "Plastix Components", intensity_kg_per_unit: 3597, carbon_risk: "high" },
    { supplier_id: "sup_steelco", name: "SteelCo India", intensity_kg_per_unit: 3594, carbon_risk: "high" },
    { supplier_id: "sup_packright", name: "PackRight Films", intensity_kg_per_unit: 2598.93, carbon_risk: "medium" },
    { supplier_id: "sup_quarry", name: "Deccan Quarry", intensity_kg_per_unit: 1381.33, carbon_risk: "low" }
  ],
  top_recommendations: [
    { recommendation_id: "rec_aluco_recycled", supplier_id: "sup_aluco", title: "Switch AluCo to recycled aluminium", delta_co2e_kg: 53920 },
    { recommendation_id: "rec_steelco_renewable", supplier_id: "sup_steelco", title: "Move SteelCo off coal grid", delta_co2e_kg: 39000 },
    { recommendation_id: "rec_steelco_recycled", supplier_id: "sup_steelco", title: "Switch SteelCo to recycled steel", delta_co2e_kg: 36250 }
  ]
};

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    supplier_id: "sup_steelco",
    org_id: "org_apex",
    parent_id: null,
    name: "SteelCo India",
    tier: 1,
    material_code: "steel",
    material_quantity_kg: 25000,
    energy_kwh: 50000,
    electricity_source: "grid_coal",
    transport_distance_km: 400,
    transport_mode: "road",
    location_label: "Mumbai, India",
    latitude: 19.076,
    longitude: 72.8777,
    production_volume: 25,
    production_unit: "tonnes",
    data_source: "primary",
    energy_co2e_kg: 41000,
    transport_co2e_kg: 1200,
    material_co2e_kg: 46250,
    manufacturing_co2e_kg: 1250,
    logistics_co2e_kg: 150,
    total_co2e_kg: 89850,
    intensity_kg_per_unit: 3594,
    carbon_risk: "high",
    rank: 1
  },
  {
    supplier_id: "sup_aluco",
    org_id: "org_apex",
    parent_id: null,
    name: "AluCo Extrusions",
    tier: 1,
    material_code: "aluminium",
    material_quantity_kg: 8000,
    energy_kwh: 20000,
    electricity_source: "grid_mixed",
    transport_distance_km: 1200,
    transport_mode: "air",
    location_label: "Pune, India",
    latitude: 18.5204,
    longitude: 73.8567,
    production_volume: 8,
    production_unit: "tonnes",
    data_source: "primary",
    energy_co2e_kg: 9000,
    transport_co2e_kg: 6528,
    material_co2e_kg: 65920,
    manufacturing_co2e_kg: 640,
    logistics_co2e_kg: 48,
    total_co2e_kg: 82136,
    intensity_kg_per_unit: 10267,
    carbon_risk: "high",
    rank: 2
  },
  {
    supplier_id: "sup_plastix",
    org_id: "org_apex",
    parent_id: "sup_steelco",
    name: "Plastix Components",
    tier: 2,
    material_code: "plastic",
    material_quantity_kg: 12000,
    energy_kwh: 15000,
    electricity_source: "grid_coal",
    transport_distance_km: 300,
    transport_mode: "road",
    location_label: "Chennai, India",
    latitude: 13.0827,
    longitude: 80.2707,
    production_volume: 12,
    production_unit: "tonnes",
    data_source: "primary",
    energy_co2e_kg: 12300,
    transport_co2e_kg: 432,
    material_co2e_kg: 30000,
    manufacturing_co2e_kg: 360,
    logistics_co2e_kg: 72,
    total_co2e_kg: 43164,
    intensity_kg_per_unit: 3597,
    carbon_risk: "high",
    rank: 3
  },
  {
    supplier_id: "sup_cementa",
    org_id: "org_apex",
    parent_id: "sup_aluco",
    name: "Cementa Works",
    tier: 2,
    material_code: "cement",
    material_quantity_kg: 40000,
    energy_kwh: 10000,
    electricity_source: "grid_mixed",
    transport_distance_km: 200,
    transport_mode: "rail",
    location_label: "Ahmedabad, India",
    latitude: 23.0225,
    longitude: 72.5714,
    production_volume: 40,
    production_unit: "tonnes",
    data_source: "primary",
    energy_co2e_kg: 4500,
    transport_co2e_kg: 240,
    material_co2e_kg: 36000,
    manufacturing_co2e_kg: 800,
    logistics_co2e_kg: 240,
    total_co2e_kg: 41780,
    intensity_kg_per_unit: 1044.5,
    carbon_risk: "low",
    rank: 4
  },
  {
    supplier_id: "sup_quarry",
    org_id: "org_apex",
    parent_id: "sup_cementa",
    name: "Deccan Quarry",
    tier: 3,
    material_code: "cement",
    material_quantity_kg: 15000,
    energy_kwh: 8000,
    electricity_source: "grid_coal",
    transport_distance_km: 150,
    transport_mode: "road",
    location_label: "Nagpur, India",
    latitude: 21.1458,
    longitude: 79.0882,
    production_volume: 15,
    production_unit: "tonnes",
    data_source: "primary",
    energy_co2e_kg: 6560,
    transport_co2e_kg: 270,
    material_co2e_kg: 13500,
    manufacturing_co2e_kg: 300,
    logistics_co2e_kg: 90,
    total_co2e_kg: 20720,
    intensity_kg_per_unit: 1381.33,
    carbon_risk: "low",
    rank: 5
  },
  {
    supplier_id: "sup_packright",
    org_id: "org_apex",
    parent_id: "sup_plastix",
    name: "PackRight Films",
    tier: 3,
    material_code: "plastic",
    material_quantity_kg: 3000,
    energy_kwh: 4000,
    electricity_source: "grid_renewable",
    transport_distance_km: 80,
    transport_mode: "road",
    location_label: "Bengaluru, India",
    latitude: 12.9716,
    longitude: 77.5946,
    production_volume: 3,
    production_unit: "tonnes",
    data_source: "primary",
    energy_co2e_kg: 160,
    transport_co2e_kg: 28.8,
    material_co2e_kg: 7500,
    manufacturing_co2e_kg: 90,
    logistics_co2e_kg: 18,
    total_co2e_kg: 7796.8,
    intensity_kg_per_unit: 2598.93,
    carbon_risk: "medium",
    rank: 6
  }
];

export const MOCK_HIERARCHY: HierarchyNode = {
  supplier_id: "root_org",
  name: "Apex Manufacturing",
  tier: 1,
  total_co2e_kg: 285446.8,
  carbon_risk: "high",
  children: [
    {
      supplier_id: "sup_steelco",
      name: "SteelCo India",
      tier: 1,
      total_co2e_kg: 89850,
      carbon_risk: "high",
      children: [
        {
          supplier_id: "sup_plastix",
          name: "Plastix Components",
          tier: 2,
          total_co2e_kg: 43164,
          carbon_risk: "high",
          children: [
            {
              supplier_id: "sup_packright",
              name: "PackRight Films",
              tier: 3,
              total_co2e_kg: 7796.8,
              carbon_risk: "medium",
              children: []
            }
          ]
        }
      ]
    },
    {
      supplier_id: "sup_aluco",
      name: "AluCo Extrusions",
      tier: 1,
      total_co2e_kg: 82136,
      carbon_risk: "high",
      children: [
        {
          supplier_id: "sup_cementa",
          name: "Cementa Works",
          tier: 2,
          total_co2e_kg: 41780,
          carbon_risk: "low",
          children: [
            {
              supplier_id: "sup_quarry",
              name: "Deccan Quarry",
              tier: 3,
              total_co2e_kg: 20720,
              carbon_risk: "low",
              children: []
            }
          ]
        }
      ]
    }
  ]
};

export const MOCK_MAP_SUPPLIERS: MapSupplier[] = [
  { supplier_id: "sup_steelco", name: "SteelCo India", latitude: 19.076, longitude: 72.8777, total_co2e_kg: 89850, carbon_risk: "high", tier: 1 },
  { supplier_id: "sup_aluco", name: "AluCo Extrusions", latitude: 18.5204, longitude: 73.8567, total_co2e_kg: 82136, carbon_risk: "high", tier: 1 },
  { supplier_id: "sup_plastix", name: "Plastix Components", latitude: 13.0827, longitude: 80.2707, total_co2e_kg: 43164, carbon_risk: "high", tier: 2 },
  { supplier_id: "sup_cementa", name: "Cementa Works", latitude: 23.0225, longitude: 72.5714, total_co2e_kg: 41780, carbon_risk: "low", tier: 2 },
  { supplier_id: "sup_quarry", name: "Deccan Quarry", latitude: 21.1458, longitude: 79.0882, total_co2e_kg: 20720, carbon_risk: "low", tier: 3 },
  { supplier_id: "sup_packright", name: "PackRight Films", latitude: 12.9716, longitude: 77.5946, total_co2e_kg: 7796.8, carbon_risk: "medium", tier: 3 }
];

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    recommendation_id: "rec_aluco_recycled",
    org_id: "org_apex",
    supplier_id: "sup_aluco",
    supplier_name: "AluCo Extrusions",
    action_type: "recycled_material",
    title: "Switch AluCo Extrusions to Recycled Aluminium",
    description: "Replace virgin aluminium ingot with 80% post-industrial recycled alloy. Cut embodied material factor from 8.24 to 1.50 kg CO₂e/kg.",
    current_co2e_kg: 82136,
    projected_co2e_kg: 28216,
    delta_co2e_kg: 53920,
    status: "open"
  },
  {
    recommendation_id: "rec_steelco_renewable",
    org_id: "org_apex",
    supplier_id: "sup_steelco",
    supplier_name: "SteelCo India",
    action_type: "renewable_energy",
    title: "Transition SteelCo India to Onsite Solar PPA",
    description: "Phase out coal grid electricity (0.82 kg CO₂e/kWh) by establishing a corporate PPA for solar power (0.04 kg CO₂e/kWh).",
    current_co2e_kg: 89850,
    projected_co2e_kg: 50850,
    delta_co2e_kg: 39000,
    status: "open"
  },
  {
    recommendation_id: "rec_steelco_recycled",
    org_id: "org_apex",
    supplier_id: "sup_steelco",
    supplier_name: "SteelCo India",
    action_type: "recycled_material",
    title: "Switch SteelCo India to EAF Recycled Steel",
    description: "Transition crude steel specification from blast furnace route to Electric Arc Furnace (EAF) scrap steel.",
    current_co2e_kg: 89850,
    projected_co2e_kg: 53600,
    delta_co2e_kg: 36250,
    status: "in_progress"
  },
  {
    recommendation_id: "rec_aluco_modal_shift",
    org_id: "org_apex",
    supplier_id: "sup_aluco",
    supplier_name: "AluCo Extrusions",
    action_type: "modal_shift",
    title: "Shift Freight for AluCo from Air Cargo to Rail",
    description: "Shift 1,200 km inbound shipments from express air freight (0.68 kg CO₂e/t-km) to electrified rail freight (0.03 kg CO₂e/t-km).",
    current_co2e_kg: 82136,
    projected_co2e_kg: 75896,
    delta_co2e_kg: 6240,
    status: "open"
  }
];

export const MOCK_FACTORS: EmissionFactor[] = [
  { factor_id: "fac_mat_steel", org_id: null, factor_category: "material", code: "steel", factor_kg_co2e_per_unit: 1.85, unit: "kg", source: "DEFRA 2024", year: 2024 },
  { factor_id: "fac_mat_alu", org_id: null, factor_category: "material", code: "aluminium", factor_kg_co2e_per_unit: 8.24, unit: "kg", source: "DEFRA 2024", year: 2024 },
  { factor_id: "fac_mat_plastic", org_id: null, factor_category: "material", code: "plastic", factor_kg_co2e_per_unit: 2.50, unit: "kg", source: "Ecoinvent 3.9", year: 2023 },
  { factor_id: "fac_mat_cement", org_id: null, factor_category: "material", code: "cement", factor_kg_co2e_per_unit: 0.90, unit: "kg", source: "IPCC 2023", year: 2023 },
  { factor_id: "fac_nrg_coal", org_id: null, factor_category: "energy", code: "grid_coal", factor_kg_co2e_per_unit: 0.82, unit: "kwh", source: "IEA 2024", year: 2024 },
  { factor_id: "fac_nrg_mixed", org_id: null, factor_category: "energy", code: "grid_mixed", factor_kg_co2e_per_unit: 0.45, unit: "kwh", source: "IEA 2024", year: 2024 },
  { factor_id: "fac_nrg_ren", org_id: null, factor_category: "energy", code: "grid_renewable", factor_kg_co2e_per_unit: 0.04, unit: "kwh", source: "IEA 2024", year: 2024 },
  { factor_id: "fac_trp_road", org_id: null, factor_category: "transport", code: "road", factor_kg_co2e_per_unit: 0.12, unit: "tonne_km", source: "GLEC Framework", year: 2023 },
  { factor_id: "fac_trp_rail", org_id: null, factor_category: "transport", code: "rail", factor_kg_co2e_per_unit: 0.03, unit: "tonne_km", source: "GLEC Framework", year: 2023 },
  { factor_id: "fac_trp_sea", org_id: null, factor_category: "transport", code: "sea", factor_kg_co2e_per_unit: 0.015, unit: "tonne_km", source: "GLEC Framework", year: 2023 },
  { factor_id: "fac_trp_air", org_id: null, factor_category: "transport", code: "air", factor_kg_co2e_per_unit: 0.68, unit: "tonne_km", source: "GLEC Framework", year: 2023 }
];

export const MOCK_SCENARIO_RESULT: ScenarioSimulationResponse = {
  period: "2025",
  recycled_material_pct: 40,
  renewable_energy_pct: 60,
  rail_transport_pct: 50,
  current_total_co2e_kg: 285446.8,
  projected_total_co2e_kg: 198520.4,
  delta_co2e_kg: 86926.4,
  delta_pct: 30.45
};
