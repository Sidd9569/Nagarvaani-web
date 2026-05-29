const token = localStorage.getItem("token");

async function loadDashboard(){

const res = await fetch("http://localhost:5000/api/dashboard/stats",{

headers:{
Authorization:`Bearer ${token}`
}

});

const data = await res.json();

document.getElementById("totalIssues").innerText = data.total;
document.getElementById("resolvedIssues").innerText = data.resolved;
document.getElementById("pendingIssues").innerText = data.pending;
document.getElementById("points").innerText = data.points;

/* Update leaderboard position card */
if (document.getElementById("userRank")) {
  const rank = data.rank || 0;
  const rankEl = document.getElementById("userRank");
  if (rank === 1) rankEl.innerText = "🥇 #1";
  else if (rank === 2) rankEl.innerText = "🥈 #2";
  else if (rank === 3) rankEl.innerText = "🥉 #3";
  else rankEl.innerText = `#${rank}`;
}
if (document.getElementById("totalUsers")) {
  document.getElementById("totalUsers").innerText = data.totalUsers || 0;
}
if (document.getElementById("userPoints")) {
  document.getElementById("userPoints").innerText = data.points || 0;
}
if (document.getElementById("userCreditPoints")) {
  document.getElementById("userCreditPoints").innerText = data.creditPoints || 0;
}
if (document.getElementById("userTotalScore")) {
  document.getElementById("userTotalScore").innerText = (data.points || 0) + (data.creditPoints || 0);
}
if (document.getElementById("userReports")) {
  document.getElementById("userReports").innerText = data.reportsSubmitted || 0;
}

createChart(data.monthly);

}

