const config = require('../config');

function getPlaybackIdMap() {
  return {
    anti_tobacco: config.mux.antiTobaccoPlaybackId,
    quick_lever:  config.mux.quickLeverPlaybackId,
    alpha:        config.mux.alphaPlaybackId,
  };
}

function getMuxPlaybackId(procedureType) {
  const map = getPlaybackIdMap();

  if (!(procedureType in map)) {
    throw new Error('Неизвестный тип процедуры: ' + procedureType);
  }

  const playbackId = map[procedureType];
  if (!playbackId) {
    throw new Error('MUX playbackId не задан для процедуры: ' + procedureType);
  }

  return playbackId;
}

module.exports = { getMuxPlaybackId };
