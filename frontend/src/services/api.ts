import type {
  AuthResponse,
  DashboardData,
  EmissionFactor,
  HierarchyNode,
  MapSupplier,
  Recommendation,
  RecommendationStatus,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  Supplier,
  SupplierCreatePayload,
} from '../types';
import {
  MOCK_DASHBOARD,
  MOCK_FACTORS,
  MOCK_HIERARCHY,
  MOCK_MAP_SUPPLIERS,
  MOCK_RECOMMENDATIONS,
  MOCK_SUPPLIERS,
} from '../fixtures/mockData';


const API_BASE_URL = 'http://localhost:8000';

function getStoredToken(): string {
  return typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('carbonix_token') || 'demo-token-apex'
    : 'demo-token-apex';
}

async function fetchWithFallback<T>(url: string, options: RequestInit = {}, fallbackData: T): Promise<T> {
  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      console.warn(`[API] ${url} returned ${response.status}. Using fallback data.`);
      return fallbackData;
    }

    return await response.json();
  } catch (error) {
    console.warn(`[API Network Error] ${url}. Using fallback data.`, error);
    return fallbackData;
  }
}

export const api = {
  // Auth
  demoLogin: async (): Promise<AuthResponse> => {
    const response = await fetchWithFallback<AuthResponse>('/auth/demo', { method: 'POST', body: JSON.stringify({}) }, {
      token: 'demo-token-apex',
      org_id: 'org_apex',
      org_name: 'Apex Manufacturing',
      email: 'demo@apex.example',
    });
    sessionStorage.setItem('carbonix_token', response.token);
    return response;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetchWithFallback<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, {
      token: '',
      org_id: '',
      org_name: '',
      email,
    });
    if (!response.token) {
      throw new Error('Invalid email or password');
    }
    sessionStorage.setItem('carbonix_token', response.token);
    return response;
  },

  signup: async (email: string, password: string, orgName: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, org_name: orgName }),
    });
    if (!response.ok) {
      throw new Error('Unable to create account');
    }
    const data = await response.json() as AuthResponse;
    sessionStorage.setItem('carbonix_token', data.token);
    return data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Unable to request password reset');
    return response.json();
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (!response.ok) throw new Error('This password reset link is invalid or has expired.');
    return response.json();
  },

  getAuthMe: async (): Promise<{ org_id: string; org_name: string; email: string }> => {
    return fetchWithFallback('/auth/me', {}, {
      org_id: 'org_apex',
      org_name: 'Apex Manufacturing',
      email: 'demo@apex.example',
    });
  },

  askInventoryQuestion: async (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    period = '2025',
  ): Promise<{ role: 'assistant'; content: string }> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ messages, period }),
    });
    if (!response.ok) {
      throw new Error(`Inventory assistant failed: ${response.status}`);
    }
    return response.json();
  },

  // Dashboard
  getDashboard: async (period = '2025'): Promise<DashboardData> => {
    return fetchWithFallback<DashboardData>(`/dashboard?period=${period}`, {}, MOCK_DASHBOARD);
  },

  // Suppliers
  getSuppliers: async (period = '2025', tier?: number, carbonRisk?: string): Promise<{ items: Supplier[]; total: number }> => {
    let query = `/suppliers?period=${period}`;
    if (tier) query += `&tier=${tier}`;
    if (carbonRisk) query += `&carbon_risk=${carbonRisk}`;
    
    const fallback = { items: MOCK_SUPPLIERS, total: MOCK_SUPPLIERS.length };
    return fetchWithFallback<{ items: Supplier[]; total: number }>(query, {}, fallback);
  },

  getSupplierById: async (supplierId: string): Promise<Supplier | null> => {
    const fallback = MOCK_SUPPLIERS.find(s => s.supplier_id === supplierId) || MOCK_SUPPLIERS[0];
    return fetchWithFallback<Supplier>(`/suppliers/${supplierId}`, {}, fallback);
  },

  createSupplier: async (payload: SupplierCreatePayload): Promise<Supplier> => {
    const fallback: Supplier = {
      supplier_id: `sup_${Math.random().toString(36).substring(2, 10)}`,
      org_id: 'org_apex',
      parent_id: payload.parent_id || null,
      name: payload.name,
      tier: payload.tier,
      material_code: payload.material_code,
      material_quantity_kg: payload.material_quantity_kg || 0,
      energy_kwh: payload.energy_kwh || 0,
      electricity_source: payload.electricity_source || 'grid_mixed',
      transport_distance_km: payload.transport_distance_km || 0,
      transport_mode: payload.transport_mode || 'road',
      location_label: payload.location_label,
      latitude: payload.latitude,
      longitude: payload.longitude,
      production_volume: payload.production_volume || 0,
      production_unit: payload.production_unit || 'tonnes',
      data_source: 'primary',
      total_co2e_kg: 15400,
      intensity_kg_per_unit: 1540,
      carbon_risk: 'medium',
      rank: MOCK_SUPPLIERS.length + 1
    };

    return fetchWithFallback<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, fallback);
  },

  updateSupplier: async (supplierId: string, payload: Partial<Supplier>): Promise<Supplier> => {
    const existing = MOCK_SUPPLIERS.find(s => s.supplier_id === supplierId) || MOCK_SUPPLIERS[0];
    const fallback: Supplier = { ...existing, ...payload };

    return fetchWithFallback<Supplier>(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, fallback);
  },

  uploadSuppliersCsv: async (file: File): Promise<{ created: number; updated: number; errors: any[]; items: Supplier[] }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/suppliers/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getStoredToken()}` },
        body: formData,
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('[CSV Upload API Error]', e);
    }
    return { created: 1, updated: 5, errors: [], items: MOCK_SUPPLIERS };
  },

  reseedDemoData: async (): Promise<{ items: Supplier[]; total: number }> => {
    return fetchWithFallback<{ items: Supplier[]; total: number }>('/suppliers/demo', {
      method: 'POST',
    }, { items: MOCK_SUPPLIERS, total: MOCK_SUPPLIERS.length });
  },

  // Hierarchy
  getHierarchy: async (period = '2025'): Promise<HierarchyNode> => {
    return fetchWithFallback<HierarchyNode>(`/hierarchy?period=${period}`, {}, MOCK_HIERARCHY);
  },

  // Map
  getMapSuppliers: async (period = '2025'): Promise<{ items: MapSupplier[] }> => {
    return fetchWithFallback<{ items: MapSupplier[] }>(`/map/suppliers?period=${period}`, {}, { items: MOCK_MAP_SUPPLIERS });
  },

  // Recommendations
  getRecommendations: async (period = '2025', supplierId?: string): Promise<{ items: Recommendation[]; total: number }> => {
    let query = `/recommendations?period=${period}`;
    if (supplierId) query += `&supplier_id=${supplierId}`;
    
    let filtered = MOCK_RECOMMENDATIONS;
    if (supplierId) {
      filtered = filtered.filter(r => r.supplier_id === supplierId);
    }
    return fetchWithFallback<{ items: Recommendation[]; total: number }>(query, {}, { items: filtered, total: filtered.length });
  },

  updateRecommendationStatus: async (recommendationId: string, status: RecommendationStatus): Promise<Recommendation> => {
    const rec = MOCK_RECOMMENDATIONS.find(r => r.recommendation_id === recommendationId) || MOCK_RECOMMENDATIONS[0];
    const fallback = { ...rec, status };

    return fetchWithFallback<Recommendation>(`/recommendations/${recommendationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, fallback);
  },

  // Scenarios
  simulateScenario: async (payload: ScenarioSimulationRequest): Promise<ScenarioSimulationResponse> => {
    // Dynamic math calculation for realistic scenario preview
    const baseTotal = 285446.8;
    const matReduction = (payload.recycled_material_pct / 100) * 0.40 * baseTotal;
    const nrgReduction = (payload.renewable_energy_pct / 100) * 0.25 * baseTotal;
    const railReduction = (payload.rail_transport_pct / 100) * 0.05 * baseTotal;
    const totalReduction = matReduction + nrgReduction + railReduction;
    const projected = Math.max(0, baseTotal - totalReduction);

    const fallback: ScenarioSimulationResponse = {
      period: payload.period || '2025',
      recycled_material_pct: payload.recycled_material_pct,
      renewable_energy_pct: payload.renewable_energy_pct,
      rail_transport_pct: payload.rail_transport_pct,
      current_total_co2e_kg: baseTotal,
      projected_total_co2e_kg: Math.round(projected * 10) / 10,
      delta_co2e_kg: Math.round(totalReduction * 10) / 10,
      delta_pct: Math.round((totalReduction / baseTotal) * 10000) / 100,
    };

    return fetchWithFallback<ScenarioSimulationResponse>('/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, fallback);
  },

  // Factors
  getFactors: async (): Promise<{ items: EmissionFactor[] }> => {
    return fetchWithFallback<{ items: EmissionFactor[] }>('/factors', {}, { items: MOCK_FACTORS });
  },

  updateFactor: async (factorId: string, payload: { factor_kg_co2e_per_unit: number; source: string; year: number }): Promise<EmissionFactor> => {
    const factor = MOCK_FACTORS.find(f => f.factor_id === factorId) || MOCK_FACTORS[0];
    const fallback = { ...factor, ...payload };

    return fetchWithFallback<EmissionFactor>(`/factors/${factorId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, fallback);
  },

  generateEsgReport: async (period = '2025'): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/reports/esg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStoredToken()}`,
      },
      body: JSON.stringify({ period, scenario_id: null }),
    });
    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.status}`);
    }
    return response.blob();
  }
};
