
mergeInto(LibraryManager.library, {

  flush_active_agents_callback: function(data) {
    postMessage({
      type: 'activeAgents',
      data: agentPoolBuffer,
      funcName: 'crowdUpdate'
    });
  },

  agentPool_clear: function (idx) {
    agentPoolBuffer.length = 0;
  },

  agentPool_add: function (idx) {
    agentPool.add(agentPoolBuffer[idx]);
  },

  agentPool_get: function (idx, position_x, position_y, position_z, velocity_x, velocity_y, velocity_z, radius, active, state, neighbors) {
    agentPoolBuffer.push(agentPool.get(idx, position_x, position_y, position_z, velocity_x, velocity_y, velocity_z, radius, active, state, neighbors));
  }

});
