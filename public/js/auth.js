// ============================
// AUTH HELPERS
// ============================

function handleReportIssueClick() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn === "true") {
    window.location.href = "/report";
  } else {
    window.location.href = "/login";
  }
}

// IMPORTANT: make logout global so HTML onclick works
window.logout = function () {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
};

// ============================
// MOBILE OTP REGISTRATION FLOW
// ============================

let otpTimer = 0;
let otpTimerInterval = null;

// Step 1: Send OTP
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mobileNumber = document.getElementById("mobileNumber").value.trim();

    try {
      const res = await fetch("/api/auth/send-unified-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber })
      });

      const data = await res.json().catch(() => ({ message: res.statusText }));

      if (res.ok) {
        document.getElementById("contactStatus").innerHTML =
          `<p style="color: green;">✓ ${data.message}</p>`;

        document.getElementById("mobileHidden").value = mobileNumber;
        document.getElementById("mobileFinal").value = mobileNumber;

        showStep("otpStep");
        startOTPTimer();
      } else {
        document.getElementById("contactStatus").innerHTML =
          `<p style="color: red;">✗ ${data.message || "Unable to send OTP"}</p>`;
      }
    } catch (err) {
      console.error(err);
      document.getElementById("contactStatus").innerHTML =
        `<p style="color: red;">✗ Network error</p>`;
    }
  });
}

// Step 2: Verify OTP
const otpForm = document.getElementById("otpForm");

if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mobileNumber = document.getElementById("mobileHidden").value;
    const mobileOTP = document.getElementById("mobileOTP").value;

    try {
      const res = await fetch("/api/auth/verify-unified-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, mobileOTP })
      });

      const data = await res.json().catch(() => ({ message: res.statusText }));

      if (res.ok) {
        document.getElementById("otpStatus").innerHTML =
          `<p style="color: green;">✓ ${data.message}</p>`;

        clearInterval(otpTimerInterval);

        setTimeout(() => showStep("detailsStep"), 800);
      } else {
        document.getElementById("otpStatus").innerHTML =
          `<p style="color: red;">✗ ${data.message || "Invalid OTP"}</p>`;
      }
    } catch (err) {
      console.error(err);
      document.getElementById("otpStatus").innerHTML =
        `<p style="color: red;">✗ Network error</p>`;
    }
  });
}

// Step 3: Register
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);

    const payload = {
      email: formData.get("email"),
      mobileNumber: formData.get("mobileNumber"),
      name: formData.get("name"),
      password: formData.get("password"),
      city: formData.get("city")
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        document.getElementById("registerStatus").innerHTML =
          `<p style="color: green;">✓ ${data.message}</p>`;

        setTimeout(() => (window.location.href = "/login"), 1500);
      } else {
        document.getElementById("registerStatus").innerHTML =
          `<p style="color: red;">✗ ${data.message}</p>`;
      }
    } catch (err) {
      console.error(err);
      document.getElementById("registerStatus").innerHTML =
        `<p style="color: red;">✗ Server error</p>`;
    }
  });
}

// ============================
// STEP CONTROLS
// ============================

function showStep(stepId) {
  document.querySelectorAll(".form-section").forEach((el) => {
    el.classList.remove("active");
  });

  const step = document.getElementById(stepId);
  if (step) step.classList.add("active");
}

window.backToContact = function () {
  clearInterval(otpTimerInterval);
  showStep("contactStep");

  const contactStatus = document.getElementById("contactStatus");
  const otpStatus = document.getElementById("otpStatus");

  if (contactStatus) contactStatus.innerHTML = "";
  if (otpStatus) otpStatus.innerHTML = "";
};

// ============================
// OTP TIMER
// ============================

function startOTPTimer() {
  otpTimer = 300;

  updateOTPTimer();
  otpTimerInterval = setInterval(updateOTPTimer, 1000);
}

function updateOTPTimer() {
  const timerEl = document.getElementById("otpTimer");

  if (!timerEl) return;

  const minutes = Math.floor(otpTimer / 60);
  const seconds = otpTimer % 60;

  timerEl.innerHTML = `Expires in: ${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  if (otpTimer <= 0) {
    clearInterval(otpTimerInterval);

    const otpStatus = document.getElementById("otpStatus");
    if (otpStatus) {
      otpStatus.innerHTML =
        `<p style="color: red;">✗ OTP expired</p>`;
    }

    backToContact();
    return;
  }

  otpTimer--;
}

// ============================
// LOGIN
// ============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);

    const email = formData.get("email");
    const password = formData.get("password");

    console.log("Login request sent:", { email, password: "****" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok && data.message === "Login successful") {
        alert("Login successful");

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        window.location.href = "/dashboard";
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}
