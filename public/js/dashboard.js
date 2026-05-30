```javascript
// ==========================================
// API CONFIGURATION
// ==========================================

const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://nagarvaani-web.onrender.com";

const token = localStorage.getItem("token");

// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {
    try {
        const res = await fetch(
            API_BASE_URL + "/api/dashboard/stats",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!res.ok) {
            throw new Error("Failed to load dashboard");
        }

        const data = await res.json();

        document.getElementById("totalIssues").innerText =
            data.total || 0;

        document.getElementById("resolvedIssues").innerText =
            data.resolved || 0;

        document.getElementById("pendingIssues").innerText =
            data.pending || 0;

        document.getElementById("points").innerText =
            data.points || 0;

        if (document.getElementById("userRank")) {
            const rank = data.rank || 0;

            document.getElementById("userRank").innerText =
                rank > 0 ? "#" + rank : "-";
        }

        if (document.getElementById("totalUsers")) {
            document.getElementById("totalUsers").innerText =
                data.totalUsers || 0;
        }

        if (document.getElementById("userPoints")) {
            document.getElementById("userPoints").innerText =
                data.points || 0;
        }

        if (document.getElementById("userCreditPoints")) {
            document.getElementById("userCreditPoints").innerText =
                data.creditPoints || 0;
        }

        if (document.getElementById("userTotalScore")) {
            document.getElementById("userTotalScore").innerText =
                (data.points || 0) +
                (data.creditPoints || 0);
        }

        if (document.getElementById("userReports")) {
            document.getElementById("userReports").innerText =
                data.reportsSubmitted || 0;
        }

        if (data.monthly) {
            createChart(data.monthly);
        }
    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

// ==========================================
// LOAD ISSUES
// ==========================================

async function loadAllIssues() {
    try {
        const res = await fetch(
            API_BASE_URL + "/api/issues",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!res.ok) {
            throw new Error(
                "Failed to load issues"
            );
        }

        const issues = await res.json();

        const tbody =
            document.getElementById("issuesBody");

        const noIssuesMsg =
            document.getElementById("noIssuesMsg");

        tbody.innerHTML = "";

        if (!issues || issues.length === 0) {
            noIssuesMsg.style.display = "block";
            return;
        }

        noIssuesMsg.style.display = "none";

        issues.forEach((issue) => {
            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${issue.ticketId || "-"}</td>
                <td>${issue.issueType || "-"}</td>
                <td>${issue.description || "-"}</td>
                <td>${issue.status || "Pending"}</td>
                <td>${issue.priority || "-"}</td>
                <td>
                    <button onclick="voteOnIssue('${issue._id}', this)">
                        👍 ${issue.votes ? issue.votes.length : 0}
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    } catch (error) {
        console.error(error);
    }
}

// ==========================================
// VOTE ISSUE
// ==========================================

async function voteOnIssue(issueId, button) {
    try {
        const res = await fetch(
            API_BASE_URL +
                "/api/issues/vote/" +
                issueId,
            {
                method: "POST",
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error || "Vote failed"
            );
        }

        button.innerHTML =
            "👍 " + data.votes;
    } catch (error) {
        alert(error.message);
    }
}

// ==========================================
// RESOLVE ISSUE
// ==========================================

async function markAsResolved(issueId) {
    try {
        const res = await fetch(
            API_BASE_URL +
                "/api/issues/resolve/" +
                issueId,
            {
                method: "PUT",
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error ||
                "Resolve failed"
            );
        }

        alert(
            "Issue marked as resolved"
        );

        loadDashboard();
        loadAllIssues();
    } catch (error) {
        alert(error.message);
    }
}

// ==========================================
// AWARD POINTS
// ==========================================

async function awardCreditPoints() {
    const userId =
        document.getElementById(
            "awardUserId"
        ).value;

    const points =
        document.getElementById(
            "awardPoints"
        ).value;

    try {
        const res = await fetch(
            API_BASE_URL +
                "/api/rewards/award",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        "Bearer " + token
                },
                body: JSON.stringify({
                    userId,
                    points
                })
            }
        );

        const data = await res.json();

        alert(
            data.message ||
            "Points awarded"
        );
    } catch (error) {
        alert(error.message);
    }
}

// ==========================================
// CHART
// ==========================================

function createChart(monthlyData) {
    const canvas =
        document.getElementById(
            "reportChart"
        );

    if (!canvas) return;

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: [
                "Jan","Feb","Mar","Apr",
                "May","Jun","Jul","Aug",
                "Sep","Oct","Nov","Dec"
            ],
            datasets: [
                {
                    label: "Reports",
                    data: monthlyData
                }
            ]
        }
    });
}

// ==========================================
// INITIAL LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadDashboard();
        loadAllIssues();
    }
);
```
