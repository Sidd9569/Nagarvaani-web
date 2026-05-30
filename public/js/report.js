// ==========================================
// NAGARVAANI REPORT.JS
// ==========================================

// Backend API URL
const API_BASE_URL =
window.location.hostname === "localhost"
? "http://localhost:5000"
: "https://nagarvaani-web.onrender.com";

// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
console.log("Report page loaded");

```
const issueForm = document.getElementById("issueForm");

if (issueForm) {
    issueForm.addEventListener("submit", handleIssueSubmit);
}

const locationBtn = document.getElementById("geoLocationBtn");

if (locationBtn) {
    locationBtn.addEventListener("click", getUserCurrentLocation);
}
```

});

// ==========================================
// SUBMIT ISSUE
// ==========================================

async function handleIssueSubmit(event) {
event.preventDefault();

```
try {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "/login";
        return;
    }

    const form = document.getElementById("issueForm");

    if (!form) {
        throw new Error("Issue form not found");
    }

    const formData = new FormData(form);

    console.log("Submitting issue...");

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

    console.log("Server Response:", result);

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Failed to submit issue"
        );
    }

    if (result.ticketId) {
        alert(
            "Issue Reported Successfully\n\n" +
            "Ticket ID: " +
            result.ticketId
        );

        form.reset();

        setTimeout(function () {
            window.location.href = "/dashboard";
        }, 1500);
    } else {
        alert(result.message || "Issue submitted successfully.");
    }
} catch (error) {
    console.error("Issue Submission Error:", error);

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
```

}

// ==========================================
// GET CURRENT LOCATION
// ==========================================

function getUserCurrentLocation() {
const button = document.getElementById("geoLocationBtn");

```
const latitudeInput =
    document.querySelector("input[name='latitude']");

const longitudeInput =
    document.querySelector("input[name='longitude']");

if (!navigator.geolocation) {
    showStatus(
        "Geolocation is not supported by this browser.",
        "error"
    );
    return;
}

button.disabled = true;
button.textContent = "Getting Location...";

showStatus("Requesting GPS location...", "loading");

navigator.geolocation.getCurrentPosition(
    function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        latitudeInput.value = latitude;
        longitudeInput.value = longitude;

        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);
        console.log("Accuracy:", accuracy);

        showStatus(
            "Location captured successfully (±" +
                Math.round(accuracy) +
                "m)",
            "success"
        );

        button.disabled = false;
        button.textContent =
            "📍 Get My Current Location";
    },

    function (error) {
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
```

}

// ==========================================
// LOCATION STATUS UI
// ==========================================

function showStatus(message, type) {
const statusContainer =
document.getElementById("locationStatus");

```
const statusText =
    document.getElementById("statusText");

if (!statusContainer || !statusText) {
    return;
}

statusContainer.style.display = "block";
statusText.textContent = message;

if (type === "success") {
    statusContainer.style.backgroundColor =
        "#e8f5e9";
    statusContainer.style.color =
        "#2e7d32";
}

if (type === "error") {
    statusContainer.style.backgroundColor =
        "#ffebee";
    statusContainer.style.color =
        "#c62828";
}

if (type === "loading") {
    statusContainer.style.backgroundColor =
        "#e3f2fd";
    statusContainer.style.color =
        "#1565c0";
}
```

}
