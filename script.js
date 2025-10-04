// Initialize map
var map = L.map("map").setView([20, 0], 2); // Global view

// Add base layer
/*
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

L.tileLayer(
	"https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png",
	{
		attribution:
			'&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/">CARTO</a>',
		subdomains: "abcd",
		maxZoom: 20,
	}
).addTo(map);
*/

// Base dark gray background
L.tileLayer(
	"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
	{
		attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
		maxZoom: 16,
	}
).addTo(map);

// Reference labels (adds city/place names in color)
L.tileLayer(
	"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
	{
		attribution: "Tiles &copy; Esri &mdash; Esri",
		maxZoom: 16,
	}
).addTo(map);

// Store last chosen location
let impactLatLng = null;

// Keep an array of impact circles so we can remove them later
const impactCircles = [];

// When user clicks the map, store the location and update input boxes
map.on("click", function (e) {
	impactLatLng = e.latlng;
	document.getElementById("lat").value = e.latlng.lat.toFixed(4);
	document.getElementById("lng").value = e.latlng.lng.toFixed(4);
});

// Simulate button
document.getElementById("simulateBtn").addEventListener("click", function () {
	const mass = parseFloat(document.getElementById("mass").value); // kg
	const velocity = parseFloat(document.getElementById("velocity").value); // km/s
	let lat = parseFloat(document.getElementById("lat").value);
	let lng = parseFloat(document.getElementById("lng").value);

	// If map was clicked, override lat/lng with that
	if (impactLatLng) {
		lat = impactLatLng.lat;
		lng = impactLatLng.lng;
	}

	if (isNaN(lat) || isNaN(lng)) {
		alert("Click on the map or enter coordinates first!");
		return;
	}

	// A very crude radius formula (just for demo)
	const energy = 0.5 * mass * Math.pow(velocity, 2);
	const Wtnt = energy / 4184000;
	const radius = 58.6 * Math.pow(Wtnt, 0.333);
	console.log(radius);

	// Draw circle
	const circle = L.circle([lat, lng], {
		radius: radius,
		color: "red",
		fillColor: "#f03",
		fillOpacity: 0.4,
	}).addTo(map).bindPopup(`
      <b>Meteor Impact</b><br>
      Mass: ${mass} kg<br>
      Velocity: ${velocity} km/s<br>
      Radius: ${Math.round(radius)} m
    `);

	// Store the circle reference so we can remove later
	impactCircles.push(circle);
});

// Remove all impacts button
document.getElementById("removeBtn").addEventListener("click", function () {
	impactCircles.forEach((c) => map.removeLayer(c));
	impactCircles.length = 0; // clear the array
});


// Assume density in kg/m³ for estimating mass
const DEFAULT_DENSITY = 3000; // stony asteroid

// Preset asteroids with diameter (m) and velocity (km/s)
const asteroids = [
  {
    spk: '99942',
    name: 'Apophis',
    diameter: 370,
    velocity: 7.4, // km/s
    density: 3000
  },
  {
    spk: '2000433',
    name: 'Eros',
    diameter: 34400, // m (34.4 km)
    velocity: 5.9, // km/s
    density: 2700
  },
  {
    spk: '101955',
    name: 'Bennu',
    diameter: 492,
    velocity: 12, // km/s
    density: 1200
  },
  {
  spk: '25143',
  name: 'Itokawa',
  diameter: 535, // meters
  velocity: 6.1, // km/s
  density: 1900 // kg/m³
},
{
  spk: '162173',
  name: 'Ryugu',
  diameter: 900, // meters
  velocity: 5.0, // km/s
  density: 1300 // kg/m³
},
{
  spk: '243',
  name: 'Ida',
  diameter: 15000, // meters
  velocity: 5.3, // km/s
  density: 2600 // kg/m³
},
{
  spk: '3122',
  name: 'Florence',
  diameter: 4400, // meters
  velocity: 13.3, // km/s
  density: 2700 // kg/m³
},
{
  spk: '52768',
  name: '1998 OR2',
  diameter: 2800, // meters
  velocity: 7.1, // km/s
  density: 2500 // kg/m³
}
];

const select = document.getElementById('asteroidSelect');
const dataDiv = document.getElementById('asteroidData');

// Function to calculate mass from diameter and density
function calculateMass(diameter, density) {
  const radius = diameter / 2;
  return (4 / 3) * Math.PI * Math.pow(radius, 3) * density; // in kg
}

// Function to calculate kinetic energy (Joules)
function calculateKE(mass, velocity) {
  return 0.5 * mass * Math.pow(velocity * 1000, 2); // velocity converted to m/s
}

// Populate dropdown
asteroids.forEach(a => {
  const option = document.createElement('option');
  option.value = a.spk;
  option.textContent = a.name;
  select.appendChild(option);
});

// Show asteroid data when selected
select.addEventListener('change', () => {
  const selectedSpk = select.value;
  if (!selectedSpk) {
    dataDiv.innerHTML = '';
    return;
  }

  const asteroid = asteroids.find(a => a.spk === selectedSpk);
  const mass = calculateMass(asteroid.diameter, asteroid.density);
  const ke = calculateKE(mass, asteroid.velocity);

  dataDiv.innerHTML = `
        <h2>${asteroid.name}</h2>
        <p><strong>Diameter:</strong> ${asteroid.diameter} meters</p>
        <p><strong>Velocity:</strong> ${asteroid.velocity} km/s</p>
        <p><strong>Estimated Mass:</strong> ${mass.toExponential(2)} kg</p>
        <p><strong>Estimated Kinetic Energy:</strong> ${ke.toExponential(2)} Joules</p>
      `;
});

// drawing provided asteroid circles

document.getElementById('addImpactBtn').addEventListener('click', () => {
      if (!selectedAsteroid) {
        alert("Please select an asteroid first!");
        return;
      }
      const lat = parseFloat(document.getElementById('latInput').value);
      const lng = parseFloat(document.getElementById('lngInput').value);
      if (isNaN(lat) || isNaN(lng)) {
        alert("Please enter valid latitude and longitude!");
        return;
      }

      const mass = calculateMass(selectedAsteroid.diameter, selectedAsteroid.density);
      const velocity = selectedAsteroid.velocity * 1000; // m/s
      const energy = 0.5 * mass * Math.pow(velocity, 2);
      const Wtnt = energy / 4184000;
      const radius = 58.6 * Math.pow(Wtnt, 0.333); // crude radius formula in meters

      // Draw circle
      const circle = L.circle([lat, lng], {
        radius: radius,
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.4,
      }).addTo(map).bindPopup(`
        <b>Meteor Impact</b><br>
        Asteroid: ${selectedAsteroid.name}<br>
        Mass: ${mass.toExponential(2)} kg<br>
        Velocity: ${selectedAsteroid.velocity} km/s<br>
        Radius: ${Math.round(radius)} m
      `);

      impactCircles.push(circle);
    });

    document.getElementById('removeBtn').addEventListener('click', () => {
      impactCircles.forEach(c => map.removeLayer(c));
      impactCircles.length = 0;
    });