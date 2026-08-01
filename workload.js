/* global TrelloPowerUp, Chart */

var t = TrelloPowerUp.iframe();

t.render(async function () {
  var container = document.getElementById("workload-list");
  container.innerHTML = '<p class="empty-state">Loading…</p>';

  try {
    var data = await t.get("board", "shared", "hoursData");
    var totals = (data && data.totals) ? data.totals : {};
    var byCard = (data && data.byCard) ? data.byCard : {};

    var board = await t.board("members");
    var members = board.members || [];
    var membersMap = {};
    members.forEach(function (m) {
      membersMap[m.id] = m;
    });

    var memberCount = members.length;
    var divisor = Math.max(1, memberCount - 1); // members − 1
    var weeklyCapacity = divisor * 37.5;        // (members−1) × 37.5h

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

      // Show capacity info
      var info = document.createElement("p");
      info.className = "note";
      info.style.marginBottom = "10px";
      info.innerHTML =
        "Board members: <strong>" + memberCount + "</strong> → " +
        "capacity = (" + memberCount + "−1)×37.5 = <strong>" + weeklyCapacity + "h / week</strong>";
      container.appendChild(info);

      // 2-column grid for members
      var grid = document.createElement("div");
      grid.className = "members-grid";

      memberIds.forEach(function (id) {
        var member = membersMap[id];
        var name = member
          ? (member.fullName || member.username)
          : "Unknown member";

        var hours = Math.round(totals[id] * 10) / 10;
        var util = Math.round((totals[id] / 37.5) * 100); // (hours / 37.5) * 100, whole %

        var row = document.createElement("div");
        row.className = "workload-row";

        var nameEl = document.createElement("span");
        nameEl.className = "workload-name";
        nameEl.textContent = name;

        var hoursEl = document.createElement("span");
        hoursEl.className = "workload-hours";
        hoursEl.textContent = hours + "h (" + util + "%)";

        row.appendChild(nameEl);
        row.appendChild(hoursEl);
        grid.appendChild(row);
      });

      container.appendChild(grid);
    }

    await renderUtilisationChart(byCard, weeklyCapacity, memberCount);
    return t.sizeTo(document.body);
  } catch (err) {
    console.error("Workload error:", err);
    container.innerHTML =
      '<p class="empty-state">Error loading workload.<br>Open the browser console (F12) for details.</p>';
    return t.sizeTo(document.body);
  }
});

/**
 * Utilisation chart
 * -----------------
 * Hours on a card = weekly hours (NOT total to spread).
 * If a card overlaps a week, its FULL hours are added to that week.
 *
 * Utilisation % = weekHours / ((members − 1) × 37.5) × 100
 *
 * Only cards with estimates are counted.
 * No due date → 14-day window starting today.
 * Red line = today.
 */
async function renderUtilisationChart(byCard, weeklyCapacity, memberCount) {
  var canvas = document.getElementById("hoursChart");
  if (!canvas) return;

  var cards = await t.cards("id", "due", "start");
  var cardMap = {};
  cards.forEach(function (c) {
    cardMap[c.id] = c;
  });

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 7);

  var rangeEnd = new Date(today);
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  // Collect cards that have estimates
  var cardWindows = []; // { weeklyHours, start, end }

  Object.keys(byCard || {}).forEach(function (cardId) {
    var mh = byCard[cardId];
    if (!mh || typeof mh !== "object") return;

    var cardHours = 0;
    Object.keys(mh).forEach(function (mid) {
      var h = parseFloat(mh[mid]);
      if (!isNaN(h) && h > 0) cardHours += h;
    });
    if (cardHours <= 0) return;

    var card = cardMap[cardId];
    var start = null;
    var end = null;

    if (card && card.start) {
      start = new Date(card.start);
      start.setHours(0, 0, 0, 0);
    }
    if (card && card.due) {
      end = new Date(card.due);
      end.setHours(0, 0, 0, 0);
    }

    // Defaults
    if (!start && !end) {
      start = new Date(today);
      end = new Date(today);
      end.setDate(end.getDate() + 14);
    } else if (!start) {
      end = end || new Date(today);
      start = new Date(end);
      start.setDate(start.getDate() - 14);
    } else if (!end) {
      end = new Date(start);
      end.setDate(end.getDate() + 14);
    }

    if (start < rangeStart) rangeStart = new Date(start);
    if (end > rangeEnd) rangeEnd = new Date(end);

    cardWindows.push({ weeklyHours: cardHours, start: start, end: end });
  });

  var minStart = new Date(today);
  minStart.setDate(minStart.getDate() - 7);
  if (rangeStart > minStart) rangeStart = minStart;

  // Build weekly buckets (Monday-aligned)
  function startOfWeek(d) {
    var day = d.getDay();
    var diff = (day === 0 ? -6 : 1) - day;
    var monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  var weekStart = startOfWeek(rangeStart);
  var weeks = [];

  var cursor = new Date(weekStart);
  while (cursor <= rangeEnd) {
    var weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);

    var label;
    if (cursor.getDate() <= 7 || weeks.length === 0) {
      label = cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    } else {
      label = cursor.getDate().toString();
    }

    weeks.push({
      start: new Date(cursor),
      end: weekEnd,
      label: label,
      hours: 0
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  // KEY CHANGE: add the card's FULL weekly hours to every overlapping week
  cardWindows.forEach(function (win) {
    weeks.forEach(function (w) {
      if (win.end >= w.start && win.start <= w.end) {
        w.hours += win.weeklyHours;
      }
    });
  });

  // Convert to utilisation %
  var labels = weeks.map(function (w) { return w.label; });
  var utilisation = weeks.map(function (w) {
    if (weeklyCapacity <= 0) return 0;
    return Math.round((w.hours / weeklyCapacity) * 1000) / 10;
  });

  // Find the week that contains today
  var todayWeekIndex = -1;
  weeks.forEach(function (w, idx) {
    if (today >= w.start && today <= w.end) {
      todayWeekIndex = idx;
    }
  });

  if (window._hoursChart) {
    window._hoursChart.destroy();
  }

  var todayLinePlugin = {
    id: "todayLine",
    afterDraw: function (chart) {
      if (todayWeekIndex < 0) return;
      var meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || !meta.data[todayWeekIndex]) return;

      var x = meta.data[todayWeekIndex].x;
      var ctx = chart.ctx;
      var yAxis = chart.scales.y;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, yAxis.top);
      ctx.lineTo(x, yAxis.bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e74c3c";
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "#e74c3c";
      ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Today", x, yAxis.top - 2);
      ctx.restore();
    }
  };

  var maxUtil = Math.max.apply(null, utilisation.concat([0]));
  var yMax = Math.max(100, Math.ceil(maxUtil / 20) * 20);

  window._hoursChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Utilisation %",
        data: utilisation,
        borderColor: "#0079bf",
        backgroundColor: "rgba(0, 121, 191, 0.12)",
        fill: true,
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 14, bottom: 4, left: 2, right: 2 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              var weekHours = weeks[ctx.dataIndex] ? weeks[ctx.dataIndex].hours : 0;
              return [
                ctx.parsed.y + "% utilisation",
                Math.round(weekHours * 10) / 10 + "h / " + weeklyCapacity + "h capacity"
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: yMax,
          ticks: {
            font: { size: 10 },
            maxTicksLimit: 6,
            callback: function (v) {
              return v + "%";
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 40,
            minRotation: 0,
            font: { size: 9 },
            autoSkip: true,
            maxTicksLimit: 10
          }
        }
      }
    },
    plugins: [todayLinePlugin]
  });
}
