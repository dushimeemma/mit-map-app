import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from '@chakra-ui/react';
import {
  Autocomplete,
  DirectionsRenderer,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { useState, useRef, useEffect } from 'react';
import { FaLocationArrow, FaTimes } from 'react-icons/fa';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: -1.8898,
  lng: 30.0634,
};

function Map() {
  const MAP_API_KEY: string = import.meta.env.VITE_MAP_API_KEY;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: MAP_API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState<any>(null);
  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [distance, setDistance] = useState<any>('');
  const [duration, setDuration] = useState<any>('');
  const [markerPosition, setMarkerPosition] = useState<any>(null);
  const [, setDistanceTraveled] = useState<any>(0);

  const markerRef = useRef<any>();
  const originRef = useRef<any>();
  const destinationRef = useRef<any>();

  useEffect(() => {
    if (!directionsResponse) return;
    const route = directionsResponse.routes[0].legs[0];
    const steps = route.steps;
    const totalDistance = route.distance.value;
    let distanceCovered = 0;
    let stepIndex = 0;

    const intervalId = setInterval(() => {
      if (distanceCovered >= totalDistance) {
        clearInterval(intervalId);
        return;
      }
      const step = steps[stepIndex];
      const stepDistance = step.distance.value;
      const stepRatio = distanceCovered / totalDistance;

      const nextStepDistance = stepDistance * (1 - stepRatio);

      const latDelta =
        (step.end_location.lat() - step.start_location.lat()) * stepRatio;
      const lngDelta =
        (step.end_location.lng() - step.start_location.lng()) * stepRatio;
      const newLat = step.start_location.lat() + latDelta;
      const newLng = step.start_location.lng() + lngDelta;

      const newPosition = { lat: newLat, lng: newLng };

      setMarkerPosition(newPosition);
      setDistanceTraveled(distanceCovered);

      distanceCovered += nextStepDistance;

      if (distanceCovered >= stepDistance) {
        distanceCovered -= stepDistance;
        stepIndex++;
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [directionsResponse]);

  async function calculateRoute() {
    if (
      originRef.current!.value === '' ||
      destinationRef.current!.value === ''
    ) {
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current!.value,
      destination: destinationRef.current!.value,

      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance!.text);
    setDuration(results.routes[0].legs[0].duration!.text);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance('');
    setDuration('');
    originRef.current!.value = '';
    destinationRef.current!.value = '';
  }

  if (!isLoaded) {
    return <SkeletonText />;
  }

  return (
    <Flex
      position='relative'
      flexDirection='column'
      alignItems='center'
      h='100vh'
      w='100vw'
    >
      <Box position='absolute' left={0} top={0} h='100%' w='100%'>
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={containerStyle}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => setMap(map)}
        >
          <Marker position={center} />
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
          {markerPosition && (
            <Marker position={markerPosition} ref={markerRef} />
          )}
        </GoogleMap>
      </Box>
      <Box
        p={4}
        borderRadius='lg'
        m={4}
        bgColor='white'
        shadow='base'
        minW='container.md'
        zIndex='1'
      >
        <HStack spacing={2} justifyContent='space-between'>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input type='text' placeholder='Origin' ref={originRef} />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input
                type='text'
                placeholder='Destination'
                ref={destinationRef}
              />
            </Autocomplete>
          </Box>

          <ButtonGroup>
            <Button colorScheme='pink' type='submit' onClick={calculateRoute}>
              Calculate Route
            </Button>
            <IconButton
              aria-label='center back'
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent='space-between'>
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <IconButton
            aria-label='center back'
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map.panTo(center);
              map.setZoom(15);
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
}

export default Map;
