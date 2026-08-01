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
            url: "./estimate.html",
            height: 320
          });
        }
      }
    ];
  },

  // Badges shown on the front of cards
  "card-badges": function (t, options) {
    return t.get("card", "shared", "memberHours").then(function (memberHours) {
      if (!memberHours || Object.keys(memberHours).length === 0) {
        return [];
      }

      // Calculate total hours across all members on this card
      var total = 0;
      Object.keys(memberHours).forEach(function (id) {
        var val = parseFloat(memberHours[id]);
        if (!isNaN(val)) total += val;
      });

      if (total === 0) return [];

      return [
        {
          text: total + "h",
          color: "blue"
        }
      ];
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
                url: "./estimate.html",
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
              url: "./estimate.html",
              height: 320
            });
          }
        }
      ];
    });
  },

  // Board button for team workload overview
  "board-buttons": function (t, options) {
    return [
      {
        icon: {
          dark: HOURS_ICON,
          light: HOURS_ICON
        },
        text: "Workload",
        callback: function (t) {
          return t.popup({
            title: "Team Workload (Hours)",
            url: "./workload.html",
            height: 480
          });
        }
      }
    ];
  }
});
