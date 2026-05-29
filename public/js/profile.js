
// ============================
// AUTH CHECK
// ============================

const token = localStorage.getItem("token");
const defaultAvatarPath = "/images/default-avatar.svg";

if (!token) {
  window.location.href = "/login";
}

let currentProfile = null;

// ============================
// AVATAR HELPER
// ============================

function getAvatarUrl(avatarPath) {
  if (!avatarPath) return defaultAvatarPath;

  if (
    avatarPath.startsWith("http://") ||
    avatarPath.startsWith("https://")
  ) {
    return avatarPath;
  }

  return "/" + avatarPath.replace(/^\/+/, "");
}

// ============================
// LOAD PROFILE
// ============================

async function loadProfile() {
  try {
    const res = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed to load profile");
    }

    currentProfile = await res.json();

    const loadingScreen = document.getElementById("loadingScreen");
    const profileContent = document.getElementById("profileContent");

    if (loadingScreen) loadingScreen.style.display = "none";
    if (profileContent) profileContent.style.display = "block";

    displayProfile(currentProfile);
  } catch (error) {
    console.error("Error loading profile:", error);

    const loadingMsg = document.getElementById("loadingMsg");
    const loadingScreen = document.getElementById("loadingScreen");

    if (loadingMsg) loadingMsg.innerHTML = "❌ " + error.message;

    if (loadingScreen) {
      loadingScreen.innerHTML =
        `<div class="spinner"></div><p>❌ ${error.message}</p>`;
    }
  }
}

// ============================
// DISPLAY PROFILE
// ============================

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

// ============================
// EDIT TOGGLE
// ============================

function toggleEdit(field) {
  const view = document.getElementById(`view${capitalize(field)}`);
  const edit = document.getElementById(`edit${capitalize(field)}`);
  const btn = document.getElementById(`edit${capitalize(field)}Btn`);
  const actions = document.getElementById(`${field}Actions`);

  if (view) view.style.display = "none";
  if (edit) edit.style.display = "block";
  if (btn) btn.style.display = "none";
  if (actions) actions.style.display = "inline-block";
}

function cancelEdit(field) {
  const view = document.getElementById(`view${capitalize(field)}`);
  const edit = document.getElementById(`edit${capitalize(field)}`);
  const btn = document.getElementById(`edit${capitalize(field)}Btn`);
  const actions = document.getElementById(`${field}Actions`);

  if (view) view.style.display = "block";
  if (edit) edit.style.display = "none";
  if (btn) btn.style.display = "inline-block";
  if (actions) actions.style.display = "none";

  const statusDiv = document.getElementById("profileStatus");
  if (statusDiv) {
    statusDiv.style.display = "none";
  }
}

// ============================
// SAVE FIELD
// ============================

async function saveField(field) {
  const input = document.getElementById(`edit${capitalize(field)}`);
  const value = input ? input.value.trim() : "";

  const statusDiv = document.getElementById("profileStatus");

  try {
    const res = await fetch("/api/profile/update", {
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

      if (statusDiv) {
        statusDiv.innerHTML = "✅ Profile updated successfully!";
        statusDiv.style.display = "block";
        statusDiv.className = "status-msg success";

        setTimeout(() => {
          statusDiv.style.display = "none";
        }, 3000);
      }
    } else {
      if (statusDiv) {
        statusDiv.innerHTML = "❌ " + (data.message || data.error);
        statusDiv.style.display = "block";
        statusDiv.className = "status-msg error";
      }
    }
  } catch (error) {
    console.error(error);

    if (statusDiv) {
      statusDiv.innerHTML = "❌ Error updating profile";
      statusDiv.style.display = "block";
      statusDiv.className = "status-msg error";
    }
  }
}

// ============================
// AVATAR UPLOAD
// ============================

function previewAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("File too large (Max 5MB)");
    return;
  }

  const avatar = document.getElementById("profileAvatar");

  const reader = new FileReader();
  reader.onload = (e) => {
    avatar.src = e.target.result;
  };
  reader.readAsDataURL(file);

  uploadAvatar(file);
}

async function uploadAvatar(file) {
  const statusDiv = document.getElementById("profileStatus");
  const avatarInput = document.getElementById("avatarInput");

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch("/api/profile/update", {
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

      if (avatarInput) avatarInput.value = "";

      if (statusDiv) {
        statusDiv.innerHTML = "✅ Profile photo updated!";
        statusDiv.className = "status-msg success";
        statusDiv.style.display = "block";

        setTimeout(() => {
          statusDiv.style.display = "none";
        }, 3000);
      }
    } else {
      throw new Error(data.message || data.error);
    }
  } catch (error) {
    console.error(error);

    if (avatarInput) avatarInput.value = "";

    if (statusDiv) {
      statusDiv.innerHTML = "❌ Upload failed";
      statusDiv.className = "status-msg error";
      statusDiv.style.display = "block";
    }

    if (currentProfile) {
      document.getElementById("profileAvatar").src =
        getAvatarUrl(currentProfile.avatar);
    }
  }
}

// ============================
// UTIL
// ============================

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================
// INIT
// ============================

document.addEventListener("DOMContentLoaded", loadProfile);

// Expose functions globally
window.toggleEdit = toggleEdit;
window.cancelEdit = cancelEdit;
window.saveField = saveField;
window.previewAvatar = previewAvatar;
window.logout = function () {
  localStorage.clear();
  window.location.href = "/login";
};
