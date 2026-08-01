/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

t.render(async function () {
  var container = document.getElementById("workload-list");
  container.innerHTML = '<p class="empty-state">Loading…</p>';

  try {
    // Read the board-level data (always reliable)
    var data = await t.get("board", "shared", "hoursData");
    var totals = (data && data.totals) ? data.totals : {};

    if (!totals || Object.keys(totals).length === 0) {
      container.innerHTML =
        '<p class="empty-state">' +
        "No hour estimates found yet.<br><br>" +
        "1. Open a card that has members<br>" +
        "2. Click <strong>Set Hours</strong> and save some values<br>" +
        "3. Then come back here" +
        "</p>";
      return t.sizeTo(document.body);
    }

    // Get member names
    var board = await t.board("members");
    var membersMap = {};
    (board.members || []).forEach(function (m) {
      membersMap[m.id] = m;
    });

    var memberIds = Object.keys(totals).filter(function (id) {
      return totals[id] > 0;
    });

    if (memberIds.length === 0) {
      container.innerHTML = '<p class="empty-state">No positive hour estimates found.</p>';
      return t.sizeTo(document.body);
    }

    // Sort highest first
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

    return t.sizeTo(document.body);
  } catch (err) {
    console.error("Workload error:", err);
    container.innerHTML =
      '<p class="empty-state">Error loading workload.<br>Open the browser console (F12) for details.</p>';
    return t.sizeTo(document.body);
  }
});
