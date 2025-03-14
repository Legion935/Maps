import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import styled from 'styled-components';
import polyline from 'polyline';

const center = [19.3906594,-99.3084261]; // Coordenadas iniciales (CDMX)
const API_KEY = "5b3ce3597851110001cf6248287a589eb7ef420e9da9e17392b88fb8"; // Reemplaza con tu clave de OpenRouteService
const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";
const GEOCODE_URL = "https://api.openrouteservice.org/geocode/search";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width:100%;
  align-items: center;
  gap: 1rem;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  @media (max-width: 800px) {
    width:99vw;
  }
`;
const Titulo = styled.h1`
  font-size:30px;
  border-bottom: 2px solid white;
  width:90%;
  text-align:center;

`;
const Label = styled.label`
  font-size:20px;


`;
const Caja = styled.div`
  display: flex;
  flex-direction: column;
  width:93vw;
  align-items:center;
  @media (max-width: 800px) {
    width:99vw;
  }
`;


const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 65%;
  @media (max-width: 800px) {
    width:90%;
  }
  
`;
const LabelInput = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 2px solid #ccc;
  border-radius: 5px;
  outline: none;
  width: 100%; 
  box-sizing: border-box; /* Asegura que el padding no afecte el ancho */
`;

const ButtonDiv = styled.div`
  display: flex;
  flex-direction: Row;
  gap: 10px;
  width: 100%;
  margin-bottom: 15px;
`;
const Button = styled.button`
  padding: 10px;
  background-color: #007bff;
  width:50%;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;

  &:hover {
    background-color: #0056b3;
  }
`;
const ButtonClean = styled.button`
  padding: 10px;
  background-color: #ff0000;
  color: white;
  font-size: 16px;
  width:50%;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;

  &:hover {
    background-color: #b30000ad;
  }
`;
const MapWrapper = styled.div`
  width: 100%;
  height: 500px;
  max-width: 900px;
  border-radius: 10px;
  overflow: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);

  @media (max-width: 600px) {
    height: 400px;
  }
`;

const InformationWrapper = styled.div`
  margin-top: 20px;
  background-color: black;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 93%;
  
`;

const App = () => {
  const [route, setRoute] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [markers, setMarkers] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null); // Estado para guardar la información de la ruta

  const markerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [30, 48],  // Tamaño ligeramente mayor del icono (ancho, alto)
  iconAnchor: [15, 48], // Ajustamos el anclaje del icono a la mitad del icono
  popupAnchor: [0, -48] // Ajustamos el anclaje del popup
  });

  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(GEOCODE_URL, {
        params: {
          api_key: API_KEY,
          text: address
        }
      });
      if (response.data.features.length > 0) {
        return response.data.features[0].geometry.coordinates.reverse();
      }
    } catch (error) {
      console.error("Error obteniendo coordenadas:", error);
    }
    return null;
  };
  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setRoute([]);
    setMarkers([]);
    setRouteInfo(null);
  };
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };



  const calculateRoute = async () => {
    if (!origin || !destination) return;

    const originCoords = await getCoordinates(origin);
    const destinationCoords = await getCoordinates(destination);

    if (!originCoords || !destinationCoords) {
      console.error("No se pudieron obtener las coordenadas.");
      return;
    }

    setMarkers([originCoords, destinationCoords]);

    try {
      const response = await axios.post(
        ORS_URL,
        {
          coordinates: [
            [originCoords[1], originCoords[0]], // [lon, lat]
            [destinationCoords[1], destinationCoords[0]]
          ],
          "elevation": false,  // Desactiva elevación para evitar datos innecesarios
          "instructions": true,  // Activa instrucciones, lo que suele dividir en más segmentos
          "maneuvers": true,  // Incluye maniobras detalladas en la respuesta
        },
        {
          headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }
        }
      );

      console.log("Respuesta completa de la API:", response.data);
      console.log("Datos de la ruta:", response.data);
      console.log("Segmentos detallados:", response.data.routes[0].segments);

      // Acceso correcto a las rutas
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0]; // La primera ruta
        console.log("Ruta recibida:", route);

        // Decodificar la polyline en coordenadas
        if (route.geometry) {
          const decodedRoute = polyline.decode(route.geometry); // Decodifica la polyline
          const coordinates = decodedRoute.map(coord => [coord[0], coord[1]]); // [lat, lon]
          setRoute(coordinates);

          // Obtener y mostrar más información de la ruta
          const routeDetails = {
            distance: route.summary.distance, // Distancia en metros
            duration: route.summary.duration, // Duración en segundos
            segments: route.segments.map(segment => ({
              distance: segment.distance, // Distancia del segmento en metros
              duration: segment.duration, // Duración del segmento en segundos
            }))
          };

          setRouteInfo(routeDetails); // Guardamos la información en el estado
        } else {
          console.error("La ruta no tiene geometría o coordenadas válidas.");
        }
      } else {
        console.error("No se recibieron rutas válidas:", response.data);
      }
    } catch (error) {
      if (error.response) {
        console.error("Código de estado del error:", error.response.status);
        console.error("Datos del error:", error.response.data);
      } else {
        console.error("Error:", error.message);
      }
    }
  };

  return (
    <Container>
      <Caja>
        <Titulo>MAPS</Titulo>
        <Controls>
          <LabelInput>
            <Label>Origen: </Label>
            <Input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Uruapan"
            />
          </LabelInput>
          <LabelInput>
            <Label>Destino: </Label>
            <Input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="New York"
            />
          </LabelInput>
          <ButtonDiv>
            <Button onClick={calculateRoute}>Calcular Ruta</Button>
            <ButtonClean onClick={handleClear}>Limpiar</ButtonClean>
          </ButtonDiv>
        </Controls>

        <MapWrapper>
          <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markers.map((pos, index) => (
              <Marker key={index} position={pos} icon={markerIcon}/>
            ))}
            {route.length > 0 && <Polyline positions={route} color="blue" />}
          </MapContainer>
        </MapWrapper>
      </Caja>
      {/* Mostrar la información de la ruta si está disponible */}
      {routeInfo && (
        <InformationWrapper>
          <h3>Información de la Ruta</h3>
          <p><strong>Distancia Total:</strong> {(routeInfo.distance / 1000).toFixed(2)} km</p>
          <p><strong>Duración Total:</strong> {formatDuration(routeInfo.duration)}</p>

          <h4>Segmentos:</h4>
          <ul>
            {routeInfo.segments.map((segment, index) => (
              <li key={index}>
                <strong>Distancia Segmento:</strong> {(segment.distance / 1000).toFixed(2)} km |
                <strong>Duración Segmento:</strong> {formatDuration(segment.duration)}
              </li>
            ))}
          </ul>
        </InformationWrapper>
      )}
    </Container>
  );
};

export default App;
