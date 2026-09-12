import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import {
  ExternalLink,
  MapPin,
  Navigation,
  Route as RouteIcon,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { CarbonRisk, EmissionFactor, MapSupplier, Supplier, TransportMode } from '../types';
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapPageProps {
  period: string;
}

// ─── Local types ──────────────────────────────────────────────────────────────

type InspectorMode = 'node' | 'route';

type RouteLine = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

type HeatmapFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { intensity: number; emissions: number; name: string };
    geometry: { type: 'Point'; coordinates: [number, number] };
  }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIA_VIEW = {
  longitude: 78.9629,
  latitude: 22.5937,
  zoom: 4.35,
};

const INDIA_BOUNDS: [number, number, number, number] = [67.5, 6.4, 97.6, 37.2];

/** OpenStreetMap — free, no API key required */
const CARTO_BASEMAP = {
  version: 8 as const,
  name: 'OpenStreetMap',
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm-basemap', type: 'raster' as const, source: 'osm' }],
};

const RISK_COLOR: Record<CarbonRisk, { fill: string; glow: string }> = {
  high:   { fill: '#C45B4A', glow: 'rgba(196, 91, 74, 0.42)' },
  medium: { fill: '#D4A843', glow: 'rgba(212, 168, 67, 0.42)' },
  low:    { fill: '#2D6A4F', glow: 'rgba(45, 106, 79, 0.42)' },
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function haversineKm(
  from: { latitude: number; longitude: number },
  to:   { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon  = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
}

function lineFeature(coordinates: [number, number][]): RouteLine {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };
}

function tonnesLabel(co2eKg: number): string {
  return `${(co2eKg / 1000).toFixed(2)} tCO₂e`;
}

function transportFactor(factors: EmissionFactor[], mode: TransportMode | undefined): number {
  const code = mode ?? 'road';
  const exact = factors.find((f) => f.factor_category === 'transport' && f.code === code);
  const road  = factors.find((f) => f.factor_category === 'transport' && f.code === 'road');
  return exact?.factor_kg_co2e_per_unit ?? road?.factor_kg_co2e_per_unit ?? 0.12;
}

function buildHeatmapData(suppliers: MapSupplier[]): HeatmapFeatureCollection {
  const maxEmissions = Math.max(...suppliers.map((s) => s.total_co2e_kg), 1);
  return {
    type: 'FeatureCollection',
    features: suppliers.map((s) => ({
      type: 'Feature',
      properties: {
        intensity: s.total_co2e_kg / maxEmissions,
        emissions: s.total_co2e_kg,
        name: s.name,
      },
      geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
    })),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MapPage: React.FC<MapPageProps> = ({ period }) => {
  const navigate  = useNavigate();
  const mapRef    = useRef<MapRef | null>(null);

  // Data state
  const [suppliers,   setSuppliers]   = useState<MapSupplier[]>([]);
  const [activityById, setActivityById] = useState<Record<string, Supplier>>({});
  const [factors,     setFactors]     = useState<EmissionFactor[]>([]);
  const [loading,     setLoading]     = useState(true);

  // Interaction state
  const [selectedId,    setSelectedId]    = useState<string>('');
  const [fromId,        setFromId]        = useState('');
  const [toId,          setToId]          = useState('');
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('node');

  // Route state
  const [routeLine,       setRouteLine]       = useState<RouteLine | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeLoading,    setRouteLoading]    = useState(false);
  const [routeLabel,      setRouteLabel]      = useState('');

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [mapRes, supplierRes, factorRes] = await Promise.all([
        api.getMapSuppliers(period),
        api.getSuppliers(period),
        api.getFactors(),
      ]);
      setSuppliers(mapRes.items);
      setActivityById(
        Object.fromEntries(supplierRes.items.map((s) => [s.supplier_id, s])),
      );
      setFactors(factorRes.items);
      if (mapRes.items.length > 0) {
        setSelectedId(mapRes.items[0].supplier_id);
      }
      setLoading(false);
    };
    void load();
  }, [period]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.supplier_id === selectedId) ?? null,
    [suppliers, selectedId],
  );
  const fromSupplier = useMemo(
    () => suppliers.find((s) => s.supplier_id === fromId) ?? null,
    [suppliers, fromId],
  );
  const toSupplier = useMemo(
    () => suppliers.find((s) => s.supplier_id === toId) ?? null,
    [suppliers, toId],
  );
  const routeActive    = Boolean(fromSupplier && toSupplier && fromId !== toId);
  const heatmapData    = useMemo(() => buildHeatmapData(suppliers), [suppliers]);
  const totalEmissions = useMemo(
    () => suppliers.reduce((sum, s) => sum + s.total_co2e_kg, 0),
    [suppliers],
  );

  // ── Route fetch with abort controller ────────────────────────────────────────
  useEffect(() => {
    if (!fromSupplier || !toSupplier || fromSupplier.supplier_id === toSupplier.supplier_id) {
      setRouteLine(null);
      setRouteDistanceKm(null);
      setRouteLoading(false);
      setRouteLabel('');
      return;
    }

    const controller  = new AbortController();
    const fallbackKm  = haversineKm(fromSupplier, toSupplier);
    const fallbackLine = lineFeature([
      [fromSupplier.longitude, fromSupplier.latitude],
      [toSupplier.longitude,   toSupplier.latitude],
    ]);

    // Show fallback immediately, then upgrade with OSRM data
    setRouteLine(fallbackLine);
    setRouteDistanceKm(fallbackKm);
    setRouteLabel(`${fromSupplier.name} → ${toSupplier.name} (straight-line)`);

    const fetchOsrm = async () => {
      setRouteLoading(true);
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${fromSupplier.longitude},${fromSupplier.latitude};` +
          `${toSupplier.longitude},${toSupplier.latitude}` +
          `?overview=full&geometries=geojson`;
        const res  = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('osrm-http');
        const data = await res.json();
        const route = data.routes?.[0];
        const coords = route?.geometry?.coordinates as [number, number][] | undefined;
        if (!coords?.length) throw new Error('osrm-empty');
        setRouteLine(lineFeature(coords));
        setRouteDistanceKm(Number(route.distance) / 1000);
        setRouteLabel(`${fromSupplier.name} → ${toSupplier.name}`);
        // Fit bounds after route is set
        const map = mapRef.current?.getMap();
        if (map) {
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          map.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 90, maxZoom: 9, duration: 900 },
          );
        }
      } catch {
        if (controller.signal.aborted) return;
        // Stay on fallback straight-line
        setRouteLine(fallbackLine);
        setRouteDistanceKm(fallbackKm);
        setRouteLabel(`${fromSupplier.name} → ${toSupplier.name} (direct)`);
      } finally {
        if (!controller.signal.aborted) setRouteLoading(false);
      }
    };

    void fetchOsrm();
    return () => controller.abort();
  }, [fromSupplier, toSupplier]);

  // ── Transport CO₂e overlay ────────────────────────────────────────────────────
  const overlayTransportCo2eKg = useMemo(() => {
    if (!routeActive || routeDistanceKm == null || !toSupplier) return null;
    const destActivity = activityById[toSupplier.supplier_id];
    const tonnes  = (destActivity?.material_quantity_kg ?? 0) / 1000;
    const factor  = transportFactor(factors, destActivity?.transport_mode);
    return tonnes * routeDistanceKm * factor;
  }, [activityById, factors, routeActive, routeDistanceKm, toSupplier]);

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const showRouteInspector = routeActive && inspectorMode === 'route';

  const handleSelectNode = (sup: MapSupplier) => {
    setSelectedId(sup.supplier_id);
    setInspectorMode('node');
  };

  const handleFromChange = (value: string) => {
    setFromId(value);
    if (value && toId && value !== toId) setInspectorMode('route');
  };

  const handleToChange = (value: string) => {
    setToId(value);
    if (fromId && value && fromId !== value) setInspectorMode('route');
  };

  const clearRoute = () => {
    setFromId('');
    setToId('');
    setRouteLine(null);
    setRouteDistanceKm(null);
    setRouteLabel('');
    setInspectorMode('node');
  };

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-stone-500 font-mono-data text-xs">
        Loading geographic cartographic baselayer…
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl flex items-center justify-between p-6"
        style={{ background: 'linear-gradient(135deg, #1A3D2E 0%, #254F3E 100%)', border: '1px solid #2D6A4F' }}
      >
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" style={{ color: '#8FB3A0' }} />
            <h2 className="font-heading text-xl font-bold text-white">
              Geographic Carbon Hotspot Map
            </h2>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Heat field shows where reported supplier emissions concentrate. Marker color indicates carbon risk.
            Choose an origin and destination to overlay the driving route and transport CO₂e.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono-data" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#C45B4A]" />
            High Risk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D4A843]" />
            Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2D6A4F]" />
            Low
          </span>
        </div>
      </div>

      {/* ── Body grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Map panel ──────────────────────────────────────────────────────── */}
        <div
          className="carbonix-card relative overflow-hidden p-0 lg:col-span-2"
          style={{ minHeight: '560px' }}
        >
          {/* Floating distance badge — top-center */}
          <div
            style={{
              position:       'absolute',
              top:            '16px',
              left:           '50%',
              transform:      'translateX(-50%)',
              zIndex:         20,
              background:     'rgba(255,255,255,0.97)',
              border:         '1px solid #E1DFDA',
              borderRadius:   '10px',
              padding:        '10px 20px',
              boxShadow:      '0 4px 16px rgba(27,58,45,0.12)',
              display:        'flex',
              alignItems:     'center',
              gap:            '12px',
              backdropFilter: 'blur(8px)',
              whiteSpace:     'nowrap',
            }}
          >
            <RouteIcon size={16} color="#C45B4A" />
            <div>
              <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C45B4A', marginBottom: '2px' }}>
                Route Distance
              </p>
              <p style={{ fontFamily: 'Newsreader, serif', fontSize: '22px', fontWeight: 700, color: '#1B3A2D', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {routeLoading ? '…' : routeDistanceKm == null ? '—' : `${routeDistanceKm.toFixed(1)} km`}
              </p>
            </div>

            {overlayTransportCo2eKg != null && (
              <div style={{ borderLeft: '1px solid #E1DFDA', paddingLeft: '12px' }}>
                <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4A4A4A', marginBottom: '2px' }}>
                  Transport CO₂e
                </p>
                <p style={{ fontFamily: 'Newsreader, serif', fontSize: '14px', fontWeight: 700, color: '#C45B4A' }}>
                  {tonnesLabel(overlayTransportCo2eKg)}
                </p>
              </div>
            )}
          </div>

          {/* From / To selectors + clear — absolute bottom-left of map */}
          <div
            style={{
              position: 'absolute',
              bottom:   '16px',
              left:     '16px',
              zIndex:   20,
              display:  'flex',
              gap:      '8px',
              flexWrap: 'wrap',
            }}
          >
            {/* FROM */}
            <select
              value={fromId}
              onChange={(e) => handleFromChange(e.target.value)}
              style={{
                borderRadius:   '8px',
                border:         '1px solid #E1DFDA',
                background:     'rgba(255,255,255,0.97)',
                padding:        '6px 10px',
                fontSize:       '12px',
                fontFamily:     'Geist, sans-serif',
                color:          '#2C2C2C',
                backdropFilter: 'blur(8px)',
                cursor:         'pointer',
                boxShadow:      '0 2px 8px rgba(0,0,0,0.1)',
                maxWidth:       '200px',
              }}
            >
              <option value="">From: select origin</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id} disabled={s.supplier_id === toId}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* TO */}
            <select
              value={toId}
              onChange={(e) => handleToChange(e.target.value)}
              style={{
                borderRadius:   '8px',
                border:         '1px solid #E1DFDA',
                background:     'rgba(255,255,255,0.97)',
                padding:        '6px 10px',
                fontSize:       '12px',
                fontFamily:     'Geist, sans-serif',
                color:          '#2C2C2C',
                backdropFilter: 'blur(8px)',
                cursor:         'pointer',
                boxShadow:      '0 2px 8px rgba(0,0,0,0.1)',
                maxWidth:       '200px',
              }}
            >
              <option value="">To: select destination</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id} disabled={s.supplier_id === fromId}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Clear route button */}
            {(fromId || toId) && (
              <button
                type="button"
                onClick={clearRoute}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '4px',
                  borderRadius:   '8px',
                  border:         '1px solid #E1DFDA',
                  background:     'rgba(255,255,255,0.97)',
                  padding:        '6px 10px',
                  fontSize:       '12px',
                  fontFamily:     'Geist, sans-serif',
                  color:          '#1B3A2D',
                  backdropFilter: 'blur(8px)',
                  cursor:         'pointer',
                  boxShadow:      '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>

          {/* MapLibre map */}
          <div className="hotspot-map" style={{ height: '560px', width: '100%' }}>
            <Map
              ref={mapRef}
              initialViewState={INDIA_VIEW}
              style={{ width: '100%', height: '100%' }}
              mapStyle={CARTO_BASEMAP}
              maxBounds={INDIA_BOUNDS}
              attributionControl={{ compact: true }}
            >
              <NavigationControl position="bottom-right" showCompass={false} />

              {/* ── Heatmap layer ──────────────────────────────────────────────── */}
              <Source id="supplier-emissions-heatmap" type="geojson" data={heatmapData}>
                <Layer
                  id="supplier-emissions-heat"
                  type="heatmap"
                  maxzoom={10}
                  paint={{
                    'heatmap-weight': [
                      'interpolate', ['linear'], ['get', 'intensity'],
                      0, 0.12,  0.35, 0.5,  1, 1,
                    ],
                    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.75, 8, 1.2],
                    'heatmap-radius':    ['interpolate', ['linear'], ['zoom'], 4, 38,   8, 58],
                    'heatmap-opacity':   0.82,
                    'heatmap-color': [
                      'interpolate', ['linear'], ['heatmap-density'],
                      0,    'rgba(247,245,240,0)',
                      0.18, '#D9E8D8',
                      0.38, '#A8C89D',
                      0.58, '#D4A843',
                      0.78, '#D87852',
                      1,    '#B53D42',
                    ],
                  }}
                />
              </Source>

              {/* ── Route layers ───────────────────────────────────────────────── */}
              {routeActive && routeLine && (
                <Source id="supplier-route" type="geojson" data={routeLine}>
                  {/* White casing */}
                  <Layer
                    id="supplier-route-casing"
                    type="line"
                    paint={{ 'line-color': '#F7F5F0', 'line-width': 7, 'line-opacity': 0.9 }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  />
                  {/* Soft glow */}
                  <Layer
                    id="supplier-route-glow"
                    type="line"
                    paint={{ 'line-color': '#C45B4A', 'line-width': 10, 'line-opacity': 0.25, 'line-blur': 3 }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  />
                  {/* Dashed red line */}
                  <Layer
                    id="supplier-route-line"
                    type="line"
                    paint={{
                      'line-color':     '#C45B4A',
                      'line-width':     3,
                      'line-opacity':   1,
                      'line-dasharray': [1.5, 1.2],
                    }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  />
                </Source>
              )}

              {/* ── Supplier markers ───────────────────────────────────────────── */}
              {suppliers.map((sup) => {
                const isSelected = selectedId === sup.supplier_id;
                const isFrom     = fromId === sup.supplier_id;
                const isTo       = toId   === sup.supplier_id;
                const isEndpoint = isFrom || isTo;
                const tone       = RISK_COLOR[sup.carbon_risk];
                const showLabel  = isSelected || isEndpoint;

                return (
                  <Marker
                    key={sup.supplier_id}
                    longitude={sup.longitude}
                    latitude={sup.latitude}
                    anchor={isEndpoint ? 'bottom' : 'center'}
                    style={{ zIndex: isEndpoint ? 40 : isSelected ? 30 : 10 }}
                    onClick={(event) => {
                      event.originalEvent.stopPropagation();
                      handleSelectNode(sup);
                    }}
                  >
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Label tooltip */}
                      {showLabel && (
                        <span
                          style={{
                            position:      'absolute',
                            bottom:        isEndpoint ? '40px' : '22px',
                            whiteSpace:    'nowrap',
                            borderRadius:  '6px',
                            border:        '1px solid rgba(255,255,255,0.8)',
                            background:    '#1B3A2D',
                            padding:       '3px 8px',
                            fontSize:      '10px',
                            fontFamily:    'Geist Mono, monospace',
                            fontWeight:    600,
                            color:         '#F7F5F0',
                            boxShadow:     '0 2px 8px rgba(27,58,45,0.25)',
                            pointerEvents: 'none',
                          }}
                        >
                          {isFrom ? 'FROM · ' : isTo ? 'TO · ' : ''}{sup.name}
                        </span>
                      )}

                      {/* Pin element — red teardrop for endpoints, dot for rest */}
                      {isEndpoint
                        ? <RedPinMarker />
                        : <DotMarker fill={tone.fill} glow={tone.glow} selected={isSelected} />
                      }
                    </div>
                  </Marker>
                );
              })}
            </Map>
          </div>

          {/* Heatmap legend strip */}
          <div
            style={{
              position:   'absolute',
              bottom:     '16px',
              right:      '60px',
              zIndex:     20,
              display:    'flex',
              alignItems: 'center',
              gap:        '8px',
              background: 'rgba(255,255,255,0.92)',
              border:     '1px solid #E1DFDA',
              borderRadius: '8px',
              padding:    '6px 10px',
              backdropFilter: 'blur(8px)',
              boxShadow:  '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <span style={{ fontSize: '10px', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280' }}>
              CO₂e intensity
            </span>
            <span
              style={{
                height:     '8px',
                width:      '80px',
                borderRadius: '4px',
                background: 'linear-gradient(to right, #D9E8D8, #D4A843, #B53D42)',
              }}
            />
            <span style={{ fontSize: '10px', fontFamily: 'Geist Mono, monospace', color: '#B53D42' }}>
              {(totalEmissions / 1000).toFixed(0)}t
            </span>
          </div>

          {/* Route status caption */}
          {routeLabel && (
            <div
              style={{
                position:    'absolute',
                top:         '16px',
                left:        '16px',
                zIndex:      20,
                background:  'rgba(255,255,255,0.92)',
                border:      '1px solid #E1DFDA',
                borderRadius: '8px',
                padding:     '5px 10px',
                fontSize:    '10px',
                fontFamily:  'Geist Mono, monospace',
                color:       routeLoading ? '#D4A843' : '#1B3A2D',
                backdropFilter: 'blur(8px)',
                boxShadow:   '0 2px 8px rgba(0,0,0,0.08)',
                maxWidth:    '240px',
              }}
            >
              {routeLoading ? '⟳ Calculating route…' : routeLabel}
            </div>
          )}
        </div>

        {/* ── Inspector sidebar ────────────────────────────────────────────────── */}
        <div className="carbonix-card flex flex-col justify-between bg-white p-6">
          <div>
            {/* Inspector header */}
            <div className="mb-4 flex items-center space-x-2 border-b border-[#E1DFDA] pb-3">
              {showRouteInspector
                ? <RouteIcon className="h-5 w-5 text-[#1B3A2D]" />
                : <Navigation className="h-5 w-5 text-[#1B3A2D]" />
              }
              <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">
                {showRouteInspector ? 'Route Inspector' : 'Node Telemetry Inspector'}
              </h3>
            </div>

            {/* ── Route inspector ──────────────────────────────────────────────── */}
            {showRouteInspector && fromSupplier && toSupplier ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono-data uppercase text-stone-500">Origin</p>
                  <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">{fromSupplier.name}</h3>
                  <p className="text-xs font-mono-data text-stone-500">{fromSupplier.supplier_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono-data uppercase text-stone-500">Destination</p>
                  <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">{toSupplier.name}</h3>
                  <p className="text-xs font-mono-data text-stone-500">{toSupplier.supplier_id}</p>
                </div>

                <div className="space-y-2 rounded-lg border border-[#E1DFDA] bg-[#F7F5F0] p-4 text-xs font-mono-data">
                  {[
                    {
                      label: 'Routed distance',
                      value: routeDistanceKm == null ? '—' : `${routeDistanceKm.toFixed(1)} km`,
                      highlight: true,
                    },
                    {
                      label: 'Transport CO₂e',
                      value: overlayTransportCo2eKg == null ? '—' : tonnesLabel(overlayTransportCo2eKg),
                      highlight: false,
                    },
                    {
                      label: 'Destination emissions',
                      value: tonnesLabel(toSupplier.total_co2e_kg),
                      highlight: false,
                    },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-stone-500">{label}:</span>
                      <span style={{ fontWeight: 700, color: highlight ? '#C45B4A' : '#1B3A2D' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] leading-relaxed text-stone-500">
                  Transport CO₂e uses destination cargo mass × routed distance × factor from the factor registry. Official reported totals are unchanged.
                </p>
              </div>

            /* ── Node telemetry inspector ──────────────────────────────────────── */
            ) : selectedSupplier ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge tier={selectedSupplier.tier} size="sm" />
                    <Badge risk={selectedSupplier.carbon_risk} size="sm" />
                  </div>
                  <h3 className="font-heading mt-2 text-xl font-bold text-[#1B3A2D]">
                    {selectedSupplier.name}
                  </h3>
                  <p className="mt-1 text-xs font-mono-data text-stone-500">
                    {selectedSupplier.supplier_id}
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border border-[#E1DFDA] bg-[#F7F5F0] p-4 text-xs font-mono-data">
                  {[
                    { label: 'Latitude', value: selectedSupplier.latitude.toFixed(4) },
                    { label: 'Longitude', value: selectedSupplier.longitude.toFixed(4) },
                    { label: 'Total emissions', value: tonnesLabel(selectedSupplier.total_co2e_kg) },
                    { label: 'Carbon risk', value: selectedSupplier.carbon_risk.toUpperCase() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-stone-500">{label}:</span>
                      <span className="font-semibold text-[#1B3A2D]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-stone-500">
                Click any marker on the map to inspect telemetry.
              </p>
            )}
          </div>

          {/* ── Footer actions ─────────────────────────────────────────────────── */}
          {showRouteInspector && toSupplier ? (
            <div className="space-y-2 border-t border-[#E1DFDA] pt-4">
              <button
                type="button"
                onClick={clearRoute}
                className="w-full rounded-md border border-[#E1DFDA] py-2 text-xs font-sans font-medium text-[#1B3A2D] hover:bg-[#F7F5F0]"
              >
                Clear route overlay
              </button>
              <button
                type="button"
                onClick={() => navigate(`/app/suppliers/${toSupplier.supplier_id}`)}
                className="flex w-full items-center justify-center space-x-1 rounded-md bg-[#1B3A2D] py-2 text-xs font-sans font-medium text-[#F7F5F0] hover:bg-[#12281F]"
              >
                <span>Open Destination Profile</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : selectedSupplier ? (
            <div className="border-t border-[#E1DFDA] pt-4">
              <button
                type="button"
                onClick={() => navigate(`/app/suppliers/${selectedSupplier.supplier_id}`)}
                className="flex w-full items-center justify-center space-x-1 rounded-md bg-[#1B3A2D] py-2 text-xs font-sans font-medium text-[#F7F5F0] hover:bg-[#12281F]"
              >
                <span>Open Full Supplier Profile</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Inline marker sub-components (no DOM imperative, rendered by React) ─────

const RedPinMarker: React.FC = () => (
  <div
    style={{
      width:  '28px',
      height: '36px',
      filter: 'drop-shadow(0 3px 8px rgba(196,91,74,0.55))',
      cursor: 'pointer',
    }}
  >
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#C45B4A"
      />
      <circle cx="14" cy="14" r="6" fill="white" opacity="0.95" />
    </svg>
  </div>
);

const DotMarker: React.FC<{ fill: string; glow: string; selected: boolean }> = ({
  fill,
  glow,
  selected,
}) => {
  const [hovered, setHovered] = useState(false);
  const size = selected ? 22 : 16;
  return (
    <div
      style={{
        width:       `${size}px`,
        height:      `${size}px`,
        borderRadius: '50%',
        background:  fill,
        border:      '2.5px solid white',
        boxShadow:   `0 0 0 ${selected ? 4 : 2}px rgba(255,255,255,0.96),
                      0 0 0 ${selected ? 7 : 4}px ${glow},
                      0 2px 6px rgba(27,58,45,0.34)`,
        cursor:      'pointer',
        transform:   hovered ? 'scale(1.25)' : 'scale(1)',
        transition:  'transform 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
};
