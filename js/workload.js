/* global TrelloPowerUp, Chart */

var t = TrelloPowerUp.iframe();

t.render(async function () {
  var container = document.getElementById("workload-list");
  container.innerHTML = '<p class="empty-state">Loading…</p>';

  try {
    var data = await t.get("board", "shared", "hoursData");
    var totals = (data && data.totals) ? data.totals : {};
    var history = (data && data.history) ? data.history : [];

    // ---------- Current totals list ----------
    if (!totals || Object.keys(totals).length === 0) {
      container.innerHTML =
        '<p class="empty-state">' +
        "No hour estimates found yet.<br><br>" +
        "1. Open a card that has members<br>" +
        "2. Click <strong>Set Hours</strong> and save some values<br>" +
        "3. Then come back here" +
        "</p>";
    } else {
      var board = await t.board("members");
      var membersMap = {};
      (board.members || []).forEach(function (m) {
        membersMap[m.id] = m;
      });

      var memberIds = Object.keys(totals).filter(function (id) {
        return totals[id] > 0;
      });

      memberIds.sort(function (a, b) {
        return totals[b] - totals[a];
      });

      container.innerHTML = "";

      memberIds.forEach(function (id) {
        var member = membersMap[id];
        var name = member
          ? (member.fullName || member.username)
          : "Unknown member";

        var row = document.createElement("div");
        row.className = "workload-row";

        var nameEl = document.createElement("span");
        nameEl.className = "workload-name";
        nameEl.textContent = name;

        var hoursEl = document.createElement("span");
        hoursEl.className = "workload-hours";
        hoursEl.textContent = Math.round(totals[id] * 10) / 10 + "h";

        row.appendChild(nameEl);
        row.appendChild(hoursEl);
        container.appendChild(row);
      });
    }

    // ---------- History chart ----------
    renderChart(history);

    return t.sizeTo(document.body);
  } catch (err) {
    console.error("Workload error:", err);
    container.innerHTML =
      '<p class="empty-state">Error loading workload.<br>Open the browser console (F12) for details.</p>';
    return t.sizeTo(document.body);
  }
});

function renderChart(history) {
  var canvas = document.getElementById("hoursChart");
  if (!canvas) return;

  // Need at least 2 points for a meaningful line
  if (!history || history.length < 2) {
    // Draw a simple message instead
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#5e6c84";
    ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Save estimates a few more times", canvas.width / 2, canvas.height / 2 - 8);
    ctx.fillText("to see the trend over time", canvas.width / 2, canvas.height / 2 + 12);
    return;
  }

  // Format labels as short date + time
  var labels = history.map(function (point) {
    var d = new Date(point.ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
           " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  });

  var values = history.map(function (point) {
    return point.total;
  });

  // Destroy previous chart instance if it exists (important when re-rendering)
  if (window._hoursChart) {
    window._hoursChart.destroy();
  }

  window._hoursChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Total estimated hours",
        data: values,
        borderColor: "#0079bf",
        backgroundColor: "rgba(0, 121, 191, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ctx.parsed.y + "h";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Hours"
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 30,
            font: { size: 10 }
          }
        }
      }
    }
  });
}
