/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

t.render(async function () {
  var container = document.getElementById("workload-list");
  container.innerHTML = '<p class="empty-state">Loading…</p>';

  try {
    // 1. Get all cards on the board
    var cards = await t.cards("id", "name", "idMembers");

    if (!cards || cards.length === 0) {
      container.innerHTML = '<p class="empty-state">No cards on this board.</p>';
      return t.sizeTo("#workload-list");
    }

    // 2. Fetch memberHours for every card in parallel
    //    Using the card ID as scope is officially supported.
    var results = await Promise.all(
      cards.map(async function (card) {
        try {
          var memberHours = await t.get(card.id, "shared", "memberHours");
          return { card: card, memberHours: memberHours || {} };
        } catch (err) {
          console.warn("Could not read data for card", card.id, err);
          return { card: card, memberHours: {} };
        }
      })
    );

    // 3. Aggregate hours per member
    var totals = {}; // memberId → total hours

    results.forEach(function (item) {
      var mh = item.memberHours;
      if (!mh || typeof mh !== "object") return;

      Object.keys(mh).forEach(function (memberId) {
        var hours = parseFloat(mh[memberId]);
        if (!isNaN(hours) && hours > 0) {
          totals[memberId] = (totals[memberId] || 0) + hours;
        }
      });
    });

    var memberIds = Object.keys(totals);

    if (memberIds.length === 0) {
      container.innerHTML =
        '<p class="empty-state">No hour estimates found on any cards yet.<br><br>' +
        "Open a card, click <strong>Set Hours</strong>, save some values, then try again.</p>";
      return t.sizeTo("#workload-list");
    }

    // 4. Get board members so we can show names
    var board = await t.board("members");
    var membersMap = {};
    (board.members || []).forEach(function (m) {
      membersMap[m.id] = m;
    });

    // Sort highest hours first
    memberIds.sort(function (a, b) {
      return totals[b] - totals[a];
    });

    // 5. Render
    container.innerHTML = "";

    memberIds.forEach(function (id) {
      var member = membersMap[id];
      var name = member
        ? member.fullName || member.username || "Unknown"
        : "Unknown member (" + id.slice(0, 6) + "…)";

      var row = document.createElement("div");
      row.className = "workload-row";

      var nameEl = document.createElement("span");
      nameEl.className = "workload-name";
      nameEl.textContent = name;

      var hoursEl = document.createElement("span");
      hoursEl.className = "workload-hours";
      hoursEl.textContent = totals[id] + "h";

      row.appendChild(nameEl);
      row.appendChild(hoursEl);
      container.appendChild(row);
    });

    // Make the popup size itself correctly
    return t.sizeTo("#workload-list");
  } catch (err) {
    console.error("Workload error:", err);
    container.innerHTML =
      '<p class="empty-state">Something went wrong loading workload.<br>Check the browser console for details.</p>';
    return t.sizeTo("#workload-list");
  }
});
