/* global TrelloPowerUp */

/**
 * Estimate Hours Power-Up
 * Per-member hour estimates on Trello cards + workload view.
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


  // Card badges shown on the front of cards
  // Shows member initials + hours + team relative effort
  "card-badges": async function (t, options) {

    var memberHours = await t.get(
      "card",
      "shared",
      "memberHours"
    );

    if (!memberHours || Object.keys(memberHours).length === 0) {
      return [];
    }


    var card = await t.card("members");

    var badges = [];
    var total = 0;


    // Individual member hours
    (card.members || []).forEach(function (member) {

      var hours = parseFloat(memberHours[member.id]);

      if (isNaN(hours) || hours <= 0) {
        return;
      }


      total += hours;


      badges.push({
        text: member.initials + " " + hours + "h",
        color: "green"
      });

    });



    // Team relative effort calculation
    var board = await t.board("members");

    var memberCount = (board.members || []).length;

    // Capacity = (board members - 1) x 37.5h
    var teamCapacity =
      Math.max(1, memberCount - 1) * 37.5;


    var effort =
      Math.round((total / teamCapacity) * 100);



    badges.push({
      text: effort + "% effort",
      color: effort > 100 ? "red" : "blue"
    });


    return badges;

  },



  // Detail badge on card back
  "card-detail-badges": function (t, options) {

    return t.get(
      "card",
      "shared",
      "memberHours"
    ).then(function (memberHours) {


      if (!memberHours ||
          Object.keys(memberHours).length === 0) {

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

        if (!isNaN(val)) {
          total += val;
        }

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



  // Board workload button
  "board-buttons": function (t, options) {

    return [
      {

        icon: {
          dark: "https://spyrosgg.github.io/Estimare-hours/cellar.svg",
          light: "https://spyrosgg.github.io/Estimare-hours/cellar.svg"
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
