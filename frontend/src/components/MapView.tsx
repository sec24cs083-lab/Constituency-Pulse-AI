import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import type { Ward, HotspotCluster } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  water: '#06b6d4',
  roads: '#8b5cf6',
  health: '#f43f5e',
  education: '#f59e0b',
  sanitation: '#10b981',
  electricity: '#fbbf24',
  housing: '#a78bfa',
  other: '#94a3b8',
};

const SEVERITY_RADIUS: Record<string, number> = {
  high: 22,
  medium: 16,
  low: 10,
};

interface Props {
  wards: Ward[];
  clusters: HotspotCluster[];
  height?: number | string;
}

export default function MapView({ wards, clusters, height = 420 }: Props) {
  const center: [number, number] = [18.520, 73.875];

  return (
    <div style={{ height, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {/* Ward boundaries */}
        {wards.map(ward => {
          if (!ward.boundary_geojson) return null;
          const intensity = ward.heatmap?.heat_intensity ?? 0;
          return (
            <GeoJSON
              key={ward.id}
              data={{ type: 'Feature', geometry: ward.boundary_geojson, properties: {} } as any}
              style={{
                color: '#4f8ef7',
                weight: 1.5,
                fillColor: `hsl(220, 80%, ${30 + intensity * 30}%)`,
                fillOpacity: 0.2 + intensity * 0.3,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'Inter', fontSize: 12 }}>
                  <strong>{ward.name}</strong><br />
                  Pop: {ward.population?.toLocaleString()}<br />
                  Complaints: {ward.heatmap?.complaint_count ?? 0}
                </div>
              </Tooltip>
            </GeoJSON>
          );
        })}

        {/* Hotspot clusters */}
        {clusters.map(cluster => (
          <CircleMarker
            key={cluster.cluster_id}
            center={[cluster.center_lat, cluster.center_lng]}
            radius={SEVERITY_RADIUS[cluster.severity] || 14}
            pathOptions={{
              color: CATEGORY_COLORS[cluster.dominant_category] || '#94a3b8',
              fillColor: CATEGORY_COLORS[cluster.dominant_category] || '#94a3b8',
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter', fontSize: 12, minWidth: 160 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, textTransform: 'capitalize' }}>
                  🔥 {cluster.dominant_category} Hotspot
                </div>
                <div><b>{cluster.complaint_count}</b> complaints in cluster</div>
                <div style={{ color: '#888', marginTop: 4 }}>Severity: {cluster.severity}</div>
                <div style={{ color: '#888' }}>Algorithm: DBSCAN</div>
              </div>
            </Popup>
            <Tooltip>
              <span>{cluster.dominant_category} hotspot · {cluster.complaint_count} complaints</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Ward center markers */}
        {wards.map(ward => (
          ward.lat && ward.lng ? (
            <CircleMarker
              key={`ward-${ward.id}`}
              center={[ward.lat, ward.lng]}
              radius={4}
              pathOptions={{ color: '#4f8ef7', fillColor: '#4f8ef7', fillOpacity: 0.9, weight: 1 }}
            >
              <Tooltip permanent={false}>{ward.name}</Tooltip>
            </CircleMarker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
