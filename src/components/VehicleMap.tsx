import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { usePositionStore } from '../store/positionStore'
import { VEHICLE_COLORS } from '../constants/vehicles'

function createColoredIcon(color: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  })
}

export function VehicleMap() {
  const positions = usePositionStore((s) => s.positions)

  return (
    <MapContainer
      center={[35.1815, 136.9066]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {Array.from(positions.values()).map((pos) => (
        <Marker
          key={pos.vehicleId}
          position={[pos.lat, pos.lng]}
          icon={createColoredIcon(VEHICLE_COLORS[pos.vehicleId] ?? '#6B7280')}
        >
          <Popup>{pos.vehicleId}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
