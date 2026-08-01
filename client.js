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
    return t.get("card", "shared", "memberHours").then(function (memberHours) {
      if (!memberHours || Object.keys(memberHours).length === 0) {
        return [];
      }

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
          dark: 'https://spyrosgg.github.io/Estimare-hours/stats-report.svg',
          light: '<?xml version="1.0" encoding="UTF-8"?><svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#ffffff"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.6 2.25C2.85442 2.25 2.25 2.85441 2.25 3.6V20.4C2.25 21.1456 2.85441 21.75 3.6 21.75H20.4C21.1456 21.75 21.75 21.1456 21.75 20.4V3.6C21.75 2.85442 21.1456 2.25 20.4 2.25H3.6ZM16.75 8C16.75 7.58579 16.4142 7.25 16 7.25C15.5858 7.25 15.25 7.58579 15.25 8V16C15.25 16.4142 15.5858 16.75 16 16.75C16.4142 16.75 16.75 16.4142 16.75 16V8ZM12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V16C12.75 16.4142 12.4142 16.75 12 16.75C11.5858 16.75 11.25 16.4142 11.25 16V11C11.25 10.5858 11.5858 10.25 12 10.25ZM8.75 13C8.75 12.5858 8.41421 12.25 8 12.25C7.58579 12.25 7.25 12.5858 7.25 13V16C7.25 16.4142 7.58579 16.75 8 16.75C8.41421 16.75 8.75 16.4142 8.75 16V13Z" fill="#ffffff"></path></svg>'
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
