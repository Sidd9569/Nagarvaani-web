const token = localStorage.getItem("token");
const defaultAvatarPath = "/images/default-avatar.svg";

// Check authentication
if (!token) {
  window.location.href = "/login";
}

let currentProfile = null;

function getAvatarUrl(avatarPath) {
  if (!avatarPath) {
    return defaultAvatarPath;
  }

  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  return "http://localhost:5000/" + avatarPath.replace(/^\/+/, "");
}

/* Load profile data */
async function loadProfile() {
  try {
    const res = await fetch("http://localhost:5000/api/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Failed to load profile");
    }

    currentProfile = await res.json();

    // Compatibility with the current profile.html markup
    const loadingScreen = document.getElementById("loadingScreen");
    const profileContent = document.getElementById("profileContent");
    if (loadingScreen) loadingScreen.style.display = "none";
    if (profileContent) profileContent.style.display = "block";

    displayProfile(currentProfile);
  } catch (error) {
    const loadingMsg = document.getElementById("loadingMsg");
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingMsg) loadingMsg.innerHTML = "❌ " + error.message;
    if (loadingScreen) loadingScreen.innerHTML = `<div class="spinner"></div><p>❌ ${error.message}</p>`;
    console.error("Error loading profile:", error);
  }
}


/* Display profile data */
function displayProfile(user) {
  document.getElementById("viewName").textContent = user.name || "N/A";
  document.getElementById("viewEmail").textContent = user.email || "N/A";
  document.getElementById("viewMobile").textContent = user.mobileNumber || "N/A";
  document.getElementById("viewCity").textContent = user.city || "N/A";
  document.getElementById("viewBio").textContent = user.bio || "No bio yet";

  document.getElementById("editName").value = user.name || "";
  document.getElementById("editCity").value = user.city || "";
  document.getElementById("editBio").value = user.bio || "";

  document.getElementById("displayTotalScore").textContent = user.totalScore || 0;
  document.getElementById("displayPoints").textContent = user.points || 0;
  document.getElementById("displayCreditPoints").textContent = user.creditPoints || 0;
  document.getElementById("displayReports").textContent = user.reportsSubmitted || 0;

  const avatar = document.getElementById("profileAvatar");
  avatar.src = getAvatarUrl(user.avatar);
  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = defaultAvatarPath;
  };
}

/* Toggle edit mode for a field */
function toggleEdit(field) {
  document.getElementById(`view${field.charAt(0).toUpperCase() + field.slice(1)}`).style.display = "none";
  document.getElementById(`edit${field.charAt(0).toUpperCase() + field.slice(1)}`).style.display = "block";
  document.getElementById(`edit${field.charAt(0).toUpperCase() + field.slice(1)}Btn`).style.display = "none";
  document.getElementById(`${field}Actions`).style.display = "inline-block";
}

/* Cancel edit */
function cancelEdit(field) {
  document.getElementById(`view${field.charAt(0).toUpperCase() + field.slice(1)}`).style.display = "block";
  document.getElementById(`edit${field.charAt(0).toUpperCase() + field.slice(1)}`).style.display = "none";
  document.getElementById(`edit${field.charAt(0).toUpperCase() + field.slice(1)}Btn`).style.display = "inline-block";
  document.getElementById(`${field}Actions`).style.display = "none";
  document.getElementById("profileStatus").className = "status-msg";
  document.getElementById("profileStatus").style.display = "none";
}

/* Save a single field */
async function saveField(field) {
  const input = document.getElementById(`edit${field.charAt(0).toUpperCase() + field.slice(1)}`);
  const value = input.value.trim();
  const statusDiv = document.getElementById("profileStatus");

  try {
    const res = await fetch("http://localhost:5000/api/profile/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ [field]: value })
    });

    const data = await res.json();

    if (res.ok) {
      currentProfile = data.user;
      displayProfile(data.user);
      cancelEdit(field);
      statusDiv.className = "status-msg success";
      statusDiv.innerHTML = "✅ Profile updated successfully!";
      statusDiv.style.display = "block";
      setTimeout(() => { statusDiv.style.display = "none"; }, 3000);
    } else {
      statusDiv.className = "status-msg error";
      statusDiv.innerHTML = "❌ " + (data.error || data.message);
      statusDiv.style.display = "block";
    }
  } catch (error) {
    statusDiv.className = "status-msg error";
    statusDiv.innerHTML = "❌ Error updating profile";
    statusDiv.style.display = "block";
  }
}

/* Preview selected avatar */
function previewAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("File too large. Maximum size is 5MB.");
    return;
  }

  const avatar = document.getElementById("profileAvatar");

  // Show preview immediately
  const reader = new FileReader();
  reader.onload = (e) => {
    avatar.src = e.target.result;
  };
  reader.readAsDataURL(file);

  // Upload immediately
  uploadAvatar(file);
}

/* Upload avatar image */
async function uploadAvatar(file) {
  const statusDiv = document.getElementById("profileStatus");
  const avatarInput = document.getElementById("avatarInput");
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch("http://localhost:5000/api/profile/update", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      currentProfile = data.user;
      displayProfile(data.user);
      avatarInput.value = "";
      statusDiv.className = "status-msg success";
      statusDiv.innerHTML = "✅ Profile photo updated!";
      statusDiv.style.display = "block";
      setTimeout(() => { statusDiv.style.display = "none"; }, 3000);
    } else {
      avatarInput.value = "";
      statusDiv.className = "status-msg error";
      statusDiv.innerHTML = "❌ " + (data.error || data.message);
      statusDiv.style.display = "block";
      document.getElementById("profileAvatar").src = getAvatarUrl(currentProfile && currentProfile.avatar);
    }
  } catch (error) {
    avatarInput.value = "";
    statusDiv.className = "status-msg error";
    statusDiv.innerHTML = "❌ Error uploading photo";
    statusDiv.style.display = "block";
    document.getElementById("profileAvatar").src = getAvatarUrl(currentProfile && currentProfile.avatar);
  }
}


/* Initialize */
document.addEventListener("DOMContentLoaded", loadProfile);

// Expose handlers used by inline onclick attributes in profile.html
window.toggleEdit = toggleEdit;
window.cancelEdit = cancelEdit;
window.saveField = saveField;
window.previewAvatar = previewAvatar;
window.logout = logout;

