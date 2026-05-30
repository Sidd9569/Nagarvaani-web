```javascript
// ==============================
// API CONFIGURATION
// ==============================

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://nagarvaani-web.onrender.com";

// ==============================
// ISSUE FORM SUBMISSION
// ==============================

const issueForm = document.getElementById("issueForm");

if (issueForm) {
  issueForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        window.location.href = "/login";
        return;
      }

      const formData = new FormData(issueForm);

      const latitude = formData.get("latitude");
      const longitude = formData.get("longitude");

      console.log("Submitting Issue...");
      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);

      const response = await fetch(
        `${API_BASE_URL}/api/issues/report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const result = await response.json();

      console.log("Server Response:", result);

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Failed to report issue"
        );
      }

      if (result.ticketId) {
        alert(
          `✅ Issue Reported Successfully

Ticket ID: ${result.ticketId}

Latitude: ${latitude}
Longitude: ${longitude}`
        );

        issueForm.reset();

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        alert(result.message || "Issue submitted.");
      }

    } catch (error) {
      console.error("Issue Submission Error:", error);

      if (
        error.message.includes("User not found") ||
        error.message.includes("jwt") ||
        error.message.includes("token")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");

        alert("Session expired. Please login again.");

        window.location.href = "/login";
        return;
      }

      alert(error.message);
    }
  });
}

// ==============================
// GEOLOCATION
// ==============================

function getUserCurrentLocation() {

  const btn = document.getElementById("geoLocationBtn");

  const latInput =
    document.querySelector(
      "input[name='latitude']"
    );

  const lonInput =
    document.querySelector(
      "input[name='longitude']"
    );

  if (!navigator.geolocation) {
    showStatus(
      "Geolocation is not supported by your browser.",
      "error"
    );
    return;
  }

  btn.disabled = true;
  btn.innerText = "Getting Location...";

  showStatus(
    "Requesting your location...",
    "loading"
  );

  navigator.geolocation.getCurrentPosition(
    (position) => {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      const accuracy =
        position.coords.accuracy;

      latInput.value = latitude;
      lonInput.value = longitude;

      latInput.style.background =
        "#e8f5e9";

      lonInput.style.background =
        "#e8f5e9";

      showStatus(
        `Location captured successfully (±${Math.round(
          accuracy
        )}m accuracy)`,
        "success"
      );

      btn.disabled = false;
      btn.innerText =
        "📍 Get My Current Location";

      console.log(
        "Location:",
        latitude,
        longitude
      );
    },

    (error) => {

      let message = "";

      switch (error.code) {

        case error.PERMISSION_DENIED:
          message =
            "Location permission denied.";
          break;

        case error.POSITION_UNAVAILABLE:
          message =
            "Location unavailable.";
          break;

        case error.TIMEOUT:
          message =
            "Location request timed out.";
          break;

        default:
          message =
            "Failed to get location.";
      }

      showStatus(message, "error");

      btn.disabled = false;

      btn.innerText =
        "📍 Get My Current Location";
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ==============================
// STATUS DISPLAY
// ==============================

function showStatus(message, type) {

  const statusDiv =
    document.getElementById(
      "locationStatus"
    );

  const statusText =
    document.getElementById(
      "statusText"
    );

  if (!statusDiv || !statusText) return;

  statusText.textContent = message;

  statusDiv.style.display = "block";

  if (type === "success") {
    statusDiv.style.background =
      "#e8f5e9";
    statusDiv.style.color =
      "#2e7d32";
  }

  if (type === "error") {
    statusDiv.style.background =
      "#ffebee";
    statusDiv.style.color =
      "#c62828";
  }

  if (type === "loading") {
    statusDiv.style.background =
      "#e3f2fd";
    statusDiv.style.color =
      "#1565c0";
  }
}
```
