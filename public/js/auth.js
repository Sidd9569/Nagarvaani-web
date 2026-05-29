// ============================
// AUTHENTICATION CHECK & REDIRECT FUNCTION
// ============================

function handleReportIssueClick() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (isLoggedIn === 'true') {
    // User is logged in, redirect to report page
    window.location.href = '/report';
  } else {
    // User is not logged in, redirect to login page
    window.location.href = '/login';
  }
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
}

// ============================
// MOBILE REGISTRATION FLOW (MOBILE OTP ONLY)
// ============================

let otpTimer = 0;
let otpTimerInterval;

// Step 1: Send OTP to mobile
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
        document.getElementById("contactStatus").innerHTML = `<p style="color: green;">✓ ${data.message}</p>`;
        document.getElementById("mobileHidden").value = mobileNumber;
        document.getElementById("mobileFinal").value = mobileNumber;

        // Move to OTP verification step
        showStep("otpStep");
        startOTPTimer();
      } else {
        document.getElementById("contactStatus").innerHTML = `<p style="color: red;">✗ ${data.message || 'Unable to send OTP'}</p>`;
      }
    } catch (error) {
      console.error(error);
      document.getElementById("contactStatus").innerHTML = `<p style="color: red;">✗ Network error or server unavailable</p>`;
    }
  });
}

// Step 2: Verify mobile OTP
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
        document.getElementById("otpStatus").innerHTML = `<p style="color: green;">✓ ${data.message}</p>`;
        clearInterval(otpTimerInterval);

        // Move to registration details step
        setTimeout(() => showStep("detailsStep"), 1000);
      } else {
        document.getElementById("otpStatus").innerHTML = `<p style="color: red;">✗ ${data.message || 'Invalid OTP or session expired'}</p>`;
      }
    } catch (error) {
      console.error(error);
      document.getElementById("otpStatus").innerHTML = `<p style="color: red;">✗ Network error or server unavailable</p>`;
    }
  });
}

// Step 3: Complete Registration
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const email = formData.get("email");
    const mobileNumber = formData.get("mobileNumber");
    const name = formData.get("name");
    const password = formData.get("password");
    const city = formData.get("city");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mobileNumber, name, password, city })
      });

      const data = await res.json();

      if (data.message === "Registration successful") {
        document.getElementById("registerStatus").innerHTML = `<p style="color: green;">✓ ${data.message}</p>`;
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        document.getElementById("registerStatus").innerHTML = `<p style="color: red;">✗ ${data.message}</p>`;
      }
    } catch (error) {
      console.error(error);
      document.getElementById("registerStatus").innerHTML = `<p style="color: red;">✗ Error completing registration</p>`;
    }
  });
}

// Helper Functions
function showStep(stepId) {
  document.querySelectorAll(".form-section").forEach(el => el.classList.remove("active"));
  document.getElementById(stepId).classList.add("active");
}

function backToContact() {
  clearInterval(otpTimerInterval);
  showStep("contactStep");
  document.getElementById("contactStatus").innerHTML = "";
  document.getElementById("otpStatus").innerHTML = "";
}

function startOTPTimer() {
  otpTimer = 300; // 5 minutes
  updateOTPTimer();
  otpTimerInterval = setInterval(updateOTPTimer, 1000);
}

function updateOTPTimer() {
  const minutes = Math.floor(otpTimer / 60);
  const seconds = otpTimer % 60;
  document.getElementById("otpTimer").innerHTML = `Expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (otpTimer <= 0) {
    clearInterval(otpTimerInterval);
    document.getElementById("otpStatus").innerHTML = `<p style="color: red;">✗ OTPs Expired. Please request new ones.</p>`;
    backToContact();
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
        console.log("Login request sent with:", { email, password: "********" });

      });

      const data = await res.json();
      console.log("Login response:", data);

      if (data.message === "Login successful") {

        alert("Login successful");

        console.log("🔐 Login Response received:", data);
        console.log("📌 Token:", data.token ? data.token.substring(0, 20) + "..." : "NOT FOUND");

        // Store authentication status and token
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        console.log("✅ Data stored in localStorage:");
        console.log(`   isLoggedIn: ${localStorage.getItem('isLoggedIn')}`);
        console.log(`   token: ${localStorage.getItem('token') ? "Stored ✓" : "NOT STORED ✗"}`);
        console.log(`   user: ${localStorage.getItem('user') ? "Stored ✓" : "NOT STORED ✗"}`);

        window.location.href = "/dashboard";

      } else {

        alert(data.message);

      }

    } catch (error) {

      console.error(error);

    }

  });

}
