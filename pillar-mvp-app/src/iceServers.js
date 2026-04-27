// TURN credentials from Metered.ca (pillar.metered.live)
const TURN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'turn:global.relay.metered.ca:80',               username: 'a0c76e3c9b57582fb27ca823', credential: 'BnMzjLsNTjm6GT5u' },
    { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'a0c76e3c9b57582fb27ca823', credential: 'BnMzjLsNTjm6GT5u' },
    { urls: 'turn:global.relay.metered.ca:443',              username: 'a0c76e3c9b57582fb27ca823', credential: 'BnMzjLsNTjm6GT5u' },
    { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'a0c76e3c9b57582fb27ca823', credential: 'BnMzjLsNTjm6GT5u' },
  ],
  iceCandidatePoolSize: 10,
};

export async function getIceServers() {
  return TURN_SERVERS;
}
