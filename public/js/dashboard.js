// ==========================================
// RENDER API CONFIGURATION
// ==========================================

const API_BASE_URL = "https://nagarvaani-web.onrender.com";

const token = localStorage.getItem("token") || "";

// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/dashboard/stats`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            console.error(
                "Dashboard API Error:",
                response.status
            );
            return;
        }

        const data = await response.json();

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        setText("totalIssues", data.total || 0);
        setText("resolvedIssues", data.resolved || 0);
        setText("pendingIssues", data.pending || 0);
        setText("points", data.points || 0);
        setText("totalUsers", data.totalUsers || 0);
        setText("userPoints", data.points || 0);
        setText("userCreditPoints", data.creditPoints || 0);
        setText(
            "userTotalScore",
            (data.points || 0) + (data.creditPoints || 0)
        );
        setText("userReports", data.reportsSubmitted || 0);

        const rankEl =
            document.getElementById("userRank");

        if (rankEl) {
            rankEl.innerText =
                data.rank > 0
                    ? `#${data.rank}`
                    : "-";
        }

        if (
            data.monthly &&
            document.getElementById("reportChart")
        ) {
            createChart(data.monthly);
        }
    } catch (error) {
        console.error(
            "Dashboard Load Error:",
            error
        );
    }
}

// ==========================================
// LOAD ISSUES
// ==========================================

async function loadAllIssues() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/issues`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            console.error(
                "Issues API Error:",
                response.status
            );
            return;
        }

        const issues = await response.json();

        const tbody =
            document.getElementById("issuesBody");

        const noIssuesMsg =
            document.getElementById("noIssuesMsg");

        if (!tbody) return;

        tbody.innerHTML = "";

        if (!issues || issues.length === 0) {
            if (noIssuesMsg) {
                noIssuesMsg.style.display =
                    "block";
            }
            return;
        }

        if (noIssuesMsg) {
            noIssuesMsg.style.display = "none";
        }

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
                        👍 ${issue.votes?.length || 0}
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    } catch (error) {
        console.error(
            "Load Issues Error:",
            error
        );
    }
}

// ==========================================
// VOTE ISSUE
// ==========================================

async function voteOnIssue(issueId, button) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/issues/vote/${issueId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Failed to vote"
            );
        }

        button.innerHTML =
            `👍 ${data.votes}`;
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ==========================================
// RESOLVE ISSUE
// ==========================================

async function markAsResolved(issueId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/issues/resolve/${issueId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Failed to resolve issue"
            );
        }

        alert(
            "Issue marked as resolved"
        );

        loadDashboard();
        loadAllIssues();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ==========================================
// AWARD CREDIT POINTS
// ==========================================

async function awardCreditPoints() {
    try {
        const userId =
            document.getElementById(
                "awardUserId"
            )?.value;

        const points =
            document.getElementById(
                "awardPoints"
            )?.value;

        if (!userId || !points) {
            alert(
                "Select user and points"
            );
            return;
        }

        const response = await fetch(
            `${API_BASE_URL}/api/rewards/award`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    points
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message
            );
        }

        alert(
            data.message ||
            "Points awarded successfully"
        );
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ==========================================
// CHART
// ==========================================

let chartInstance = null;

function createChart(monthlyData) {
    const canvas =
        document.getElementById(
            "reportChart"
        );

    if (!canvas) return;

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: [
                "Jan","Feb","Mar","Apr",
                "May","Jun","Jul","Aug",
                "Sep","Oct","Nov","Dec"
            ],
            datasets: [{
                label: "Reports",
                data: monthlyData
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ==========================================
// INITIAL LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!token) {
            console.warn(
                "User not logged in"
            );
            return;
        }

        loadDashboard();
        loadAllIssues();
    }
);
