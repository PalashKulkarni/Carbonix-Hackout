"""What-if scenario simulation engine.

Follows docs/CARBON_ENGINE.md:
Apply sliders before calling bucket math:
- recycled_material_pct: material factor blended toward recycled_{material_code}
  (if missing, material_factor * 0.4 as stand-in).
- renewable_energy_pct: energy factor blended toward grid_renewable.
- rail_transport_pct: that fraction of freight activity uses rail instead of current mode.

Returns current totals, projected totals, delta_co2e_kg, delta_pct, and by_category breakdown.
"""

from typing import List, Optional

from .constants import EmissionCategory, FactorCategory
from .factors import FactorRegistry, get_default_registry
from .models import (
    CategoryScenarioResult,
    ScenarioInput,
    ScenarioResult,
    SupplierActivityInput,
)
from .units import calculate_tonne_km


def simulate_scenario(
    suppliers: List[SupplierActivityInput],
    scenario: ScenarioInput,
    org_id: Optional[str] = None,
    registry: Optional[FactorRegistry] = None,
) -> ScenarioResult:
    """Run what-if scenario simulation on a set of supplier activities."""
    if registry is None:
        registry = get_default_registry()

    recycled_frac = scenario.recycled_material_pct / 100.0
    renewable_frac = scenario.renewable_energy_pct / 100.0
    rail_frac = scenario.rail_transport_pct / 100.0

    # Retrieve reference factors
    grid_renewable_f = registry.get_with_fallback(FactorCategory.ENERGY, "grid_renewable", org_id).value
    rail_f = registry.get_with_fallback(FactorCategory.TRANSPORT, "rail", org_id).value
    logistics_road_f = registry.get_with_fallback(FactorCategory.LOGISTICS, "logistics_road", org_id).value

    curr_energy = 0.0
    proj_energy = 0.0

    curr_transport = 0.0
    proj_transport = 0.0

    curr_material = 0.0
    proj_material = 0.0

    curr_mfg = 0.0
    proj_mfg = 0.0

    curr_logistics = 0.0
    proj_logistics = 0.0

    for s in suppliers:
        mat_code = s.material_code.value if hasattr(s.material_code, "value") else str(s.material_code)
        elec_code = s.electricity_source.value if hasattr(s.electricity_source, "value") else str(s.electricity_source)
        trans_code = s.transport_mode.value if hasattr(s.transport_mode, "value") else str(s.transport_mode)

        # 1. Energy
        orig_en_factor = registry.get_with_fallback(FactorCategory.ENERGY, elec_code, org_id).value
        blended_en_factor = (1.0 - renewable_frac) * orig_en_factor + renewable_frac * grid_renewable_f
        curr_energy += s.energy_kwh * orig_en_factor
        proj_energy += s.energy_kwh * blended_en_factor

        # 2. Transport
        tonne_km = calculate_tonne_km(s.material_quantity_kg, s.transport_distance_km)
        orig_tr_factor = registry.get_with_fallback(FactorCategory.TRANSPORT, trans_code, org_id).value
        blended_tr_factor = (1.0 - rail_frac) * orig_tr_factor + rail_frac * rail_f
        curr_transport += tonne_km * orig_tr_factor
        proj_transport += tonne_km * blended_tr_factor

        # 3. Material
        orig_mat_factor = registry.get_with_fallback(FactorCategory.MATERIAL, mat_code, org_id).value
        recycled_code = f"recycled_{mat_code}"
        rec_factor_item = registry.get(FactorCategory.MATERIAL, recycled_code, org_id)
        if rec_factor_item is not None:
            rec_mat_factor = rec_factor_item.factor_kg_co2e_per_unit
        else:
            rec_mat_factor = orig_mat_factor * 0.4

        blended_mat_factor = (1.0 - recycled_frac) * orig_mat_factor + recycled_frac * rec_mat_factor
        curr_material += s.material_quantity_kg * orig_mat_factor
        proj_material += s.material_quantity_kg * blended_mat_factor

        # 4. Manufacturing
        mfg_code = f"mfg_{mat_code}"
        mfg_factor = registry.get_with_fallback(FactorCategory.MANUFACTURING, mfg_code, org_id).value
        mfg_emissions = s.production_volume * mfg_factor
        curr_mfg += mfg_emissions
        proj_mfg += mfg_emissions

        # 5. Logistics (50 km last mile)
        logistics_tonne_km = calculate_tonne_km(s.material_quantity_kg, 50.0)
        logistics_emissions = logistics_tonne_km * logistics_road_f
        curr_logistics += logistics_emissions
        proj_logistics += logistics_emissions

    # Round category totals
    curr_total = round(curr_energy + curr_transport + curr_material + curr_mfg + curr_logistics, 4)
    proj_total = round(proj_energy + proj_transport + proj_material + proj_mfg + proj_logistics, 4)
    delta_co2e_kg = round(curr_total - proj_total, 4)
    delta_pct = round((delta_co2e_kg / curr_total * 100.0), 2) if curr_total > 0 else 0.0

    by_category = [
        CategoryScenarioResult(
            emission_category=EmissionCategory.ENERGY,
            current_co2e_kg=round(curr_energy, 4),
            projected_co2e_kg=round(proj_energy, 4),
        ),
        CategoryScenarioResult(
            emission_category=EmissionCategory.TRANSPORT,
            current_co2e_kg=round(curr_transport, 4),
            projected_co2e_kg=round(proj_transport, 4),
        ),
        CategoryScenarioResult(
            emission_category=EmissionCategory.MATERIAL,
            current_co2e_kg=round(curr_material, 4),
            projected_co2e_kg=round(proj_material, 4),
        ),
        CategoryScenarioResult(
            emission_category=EmissionCategory.MANUFACTURING,
            current_co2e_kg=round(curr_mfg, 4),
            projected_co2e_kg=round(proj_mfg, 4),
        ),
        CategoryScenarioResult(
            emission_category=EmissionCategory.LOGISTICS,
            current_co2e_kg=round(curr_logistics, 4),
            projected_co2e_kg=round(proj_logistics, 4),
        ),
    ]

    return ScenarioResult(
        period=scenario.period,
        recycled_material_pct=scenario.recycled_material_pct,
        renewable_energy_pct=scenario.renewable_energy_pct,
        rail_transport_pct=scenario.rail_transport_pct,
        current_total_co2e_kg=curr_total,
        projected_total_co2e_kg=proj_total,
        delta_co2e_kg=delta_co2e_kg,
        delta_pct=delta_pct,
        by_category=by_category,
    )

