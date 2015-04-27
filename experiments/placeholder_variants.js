module.exports = {
  name: 'new todo placeholder variants',
  startDate: '2015-04-26',
  independentVariables: ['placeholder'],
  eligibilityFunction: function (subject) {
    return true
  },
  groupingFunction: function (subject) {
    return {
      placeholder: this.uniformChoice(
        [
          "new item",
          "get this done",
          "relax"
        ],
        Math.random()
      )
    }
  },
  watch: ['addClicked']
}
