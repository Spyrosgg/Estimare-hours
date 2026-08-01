/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

// Load card members and existing estimates
t.render(function () {
  return Promise.all([
    t.card("id", "members"),
    t.get("card", "shared", "memberHours")
  ]).then(function (results) {
    var card = results[0];
    var members = card.members || [];
    var memberHours = results[1] || {};

    window._currentCardId = card.id;

    var container = document.getElementById("members-list");
    container.innerHTML = "";

    if (members.length === 0) {
      container.innerHTML =
        '<p class="empty-state">No members assigned to this card.<br>Add members first, then set hours.</p>';
      document.getElementById("save-btn").style.display = "none";
      return;
    }

    members.forEach(function (member) {
      var row = document.createElement("div");
      row.className = "member-row";

      var info = document.createElement("div");
      info.className = "member-info";

      var avatar = document.createElement("div");
      avatar.className = "avatar";

      if (member.avatarUrl) {
        var img = document.createElement("img");
        img.src = member.avatarUrl + "/30.png";
        img.alt = member.fullName;
        avatar.appendChild(img);
      } else {
        avatar.textContent = (member.initials || member.fullName.charAt(0)).toUpperCase();
      }

      var name = document.createElement("span");
      name.className = "member-name";
      name.textContent = member.fullName || member.username;

      info.appendChild(avatar);
      info.appendChild(name);

      var input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "0.5";
      input.className = "hours-input";
      input.placeholder = "0";
      input.dataset.memberId = member.id;
      input.value = memberHours[member.id] != null ? memberHours[member.id] : "";

      row.appendChild(info);
      row.appendChild(input);
      container.appendChild(row);
    });
  });
});

// Save button handler
document.getElementById("save-btn").addEventListener("click", function () {
  var inputs = document.querySelectorAll(".hours-input");
  var newMemberHours = {};

  inputs.forEach(function (input) {
    var val = parseFloat(input.value);
    if (!isNaN(val) && val >= 0) {
      newMemberHours[input.dataset.memberId] = val;
    }
  });

  t.set("card", "shared", "memberHours", newMemberHours)
    .then(function () {
      return updateBoardSummaryForThisCard(newMemberHours);
    })
    .then(function () {
      return t.closePopup();
    })
    .catch(function (err) {
      console.error("Save failed:", err);
      alert("Could not save estimates. Check the console.");
    });
});

/**
 * Board data structure:
 * {
 *   totals: { memberId: number },
 *   byCard: { cardId: { memberId: number } },
 *   history: [ { ts: ISO-string, total: number }, ... ]   // last ~30 snapshots
 * }
 */
function updateBoardSummaryForThisCard(newMemberHours) {
  var cardId = window._currentCardId;

  return t.get("board", "shared", "hoursData").then(function (data) {
    data = data || { totals: {}, byCard: {}, history: [] };

    // Remove old contribution of this card
    var oldHours = data.byCard[cardId] || {};
    Object.keys(oldHours).forEach(function (memberId) {
      data.totals[memberId] = (data.totals[memberId] || 0) - oldHours[memberId];
      if (data.totals[memberId] <= 0) delete data.totals[memberId];
    });

    // Add new contribution
    data.byCard[cardId] = newMemberHours;
    Object.keys(newMemberHours).forEach(function (memberId) {
      data.totals[memberId] = (data.totals[memberId] || 0) + newMemberHours[memberId];
    });

    // Clean zeros
    Object.keys(data.totals).forEach(function (id) {
      if (data.totals[id] <= 0) delete data.totals[id];
    });

    // Calculate current team total
    var teamTotal = 0;
    Object.keys(data.totals).forEach(function (id) {
      teamTotal += data.totals[id];
    });

    // Append a history snapshot (keep last 30 to stay under size limit)
    data.history = data.history || [];
    data.history.push({
      ts: new Date().toISOString(),
      total: Math.round(teamTotal * 10) / 10
    });
    if (data.history.length > 30) {
      data.history = data.history.slice(-30);
    }

    return t.set("board", "shared", "hoursData", data);
  });
}
