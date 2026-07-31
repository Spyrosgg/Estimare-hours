/* global TrelloPowerUp, $ */

TrelloPowerUp.initialize({
  // ===================== CARD DETAILS =====================
  'card-details': function (t, options) {
    return t.get('card', 'idMembers')
      .then(memberIds => {
        // Get all board members (to show names)
        return Promise.all([
          t.get('board', 'members'),
          t.get('pluginData', 'effort')  // stored per card
        ]).then(([members, storedEffort]) => {
          const memberMap = members.reduce((acc, m) => {
            acc[m.id] = m.fullName;
            return acc;
          }, {});

          // Build a form with inputs for each assigned member
          let formHtml = '<form id="effortForm"><ul style="list-style:none;padding:0;">';
          memberIds.forEach(memberId => {
            const name = memberMap[memberId] || memberId;
            const value = (storedEffort && storedEffort[memberId]) ? storedEffort[memberId] : 0;
            formHtml += `
              <li style="margin-bottom:8px;">
                <label>${name}</label>
                <input type="number" name="${memberId}" value="${value}" min="0" max="100" step="1" style="width:60px;">
                <span>%</span>
              </li>
            `;
          });
          formHtml += '</ul><button type="submit">Save</button></form>';

          // Return the HTML to be rendered in the card back
          return t.render(() => {
            document.getElementById('card-details').innerHTML = formHtml;

            // Handle save
            document.getElementById('effortForm').addEventListener('submit', function (e) {
              e.preventDefault();
              const formData = new FormData(this);
              const effortData = {};
              for (let [key, value] of formData.entries()) {
                effortData[key] = parseInt(value, 10) || 0;
              }
              t.set('pluginData', 'effort', effortData)
                .then(() => {
                  // Show a success message (optional)
                  alert('Effort saved!');
                });
            });
          });
        });
      });
  },

  // ===================== BOARD BUTTON =====================
  'board-buttons': function (t) {
    return [{
      icon: 'https://your-domain.com/icon.png', // or a FontAwesome icon
      text: 'Team Effort Report',
      callback: function (t) {
        return t.popup({
          title: 'Effort Over Time',
          url: 'report.html',
          height: 500,
        });
      }
    }];
  }
});
