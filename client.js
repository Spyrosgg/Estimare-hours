/* global TrelloPowerUp */

/**
 * Estimate Hours Power-Up
 * Per-member hour estimates on Trello cards + simple workload view.
 */

var HOURS_ICON = "https://cdn.glitch.com/1b42d7fe-bda8-4af8-a6c8-eff0cea9e08a%2Frocket-ship.png?1494946700421";

TrelloPowerUp.initialize({
  // Button on the back of every card
  "card-buttons": function (t, options) {
    return [
      {
        icon: HOURS_ICON,
        text: "Set Hours",
        callback: function (t) {
          return t.popup({
            title: "Hour Estimates",
            url: "estimate.html",
            height: 320
          });
        }
      }
    ];
  },

  // Badges shown on the front of cards
"card-badges": function (t, options) {
  return Promise.all([
    t.get("card", "shared", "memberHours"),
    t.card("members")
  ]).then(function (results) {

    var memberHours = results[0];
    var card = results[1];

    if (!memberHours || Object.keys(memberHours).length === 0) {
      return [];
    }

    var members = {};
    (card.members || []).forEach(function (m) {
      members[m.id] = m.fullName || m.username;
    });

    var badges = [];
    var total = 0;

    Object.keys(memberHours).forEach(function (id) {
      var hours = parseFloat(memberHours[id]);
      if (isNaN(hours) || hours <= 0) return;

      total += hours;

      var name = members[id] || "Unknown";
      var firstName = name.split(" ")[0];

      badges.push({
        text: firstName + ": " + hours + "h",
        color: "green"
      });
    });

    badges.push({
      text: "Total: " + total + "h",
      color: "blue"
    });

    return badges;
  });
},

  // Detail badges at the top of the card back
  "card-detail-badges": function (t, options) {
    return t.get("card", "shared", "memberHours").then(function (memberHours) {
      if (!memberHours || Object.keys(memberHours).length === 0) {
        return [
          {
            title: "Hours",
            text: "Not set",
            color: "red",
            callback: function (t) {
              return t.popup({
                title: "Hour Estimates",
                url: "estimate.html",
                height: 320
              });
            }
          }
        ];
      }

      var total = 0;
      Object.keys(memberHours).forEach(function (id) {
        var val = parseFloat(memberHours[id]);
        if (!isNaN(val)) total += val;
      });

      return [
        {
          title: "Hours",
          text: total + "h total",
          color: "blue",
          callback: function (t) {
            return t.popup({
              title: "Hour Estimates",
              url: "estimate.html",
              height: 320
            });
          }
        }
      ];
    });
  },

  // Board button for team workload overview — use modal for more width
  "board-buttons": function (t, options) {
    return [
      {
        icon: {
          dark: 'https://spyrosgg.github.io/Estimare-hours/cellar.svg',
          light: 'https://spyrosgg.github.io/Estimare-hours/cellar.svg'
        },
        text: "Workload",
        callback: function (t) {
          return t.modal({
            title: "Team Workload (Hours)",
            url: "workload.html",
            fullscreen: false,
            height: 600
          });
        }
      }
    ];
  }
});
