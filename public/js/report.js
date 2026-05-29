const issueForm = document.getElementById("issueForm");

if(issueForm){

issueForm.addEventListener("submit", async (e)=>{

e.preventDefault();

const token = localStorage.getItem("token");
const isLoggedIn = localStorage.getItem("isLoggedIn");
const user = localStorage.getItem("user");

console.log("🔐 Authentication Check:");
console.log(`   isLoggedIn: ${isLoggedIn}`);
console.log(`   token: ${token ? token.substring(0, 20) + "..." : "NOT FOUND"}`);
console.log(`   user: ${user}`);

if (!token) {
  alert("❌ Error: You are not logged in. Please login first.");
  window.location.href = "/login";
  return;
}

const formData = new FormData(issueForm);

// Log exact coordinates being submitted
const latitude = formData.get("latitude");
const longitude = formData.get("longitude");
const issueType = formData.get("issueType");
const description = formData.get("description");
const priority = formData.get("priority");

console.log("📍 Submitting Issue with Exact Coordinates:");
console.log(`   Latitude: ${latitude}`);
console.log(`   Longitude: ${longitude}`);
console.log(`   Type: ${issueType}`);
console.log(`   Description: ${description}`);
console.log(`   Priority: ${priority}`);

try {
  const res = await fetch("http://localhost:5000/api/issues/report",{
    method:"POST",
    headers:{
      Authorization:`Bearer ${token}`
    },
    body: formData
  });

  console.log(`Response Status: ${res.status}`);
  console.log(`Response OK: ${res.ok}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({message: "Unknown error"}));
    const errorMsg = `Server error: ${res.status} - ${errorData.message || errorData.error}`;
    
    // If user not found (404), redirect to login
    if (res.status === 404 && (errorMsg.includes('User not found') || errorData.error === 'User not found')) {
      alert("⚠️ Your session has expired or user not found. Please login again.");
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    
    throw new Error(errorMsg);
  }

  const result = await res.json();
  
  console.log("✅ Issue submitted successfully:", result);
  
  if (result.ticketId) {
    alert("✅ Ticket Generated: " + result.ticketId + "\n\n📍 Coordinates: " + latitude + ", " + longitude + "\n\n🚀 Redirecting to Dashboard in 2 seconds...");
    issueForm.reset();
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 2000);
  } else {
    alert("Error: " + (result.message || "Failed to report issue"));
  }
} catch (error) {
  console.error("❌ Error reporting issue:", error);
  alert("Error: " + error.message);
}

});

}

/* ---------- Get Real-Time Location using HTML5 Geolocation API ---------- */
/* FREE API - Built-in to all modern browsers, no API key required */

function getUserCurrentLocation() {
  const btn = document.getElementById("geoLocationBtn");
  const statusDiv = document.getElementById("locationStatus");
  const statusText = document.getElementById("statusText");
  const latInput = document.querySelector("input[name='latitude']");
  const lonInput = document.querySelector("input[name='longitude']");
  
  if (!navigator.geolocation) {
    showStatus("❌ Geolocation not supported in your browser", "error");
    return;
  }
  
  // Show loading state
  btn.disabled = true;
  btn.textContent = "📍 Getting Location...";
  showStatus("🔄 Requesting GPS location...", "loading");
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      console.log("✅ GPS Location Captured:");
      console.log(`   Latitude: ${latitude}`);
      console.log(`   Longitude: ${longitude}`);
      console.log(`   Accuracy: ±${accuracy.toFixed(0)} meters`);
      
      // Populate coordinate fields
      latInput.value = latitude;
      lonInput.value = longitude;
      latInput.style.backgroundColor = "#e8f5e9";
      lonInput.style.backgroundColor = "#e8f5e9";
      
      showStatus(`✅ Location captured! Accuracy: ±${accuracy.toFixed(0)}m`, "success");
      btn.disabled = false;
      btn.textContent = "📍 Get My Current Location";
    },
    (error) => {
      let errorMsg = "";
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "❌ Location permission denied. Enable location in browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "❌ Location information unavailable. Try moving outdoors.";
          break;
        case error.TIMEOUT:
          errorMsg = "❌ Location request timed out. Try again.";
          break;
        default:
          errorMsg = "❌ Error getting location: " + error.message;
      }
      
      console.error("Geolocation Error:", errorMsg);
      showStatus(errorMsg, "error");
      btn.disabled = false;
      btn.textContent = "📍 Get My Current Location";
    },
    {
      enableHighAccuracy: true,  // Request high accuracy (uses GPS)
      timeout: 10000,              // Wait max 10 seconds
      maximumAge: 0                // Don't use cached location
    }
  );
}

function showStatus(message, type) {
  const statusDiv = document.getElementById("locationStatus");
  const statusText = document.getElementById("statusText");
  
  statusText.textContent = message;
  statusDiv.style.display = "block";
  
  if (type === "success") {
    statusDiv.style.backgroundColor = "#e8f5e9";
    statusDiv.style.color = "#2e7d32";
    statusDiv.style.borderLeft = "4px solid #4caf50";
  } else if (type === "error") {
    statusDiv.style.backgroundColor = "#ffebee";
    statusDiv.style.color = "#c62828";
    statusDiv.style.borderLeft = "4px solid #f44336";
  } else if (type === "loading") {
    statusDiv.style.backgroundColor = "#e3f2fd";
    statusDiv.style.color = "#1565c0";
    statusDiv.style.borderLeft = "4px solid #2196f3";
  }
}