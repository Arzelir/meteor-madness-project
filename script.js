// Initialize map
var map = L.map('map').setView([20, 0], 2); // Global view

// Add base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Store last chosen location
let impactLatLng = null;

// Keep an array of impact circles so we can remove them later
const impactCircles = [];

// When user clicks the map, store the location and update input boxes
map.on('click', function (e) {
  impactLatLng = e.latlng;
  document.getElementById('lat').value = e.latlng.lat.toFixed(4);
  document.getElementById('lng').value = e.latlng.lng.toFixed(4);
});

// Simulate button
document.getElementById('simulateBtn').addEventListener('click', function() {
  const mass = parseFloat(document.getElementById('mass').value); // kg
  const velocity = parseFloat(document.getElementById('velocity').value); // km/s
  let lat = parseFloat(document.getElementById('lat').value);
  let lng = parseFloat(document.getElementById('lng').value);

  // If map was clicked, override lat/lng with that
  if (impactLatLng) {
    lat = impactLatLng.lat;
    lng = impactLatLng.lng;
  }

  if (isNaN(lat) || isNaN(lng)) {
    alert('Click on the map or enter coordinates first!');
    return;
  }

  // A very crude radius formula (just for demo)
  const energy = 0.5*mass*Math.pow(velocity, 2);
  const Wtnt = energy/(4184000);
  const radius = 58.6 * Math.pow(Wtnt, 0.333);
  console.log(radius);


  // Draw circle
  const circle = L.circle([lat, lng], {
    radius: radius,
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.4
  }).addTo(map)
    .bindPopup(`
      <b>Meteor Impact</b><br>
      Mass: ${mass} kg<br>
      Velocity: ${velocity} km/s<br>
      Radius: ${Math.round(radius)} m
    `);

  // Store the circle reference so we can remove later
  impactCircles.push(circle);
});

// Remove all impacts button
document.getElementById('removeBtn').addEventListener('click', function() {
  impactCircles.forEach(c => map.removeLayer(c));
  impactCircles.length = 0; // clear the array
});
