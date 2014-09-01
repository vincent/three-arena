module.exports = {
  identifier: 'idle',
  strategy: 'sequential',
  children: [
    { identifier: 'depositToNearestCollector' },
    { identifier: 'findNearestCollector' },
    { identifier: 'collect' },
    { identifier: 'findNearestCollectible' },
  ]
};
