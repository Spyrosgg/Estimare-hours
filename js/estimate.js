/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

// Load card members and existing estimates
t.render(function () {
  return Promise.all([
    t.card("members"),
    t.get("card", "shared", "memberHours")
  ]).then(function (results) {
    var members = results[0].members || [];
    var memberHours = results[1] || {};

    var container = document.getElementById("members-list");
    container.innerHTML = "";

    if (members.length === 0) {
      container.innerHTML = '<p class="empty-state">No members assigned to this card.<br>Add members first, then set hours.</p>';
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
  var memberHours = {};

  inputs.forEach(function (input) {
    var val = parseFloat(input.value);
    if (!isNaN(val) && val >= 0) {
      memberHours[input.dataset.memberId] = val;
    }
  });

  t.set("card", "shared", "memberHours", memberHours)
    .then(function () {
      return t.closePopup();
    });
});
