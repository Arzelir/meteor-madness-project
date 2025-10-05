// ----------------------------
// Map Initialization
// ----------------------------
const map = L.map("map").setView([20, 0], 2);

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
// Calculations
// ----------------------------
function calculateMass(diameter, density) {
	const radius = diameter / 2;
	return (4 / 3) * Math.PI * Math.pow(radius, 3) * density;
}

function calculateImpactRadius(mass, velocity) {
	const energy = 0.5 * mass * Math.pow(velocity * 1000, 2);
	const Wtnt = energy / 4184000;
	return 58.6 * Math.pow(Wtnt, 0.333);
}

// ----------------------------
// Map / Drawing
// ----------------------------
let impactCircles = [];
let impactLatLng = null;

function drawImpactCircle(lat, lng, radius, asteroidName, mass, velocity) {
	const circle = L.circle([lat, lng], {
		radius: radius,
		color: "red",
		fillColor: "#f03",
		fillOpacity: 0.4,
	}).addTo(map).bindPopup(`
    <b>Meteor Impact</b><br>
    Asteroid: ${asteroidName}<br>
    Mass: ${mass.toExponential(2)} kg<br>
    Velocity: ${velocity} km/s<br>
    Radius: ${Math.round(radius)} m
  `);
	impactCircles.push(circle);
}

function clearImpacts() {
	impactCircles.forEach((c) => map.removeLayer(c));
	impactCircles = [];
}

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

// Display asteroid data
function displayAsteroidData(asteroid) {
	const mass = calculateMass(asteroid.diameter, asteroid.density);
	const radius = calculateImpactRadius(mass, asteroid.velocity);
	dataDiv.innerHTML = `
    <h2>${asteroid.name}</h2>
    <p><strong>Diameter:</strong> ${asteroid.diameter} meters</p>
    <p><strong>Velocity:</strong> ${asteroid.velocity} km/s</p>
    <p><strong>Estimated Mass:</strong> ${mass.toExponential(2)} kg</p>
    <p><strong>Impact Radius (crude):</strong> ${Math.round(radius)} m</p>
  `;
}

// Dropdown change
select.addEventListener("change", () => {
	selectedAsteroid = asteroids.find((a) => a.spk === select.value);
	if (selectedAsteroid) displayAsteroidData(selectedAsteroid);
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
		velocity = selectedAsteroid.velocity;
	} else {
		// Use user inputs
		mass = parseFloat(document.getElementById("mass").value);
		velocity = parseFloat(document.getElementById("velocity").value);
		if (isNaN(mass) || isNaN(velocity))
			return alert("Please enter valid mass and velocity!");
	}

	const radius = calculateImpactRadius(mass, velocity);

	// Use asteroid name if selected, else "Custom"
	const asteroidName = selectedAsteroid ? selectedAsteroid.name : "Custom";

	drawImpactCircle(lat, lng, radius, asteroidName, mass, velocity);
});

// ----------------------------
// Remove Button
// ----------------------------
document.getElementById("removeBtn").addEventListener("click", clearImpacts);
