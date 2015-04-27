module.exports = {
  name: 'new todo placeholder variants',
  startDate: '2015-04-26',
  subjectAttributes: ['email'],
  independentVariables: ['placeholder'],
  eligibilityFunction: function (subject) {
    return this.bernoulliTrial(0.5, subject.email)
  },
  groupingFunction: function (subject) {
    return {
      placeholder: this.uniformChoice(
        [
          "new item",
          "get this done",
          "relax"
        ],
        subject.email
      )
    }
  },
  watch: ['addClicked']
}