async function loadAllIssues() {
  try {
    const res = await fetch("http://localhost:5000/api/issues", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch issues: ${res.status}`);
    }

    const issues = await res.json();
    const tbody = document.getElementById("issuesBody");
    const noIssuesMsg = document.getElementById("noIssuesMsg");

    if (!issues || issues.length === 0) {
      noIssuesMsg.style.display = "block";
      return;
    }

    noIssuesMsg.style.display = "none";
    tbody.innerHTML = "";

    issues.forEach(issue => {
      const row = document.createElement("tr");
      
      const statusClass = issue.status === "Resolved" ? "status-resolved" : "status-pending";
      const statusBadge = `<span class="status-badge ${statusClass}">${issue.status || "Pending"}</span>`;
      
      const priorityClass = issue.priority ? `priority-${issue.priority.toLowerCase()}` : "";
      const priority = issue.priority ? `<span class="${priorityClass}">${issue.priority}</span>` : "N/A";
      
      const location = `${parseFloat(issue.latitude).toFixed(4)}, ${parseFloat(issue.longitude).toFixed(4)}`;
      const reporterName = issue.reportedBy ? issue.reportedBy.name : "Unknown";
      const createdDate = new Date(issue.createdAt).toLocaleDateString();
      
      const voteCount = issue.votes ? issue.votes.length : 0;
      
      const isResolved = issue.status === "Resolved";

      // Only show resolve action for issues reported by the currently logged-in user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.id || currentUser._id || currentUser.userId || currentUser._doc?._id || '';

      // If user isn't available in localStorage, fall back to a safe “no resolve” mode
      if (!currentUserId) {
        // Keep isMine=false by default
      }


      const issueReporterId = issue.reportedBy
        ? (issue.reportedBy._id || issue.reportedBy.id || issue.reportedBy)
        : '';

      const isMine = currentUserId && issueReporterId && String(issueReporterId) === String(currentUserId);


      const actionBtn = isResolved
        ? `<span style="color: #4caf50; font-weight: bold;">✅ Done</span>`
        : isMine
          ? `<button onclick="markAsResolved('${issue._id}', this)" style="background: #4caf50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">✓ Resolve</button>`
          : `<span style="color: var(--text-muted); font-size: 0.78rem;">🔒 Not your ticket</span>`;


      row.innerHTML = `
        <td>${issue.ticketId}</td>
        <td>${issue.issueType || "N/A"}</td>
        <td>${issue.description || "No description"}</td>
        <td>${reporterName}</td>
        <td>${location}</td>
        <td>${priority}</td>
        <td>${statusBadge}</td>
        <td>
          <button onclick="voteOnIssue('${issue._id}', this)" style="background: #ff9800; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">👍 ${voteCount}</button>
        </td>
        <td>${createdDate}</td>
        <td>${actionBtn}</td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading issues:", error);
    document.getElementById("noIssuesMsg").textContent = "Error loading issues: " + error.message;
    document.getElementById("noIssuesMsg").style.display = "block";
  }
}

function createChart(monthlyData){

const ctx = document.getElementById("reportChart");

new Chart(ctx,{

type:"bar",

data:{

labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

datasets:[{

label:"Reports",

data:monthlyData,

backgroundColor:"rgba(102, 126, 234, 0.7)",
borderColor:"rgba(102, 126, 234, 1)",
borderWidth:1

}]

},

options: {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

});

}

/* Load all users into the award dropdown */
async function loadUsersForAward() {
  try {
    const res = await fetch("http://localhost:5000/api/issues", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const issues = await res.json();
    
    // Extract unique users from issues
    const userMap = new Map();
    issues.forEach(issue => {
      if (issue.reportedBy && issue.reportedBy._id) {
        userMap.set(issue.reportedBy._id, issue.reportedBy);
      }
    });
    
    const select = document.getElementById("awardUserId");
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select User --</option>';
    userMap.forEach((user, id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = `${user.name} (${user.email || user.mobileNumber || 'N/A'})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

/* Award credit points to a user */
async function awardCreditPoints() {
  const userId = document.getElementById("awardUserId").value;
  const points = parseInt(document.getElementById("awardPoints").value);
  const statusDiv = document.getElementById("awardStatus");
  
  if (!userId || !points || points <= 0) {
    statusDiv.innerHTML = '<span style="color: #e74c3c;">❌ Please select a user and enter valid points.</span>';
    return;
  }
  
  try {
    const res = await fetch("http://localhost:5000/api/rewards/award", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId, points })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      statusDiv.innerHTML = `<span style="color: #4caf50;">✅ ${data.message}</span>`;
      document.getElementById("awardPoints").value = "";
      // Refresh leaderboard if visible
      if (typeof loadLeaderboard === 'function') loadLeaderboard();
    } else {
      statusDiv.innerHTML = `<span style="color: #e74c3c;">❌ ${data.error || data.message}</span>`;
    }
  } catch (error) {
    statusDiv.innerHTML = `<span style="color: #e74c3c;">❌ Error: ${error.message}</span>`;
  }
}

/* Vote on issue */
async function voteOnIssue(issueId, buttonElement) {
  try {
    const res = await fetch(`http://localhost:5000/api/issues/vote/${issueId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to vote");
    }

    const result = await res.json();
    // Update button with new vote count
    buttonElement.innerHTML = `👍 ${result.votes}`;
    buttonElement.style.background = result.voted ? "#4caf50" : "#ff9800";
  } catch (error) {
    console.error("Error voting on issue:", error);
    alert("Error: " + error.message);
  }
}

/* Mark issue as resolved */
async function markAsResolved(issueId, buttonElement) {
  if (!confirm("Mark this issue as resolved?")) return;
  
  try {
    const res = await fetch(`http://localhost:5000/api/issues/resolve/${issueId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to resolve");
      return;
    }


    const result = await res.json();
    alert(`✅ Issue ${result.ticketId} marked as resolved!`);
    
    // Reload both sections
    loadDashboard();
    loadAllIssues();
  } catch (error) {
    console.error("Error resolving issue:", error);
    alert("Error: " + error.message);
  }
}

if(document.getElementById("reportChart")){
loadDashboard();
loadAllIssues();
loadUsersForAward();
}
