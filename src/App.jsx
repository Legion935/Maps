import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import styled from 'styled-components';
import polyline from 'polyline';
import { createGlobalStyle } from "styled-components";

const center = [19.3906594, -99.3084261];
const API_KEY = "5b3ce3597851110001cf6248287a589eb7ef420e9da9e17392b88fb8";
const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";
const GEOCODE_URL = "https://api.openrouteservice.org/geocode/search";


const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    width: 100%;
    min-height: 100vh;
    background-color: #2E3440; 
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Arial', sans-serif;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #3B4252;
  width: 80rem;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  gap: 1rem;

  @media (max-width: 768px) {
    width: 88%;
  }
`;



const Titulo = styled.h1`
  font-size: 32px;
  border-bottom: 2px solid #E5E9F0;
  width: 100%;
  text-align: center;
  color:#E5E9F0;
  padding-bottom: 10px;
`;

const Input = styled.input`
  width: 100%;
  max-width: 900px;
  padding: 12px;
  font-size: 18px;
  border: 2px solid #ccc;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;

  @media (max-width: 768px) {
    font-size: 16px;
    padding: 10px;
  }
`;

const Button = styled.button`
  width: 100%;
  max-width: 500px;
  padding: 12px;
  background-color: #5E81AC;
  color: white;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
  text-align: center;

  &:hover {
    background-color: #9d00ff7b;
  }

  @media (max-width: 768px) {
    font-size: 16px;
    max-width: 200px;
  }
`;

const ButtonClean = styled(Button)`
  background-color: #5E81AC;

  &:hover {
    background-color: #b30000;
  }
`;

const MapWrapper = styled.div`
  width: 80rem;
  height: 500px;
  max-width: 900px;
  border-radius: 10px;
  overflow: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    height: 400px;
    width: 95%;
  }
`;

const InformationWrapper = styled.div`
  margin-top: 20px;
  background-color: black;
  padding: 20px;
  border-radius: 8px;
  color: white;
  width: 100%;
  max-width: 900px;
  text-align: left;
  
  ul {
    margin-top: 10px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 5px;
  }

  @media (max-width: 768px) {
    width: 95%;
    padding: 15px;
  }
`;



const App = () => {
  const [route, setRoute] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [markers, setMarkers] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  

  const markerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [30, 48],
    iconAnchor: [15, 48],
    popupAnchor: [0, -48]
  });

  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(GEOCODE_URL, {
        params: { api_key: API_KEY, text: address }
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
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
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
            [originCoords[1], originCoords[0]], // Asegúrate de que las coordenadas estén en el formato [longitud, latitud]
            [destinationCoords[1], destinationCoords[0]]
          ],
          instructions: true,
          
          profile:"driving-car"
        },
        { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } }
      );
  
      const routeData = response.data.routes[0];
      const decodedRoute = polyline.decode(routeData.geometry);
      const coordinates = decodedRoute.map(coord => [coord[0], coord[1]]);
      setRoute(coordinates);
  
      const instructions = routeData.segments.flatMap(segment =>
        segment.steps.map(step => step.instruction)
      );
  
      setRouteInfo({
        distance: (routeData.summary.distance / 1000).toFixed(2),
        duration: formatDuration(routeData.summary.duration),
        instructions
      });
    } catch (error) {
      console.error("Error al calcular la ruta:", error);
    }
  };
  


  return (
    <>
    <GlobalStyle />
    <Container>
      <Titulo>Calcula tu Ruta:</Titulo>
      <Input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Origen" />
      <Input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destino" />
      <Button onClick={calculateRoute}>Calcular Ruta</Button>
      <ButtonClean onClick={handleClear}>Limpiar</ButtonClean>
      <MapWrapper>
        <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {markers.map((pos, index) => <Marker key={index} position={pos} icon={markerIcon} />)}
          {route.length > 0 && <Polyline positions={route} color="blue" />}
        </MapContainer>
      </MapWrapper>
      {routeInfo && (
        <InformationWrapper>
          <p><strong>Distancia:</strong> {routeInfo.distance} km</p>
          <p><strong>Duración:</strong> {routeInfo.duration}</p>
          <p><strong>Instrucciones:</strong></p>
          <ul>
            {routeInfo.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </InformationWrapper>
      )}

    </Container>
    </>
  );
};

export default App;
