// ----------------------------
// Map Initialization
// ----------------------------
const map = L.map("map").setView([20, 0], 2);
map.setMaxBounds([
	[-90,-Infinity],
	[90, Infinity]
]);

L.tileLayer(
	"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
	{ attribution: "Tiles &copy; Esri", maxZoom: 16 }
).addTo(map);

L.tileLayer(
	"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
	{ attribution: "Tiles &copy; Esri", maxZoom: 16 }
).addTo(map);

// ----------------------------
// Preset Asteroids
// ----------------------------
const asteroids = [
	{
		spk: "99942",
		name: "Apophis",
		diameter: 370,
		velocity: 7.4,
		density: 3000,
	},
	{
		spk: "2000433",
		name: "Eros",
		diameter: 34400,
		velocity: 5.9,
		density: 2700,
	},
	{ spk: "101955", name: "Bennu", diameter: 492, velocity: 12, density: 1200 },
	{
		spk: "25143",
		name: "Itokawa",
		diameter: 535,
		velocity: 6.1,
		density: 1900,
	},
	{ spk: "162173", name: "Ryugu", diameter: 900, velocity: 5.0, density: 1300 },
	{ spk: "243", name: "Ida", diameter: 15000, velocity: 5.3, density: 2600 },
	{
		spk: "3122",
		name: "Florence",
		diameter: 4400,
		velocity: 13.3,
		density: 2700,
	},
	{
		spk: "52768",
		name: "1998 OR2",
		diameter: 2800,
		velocity: 7.1,
		density: 2500,
	},
];

// ----------------------------
// UI / Interaction
// ----------------------------
const select = document.getElementById("asteroidSelect");
const dataDiv = document.getElementById("asteroidData");
let selectedAsteroid = null;

// Populate dropdown
asteroids.forEach((a) => {
	const option = document.createElement("option");
	option.value = a.spk;
	option.textContent = a.name;
	select.appendChild(option);
});

// ----------------------------
// Live NEOs from NASA API
// ----------------------------
const liveSelect = document.getElementById('liveNEOs');
const apiKey = 'ap5ipjceswy7YvbAyjq6cGn2uZiwhKq98AZmt8qR';
const today = new Date().toISOString().split('T')[0];
const endDate = new Date();
endDate.setDate(endDate.getDate() + 7);
const endStr = endDate.toISOString().split('T')[0];

fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${endStr}&api_key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    // flatten all date arrays into one
    const allNEOs = Object.values(data.near_earth_objects).flat();
    allNEOs.forEach((neo) => {
      const name = neo.name;
      // pick some values for velocity & diameter
      const close = neo.close_approach_data[0];
      const velocity = parseFloat(close.relative_velocity.kilometers_per_second);
      const diameter = (neo.estimated_diameter.meters.estimated_diameter_max +
                        neo.estimated_diameter.meters.estimated_diameter_min) / 2;
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ name, diameter, velocity });
      opt.textContent = `${name} (${velocity.toFixed(1)} km/s)`;
      liveSelect.appendChild(opt);
    });
  })
  .catch(err => console.error(err));

// ----------------------------
// Calculations
// ----------------------------
function calculateMass(diameter, density) {
	const radius = diameter / 2;
	return (4 / 3) * Math.PI * Math.pow(radius, 3) * density;
}

function calculateImpactRadius(mass, velocity) {
	const energy = 0.5 * mass * Math.pow(velocity, 2);
	const Wtnt = energy / 4184000;
	return 22 * Math.pow(Wtnt, 0.33333333);
}

function calculateImpactVelocity(velocity) {
  const velocity_ms = Math.pow(velocity*1000, 2);
  const v_impact = Math.sqrt(velocity_ms + 125440000);
  return v_impact;
}

// ----------------------------
// Map / Drawing
// ----------------------------
let impactCircles = [];
let impactLatLng = null;

function clearImpacts() {
	impactCircles.forEach((c) => map.removeLayer(c));
	impactCircles = [];
	blastLayer.clearLayers();
	seismicLayer.clearLayers();
	tsunamiLayer.clearLayers();
}

// Display asteroid data
function displayAsteroidData(asteroid) {
	const mass = calculateMass(asteroid.diameter, asteroid.density);
  const velocity = calculateImpactVelocity(asteroid.velocity);
	const radius = calculateImpactRadius(mass, velocity);

	document.getElementById("mass").value = mass;
	document.getElementById("velocity").value = velocity;

	dataDiv.innerHTML = `
    <h2>${asteroid.name}</h2>
    <p><strong>Diameter:</strong> ${asteroid.diameter} meters</p>
  `;
}

// Dropdown change
select.addEventListener("change", () => {
	selectedAsteroid = asteroids.find((a) => a.spk === select.value);
	if (selectedAsteroid) displayAsteroidData(selectedAsteroid);
});

// Live NEO dropdown change
liveSelect.addEventListener("change", () => {
  if (!liveSelect.value) return;
  const { name, diameter, velocity } = JSON.parse(liveSelect.value);
  // Build a pseudo-asteroid object with guessed density
  selectedAsteroid = {
    name,
    diameter,
    velocity,
    density: 2000 // guess, since API has no density
  };
  displayAsteroidData(selectedAsteroid);
});


