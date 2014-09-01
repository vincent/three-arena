module.exports = {
  identifier: 'idle',
  strategy: 'prioritised',
  children: [
    { identifier: 'moveAttackToObjective' },
    { identifier: 'plotCourseToObjective' },
  ]
};
