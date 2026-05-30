```javascript
// =====================================
// API CONFIGURATION
// =====================================

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://nagarvaani-web.onrender.com";

// =====================================
// ISSUE REPORT SUBMISSION
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  const issueForm = document.getElementById("issueForm");

  if (!issueForm) return;

  issueForm.addEventListener("submit", submitIssue);
});

async function submitIssue(event) {
  event.preventDefault();

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      window.location.href = "/login";
      return;
    }

    const form = document.getElementById("issueForm");
    const formData = new FormData(form);

    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");

    console.log("Submitting issue...");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    const response = await fetch(
      API_BASE_URL + "/api/issues/report",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        },
        body: formData
      }
    );

    const result = await response.json();

    console.log(result);

    if (!response.ok) {
      throw new Error(
        result.message ||
        result.error ||
        "Issue submission failed"
      );
    }

    if (result.ticketId) {
      alert(
        "Issue Reported Successfully\n\n" +
        "Ticket ID: " +
        result.ticketId
      );

      form.reset();

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    }
  } catch (error) {
    console.error(error);

    if (
      error.message.includes("token") ||
      error.message.includes("jwt") ||
      error.message.includes("User not found")
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
}

// =====================================
// GEOLOCATION
// =====================================

function getUserCurrentLocation() {
  const button = document.getElementById("geoLocationBtn");

  const latitudeInput =
    document.querySelector(
      "input[name='latitude']"
    );

  const longitudeInput =
    document.querySelector(
      "input[name='longitude']"
    );

  if (!navigator.geolocation) {
    showStatus(
      "Geolocation is not supported.",
      "error"
    );
    return;
  }

  button.disabled = true;
  button.textContent = "Getting Location...";

  showStatus(
    "Requesting GPS location...",
    "loading"
  );

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      const accuracy =
        position.coords.accuracy;

      latitudeInput.value = latitude;
      longitudeInput.value = longitude;

      showStatus(
        "Location captured successfully. Accuracy ±" +
          Math.round(accuracy) +
          "m",
        "success"
      );

      button.disabled = false;
      button.textContent =
        "📍 Get My Current Location";
    },

    function (error) {
      let message;

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
            "Unable to retrieve location.";
      }

      showStatus(message, "error");

      button.disabled = false;
      button.textContent =
        "📍 Get My Current Location";
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// =====================================
// STATUS MESSAGE
// =====================================

function showStatus(message, type) {
  const statusDiv =
    document.getElementById("locationStatus");

  const statusText =
    document.getElementById("statusText");

  if (!statusDiv || !statusText) return;

  statusDiv.style.display = "block";
  statusText.textContent = message;

  if (type === "success") {
    statusDiv.style.background = "#e8f5e9";
    statusDiv.style.color = "#2e7d32";
  }

  if (type === "error") {
    statusDiv.style.background = "#ffebee";
    statusDiv.style.color = "#c62828";
  }

  if (type === "loading") {
    statusDiv.style.background = "#e3f2fd";
    statusDiv.style.color = "#1565c0";
  }
}
```
