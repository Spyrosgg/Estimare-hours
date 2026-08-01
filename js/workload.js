/* global TrelloPowerUp, Chart */

var t = TrelloPowerUp.iframe();

t.render(async function () {
  var container = document.getElementById("workload-list");
  container.innerHTML = '<p class="empty-state">Loading…</p>';

  try {
    var data = await t.get("board", "shared", "hoursData");
    var totals = (data && data.totals) ? data.totals : {};

    var board = await t.board("members");
    var members = board.members || [];
    var membersMap = {};
    members.forEach(function (m) {
      membersMap[m.id] = m;
    });

    var memberCount = members.length;
    var divisor = Math.max(1, memberCount - 1); // members − 1

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

    await renderForecastChart(totals, divisor);
    return t.sizeTo(document.body);
  } catch (err) {
    console.error("Workload error:", err);
    container.innerHTML =
      '<p class="empty-state">Error loading workload.<br>Open the browser console (F12) for details.</p>';
    return t.sizeTo(document.body);
  }
});

/**
 * Chart rules:
 * - X starts 7 days before today
 * - X ends at the furthest card due date (or today+14 if none)
 * - Y = total estimated hours ÷ (board members − 1)
 * - Flat at full load until today, then linear burn-down to 0 at the end date
 */
async function renderForecastChart(totals, divisor) {
  var canvas = document.getElementById("hoursChart");
  if (!canvas) return;

  // Current total hours
  var teamTotal = 0;
  Object.keys(totals || {}).forEach(function (id) {
    teamTotal += totals[id] || 0;
  });
  var perPerson = teamTotal / divisor;

  // Find furthest due date
  var cards = await t.cards("id", "due");
  var maxDue = null;

  cards.forEach(function (card) {
    if (card.due) {
      var d = new Date(card.due);
      if (!isNaN(d.getTime())) {
        if (!maxDue || d > maxDue) maxDue = d;
      }
    }
  });

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!maxDue || maxDue < today) {
    maxDue = new Date(today);
    maxDue.setDate(maxDue.getDate() + 14);
  }

  // X range
  var start = new Date(today);
  start.setDate(start.getDate() - 7);

  var end = new Date(maxDue);
  end.setHours(0, 0, 0, 0);

  // Days from today to end (for the burn-down slope)
  var burnDays = Math.max(1, Math.round((end - today) / (1000 * 60 * 60 * 24)));

  var labels = [];
  var values = [];
  var cursor = new Date(start);

  while (cursor <= end) {
    var label = cursor.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
    labels.push(label);

    var remaining;
    if (cursor < today) {
      // Past: show current full load (we don't have true history of estimates)
      remaining = perPerson;
    } else {
      // Today and future: linear burn-down to 0
      var daysFromToday = Math.round((cursor - today) / (1000 * 60 * 60 * 24));
      var progress = daysFromToday / burnDays; // 0 at today → 1 at end
      remaining = Math.max(0, perPerson * (1 - progress));
    }

    values.push(Math.round(remaining * 10) / 10);
    cursor.setDate(cursor.getDate() + 1);
  }

  if (window._hoursChart) {
    window._hoursChart.destroy();
  }

  window._hoursChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Est. hours / person",
        data: values,
        borderColor: "#0079bf",
        backgroundColor: "rgba(0, 121, 191, 0.12)",
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 4, bottom: 4, left: 2, right: 2 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ctx.parsed.y + "h / person";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 10 },
            maxTicksLimit: 5,
            callback: function (v) {
              return v + "h";
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 40,
            minRotation: 30,
            font: { size: 9 },
            maxTicksLimit: 8,
            autoSkip: true
          }
        }
      }
    }
  });
}