// ----------------------------
// Map Click Handler
// ----------------------------
map.on("click", (e) => {
	impactLatLng = e.latlng;
	document.getElementById("lat").value = impactLatLng.lat.toFixed(4);
	document.getElementById("lng").value = impactLatLng.lng.toFixed(4);
});

// ----------------------------
// Simulate Button
// ----------------------------
// Constants
const f_seismic = 1e-2;
const f_water = 1e-3;

// Layer groups (ensure these are defined somewhere globally)
const blastLayer = L.layerGroup().addTo(map);
const seismicLayer = L.layerGroup().addTo(map);
const tsunamiLayer = L.layerGroup().addTo(map);

// Function to calculate seismic magnitude (same as before)
function seismicMagnitude(E_s) {
    return (Math.log10(E_s) - 4.8) / 1.5;
}

// Function to calculate seismic radius (rough estimate in meters)
function seismicRadius(M) {
    return Math.pow(10, 0.5*M - 1) * 1000;
}

// Function to estimate tsunami distance (simplified)
function tsunamiDistance(E_wave) {
    const rho = 1000; // water density
    const g = 9.81;
    const A = 1e10; // impact area in m^2 (simplified)
    const h = Math.sqrt((2 * E_wave)/(rho*g*A));
    const slope = 0.01; // average slope
    return h / slope; // meters inland
}

// Function to handle drawing the impact circles
function handleImpact(lat, lng, mass, velocity, name) {
    const E_impact = 0.5 * mass * velocity ** 2;
	
    // Seismic circle
    const E_seismic = E_impact * f_seismic;
    const M = seismicMagnitude(E_seismic);
    const seismicR = seismicRadius(M);
    const seismicCircle = L.circle([lat, lng], {
		radius: seismicR,
        color: "orange",
        fillColor: "#ffa500",
        fillOpacity: 0.2,
    }).addTo(seismicLayer).bindPopup(`
        <b>Seismic Impact</b><br>
        Asteroid: ${name}<br>
        Seismic magnitude: ${M.toFixed(2)}<br>
        Seismic radius: ${(seismicR/1000).toFixed(1)} km
    `);
    impactCircles.push(seismicCircle);

	// Blast circle
	const blastR = calculateImpactRadius(mass, velocity);
	const blastCircle = L.circle([lat, lng], {
		radius: blastR,
		color: "red",
		fillColor: "#f03",
		fillOpacity: 0.4,
	}).addTo(blastLayer).bindPopup(`
		<b>Meteor Impact</b><br>
		Asteroid: ${name}<br>
		Mass: ${mass.toExponential(2)} kg<br>
		Velocity: ${(velocity/1000).toFixed(2)} km/s<br>
		Blast radius: ${Math.round(blastR)} m
	`);
	impactCircles.push(blastCircle);

    // Tsunami circle
    const E_wave = E_impact * f_water;
    const tsunamiR = tsunamiDistance(E_wave);
    const tsunamiCircle = L.circle([lat, lng], {
        radius: tsunamiR,
        color: "blue",
        fillColor: "#00f",
        fillOpacity: 0.1,
    }).addTo(tsunamiLayer).bindPopup(`
        <b>Tsunami Estimate</b><br>
        Asteroid: ${name}<br>
        Estimated inundation: ${(tsunamiR/1000).toFixed(1)} km
    `);
    impactCircles.push(tsunamiCircle);
}


// Updated simulate button
document.getElementById("simulateBtn").addEventListener("click", () => {
    // Get coordinates from map click or inputs
    let lat = impactLatLng
        ? impactLatLng.lat
        : parseFloat(document.getElementById("lat").value);
    let lng = impactLatLng
        ? impactLatLng.lng
        : parseFloat(document.getElementById("lng").value);
    if (isNaN(lat) || isNaN(lng)) return alert("Please enter valid coordinates!");

    let mass, velocity;

    if (selectedAsteroid) {
        // Use asteroid info
        mass = calculateMass(selectedAsteroid.diameter, selectedAsteroid.density);
        velocity = calculateImpactVelocity(selectedAsteroid.velocity);
    } else {
        // Use user inputs
        mass = parseFloat(document.getElementById("mass").value);
        velocity = parseFloat(document.getElementById("velocity").value) * 1000;
        if (isNaN(mass) || isNaN(velocity))
            return alert("Please enter valid mass and velocity!");
    }

    const asteroidName = selectedAsteroid ? selectedAsteroid.name : "Custom";

    // Draw the impact without clearing previous layers
    handleImpact(lat, lng, mass, velocity, asteroidName);
});


// ----------------------------
// Remove Button
// ----------------------------

document.getElementById("removeBtn").addEventListener("click", () => {

	clearImpacts();
	const asteroidSelect = document.getElementById("asteroidSelect");
	asteroidSelect.selectedIndex = 0;

	const liveSelect = document.getElementById("liveNEOs");
	liveSelect.selectedIndex = 0;

	selectedAsteroid = null;
	dataDiv.innerHTML = "";

	document.getElementById("lat").value="";
	document.getElementById("lng").value="";

	impactLatLng = null;

	document.getElementById("mass").value="1000";
	document.getElementById("velocity").value="20";

	map.setView([20, 0], 2);

});