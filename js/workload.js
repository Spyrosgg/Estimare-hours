/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

t.render(function () {
  // Get all cards on the board + their shared data
  return t.cards("id", "name", "idMembers").then(function (cards) {
    // For each card, fetch the memberHours data
    var promises = cards.map(function (card) {
      return t.get(card.id, "shared", "memberHours").then(function (memberHours) {
        return {
          card: card,
          memberHours: memberHours || {}
        };
      });
    });

    return Promise.all(promises);
  }).then(function (cardData) {
    // Aggregate hours per member across the board
    var totals = {}; // memberId -> total hours

    cardData.forEach(function (item) {
      var mh = item.memberHours;
      Object.keys(mh).forEach(function (memberId) {
        var hours = parseFloat(mh[memberId]);
        if (!isNaN(hours)) {
          totals[memberId] = (totals[memberId] || 0) + hours;
        }
      });
    });

    var container = document.getElementById("workload-list");
    container.innerHTML = "";

    var memberIds = Object.keys(totals);

    if (memberIds.length === 0) {
      container.innerHTML = '<p class="empty-state">No hour estimates set on any cards yet.</p>';
      return;
    }

    // We need member names. Fetch board members.
    return t.board("members").then(function (board) {
      var membersMap = {};
      (board.members || []).forEach(function (m) {
        membersMap[m.id] = m;
      });

      // Sort by total hours descending
      memberIds.sort(function (a, b) {
        return totals[b] - totals[a];
      });

      memberIds.forEach(function (id) {
        var member = membersMap[id];
        var name = member ? (member.fullName || member.username) : "Unknown member";

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
    });
  });
});
